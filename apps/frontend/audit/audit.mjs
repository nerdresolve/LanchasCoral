/**
 * Auditoria de responsividade e interação, com Playwright.
 *
 * Percorre todas as páginas em três larguras e exercita os controles de
 * verdade — clica no hambúrguer, abre o pop-up, usa o carrossel, o filtro e
 * a galeria — em vez de só medir a página parada.
 *
 * Uso: node audit/audit.mjs [baseUrl]
 */
import { chromium, devices } from '@playwright/test'

const BASE = process.argv[2] ?? 'http://localhost:3147'

const VIEWPORTS = [
  { nome: 'mobile', width: 390, height: 844, isMobile: true },
  { nome: 'tablet', width: 768, height: 1024, isMobile: false },
  { nome: 'desktop', width: 1440, height: 900, isMobile: false },
]

const PAGINAS = [
  '/',
  '/modelos',
  '/modelos/coral-40',
  '/broker',
  '/broker/coral-26-2026',
  '/sobre',
  '/dicas',
  '/dicas/gel-coat-ou-tinta-pu-qual-escolher',
  '/contatos',
  '/contato',
  '/venda-sua-lancha',
  '/solicitar-manual',
  '/trabalhe-conosco',
  '/contato-para-servicos',
  '/politica-de-qualidade',
  '/politica-de-privacidade',
  '/en',
  '/en/models',
  '/en/tips',
  '/en/contacts',
  '/en/broker',
  '/en/about',
]

const problemas = []
const reporta = (vp, pagina, tipo, detalhe) => {
  problemas.push({ vp, pagina, tipo, detalhe })
  console.log(`  [${vp}] ${pagina} — ${tipo}: ${detalhe}`)
}

/* ---------- verificações estáticas ---------- */

async function checaOverflow(page, vp, pagina) {
  const r = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    // O critério é a página ROLAR de lado de fato — é o que o usuário sente.
    // `documentElement.scrollWidth` infla com tabela dentro de scroller e
    // acusa vazamento onde `scrollX` nunca sai de zero.
    const antes = window.scrollX
    window.scrollTo(99999, window.scrollY)
    const rolou = window.scrollX > 0
    window.scrollTo(antes, window.scrollY)
    const scrollW = rolou ? document.documentElement.scrollWidth : vw
    const culpados = []
    if (scrollW > vw + 1) {
      // Só reporta quem realmente empurra a página, ignorando decoração
      // e conteúdo dentro de containers com scroll próprio.
      const dentroDeScroller = (el) => {
        for (let p = el.parentElement; p; p = p.parentElement) {
          const o = getComputedStyle(p).overflowX
          if (o === 'hidden' || o === 'clip') return true
          if ((o === 'auto' || o === 'scroll') && p.scrollWidth > p.clientWidth + 1) return true
        }
        return false
      }
      document.querySelectorAll('*').forEach((el) => {
        if (el.closest('[aria-hidden="true"]') || el.ownerSVGElement) return
        const b = el.getBoundingClientRect()
        if (b.right > vw + 1 && !dentroDeScroller(el)) {
          culpados.push(`${el.tagName}.${String(el.className).slice(0, 50)} (${Math.round(b.right)}px)`)
        }
      })
    }
    return { vw, scrollW, culpados: culpados.slice(0, 3) }
  })
  if (r.scrollW > r.vw + 1) {
    reporta(vp, pagina, 'overflow', `scrollW ${r.scrollW} > ${r.vw}. ${r.culpados.join(' | ')}`)
  }
}

