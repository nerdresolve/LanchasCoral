/*
 * Envia o e-mail de exemplo para um destinatário.
 *
 *   set -a; source ../../.env; set +a
 *   npx tsx audit/testar-email.ts destinatario@exemplo.com
 *
 * É um `.ts` (e não `.mjs`) para importar o template pelo mesmo caminho que a
 * aplicação usa, sem extensão — o `moduleResolution: bundler` do tsconfig
 * resolve isso. O corpo fica numa função porque esta pasta compila como
 * CommonJS, que não aceita `await` no nível do módulo.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import nodemailer from 'nodemailer'
import { memorialDescritivo } from '../src/lib/email/templates'

async function main() {
  const destino = process.argv[2]

  const faltando = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter((v) => !process.env[v])
  if (faltando.length) {
    console.error(`Faltam variáveis no ambiente: ${faltando.join(', ')}`)
    console.error('Carregue o .env da raiz antes de rodar.')
    return 1
  }

  const porta = Number(process.env.SMTP_PORT ?? 465)
  const transporte = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: porta,
    secure: process.env.SMTP_SECURE === 'true' || porta === 465,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    ...(process.env.SMTP_SERVERNAME
      ? { tls: { servername: process.env.SMTP_SERVERNAME, rejectUnauthorized: true } }
      : {}),
  })

  console.log(`Servidor:  ${process.env.SMTP_HOST}:${porta}`)
  console.log(`Remetente: ${process.env.MAIL_FROM ?? process.env.SMTP_USER}\n`)

  try {
    await transporte.verify()
    console.log('Conexão e credenciais: ok')
  } catch (e) {
    console.error(`Falhou: ${e instanceof Error ? e.message : e}`)
    return 1
  }

  // Sem destinatário, para por aqui: conferir a conexão não precisa gastar
  // um envio real nem encher a caixa de ninguém.
  if (!destino) {
    console.log('\nPara enviar um e-mail de exemplo, passe o destinatário:')
    console.log('  npx tsx audit/testar-email.ts voce@exemplo.com')
    return 0
  }

  /* O logotipo entra como anexo inline, igual ao envio real — sem ele a
     prévia mostraria o cabeçalho de reserva, em texto, e não o que o cliente
     de fato recebe. */
  const logo = await readFile(path.join(process.cwd(), 'public/brand/logo-coral-mono.png'))

  const { assunto, html, texto } = memorialDescritivo({
    nome: 'Flávio',
    modelo: 'Coral 36 Aberta',
    urlDoMemorial: 'https://coral.nerdresolve.com/memoriais/coral-36-aberta.pdf',
    telefones: ['(21) 3448-7381', '(21) 97159-8865'],
    comLogo: true,
  })

  const info = await transporte.sendMail({
    from: `"${process.env.MAIL_FROM_NAME ?? 'Coral Indústria Naval'}" <${process.env.MAIL_FROM ?? process.env.SMTP_USER}>`,
    to: destino,
    subject: `[teste] ${assunto}`,
    text: texto,
    html,
    attachments: [
      { filename: 'coral.png', content: logo, cid: 'logo-coral', contentDisposition: 'inline' },
    ],
  })

  console.log(`Enviado para ${destino}`)
  console.log(`id: ${info.messageId}`)
  return 0
}

main().then((codigo) => process.exit(codigo))
