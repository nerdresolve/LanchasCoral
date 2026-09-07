import type { CSSProperties } from 'react'

/**
 * Motivos decorativos de fundo — todos derivados de água: esteira de casco,
 * ondulação de superfície e círculos de propagação.
 *
 * São SVG inline (sem requisição extra) e puramente ornamentais: `aria-hidden`,
 * sem interação, sem custo de layout. Alternam entre esquerda e direita para
 * dar ritmo à página sem repetir a mesma composição em seguida.
 */

type Side = 'left' | 'right'
type Tone = 'dark' | 'light'

/* Traco discreto: os motivos sao ornamento de fundo, nao elemento de leitura.
   Opacidades reduzidas para que nunca concorram com cards e texto. */
const TRACO: Record<Tone, string> = {
  dark: 'rgba(255,255,255,0.06)',
  light: 'rgba(13,19,34,0.04)',
}

/**
 * Os motivos ficam ancorados nas BORDAS da secao e recuados para fora
 * (translate de 1/3), de modo que apenas a aresta do desenho aparece na
 * moldura e o centro — onde vivem os cards — fica limpo.
 *
 * `-z-10` os coloca atras do conteudo da secao; as secoes usam `isolate`,
 * entao o recuo negativo nao vaza para tras do fundo da propria secao.
 */
const posicao = (side: Side, extra: string) =>
  `pointer-events-none absolute -z-10 w-auto select-none ${
    side === 'right'
      ? 'right-0 translate-x-1/3'
      : // O espelhamento vem como utilitario (nao via `style`), senao o
        // `transform` inline sobrescreveria o translate de contencao.
        'left-0 -translate-x-1/3 -scale-x-100'
  } ${extra}`

/** Esteira: linhas paralelas que abrem como o rastro de um casco. */
export function WakeLines({
  side = 'right',
  tone = 'dark',
  className = '',
  style,
}: {
  side?: Side
  tone?: Tone
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 600"
      className={posicao(side, `h-[min(78%,520px)] ${className}`)}
      style={style}
      fill="none"
    >
      <g stroke={TRACO[tone]} strokeWidth="1.25">
        <path d="M-40 470C120 470 210 372 330 336s200-16 320 44" />
        <path d="M-40 410C120 410 210 312 330 276s200-16 320 44" opacity=".8" />
        <path d="M-40 350C120 350 210 252 330 216s200-16 320 44" opacity=".6" />
        <path d="M-40 290C120 290 210 192 330 156s200-16 320 44" opacity=".4" />
        <path d="M-40 230C120 230 210 132 330 96s200-16 320 44" opacity=".25" />
      </g>
    </svg>
  )
}

/** Círculos de propagação — a marola que se abre a partir de um ponto. */
export function HullArc({
  side = 'left',
  tone = 'dark',
  className = '',
}: {
  side?: Side
  tone?: Tone
  className?: string
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 520 520"
      className={posicao(side, `h-[min(72%,460px)] ${className}`)}
      fill="none"
    >
      <g stroke={TRACO[tone]} strokeWidth="1.25">
        <circle cx="260" cy="260" r="250" />
        <circle cx="260" cy="260" r="190" opacity=".6" />
        <circle cx="260" cy="260" r="130" opacity=".35" />
        <path d="M10 260c90 96 160 144 250 144s160-48 250-144" opacity=".8" />
      </g>
    </svg>
  )
}

/**
 * Ondulação de superfície: senóides empilhadas com amplitude decrescente.
 *
 * Substitui a antiga grade quadriculada — malha reta não conversa com a
 * marca, cujo vocabulário é todo de curvas de água.
 */
export function SonarGrid({
  side = 'right',
  tone = 'dark',
  className = '',
}: {
  side?: Side
  tone?: Tone
  className?: string
}) {
  /* Cada linha repete o mesmo período, com amplitude e opacidade caindo,
     como a ondulação perdendo força ao se afastar. */
  const linhas = [0, 1, 2, 3, 4, 5, 6]

  return (
    <svg
      aria-hidden
      viewBox="0 0 640 420"
      className={posicao(side, `h-[min(70%,430px)] ${className}`)}
      fill="none"
    >
      <g stroke={TRACO[tone]} strokeWidth="1.2">
        {linhas.map((i) => {
          const y = 60 + i * 52
          const a = 26 - i * 3 // amplitude decrescente
          return (
            <path
              key={i}
              d={`M-20 ${y} C 100 ${y - a}, 220 ${y + a}, 340 ${y} S 580 ${y - a}, 660 ${y}`}
              opacity={(1 - i * 0.12).toFixed(2)}
            />
          )
        })}
      </g>
    </svg>
  )
}

/** Onda longa e rasa — para faixas de pouca altura. */
export function SwellLine({
  side = 'right',
  tone = 'dark',
  className = '',
}: {
  side?: Side
  tone?: Tone
  className?: string
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 800 240"
      className={posicao(side, `h-[min(68%,240px)] ${className}`)}
      fill="none"
    >
      <g stroke={TRACO[tone]} strokeWidth="1.2">
        <path d="M-20 150C140 150 200 78 380 78s260 72 440 72" />
        <path d="M-20 108C140 108 200 36 380 36s260 72 440 72" opacity=".55" />
        <path d="M-20 192C140 192 200 120 380 120s260 72 440 72" opacity=".35" />
      </g>
    </svg>
  )
}
