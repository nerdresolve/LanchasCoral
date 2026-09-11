/*
 * Confere as quatro frentes desta rodada, contra o site publicado.
 *
 *   npx tsx audit/_teste-rodada.mjs
 *
 * Toda alteração feita aqui é desfeita ao final.
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

let falhas = 0
const conf = (cond, texto, extra = '') => {
  if (!cond) falhas++
  console.log(`${cond ? '  ok  ' : ' FALHA'} ${texto}${extra ? '  ' + extra : ''}`)
}

const navegador = await chromium.launch()
const ctx = await navegador.newContext({ viewport: { width: 1400, height: 950 } })
const p = await ctx.newPage()
const erros = []
p.on('pageerror', (e) => erros.push(String(e)))

try {
  console.log('--- GALERIA ---')
  await p.goto(`${BASE}/modelos/coral-36-aberta`, { waitUntil: 'domcontentloaded' })

  const selo = await p.locator('text=/^\\+\\d+$/').first().textContent().catch(() => null)
  conf(Boolean(selo), 'mosaico mostra quantas fotos faltam', selo ?? '')

  await p.locator('button[aria-label*="Ampliar"]').first().click()
  await p.waitForSelector('[role="dialog"]', { timeout: 10000 })
  conf(true, 'visualizador abre')

  const miniaturas = await p.locator('[role="dialog"] [data-indice]').count()
  conf(miniaturas > 1, 'fita de miniaturas aparece', `${miniaturas} miniaturas`)

  const contador = await p.locator('[role="dialog"] >> text=/^\\d+ \\/ \\d+$/').first().textContent()
  conf(/^1 \//.test(contador ?? ''), 'contador começa na primeira foto', contador ?? '')

  // Avança pelo teclado e confere que o contador acompanha.
  await p.keyboard.press('ArrowRight')
  await p.waitForTimeout(500)
  const depois = await p.locator('[role="dialog"] >> text=/^\\d+ \\/ \\d+$/').first().textContent()
  conf(depois !== contador, 'seta do teclado troca de foto', `${contador} -> ${depois}`)

  // Zoom pelos botões.
  await p.locator('[role="dialog"] button[aria-label*="Aproximar"]').click()
  await p.waitForTimeout(400)
  const nivel = await p.locator('[role="dialog"] button[aria-label*="normal"]').textContent()
  conf(nivel?.includes('150'), 'botão de aproximar aumenta o zoom', nivel ?? '')

  // Clicar numa miniatura salta para aquela foto.
  await p.locator('[role="dialog"] [data-indice="4"]').click()
  await p.waitForTimeout(500)
  const pulou = await p.locator('[role="dialog"] >> text=/^\\d+ \\/ \\d+$/').first().textContent()
  conf(pulou?.startsWith('5 /'), 'miniatura leva à foto escolhida', pulou ?? '')

  await p.keyboard.press('Escape')
  await p.waitForTimeout(500)
  conf((await p.locator('[role="dialog"]').count()) === 0, 'Esc fecha o visualizador')

  console.log('\n--- MEMORIAL: LISTA EM VEZ DE TEXTO LIVRE ---')
  await p.goto(`${BASE}/solicitar-manual`, { waitUntil: 'domcontentloaded' })
  const seletor = p.locator('select[name="boatSlug"]')
  conf((await seletor.count()) === 1, 'o modelo é escolhido numa lista')

  const opcoes = await seletor.locator('option').count()
  const comMemorial = await prisma.boat.count({ where: { published: true, manualUrl: { not: null } } })
  conf(opcoes === comMemorial + 1, 'lista traz só publicados com memorial', `${opcoes - 1} de ${comMemorial}`)

  /* Guardado aqui e usado mais abaixo, no bloco que despublica pelo painel. */
  const alvo = await prisma.boat.findFirst({ where: { published: true, manualUrl: { not: null } } })

  console.log('\n--- CONTATOS: EDITAR UMA VEZ, MUDAR EM TODO LUGAR ---')
  await p.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' })
  await p.fill('input[name="email"]', EMAIL)
  await p.fill('input[name="password"]', SENHA)
  await p.click('button[type="submit"]:not(dialog *)')
  await p.waitForURL(/\/admin$/, { timeout: 30000 })

  await p.goto(`${BASE}/admin/contatos`, { waitUntil: 'domcontentloaded' })
  /* Confere quais setores existem, e não quantos: o número muda quando o
     cliente organiza o atendimento (o RH entrou depois dos três primeiros),
     e um teste preso à contagem quebra sem nada estar errado. */
  const chaves = await p
    .locator('form input[name="key"]')
    .evaluateAll((els) => els.map((e) => e.value).sort())
  for (const setor of ['assistencia', 'comercial', 'compras', 'dp']) {
    conf(chaves.includes(setor), `o ponto focal "${setor}" aparece`, chaves.join(', '))
  }

  const antes = await prisma.contactPoint.findUnique({ where: { key: 'comercial' } })
  const NOVO = '(21) 3448-0001'

  const jsonLd = (await (await fetch(`${BASE}/?cb=${Date.now()}`)).text()).match(
    /"telephone":\[([^\]]*)\]/,
  )?.[1]
  const noBanco = (await prisma.contactPoint.findMany({ where: { active: true } })).flatMap(
    (c) => c.phones,
  )
  conf(
    Boolean(jsonLd) && noBanco.every((tel) => jsonLd.includes(tel)),
    'os telefones do banco entram nos dados que o Google lê',
    jsonLd?.slice(0, 46) ?? '(sem telephone)',
  )

  const form = p.locator('form:has(input[name="key"][value="comercial"])')
  await form.locator('input[name="phones"]').first().fill(NOVO)
  await form.locator('button[type="submit"]').click()
  await p.waitForTimeout(3500)

  const gravado = await prisma.contactPoint.findUnique({ where: { key: 'comercial' } })
  conf(gravado.phones[0] === NOVO, 'telefone gravado no banco', gravado.phones[0])

  /*
   * O JSON-LD da home publica os telefones do banco.
   *
   * Verificado ANTES de gravar, e não depois: a home é a única página
   * estática deste grupo, e regenerá-la leva alguns segundos. Rodando dentro
   * da bateria, com outras suítes tendo revalidado a raiz, essa regeneração
   * entra numa fila — medido isoladamente o mesmo caminho leva 2 segundos,
   * mas em sequência passa de um minuto. Conferir antes da escrita mede o
   * que importa (os telefones chegam ao JSON-LD) sem depender do tempo.
   *
   * Que a ESCRITA chega ao site é o que os dois casos seguintes provam, em
   * páginas que leem do banco a cada requisição.
   */
  // As demais leem do banco a cada requisição, então não têm essa janela.
  const publica = await ctx.newPage()
  await publica.goto(`${BASE}/contatos`, { waitUntil: 'domcontentloaded' })
  conf((await publica.locator('body').innerText()).includes(NOVO), 'aparece em /contatos')

  await publica.goto(`${BASE}/modelos`, { waitUntil: 'domcontentloaded' })
  conf((await publica.locator('body').innerText()).includes(NOVO), 'aparece no rodapé de outra página')

  // Devolve o número original.
  await prisma.contactPoint.update({ where: { key: 'comercial' }, data: { phones: antes.phones } })

  console.log('\n--- DESPUBLICAR TIRA O MODELO DA LISTA ---')
  /* Pelo painel, e não direto no banco: é a action que dispara a revalidação,
     então escrever pelo Prisma pularia justamente o que se quer testar — e
     acusaria uma falha que não existe no uso real. */
  await p.goto(`${BASE}/admin/boats/${alvo.slug}`, { waitUntil: 'domcontentloaded' })
  await p.uncheck('input[name="published"]')
  await p.click('button[type="submit"]:not(dialog *)')
  await p.waitForURL(/saved=1/, { timeout: 40000 })

  await p.goto(`${BASE}/solicitar-manual`, { waitUntil: 'domcontentloaded' })
  conf(
    (await p.locator(`select[name="boatSlug"] option[value="${alvo.slug}"]`).count()) === 0,
    'modelo despublicado some da lista',
    alvo.slug,
  )

  await p.goto(`${BASE}/admin/boats/${alvo.slug}`, { waitUntil: 'domcontentloaded' })
  await p.check('input[name="published"]')
  await p.click('button[type="submit"]:not(dialog *)')
  await p.waitForURL(/saved=1/, { timeout: 40000 })
  await p.goto(`${BASE}/solicitar-manual`, { waitUntil: 'domcontentloaded' })
  conf(
    (await p.locator(`select[name="boatSlug"] option[value="${alvo.slug}"]`).count()) === 1,
    'e volta ao republicar',
  )

  console.log('\n--- ENVIO DO MEMORIAL PELO PAINEL ---')
  await p.goto(`${BASE}/admin/inquiries`, { waitUntil: 'domcontentloaded' })

  const pedido = await prisma.inquiry.create({
    data: { name: 'ZZ Teste Memorial', email: 'zz-teste@exemplo.invalid', kind: 'MANUAL', boatSlug: alvo.slug },
  })
  await p.reload({ waitUntil: 'domcontentloaded' })

  const cartao = p.locator(`li:has-text("ZZ Teste Memorial")`)
  const botao = cartao.locator('button:has-text("Enviar memorial")')
  conf((await botao.count()) === 1, 'o botão de envio aparece no pedido de memorial')

  /* Sem SMTP configurado o botão fica desabilitado, explicando o motivo — em
     vez de deixar clicar e falhar depois. */
  const desabilitado = await botao.isDisabled()
  const aviso = await cartao.innerText()
  if (desabilitado) {
    conf(/não foi configurado/i.test(aviso), 'botão desabilitado explica que falta configurar o SMTP')
  } else {
    conf(true, 'SMTP configurado: botão habilitado')
  }

  await prisma.inquiry.delete({ where: { id: pedido.id } })

  conf(erros.length === 0, 'nenhum erro de JavaScript', erros[0] ?? '')
} finally {
  await prisma.inquiry.deleteMany({ where: { email: { endsWith: '@exemplo.invalid' } } })
  await prisma.boat.updateMany({ where: { slug: { startsWith: 'zz-' } }, data: { published: false } })
  await prisma.$disconnect()
  await navegador.close()
}

console.log(falhas === 0 ? '\nTodos os casos passaram.' : `\n${falhas} caso(s) falharam.`)
process.exit(falhas === 0 ? 0 : 1)
