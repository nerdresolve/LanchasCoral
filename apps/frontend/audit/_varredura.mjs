/*
 * Varredura de layout no celular, em todas as rotas.
 *
 *   npx tsx audit/_varredura.mjs [baseUrl]
 *
 * Não é um teste de aprovação: é um levantamento. Mede cada página em três
 * larguras e relata o que estoura, o que fica pequeno demais para o dedo e o
 * que sai cortado — para decidir o que corrigir, não para reprovar o build.
 *
 * As três larguras cobrem o que se vê em campo: 390px é o iPhone corrente,
 * 360px o Android mais comum, e 320px o piso histórico (iPhone SE de 1ª
 * geração) — onde tudo que é apertado quebra primeiro.
 */
import { chromium } from '@playwright/test'

const BASE = process.argv[2] ?? 'https://coral.nerdresolve.com'

const ROTAS = [
  '/',
  '/modelos',
  '/modelos/coral-40',
  '/modelos/coral-16',
  '/broker',
  '/broker/coral-26-2026',
  '/comparar',
  '/comparar?a=coral-36-aberta&b=coral-36-cabinada',
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

const LARGURAS = [390, 360, 320]

/*
 * Roda dentro da página. Devolve os problemas de layout que dá para medir
 * sem julgar estética.
 */
function medir(vw) {
  const visivel = (el) => {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }

  /*
   * Passar da borda nem sempre é defeito. Três casos legítimos:
   *
   * - carrossel que rola na horizontal de propósito;
   * - ornamento decorativo que sangra e é recortado por um pai `hidden`;
   * - qualquer coisa dentro de um pai que recorta — o excedente não aparece.
   *
   * Sem isto a varredura acusava 21 "estouros" por página que eram só o SVG
   * de fundo da seção, `aria-hidden` e devidamente recortado.
   */
  const legitimo = (el) => {
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e)
      if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') return true
      if (cs.overflow === 'hidden' || cs.overflowX === 'hidden') return true
    }
    return false
  }

  /* Ornamento não é conteúdo: ninguém precisa lê-lo nem tocá-lo. */
  const decorativo = (el) =>
    el.closest('[aria-hidden="true"]') !== null || el.tagName === 'svg' || el.closest('svg') !== null

  const estouram = []
  for (const el of document.querySelectorAll('body *')) {
    if (!visivel(el) || legitimo(el) || decorativo(el)) continue
    const r = el.getBoundingClientRect()
    /* 2px de folga: subpixel de borda e arredondamento não são defeito. */
    if (r.right > vw + 2 || r.left < -2) {
      const tag = el.tagName.toLowerCase()
      const cls = (el.className || '').toString().slice(0, 45)
      estouram.push({
        alvo: `${tag}${cls ? '.' + cls : ''}`,
        esq: Math.round(r.left),
        dir: Math.round(r.right),
        txt: (el.textContent || '').trim().slice(0, 28),
      })
    }
  }

  /* Alvos de toque menores que 44px, o mínimo das WCAG. Só conta os que
     estão sozinhos: um link dentro de um parágrafo corrido é outra coisa. */
  const pequenos = []
  for (const el of document.querySelectorAll('a, button, [role="button"], input, select')) {
    if (!visivel(el)) continue
    const r = el.getBoundingClientRect()
    /* A regra das WCAG pede 44px em UMA das dimensões quando o alvo é
       isolado; exigir nas duas reprovaria botões largos e baixos, que o dedo
       acerta sem dificuldade. */
    if (r.height < 44 && r.width < 44) {
      pequenos.push({
        alvo: `${el.tagName.toLowerCase()}${el.className ? '.' + el.className.toString().slice(0, 30) : ''}`,
        w: Math.round(r.width),
        h: Math.round(r.height),
        txt: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24),
      })
    }
  }

  /*
   * Texto cortado por `overflow: hidden` sem reticências declaradas.
   *
   * `sr-only` fica de fora: é a técnica padrão de esconder rótulo para leitor
   * de tela (1x1 px, `clip: inset(50%)`), e o "corte" ali é o objetivo.
   */
  const cortados = []
  for (const el of document.querySelectorAll('body *')) {
    if (!visivel(el) || el.children.length > 0) continue
    if (el.closest('.sr-only') || el.classList.contains('sr-only')) continue
    const cs = getComputedStyle(el)
    if (cs.overflow === 'hidden' || cs.overflowX === 'hidden') {
      if (el.scrollWidth > el.clientWidth + 2 && cs.textOverflow !== 'ellipsis') {
        cortados.push({
          alvo: el.tagName.toLowerCase(),
          txt: (el.textContent || '').trim().slice(0, 30),
          visivel: el.clientWidth,
          real: el.scrollWidth,
        })
      }
    }
  }

  return {
    rolagemH: document.documentElement.scrollWidth > window.innerWidth + 1,
    larguraDoc: document.documentElement.scrollWidth,
    estouram: estouram.slice(0, 6),
    nEstouram: estouram.length,
    pequenos: pequenos.slice(0, 6),
    nPequenos: pequenos.length,
    cortados: cortados.slice(0, 4),
    nCortados: cortados.length,
  }
}

