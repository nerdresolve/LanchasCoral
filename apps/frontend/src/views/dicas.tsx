import Link from 'next/link'
import Image from 'next/image'
import PageShell from '@/components/PageShell'
import Reveal from '@/components/Reveal'
import { getArticles, localizeArticle } from '@/lib/queries'
import { href, type Locale } from '@/i18n/config'
import { getDict } from '@/i18n/dictionary'

/**
 * Índice do blog técnico, migrado de /dicas/ do site legado.
 *
 * O conteúdo responde dúvidas de quem pesquisa antes de comprar (gel coat
 * contra tinta PU, infusão contra laminação manual) e por isso sustenta busca
 * de cauda longa que as páginas de produto não alcançam.
 */
export default async function DicasView({ locale = 'pt' }: { locale?: Locale }) {
  const t = getDict(locale)
  const c = t.dicas
  const artigos = (await getArticles()).map((a) => localizeArticle(a, locale))

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lede={c.lede} active="dicas" locale={locale}>
      {artigos.length === 0 ? (
        <p className="text-base text-[var(--color-text-body)]">{c.empty}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {artigos.map((a, i) => (
            <Reveal key={a.id} as="li" delay={i < 4 ? i * 70 : 0}>
              <Link
                href={href('dicas', locale, `/${a.slug}`)}
                className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] transition-[transform,box-shadow,border-color] duration-[240ms] ease-[var(--ease-glide)] hover:-translate-y-1 hover:border-ocean-200 hover:shadow-[var(--shadow-hover)]"
              >
                {a.heroImage && (
                  <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-navy-800">
                    <Image
                      src={a.heroImage}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 45vw, 90vw"
                      className="object-cover transition-transform duration-[520ms] ease-[var(--ease-glide)] group-hover:scale-[1.04]"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-7">
                  <h2 className="font-display text-xl font-semibold leading-snug tracking-[var(--tracking-display)] text-[var(--text-strong)]">
                    {a.title}
                  </h2>
                  {a.excerpt && (
                    <p className="mt-3 text-[15px] leading-[1.6] text-[var(--color-text-body)]">
                      {a.excerpt}
                    </p>
                  )}
                  <span className="mt-auto inline-flex min-h-11 items-center pt-6 font-body text-xs font-bold uppercase tracking-[var(--tracking-wide)] text-ocean-700">
                    {c.readMore}
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
