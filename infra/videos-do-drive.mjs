/*
 * Traz os vídeos do Google Drive, comprime e prepara para o hero.
 *
 *   node infra/videos-do-drive.mjs                 # baixa, comprime, relata
 *   node infra/videos-do-drive.mjs --so-listar     # só mostra o que há lá
 *   node infra/videos-do-drive.mjs --pasta "Coral/Videos"
 *
 * Depende de `rclone` (acesso ao Drive) e `ffmpeg` (compressão), ambos já
 * instalados nesta máquina. O remote do rclone chama-se `drive` por padrão;
 * mude com CORAL_DRIVE_REMOTE se o seu tiver outro nome.
 *
 * ## Por que comprimir
 *
 * Vídeo de câmera vem com 50-200 MB, resolução de cinema e áudio. No hero
 * isso é desperdício: o elemento tem no máximo ~720px de altura, toca em
 * laço, sem som, e ninguém assiste — é textura de fundo. A compressão aqui
 * mira 2-4 MB, que é o que se pode baixar sem punir quem está no celular.
 *
 * ## O que NÃO faz
 *
 * Não associa vídeo a lancha sozinho, nem grava no banco. O casamento entre
 * arquivo e modelo é decisão de quem conhece o acervo, e se faz pelo painel:
 * o campo "Vídeo do hero" de cada modelo. Este script só deixa os arquivos
 * prontos e sugere o nome pelo qual cada um deve ser referenciado.
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, readdir, stat, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const exec = promisify(execFile)
const AQUI = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.join(AQUI, '..')
const PUBLICO = path.join(RAIZ, 'apps', 'frontend', 'public', 'videos')
const BRUTOS = path.join(RAIZ, 'infra', '_videos-brutos')

const REMOTE = process.env.CORAL_DRIVE_REMOTE ?? 'drive'
const EXTENSOES = /\.(mp4|mov|m4v|avi|mkv|webm)$/i

/* O winget instala aqui e nem sempre o PATH da sessão já pegou. */
const RCLONE = (() => {
  const link = path.join(
    process.env.LOCALAPPDATA ?? '',
    'Microsoft',
    'WinGet',
    'Links',
    'rclone.exe',
  )
  return existsSync(link) ? link : 'rclone'
})()

const mb = (bytes) => (bytes / 1048576).toFixed(1) + ' MB'

