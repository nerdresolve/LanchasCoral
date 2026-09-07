/**
 * Lighthouse em todas as páginas, mobile e desktop.
 *
 * Roda sempre contra o build de PRODUÇÃO (`next start`): o modo dev injeta
 * HMR, sourcemaps e overlays que derrubam o desempenho e não representam o
 * que o visitante recebe.
 *
 * Uso: node audit/lh.mjs [baseUrl] [--mobile|--desktop] [rota ...]
 */
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import fs from 'node:fs'

const args = process.argv.slice(2)
const BASE = args.find((a) => a.startsWith('http')) ?? 'http://localhost:3148'
const soMobile = args.includes('--mobile')
const soDesktop = args.includes('--desktop')
const rotasArg = args.filter((a) => a.startsWith('/'))

const PAGINAS = rotasArg.length
  ? rotasArg
  : [
      '/',
      '/modelos',
      '/modelos/coral-40',
      '/broker',
      '/broker/coral-26-2026',
      '/sobre',
      '/contato',
      '/venda-sua-lancha',
      '/solicitar-manual',
      '/trabalhe-conosco',
      '/contato-para-servicos',
      '/politica-de-qualidade',
      '/politica-de-privacidade',
      '/en',
      '/en/models',
      '/en/broker',
      '/en/about',
    ]

const METAS = { performance: 96, accessibility: 100, 'best-practices': 100, seo: 100 }

/** Desktop precisa de override explícito; o padrão do Lighthouse é mobile. */
const CFG_DESKTOP = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'desktop',
    screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    // Desktop não sofre a limitação de rede/CPU do perfil móvel.
    throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
  },
}

const chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] })
const perfis = soMobile ? ['mobile'] : soDesktop ? ['desktop'] : ['mobile', 'desktop']
const linhas = []
const problemas = new Map()

for (const perfil of perfis) {
  console.log(`\n── ${perfil} ──`)
  for (const rota of PAGINAS) {
    let r
    try {
      r = await lighthouse(
        BASE + rota,
        { port: chrome.port, output: 'json', logLevel: 'error' },
        perfil === 'desktop' ? CFG_DESKTOP : undefined,
      )
    } catch (e) {
      console.log(`  ${rota} — ERRO: ${String(e.message).slice(0, 70)}`)
      continue
    }

    const c = r.lhr.categories
    const notas = Object.fromEntries(
      Object.keys(METAS).map((k) => [k, Math.round((c[k]?.score ?? 0) * 100)]),
    )
    const falhou = Object.entries(METAS).filter(([k, min]) => notas[k] < min)
    const marca = falhou.length ? 'X ' : 'OK'
    console.log(
      `  ${marca} ${rota.padEnd(26)} perf=${notas.performance} a11y=${notas.accessibility} bp=${notas['best-practices']} seo=${notas.seo}`,
    )
    linhas.push({ perfil, rota, ...notas })

    // Junta as auditorias reprovadas, com o peso que cada uma custa.
    for (const [cat] of falhou) {
      for (const ref of c[cat].auditRefs) {
        const a = r.lhr.audits[ref.id]
        if (!a || a.score === null || a.score >= 0.9) continue
        const chave = `${cat}|${a.id}`
        const at = problemas.get(chave) ?? { cat, id: a.id, titulo: a.title, rotas: [], peso: 0, exemplo: '' }
        at.rotas.push(`${perfil}${rota}`)
        at.peso += (ref.weight ?? 0) * (1 - a.score)
        if (!at.exemplo && a.displayValue) at.exemplo = a.displayValue
        problemas.set(chave, at)
      }
    }
  }
}

await chrome.kill()

console.log(`\n${'='.repeat(66)}`)
for (const k of Object.keys(METAS)) {
  const vals = linhas.map((l) => l[k])
  const min = Math.min(...vals)
  const reprovadas = linhas.filter((l) => l[k] < METAS[k]).length
  console.log(
    `${k.padEnd(15)} min=${String(min).padStart(3)} meta=${METAS[k]}  ${reprovadas ? `${reprovadas} páginas abaixo` : 'todas ok'}`,
  )
}

const ord = [...problemas.values()].sort((a, b) => b.peso - a.peso)
if (ord.length) {
  console.log(`\n--- auditorias a corrigir (por impacto) ---`)
  for (const p of ord.slice(0, 16)) {
    console.log(`  [${p.cat}] ${p.id} — ${p.titulo.slice(0, 62)}`)
    console.log(`      peso=${p.peso.toFixed(1)} em ${p.rotas.length} páginas ${p.exemplo ? `· ${p.exemplo}` : ''}`)
  }
}

fs.writeFileSync('audit/_lh.json', JSON.stringify({ linhas, problemas: ord }, null, 1))
const falhas = linhas.filter((l) => Object.keys(METAS).some((k) => l[k] < METAS[k])).length
console.log(`\n${linhas.length - falhas}/${linhas.length} execuções dentro da meta`)
process.exit(falhas ? 1 : 0)
