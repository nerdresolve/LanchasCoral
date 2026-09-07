'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

/**
 * Linha do tempo que acompanha a rolagem.
 *
 * O fio vertical se preenche conforme a página desce, e cada marco acende
 * quando entra na área de leitura. A fotografia alterna de lado a cada
 * entrada, para o olho não cair num padrão único.
 *
 * Decisões que valem registro:
 *
 *  - O conteúdo vem do servidor e está inteiro no HTML. O JavaScript só
 *    controla opacidade e a altura do fio; sem ele a página continua legível,
 *    com todos os marcos visíveis (ver `.no-js` em globals.css).
 *  - A altura do fio é calculada num `requestAnimationFrame` a partir do
 *    scroll — não há observer por pixel, que seria caro numa página longa.
 *  - `prefers-reduced-motion` desliga a transição de entrada; os marcos já
 *    nascem visíveis e só o fio continua marcando a posição.
 */

export type Marco = {
  ano: string
  titulo: string
  texto: string
  imagem?: string | null
  legenda?: string | null
}

export default function Timeline({ marcos }: { marcos: Marco[] }) {
  const trilhoRef = useRef<HTMLOListElement>(null)
  const [progresso, setProgresso] = useState(0)
  const [ativos, setAtivos] = useState<boolean[]>(() => marcos.map(() => false))

  useEffect(() => {
    const trilho = trilhoRef.current
    if (!trilho) return

    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    /* O lint alerta para `setState` em efeito. Aqui é inevitável e roda uma
       vez: `matchMedia` só existe no cliente, e quem pediu menos animação
       precisa ver todos os marcos de imediato, sem esperar a rolagem. */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (reduzido) setAtivos(marcos.map(() => true))

    let pedido = 0
    const medir = () => {
      pedido = 0
      const caixa = trilho.getBoundingClientRect()
      // O fio acompanha o meio da tela: preenche à medida que a leitura desce.
      const meio = window.innerHeight * 0.5
      const bruto = (meio - caixa.top) / caixa.height
      setProgresso(Math.min(1, Math.max(0, bruto)))

      if (!reduzido) {
        const itens = [...trilho.querySelectorAll<HTMLElement>('[data-marco]')]
        setAtivos(itens.map((el) => el.getBoundingClientRect().top < window.innerHeight * 0.85))
      }
    }

    const aoRolar = () => {
      if (pedido) return
      pedido = requestAnimationFrame(medir)
    }

    medir()
    window.addEventListener('scroll', aoRolar, { passive: true })
    window.addEventListener('resize', aoRolar)
    return () => {
      if (pedido) cancelAnimationFrame(pedido)
      window.removeEventListener('scroll', aoRolar)
      window.removeEventListener('resize', aoRolar)
    }
  }, [marcos])

  return (
    <ol ref={trilhoRef} className="relative">
      {/* Fio de fundo, em toda a extensão. `md:left-1/2` porque a partir daí
          o traçado vai ao centro e as fotos alternam dos dois lados. */}
      <span
        aria-hidden
        className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--border-strong)] md:left-1/2 md:-translate-x-1/2"
      />
      {/* Fio preenchido: a altura vem do progresso da rolagem. */}
      <span
        aria-hidden
        className="absolute left-[7px] top-2 w-px origin-top bg-[image:var(--grad-signature)] transition-[height] duration-150 ease-out md:left-1/2 md:-translate-x-1/2"
        style={{ height: `calc((100% - 1rem) * ${progresso})` }}
      />

      {marcos.map((m, i) => {
        const direita = i % 2 === 1
        return (
          <li
            key={m.ano + m.titulo}
            data-marco
            className="relative pb-14 last:pb-0 md:pb-20"
          >
            {/* Ponto do marco. Acende quando o item entra na área de leitura. */}
            <span
              aria-hidden
              className={`absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full ring-4 ring-[var(--surface-page)] transition-colors duration-500 md:left-1/2 md:-translate-x-1/2 ${
                ativos[i] ? 'bg-ocean-700' : 'bg-[var(--border-strong)]'
              }`}
            />

            <div
              className={`pl-8 transition-all duration-[600ms] ease-[var(--ease-glide)] motion-reduce:transition-none md:w-[calc(50%-2.5rem)] md:pl-0 ${
                direita ? 'md:ml-auto md:pl-10' : 'md:pr-10 md:text-right'
              } ${ativos[i] ? 'opacity-100 md:translate-x-0' : 'opacity-0 md:translate-x-0'}`}
            >
              <p className="font-mono text-xs font-medium uppercase tracking-[var(--tracking-wide)] text-ocean-700">
                {m.ano}
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold leading-tight tracking-[var(--tracking-display)] text-[var(--text-strong)]">
                {m.titulo}
              </h3>
              <p className="mt-3 text-[16px] leading-[1.65] text-pretty text-[var(--color-text-body)]">
                {m.texto}
              </p>

              {m.imagem && (
                <figure className="mt-5">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] bg-navy-800 shadow-[var(--shadow-sm)]">
                    <Image
                      src={m.imagem}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 44vw, 88vw"
                      className="object-cover"
                    />
                  </div>
                  {m.legenda && (
                    <figcaption className="mt-2 text-[13px] leading-snug text-[var(--text-muted)]">
                      {m.legenda}
                    </figcaption>
                  )}
                </figure>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