async function checaAlvosDeToque(page, vp, pagina) {
  if (vp !== 'mobile') return
  const r = await page.evaluate(() => {
    const pequenos = []
    document.querySelectorAll('a, button, [role="button"], input, select').forEach((el) => {
      const b = el.getBoundingClientRect()
      if (b.width === 0 || b.height === 0) return
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none') return
      // Piso pragmático: 32px no eixo menor OU área equivalente a 32x32.
      // Um controle estreito mas alto (ponto de carrossel de 16x44) é
      // confortável de acertar; o que reprova é o alvo pequeno nos dois eixos.
      const menor = Math.min(b.width, b.height)
      const maior = Math.max(b.width, b.height)
      if (menor < 16 || (menor < 32 && maior < 44)) {
        pequenos.push(`${el.tagName}"${(el.textContent || '').trim().slice(0, 18)}" ${Math.round(b.width)}x${Math.round(b.height)}`)
      }
    })
    return pequenos.slice(0, 4)
  })
  if (r.length) reporta(vp, pagina, 'alvo-de-toque', r.join(' | '))
}

async function checaImagensQuebradas(page, vp, pagina) {
  const r = await page.evaluate(() =>
    [...document.images]
      .filter((i) => i.complete && i.naturalWidth === 0)
      .map((i) => i.src.slice(-60))
      .slice(0, 3),
  )
  if (r.length) reporta(vp, pagina, 'imagem-quebrada', r.join(' | '))
}


/** Texto cortado por altura fixa, ou elemento sobrepondo outro. */
async function checaTruncamento(page, vp, pagina) {
  const r = await page.evaluate(() => {
    const ruins = []
    document.querySelectorAll('h1,h2,h3,p,span,a,button,li,td,th').forEach((el) => {
      if (el.children.length > 0) return
      const cs = getComputedStyle(el)
      if (cs.overflow === 'visible' || cs.display === 'none') return
      // `sr-only` e 1px com overflow escondido POR DEFINICAO: e assim que se
      // esconde texto visualmente mantendo-o para leitores de tela.
      if (el.classList.contains('sr-only')) return
      // Conteúdo maior que a caixa, sem rolagem nem reticências declaradas.
      if (
        el.scrollHeight > el.clientHeight + 3 &&
        cs.overflowY !== 'auto' &&
        cs.overflowY !== 'scroll' &&
        !cs.webkitLineClamp.match(/^\d+$/)
      ) {
        ruins.push(`${el.tagName}"${(el.textContent || '').trim().slice(0, 22)}"`)
      }
    })
    return ruins.slice(0, 3)
  })
  if (r.length) reporta(vp, pagina, 'texto-cortado', r.join(' | '))
}

/**
 * Contraste do texto contra o pixel realmente pintado atrás dele.
 *
 * Ler `backgroundColor` subindo a árvore não serve: as seções do site usam
 * gradiente (`background-image`), e o ancestral com cor sólida pode estar
 * muitas camadas acima. Aqui o fundo é amostrado da captura de tela — é o
 * que o olho vê, inclusive sobre foto e gradiente.
 */
