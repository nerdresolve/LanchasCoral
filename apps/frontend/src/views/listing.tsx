import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getListingBySlug, getRelatedListings } from '@/lib/queries'
import { brl } from '@/lib/format'
import SiteHeader from '@/components/SiteHeader'
import Gallery from '@/components/Gallery'
import ListingCard from '@/components/ListingCard'
import Reveal from '@/components/Reveal'
import { HullArc, SonarGrid, SwellLine, WakeLines } from '@/components/SectionDecor'
import { Badge, Button, SectionHeading, SpecTable, TextLink } from '@/components/ui'
import { href, type Locale } from '@/i18n/config'
import { getDict } from '@/i18n/dictionary'
import QuoteDialog from '@/components/QuoteDialog'
import JsonLd from '@/components/JsonLd'
import { breadcrumbSchema, listingSchema } from '@/lib/schema'

export default async function ListingView({
  slug,
  locale,
}: {
  slug: string
  locale: Locale
}) {
  const listing = await getListingBySlug(slug)
  if (!listing || !listing.published) notFound()

  const t = getDict(locale).broker
  const related = await getRelatedListings(listing.id)

  /* Linhas da descrição que apenas repetem a ficha (Motor:, Combustível:,
     Horas:) são descartadas — o que sobra é texto editorial de verdade. */
  const REPETE_FICHA = /^(motor|motoriza[çc][ãa]o|combust[íi]vel|horas?|ano|tamanho|capacidade|casco)\s*:/i
  const descricao =
    (listing.description ?? '')
      .split(/\r?\n/)
      .filter((l) => l.trim() && !REPETE_FICHA.test(l.trim()))
      .join('\n')
      .trim() || null
  const temTexto = (descricao?.length ?? 0) > 40

  const specs = [
    { label: t.year, value: listing.year ? String(listing.year) : null },
    { label: t.size, value: listing.sizeFt ? `${listing.sizeFt} ${t.ft}` : null },
    { label: t.brand, value: listing.brand },
    { label: t.fuel, value: listing.fuel },
    { label: t.hull, value: listing.hullType },
    { label: t.capacity, value: listing.capacity },
    { label: t.hours, value: listing.hours },
    { label: t.engine, value: listing.engine },
  ]

  return (
    <>
      <SiteHeader active="broker" locale={locale} />
      <main className="flex-1">
      {/* Preco, disponibilidade e condicao do anuncio para o buscador. */}
      <JsonLd
        data={[
          listingSchema(listing, locale),
          breadcrumbSchema([
            { nome: t.breadcrumb, url: href('broker', locale) },
            { nome: listing.title, url: href('broker', locale, `/${listing.slug}`) },
          ]),
        ]}
      />

      {/* ============ CABEÇALHO ============ */}
      <section
        className="relative isolate overflow-hidden py-14 lg:py-16"
        style={{ background: 'var(--grad-deep)' }}
      >
        <WakeLines side="left" tone="dark" className="top-1/2 -translate-y-1/2" />
        <div className="container-page relative">
          {/* <ol>/<li> e nao spans soltos: sem a lista o leitor de tela nao
              anuncia a profundidade da trilha nem a posicao atual. */}
          <nav aria-label={t.breadcrumbAria} className="font-mono text-xs text-on-dark-muted">
            <ol className="flex items-center gap-2">
              <li>
                <Link href={href('broker', locale)} className="inline-flex min-h-8 items-center transition-colors hover:text-pearl-0">
                  {t.breadcrumb}
                </Link>
              </li>
              {listing.brand && (
                <li className="flex items-center gap-2">
                  <span aria-hidden>/</span>
                  <span aria-current="page">{listing.brand}</span>
                </li>
              )}
            </ol>
          </nav>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-8">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                {listing.sold && <Badge tone="navy">{t.sold}</Badge>}
                {listing.tag && <Badge tone="lime">{listing.tag}</Badge>}
              </div>
              <h1 className="mt-4 font-display text-[length:var(--text-d1)] font-medium leading-[1.02] tracking-[var(--tracking-hero)] text-pearl-0">
                {listing.title}
              </h1>
              <p className="mt-4 font-display text-2xl font-medium text-aqua-400">
                {listing.priceBrl ? brl(listing.priceBrl) : t.onRequest}
              </p>
            </div>

            <QuoteDialog locale={locale} boatSlug={listing.slug} boatLabel={listing.title}>
              <Button href="#" variant="signature" size="lg">
                {t.ctaButton}
              </Button>
            </QuoteDialog>
          </div>
        </div>
      </section>

      {/* ============ GALERIA ============ */}
      {listing.images.length > 0 && (
        <section className="container-page pt-14">
          <Gallery
            images={listing.images.map((i) => ({ url: i.url, alt: i.alt ?? listing.title }))}
            locale={locale}
          />
        </section>
      )}

      {/* ============ FICHA + DESCRIÇÃO ============ */}
      <section className="section-y relative isolate overflow-hidden bg-[var(--surface-page)]">
        <SwellLine side="right" tone="light" className="top-1/2 -translate-y-1/2" />
        <div className="container-page relative">
          <Reveal>
            <SectionHeading eyebrow={t.eyebrow} title={t.specs} />
          </Reveal>

          {/*
            A descrição importada costuma repetir motor/combustível/horas, que
            já aparecem na ficha ao lado. Só entra como texto se sobrar algo
            além disso; caso contrário a ficha ocupa a largura toda.
          */}
          <div
            className={`mt-10 grid grid-cols-1 gap-x-14 gap-y-10 ${
              temTexto ? 'lg:grid-cols-[1fr_1fr]' : ''
            }`}
          >
            <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-7 shadow-[var(--shadow-sm)]">
              <SpecTable rows={specs} columns={temTexto ? 1 : 2} />
            </div>

            {temTexto && (
              <div>
                <h2 className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
                  {t.description}
                </h2>
                <p className="mt-5 whitespace-pre-line text-[16px] leading-[1.7] text-[var(--color-text-body)]">
                  {descricao}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ ACESSÓRIOS ============ */}
      {listing.accessories.length > 0 && (
        <section
          className="relative isolate overflow-hidden py-16 lg:py-20"
          style={{ background: 'var(--grad-technical)' }}
        >
          <SonarGrid side="left" tone="dark" className="top-0" />
          <div className="container-page relative">
            <Reveal>
              <h2 className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-aqua-500">
                {t.accessories}
              </h2>
            </Reveal>
            <ul className="mt-6 grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {listing.accessories.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span aria-hidden className="mt-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-aqua-500" />
                  <span className="text-[15px] leading-[1.6] text-on-dark-muted">{a.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ============ OUTRAS OPORTUNIDADES ============ */}
      {related.length > 0 && (
        <section className="section-y relative isolate overflow-hidden bg-[var(--surface-sunken)]">
          <HullArc side="right" tone="light" className="top-1/2 -translate-y-1/2" />
          <div className="container-page relative">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-8">
                <SectionHeading eyebrow={t.eyebrow} title={t.related} />
                <TextLink href={href('broker', locale)}>{t.allListings}</TextLink>
              </div>
            </Reveal>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((l, i) => (
                <Reveal key={l.id} delay={i < 4 ? i * 70 : 0}>
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
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ CTA ============ */}
      <section className="py-16 lg:py-20 bg-navy-900">
        <div className="container-page flex flex-wrap items-center justify-between gap-8">
          <SectionHeading inverse title={t.ctaTitle} lede={t.ctaLede} />
          <div className="flex flex-wrap gap-4">
            <Button href={href('vender', locale)} variant="outline-inverse" size="lg">
              {t.sellButton}
            </Button>
            <QuoteDialog locale={locale} boatSlug={listing.slug} boatLabel={listing.title}>
              <Button href="#" variant="signature" size="lg">
                {t.ctaButton}
              </Button>
            </QuoteDialog>
          </div>
        </div>
      </section>
      </main>
    </>
  )
}
