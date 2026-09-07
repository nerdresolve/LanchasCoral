'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import PainelComparacao from './PainelComparacao'
import type { OpcaoModelo } from './TrocarModelo'
import { getDict } from '@/i18n/dictionary'
import type { Locale } from '@/i18n/config'

/**
 * Comparar sem sair do lugar: escolher a outra lancha e ver o resultado.
 *
 * ## O que havia antes, e por que mudou
 *
 * O fluxo anterior era em três tempos: clicar no ícone marcava a lancha, uma
 * barra subia pedindo a segunda, e escolhê-la exigia caçar outro cartão —
 * possivelmente em outra página, com um clique final que levava para
 * `/comparar`. Comparar "o 36 com o 40" custava uma navegação e a memória de
 * qual já estava marcado.
 *
 * Aqui a pergunta é feita uma vez só: a primeira lancha é aquela em que se
 * clicou, e a lista pergunta a segunda. Escolher abre a comparação por cima
 * da página. Ninguém sai de onde estava.
 *
 * ## Posicionamento
 *
 * As mesmas três armadilhas de `TrocarModelo`, pelas mesmas razões: no
 * celular vira folha presa à base (ancorada ao botão, sangrava pela lateral);
 * o espaço acima desconta o cabeçalho fixo, que passaria por cima; e o limite
 * de altura fica no contêiner, não na lista — no filho, o cabeçalho da lista
 * cresce por fora da conta e o conjunto passa da base da janela.
 */

/** Sem acento e em minúsculas, para "coral 33" achar "Coral 33 Aberta". */
const chave = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

/*
 * A lista dos modelos, buscada uma vez por página.
 *
 * Passá-la por prop repetiria os 18 modelos no HTML de cada cartão — numa
 * grade de 18, dezoito cópias da mesma lista. `/api/modelos` é estática, e
 * este cache faz o segundo cartão aproveitar a busca do primeiro: uma
 * requisição por página, não uma por cartão.
 */
let cacheOpcoes: OpcaoModelo[] | null = null
let buscaEmVoo: Promise<OpcaoModelo[]> | null = null

function carregarOpcoes(): Promise<OpcaoModelo[]> {
  if (cacheOpcoes) return Promise.resolve(cacheOpcoes)
  // Sem esta guarda, abrir dois dropdowns rápido dispararia duas buscas.
  buscaEmVoo ??= fetch('/api/modelos')
    .then((r) => (r.ok ? r.json() : []))
    .then((lista: OpcaoModelo[]) => {
      cacheOpcoes = lista
      return lista
    })
    .catch(() => [])
    .finally(() => {
      buscaEmVoo = null
    })
  return buscaEmVoo
}

