'use client'

import CompararAqui from './CompararAqui'
import { getDict } from '@/i18n/dictionary'
import type { Locale } from '@/i18n/config'

/**
 * Abre a comparação a partir de uma lancha.
 *
 * Duas aparências, para dois lugares: `icone` no canto do cartão, e `barra`
 * na ficha do modelo, onde há espaço para o texto.
 *
 * O clique não marca nem guarda nada: abre a lista das outras lanchas, e
 * escolher uma abre a comparação por cima da página. Antes eram três tempos
 * — marcar, caçar a segunda (às vezes em outra página), clicar em ver — e a
 * escolha ficava pendurada numa barra no rodapé.
 *
 * ## O detalhe que faz funcionar
 *
 * `preventDefault` e `stopPropagation` no clique. O cartão inteiro é um
 * `<Link>` para a ficha do modelo — sem isso, clicar em comparar navegaria
 * para a página em vez de abrir a lista.
 */
export default function BotaoComparar({
  modelo,
  locale = 'pt',
  variante = 'icone',
}: {
  modelo: { slug: string; rotulo: string; foto: string | null }
  locale?: Locale
  variante?: 'icone' | 'barra'
}) {
  const t = getDict(locale).compare
  const rotulo = t.compareFrom(modelo.rotulo)

  return (
    <CompararAqui atual={modelo.slug} locale={locale}>
      {({ aoAbrir, aberto }) => {
        const aoClicar = (e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          aoAbrir()
        }

        if (variante === 'barra') {
          return (
            <button
              type="button"
              onClick={aoClicar}
              aria-expanded={aberto}
              aria-haspopup="listbox"
              aria-label={rotulo}
              className={`inline-flex min-h-12 items-center gap-2.5 rounded-[var(--radius-pill)] border px-5 font-body text-xs font-bold uppercase tracking-[var(--tracking-wide)] transition-[background-color,border-color,color] duration-[240ms] ${
                aberto
                  ? 'border-aqua-500 bg-aqua-500/15 text-aqua-400'
                  : 'border-pearl-0/30 text-pearl-0 hover:border-pearl-0/60 hover:bg-pearl-0/10'
              }`}
            >
              <Icone marcado={aberto} />
              {t.compare}
            </button>
          )
        }

        return (
          <button
            type="button"
            onClick={aoClicar}
            aria-expanded={aberto}
            aria-haspopup="listbox"
            aria-label={rotulo}
            title={rotulo}
            /* `min-h-11`/`min-w-11`: alvo de toque de 44px, o mínimo que a
               regra de acessibilidade pede. O quadrado visível é menor; a
               folga é padding. */
            className={`absolute right-2.5 top-2.5 z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-pill)] backdrop-blur-sm transition-[background-color,color] duration-[240ms] ${
              aberto
                ? 'bg-aqua-500 text-navy-900'
                : 'bg-navy-900/45 text-pearl-0 hover:bg-navy-900/70'
            }`}
          >
            <Icone marcado={aberto} />
          </button>
        )
      }}
    </CompararAqui>
  )
}

/**
 * Mostrador de velocímetro: o arco, as marcas e o ponteiro.
 *
 * Dois retângulos lado a lado — o desenho corrente de "comparar" — não diziam
 * nada aqui. Um velocímetro fala da coisa: o que se compara entre duas
 * lanchas é o que elas entregam, e o instrumento é o que o piloto olha.
 *
 * Com a lista aberta, o ponteiro sobe para o fim da escala e o arco se
 * completa. A mudança é de forma, não só de cor — quem não distingue as
 * cores enxerga o ponteiro girar.
 */
function Icone({ marcado }: { marcado: boolean }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Arco do mostrador, de 8h a 4h. */}
      <path d="M4.2 17.2a9 9 0 1 1 15.6 0" strokeWidth="1.6" opacity={marcado ? 0.45 : 0.75} />

      {/* Trecho percorrido: vazio até a metade, cheio quando marcado. */}
      <path
        d={marcado ? 'M4.2 17.2a9 9 0 0 1 15.6 0' : 'M4.2 17.2A9 9 0 0 1 7.5 5.1'}
        strokeWidth="2.4"
      />

      {/* Marcas da escala. */}
      <path d="M6.6 15.2l-1.2-.7M12 5.6V4.2M17.4 15.2l1.2-.7" strokeWidth="1.4" opacity="0.55" />

      {/* Ponteiro.
          Em repouso aponta para a esquerda-baixo (início da escala); marcado,
          gira para a direita-alto (fim). O ângulo é medido a partir da
          vertical, que é como o `rotate` do SVG trabalha: -55° leva à
          esquerda, +55° à direita — os dois dentro do arco desenhado. */}
      <g
        style={{
          transformOrigin: '12px 17px',
          transform: marcado ? 'rotate(55deg)' : 'rotate(-55deg)',
          transition: 'transform 420ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <path d="M12 17V9.6" strokeWidth="2" />
      </g>

      <circle cx="12" cy="17" r="1.7" fill="currentColor" stroke="none" />
    </svg>
  )
}
