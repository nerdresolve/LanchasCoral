import Link from 'next/link'
import Image from 'next/image'
import { meters, hpShort, capacityShort } from '@/lib/format'
import { ArrowRight, Badge } from '@/components/ui'
import { href as routeHref, type Locale } from '@/i18n/config'
import BotaoComparar from './comparador/BotaoComparar'
import { getDict } from '@/i18n/dictionary'

type Props = {
  slug: string
  name: string
  variant: string | null
  family?: string | null
  lengthM: unknown
  powerMaxHp: number | null
  capacityPeople?: number | null
  image: string | null
  badge?: string | null
  badgeTone?: 'ocean' | 'lime' | 'navy' | 'aqua'
  priority?: boolean
  sizes?: string
  locale?: Locale
}

/**
 * Boat model card, ported from the design system's ModelCard:
 * full-bleed media that zooms on hover, family eyebrow, model name with an
 * arrow, and three headline specs in mono above a hairline.
 */
export default function BoatCard({
  slug,
  name,
  variant,
  family,
  lengthM,
  powerMaxHp,
  capacityPeople,
  image,
  badge,
  badgeTone = 'ocean',
  locale = 'pt',
  priority = false,
  // Nao e 100vw: o card tem margem lateral e fica em ~90% da largura no
  // celular. Pedindo a viewport inteira, o navegador baixava a variante de
  // 640px para exibir 348px — quase o dobro de bytes do necessario.
  sizes = '(min-width: 1024px) 31vw, (min-width: 640px) 47vw, 90vw',
}: Props) {
  const label = [name, variant].filter(Boolean).join(' ')
  const t = getDict(locale).boat

  const specs = [
    { label: t.specLoa, value: meters(lengthM as never) },
    { label: t.specPower, value: hpShort(powerMaxHp) },
    { label: t.specCapacity, value: capacityShort(capacityPeople ?? null) },
  ].filter((s) => s.value)

  return (
    <Link
      prefetch={false}
      href={routeHref('modelos', locale, `/${slug}`)}
      className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] transition-[transform,box-shadow,border-color] duration-[240ms] ease-[var(--ease-glide)] hover:-translate-y-1 hover:border-ocean-200 hover:shadow-[var(--shadow-hover)]"
    >
      {/* Filho direto do cartão, e não do wrapper da foto: lá dentro o
          `group-hover:scale` da imagem arrastaria o botão junto. O cartão é
          `relative`, então o posicionamento absoluto se ancora nele. */}
      <BotaoComparar
        locale={locale}
        modelo={{ slug, rotulo: label, foto: image ?? null }}
      />

      <div className="relative shrink-0 overflow-hidden">
        <div className="relative aspect-[4/3] bg-navy-800 transition-transform duration-[520ms] ease-[var(--ease-glide)] group-hover:scale-[1.04]">
          {/* `fetchPriority="low"` quando não é prioritária: os cartões da
              home começam ~1200px abaixo da dobra, mas o navegador os busca
              junto com a foto do hero e disputam a mesma banda. Rebaixá-los
              libera a fila para o elemento que de fato conta como LCP. */}
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              priority={priority}
              fetchPriority={priority ? 'high' : 'low'}
              sizes={sizes}
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center font-mono text-xs text-on-dark-muted">
              {t.noImage}
            </div>
          )}
        </div>
        {badge && (
          <div className="absolute left-3.5 top-3.5">
            <Badge tone={badgeTone}>{badge}</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        {(family || variant) && (
          <div className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
            {variant ?? family}
          </div>
        )}

        <div className="mb-4 mt-2 flex items-start justify-between gap-3">
          {/* min-h de 2 linhas: titulos de 1 ou 2 linhas ocupam a mesma altura,
              mantendo a faixa de specs alinhada entre cards vizinhos da grade. */}
          <h3 className="m-0 min-h-[2lh] font-display text-2xl font-semibold leading-tight tracking-[var(--tracking-display)] text-[var(--text-strong)]">
            {name}
          </h3>
          <span className="mt-1 flex shrink-0 text-ocean-700 transition-transform duration-[240ms] ease-[var(--ease-glide)] group-hover:translate-x-1">
            <ArrowRight size={18} />
          </span>
        </div>

        {specs.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-x-5 gap-y-3 border-t border-[var(--border-subtle)] pt-4">
            {specs.map((s) => (
              <div key={s.label}>
                {/* whitespace-nowrap: "15,24 m" nao pode quebrar em duas linhas. */}
                <div className="whitespace-nowrap font-mono text-sm text-[var(--text-strong)]">
                  {s.value}
                </div>
                <div className="mt-1 font-body text-[10px] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-[var(--text-muted)]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
