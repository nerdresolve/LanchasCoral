import 'server-only'
import nodemailer, { type Transporter } from 'nodemailer'
import { getConfigDeEnvio, podeEnviar, type ConfigDeEnvio } from './config'

/**
 * Transporte de e-mail.
 *
 * A configuração vem do banco (editável no painel), com as variáveis de
 * ambiente como reserva — ver `config.ts`. O transporte é montado a cada
 * envio, e não guardado numa variável de módulo: o operador pode trocar o
 * servidor pelo painel a qualquer momento, e um transporte em cache
 * continuaria falando com o servidor antigo até o próximo restart.
 *
 * O custo é a negociação TLS por envio, irrelevante num fluxo em que alguém
 * clica um botão de cada vez.
 */

function montar(cfg: ConfigDeEnvio): Transporter {
  return nodemailer.createTransport({
    host: cfg.host!,
    port: cfg.port,
    // 465 usa TLS implícito; nas demais portas o STARTTLS é negociado.
    secure: cfg.secure,
    auth: { user: cfg.user!, pass: cfg.pass! },
    /* Quando o host é um endereço que o certificado não cobre, o nome a
       validar vem de `serverName`. A verificação continua ligada: muda
       contra qual nome ela é feita, não se ela acontece. */
    ...(cfg.serverName
      ? { tls: { servername: cfg.serverName, rejectUnauthorized: true } }
      : {}),
    // Sem isto, um servidor que não responde deixa a action pendurada e o
    // operador fica olhando "Enviando…" sem fim.
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })
}

/** `true` quando há dados suficientes para tentar enviar. */
export async function emailConfigurado() {
  return podeEnviar(await getConfigDeEnvio())
}

type Envio = {
  para: string
  assunto: string
  html: string
  texto: string
  responderPara?: string
  /** Cópia oculta deste envio, somada ao `bcc` global da configuração. */
  copiaOculta?: string
  /* `cid` + `contentDisposition: 'inline'` para imagens que aparecem no corpo
     (o logotipo do cabeçalho); os demais anexos, como o PDF, dispensam. */
  anexos?: {
    filename: string
    path?: string
    content?: Buffer
    cid?: string
    contentDisposition?: 'inline' | 'attachment'
  }[]
}

export async function enviarEmail({
  para,
  assunto,
  html,
  texto,
  responderPara,
  copiaOculta,
  anexos = [],
}: Envio) {
  const cfg = await getConfigDeEnvio()
  if (!podeEnviar(cfg)) throw new Error('O envio de e-mail ainda não foi configurado.')

  const remetente = cfg.fromEmail ?? cfg.user!

  return montar(cfg).sendMail({
    from: `"${cfg.fromName}" <${remetente}>`,
    to: para,
    /* O `bcc` da configuração vale para tudo; `copiaOculta` é de um envio
       só, como a cópia do memorial para a assistência técnica. Os dois
       convivem, sem repetir endereço. */
    bcc: [...new Set([cfg.bcc, copiaOculta].filter(Boolean))].join(', ') || undefined,
    replyTo: responderPara ?? cfg.replyTo ?? remetente,
    subject: assunto,
    text: texto,
    html,
    attachments: anexos,
  })
}

/**
 * Confere as credenciais sem enviar nada.
 *
 * Aceita uma configuração avulsa para que o painel possa testar o que o
 * operador acabou de digitar, ANTES de gravar — evita salvar dados errados e
 * só descobrir na hora em que um cliente estava esperando o e-mail.
 */
export async function verificarConexao(cfg?: ConfigDeEnvio) {
  const usar = cfg ?? (await getConfigDeEnvio())
  if (!podeEnviar(usar)) throw new Error('Faltam servidor, usuário ou senha.')
  return montar(usar).verify()
}