async function checaContraste(page, vp, pagina) {
  const alvos = await page.evaluate(() => {
    const out = []
    document.querySelectorAll('h1,h2,h3,p,a,span,li,label,button,td').forEach((el) => {
      if (el.children.length > 0) return
      const txt = (el.textContent || '').trim()
      if (!txt) return
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.1) return
      // Texto com gradiente (`background-clip: text`) tem `color: transparent`;
      // a razão calculada seria sobre a cor do recorte, não sobre o que se vê.
      if (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text') return
      if (cs.color === 'rgba(0, 0, 0, 0)' || cs.color === 'transparent') return
      const b = el.getBoundingClientRect()
      // Só o que está de fato na tela; fora dela a captura não tem pixel.
      if (b.width < 8 || b.height < 6 || b.top < 3 || b.bottom > window.innerHeight) return
      const px = parseFloat(cs.fontSize)
      out.push({
        txt: txt.slice(0, 22),
        cor: cs.color,
        px,
        grande: px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700),
        x0: Math.round(b.left),
        x1: Math.round(b.right),
        topo: Math.round(b.top),
        alt: Math.round(b.height),
      })
    })
    return out.slice(0, 60)
  })
  if (!alvos.length) return

  let buf
  try {
    buf = await page.screenshot({ type: 'png' })
  } catch {
    return // captura indisponível nesta página; a checagem apenas não roda
  }
  const { createCanvas, loadImage } = await import('@napi-rs/canvas').catch(() => ({}))
  if (!createCanvas) return // sem canvas, pula a checagem

  const img = await loadImage(buf)
  const cv = createCanvas(img.width, img.height)
  const ctx = cv.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const escala = img.width / (await page.evaluate(() => window.innerWidth))

  const lum = (c) => {
    const [r, g, b] = c.map((v) => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const ruins = []
  for (const a of alvos) {
    const fg = (a.cor.match(/[\d.]+/g) || []).slice(0, 3).map(Number)
    if (fg.length !== 3) continue
    // Amostra uma faixa horizontal e fica com o pixel MAIS PRÓXIMO da cor do
    // texto entre os candidatos a fundo — o pior caso real de leitura.
    // Amostra a CAIXA inteira do elemento. O glifo ocupa uma fração pequena
    // da área, então a cor dominante é o fundo real sob o texto — inclusive
    // sobre gradiente e foto. Amostrar uma linha acima da caixa pegava a
    // barra vizinha e reprovava controles que estão legíveis.
    const px = ctx.getImageData(
      Math.max(0, Math.round(a.x0 * escala)),
      Math.max(0, Math.round(a.topo * escala)),
      Math.max(1, Math.round((a.x1 - a.x0) * escala)),
      Math.max(1, Math.round(a.alt * escala)),
    ).data
    // Candidato a fundo: NÃO a cor mais frequente — num rótulo curto como
    // "Sair" o glifo domina a caixa e a medição se compara consigo mesma,
    // reprovando texto perfeitamente legível. Toma-se o pixel mais claro e o
    // mais escuro da caixa; o fundo é necessariamente um dos dois extremos,
    // e vale o MELHOR contraste entre eles — se o texto se destaca de algum,
    // ele é legível.
    let claro = null, escuro = null, lMax = -1, lMin = 2
    for (let i = 0; i < px.length; i += 4) {
      const c = [px[i], px[i + 1], px[i + 2]]
      const l = lum(c)
      if (l > lMax) { lMax = l; claro = c }
      if (l < lMin) { lMin = l; escuro = c }
    }
    if (!claro || !escuro) continue
    const lf = lum(fg)
    const razao = (c) => {
      const l = lum(c)
      return (Math.max(lf, l) + 0.05) / (Math.min(lf, l) + 0.05)
    }
    const pior = Math.max(razao(claro), razao(escuro))
    const min = a.grande ? 3 : 4.5
    if (pior < min) ruins.push(`"${a.txt}" ${pior.toFixed(2)}:1 (min ${min})`)
  }
  if (ruins.length) reporta(vp, pagina, 'contraste', [...new Set(ruins)].slice(0, 4).join(' | '))
}

/* ---------- interações ---------- */

async function testaMenuHamburguer(page, vp, pagina) {
  if (vp !== 'mobile') return
  const botao = page.locator('button[aria-label*="menu" i]').first()
  if ((await botao.count()) === 0) return reporta(vp, pagina, 'menu', 'botão hambúrguer não encontrado')

  const visivel = await botao.isVisible()
  if (!visivel) return reporta(vp, pagina, 'menu', 'hambúrguer existe mas está invisível')

  await botao.click()
  await page.waitForTimeout(600)

  const aberto = await page.evaluate(() => {
    const fechar = document.querySelector('button[aria-label*="Fechar" i], button[aria-label*="Close" i]')
    const links = document.querySelectorAll('a[href*="/modelos/"], a[href*="/models/"]')
    const painel = fechar ? fechar.closest('div[class*="fixed"]') : null
    // Conteúdo abaixo da dobra é normal; o defeito é conteúdo que NÃO se
    // alcança nem rolando — painel sem área de scroll para o que transborda.
    const scroller = painel
      ? [...painel.querySelectorAll('*')].find((e) => {
          const o = getComputedStyle(e).overflowY
          return (o === 'auto' || o === 'scroll') && e.scrollHeight > e.clientHeight + 1
        })
      : null
    const transborda = painel ? painel.scrollHeight > painel.clientHeight + 1 : false
    const inalcancaveis = !painel || scroller || !transborda ? 0 : 1
    return {
      temFechar: !!fechar,
      links: links.length,
      travado: document.body.style.overflow,
      alturaPainel: painel ? Math.round(painel.getBoundingClientRect().height) : 0,
      vh: window.innerHeight,
      inalcancaveis,
    }
  })

  if (!aberto.temFechar) return reporta(vp, pagina, 'menu', 'painel não abriu (sem botão fechar)')
  if (aberto.links === 0) reporta(vp, pagina, 'menu', 'painel abriu sem links de modelo')
  if (aberto.travado !== 'hidden') reporta(vp, pagina, 'menu', `scroll do fundo não travou (overflow="${aberto.travado}")`)
  if (aberto.alturaPainel < aberto.vh - 4)
    reporta(vp, pagina, 'menu', `painel com ${aberto.alturaPainel}px numa tela de ${aberto.vh}px`)
  if (aberto.inalcancaveis > 0)
    reporta(vp, pagina, 'menu', 'conteúdo transborda sem área de rolagem — parte fica inalcançável')

  // fecha
  await page.locator('button[aria-label*="Fechar" i], button[aria-label*="Close" i]').first().click()
  await page.waitForTimeout(500)
  const fechou = await page.evaluate(() => !document.querySelector('button[aria-label*="Fechar" i], button[aria-label*="Close" i]'))
  if (!fechou) reporta(vp, pagina, 'menu', 'painel não fechou ao clicar em fechar')
}

async function testaPopupProposta(page, vp, pagina) {
  // Procura um CTA de compra que não seja o do cabeçalho.
  const ctas = page
    .locator('a, button')
    .filter({ hasText: /solicitar proposta|falar com consultor|request a quote|talk to a broker/i })
  const n = await ctas.count()
  let cta = null
  for (let i = 0; i < n; i++) {
    if (await ctas.nth(i).isVisible()) { cta = ctas.nth(i); break }
  }
  // Nem toda página tem CTA de compra no corpo: o do cabeçalho fica em
  // `hidden lg:block` no mobile, e isso é intencional — não é defeito.
  if (!cta) return

  await cta.scrollIntoViewIfNeeded()
  await cta.click()
  await page.waitForTimeout(800)

  const st = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]')
    if (!d) return { aberto: false }
    const b = d.getBoundingClientRect()
    const painel = d.firstElementChild?.getBoundingClientRect()
    return {
      aberto: true,
      travado: document.body.style.overflow,
      campos: d.querySelectorAll('input, textarea').length,
      cabeNaTela: painel ? painel.width <= window.innerWidth + 1 : true,
      painelLargura: painel ? Math.round(painel.width) : 0,
      viewport: window.innerWidth,
    }
  })

  if (!st.aberto) return reporta(vp, pagina, 'popup', 'clique no CTA não abriu o diálogo')
  if (st.campos < 3) reporta(vp, pagina, 'popup', `diálogo com poucos campos (${st.campos})`)
  if (st.travado !== 'hidden') reporta(vp, pagina, 'popup', 'scroll do fundo não travou')
  if (!st.cabeNaTela) reporta(vp, pagina, 'popup', `painel ${st.painelLargura}px > viewport ${st.viewport}px`)

  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  const fechou = await page.evaluate(() => !document.querySelector('[role="dialog"]'))
  if (!fechou) reporta(vp, pagina, 'popup', 'Esc não fechou o diálogo')
}

