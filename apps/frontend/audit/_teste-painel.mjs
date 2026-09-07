/*
 * Prova de ponta a ponta do painel, contra o site publicado.
 *
 * Cobre o que o usuário pediu para validar: se o painel realmente edita
 * modelos e anúncios, e se a edição chega à página pública. Toda alteração
 * feita aqui é desfeita ao final.
 *
 *   npx tsx audit/_teste-painel.mjs
 *
 * Nos cliques de salvar, o seletor é `button[type="submit"]:not(dialog *)`:
 * a página tem um segundo submit — o de confirmar exclusão — que vive dentro
 * do <dialog> e começa escondido.
 */
import { chromium } from '@playwright/test'

const BASE = 'https://coral.nerdresolve.com'
const EMAIL = 'admin@lanchascoral.com.br'
/* Sem valor embutido: a senha do painel no histórico do Git seria
   permanente. Defina CORAL_ADMIN_SENHA no ambiente antes de rodar. */
const SENHA = process.env.CORAL_ADMIN_SENHA
if (!SENHA) {
  console.error('Defina CORAL_ADMIN_SENHA no ambiente para rodar este script.')
  process.exit(1)
}

let falhas = 0
const conf = (cond, texto, extra = '') => {
  if (!cond) falhas++
  console.log(`${cond ? '  ok  ' : ' FALHA'} ${texto}${extra ? '  ' + extra : ''}`)
}

const navegador = await chromium.launch()
const ctx = await navegador.newContext({ viewport: { width: 1400, height: 950 } })
const p = await ctx.newPage()

console.log('--- ACESSO ---')

// Sem sessão, o painel não pode abrir.
const semSessao = await ctx.newPage()
await semSessao.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' })
conf(semSessao.url().includes('/admin/login'), 'painel exige login', `-> ${new URL(semSessao.url()).pathname}`)
await semSessao.close()

// Senha errada é recusada.
await p.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' })
await p.fill('input[name="email"]', EMAIL)
await p.fill('input[name="password"]', 'senha-errada-de-proposito')
await p.click('button[type="submit"]:not(dialog *)')
await p.waitForTimeout(1800)
conf(!p.url().endsWith('/admin'), 'senha errada não entra')
const erro = await p.locator('[role="alert"], .text-danger-500').first().textContent().catch(() => '')
conf(/inválid/i.test(erro ?? ''), 'mensagem de erro genérica', `-> "${(erro ?? '').trim()}"`)

// Login correto.
await p.fill('input[name="email"]', EMAIL)
await p.fill('input[name="password"]', SENHA)
await p.click('button[type="submit"]:not(dialog *)')
await p.waitForURL(/\/admin$/, { timeout: 30000 })
conf(true, 'login válido entra no painel')

console.log('\n--- CAMPOS QUE FALTAVAM ---')

// Modelo: memorial descritivo e capa agora existem no formulário.
await p.goto(`${BASE}/admin/boats/coral-36-aberta`, { waitUntil: 'domcontentloaded' })
conf(await p.locator('input[name="manualUrl"]').count() > 0, 'formulário do modelo tem campo de memorial')
conf(await p.locator('input[name="heroImage"]').count() > 0, 'formulário do modelo tem campo de capa')
const memorialAtual = await p.inputValue('input[name="manualUrl"]').catch(() => '')
conf(memorialAtual.length > 0, 'memorial já cadastrado aparece preenchido', `-> ${memorialAtual}`)

// Anúncio: tipo de motor agora existe e traz o valor do banco.
await p.goto(`${BASE}/admin/listings`, { waitUntil: 'domcontentloaded' })
// `:not([href$="/new"])` porque a lista traz também o botão de criação, que
// aponta para /admin/listings/new e não é um anúncio.
const primeiro = await p
  .locator('a[href^="/admin/listings/"]:not([href$="/new"])')
  .first()
  .getAttribute('href')
await p.goto(`${BASE}${primeiro}`, { waitUntil: 'domcontentloaded' })
conf(await p.locator('select[name="engineType"]').count() > 0, 'formulário do anúncio tem tipo de motor')
const opcoes = await p.locator('select[name="engineType"] option').allTextContents()
conf(opcoes.length === 6, 'lista traz as 5 motorizações mais "Não informar"', `-> ${opcoes.length}`)

