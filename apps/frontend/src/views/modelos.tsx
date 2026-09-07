import Link from 'next/link'
import { getFamiliesWithBoats } from '@/lib/queries'
import BoatCard from '@/components/BoatCard'
import SiteHeader from '@/components/SiteHeader'
import QuoteDialog from '@/components/QuoteDialog'
import Reveal from '@/components/Reveal'
import { SonarGrid, SwellLine, WakeLines } from '@/components/SectionDecor'
import { Button, SectionHeading } from '@/components/ui'
import { href, type Locale } from '@/i18n/config'
import { getDict } from '@/i18n/dictionary'


/**
 * Hull-type filters, rendered as the design system's Tabs: a hairline rail with
 * an aqua underline on the active item. The taxonomy lives in the boat variant.
 */
const FILTERS = [
  { key: 'todos', labelKey: 'filterAll' },
  { key: 'abertas', labelKey: 'filterOpen', match: /aberta/i },
  { key: 'cabinadas', labelKey: 'filterCabin', match: /cabinada/i },
  { key: 'fly', labelKey: 'filterFly', match: /fly|\bht\b/i },
] as const satisfies readonly {
  key: string
  labelKey: 'filterAll' | 'filterOpen' | 'filterCabin' | 'filterFly'
  match?: RegExp
}[]

type Search = { tipo?: string }
type FamilyBoat = Awaited<ReturnType<typeof getFamiliesWithBoats>>[number]['boats'][number]

function Card({ boat: b, family, locale }: { boat: FamilyBoat; family?: string; locale: Locale }) {
  return (
    <BoatCard
      slug={b.slug}
      name={b.name}
      variant={b.variant}
      family={family}
      lengthM={b.lengthM}
      powerMaxHp={b.powerMaxHp}
      capacityPeople={b.capInteriorDay ?? b.capOpenSeaDay}
      image={b.heroImage ?? b.images[0]?.url ?? null}
      badge={/blackline/i.test(b.variant ?? '') ? 'Blackline' : null}
      badgeTone="navy"
      locale={locale}
    />
  )
}

/** Section rule: family name, hairline, count. */
function FamilyRule({
  name,
  count,
  render,
}: {
  name: string
  count: number
  render: (n: number) => string
}) {
  return (
    <div className="flex items-baseline gap-5">
      <h2 className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
        {name}
      </h2>
      <span aria-hidden className="h-px flex-1 bg-[var(--border-subtle)]" />
      <span className="shrink-0 rounded-[var(--radius-xs)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-2.5 py-1 font-mono text-xs text-[var(--text-muted)]">
        {render(count)}
      </span>
    </div>
  )
}

export default async function ModelosView({
  locale,
  searchParams,
}: {
  locale: Locale
  searchParams: Promise<Search>
}) {
  const t = getDict(locale).models
  const { tipo } = await searchParams
  const active = FILTERS.find((f) => f.key === tipo) ?? FILTERS[0]

  const families = await getFamiliesWithBoats()

  const groups = families
    .map((f) => ({
      ...f,
      boats:
        'match' in active && active.match
          ? f.boats.filter((b) => active.match.test(`${b.name} ${b.variant ?? ''}`))
          : f.boats,
    }))
    .filter((f) => f.boats.length > 0)

  const total = groups.reduce((n, f) => n + f.boats.length, 0)
  const multi = groups.filter((f) => f.boats.length > 1)
  const single = groups.filter((f) => f.boats.length === 1)

  return (
    <>
      <SiteHeader active="modelos" locale={locale} />
      <main className="flex-1">

      {/* ============ PAGE HEAD ============ */}
      <section
        className="relative isolate overflow-hidden pb-20 pt-20 lg:pb-28 lg:pt-28"
        style={{ background: 'var(--grad-deep)' }}
      >
        <WakeLines side="left" tone="dark" className="top-1/2 -translate-y-1/2" />
        <div className="container-page relative">
          <Reveal>
            <SectionHeading as="h1"
              inverse
              eyebrow={t.eyebrow}
              title={t.title}
              lede={t.lede(total)}
            />
          </Reveal>
        </div>
      </section>

      {/* ============ FILTER RAIL ============ */}
      <nav
        aria-label={t.filterAria}
        className="sticky top-[var(--header-h)] z-40 border-b border-[var(--border-subtle)] bg-[var(--surface-page)]/95 backdrop-blur"
      >
        <div className="container-page flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap">
            {FILTERS.map((f) => {
              const on = f.key === active.key
              return (
                <Link
                  key={f.key}
                  href={href('modelos', locale, f.key === 'todos' ? '' : `?tipo=${f.key}`)}
                  aria-current={on ? 'true' : undefined}
                  className={`-mb-px border-b-2 px-4 py-4 font-body text-xs font-bold uppercase tracking-[var(--tracking-wide)] transition-colors first:pl-0 ${
                    on
                      ? 'border-aqua-500 text-[var(--text-strong)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-strong)]'
                  }`}
                >
                  {t[f.labelKey]}
                </Link>
              )
            })}
          </div>
          <span className="font-mono text-xs text-[var(--text-muted)]">
            {t.countModels(total)} · {t.sortedBy}
          </span>
        </div>
      </nav>

      {/* ============ FAMILIES ============ */}
      {groups.length === 0 ? (
        <p className="container-page py-24 text-base text-[var(--color-text-body)]">
          {t.emptyFilter}{' '}
          <Link href={href('modelos', locale)} className="font-semibold text-ocean-700 hover:text-aqua-600">
            {t.seeAll}
          </Link>
          .
        </p>
      ) : (
        <div className="relative isolate overflow-hidden bg-[var(--surface-page)] pb-4">
          <SwellLine side="right" tone="light" className="top-24" />
          <div className="container-page relative">
            {/* Multi-version families keep their own labelled block — that grouping
                is the point of the page. Single-version families flow into one
                shared grid rather than stranding a card per row. */}
            {multi.map((f) => (
              <section key={f.id} className="pt-20 lg:pt-24">
                <Reveal>
                  <FamilyRule name={f.name} count={f.boats.length} render={t.versions} />
                </Reveal>
                <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {f.boats.map((b, i) => (
                    <Reveal key={b.id} as="li" delay={i < 4 ? i * 70 : 0}>
                      <Card boat={b} family={f.name} locale={locale} />
                    </Reveal>
                  ))}
                </ul>
              </section>
            ))}

            {single.length > 0 && (
              <section className="pt-20 lg:pt-24">
                <Reveal>
                  <FamilyRule name={t.otherModels} count={single.length} render={t.countUnits} />
                </Reveal>
                <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {single.map((f, i) => (
                    <Reveal key={f.boats[0].id} as="li" delay={i < 4 ? i * 70 : 0}>
                      <Card boat={f.boats[0]} family={f.name} locale={locale} />
                    </Reveal>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}

      {/* ============ CLOSING ============ */}
      <section
        className="relative isolate mt-24 overflow-hidden py-20 lg:py-28"
        style={{ background: 'var(--grad-deep)' }}
      >
        <SonarGrid side="left" tone="dark" className="top-0" />
        <div className="container-page relative flex flex-wrap items-center justify-between gap-10">
          <SectionHeading
            inverse
            title={t.closingTitle}
            lede={t.closingLede}
          />
          <QuoteDialog locale={locale}>
            <Button href="#" variant="signature" size="lg">
              {t.closingCta}
            </Button>
          </QuoteDialog>
        </div>
      </section>
      </main>
    </>
  )
}