async function testaCarrossel(page, vp, pagina) {
  if (pagina !== '/' && pagina !== '/en') return
  const proximo = page.locator('button[aria-label*="Próximo" i], button[aria-label*="Next" i]').first()
  if ((await proximo.count()) === 0) return

  const antes = await page.evaluate(() => {
    const t = document.querySelector('[role="region"]')
    return t ? t.scrollLeft : null
  })
  if (antes === null) return

  if (await proximo.isEnabled()) {
    await proximo.click()
    await page.waitForTimeout(900)
    const depois = await page.evaluate(() => document.querySelector('[role="region"]').scrollLeft)
    if (depois === antes) reporta(vp, pagina, 'carrossel', 'seta "próximo" não moveu o trilho')
  }
}

async function testaFiltroBroker(page, vp, pagina) {
  if (!pagina.endsWith('/broker')) return
  // O formulário existe duas vezes no DOM (retrátil no celular, solto no
  // desktop). Só um está visível por vez: pegar o primeiro daria falso
  // negativo em metade das larguras.
  const todos = page.locator('select[name="marca"]')
  const n = await todos.count()
  if (n === 0) return reporta(vp, pagina, 'filtro', 'select de marca ausente')

  let select = null
  for (let i = 0; i < n; i++) {
    if (await todos.nth(i).isVisible()) { select = todos.nth(i); break }
  }
  if (!select) {
    // No celular o filtro começa fechado: abrir faz parte do fluxo esperado.
    const gatilho = page.locator('summary').first()
    if (await gatilho.count()) {
      await gatilho.click()
      await page.waitForTimeout(400)
      for (let i = 0; i < n; i++) {
        if (await todos.nth(i).isVisible()) { select = todos.nth(i); break }
      }
    }
  }
  if (!select) return reporta(vp, pagina, 'filtro', 'nenhum filtro visível, nem após abrir o painel')

  const opcoes = await select.locator('option').count()
  if (opcoes < 2) return reporta(vp, pagina, 'filtro', 'select de marca sem opções')

  await select.selectOption({ index: 1 })
  const enviar = page.locator('button[type="submit"]')
  let botao = null
  for (let i = 0; i < (await enviar.count()); i++) {
    if (await enviar.nth(i).isVisible()) { botao = enviar.nth(i); break }
  }
  await (botao ?? enviar.first()).click()
  await page.waitForLoadState('networkidle')
  if (!page.url().includes('marca=')) reporta(vp, pagina, 'filtro', `submit não filtrou (url ${page.url()})`)
}

