import Link from 'next/link'
import Image from 'next/image'
import type { ComponentProps, ReactNode } from 'react'

/*
 * Coral Design System primitives.
 *
 * Ported from the CoralDesignSystem bundle (namespace CoralDesignSystem_57e1bd)
 * shipped in "Coral Website (offline).html". Sizes, tones and behaviours below
 * follow that source; the styling is expressed with the project's tokens.
 */

/* ------------------------------------------------------------------ Logo */

/**
 * The Coral mark. `white` is the reversed lockup for dark surfaces (header
 * over hero media, footer); `color` is the blue wordmark for light surfaces.
 */
export function Logo({
  variant = 'color',
  height = 30,
  className = '',
  priority = false,
}: {
  variant?: 'color' | 'white'
  height?: number
  className?: string
  priority?: boolean
}) {
  // Marca branca (sem o swoosh colorido), como na versão de referência.
  // Proporção do arquivo: 501 x 120.
  const white = variant === 'white'
  const ratio = white ? 501 / 120 : 869 / 182
  const width = Math.round(ratio * height)

  return (
    <Image
      src={white ? '/brand/logo-coral-mono.png' : '/brand/logo-coral.png'}
      alt="Coral Indústria Naval"
      width={width}
      height={height}
      priority={priority}
      className={`block h-auto w-auto ${className}`}
      style={{ height, width: 'auto' }}
    />
  )
}

/* ---------------------------------------------------------------- Button */

const BTN_BASE =
  'group/btn relative inline-flex items-center justify-center gap-2.5 overflow-hidden whitespace-nowrap rounded-[var(--radius-pill)] border font-body font-semibold uppercase tracking-[0.06em] transition-[transform,box-shadow,background-color,border-color,color] duration-[240ms] ease-[var(--ease-glide)] hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40'

const BTN_SIZE = {
  sm: 'h-10 px-5 text-[11px]',
  md: 'h-12 px-7 text-xs',
  lg: 'h-[58px] px-9 text-[13px]',
} as const

/*
 * Preenchimento em gradiente com brilho colorido no hover. O sistema original
 * era chapado; a leitura em tela ficou sem hierarquia entre as acoes.
 */
const BTN_VARIANT = {
  primary:
    'border-0 bg-[image:var(--grad-ocean)] text-pearl-0 shadow-[var(--shadow-sm)] hover:shadow-[var(--glow-aqua)]',
  signature:
    'border-0 bg-[image:var(--grad-signature)] text-pearl-0 shadow-[var(--shadow-sm)] hover:shadow-[var(--glow-signature)]',
  outline:
    'border-[var(--border-strong)] bg-transparent text-[var(--text-strong)] hover:border-ocean-700 hover:bg-pearl-100 hover:shadow-[var(--shadow-sm)]',
  'outline-inverse':
    'border-white/45 bg-transparent text-pearl-0 hover:border-aqua-400 hover:bg-aqua-500/10 hover:text-white',
  ghost: 'border-0 bg-transparent px-2 text-ocean-700 hover:text-aqua-600',
} as const

