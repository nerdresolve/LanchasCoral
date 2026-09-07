import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Badge } from '@/components/ui'
import { href, type Locale } from '@/i18n/config'
import { getDict } from '@/i18n/dictionary'
import { brl } from '@/lib/format'

type Props = {
  slug: string
  title: string
  brand?: string | null
  year?: number | null
  priceBrl?: number | null
  sizeFt?: number | null
  fuel?: string | null
  image?: string | null
  sold?: boolean
  locale?: Locale
  priority?: boolean
}

/**
 * Card de seminovo. Segue o ModelCard do design system, trocando as specs de
 * fábrica pelos dados que importam num usado: ano, tamanho e preço.
 */
export default function ListingCard({
  slug,
  title,
  brand,
  year,
  priceBrl,
  sizeFt,
  fuel,
  image,
  sold = false,
  locale = 'pt',
  priority = false,
}: Props) {
  const t = getDict(locale).broker

  const specs = [
    { label: t.year, value: year ? String(year) : null },
    { label: t.size, value: sizeFt ? `${sizeFt} ${t.ft}` : null },
    { label: t.fuel, value: fuel },
  ].filter((s) => s.value)

  return (
    <Link
      prefetch={false}
      href={href('broker', locale, `/${slug}`)}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] transition-[transform,box-shadow,border-color] duration-[240ms] ease-[var(--ease-glide)] hover:-translate-y-1 hover:border-ocean-200 hover:shadow-[var(--shadow-hover)]"
    >
      <div className="relative shrink-0 overflow-hidden">
        <div className="relative aspect-[4/3] bg-navy-800 transition-transform duration-[520ms] ease-[var(--ease-glide)] group-hover:scale-[1.04]">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              priority={priority}
              sizes="(min-width: 1024px) 31vw, (min-width: 640px) 47vw, 90vw"
              className={`object-cover ${sold ? 'grayscale' : ''}`}
            />
          ) : (
            <div className="grid h-full place-items-center font-mono text-xs text-on-dark-muted">
              {title}
            </div>
          )}
        </div>

        {sold && (
          <div className="absolute left-3.5 top-3.5">
            <Badge tone="navy">{t.sold}</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        {brand && (
          <div className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
            {brand}
          </div>
        )}

        <div className="mt-2 flex items-start justify-between gap-3">
          {/* min-h de 2 linhas: titulos de 1 ou 2 linhas ocupam a mesma altura,
              mantendo preco e specs alinhados entre cards vizinhos da grade. */}
          <h3 className="m-0 min-h-[2lh] font-display text-xl font-semibold leading-tight tracking-[var(--tracking-display)] text-[var(--text-strong)]">
            {title}
          </h3>
          <span className="mt-1 flex shrink-0 text-ocean-700 transition-transform duration-[240ms] ease-[var(--ease-glide)] group-hover:translate-x-1">
            <ArrowRight size={18} />
          </span>
        </div>

        <p className="mb-4 mt-3 font-display text-lg font-medium text-[var(--text-strong)]">
          {priceBrl ? brl(priceBrl) : <span className="text-[var(--text-muted)]">{t.onRequest}</span>}
        </p>

        {specs.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-x-5 gap-y-3 border-t border-[var(--border-subtle)] pt-4">
            {specs.map((s) => (
              <div key={s.label}>
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