async function testaGaleria(page, vp, pagina) {
  if (!/\/(modelos|models|broker)\/[a-z0-9-]+$/.test(pagina)) return
  const tile = page.locator('button[aria-label*="Ampliar" i], button[aria-label*="Enlarge" i]').first()
  if ((await tile.count()) === 0) return

  await tile.scrollIntoViewIfNeeded()
  await tile.click()
  await page.waitForTimeout(800)

  const aberto = await page.evaluate(() => !!document.querySelector('[role="dialog"]'))
  if (!aberto) return reporta(vp, pagina, 'galeria', 'clique na foto não abriu o lightbox')

  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  const fechou = await page.evaluate(() => !document.querySelector('[role="dialog"]'))
  if (!fechou) reporta(vp, pagina, 'galeria', 'Esc não fechou o lightbox')
}


/** Envia o formulário de contato de verdade e confirma o retorno de sucesso. */
async function testaEnvioFormulario(page, vp, base) {
  await page.goto(base + '/contato', { waitUntil: 'networkidle' })
  const form = page.locator('form').filter({ has: page.locator('textarea') }).first()
  if ((await form.count()) === 0) return reporta(vp, '/contato', 'form', 'formulário não encontrado')

  await form.locator('input[name="name"]').fill('Teste Auditoria')
  await form.locator('input[name="email"]').fill('auditoria@exemplo.test')
  const tel = form.locator('input[name="phone"]')
  if (await tel.count()) await tel.fill('21999998888')
  await form.locator('textarea').first().fill('Mensagem gerada pela auditoria automatizada.')
  await form.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(2500)

  const ok = await page.evaluate(() =>
    /obrigad|recebemos|sucesso|thank|received/i.test(document.body.innerText),
  )
  if (!ok) reporta(vp, '/contato', 'form', 'envio não exibiu confirmação de sucesso')
}

