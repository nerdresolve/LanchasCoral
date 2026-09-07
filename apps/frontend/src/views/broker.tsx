import Link from 'next/link'
import { getListings, getListingFacets } from '@/lib/queries'
import SiteHeader from '@/components/SiteHeader'
import ListingCard from '@/components/ListingCard'
import ListingSearch from '@/components/ListingSearch'
import Reveal from '@/components/Reveal'
import { SonarGrid, SwellLine, WakeLines } from '@/components/SectionDecor'
import { Button, SectionHeading } from '@/components/ui'
import { href, type Locale } from '@/i18n/config'
import { getDict } from '@/i18n/dictionary'
import JsonLd from '@/components/JsonLd'
import { itemListSchema } from '@/lib/schema'

type Search = { tipo?: string; marca?: string; ano?: string; tamanho?: string; motor?: string }

export default async function BrokerView({
  locale,
  searchParams,
}: {
  locale: Locale
  searchParams: Promise<Search>
}) {
  const sel = await searchParams
  const t = getDict(locale).broker

  const [all, facets] = await Promise.all([getListings(), getListingFacets()])

  /* Filtragem acumulativa: cada campo preenchido estreita o resultado.
     Espelha os cinco campos de busca do portal de origem. */
  const listings = all.filter((l) => {
    if (sel.tipo && l.kind !== sel.tipo) return false
    if (sel.marca && l.brand !== sel.marca) return false
    if (sel.ano && String(l.year ?? '') !== sel.ano) return false
    if (sel.tamanho && String(l.sizeFt ?? '') !== sel.tamanho) return false
    if (sel.motor && l.engineType !== sel.motor) return false
    return true
  })

  return (
    <>
      <SiteHeader active="broker" locale={locale} />
      <main className="flex-1">
      {/* Diz ao buscador que a pagina e um catalogo, e quais sao os itens. */}
      <JsonLd
        data={itemListSchema(
          listings.map((l) => ({ nome: l.title, url: href('broker', locale, `/${l.slug}`) })),
        )}
      />

      {/* ============ CABEÇALHO ============ */}
      <section
        className="relative isolate overflow-hidden py-16 lg:py-20"
        style={{ background: 'var(--grad-deep)' }}
      >
        <WakeLines side="left" tone="dark" className="top-1/2 -translate-y-1/2" />
        <div className="container-page relative">
          <Reveal>
            <SectionHeading as="h1" inverse eyebrow={t.eyebrow} title={t.title} lede={t.lede} />
            <p className="mt-8 font-mono text-sm text-aqua-400">{t.count(all.length)}</p>
          </Reveal>
        </div>
      </section>

      {/* ============ BUSCA ============ */}
      <nav
        aria-label={t.search}
        className="sticky top-[var(--header-h)] z-40 border-b border-[var(--border-subtle)] bg-[var(--surface-page)]/95 backdrop-blur"
      >
        <div className="container-page py-4">
          <ListingSearch
            locale={locale}
            facets={facets}
            atual={sel}
            action={href('broker', locale)}
          />
          <p className="mt-3 font-mono text-xs text-[var(--text-muted)]">
            {t.count(listings.length)}
          </p>
        </div>
      </nav>

      {/* ============ ESTOQUE ============ */}
      <section className="section-y relative isolate overflow-hidden bg-[var(--surface-page)]">
        <SwellLine side="right" tone="light" className="top-24" />
        <div className="container-page relative">
          {/* A grade precisa de um <h2> que a nomeie: sem ele os cards (h3)
              vinham logo depois do h1 e o nivel h2 ficava pulado. Fica visivel
              apenas para leitores de tela — o titulo da secao ja e dado pelo
              contador logo acima. */}
          <h2 className="sr-only">{t.stockHeading}</h2>
          {listings.length === 0 ? (
            <p className="text-base text-[var(--color-text-body)]">
              {t.empty}{' '}
              <Link href={href('broker', locale)} className="font-semibold text-ocean-700 hover:text-aqua-600">
                {t.filterAll}
              </Link>
            </p>
          ) : (
            /* <ul>/<li> e nao <div>: assim o leitor de tela anuncia "lista de
               N itens" e o visitante sabe quantos anuncios existem. */
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l, i) => (
                <Reveal key={l.id} as="li" delay={i < 4 ? i * 70 : 0}>
                  <ListingCard
                    slug={l.slug}
                    title={l.title}
                    brand={l.brand}
                    year={l.year}
                    priceBrl={l.priceBrl}
                    sizeFt={l.sizeFt}
                    fuel={l.fuel}
                    image={l.heroImage ?? l.images[0]?.url ?? null}
                    sold={l.sold}
                    locale={locale}
                    priority={i < 3}
                  />
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ============ ANUNCIE ============ */}
      <section
        className="relative isolate overflow-hidden py-16 lg:py-20"
        style={{ background: 'var(--grad-technical)' }}
      >
        <SonarGrid side="left" tone="dark" className="top-0" />
        <div className="container-page relative flex flex-wrap items-center justify-between gap-8">
          <SectionHeading inverse title={t.sellTitle} lede={t.sellLede} />
          <Button href={href('vender', locale)} variant="signature" size="lg">
            {t.sellButton}
          </Button>
        </div>
      </section>
      </main>
    </>
  )
}
