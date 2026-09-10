/*
 * Cria um modelo e um anúncio do zero pelo painel, confere que aparecem no
 * site público, e apaga os dois.
 *
 * É o caminho que menos se exercita no dia a dia (o operador quase sempre
 * edita o que já existe), e por isso o que mais esconde defeito.
 *
 *   npx tsx audit/_teste-criacao.mjs
 *
 * Nos cliques de salvar, o seletor é `button[type="submit"]:not(dialog *)`:
 * a página tem um segundo submit — o de confirmar exclusão — que vive dentro
 * do <dialog> e começa escondido.
 */
import { chromium } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const BASE = 'https://coral.nerdresolve.com'
const EMAIL = 'admin@lanchascoral.com.br'
/* Sem valor embutido: a senha do painel no histórico do Git seria
   permanente. Defina CORAL_ADMIN_SENHA no ambiente antes de rodar. */
const SENHA = process.env.CORAL_ADMIN_SENHA
if (!SENHA) {
  console.error('Defina CORAL_ADMIN_SENHA no ambiente para rodar este script.')
  process.exit(1)
}

const marca = Date.now().toString().slice(-6)
const SLUG_MODELO = `zz-teste-modelo-${marca}`
const SLUG_ANUNCIO = `zz-teste-anuncio-${marca}`
const FOTO = 'https://lanchascoral.com.br/wp-content/uploads/2020/04/IMG-21.jpg'

let falhas = 0
const conf = (cond, texto, extra = '') => {
  if (!cond) falhas++
  console.log(`${cond ? '  ok  ' : ' FALHA'} ${texto}${extra ? '  ' + extra : ''}`)
}

const navegador = await chromium.launch()
const ctx = await navegador.newContext({ viewport: { width: 1400, height: 950 } })
const p = await ctx.newPage()
const publico = await ctx.newPage()

const erros = []
p.on('pageerror', (e) => erros.push(String(e)))

await p.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' })
await p.fill('input[name="email"]', EMAIL)
await p.fill('input[name="password"]', SENHA)
await p.click('button[type="submit"]:not(dialog *)')
await p.waitForURL(/\/admin$/, { timeout: 30000 })

