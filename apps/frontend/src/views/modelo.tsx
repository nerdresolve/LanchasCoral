import { notFound } from 'next/navigation'
import Image from 'next/image'
import HeroVideo from '@/components/HeroVideo'
import Link from 'next/link'
import { getBoatBySlug, getSiblingBoats, boatLabel, localizeBoat, localizeEquipment } from '@/lib/queries'
import { href, type Locale } from '@/i18n/config'
import { getDict } from '@/i18n/dictionary'
import { meters, litres, kilos, hp, people, num } from '@/lib/format'
import Gallery from '@/components/Gallery'
import EquipmentPanels from '@/components/EquipmentPanels'
import SiteHeader from '@/components/SiteHeader'
import QuoteDialog from '@/components/QuoteDialog'
import BotaoComparar from '@/components/comparador/BotaoComparar'
import BoatCard from '@/components/BoatCard'
import Reveal from '@/components/Reveal'
import { HullArc, SonarGrid, SwellLine, WakeLines } from '@/components/SectionDecor'
import {
  Badge,
  Button,
  SectionHeading,
  SpecTable,
  StatBlock,
  TextLink,
} from '@/components/ui'
import JsonLd from '@/components/JsonLd'
import { boatSchema, breadcrumbSchema } from '@/lib/schema'
import { IconDownload } from '@/components/icons'

type Perf = { label: string; fuel: string | null; cruiseLh: number | null; avgLh: number | null }