export default function CompararAqui({
  atual,
  locale = 'pt',
  children,
}: {
  /** A lancha de onde partiu o clique: o lado esquerdo da comparação. */
  atual: string
  locale?: Locale
  /** O gatilho — o ícone no cartão ou o botão na ficha. */
  children: (props: { aoAbrir: () => void; aberto: boolean }) => React.ReactNode
}) {
  const t = getDict(locale).compare
  const [aberto, setAberto] = useState(false)
  const [par, setPar] = useState<[string, string] | null>(null)
  const [opcoes, setOpcoes] = useState<OpcaoModelo[]>(() => cacheOpcoes ?? [])
  const [busca, setBusca] = useState('')
  const [emFoco, setEmFoco] = useState(0)
  /* Onde desenhar o menu, em coordenadas de janela. Ele vive num portal (o
     cartão tem `overflow-hidden`, que recortaria um filho ancorado), então
     precisa de posição própria em vez de herdar a do gatilho. */
  const [caixaMenu, setCaixaMenu] = useState<{
    topo: number | null
    base: number | null
    direita: number
    alturaMax: number
  } | null>(null)

  const caixa = useRef<HTMLDivElement>(null)
  const lista = useRef<HTMLDivElement>(null)
  const campo = useRef<HTMLInputElement>(null)

  const disponiveis = useMemo(() => {
    const termo = chave(busca.trim())
    return opcoes
      .filter((o) => o.slug !== atual)
      .filter((o) => !termo || chave(o.rotulo).includes(termo))
  }, [opcoes, atual, busca])

  useLayoutEffect(() => {
    if (!aberto) return

    const medir = () => {
      /*
       * Mede o BOTÃO, não o wrapper. O wrapper é `display: contents` para não
       * criar caixa própria (que deslocaria o ícone no canto do cartão) — e
       * justamente por isso seu `getBoundingClientRect` é todo zero, o que
       * jogava o menu para fora da tela.
       */
      const gatilho = caixa.current?.querySelector('button')
      if (!gatilho) return
      const r = gatilho.getBoundingClientRect()
      const raiz = getComputedStyle(document.documentElement)
      const cabecalho = parseInt(raiz.getPropertyValue('--header-h')) || 0

      const abaixo = window.innerHeight - r.bottom - 16
      /* O topo útil não é 0: o cabeçalho é fixo e passaria por cima do menu,
         escondendo o próprio campo de busca. */
      const acima = r.top - cabecalho - 16

      /* Só sobe quando embaixo é apertado E em cima sobra bem mais: a margem
         de 80px evita trocar de lado por uma diferença que não se nota. */
      const cima = abaixo < 260 && acima > abaixo + 80
      const espaco = cima ? acima : abaixo

      setCaixaMenu({
        topo: cima ? null : r.bottom + 8,
        base: cima ? window.innerHeight - r.top + 8 : null,
        /* Ancorado pela direita do gatilho, mas nunca além da borda da tela. */
        direita: Math.max(16, window.innerWidth - r.right),
        alturaMax: Math.max(160, Math.min(420, espaco)),
      })
    }

    medir()

    /* O gatilho pode se mover depois de abrir — a página rola, a janela muda
       de tamanho. Medir uma vez só deixaria a lista colocada por um número
       que já não vale. `capture` porque quem rola nem sempre é a janela. */
    window.addEventListener('scroll', medir, { capture: true, passive: true })
    window.addEventListener('resize', medir)
    return () => {
      window.removeEventListener('scroll', medir, { capture: true })
      window.removeEventListener('resize', medir)
    }
  }, [aberto])

  useEffect(() => {
    if (!aberto) return
    campo.current?.focus()

    /* O menu vive num portal, fora da caixa: sem checar as duas árvores, um
       clique dentro do próprio menu o fecharia. */
    const aoClicarFora = (e: MouseEvent) => {
      const alvo = e.target as Node
      if (caixa.current?.contains(alvo) || lista.current?.closest('[data-menu]')?.contains(alvo)) {
        return
      }
      setAberto(false)
    }

    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [aberto])

  useEffect(() => {
    if (!aberto) return
    lista.current
      ?.querySelector<HTMLElement>(`[data-indice="${emFoco}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [emFoco, aberto])

  const escolher = (slug: string) => {
    setAberto(false)
    setPar([atual, slug])
  }

  /*
   * Portais nascem no `body`, mas o React propaga eventos pela árvore de
   * COMPONENTES, não pelo DOM: um clique dentro do menu ou do painel ainda
   * sobe até o `<Link>` do cartão, que navegaria para a ficha do modelo e
   * levaria tudo embora. Foi o que derrubava o painel ao clicar em "Trocar".
   *
   * Barrar na raiz de cada portal cobre o conteúdo inteiro de uma vez, em vez
   * de repetir a proteção em cada botão lá dentro.
   */
  const conter = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Não deixa subir: quem escuta Esc acima fecharia junto.
      e.stopPropagation()
      setAberto(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setEmFoco((i) => Math.min(i + 1, disponiveis.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setEmFoco((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const o = disponiveis[emFoco]
      if (o) escolher(o.slug)
    }
  }

  const alternar = () => {
    if (aberto) {
      setAberto(false)
      return
    }
    setBusca('')
    setEmFoco(0)
    setAberto(true)
    /* Busca na primeira abertura. Nas seguintes o cache responde na hora, e
       a lista aparece junto com a folha em vez de piscar vazia. */
    if (opcoes.length === 0) void carregarOpcoes().then(setOpcoes)
  }

  const menu = aberto && caixaMenu && (
    <div
      data-menu
      onClick={conter}
      onKeyDown={aoTeclar}
      /*
       * Sempre `fixed`, em coordenadas de janela: no celular é folha presa à
       * base; a partir de `sm:` o `style` reposiciona junto ao gatilho.
       *
       * Num portal, e não dentro do cartão, porque o cartão é
       * `overflow-hidden` — ancorado ali, o menu apareceria cortado na
       * moldura da foto.
       */
      className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[70vh] flex-col overflow-hidden rounded-t-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] pb-[env(safe-area-inset-bottom)] text-left shadow-[var(--shadow-lg)] sm:inset-x-auto sm:w-[min(21rem,calc(100vw-2rem))] sm:rounded-[var(--radius-md)] sm:pb-0"
      style={
        {
          '--menu-topo': caixaMenu.topo === null ? 'auto' : `${caixaMenu.topo}px`,
          '--menu-base': caixaMenu.base === null ? 'auto' : `${caixaMenu.base}px`,
          '--menu-dir': `${caixaMenu.direita}px`,
          '--menu-alt': `${caixaMenu.alturaMax}px`,
        } as React.CSSProperties
      }
    >
            <div
              aria-hidden
              className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-[var(--border-strong)] sm:hidden"
            />

            <div className="shrink-0 border-b border-[var(--border-subtle)] p-2">
              <p className="px-1 pb-2 text-[11px] font-medium text-[var(--text-muted)]">
                {t.compareWith}
              </p>
              <input
                ref={campo}
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value)
                  setEmFoco(0)
                }}
                placeholder={t.searchModel}
                aria-label={t.searchModel}
                className="w-full rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] px-3 py-2 text-[13px] text-[var(--text-strong)] outline-none placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-ocean-600"
              />
            </div>

            <div
              ref={lista}
              role="listbox"
              aria-label={t.compareWith}
              className="min-h-0 flex-1 overflow-y-auto p-1.5"
            >
              {disponiveis.length === 0 ? (
                /* Enquanto a lista não chegou, o vazio não é "nada encontrado":
                   dizer isso na primeira abertura seria mentira por meio
                   segundo. Esqueletos ocupam o mesmo espaço da lista real, e
                   ela não salta quando os dados chegam. */
                opcoes.length === 0 ? (
                  <div aria-hidden className="space-y-1.5 p-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="h-9 w-12 shrink-0 animate-pulse rounded-[var(--radius-xs)] bg-[var(--surface-sunken)]" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--surface-sunken)]" />
                          <div className="h-2.5 w-1/3 animate-pulse rounded bg-[var(--surface-sunken)]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-2 py-6 text-center text-[13px] text-[var(--text-muted)]">
                    {t.noMatch}
                  </p>
                )
              ) : (
                disponiveis.map((o, i) => (
                  <button
                    key={o.slug}
                    data-indice={i}
                    type="button"
                    role="option"
                    aria-selected={i === emFoco}
                    onClick={() => escolher(o.slug)}
                    onMouseEnter={() => setEmFoco(i)}
                    className={`flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] p-1.5 text-left transition-colors duration-[120ms] ${
                      i === emFoco ? 'bg-[var(--surface-sunken)]' : ''
                    }`}
                  >
                    <span className="relative block h-9 w-12 shrink-0 overflow-hidden rounded-[var(--radius-xs)] bg-navy-800">
                      {o.foto && (
                        <Image src={o.foto} alt="" fill sizes="48px" className="object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-[var(--text-strong)]">
                        {o.rotulo}
                      </span>
                      {o.comprimento && (
                        <span className="block font-mono text-[11px] text-[var(--text-muted)]">
                          {o.comprimento.toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          m
                        </span>
                      )}
                    </span>
                  </button>
                ))
              )}
      </div>
    </div>
  )

  return (
    <>
      {/* `contents` para o gatilho manter o posicionamento que o pai lhe dá —
          um wrapper com caixa própria deslocaria o ícone no canto do cartão. */}
      <div ref={caixa} className="contents">
        {children({ aoAbrir: alternar, aberto })}
      </div>

      {/*
        Os dois vão para o `body`. O cartão é `overflow-hidden` e tem
        ancestrais com `transform` no hover: o primeiro recortaria o menu, e o
        segundo vira bloco de contenção de `position: fixed`, o que faria o
        painel se ancorar no cartão em vez da janela.
      */}
      {typeof document !== 'undefined' && createPortal(menu, document.body)}

      {par &&
        typeof document !== 'undefined' &&
        createPortal(
          <div onClick={conter}>
            <PainelComparacao slugs={par} locale={locale} aoFechar={() => setPar(null)} />
          </div>,
          document.body,
        )}
    </>
  )
}
