import { getBoatBySlug, boatLabel, localizeBoat } from '@/lib/queries'
import SiteHeader from '@/components/SiteHeader'
import ContactForm from '@/components/ContactForm'
import { SectionHeading } from '@/components/ui'
import { COMPANY } from '@/lib/company'
import { href, type Locale } from '@/i18n/config'



const COPY = {
  pt: {
    eyebrow: 'Fale conosco',
    title: 'Vamos conversar',
    titleQuote: (l: string) => `Proposta para a ${l}`,
    lede: 'Propostas, visitas ao estaleiro e atendimento ao proprietário. Nossa equipe responde em breve.',
    ledeQuote: 'Preencha os dados e retornamos com as opções de motorização, acabamento e prazo.',
    commercial: 'Comercial',
    factory: 'Fábrica',
    other: 'Outros canais',
    service: 'Assistência técnica e serviços',
    manual: 'Solicitar manual',
    careers: 'Trabalhe conosco',
  },
  en: {
    eyebrow: 'Talk to Coral',
    title: "Let's talk",
    titleQuote: (l: string) => `Quote for the ${l}`,
    lede: 'Quotes, yard visits and owner support. Our team replies shortly.',
    ledeQuote: 'Send us your details and we will come back with engine, finish and lead-time options.',
    commercial: 'Sales',
    factory: 'Factory',
    other: 'Other channels',
    service: 'Technical service',
    manual: 'Request a manual',
    careers: 'Careers',
  },
} as const

export default async function ContatoView({
  locale,
  searchParams,
}: {
  locale: Locale
  searchParams: Promise<{ modelo?: string }>
}) {
  const c = COPY[locale]
  const { modelo } = await searchParams
  // A proposta pode chegar de um modelo especifico via ?modelo=slug.
  const raw = modelo ? await getBoatBySlug(modelo) : null
  const boat = raw ? localizeBoat(raw, locale) : null
  const label = boat && boat.published ? boatLabel(boat) : undefined

  return (
    <>
      <SiteHeader active="contato" locale={locale} />
      <main className="flex-1">

      <section className="bg-navy-900 py-16 lg:py-20" style={{ background: 'var(--grad-deep)' }}>
        <div className="container-page">
          <SectionHeading as="h1"
            inverse
            eyebrow={c.eyebrow}
            title={label ? c.titleQuote(label) : c.title}
            lede={label ? c.ledeQuote : c.lede}
          />
        </div>
      </section>

      <section className="section-y">
        <div className="container-page grid grid-cols-1 gap-14 lg:grid-cols-[1.5fr_1fr]">
          <ContactForm boatSlug={label ? boat!.slug : undefined} boatLabel={label} locale={locale} />

          <aside className="lg:border-l lg:border-[var(--border-subtle)] lg:pl-12">
            <h2 className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
              {c.commercial}
            </h2>
            <address className="mt-4 not-italic text-[15px] leading-[1.7] text-[var(--color-text-body)]">
              {COMPANY.addressCommercial.full}
              <br />
              <a
                href={`tel:+55${COMPANY.phoneCommercial.replace(/\D/g, '')}`}
                className="inline-block py-1.5 text-ocean-700 underline-offset-4 hover:text-aqua-600 hover:underline"
              >
                {COMPANY.phoneCommercial}
              </a>
            </address>
            <p className="mt-2 text-[13px] text-[var(--text-muted)]">
              {COMPANY.hours.office} · {COMPANY.hours.weekend}
            </p>

            <div className="mt-10 border-t border-[var(--border-subtle)] pt-8">
              <h2 className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
                {c.factory}
              </h2>
              <address className="mt-4 not-italic text-[15px] leading-[1.7] text-[var(--color-text-body)]">
                {COMPANY.address.full}
                <br />
                {COMPANY.phones.map((t, i) => (
                  <span key={t}>
                    {i > 0 && ' · '}
                    <a
                      href={`tel:+55${t.replace(/\D/g, '')}`}
                      className="inline-block py-1.5 text-ocean-700 underline-offset-4 hover:text-aqua-600 hover:underline"
                    >
                      {t}
                    </a>
                  </span>
                ))}
              </address>
              <p className="mt-2 text-[13px] text-[var(--text-muted)]">{COMPANY.hours.factory}</p>
            </div>

            <div className="mt-10 border-t border-[var(--border-subtle)] pt-8">
              <h2 className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
                {c.other}
              </h2>
              <ul className="mt-4 flex flex-col gap-2 text-[15px]">
                <li>
                  <a href={href('servicos', locale)} className="inline-flex min-h-10 items-center text-ocean-700 underline-offset-4 hover:text-aqua-600 hover:underline">
                    {c.service}
                  </a>
                </li>
                <li>
                  <a href={href('manual', locale)} className="inline-flex min-h-10 items-center text-ocean-700 underline-offset-4 hover:text-aqua-600 hover:underline">
                    {c.manual}
                  </a>
                </li>
                <li>
                  <a href={href('trabalhe', locale)} className="inline-flex min-h-10 items-center text-ocean-700 underline-offset-4 hover:text-aqua-600 hover:underline">
                    {c.careers}
                  </a>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
      </main>
    </>
  )
}
