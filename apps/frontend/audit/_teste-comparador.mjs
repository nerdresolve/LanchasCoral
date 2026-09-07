/*
 * Comparação entre modelos, de ponta a ponta.
 *
 *   npx tsx audit/_teste-comparador.mjs
 *
 * Percorre o fluxo real: ícone no cartão, barra que segue entre as telas,
 * painel em tela cheia, e o link compartilhável. Não altera nada no banco.
 *
 * Nos cliques de salvar, o seletor é `button[type="submit"]:not(dialog *)`:
 * a página tem um segundo submit — o de confirmar exclusão — que vive dentro
 * do <dialog> e começa escondido.
 */
import { chromium } from '@playwright/test'

const BASE = 'https://coral.nerdresolve.com'

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
  console.log('--- O ÍCONE ESTÁ EM TODA TELA COM LANCHA ---')
  for (const [rota, minimo] of [['/modelos', 18], ['/', 3]]) {
    await p.goto(`${BASE}${rota}`, { waitUntil: 'networkidle' })
    const n = await p.locator('button[aria-label*="Comparar"]').count()
    conf(n >= minimo, `${rota} tem o ícone nos cartões`, `${n} ícones`)
  }

  await p.goto(`${BASE}/modelos/coral-36-aberta`, { waitUntil: 'networkidle' })
  conf(
    (await p.locator('button:has-text("Comparar")').count()) === 1,
    'a ficha do modelo tem o botão de comparar',
  )

  console.log('\n--- UM CLIQUE ABRE A LISTA, SEM SAIR DA PÁGINA ---')
  /*
   * O fluxo antigo custava três tempos: marcar uma lancha, caçar a segunda
   * (às vezes em outra página), clicar em "ver comparação" e ser levado para
   * /comparar. Agora o ícone pergunta direto com qual comparar.
   *
   * O cartão inteiro é um <Link>: sem `stopPropagation` no gatilho E na raiz
   * do menu (que vive num portal, mas propaga pela árvore do React), o
   * clique levaria à ficha do modelo em vez de abrir a lista.
   */
  await p.goto(`${BASE}/modelos`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  const antes = p.url()

  await p.locator('button[aria-label*="Comparar"]').first().click()
  await p.waitForTimeout(1200)
  conf(p.url() === antes, 'clicar no ícone não sai da página')

  const menu = p.locator('[role="listbox"]')
  conf((await menu.count()) === 1, 'a lista abre no clique')
  conf(
    (await menu.locator('[role="option"]').count()) === 17,
    'traz as outras 17 lanchas',
    `${await menu.locator('[role="option"]').count()}`,
  )

  /* Ancorado ao gatilho e dentro da janela: o menu nasce num portal no body,
     então não herda posição — ela é medida e escrita em coordenadas. */
  const cabe = await p.locator('[data-menu]').evaluate((el) => {
    const r = el.getBoundingClientRect()
    return r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1
  })
  conf(cabe, 'o menu cabe na janela')

  console.log('\n--- ESCOLHER ABRE O MODAL ALI MESMO ---')
  await menu.locator('[role="option"]').nth(2).click()
  await p.waitForTimeout(3000)

  const painel = p.locator('[role="dialog"][aria-label*="Comparação"]')
  conf((await painel.count()) === 1, 'o painel abre sobre a página')
  conf(p.url() === antes, 'e continua na mesma página — nada de navegar')

  const texto = await painel.innerText()
  conf(/Dimens/i.test(texto), 'mostra as dimensões')
  conf(/Capacidade/i.test(texto), 'mostra a capacidade')
  conf(/Motoriza/i.test(texto), 'mostra a motorização')
  conf(/\+[\d,]+\s*(m|HP|L|kg)/.test(texto), 'destaca a diferença numérica')

  /* Cobre a janela inteira: um painel que deixasse a página aparecer atrás
     confundiria o toque no celular. */
  const cobre = await painel.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return r.top === 0 && r.left === 0 && r.width === innerWidth && r.height === innerHeight
  })
  conf(cobre, 'cobre a janela inteira')

  conf(
    await p.evaluate(() => getComputedStyle(document.body).overflow === 'hidden'),
    'trava a rolagem do fundo',
  )

  console.log('\n--- TROCAR DE MODELO SEM SAIR ---')
  /* É o que separa uma ferramenta de um documento: antes, olhar um terceiro
     modelo exigia fechar o painel, desmarcar, escolher e reabrir. */
  const trocar = painel.locator('button:has-text("Trocar")')
  conf((await trocar.count()) === 2, 'cada lado tem seu botão de trocar')

  const antesDaTroca = await painel.locator('h2').first().innerText()
  await trocar.first().click()
  await p.waitForTimeout(700)

  const lista = p.locator('[role="listbox"]')
  conf((await lista.count()) === 1, 'a lista de modelos abre')
  conf((await lista.locator('[role="option"]').count()) === 17, 'traz os outros 17 modelos')

  await lista.locator('[role="option"]').nth(9).click()
  await p.waitForTimeout(2500)

  conf((await p.locator('[role="dialog"]').count()) === 1, 'o painel continua aberto')
  conf(
    (await painel.locator('h2').first().innerText()) !== antesDaTroca,
    'o modelo do lado esquerdo mudou',
  )
  conf(/Dimens/i.test(await painel.innerText()), 'a tabela se atualizou')

  console.log('\n--- A ESCOLHA INICIAL EM /comparar ---')
  /*
   * Esta seção faltava, e por isso o seletor antigo sobreviveu: a suíte só
   * exercitava o painel, nunca a tela de quem chega em /comparar sem
   * parâmetro. Ali havia dois <select> nativos rotulados "1" e "2" — sem
   * foto, num vazio.
   *
   * Aba própria: navegar para /comparar destruiria o painel que as seções
   * seguintes ainda usam — o teste quebrava o teste.
   */
  const ce = await navegador.newContext({ viewport: { width: 1400, height: 950 } })
  const pe = await ce.newPage()
  await pe.goto(`${BASE}/comparar`, { waitUntil: 'networkidle' })
  await pe.waitForTimeout(900)

  conf((await pe.locator('select').count()) === 0, 'nada de <select> nativo na escolha')

  const cartoes = pe.locator('ul li button')
  conf((await cartoes.count()) === 18, 'mostra os 18 modelos', `${await cartoes.count()}`)
  conf(
    (await pe.locator('ul li button img').count()) === 18,
    'cada um com sua foto — é uma página de escolher olhando',
  )

  const primeiro = await cartoes.first().innerText()
  await cartoes.first().click()
  await pe.waitForTimeout(1800)

  conf(/[?&]a=/.test(pe.url()), 'o primeiro clique vai para a URL', new URL(pe.url()).search)
  conf((await cartoes.count()) === 17, 'o escolhido sai da grade')
  /* Sem isto o cartão só sumia e o visitante não via a própria escolha. */
  conf(
    (await pe.locator('body').innerText()).includes(primeiro.split('\n')[0]),
    'o modelo escolhido continua à vista',
    primeiro.split('\n')[0],
  )

  await cartoes.first().click()
  await pe.waitForTimeout(2500)

  conf(/[?&]a=.+[?&]b=/.test(pe.url()), 'o segundo clique completa o par', new URL(pe.url()).search)
  conf((await pe.locator('dl > div').count()) > 0, 'a comparação aparece')
  conf(
    (await pe.locator('button:has-text("Trocar")').count()) === 2,
    'e passa a ser o botão de cada lado que troca',
  )
  conf(
    (await pe.locator('ul li button img').count()) === 0,
    'a grade de escolha some com o par completo — um caminho só',
  )

  await ce.close()

  console.log('\n--- A LISTA CABE NA TELA, EM QUALQUER TAMANHO ---')
  /*
   * Três defeitos que já aconteceram e que só a medição pega:
   *
   * A lista sangrava pela lateral no celular — ancorada à direita, com o
   * botão perto da borda. Virou folha presa à base; daí a checagem de largura.
   *
   * Abria para cima e o cabeçalho fixo tapava o campo de busca: medir o
   * espaço contra a janela ignorava os 76px do menu.
   *
   * E passava da base da janela porque o `max-height` estava na lista
   * interna, não na caixa: busca e puxador cresciam por fora da conta.
   */
  for (const [nome, vp] of [
    ['celular', { width: 390, height: 844 }],
    ['desktop', { width: 1400, height: 950 }],
  ]) {
    const c2 = await navegador.newContext({
      viewport: vp,
      isMobile: vp.width < 500,
      hasTouch: vp.width < 500,
    })
    const p2 = await c2.newPage()
    await p2.goto(`${BASE}/comparar?a=coral-36-aberta&b=coral-36-cabinada`, {
      waitUntil: 'networkidle',
    })
    await p2.waitForTimeout(1200)

    /* O botão da DIREITA é o pior caso: é o que fica junto da borda. */
    await p2.locator('button:has-text("Trocar")').last().click()
    await p2.waitForTimeout(700)

    const cx = p2.locator('[role="listbox"]').locator('xpath=..')
    const m = await cx.evaluate((el) => {
      const r = el.getBoundingClientRect()
      const cab =
        parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0
      return {
        esq: Math.round(r.left), dir: Math.round(r.right),
        topo: Math.round(r.top), base: Math.round(r.bottom),
        vw: innerWidth, vh: innerHeight, cab,
      }
    })
    conf(m.esq >= -1 && m.dir <= m.vw + 1, `${nome}: nao sangra pelas laterais`, JSON.stringify(m))
    conf(m.topo >= -1 && m.base <= m.vh + 1, `${nome}: nao passa do topo nem da base`)
    conf(m.topo >= m.cab - 1, `${nome}: nao fica atras do cabecalho fixo`)

    /* Estar na tela não basta: outra camada pode cobrir. */
    const alcanca = await p2
      .locator('input[placeholder]')
      .last()
      .evaluate((el) => {
        const r = el.getBoundingClientRect()
        const topo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        return !!topo && (topo === el || el.contains(topo))
      })
    conf(alcanca, `${nome}: o campo de busca esta de fato alcancavel`)

    const cortadas = await p2
      .locator('[role="option"] img')
      .evaluateAll((els) =>
        els.filter((e) => {
          const r = e.getBoundingClientRect()
          return r.left < -1 || r.right > innerWidth + 1
        }).length,
      )
    conf(cortadas === 0, `${nome}: nenhuma miniatura cortada`, `${cortadas} fora`)

    await p2.locator('input[placeholder]').last().fill('cabin')
    await p2.waitForTimeout(400)
    const nb = await p2.locator('[role="option"]').count()
    conf(nb > 0 && nb < 17, `${nome}: a busca filtra`, `cabin -> ${nb}`)

    await c2.close()
  }

  console.log('\n--- ALINHAMENTO NO CELULAR ---')
  /*
   * Nenhum caso pegava isto, e o desalinhamento chegou ao ar: os botões dos
   * dois lados ficavam 39px desencontrados porque cada coluna empilhava por
   * conta própria — uma descrição de três linhas contra uma de duas.
   *
   * O selo de diferença dava três defeitos conforme a largura: quebrava a
   * linha (74px contra 57px das vizinhas), furava a coluna e encostava na
   * borda da tela, ou truncava para "+100…" e perdia o dado. Foi para a
   * coluna do meio, sob o rótulo, onde pertence à linha e não a um lado.
   */
  for (const largura of [390, 360, 320]) {
    const ca = await navegador.newContext({
      viewport: { width: largura, height: 800 },
      isMobile: true,
      hasTouch: true,
    })
    const pa = await ca.newPage()
    await pa.goto(`${BASE}/comparar?a=coral-36-aberta&b=coral-36-cabinada`, {
      waitUntil: 'networkidle',
    })
    await pa.waitForTimeout(1500)

    /* Os botões dos dois lados na mesma altura. */
    const botoes = await pa
      .locator('button:has-text("SOLICITAR PROPOSTA"), a:has-text("VER FICHA")')
      .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)))
    const desencontro =
      botoes.length === 4 ? Math.abs(botoes[0] - botoes[2]) + Math.abs(botoes[1] - botoes[3]) : -1
    conf(desencontro === 0, `${largura}px: os botões dos dois lados alinham`, `${desencontro}px`)

    /* Nada pode encostar na borda da tela nem gerar rolagem lateral. */
    const rolagem = await pa.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    conf(!rolagem, `${largura}px: sem rolagem horizontal`)

    const naBorda = await pa.evaluate((vw) => {
      const selos = [...document.querySelectorAll('dl > div span')].filter((s) =>
        /^\+/.test(s.textContent.trim()),
      )
      return selos.filter((s) => s.getBoundingClientRect().right > vw - 4).length
    }, largura)
    conf(naBorda === 0, `${largura}px: nenhum selo encosta na borda`, `${naBorda} na borda`)

    /* O selo mostra o dado inteiro: "+100…" perde o que a linha existe para
       dizer. */
    const truncados = await pa.evaluate(() =>
      [...document.querySelectorAll('dl > div span')]
        .filter((s) => /^\+/.test(s.textContent.trim()))
        .filter((s) => s.scrollWidth > s.clientWidth + 1).length,
    )
    conf(truncados === 0, `${largura}px: nenhum selo cortado`, `${truncados} cortados`)

    /* Os dois números de cada linha na mesma altura, e o número nunca parte
       ao meio. */
    const linhas = await pa.evaluate(() =>
      [...document.querySelectorAll('dl > div')].map((e) => {
        const dds = e.querySelectorAll('dd')
        const a = dds[0]?.querySelector('span span')?.getBoundingClientRect()
        const b = dds[1]?.querySelector('span span')?.getBoundingClientRect()
        const alturas = [...e.querySelectorAll('dd span span')].map((v) =>
          Math.round(v.getBoundingClientRect().height),
        )
        return {
          desnivel: a && b ? Math.abs(Math.round(a.top - b.top)) : 0,
          partido: alturas.some((h) => h > 26),
        }
      }),
    )
    const desnivelados = linhas.filter((l) => l.desnivel > 1).length
    conf(desnivelados === 0, `${largura}px: os valores de cada linha alinham`, `${desnivelados}`)
    conf(
      linhas.filter((l) => l.partido).length === 0,
      `${largura}px: nenhum número parte ao meio`,
    )

    await ca.close()
  }

  console.log('\n--- MOSTRA SEMPRE TUDO ---')
  /*
   * Havia um filtro "só o que difere". Saiu: quem compara quer o quadro
   * inteiro, e o que coincide também informa — duas versões do mesmo casco
   * terem a mesma boca é resposta, não ruído.
   *
   * Estes casos garantem que ele não voltou e que as linhas iguais continuam
   * na tela.
   */
  conf(
    (await painel.locator('button:has-text("difere")').count()) === 0,
    'o filtro de diferencas nao existe mais',
  )
  conf(
    (await painel.locator('button:has-text("Mostrar tudo")').count()) === 0,
    'nem o botao de voltar a mostrar tudo',
  )

  const c3 = await navegador.newContext({ viewport: { width: 1400, height: 950 } })
  const p3 = await c3.newPage()
  await p3.goto(`${BASE}/comparar?a=coral-36-aberta&b=coral-36-cabinada`, {
    waitUntil: 'networkidle',
  })
  await p3.waitForTimeout(1000)
  /* As duas versões do 36 compartilham o casco: 14 linhas, das quais 10
     coincidem. Se alguém reintroduzir o corte, este número cai para 4. */
  const todas = await p3.locator('dl > div').count()
  conf(todas >= 14, 'um par de casco comum mostra todas as linhas', `${todas} linhas`)
  const iguais = await p3.locator('dl > div[data-iguais]').count()
  conf(iguais > 0, 'e as linhas iguais seguem visiveis', `${iguais} iguais`)
  await c3.close()

  console.log('\n--- GALERIA E PROPOSTA DENTRO DO PAINEL ---')
  const pontos = painel.locator('button[aria-label*="/"]')
  conf((await pontos.count()) > 0, 'dá para trocar a foto', `${await pontos.count()} miniaturas`)
  conf(
    (await painel.locator('button:has-text("Solicitar proposta")').count()) === 2,
    'cada lado tem seu botão de proposta',
  )

  console.log('\n--- FECHAR VOLTA PARA ONDE ESTAVA ---')
  const urlAntesDeFechar = p.url()
  await p.keyboard.press('Escape')
  await p.waitForTimeout(600)
  conf((await p.locator('[role="dialog"]').count()) === 0, 'Esc fecha o painel')
  conf(p.url() === urlAntesDeFechar, 'e não navega para outro lugar')

  console.log('\n--- O LINK COMPARTILHÁVEL ---')
  const r = await p.goto(
    `${BASE}/comparar?a=coral-36-aberta&b=coral-36-cabinada`,
    { waitUntil: 'networkidle' },
  )
  conf(r?.status() === 200, 'a página /comparar abre', `-> ${r?.status()}`)

  const corpo = await p.locator('body').innerText()
  conf(corpo.includes('Coral 36 Aberta'), 'mostra o primeiro modelo')
  conf(corpo.includes('Coral 36 Cabinada'), 'mostra o segundo')
  conf(/Pé-direito/i.test(corpo), 'traz a linha que difere entre as duas versões')

  console.log('\n--- SÓ AS LANCHAS COMUNS, NUNCA O BROKER ---')
  await p.goto(`${BASE}/broker`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  conf(
    (await p.locator('button[aria-label*="Comparar"]').count()) === 0,
    'o Broker não tem ícone de comparar',
  )

  console.log('\n--- ENTRADA INVÁLIDA ---')
  const igual = await p.goto(`${BASE}/comparar?a=coral-23&b=coral-23`, { waitUntil: 'domcontentloaded' })
  conf(igual?.status() === 200, 'comparar um modelo com ele mesmo não quebra', `-> ${igual?.status()}`)

  const inexistente = await p.goto(`${BASE}/comparar?a=nao-existe&b=coral-23`, { waitUntil: 'domcontentloaded' })
  conf(inexistente?.status() === 200, 'slug inexistente não quebra', `-> ${inexistente?.status()}`)

  const api = await fetch(`${BASE}/api/comparar?a=nao-existe&b=coral-23`)
  conf(api.status === 404, 'a API recusa modelo inexistente', `-> ${api.status}`)

  const apiIgual = await fetch(`${BASE}/api/comparar?a=coral-23&b=coral-23`)
  conf(apiIgual.status === 400, 'a API recusa dois iguais', `-> ${apiIgual.status}`)

  conf(erros.length === 0, 'nenhum erro de JavaScript', erros[0] ?? '')
} finally {
  await navegador.close()
}

console.log(falhas === 0 ? '\nTodos os casos passaram.' : `\n${falhas} caso(s) falharam.`)
process.exit(falhas === 0 ? 0 : 1)
