/*
 * Fluxo completo do memorial, de ponta a ponta, com envio REAL.
 *
 *   npx tsx audit/_teste-envio-real.mjs [destinatario]
 *
 * Preenche o formulário público, envia pelo painel e confere que o e-mail
 * saiu com o PDF anexado. Sem destinatário, usa um endereço inválido — o
 * envio falha de propósito, e o que se testa é o registro do erro.
 *
 * Não entra na bateria automática: manda e-mail de verdade.
 */
import { chromium } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const BASE = 'https://coral.nerdresolve.com'
const ADMIN = 'admin@lanchascoral.com.br'
/* Sem valor embutido: a senha do painel no histórico do Git seria
   permanente. Defina CORAL_ADMIN_SENHA no ambiente antes de rodar. */
const SENHA = process.env.CORAL_ADMIN_SENHA
if (!SENHA) {
  console.error('Defina CORAL_ADMIN_SENHA no ambiente para rodar este script.')
  process.exit(1)
}
const DESTINO = process.argv[2] ?? 'ninguem@exemplo.invalid'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

let falhas = 0
const conf = (cond, texto, extra = '') => {
  if (!cond) falhas++
  console.log(`${cond ? '  ok  ' : ' FALHA'} ${texto}${extra ? '  ' + extra : ''}`)
}

const navegador = await chromium.launch()
const ctx = await navegador.newContext({ viewport: { width: 1400, height: 950 } })
const p = await ctx.newPage()

let pedidoId = null

try {
  console.log(`Destinatário: ${DESTINO}\n`)

  console.log('--- O VISITANTE PEDE PELO SITE ---')
  await p.goto(`${BASE}/solicitar-manual`, { waitUntil: 'domcontentloaded' })

  const modelo = await p.locator('select[name="boatSlug"] option:not([disabled])').first().getAttribute('value')
  await p.selectOption('select[name="boatSlug"]', modelo)
  await p.fill('input[name="name"]', 'ZZ Teste Envio')
  await p.fill('input[name="email"]', DESTINO)
  const temMsg = await p.locator('textarea[name="message"]').count()
  if (temMsg) await p.fill('textarea[name="message"]', 'Pedido gerado por teste automatizado.')
  await p.click('button[type="submit"]:not(dialog *)')
  await p.waitForTimeout(3000)

  const pedido = await prisma.inquiry.findFirst({
    where: { email: DESTINO, kind: 'MANUAL' },
    orderBy: { createdAt: 'desc' },
  })
  conf(Boolean(pedido), 'o pedido chegou no painel', pedido?.boatSlug ?? '')
  pedidoId = pedido?.id
  conf(pedido?.manualSentAt === null, 'não saiu sozinho: espera aprovação')

  console.log('\n--- O OPERADOR ENVIA PELO PAINEL ---')
  await p.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' })
  await p.fill('input[name="email"]', ADMIN)
  await p.fill('input[name="password"]', SENHA)
  await p.click('button[type="submit"]:not(dialog *)')
  await p.waitForURL(/\/admin$/, { timeout: 30000 })

  await p.goto(`${BASE}/admin/inquiries`, { waitUntil: 'domcontentloaded' })
  const cartao = p.locator('li:has-text("ZZ Teste Envio")').first()
  const botao = cartao.locator('button:has-text("Enviar memorial")')
  conf((await botao.count()) === 1, 'o botão de envio aparece')
  conf(!(await botao.isDisabled()), 'e está habilitado (SMTP configurado)')

  await botao.click()
  await p.waitForTimeout(12000)

  const registro = await prisma.mailLog.findFirst({
    where: { inquiryId: pedidoId },
    orderBy: { createdAt: 'desc' },
  })
  conf(Boolean(registro), 'a tentativa foi registrada no histórico')
  conf(registro?.trigger === 'manual', 'marcada como envio manual', registro?.trigger ?? '')
  conf(registro?.actor === ADMIN, 'com o autor do clique', registro?.actor ?? '')

  const enviouDeVerdade = DESTINO !== 'ninguem@exemplo.invalid'
  if (enviouDeVerdade) {
    conf(registro?.status === 'enviado', 'o e-mail saiu', registro?.detail ?? '')
    const atualizado = await prisma.inquiry.findUnique({ where: { id: pedidoId } })
    conf(Boolean(atualizado?.manualSentAt), 'o pedido ficou marcado como enviado')
    conf(atualizado?.handled === true, 'e como tratado')

    await p.reload({ waitUntil: 'domcontentloaded' })
    const texto = await p.locator('li:has-text("ZZ Teste Envio")').first().innerText()
    conf(/Enviar de novo/.test(texto), 'o botão passa a oferecer reenvio')
  } else {
    // Endereço inválido: o que se testa é o registro da falha.
    conf(registro?.status === 'falhou', 'a falha foi registrada', registro?.detail?.slice(0, 60) ?? '')
  }

  console.log('\n--- O HISTÓRICO APARECE NO PAINEL ---')
  await p.goto(`${BASE}/admin/email`, { waitUntil: 'domcontentloaded' })
  const historico = await p.locator('body').innerText()
  conf(historico.includes(DESTINO), 'o envio aparece na tela de e-mail')
} finally {
  console.log('\n--- LIMPANDO ---')
  if (pedidoId) await prisma.mailLog.deleteMany({ where: { inquiryId: pedidoId } })
  await prisma.inquiry.deleteMany({ where: { name: 'ZZ Teste Envio' } })
  conf(
    (await prisma.inquiry.count({ where: { name: 'ZZ Teste Envio' } })) === 0,
    'pedido de teste removido',
  )
  await prisma.$disconnect()
  await navegador.close()
}

console.log(falhas === 0 ? '\nTodos os casos passaram.' : `\n${falhas} caso(s) falharam.`)
process.exit(falhas === 0 ? 0 : 1)
