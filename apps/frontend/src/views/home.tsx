import Image from 'next/image'
import { getBoats } from '@/lib/queries'
import { href, type Locale } from '@/i18n/config'
import { getDict } from '@/i18n/dictionary'
import { toNum, num } from '@/lib/format'
import BoatCard from '@/components/BoatCard'
import SiteHeader from '@/components/SiteHeader'
import QuoteDialog from '@/components/QuoteDialog'
import HeroImage from '@/components/HeroImage'
import Carousel from '@/components/Carousel'
import Reveal from '@/components/Reveal'
import { SonarGrid, SwellLine, WakeLines } from '@/components/SectionDecor'
import {
  IconAnchor,
  IconCompass,
  IconHull,
  IconLayers,
  IconPropeller,
  IconRuler,
  IconShield,
  IconWaves,
  IconWrench,
} from '@/components/icons'
import { Button, SectionHeading, TextLink } from '@/components/ui'

/*
 * Icones dos pilares de "Como nós fabricamos". O TEXTO vive no dicionario
 * (getDict(locale).home.pillars): antes estava fixo em portugues aqui, e a
 * home em ingles servia a secao inteira em portugues.
 */
const PILLAR_ICONS = [IconLayers, IconShield, IconCompass, IconWrench]


export default async function HomeView({ locale }: { locale: Locale }) {
  const t = getDict(locale).home
  const boats = await getBoats()

  const byLength = [...boats].sort((a, b) => (toNum(b.lengthM) ?? 0) - (toNum(a.lengthM) ?? 0))
  /*
   * Seis, e não oito: cada cartão puxa uma foto de ~45KB, e o carrossel mostra
   * três por vez. As duas últimas nunca entram em tela sem duas passadas de
   * seta, mas pesavam na fila inicial junto com a foto do hero. Quem quiser a
   * linha completa tem o "Todos os modelos" logo abaixo.
   */
  const fleet = byLength.slice(0, 6)

  const families = new Set(boats.map((b) => b.familyId).filter(Boolean)).size
  const lengths = boats.map((b) => toNum(b.lengthM)).filter((n): n is number => n !== null)
  const longest = lengths.length ? Math.max(...lengths) : null
  const maxHp = Math.max(0, ...boats.map((b) => b.powerMaxHp ?? 0))

  const heroBoat = byLength.find((b) => b.heroImage) ?? null
  const heroImage = heroBoat?.heroImage ?? null
  const yardImage = byLength.find((b) => b.id !== heroBoat?.id && b.heroImage)?.heroImage ?? null

  const stats = [
    { Icon: IconHull, value: String(boats.length), unit: null, label: t.statModels },
    { Icon: IconAnchor, value: String(families), unit: null, label: t.statFamilies },
    { Icon: IconRuler, value: longest !== null ? num(longest, 2) : '—', unit: 'm', label: t.statLongest },
    { Icon: IconPropeller, value: maxHp > 0 ? String(maxHp) : '—', unit: 'hp', label: t.statPower },
  ]

  return (
    <>
      <SiteHeader transparent active="home" locale={locale} />
      <main className="flex-1">

      {/* ================= HERO ================= */}
      <section className="relative isolate -mt-[var(--header-h)] flex min-h-[680px] flex-col justify-center overflow-hidden bg-navy-900 pt-[var(--header-h)] lg:min-h-[min(94vh,880px)]">
        {/* Coral 36 navegando na Baía de Guanabara. Escolhida entre as fotos
            do acervo por ser a de melhor resolução com a embarcação à direita
            e mar/céu à esquerda, atrás do texto. */}
        <HeroImage alt="" />

        {/* Cortina diagonal: sólida sob o texto, abrindo para a mídia à direita.
            Empilhamento pela ORDEM DO DOM, sem z-index negativo. Com a foto
            num contexto de `z-index: -30`, o Chrome nunca a registrava como
            candidata a LCP: o trace mostrava zero candidatos e o Lighthouse
            caía em `NO_LCP`. Aqui as cortinas vêm depois da foto no DOM, o
            que já as põe por cima, e o conteúdo recebe `relative`. */}
        <div aria-hidden className="absolute inset-0" style={{ background: 'var(--scrim-hero)' }} />
        <div aria-hidden className="absolute inset-0" style={{ background: 'var(--scrim-hero-v)' }} />

        <div className="container-page relative w-full py-14">
          <div className="max-w-[52ch]">
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-[image:var(--wave-line)]" />
              <span className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-aqua-400">
                {t.eyebrow}
              </span>
            </div>

            <h1 className="mt-7 font-display text-[length:var(--text-hero)] font-medium leading-[1.02] tracking-[var(--tracking-hero)] text-pearl-0">
              {t.title1}
              <br />
              <span className="bg-[image:linear-gradient(100deg,#FFFFFF_0%,#CFE9F5_42%,var(--color-aqua-400)_100%)] bg-clip-text text-transparent">
                {t.title2}
              </span>
            </h1>

            <p className="mt-6 max-w-[46ch] text-[17px] leading-[1.6] text-on-dark-soft">{t.lede}</p>

            {/* Sai do limite de 52ch do texto para os dois CTAs caberem lado a lado. */}
            <div className="mt-10 flex flex-wrap gap-4 sm:w-max sm:max-w-[46rem]">
              <Button href={href('modelos', locale)} variant="signature" size="lg">
                {t.ctaLine}
              </Button>
              <Button href={href('contato', locale)} variant="outline-inverse" size="lg">
                {t.ctaVisit}
              </Button>
            </div>
          </div>
        </div>

        {/* Rail de números com ícone, como na referência. */}
        <div className="container-page relative w-full pb-12">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-7 border-t border-white/12 pt-7 sm:grid-cols-4">
            {/* Um <dl> so aceita <dt>/<dd> como filhos diretos, ou um <div>
                envolvendo o par. O icone vive DENTRO do <dd> — antes era um
                <span> irmao, o que tornava a lista invalida. */}
            {stats.map((s) => (
              <div key={s.label}>
                <dd className="flex items-start gap-3.5 font-display text-2xl font-medium leading-none tracking-[var(--tracking-display)] text-pearl-0">
                  <span aria-hidden className="mt-0.5 shrink-0 text-aqua-400">
                    <s.Icon size={22} />
                  </span>
                  <span>
                    {s.value}
                    {s.unit && <span className="ml-1 font-mono text-sm text-on-dark-muted">{s.unit}</span>}
                  </span>
                </dd>
                <dt className="mt-2 pl-[35px] font-body text-[10px] font-bold uppercase leading-tight tracking-[var(--tracking-eyebrow)] text-on-dark-muted">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ================= A LINHA (claro) ================= */}
      <section className="section-y relative isolate overflow-hidden bg-[var(--surface-page)]">
        <WakeLines side="left" tone="light" className="top-1/2 -translate-y-1/2 opacity-70" />
        <div className="container-page relative">
          <Reveal className="flex flex-wrap items-end justify-between gap-8">
            <SectionHeading
              eyebrow={t.fleetEyebrow}
              index="01 / 04"
              title={t.fleetTitle(boats.length)}
              lede={t.fleetLede}
            />
            <TextLink href={href('modelos', locale)}>{t.allModels}</TextLink>
          </Reveal>

          <Carousel className="mt-14" label={t.fleetEyebrow}>
            {fleet.map((b, i) => (
              <BoatCard
                key={b.id}
                slug={b.slug}
                name={b.name}
                variant={b.variant}
                family={b.family?.name}
                lengthM={b.lengthM}
                powerMaxHp={b.powerMaxHp}
                capacityPeople={b.capInteriorDay ?? b.capOpenSeaDay}
                image={b.heroImage ?? b.images[0]?.url ?? null}
                badge={i === 0 ? t.topOfLine : null}
                badgeTone="lime"
                // Sem `priority`: o carrossel comeca ~1300px abaixo da dobra,
                // e marcar os primeiros cards como prioritarios fazia 3 fotos
                // disputarem banda com a foto do hero, que e o LCP de fato.
                priority={false}
                locale={locale}
              />
            ))}
          </Carousel>
        </div>
      </section>

      {/* ================= POR QUE CORAL ================= */}
      <section
        className="section-y relative isolate overflow-hidden"
        style={{ background: 'var(--grad-deep)' }}
      >
        <SwellLine side="right" tone="dark" className="top-1/2 -translate-y-1/2" />
        <div className="container-page relative">
          <Reveal>
            <SectionHeading inverse eyebrow={t.whyEyebrow} index="02 / 04" title={t.whyTitle} />
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.pillars.map((p, i) => (
              <Reveal
                key={p.title}
                delay={i * 70}
                // Flutuação de 4px com sombra projetada: o cartão parece
                // descolar da superfície em vez de só clarear. `motion-safe`
                // porque quem pediu menos animação não deve receber
                // movimento nenhum — o realce de cor continua valendo.
                className="rounded-[var(--radius-md)] border border-[var(--border-on-dark)] bg-white/[0.03] p-7 transition-[transform,box-shadow,background-color,border-color] duration-[320ms] ease-[var(--ease-glide)] hover:border-aqua-500/40 hover:bg-white/[0.06] motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_18px_40px_-16px_rgba(0,0,0,0.55)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-aqua-500">
                    {(() => { const Icon = PILLAR_ICONS[i] ?? IconLayers; return <Icon size={26} /> })()}
                  </span>
                  <span className="font-mono text-xs text-on-dark-muted">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold tracking-[var(--tracking-display)] text-pearl-0">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-[1.65] text-on-dark-muted">{p.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= O ESTALEIRO ================= */}
      <section className="relative isolate overflow-hidden bg-[var(--surface-sunken)]">
        <SonarGrid side="left" tone="light" className="top-0 opacity-60" />
        <div className="container-page relative grid grid-cols-1 items-center gap-12 py-20 lg:grid-cols-2 lg:py-[var(--section-y)]">
          <div>
            <SectionHeading
              eyebrow={t.yardEyebrow}
              index="03 / 04"
              title={t.yardTitle}
              lede={t.yardLede}
            />

            <div className="mt-8 flex flex-wrap gap-2.5">
              {t.diferenciais.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3.5 py-2 font-body text-xs font-semibold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ocean-700" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Mídia com painel de números sobreposto, como na referência. */}
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] bg-navy-800 shadow-[var(--shadow-lg)]">
              {yardImage && (
                <Image
                  src={yardImage}
                  alt="Embarcação Coral"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              )}
              <div aria-hidden className="absolute inset-0" style={{ background: 'var(--scrim-bottom)' }} />
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-on-dark)] bg-[var(--border-on-dark)] lg:absolute lg:-bottom-8 lg:-right-6 lg:mt-0 lg:w-56 lg:grid-cols-1 lg:shadow-[var(--shadow-lg)]">
              {[
                { v: '3.000', u: '+', l: t.statHulls, Icon: IconWaves },
                { v: '6.000', u: 'm²', l: t.statArea, Icon: IconLayers },
                { v: '10', u: 'anos', l: t.statWarranty, Icon: IconShield },
              ].map((s) => (
                <div key={s.l} className="bg-navy-900 px-5 py-4">
                  <dd className="flex items-baseline gap-1.5">
                    <span className="font-display text-xl font-semibold text-pearl-0">{s.v}</span>
                    <span className="font-mono text-xs text-aqua-400">{s.u}</span>
                  </dd>
                  <dt className="mt-1.5 font-body text-[10px] font-bold uppercase leading-tight tracking-[var(--tracking-eyebrow)] text-on-dark-muted">
                    {s.l}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="section-y bg-[var(--surface-page)]">
        <div className="container-page">
          {/* `bg-navy-900` no cartão, e não só a foto com a cortina por cima:
              o texto é branco, mas as ferramentas de acessibilidade não
              enxergam nem a imagem (`-z-20`) nem a cortina (`aria-hidden`) —
              calculavam o contraste contra o fundo CLARO da seção e acusavam
              1.07:1 num bloco que, na tela, está perfeitamente legível.
              A cor sólida atrás dá a elas o valor real. */}
          <div className="relative isolate overflow-hidden rounded-[var(--radius-lg)] bg-navy-900 shadow-[var(--shadow-lg)]">
            {heroImage && (
              <Image src={heroImage} alt="" fill sizes="100vw" className="-z-20 object-cover" />
            )}
            <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'var(--scrim-hero)' }} />

            <div className="flex flex-wrap items-center justify-between gap-10 px-8 py-14 lg:px-14 lg:py-16">
              <SectionHeading inverse eyebrow={t.ctaEyebrow} title={t.ctaTitle} lede={t.ctaLede} />
              <div className="flex flex-wrap gap-4">
                <QuoteDialog locale={locale}>
                  <Button href="#" variant="signature" size="lg">
                    {getDict(locale).nav.quote}
                  </Button>
                </QuoteDialog>
                <Button href={href('sobre', locale)} variant="outline-inverse" size="lg">
                  {t.ctaYard}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
    </>
  )
}
