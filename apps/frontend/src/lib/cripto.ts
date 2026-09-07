import 'server-only'
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto'

/**
 * Cifragem de segredos guardados no banco.
 *
 * A senha do SMTP fica numa tabela do Postgres para o painel poder editá-la,
 * e essa tabela entra nas cópias de segurança. Guardá-la em texto puro faria
 * de todo backup uma cópia da senha da caixa de e-mail — qualquer um com o
 * arquivo mandaria e-mail em nome da Coral.
 *
 * Aqui ela é cifrada com AES-256-GCM, e a chave vive só em variável de
 * ambiente. Um dump vazado não abre nada sem ela.
 *
 * GCM e não CBC porque o GCM autentica: se alguém adulterar o texto cifrado
 * no banco, a decifragem falha em vez de devolver lixo silenciosamente.
 *
 * Formato guardado: `v1.<iv>.<tag>.<cifrado>`, tudo em base64url. O prefixo
 * de versão permite trocar o algoritmo mais tarde sem quebrar o que já existe.
 */

const VERSAO = 'v1'

/**
 * Deriva a chave de 32 bytes a partir da variável de ambiente.
 *
 * SHA-256 sobre o valor bruto: aceita uma chave de qualquer comprimento sem
 * exigir que o operador gere exatamente 32 bytes. Não é derivação de senha
 * (não há KDF lento aqui) porque a entrada não é uma senha humana — é um
 * segredo aleatório gerado por `openssl rand`, sem entropia baixa a proteger.
 */
function chave(): Buffer {
  const bruta = process.env.CORAL_SECRET_KEY
  if (!bruta || bruta.length < 32) {
    throw new Error(
      'CORAL_SECRET_KEY ausente ou curta demais (mínimo 32 caracteres). ' +
        'Gere uma com: openssl rand -base64 48',
    )
  }
  return createHash('sha256').update(bruta).digest()
}

/** `true` quando há chave suficiente para cifrar e decifrar. */
export function criptoConfigurado() {
  const bruta = process.env.CORAL_SECRET_KEY
  return Boolean(bruta && bruta.length >= 32)
}

export function cifrar(texto: string): string {
  // IV novo a cada cifragem: reusar IV em GCM quebra a segurança do modo.
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', chave(), iv)
  const cifrado = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [VERSAO, iv.toString('base64url'), tag.toString('base64url'), cifrado.toString('base64url')].join('.')
}

export function decifrar(guardado: string): string {
  const partes = guardado.split('.')
  if (partes.length !== 4 || partes[0] !== VERSAO) {
    throw new Error('Segredo em formato desconhecido.')
  }
  const [, iv, tag, cifrado] = partes

  const decipher = createDecipheriv('aes-256-gcm', chave(), Buffer.from(iv!, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag!, 'base64url'))

  return Buffer.concat([
    decipher.update(Buffer.from(cifrado!, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

/**
 * Decifra sem lançar exceção.
 *
 * Usado onde a falha não deve derrubar a página: se a chave foi trocada, ou o
 * valor veio de outra instalação, a tela precisa carregar mostrando "senha
 * não configurada" em vez de estourar um erro de servidor.
 */
export function decifrarSeguro(guardado: string | null): string | null {
  if (!guardado) return null
  try {
    return decifrar(guardado)
  } catch {
    return null
  }
}
