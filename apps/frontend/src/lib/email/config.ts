import 'server-only'
import { prisma } from '../prisma'
import { decifrarSeguro, criptoConfigurado } from '../cripto'

/**
 * Configuração de envio: o que está no banco, com o ambiente como reserva.
 *
 * A ordem importa. O que o painel gravou vence, porque é o que o operador
 * acabou de ver na tela; as variáveis de ambiente ficam como base para a
 * primeira subida, antes de alguém abrir o configurador. Assim o site não
 * depende de uma tela ter sido visitada para conseguir enviar.
 */

export type ConfigDeEnvio = {
  host: string | null
  port: number
  secure: boolean
  serverName: string | null
  user: string | null
  pass: string | null
  fromEmail: string | null
  fromName: string
  replyTo: string | null
  bcc: string | null
  autoSend: boolean
  autoLimitPerHour: number
  /** De onde veio a senha, para a tela poder explicar o estado ao operador. */
  origemDaSenha: 'painel' | 'ambiente' | 'nenhuma'
}

/** Garante a linha única, criando-a a partir do ambiente na primeira vez. */
export async function getMailSettings() {
  const existente = await prisma.mailSettings.findUnique({ where: { id: 'singleton' } })
  if (existente) return existente

  return prisma.mailSettings.create({
    data: {
      id: 'singleton',
      host: process.env.SMTP_HOST || null,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
      serverName: process.env.SMTP_SERVERNAME || null,
      user: process.env.SMTP_USER || null,
      // A senha do ambiente NÃO é copiada para o banco: quem quiser guardá-la
      // ali digita no painel, e aí ela entra cifrada.
      fromEmail: process.env.MAIL_FROM || null,
      fromName: process.env.MAIL_FROM_NAME || 'Lanchas Coral',
      bcc: process.env.MAIL_BCC || null,
    },
  })
}

export async function getConfigDeEnvio(): Promise<ConfigDeEnvio> {
  const s = await getMailSettings()

  const doPainel = criptoConfigurado() ? decifrarSeguro(s.passEnc) : null
  const doAmbiente = process.env.SMTP_PASS || null
  const pass = doPainel ?? doAmbiente

  return {
    host: s.host ?? process.env.SMTP_HOST ?? null,
    port: s.port,
    secure: s.secure,
    serverName: s.serverName ?? process.env.SMTP_SERVERNAME ?? null,
    user: s.user ?? process.env.SMTP_USER ?? null,
    pass,
    fromEmail: s.fromEmail ?? process.env.MAIL_FROM ?? null,
    fromName: s.fromName,
    replyTo: s.replyTo,
    /* Cai no ambiente como os demais campos. A linha do banco é criada na
       primeira leitura, e se `MAIL_BCC` só foi definido depois disso, ler
       apenas o banco deixaria a cópia oculta desligada sem explicação. */
    bcc: s.bcc ?? process.env.MAIL_BCC ?? null,
    autoSend: s.autoSend,
    autoLimitPerHour: s.autoLimitPerHour,
    origemDaSenha: doPainel ? 'painel' : doAmbiente ? 'ambiente' : 'nenhuma',
  }
}

/** `true` quando há dados suficientes para tentar um envio. */
export function podeEnviar(cfg: ConfigDeEnvio) {
  return Boolean(cfg.host && cfg.user && cfg.pass)
}

/**
 * Diz se um endereço está barrado para envio automático.
 *
 * Casa o domínio exato e os subdomínios: bloquear `concorrente.com.br` também
 * pega `mail.concorrente.com.br`, que seria a saída óbvia para contornar.
 */
export async function dominioBloqueado(email: string): Promise<string | null> {
  const dominio = email.split('@')[1]?.toLowerCase().trim()
  if (!dominio) return null

  const bloqueados = await prisma.blockedDomain.findMany({ select: { domain: true } })
  const achado = bloqueados.find(
    (b) => dominio === b.domain || dominio.endsWith(`.${b.domain}`),
  )
  return achado?.domain ?? null
}

/**
 * Quantos envios automáticos saíram na última hora.
 *
 * O teto protege contra um laço de repetição ou um robô preenchendo o
 * formulário em série: sem ele, um defeito poderia disparar centenas de
 * e-mails antes de alguém perceber, e queimar a reputação do remetente.
 */
export async function enviosAutomaticosNaUltimaHora(): Promise<number> {
  return prisma.mailLog.count({
    where: {
      trigger: 'automatico',
      status: 'enviado',
      createdAt: { gte: new Date(Date.now() - 3600_000) },
    },
  })
}
