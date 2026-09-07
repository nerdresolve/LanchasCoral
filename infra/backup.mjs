#!/usr/bin/env node
/*
 * Cópia de segurança do banco do Coral.
 *
 *   node infra/backup.mjs              cria uma cópia
 *   node infra/backup.mjs --listar     mostra as cópias existentes
 *   node infra/backup.mjs --verificar  confere a íntegra da última
 *
 * O que faz:
 *  - `pg_dump` no formato custom (-Fc), que já vem comprimido e permite
 *    restaurar tabelas isoladas;
 *  - grava em infra/backups/ com data e hora no nome;
 *  - confere que o arquivo gerado é legível ANTES de apagar os antigos —
 *    um backup que ninguém testou não é backup;
 *  - aplica a retenção: diários por 14 dias, e o primeiro de cada mês para
 *    sempre. Assim um estrago percebido tarde ainda tem de onde voltar.
 *
 * A restauração está descrita em infra/README-backup.md.
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, readdir, stat, unlink, readFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const execFileAsync = promisify(execFile)

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const PASTA = path.join(AQUI, 'backups')
const CONTEINER = 'coral-db'
const BANCO = 'coral'
const USUARIO = 'coral'

/** Dias que uma cópia diária é mantida. As mensais nunca são apagadas. */
const DIAS_DE_RETENCAO = 14