export default async function BoatView({ slug, locale }: { slug: string; locale: Locale }) {
  const raw = await getBoatBySlug(slug)
  if (!raw || !raw.published) notFound()

  const t = getDict(locale).boat
  // Campos *En vazios caem no portugues.
  const boat = localizeBoat(raw, locale)
  const label = boatLabel(boat)
  const perf = (Array.isArray(boat.performance) ? boat.performance : []) as unknown as Perf[]
  const siblings = await getSiblingBoats(boat)
  const heroImage = boat.heroImage ?? boat.images[0]?.url ?? null

  // Key figures rail — only what this boat actually has.
  const keyFigures = [
    { value: num(boat.lengthM), unit: 'm', label: t.length },
    { value: num(boat.beamM), unit: 'm', label: t.beam },
    { value: boat.powerMaxHp?.toString() ?? null, unit: 'hp', label: t.maxPower },
    {
      value: (boat.capInteriorDay ?? boat.capOpenSeaDay)?.toString() ?? null,
      unit: 'pax',
      label: t.capacity,
    },
  ].filter((f) => f.value)

  const dimensions = [
    { label: 'Comprimento', value: meters(boat.lengthM) },
    { label: 'Boca', value: meters(boat.beamM) },
    { label: 'Pontal', value: meters(boat.depthM) },
    { label: 'Calado', value: meters(boat.draftM) },
    { label: 'Pé-direito da cabine', value: meters(boat.cabinHeightM) },
    { label: 'Peso sem motor', value: kilos(boat.weightKg) },
    { label: 'Peso do motor', value: kilos(boat.engineWeightKg) },
  ]

  const engineAndTanks = [
    { label: 'Motorização mínima', value: hp(boat.powerMinHp) },
    { label: 'Motorização máxima', value: hp(boat.powerMaxHp) },
    { label: 'Tanque de combustível', value: litres(boat.fuelL) },
    { label: 'Tanque de água', value: litres(boat.waterL) },
    { label: 'Interior (dia / pernoite)', value: people(boat.capInteriorDay, boat.capInteriorNight) },
    { label: 'Mar aberto (dia / pernoite)', value: people(boat.capOpenSeaDay, boat.capOpenSeaNight) },
  ]

  return (
    <>
      <SiteHeader transparent active="modelos" locale={locale} />
      <main className="flex-1">
      {/* Especificacoes do modelo. Sem `offers`: a Coral nao publica preco de
          barco novo, e marcar oferta sem preco na tela e considerado enganoso. */}
      <JsonLd
        data={[
          boatSchema(boat, locale),
          breadcrumbSchema([
            { nome: t.breadcrumb, url: href('modelos', locale) },
            { nome: label, url: href('modelos', locale, `/${boat.slug}`) },
          ]),
        ]}
      />

      {/* ================= HERO ================= */}
      <section className="relative isolate -mt-[var(--header-h)] flex min-h-[560px] flex-col justify-end overflow-hidden bg-navy-900 pt-[var(--header-h)] lg:min-h-[min(78vh,720px)]">
        {/* A imagem fica, e é ela que o Lighthouse mede como LCP. O vídeo
            entra por cima só depois de carregado — e não entra em quem pediu
            menos movimento ou está em conexão limitada. */}
        {heroImage && (
          <Image src={heroImage} alt={label} fill priority sizes="100vw" className="-z-30 object-cover" />
        )}
        {boat.heroVideo && <HeroVideo src={boat.heroVideo} />}
        <div aria-hidden className="absolute inset-0 -z-20" style={{ background: 'var(--scrim-hero)' }} />
        <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'var(--scrim-hero-v)' }} />

        <div className="container-page relative w-full pb-14 pt-10">
          {/* <ol>/<li>: sem a lista o leitor de tela nao anuncia profundidade
              nem posicao na trilha. */}
          <nav aria-label={t.breadcrumbAria} className="font-mono text-xs text-on-dark-muted">
            <ol className="flex items-center gap-2">
              <li>
                <Link href={href('modelos', locale)} className="inline-flex min-h-8 items-center transition-colors hover:text-pearl-0">
                  {t.breadcrumb}
                </Link>
              </li>
              {boat.family && (
                <li className="flex items-center gap-2">
                  <span aria-hidden>/</span>
                  <span aria-current="page">{boat.family.name}</span>
                </li>
              )}
            </ol>
          </nav>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-8">
            <div>
              {boat.variant && (
                <Badge tone={/blackline/i.test(boat.variant) ? 'lime' : 'outline-inverse'}>
                  {boat.variant}
                </Badge>
              )}
              <h1 className="mt-4 font-display text-[length:var(--text-d1)] font-medium leading-[1.02] tracking-[var(--tracking-hero)] text-pearl-0">
                {boat.name}
              </h1>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button href="#ficha-tecnica" variant="outline-inverse" size="md">
                {t.specsCta}
              </Button>
              {/* `download` baixa o arquivo em vez de abrir no leitor embutido;
                  `target` serve de saida se o navegador ignorar o atributo. */}
              {boat.manualUrl && (
                <a
                  href={boat.manualUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-[var(--radius-pill)] border border-[var(--border-on-dark-strong)] px-5 font-body text-xs font-bold uppercase tracking-[var(--tracking-wide)] text-pearl-0 transition-colors duration-[140ms] hover:border-aqua-500 hover:text-aqua-500"
                >
                  <IconDownload size={15} />
                  {t.manualCta}
                </a>
              )}
              <BotaoComparar
                locale={locale}
                variante="barra"
                modelo={{
                  slug: boat.slug,
                  rotulo: label,
                  foto: boat.images[0]?.url ?? null,
                }}
              />
              <QuoteDialog locale={locale} boatSlug={boat.slug} boatLabel={label}>
                <Button href="#" variant="signature" size="md">
                  {t.requestQuote}
                </Button>
              </QuoteDialog>
            </div>
          </div>
        </div>
      </section>

      {/* ================= KEY FIGURES ================= */}
      {keyFigures.length > 0 && (
        <section className="relative isolate overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--surface-sunken)]">
          <SonarGrid side="left" tone="light" className="top-0" />
          {/* <ul> e nao <dl>: o wrapper de animacao entra entre a lista e o
              conteudo, e um <dl> so admite <dt>/<dd> (ou um <div> com o par)
              como filho direto — a estrutura ficaria invalida. */}
          <ul className="container-page relative grid grid-cols-2 gap-4 py-10 lg:grid-cols-4 lg:py-12">
            {keyFigures.map((f, i) => (
              <Reveal key={f.label} as="li" delay={i < 4 ? i * 70 : 0}>
                <div className="h-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-5 py-5 shadow-[var(--shadow-sm)] transition-colors duration-[240ms] ease-[var(--ease-glide)] hover:border-ocean-700/40">
                  <StatBlock value={f.value} unit={f.unit} label={f.label} />
                </div>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      {/* ================= GALLERY ================= */}
      {boat.images.length > 0 && (
        <section className="container-page pt-16 lg:pt-20">
          <Gallery images={boat.images.map((i) => ({ url: i.url, alt: i.alt ?? label }))} locale={locale} />
        </section>
      )}

      {/* ================= SPECS ================= */}
      <section
        id="ficha-tecnica"
        className="section-y relative isolate overflow-hidden scroll-mt-[var(--header-h)] bg-[var(--surface-page)]"
      >
        <SwellLine side="right" tone="light" className="top-1/2 -translate-y-1/2" />
        <div className="container-page relative">
          <Reveal>
            <SectionHeading eyebrow={t.specsEyebrow} title={t.specsTitle} />
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-6 lg:mt-16 lg:grid-cols-2">
            <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-7 shadow-[var(--shadow-sm)] lg:p-8">
              <h3 className="mb-1 border-b border-[var(--border-subtle)] pb-4 font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
                {t.dimensions}
              </h3>
              <SpecTable rows={dimensions} className="[&>*:last-child]:border-b-0" />
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-7 shadow-[var(--shadow-sm)] lg:p-8">
              <h3 className="mb-1 border-b border-[var(--border-subtle)] pb-4 font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
                {t.engineTanks}
              </h3>
              <SpecTable rows={engineAndTanks} className="[&>*:last-child]:border-b-0" />
            </div>
          </div>
        </div>
      </section>

      {/* ================= PERFORMANCE ================= */}
      {perf.length > 0 && (
        <section
          className="relative isolate overflow-hidden py-20 lg:py-28"
          style={{ background: 'var(--grad-technical)' }}
        >
          <WakeLines side="left" tone="dark" className="top-1/2 -translate-y-1/2" />
          <div className="container-page relative">
            <Reveal>
              <SectionHeading inverse eyebrow={t.perfEyebrow} title={t.perfTitle} />
            </Reveal>

            <div className="mt-14 grid grid-cols-1 gap-6 lg:mt-16 lg:grid-cols-2">
              {perf.map((p, i) => (
                <div
                  key={i}
                  className="rounded-[var(--radius-md)] border border-[var(--border-on-dark)] bg-white/[0.04] p-8 transition-colors duration-[240ms] ease-[var(--ease-glide)] hover:border-[var(--border-on-dark-strong)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-display text-xl font-semibold tracking-[var(--tracking-display)] text-pearl-0">
                      {p.label}
                    </div>
                    {/* Legacy labels often already end in the fuel type; don't repeat it. */}
                    {p.fuel && !p.label?.toLowerCase().includes(p.fuel.toLowerCase()) && (
                      <Badge tone="outline-inverse">{p.fuel}</Badge>
                    )}
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-6 border-t border-[var(--border-on-dark)] pt-6">
                    <StatBlock inverse value={p.cruiseLh ?? '—'} unit="L/h" label={t.cruise} />
                    <StatBlock inverse value={p.avgLh ?? '—'} unit="L/h" label={t.average} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= DESCRIPTION + EQUIPMENT ================= */}
      {(boat.description || boat.equipment.length > 0) && (
        <section className="section-y relative isolate overflow-hidden bg-[var(--surface-page)]">
          <WakeLines side="right" tone="light" className="top-1/2 -translate-y-1/2 opacity-70" />
          <div className="container-page relative">
            <Reveal>
              <SectionHeading eyebrow={t.equipEyebrow} title={t.equipTitle} />
            </Reveal>

            {boat.description && (
              <p className="mt-8 max-w-[var(--layout-narrow)] whitespace-pre-line text-base leading-[1.65] text-[var(--color-text-body)]">
                {boat.description}
              </p>
            )}

            {boat.equipment.length > 0 && (
              <div className="mt-10">
                <EquipmentPanels
                  items={boat.equipment
                    .map((e) => localizeEquipment(e, locale))
                    .map((e) => ({ panel: e.panel, text: e.text }))}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================= SIBLINGS ================= */}
      {siblings.length > 0 && (
        <section
          className="relative isolate overflow-hidden py-16 lg:py-20"
          style={{ background: 'var(--grad-technical)' }}
        >
          <HullArc side="left" tone="dark" className="top-1/2 -translate-y-1/2" />
          <div className="container-page relative">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-8">
                <SectionHeading inverse eyebrow={t.siblingsEyebrow} title={t.siblingsTitle} />
                <TextLink inverse href={href('modelos', locale)}>
                  {getDict(locale).home.allModels}
                </TextLink>
              </div>
            </Reveal>

            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.map((s, i) => (
                <Reveal key={s.id} delay={i < 4 ? i * 70 : 0}>
                  <BoatCard
                    slug={s.slug}
                    name={s.name}
                    variant={s.variant}
                    lengthM={s.lengthM}
                    powerMaxHp={s.powerMaxHp}
                    capacityPeople={s.capInteriorDay ?? s.capOpenSeaDay}
                    image={s.heroImage ?? s.images[0]?.url ?? null}
                    locale={locale}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= CTA ================= */}
      <section className="section-y bg-[var(--surface-page)]">
        <div className="container-page">
          <div
            className="relative isolate overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]"
            style={{ background: 'var(--grad-deep)' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-10 px-8 py-14 lg:px-14 lg:py-16">
              <SectionHeading
                inverse
                title={t.interestedIn(label)}
                lede={t.interestedLede}
              />
              <div className="flex flex-wrap gap-4">
                <Button href={href('contato', locale)} variant="outline-inverse" size="lg">
                  {t.scheduleVisit}
                </Button>
                <QuoteDialog locale={locale} boatSlug={boat.slug} boatLabel={label}>
                  <Button href="#" variant="signature" size="lg">
                    {t.requestQuote}
                  </Button>
                </QuoteDialog>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
    </>
  )
}