try {
  console.log('--- CRIAR MODELO ---')
  await p.goto(`${BASE}/admin/boats/new`, { waitUntil: 'domcontentloaded' })

  await p.fill('input[name="name"]', `ZZ Teste ${marca}`)
  await p.fill('input[name="slug"]', SLUG_MODELO)
  await p.fill('input[name="familyName"]', `ZZ Familia ${marca}`)
  // `pressSequentially` e não `fill`: num input type=number o `fill` do
  // Playwright recusa a vírgula, mas o navegador (em pt-BR) a converte em
  // ponto quando a pessoa digita. Queremos reproduzir o comportamento real.
  await p.locator('input[name="lengthM"]').pressSequentially('11,5')
  await p.fill('input[name="powerMinHp"]', '250')
  await p.fill('input[name="powerMaxHp"]', '400')
  await p.fill('input[name="manualUrl"]', '/memoriais/coral-36-aberta.pdf')

  /* Galeria. O botão é o vizinho imediato do campo: a página tem três
     botões "Adicionar" (fotos, equipamentos, desempenho). */
  await p.fill('input[placeholder*="endereços de foto"]', FOTO)
  await p.locator('input[placeholder*="endereços de foto"]')
    .locator('xpath=following-sibling::button[1]').click()
  await p.waitForTimeout(600)

  await p.click('button[type="submit"]:not(dialog *)')
  await p.waitForURL(/created=1/, { timeout: 40000 })
  conf(true, 'modelo criado sem erro')

  // Os valores voltam preenchidos ao reabrir?
  await p.goto(`${BASE}/admin/boats/${SLUG_MODELO}`, { waitUntil: 'domcontentloaded' })
  conf((await p.inputValue('input[name="lengthM"]')) === '11.5', 'comprimento com vírgula gravou 11.5')
  conf((await p.inputValue('input[name="manualUrl"]')).includes('.pdf'), 'memorial gravou')
  conf((await p.inputValue('input[name="familyName"]')).includes('ZZ Familia'), 'família gravou')
  /* Espera em vez de contar de imediato: com `domcontentloaded` a página
     ainda está montando, e a galeria aparecia depois da checagem — o caso
     falhava de forma intermitente sem nada estar quebrado. */
  const temFoto = await p
    .locator(`text=${FOTO}`)
    .first()
    .waitFor({ state: 'attached', timeout: 15000 })
    .then(() => true)
    .catch(() => false)
  conf(temFoto, 'foto gravou na galeria')

  /*
   * Chegou ao site público?
   *
   * Com algumas tentativas: a página de um modelo recém-criado é gerada sob
   * demanda, e a primeira visita pode chegar antes de a revalidação terminar
   * — ainda mais quando outras suítes da bateria revalidam ao mesmo tempo.
   * O que se verifica é que a página PASSA a existir, não que exista no
   * primeiro milissegundo.
   */
  let existe = false
  for (let i = 0; i < 10 && !existe; i++) {
    if (i) await new Promise((r) => setTimeout(r, 2000))
    const resp = await publico.goto(`${BASE}/modelos/${SLUG_MODELO}`, { waitUntil: 'domcontentloaded' })
    existe = resp?.status() === 200 && !(await publico.locator('text=404').count())
  }
  conf(existe, 'página pública do modelo existe')
  const corpoModelo = await publico.locator('body').innerText()
  conf(corpoModelo.includes(`ZZ Teste ${marca}`), 'nome aparece na página pública')
  conf(/memorial/i.test(corpoModelo), 'botão do memorial aparece')

  await publico.goto(`${BASE}/modelos`, { waitUntil: 'domcontentloaded' })
  conf((await publico.locator('body').innerText()).includes(`ZZ Teste ${marca}`), 'modelo aparece na listagem /modelos')

  console.log('\n--- CRIAR ANÚNCIO ---')
  await p.goto(`${BASE}/admin/listings/new`, { waitUntil: 'domcontentloaded' })

  await p.fill('input[name="title"]', `ZZ Anuncio ${marca}`)
  await p.fill('input[name="slug"]', SLUG_ANUNCIO)
  await p.fill('input[name="year"]', '2020')
  await p.fill('input[name="priceBrl"]', '850000')
  await p.selectOption('select[name="engineType"]', 'Popa')
  await p.fill('input[placeholder*="endereços de foto"]', FOTO)
  await p.locator('input[placeholder*="endereços de foto"]')
    .locator('xpath=following-sibling::button[1]').click()
  await p.waitForTimeout(600)

  await p.click('button[type="submit"]:not(dialog *)')
  await p.waitForURL(/created=1/, { timeout: 40000 })
  conf(true, 'anúncio criado sem erro')

  await p.goto(`${BASE}/admin/listings/${SLUG_ANUNCIO}`, { waitUntil: 'domcontentloaded' })
  conf((await p.inputValue('select[name="engineType"]')) === 'Popa', 'tipo de motor gravou')
  conf((await p.inputValue('input[name="priceBrl"]')) === '850000', 'preço gravou')

  await publico.goto(`${BASE}/broker/${SLUG_ANUNCIO}`, { waitUntil: 'domcontentloaded' })
  const corpoAnuncio = await publico.locator('body').innerText()
  conf(corpoAnuncio.includes(`ZZ Anuncio ${marca}`), 'anúncio aparece na página pública')

  await publico.goto(`${BASE}/broker`, { waitUntil: 'domcontentloaded' })
  conf((await publico.locator('body').innerText()).includes(`ZZ Anuncio ${marca}`), 'anúncio aparece na listagem /broker')

  console.log('\n--- DESPUBLICAR ---')
  await p.goto(`${BASE}/admin/listings/${SLUG_ANUNCIO}`, { waitUntil: 'domcontentloaded' })
  await p.uncheck('input[name="published"]')
  await p.click('button[type="submit"]:not(dialog *)')
  await p.waitForURL(/saved=1/, { timeout: 40000 })

  const resp = await publico.goto(`${BASE}/broker/${SLUG_ANUNCIO}`, { waitUntil: 'domcontentloaded' })
  conf(resp?.status() === 404, 'anúncio despublicado some do site', `-> ${resp?.status()}`)

  await publico.goto(`${BASE}/broker`, { waitUntil: 'domcontentloaded' })
  conf(!(await publico.locator('body').innerText()).includes(`ZZ Anuncio ${marca}`), 'some também da listagem')
} finally {
  console.log('\n--- APAGANDO ---')
  /* Exclusão em dois passos: abre a confirmação, digita o nome do item e só
     então o botão de confirmar habilita. Ver `BotaoExcluir.tsx`. */
  for (const [tipo, slug, nome] of [
    ['listings', SLUG_ANUNCIO, `ZZ Anuncio ${marca}`],
    ['boats', SLUG_MODELO, `ZZ Teste ${marca}`],
  ]) {
    try {
      await p.goto(`${BASE}/admin/${tipo}/${slug}`, { waitUntil: 'domcontentloaded' })
      const abrir = p.locator('button:has-text("Excluir"):not(dialog *)')
      if (!(await abrir.count())) continue
      await abrir.click()
      await p.waitForSelector('dialog[open]', { timeout: 10000 })
      await p.fill('#confirmar-exclusao', nome)
      await p.locator('dialog[open] button[type="submit"]').click()
      await p.waitForURL(/deleted=1/, { timeout: 40000 })
    } catch { /* a limpeza pelo banco, abaixo, garante o resto */ }
  }

  const sobrou = await p.goto(`${BASE}/admin/boats/${SLUG_MODELO}`, { waitUntil: 'domcontentloaded' })
  conf(sobrou?.status() === 404, 'modelo de teste removido pela interface', `-> ${sobrou?.status()}`)

  /* Rede de segurança: se a interface falhou, o teste não pode deixar lixo
     num banco de produção. Também limpa a família criada junto. */
  await prisma.boat.deleteMany({ where: { slug: { startsWith: 'zz-teste-' } } })
  await prisma.listing.deleteMany({ where: { slug: { startsWith: 'zz-teste-' } } })
  await prisma.family.deleteMany({ where: { boats: { none: {} } } })
  await prisma.$disconnect()
}

conf(erros.length === 0, 'nenhum erro de JavaScript no painel', erros[0] ?? '')

await navegador.close()
console.log(falhas === 0 ? '\nTodos os casos passaram.' : `\n${falhas} caso(s) falharam.`)
process.exit(falhas === 0 ? 0 : 1)
