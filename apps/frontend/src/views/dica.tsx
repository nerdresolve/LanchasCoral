import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import Reveal from '@/components/Reveal'
import JsonLd from '@/components/JsonLd'
import { WakeLines } from '@/components/SectionDecor'
import { getArticle, localizeArticle } from '@/lib/queries'
import { articleSchema, breadcrumbSchema } from '@/lib/schema'
import { href, type Locale } from '@/i18n/config'
import { getDict } from '@/i18n/dictionary'

/** Artigo do blog técnico. */
export default async function DicaView({ slug, locale = 'pt' }: { slug: string; locale?: Locale }) {
  const bruto = await getArticle(slug)
  if (!bruto) notFound()
  const a = localizeArticle(bruto, locale)
  const t = getDict(locale)
  const c = t.dicas

  const data = a.publishedAt
    ? new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(a.publishedAt)
    : null

  return (
    <>
      <SiteHeader active="dicas" locale={locale} />
      <main className="flex-1">
        <JsonLd
          data={[
            articleSchema(a, locale),
            breadcrumbSchema([
              { nome: c.title, url: href('dicas', locale) },
              { nome: a.title, url: href('dicas', locale, `/${a.slug}`) },
            ]),
          ]}
        />

        <section
          className="relative isolate overflow-hidden py-14 lg:py-16"
          style={{ background: 'var(--grad-deep)' }}
        >
          <WakeLines side="left" tone="dark" className="top-1/2 -translate-y-1/2" />
          <div className="container-page relative max-w-[var(--layout-narrow)]">
            <nav aria-label={c.title} className="font-mono text-xs text-on-dark-muted">
              <ol className="flex items-center gap-2">
                <li>
                  <Link
                    href={href('dicas', locale)}
                    className="inline-flex min-h-8 items-center transition-colors hover:text-pearl-0"
                  >
                    {c.title}
                  </Link>
                </li>
              </ol>
            </nav>

            {/* `text-balance` evita a última linha órfã em títulos longos. */}
            <h1 className="mt-6 font-display text-[length:var(--text-d2)] font-medium leading-[1.08] tracking-[var(--tracking-display)] text-balance text-pearl-0">
              {a.title}
            </h1>
            {data && (
              <p className="mt-5 font-mono text-xs text-on-dark-muted">
                {c.publishedOn} <time dateTime={a.publishedAt!.toISOString()}>{data}</time>
              </p>
            )}
          </div>
        </section>

        {a.heroImage && (
          <div className="container-page max-w-[var(--layout-narrow)] pt-12">
            <div className="relative aspect-[21/9] overflow-hidden rounded-[var(--radius-md)] bg-navy-800 shadow-[var(--shadow-md)]">
              <Image src={a.heroImage} alt="" fill sizes="(min-width: 1024px) 60vw, 92vw" className="object-cover" />
            </div>
          </div>
        )}

        <section className="section-y">
          <div className="container-page max-w-[var(--layout-narrow)]">
            <Reveal>
              <div className="flex flex-col gap-6">
                {a.body.map((p, i) => (
                  <p key={i} className="text-[17px] leading-[1.75] text-pretty text-[var(--color-text-body)]">
                    {p}
                  </p>
                ))}
              </div>
            </Reveal>

            <div className="mt-14 border-t border-[var(--border-subtle)] pt-8">
              <Link
                href={href('dicas', locale)}
                className="inline-flex min-h-11 items-center font-body text-xs font-bold uppercase tracking-[var(--tracking-wide)] text-ocean-700 transition-colors hover:text-aqua-600"
              >
                {c.backToIndex}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
