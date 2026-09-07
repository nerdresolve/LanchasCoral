'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { getDict } from '@/i18n/dictionary'
import type { Locale } from '@/i18n/config'

/**
 * Troca um dos lados da comparação sem sair do painel.
 *
 * É o que separa uma ferramenta de um documento: antes, olhar um terceiro
 * modelo exigia fechar o painel, desmarcar, escolher e reabrir — quatro
 * passos para uma pergunta simples ("e se fosse o 40?").
 *
 * ## Três coisas que a versão anterior errava
 *
 * A lista abria sempre para baixo e o rodapé dela ficava fora da janela.
 * Agora ela mede o espaço disponível e decide o lado, limitando a altura ao
 * que cabe de fato.
 *
 * Não havia busca: chegar ao Coral 50 exigia rolar às cegas por 17 itens.
 * Agora digitar filtra, e as setas do teclado percorrem a lista.
 *
 * O item escolhido não aparecia ao abrir quando estava no fim da lista.
 * Agora ele é trazido à vista.
 */

export type OpcaoModelo = {
  slug: string
  rotulo: string
  familia: string | null
  comprimento: number | null
  foto: string | null
}

/** Sem acento e em minúsculas, para "coral 33" achar "Coral 33 Aberta". */
const chave = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

export default function TrocarModelo({
  atual,
  outro,
  opcoes,
  aoEscolher,
  locale = 'pt',
}: {
  /** Slug do modelo neste lado. */
  atual: string
  /** Slug do outro lado, que sai da lista: comparar um consigo não diz nada. */
  outro: string
  opcoes: OpcaoModelo[]
  aoEscolher: (slug: string) => void
  locale?: Locale
}) {
  const t = getDict(locale).compare
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [emFoco, setEmFoco] = useState(0)
  const [paraCima, setParaCima] = useState(false)
  const [alturaMax, setAlturaMax] = useState(340)

  const caixa = useRef<HTMLDivElement>(null)
  const lista = useRef<HTMLDivElement>(null)
  const campo = useRef<HTMLInputElement>(null)

  const disponiveis = useMemo(() => {
    const termo = chave(busca.trim())
    return opcoes
      .filter((o) => o.slug !== outro)
      .filter((o) => !termo || chave(o.rotulo).includes(termo))
  }, [opcoes, outro, busca])

  /*
   * Decide o lado e a altura ANTES de pintar.
   *
   * `useLayoutEffect` e não `useEffect`: medido depois da pintura, a lista
   * apareceria por um quadro no lugar errado e saltaria.
   */
  useLayoutEffect(() => {
    if (!aberto) return

    const medir = () => {
      if (!caixa.current) return
      const r = caixa.current.getBoundingClientRect()

      /* O topo útil não é 0: o cabeçalho do site é fixo e passa por cima de
         qualquer coisa que suba até lá. Medir contra a janela fazia a lista
         abrir para cima e esconder o próprio campo de busca atrás do menu. */
      const raiz = getComputedStyle(document.documentElement)
      const cabecalho = parseInt(raiz.getPropertyValue('--header-h')) || 0

      const abaixo = window.innerHeight - r.bottom - 16
      const acima = r.top - cabecalho - 16

      /* Só sobe quando embaixo é apertado E em cima sobra bem mais — a margem
         de 80px evita trocar de lado por uma diferença que não se nota. */
      const cima = abaixo < 260 && acima > abaixo + 80
      const espaco = cima ? acima : abaixo
      setParaCima(cima)

      /*
       * A altura é o espaço que existe, nunca um mínimo teimoso: forçar 220px
       * onde só cabem 173 fazia a lista passar da base da janela e as últimas
       * linhas ficarem inalcançáveis. O piso de 160px é o ponto em que ainda
       * cabem duas linhas com a busca; abaixo disso a lista rola por dentro.
       */
      setAlturaMax(Math.max(160, Math.min(420, espaco)))
    }

    medir()

    /*
     * Medir uma vez só não basta: o botão pode se mover depois de abrir.
     * Acontece quando ele está fora da vista e o clique rola a página até
     * ele — a medida valeria para uma posição que já não existe, e a lista
     * ficaria colocada pelo número velho (no desktop, atrás do cabeçalho).
     *
     * `capture` porque quem rola é o painel, não a janela: sem isso o evento
     * não chega aqui.
     */
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

    const aoClicarFora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [aberto])

  /* Traz o item em foco para a vista — vale ao abrir (o escolhido pode estar
     no fim) e ao percorrer com as setas. */
  useEffect(() => {
    if (!aberto) return
    lista.current
      ?.querySelector<HTMLElement>(`[data-indice="${emFoco}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [emFoco, aberto])

  const abrir = () => {
    setBusca('')
    // Começa no modelo atual, e não no topo: é o ponto de partida da troca.
    const i = opcoes.filter((o) => o.slug !== outro).findIndex((o) => o.slug === atual)
    setEmFoco(i >= 0 ? i : 0)
    setAberto(true)
  }

  const escolher = (slug: string) => {
    aoEscolher(slug)
    setAberto(false)
  }

  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Não deixa subir: o painel também escuta Esc e fecharia junto.
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

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        aria-expanded={aberto}
        aria-haspopup="listbox"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--border-subtle)] px-3 py-1 text-xs font-medium text-[var(--color-text-body)] transition-colors duration-[140ms] hover:border-ocean-700 hover:text-ocean-700"
      >
        {t.swapModel}
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden
          className={`transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {aberto && (
        <div
          onKeyDown={aoTeclar}
          /*
           * Duas formas, por largura de tela.
           *
           * No celular é uma folha presa à base: o menu ancorado ao botão
           * sangrava pela lateral — o botão da direita fica perto da borda e
           * as miniaturas saíam da tela. Como folha, ocupa a largura toda e
           * fica ao alcance do polegar.
           *
           * No desktop segue ancorado ao botão, que é onde o olho já está.
           */
          className={`fixed inset-x-0 bottom-0 z-20 flex max-h-[70vh] flex-col overflow-hidden rounded-t-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-lg)] sm:absolute sm:inset-x-auto sm:right-0 sm:bottom-auto sm:w-[min(21rem,calc(100vw-2rem))] sm:rounded-[var(--radius-md)] sm:pb-0 sm:[max-height:var(--altura-menu)] ${
            paraCima ? 'sm:bottom-full sm:mb-2' : 'sm:top-full sm:mt-2'
          }`}
          /* O limite vale para a caixa inteira — busca, puxador e lista. No
             filho, os dois primeiros cresciam por fora da conta e a caixa
             passava da base da janela. */
          style={{ ['--altura-menu' as string]: `${alturaMax}px` }}
        >
          {/* Puxador no topo: é o que diz que isto é uma folha e não um menu.
              Some no desktop, onde a lista nasce presa ao botão. */}
          <div aria-hidden className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-[var(--border-strong)] sm:hidden" />

          <div className="shrink-0 border-b border-[var(--border-subtle)] p-2">
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
            aria-label={t.pickOne}
            className="min-h-0 flex-1 overflow-y-auto p-1.5"
          >
            {disponiveis.length === 0 ? (
              <p className="px-2 py-6 text-center text-[13px] text-[var(--text-muted)]">
                {t.noMatch}
              </p>
            ) : (
              disponiveis.map((o, i) => {
                const escolhido = o.slug === atual
                return (
                  <button
                    key={o.slug}
                    data-indice={i}
                    type="button"
                    role="option"
                    aria-selected={escolhido}
                    onClick={() => escolher(o.slug)}
                    onMouseEnter={() => setEmFoco(i)}
                    className={`flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] p-1.5 text-left transition-colors duration-[120ms] ${
                      escolhido
                        ? 'bg-ocean-700/10'
                        : i === emFoco
                          ? 'bg-[var(--surface-sunken)]'
                          : ''
                    }`}
                  >
                    <div className="relative h-9 w-12 shrink-0 overflow-hidden rounded-[var(--radius-xs)] bg-navy-800">
                      {o.foto && <Image src={o.foto} alt="" fill sizes="48px" className="object-cover" />}
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-[var(--text-strong)]">
                        {o.rotulo}
                      </span>
                      {o.comprimento && (
                        <span className="block font-mono text-[11px] text-[var(--text-muted)]">
                          {o.comprimento.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          m
                        </span>
                      )}
                    </span>
                    {escolhido && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 text-ocean-700">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