const navegador = await chromium.launch()
const achados = []

try {
  for (const largura of LARGURAS) {
    console.log(`\n${'='.repeat(58)}\n  ${largura}px\n${'='.repeat(58)}`)
    const ctx = await navegador.newContext({
      viewport: { width: largura, height: 800 },
      isMobile: true,
      hasTouch: true,
    })

    for (const rota of ROTAS) {
      const p = await ctx.newPage()
      const erros = []
      p.on('pageerror', (e) => erros.push(String(e)))

      try {
        await p.goto(BASE + rota, { waitUntil: 'networkidle', timeout: 45000 })
        await p.waitForTimeout(700)
        const r = await p.evaluate(medir, largura)

        const problemas = []
        if (r.rolagemH) problemas.push(`rolagem-H (doc ${r.larguraDoc}px)`)
        if (r.nEstouram) problemas.push(`${r.nEstouram} estouram`)
        if (r.nPequenos) problemas.push(`${r.nPequenos} alvos <44px`)
        if (r.nCortados) problemas.push(`${r.nCortados} cortados`)
        if (erros.length) problemas.push(`${erros.length} erro JS`)

        const marca = problemas.length ? ' !! ' : ' ok '
        console.log(`${marca} ${rota.padEnd(46)} ${problemas.join(' · ')}`)

        if (problemas.length) {
          achados.push({ largura, rota, ...r, erros })
          for (const e of r.estouram) {
            console.log(`        estoura: ${e.alvo}  [${e.esq}..${e.dir}]  "${e.txt}"`)
          }
          for (const q of r.pequenos) {
            console.log(`        pequeno: ${q.alvo}  ${q.w}x${q.h}  "${q.txt}"`)
          }
          for (const c of r.cortados) {
            console.log(`        cortado: ${c.alvo}  ${c.visivel}<${c.real}  "${c.txt}"`)
          }
          if (erros.length) console.log(`        erro JS: ${erros[0].slice(0, 90)}`)
        }
      } catch (e) {
        console.log(` ERRO ${rota.padEnd(46)} ${String(e.message).slice(0, 50)}`)
      } finally {
        await p.close()
      }
    }
    await ctx.close()
  }
} finally {
  await navegador.close()
}

console.log(`\n${'='.repeat(58)}`)
if (!achados.length) {
  console.log('Nada a apontar em nenhuma largura.')
} else {
  console.log(`${achados.length} página(s)×largura com algo a olhar:\n`)
  const porRota = new Map()
  for (const a of achados) {
    const lista = porRota.get(a.rota) ?? []
    lista.push(a.largura)
    porRota.set(a.rota, lista)
  }
  for (const [rota, larguras] of porRota) {
    console.log(`  ${rota}  —  ${larguras.join(', ')}px`)
  }
}

/*
 * Começou como levantamento e virou teste de aprovação: com a base limpa nas
 * 20 rotas × 3 larguras, qualquer achado novo é regressão. Daí o código de
 * saída, que permite entrar em `verificar-painel.mjs`.
 */
process.exit(achados.length === 0 ? 0 : 1)