/* A senha vem do mesmo lugar que o compose usa, para não haver duas verdades. */
async function senhaDoBanco() {
  if (process.env.POSTGRES_PASSWORD) return process.env.POSTGRES_PASSWORD
  const env = path.join(AQUI, '..', '.env')
  if (existsSync(env)) {
    const linha = (await readFile(env, 'utf8'))
      .split('\n')
      .find((l) => l.startsWith('POSTGRES_PASSWORD='))
    if (linha) return linha.slice('POSTGRES_PASSWORD='.length).trim().replace(/^["']|["']$/g, '')
  }
  /* Sem valor embutido: a senha do banco no histórico do Git seria
     permanente. Quem roda o backup define POSTGRES_PASSWORD ou mantém a
     linha no .env, que não é versionado. */
  throw new Error(
    'POSTGRES_PASSWORD não definida: informe no ambiente ou no arquivo .env.',
  )
}

const doisDigitos = (n) => String(n).padStart(2, '0')

function carimbo(d = new Date()) {
  return (
    `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}` +
    `_${doisDigitos(d.getHours())}${doisDigitos(d.getMinutes())}`
  )
}

const tamanho = (bytes) =>
  bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} kB`

/** O contêiner do banco precisa estar de pé. */
async function conferirConteiner() {
  try {
    const { stdout } = await execFileAsync('docker', [
      'inspect', '--format', '{{.State.Running}}', CONTEINER,
    ])
    if (stdout.trim() !== 'true') throw new Error()
  } catch {
    console.error(`O contêiner ${CONTEINER} não está no ar. Suba a pilha antes:`)
    console.error('  docker compose -f infra/docker-compose.yml up -d')
    process.exit(1)
  }
}

async function listar() {
  if (!existsSync(PASTA)) return []
  const nomes = (await readdir(PASTA)).filter((n) => n.startsWith('coral_') && n.endsWith('.dump'))
  const itens = await Promise.all(
    nomes.map(async (nome) => {
      const completo = path.join(PASTA, nome)
      const s = await stat(completo)
      return { nome, completo, bytes: s.size, quando: s.mtime }
    }),
  )
  return itens.sort((a, b) => b.quando - a.quando)
}

/**
 * Confere que o arquivo é um dump legível.
 *
 * `pg_restore --list` lê o índice interno do arquivo. Se estiver truncado ou
 * corrompido, falha aqui — antes de a rotina apagar cópias antigas confiando
 * numa nova que não presta.
 */
async function verificar(arquivo) {
  const nome = path.basename(arquivo)
  await execFileAsync('docker', ['cp', arquivo, `${CONTEINER}:/tmp/${nome}`])
  try {
    const { stdout } = await execFileAsync('docker', [
      'exec', CONTEINER, 'pg_restore', '--list', `/tmp/${nome}`,
    ])
    const tabelas = (stdout.match(/TABLE DATA/g) ?? []).length
    if (tabelas === 0) throw new Error('o dump não contém dados de tabela')
    return tabelas
  } finally {
    await execFileAsync('docker', ['exec', CONTEINER, 'rm', '-f', `/tmp/${nome}`]).catch(() => {})
  }
}

/**
 * Decide o que apagar, sem apagar nada.
 *
 * Separado do efeito colateral de propósito: assim a regra — que só erra
 * meses depois, quando já é tarde — pode ser testada com datas simuladas, sem
 * criar arquivo nenhum. Ver `apps/frontend/test/retencao.test.ts`.
 *
 * @param copias lista de `{ nome, quando }`
 * @param agora  instante de referência, em milissegundos
 * @param dias   janela das cópias diárias
 * @returns os nomes que devem ser apagados
 */
export function decidirRetencao(copias, agora = Date.now(), dias = DIAS_DE_RETENCAO) {
  const limite = agora - dias * 864e5

  /* A primeira cópia de cada mês é promovida a mensal e nunca é apagada.
     Percorre da mais antiga para a mais nova, então a primeira que aparece
     de cada mês é a que fica. */
  const guardar = new Set()
  const mesesVistos = new Set()
  for (const c of [...copias].sort((a, b) => a.quando - b.quando)) {
    const mes = `${c.quando.getFullYear()}-${c.quando.getMonth()}`
    if (!mesesVistos.has(mes)) {
      mesesVistos.add(mes)
      guardar.add(c.nome)
    }
  }

  return copias
    .filter((c) => !guardar.has(c.nome) && c.quando.getTime() < limite)
    .map((c) => c.nome)
}

/** Apaga as diárias vencidas, preservando a primeira cópia de cada mês. */
async function aplicarRetencao() {
  const copias = await listar()
  const apagar = new Set(decidirRetencao(copias))

  let apagadas = 0
  for (const c of copias) {
    if (!apagar.has(c.nome)) continue
    await unlink(c.completo)
    apagadas++
  }
  return apagadas
}

async function criar() {
  await conferirConteiner()
  await mkdir(PASTA, { recursive: true })

  const nome = `coral_${carimbo()}.dump`
  const destino = path.join(PASTA, nome)

  console.log(`Gerando ${nome}…`)
  // O dump é escrito dentro do contêiner e depois copiado: assim não depende
  // de o cliente pg_dump existir no host, nem da codificação do shell ao
  // redirecionar um binário para o disco.
  const senha = await senhaDoBanco()
  await execFileAsync('docker', [
    'exec', '-e', `PGPASSWORD=${senha}`, CONTEINER,
    'pg_dump', '-U', USUARIO, '-d', BANCO, '-Fc', '-f', `/tmp/${nome}`,
  ])
  await execFileAsync('docker', ['cp', `${CONTEINER}:/tmp/${nome}`, destino])
  await execFileAsync('docker', ['exec', CONTEINER, 'rm', '-f', `/tmp/${nome}`]).catch(() => {})

  const { size } = await stat(destino)
  if (size === 0) {
    await unlink(destino)
    console.error('O arquivo saiu vazio. Nada foi apagado; confira o contêiner do banco.')
    process.exit(1)
  }

  console.log(`Conferindo…`)
  let tabelas
  try {
    tabelas = await verificar(destino)
  } catch (e) {
    console.error(`A cópia não passou na conferência: ${e.message}`)
    console.error('O arquivo foi mantido para análise, e nenhuma cópia antiga foi apagada.')
    process.exit(1)
  }

  const apagadas = await aplicarRetencao()

  console.log(`\nPronto: ${nome} (${tamanho(size)}, ${tabelas} tabelas)`)
  if (apagadas) console.log(`${apagadas} cópia(s) vencida(s) removida(s).`)
  const total = await listar()
  console.log(`${total.length} cópia(s) guardada(s) em infra/backups/`)
  avisarSobreAChave()
}

/**
 * Lembra que a cópia sozinha não restaura tudo.
 *
 * A senha do SMTP fica cifrada no banco, e a chave que a abre vive só no
 * `.env`. Restaurar um dump numa máquina sem essa chave devolve o site
 * inteiro, mas com o envio de e-mail mudo — e o motivo não seria óbvio.
 */
function avisarSobreAChave() {
  const env = path.join(AQUI, '..', '.env')
  if (!existsSync(env)) return
  const temChave = readFileSync(env, 'utf8')
    .split('\n')
    .some((l) => l.startsWith('CORAL_SECRET_KEY='))
  if (!temChave) return

  console.log(
    '\nLembrete: a senha do e-mail está cifrada no banco. Guarde uma cópia de\n' +
      'CORAL_SECRET_KEY (do .env da raiz) FORA desta máquina — sem ela, restaurar\n' +
      'este backup devolve tudo menos o envio de e-mail.',
  )
}

async function mostrarLista() {
  const copias = await listar()
  if (!copias.length) {
    console.log('Nenhuma cópia ainda. Rode: node infra/backup.mjs')
    return
  }
  console.log(`${copias.length} cópia(s):\n`)
  for (const c of copias) {
    const dias = Math.floor((Date.now() - c.quando) / 864e5)
    const idade = dias === 0 ? 'hoje' : dias === 1 ? 'ontem' : `${dias} dias atrás`
    console.log(`  ${c.nome}  ${tamanho(c.bytes).padStart(9)}  ${idade}`)
  }
}

/*
 * Só executa quando chamado direto pela linha de comando.
 *
 * Sem esta guarda, importar o módulo — como faz `test/retencao.test.ts` para
 * testar `decidirRetencao` — disparava o backup inteiro, e a suíte quebrava
 * ao exigir POSTGRES_PASSWORD.
 */
const chamadoDireto =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

const arg = chamadoDireto ? process.argv[2] : null
if (!chamadoDireto) {
  // Importado por um teste ou outro script: nada a fazer.
} else if (arg === '--listar') {
  await mostrarLista()
} else if (arg === '--verificar') {
  await conferirConteiner()
  const [ultima] = await listar()
  if (!ultima) {
    console.error('Nenhuma cópia para conferir.')
    process.exit(1)
  }
  const tabelas = await verificar(ultima.completo)
  console.log(`${ultima.nome} está legível: ${tabelas} tabelas.`)
} else {
  await criar()
}