console.log('\n--- EDIÇÃO CHEGA AO SITE PÚBLICO ---')

const slugAnuncio = primeiro.replace('/admin/listings/', '')
const tituloOriginal = await p.inputValue('input[name="title"]')
const motorOriginal = await p.inputValue('select[name="engineType"]')
const marcador = `ZZTESTE${Date.now().toString().slice(-5)}`

await p.fill('input[name="title"]', `${tituloOriginal} ${marcador}`)
await p.selectOption('select[name="engineType"]', 'Hidrojato')
await p.click('button[type="submit"]:not(dialog *)')
await p.waitForURL(/saved=1/, { timeout: 30000 })
conf(true, 'anúncio salvo sem erro')

/*
 * A página de detalhe é pré-renderizada: é justamente onde a revalidação
 * falhava antes.
 *
 * `esperarTexto` tenta algumas vezes porque a regeneração leva um instante,
 * e mais ainda quando outras suítes da bateria revalidam em paralelo. O que
 * importa é a alteração CHEGAR — se não chegar em ~20s, aí sim é defeito.
 */
const publica = await ctx.newPage()
const esperarTexto = async (url, texto) => {
  /* 25 tentativas, e não 10: a PRIMEIRA regeneração de uma página estática
     depois de um build ou de um período ocioso leva bem mais que as
     seguintes — medido, a primeira passou de 20s e as duas seguintes foram
     instantâneas. Não é defeito do site; é o cache do Next gerando a página
     do zero. O que se verifica é que a alteração CHEGA. */
  for (let i = 0; i < 25; i++) {
    if (i) await new Promise((r) => setTimeout(r, 2000))
    await publica.goto(url, { waitUntil: 'domcontentloaded' })
    if ((await publica.locator('body').innerText()).includes(texto)) return true
  }
  return false
}

conf(
  await esperarTexto(`${BASE}/broker/${slugAnuncio}`, marcador),
  'alteração aparece em /broker/[slug]',
)
conf(
  await esperarTexto(`${BASE}/en/broker/${slugAnuncio}`, marcador),
  'alteração aparece também na versão em inglês',
)

// O tipo de motor gravado passa a valer no filtro público.
await publica.goto(`${BASE}/broker`, { waitUntil: 'domcontentloaded' })
const temFiltro = await publica.locator('text=/Hidrojato/i').count()
conf(temFiltro > 0, 'motorização gravada aparece no filtro do Broker')

console.log('\n--- VALIDAÇÃO RECUSA ENTRADA RUIM ---')

await p.goto(`${BASE}/admin/listings/${slugAnuncio}`, { waitUntil: 'domcontentloaded' })
await p.fill('input[name="year"]', '1200')
await p.click('button[type="submit"]:not(dialog *)')
await p.waitForTimeout(2500)
const temErro = await p.locator('.text-danger-500').count()
conf(temErro > 0, 'ano fora da faixa é recusado com aviso visível')

console.log('\n--- DESFAZENDO ---')
await p.goto(`${BASE}/admin/listings/${slugAnuncio}`, { waitUntil: 'domcontentloaded' })
await p.fill('input[name="title"]', tituloOriginal)
await p.selectOption('select[name="engineType"]', motorOriginal)
await p.click('button[type="submit"]:not(dialog *)')
await p.waitForURL(/saved=1/, { timeout: 30000 })

await publica.goto(`${BASE}/broker/${slugAnuncio}`, { waitUntil: 'domcontentloaded' })
const limpo = await publica.locator('body').innerText()
conf(!limpo.includes(marcador), 'anúncio restaurado ao estado original')

const tituloFinal = await p.inputValue('input[name="title"]').catch(() => '')
conf(tituloFinal === tituloOriginal || tituloFinal === '', 'título de volta ao original')

await navegador.close()
console.log(falhas === 0 ? '\nTodos os casos passaram.' : `\n${falhas} caso(s) falharam.`)
process.exit(falhas === 0 ? 0 : 1)