/** Nome de arquivo previsível: sem acento, espaço nem maiúscula. */
function normalizar(nome) {
  return nome
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function listarNoDrive(pasta) {
  const { stdout } = await exec(
    RCLONE,
    ['lsjson', `${REMOTE}:${pasta}`, '--files-only', '--recursive'],
    { maxBuffer: 32 * 1024 * 1024 },
  )
  return JSON.parse(stdout)
    .filter((f) => EXTENSOES.test(f.Name))
    .sort((a, b) => a.Path.localeCompare(b.Path))
}

/*
 * Compressão para fundo de hero.
 *
 * - 1280px de largura: o hero tem ~720px de altura e a tela cobre o resto;
 *   mais que isso é pixel que ninguém vê.
 * - CRF 30 com `veryslow`: arquivo pequeno sem borrar. Demora a codificar,
 *   mas roda uma vez só.
 * - `-an` remove o áudio: o vídeo toca mudo de qualquer forma, e a trilha
 *   seria peso morto.
 * - `faststart` põe o índice no começo do arquivo, então o navegador começa a
 *   tocar antes de ter baixado tudo.
 * - 10 segundos: o suficiente para o laço não ficar óbvio.
 */
async function comprimir(entrada, saida, segundos = 10) {
  await exec('ffmpeg', [
    '-y',
    '-i', entrada,
    '-t', String(segundos),
    '-vf', "scale='min(1280,iw)':-2:flags=lanczos",
    '-c:v', 'libx264',
    '-preset', 'veryslow',
    '-crf', '30',
    '-profile:v', 'high',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    saida,
  ], { maxBuffer: 32 * 1024 * 1024 })
}

async function principal() {
  const args = process.argv.slice(2)
  const soListar = args.includes('--so-listar')
  const iPasta = args.indexOf('--pasta')
  const pasta = iPasta >= 0 ? args[iPasta + 1] : (process.env.CORAL_DRIVE_PASTA ?? '')

  if (!pasta) {
    console.error(
      'Informe a pasta do Drive:\n' +
        '  node infra/videos-do-drive.mjs --pasta "Coral/Videos"\n' +
        'ou defina CORAL_DRIVE_PASTA no ambiente.',
    )
    process.exit(1)
  }

  console.log(`Lendo ${REMOTE}:${pasta} …\n`)
  let arquivos
  try {
    arquivos = await listarNoDrive(pasta)
  } catch (e) {
    console.error(
      'Não consegui ler a pasta. Confira se o rclone está configurado ' +
        `(rclone config) e se a pasta existe.\n\n${String(e.message).slice(0, 300)}`,
    )
    process.exit(1)
  }

  if (!arquivos.length) {
    console.log('Nenhum vídeo encontrado nessa pasta.')
    return
  }

  console.log(`${arquivos.length} vídeo(s):\n`)
  for (const f of arquivos) {
    console.log(`  ${f.Path.padEnd(52)} ${mb(f.Size).padStart(10)}`)
  }

  if (soListar) {
    console.log('\n(--so-listar: nada foi baixado)')
    return
  }

  await mkdir(BRUTOS, { recursive: true })
  await mkdir(PUBLICO, { recursive: true })

  console.log(`\nBaixando para ${path.relative(RAIZ, BRUTOS)} …`)
  /* `copy` e não `sync`: `sync` apagaria o que existe localmente e não está
     mais no Drive, o que é destrutivo demais para um passo automático. */
  await exec(
    RCLONE,
    ['copy', `${REMOTE}:${pasta}`, BRUTOS, '--include', '*.{mp4,mov,m4v,avi,mkv,webm,MP4,MOV,M4V,AVI,MKV,WEBM}', '--progress'],
    { maxBuffer: 64 * 1024 * 1024 },
  )

  const baixados = (await readdir(BRUTOS, { recursive: true }))
    .filter((f) => EXTENSOES.test(f))

  console.log(`\nComprimindo ${baixados.length} arquivo(s):\n`)
  const prontos = []
  for (const rel of baixados) {
    const entrada = path.join(BRUTOS, rel)
    const nome = normalizar(path.basename(rel)) + '.mp4'
    const saida = path.join(PUBLICO, nome)

    const antes = (await stat(entrada)).size
    process.stdout.write(`  ${nome.padEnd(40)} ${mb(antes).padStart(10)} → `)
    try {
      await comprimir(entrada, saida)
      const depois = (await stat(saida)).size
      console.log(`${mb(depois).padStart(10)}  (${Math.round((1 - depois / antes) * 100)}% menor)`)
      prontos.push({ nome, bytes: depois })
    } catch (e) {
      console.log(`FALHOU — ${String(e.message).slice(0, 60)}`)
      /* Saída parcial é pior que nenhuma: o navegador tentaria tocá-la. */
      if (existsSync(saida)) await unlink(saida)
    }
  }

  if (!prontos.length) {
    console.log('\nNenhum vídeo pôde ser preparado.')
    process.exit(1)
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('Prontos em apps/frontend/public/videos/.\n')
  console.log('No painel, campo "Vídeo do hero" de cada modelo, use:\n')
  for (const p of prontos) {
    const aviso = p.bytes > 5 * 1048576 ? '   <- pesado, considere encurtar' : ''
    console.log(`  /videos/${p.nome}${aviso}`)
  }
  console.log(
    '\nOs arquivos brutos ficaram em infra/_videos-brutos (fora do Git).\n' +
      'Pode apagar essa pasta depois de conferir o resultado.',
  )
}

/* Só executa quando chamado direto: importar não deve disparar download. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await principal()
}

export { normalizar, comprimir }
