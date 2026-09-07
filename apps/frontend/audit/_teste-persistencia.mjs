/*
 * Persistência: o que é salvo continua salvo?
 *
 * Cobre os casos em que dados somem sem ninguém pedir — salvar sem mexer nos
 * repetidores, apagar todos os itens de uma lista, e duas abas salvando o
 * mesmo modelo ao mesmo tempo.
 *
 *   npx tsx audit/_teste-persistencia.mjs
 *
 * Nos cliques de salvar, o seletor é `button[type="submit"]:not(dialog *)`:
 * a página tem um segundo submit — o de confirmar exclusão — que vive dentro
 * do <dialog> e começa escondido.
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
const ALVO = 'coral-36-aberta'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

let falhas = 0
const conf = (cond, texto, extra = '') => {
  if (!cond) falhas++
  console.log(`${cond ? '  ok  ' : ' FALHA'} ${texto}${extra ? '  ' + extra : ''}`)
}

const contar = async () => {
  const b = await prisma.boat.findUnique({
    where: { slug: ALVO },
    include: { images: true, equipment: true },
  })
  return {
    fotos: b.images.length,
    equip: b.equipment.length,
    perf: Array.isArray(b.performance) ? b.performance.length : 0,
    nome: b.name,
    familia: b.familyId,
  }
}

const navegador = await chromium.launch()
const ctx = await navegador.newContext({ viewport: { width: 1400, height: 950 } })
const p = await ctx.newPage()

await p.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' })
await p.fill('input[name="email"]', EMAIL)
await p.fill('input[name="password"]', SENHA)
await p.click('button[type="submit"]:not(dialog *)')
await p.waitForURL(/\/admin$/, { timeout: 30000 })

/* Cópia do registro antes de qualquer alteração, para devolver tudo ao fim.
   O teste mexe num modelo real e publicado. */
const snapshot = await prisma.boat.findUnique({ where: { slug: ALVO } })

const antes = await contar()
console.log(`estado inicial: ${antes.fotos} fotos, ${antes.equip} equipamentos, ${antes.perf} motorizações\n`)

console.log('--- SALVAR SEM MEXER EM NADA ---')
await p.goto(`${BASE}/admin/boats/${ALVO}`, { waitUntil: 'domcontentloaded' })
await p.click('button[type="submit"]:not(dialog *)')
await p.waitForURL(/saved=1/, { timeout: 40000 })

const depois = await contar()
conf(depois.fotos === antes.fotos, 'fotos preservadas', `${antes.fotos} -> ${depois.fotos}`)
conf(depois.equip === antes.equip, 'equipamentos preservados', `${antes.equip} -> ${depois.equip}`)
conf(depois.perf === antes.perf, 'motorizações preservadas', `${antes.perf} -> ${depois.perf}`)
conf(depois.familia === antes.familia, 'família preservada')
conf(depois.nome === antes.nome, 'nome preservado')

console.log('\n--- QUATRO ABAS SALVANDO AO MESMO TEMPO ---')
// Quatro abas, não duas: quanto mais concorrência, mais chance de expor a
// corrida caso a trava não estivesse funcionando.
const abas = []
for (let i = 0; i < 4; i++) {
  const aba = await ctx.newPage()
  await aba.goto(`${BASE}/admin/boats/${ALVO}`, { waitUntil: 'domcontentloaded' })
  await aba.fill('input[name="tagline"]', `Chamada da aba ${i + 1}`)
  abas.push(aba)
}

await Promise.all(
  abas.map((aba) =>
    aba
      .click('button[type="submit"]:not(dialog *)')
      .then(() => aba.waitForURL(/saved=1/, { timeout: 60000 }))
      .catch(() => {}),
  ),
)

const conc = await contar()
const b = await prisma.boat.findUnique({ where: { slug: ALVO } })
// O último a gravar vence — o que não pode é o registro ficar sem fotos ou
// com os filhos duplicados por causa do delete+create dentro da transação.
conf(conc.fotos === antes.fotos, 'fotos intactas depois de 4 saves simultâneos', `${antes.fotos} -> ${conc.fotos}`)
conf(conc.equip === antes.equip, 'equipamentos intactos (sem duplicar nem sumir)', `${antes.equip} -> ${conc.equip}`)
conf(/Chamada da aba \d/.test(b.tagline ?? ''), 'um dos textos venceu, sem mistura', `-> "${b.tagline}"`)

for (const aba of abas) await aba.close()

console.log('\n--- APAGAR TODAS AS MOTORIZAÇÕES ---')
await p.goto(`${BASE}/admin/boats/${ALVO}`, { waitUntil: 'domcontentloaded' })
const removerPerf = p.locator('button[aria-label="Remover motorização"]')
const qtd = await removerPerf.count()
for (let i = 0; i < qtd; i++) await removerPerf.first().click()
await p.click('button[type="submit"]:not(dialog *)')
await p.waitForURL(/saved=1/, { timeout: 40000 })

const semPerf = await contar()
conf(semPerf.perf === 0, 'remover todas as motorizações realmente limpa', `${antes.perf} -> ${semPerf.perf}`)
conf(semPerf.fotos === antes.fotos, 'fotos não foram afetadas')

console.log('\n--- RESTAURANDO ---')
// `snapshot` foi lido antes de qualquer alteração, no início do teste.
await prisma.boat.update({
  where: { slug: ALVO },
  data: { performance: snapshot.performance ?? undefined, tagline: snapshot.tagline },
})
const restaurado = await contar()
conf(restaurado.perf === antes.perf, 'motorizações restauradas', `-> ${restaurado.perf}`)

const bFinal = await prisma.boat.findUnique({ where: { slug: ALVO } })
conf(bFinal.tagline === snapshot.tagline, 'chamada restaurada')

await navegador.close()
await prisma.$disconnect()
console.log(falhas === 0 ? '\nTodos os casos passaram.' : `\n${falhas} caso(s) falharam.`)
process.exit(falhas === 0 ? 0 : 1)