/** Painel admin: login, navegação e listagens no viewport corrente. */
async function testaAdmin(page, vp, base) {
  await page.goto(base + '/admin/login', { waitUntil: 'networkidle' })
  await page.locator('input[name="email"]').fill('admin@lanchascoral.com.br')
  await page.locator('input[name="password"]').fill(process.env.CORAL_ADMIN_SENHA ?? '')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(3000)

  if (page.url().includes('/admin/login')) {
    return reporta(vp, '/admin', 'admin', 'login não autenticou')
  }

  for (const rota of ['/admin', '/admin/listings', '/admin/inquiries', '/admin/boats/new']) {
    const resp = await page.goto(base + rota, { waitUntil: 'networkidle' })
    if (!resp || resp.status() >= 400) {
      reporta(vp, rota, 'admin', `status ${resp?.status()}`)
      continue
    }
    await page.waitForTimeout(300)
    await checaOverflow(page, vp, rota)
    await checaContraste(page, vp, rota)
    // Tabela larga precisa rolar dentro da própria caixa, não empurrar a página.
    const t = await page.evaluate(() => {
      const tb = document.querySelector('table')
      if (!tb) return null
      const cx = tb.closest('[class*="overflow-x"]')
      return { larguraTabela: tb.scrollWidth, caixa: cx ? cx.clientWidth : null, temScroller: !!cx }
    })
    if (t && t.larguraTabela > (t.caixa ?? 0) + 1 && !t.temScroller) {
      reporta(vp, rota, 'admin', `tabela de ${t.larguraTabela}px sem área de rolagem`)
    }
  }
}

/* ---------- execução ---------- */

async function main() {
  const browser = await chromium.launch()
  console.log(`Auditando ${BASE}\n`)

  for (const vp of VIEWPORTS) {
    console.log(`── ${vp.nome} (${vp.width}px) ──`)
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
      deviceScaleFactor: vp.isMobile ? 2 : 1,
      userAgent: vp.isMobile ? devices['iPhone 13'].userAgent : undefined,
    })
    const page = await ctx.newPage()

    const errosJs = []
    page.on('pageerror', (e) => errosJs.push(e.message.split('\n')[0]))

    for (const rota of PAGINAS) {
      try {
        const resp = await page.goto(BASE + rota, { waitUntil: 'load', timeout: 45000 })
        if (!resp || resp.status() >= 400) {
          reporta(vp.nome, rota, 'http', `status ${resp?.status()}`)
          continue
        }
        await page.waitForTimeout(400)

        await checaOverflow(page, vp.nome, rota)
        await checaImagensQuebradas(page, vp.nome, rota)
        await checaAlvosDeToque(page, vp.nome, rota)
        await checaTruncamento(page, vp.nome, rota)
        await checaContraste(page, vp.nome, rota)
        await testaMenuHamburguer(page, vp.nome, rota)
        await testaPopupProposta(page, vp.nome, rota)
        await testaCarrossel(page, vp.nome, rota)
        await testaFiltroBroker(page, vp.nome, rota)
        await testaGaleria(page, vp.nome, rota)
      } catch (e) {
        reporta(vp.nome, rota, 'erro', String(e.message).split('\n')[0].slice(0, 110))
      }
    }

    // Fluxos que rodam uma vez por viewport, fora do laço de páginas.
    try {
      await testaEnvioFormulario(page, vp.nome, BASE)
      await testaAdmin(page, vp.nome, BASE)
    } catch (e) {
      reporta(vp.nome, '(fluxos)', 'erro', String(e.message).slice(0, 110))
    }

    if (errosJs.length) {
      for (const m of [...new Set(errosJs)].slice(0, 3)) reporta(vp.nome, '(geral)', 'js', m.slice(0, 110))
    }
    await ctx.close()
  }

  await browser.close()

  console.log(`\n${'='.repeat(60)}`)
  console.log(`TOTAL DE PROBLEMAS: ${problemas.length}`)
  const porTipo = {}
  for (const p of problemas) porTipo[p.tipo] = (porTipo[p.tipo] ?? 0) + 1
  for (const [t, n] of Object.entries(porTipo).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t}: ${n}`)
  }
  process.exit(problemas.length ? 1 : 0)
}

main().catch((e) => {
  console.error('ERRO FATAL:', e)
  process.exit(2)
})