type ButtonVariant = keyof typeof BTN_VARIANT
type ButtonSize = keyof typeof BTN_SIZE

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}) {
  return (
    <Link
      {...props}
      className={`${BTN_BASE} ${BTN_SIZE[size]} ${BTN_VARIANT[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {children}
    </Link>
  )
}

/* ----------------------------------------------------------------- Badge */

const BADGE_TONE = {
  ocean: 'bg-ocean-100 text-ocean-800 border-transparent',
  aqua: 'bg-aqua-100 text-aqua-600 border-transparent',
  lime: 'bg-[image:var(--grad-signature)] text-pearl-0 border-0',
  navy: 'bg-navy-900 text-pearl-0 border-transparent',
  neutral: 'bg-pearl-100 text-[var(--color-text-body)] border-transparent',
  outline: 'bg-transparent text-[var(--text-muted)] border-[var(--border-subtle)]',
  'outline-inverse':
    'bg-transparent text-on-dark-muted border-[var(--border-on-dark)]',
} as const

export function Badge({
  tone = 'ocean',
  children,
  className = '',
}: {
  tone?: keyof typeof BADGE_TONE
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-pill)] border px-2.5 py-1 font-body text-[11px] font-bold uppercase leading-none tracking-[var(--tracking-eyebrow)] ${BADGE_TONE[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------- Section UI */

/** Eyebrow + display headline + optional lede. The standard section opener. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  index,
  inverse = false,
  align = 'left',
  as: Tag = 'h2',
  className = '',
}: {
  eyebrow?: string
  title: ReactNode
  lede?: ReactNode
  /** Mono progress marker, e.g. "01 / 05". */
  index?: string
  inverse?: boolean
  align?: 'left' | 'center'
  /**
   * Nivel do heading. O titulo PRINCIPAL de uma pagina deve passar `h1`:
   * o padrao `h2` existe porque este componente tambem abre secoes internas.
   * Sem isso o documento inteiro comeca em h2 e o buscador perde o sinal
   * mais forte de assunto da pagina.
   */
  as?: 'h1' | 'h2' | 'h3'
  className?: string
}) {
  return (
    <div
      className={`${align === 'center' ? 'mx-auto max-w-[var(--layout-narrow)] text-center' : 'max-w-[760px]'} ${className}`}
    >
      {eyebrow && (
        <div
          className={`mb-4 flex items-center gap-3 ${align === 'center' ? 'justify-center' : ''}`}
        >
          <span
            aria-hidden
            className={`h-px w-7 ${inverse ? 'bg-aqua-500' : 'bg-ocean-700'}`}
          />
          <span
            className={`font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] ${
              inverse ? 'text-aqua-500' : 'text-ocean-700'
            }`}
          >
            {eyebrow}
          </span>
          {index && (
            <span
              className={`font-mono text-xs ${
                inverse ? 'text-on-dark-muted' : 'text-[var(--text-muted)]'
              }`}
            >
              {index}
            </span>
          )}
        </div>
      )}

      <Tag
        className={`m-0 font-display text-[length:var(--text-d2)] font-medium leading-[1.08] tracking-[var(--tracking-display)] text-balance ${
          inverse ? 'text-pearl-0' : 'text-[var(--text-strong)]'
        }`}
      >
        {title}
      </Tag>

      {lede && (
        <p
          className={`mt-5 max-w-[60ch] text-[17px] font-normal leading-[1.6] text-pretty ${
            inverse ? 'text-on-dark-soft' : 'text-[var(--color-text-body)]'
          }`}
        >
          {lede}
        </p>
      )}
    </div>
  )
}

/** A hairline that carries the aqua→lime wake gradient. */
export function WaveDivider({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`h-px w-full ${className}`}
      style={{ background: 'var(--wave-line)' }}
    />
  )
}

/* ------------------------------------------------------------------ Data */

export type SpecRow = { label: string; value: string | null; unit?: string | null }

/** Technical specification table — mono values, hairline rows, no zebra striping. */
export function SpecTable({
  rows,
  columns = 1,
  inverse = false,
  className = '',
}: {
  rows: SpecRow[]
  columns?: 1 | 2
  inverse?: boolean
  className?: string
}) {
  const filled = rows.filter((r) => r.value)
  if (filled.length === 0) return null

  const line = inverse ? 'border-[var(--border-on-dark)]' : 'border-[var(--border-subtle)]'

  return (
    <div
      className={`grid gap-x-14 ${columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'} ${className}`}
    >
      {filled.map((r) => (
        <div
          key={r.label}
          className={`flex items-baseline justify-between gap-4 border-b py-3.5 ${line}`}
        >
          <span
            className={`font-body text-xs font-semibold uppercase tracking-[var(--tracking-wide)] ${
              inverse ? 'text-on-dark-muted' : 'text-[var(--text-muted)]'
            }`}
          >
            {r.label}
          </span>
          <span
            className={`text-right font-mono text-sm tracking-[var(--tracking-mono)] ${
              inverse ? 'text-pearl-0' : 'text-[var(--text-strong)]'
            }`}
          >
            {r.value}
            {r.unit && (
              <span
                className={`ml-1 ${
                  inverse ? 'text-on-dark-muted' : 'text-[var(--text-muted)]'
                }`}
              >
                {r.unit}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

/** A headline figure with a mono value and an uppercase caption. */
export function StatBlock({
  value,
  unit,
  label,
  inverse = false,
  size = 'md',
}: {
  value: ReactNode
  unit?: string | null
  label: string
  inverse?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const valueSize = {
    sm: 'text-xl',
    md: 'text-[length:var(--text-h1)]',
    lg: 'text-[length:var(--text-d2)]',
  }[size]

  return (
    <div>
      <div
        className={`font-display font-medium leading-[1.05] tracking-[var(--tracking-display)] ${valueSize} ${
          inverse ? 'text-pearl-0' : 'text-[var(--text-strong)]'
        }`}
      >
        {value}
        {unit && (
          <span
            className={`ml-1 font-mono text-sm font-normal ${
              inverse ? 'text-on-dark-muted' : 'text-[var(--text-muted)]'
            }`}
          >
            {unit}
          </span>
        )}
      </div>
      <div
        className={`mt-1.5 font-body text-[10px] font-bold uppercase tracking-[var(--tracking-eyebrow)] ${
          inverse ? 'text-on-dark-muted' : 'text-[var(--text-muted)]'
        }`}
      >
        {label}
      </div>
    </div>
  )
}

/** Right-pointing arrow used on cards and inline links. */
export function ArrowRight({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      aria-hidden
    >
      <path d="M5 12h13M12 5.5 18.5 12 12 18.5" />
    </svg>
  )
}

/** Underlined caps link — "All models", "Compare", "View gallery". */
export function TextLink({
  inverse = false,
  className = '',
  children,
  ...props
}: ComponentProps<typeof Link> & { inverse?: boolean }) {
  return (
    <Link
      {...props}
      className={`group inline-flex min-h-11 items-center gap-2 font-body text-xs font-bold uppercase tracking-[var(--tracking-wide)] transition-colors ${
        inverse ? 'text-aqua-500 hover:text-aqua-400' : 'text-ocean-700 hover:text-aqua-600'
      } ${className}`}
    >
      {children}
      <span className="transition-transform duration-[240ms] ease-[var(--ease-glide)] group-hover:translate-x-1">
        <ArrowRight size={16} />
      </span>
    </Link>
  )
}
