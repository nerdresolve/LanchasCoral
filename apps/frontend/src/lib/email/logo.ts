import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Logotipo da Coral anexado ao e-mail com Content-ID.
 *
 * Vai como anexo inline (`cid:`) e não como `data:` URI porque Gmail e Outlook
 * descartam `<img src="data:">`. Uma imagem hospedada também não serve: a
 * maioria dos clientes bloqueia imagens externas por padrão, e o cabeçalho
 * chegaria vazio na primeira leitura — justamente quando a mensagem causa a
 * primeira impressão.
 *
 * É o mesmo arquivo que o site usa (`public/brand/logo-coral-mono.png`), na
 * versão monocromática branca, que assenta sobre o azul-marinho do cabeçalho.
 *
 * O arquivo é lido uma vez e guardado em memória: são 27 kB, e reler do disco
 * a cada envio não traria nada.
 */

const CAMINHO = 'public/brand/logo-coral-mono.png'

/* O identificador vive em `marcas.ts`: este módulo é `server-only` (lê do
   disco), e a casca do e-mail precisa só do `cid`, não do arquivo. */
export { CID_LOGO } from './marcas'
import { CID_LOGO } from './marcas'

let cache: Buffer | null = null

async function carregar(): Promise<Buffer | null> {
  if (cache) return cache
  try {
    cache = await readFile(path.join(process.cwd(), CAMINHO))
    return cache
  } catch {
    // Sem o arquivo, o e-mail sai com o nome em texto — ver `layout.ts`.
    return null
  }
}

/**
 * Anexo do logotipo, ou `null` quando o arquivo não está disponível.
 *
 * Devolver `null` em vez de lançar mantém o envio funcionando: um logotipo
 * ausente não pode impedir que o cliente receba o memorial que pediu.
 */
export async function anexoDoLogo() {
  const conteudo = await carregar()
  if (!conteudo) return null
  return {
    filename: 'coral.png',
    content: conteudo,
    cid: CID_LOGO,
    contentDisposition: 'inline' as const,
  }
}

/** `true` quando o logotipo pôde ser lido; decide o cabeçalho em `layout.ts`. */
export async function temLogo() {
  return (await carregar()) !== null
}
