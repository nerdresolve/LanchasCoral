/*
 * Exclusão protegida.
 *
 * Confere que apagar exige confirmação por digitação, que cancelar não apaga
 * nada, e que confirmar apaga de verdade — inclusive tirando a página do ar.
 *
 * Trabalha sobre um modelo descartável criado na hora; nunca toca no
 * conteúdo real.
 *
 *   npx tsx audit/_teste-exclusao.mjs
 */
import { chromium } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const BASE = 'https://coral.nerdresolve.com'
const EMAIL = 'admin@lanchascoral.com.br'
/* Sem valor embutido: a senha do painel no histórico do Git seria
   permanente. Defina CORAL_ADMIN_SENHA no ambiente antes de rodar. */
const SENHA = process.env.CORAL_ADMIN_SENHA
if (!SENHA) {
  console.error('Defina CORAL_ADMIN_SENHA no ambiente para rodar este script.')
  process.exit(1)
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const marca = Date.now().toString().slice(-6)
const SLUG = `zz-excluir-${marca}`
const NOME = `ZZ Excluir ${marca}`

let falhas = 0
const conf = (cond, texto, extra = '') => {
  if (!cond) falhas++
  console.log(`${cond ? '  ok  ' : ' FALHA'} ${texto}${extra ? '  ' + extra : ''}`)
}

const existe = async () => Boolean(await prisma.boat.findUnique({ where: { slug: SLUG } }))

const navegador = await chromium.launch()
const p = await (await navegador.newContext({ viewport: { width: 1400, height: 950 } })).newPage()

await p.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' })
await p.fill('input[name="email"]', EMAIL)
await p.fill('input[name="password"]', SENHA)
await p.click('button[type="submit"]')
await p.waitForURL(/\/admin$/, { timeout: 30000 })

try {
  // Modelo descartável, criado direto no banco para o teste ser rápido.
  await prisma.boat.create({
    data: {
      slug: SLUG,
      name: NOME,
      published: false,
      images: { create: [{ url: 'https://lanchascoral.com.br/wp-content/uploads/2020/04/IMG-21.jpg', order: 0 }] },
    },
  })
  conf(await existe(), 'modelo de teste criado')

  await p.goto(`${BASE}/admin/boats/${SLUG}`, { waitUntil: 'domcontentloaded' })

  console.log('\n--- O PRIMEIRO CLIQUE NÃO APAGA ---')
  /* `:not(dialog *)` porque o diálogo tem um segundo botão com texto
     parecido; sem isso o seletor casa com os dois. */
  const abrir = p.locator('button:has-text("Excluir modelo"):not(dialog *)')
  await abrir.click()
  await p.waitForTimeout(700)
  const abriu = await p.locator('dialog[open]').count()
  conf(abriu === 1, 'abre a confirmação em vez de apagar')
  conf(await existe(), 'o modelo continua no banco')

  console.log('\n--- SEM DIGITAR O NOME, NÃO DÁ PARA CONFIRMAR ---')
  const confirmar = p.locator('dialog[open] button[type="submit"]')
  conf(await confirmar.isDisabled(), 'botão de confirmar começa desabilitado')

  await p.fill('#confirmar-exclusao', 'nome errado')
  await p.waitForTimeout(300)
  conf(await confirmar.isDisabled(), 'continua desabilitado com o nome errado')

  console.log('\n--- CANCELAR NÃO APAGA ---')
  await p.click('dialog[open] button:has-text("Cancelar")')
  await p.waitForTimeout(500)
  conf((await p.locator('dialog[open]').count()) === 0, 'a confirmação fecha')
  conf(await existe(), 'o modelo continua no banco depois de cancelar')

  console.log('\n--- ESC TAMBÉM NÃO APAGA ---')
  await abrir.click()
  await p.waitForTimeout(500)
  await p.keyboard.press('Escape')
  await p.waitForTimeout(500)
  conf(await existe(), 'o modelo continua no banco depois de Esc')

  console.log('\n--- O CAMPO NÃO GUARDA O TEXTO ANTERIOR ---')
  await abrir.click()
  await p.waitForTimeout(700)
  conf((await p.inputValue('#confirmar-exclusao')) === '', 'campo volta vazio ao reabrir')

  console.log('\n--- COM O NOME CERTO, APAGA ---')
  await p.fill('#confirmar-exclusao', NOME)
  await p.waitForTimeout(300)
  conf(!(await p.locator('dialog[open] button[type="submit"]').isDisabled()), 'botão habilita com o nome certo')

  await p.locator('dialog[open] button[type="submit"]').click()
  await p.waitForURL(/deleted=1/, { timeout: 40000 })
  conf(!(await existe()), 'o modelo foi apagado')

  const resp = await p.goto(`${BASE}/admin/boats/${SLUG}`, { waitUntil: 'domcontentloaded' })
  conf(resp?.status() === 404, 'a página de edição some', `-> ${resp?.status()}`)
} finally {
  await prisma.boat.deleteMany({ where: { slug: SLUG } })
  await prisma.family.deleteMany({ where: { boats: { none: {} } } })
}

await navegador.close()
await prisma.$disconnect()
console.log(falhas === 0 ? '\nTodos os casos passaram.' : `\n${falhas} caso(s) falharam.`)
process.exit(falhas === 0 ? 0 : 1)
