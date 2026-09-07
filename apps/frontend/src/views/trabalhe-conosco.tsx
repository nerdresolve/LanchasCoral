import PageShell from '@/components/PageShell'
import ContactForm from '@/components/ContactForm'
import type { Locale } from '@/i18n/config'

export default function TrabalheConoscoView({ locale }: { locale: Locale }) {
  const COPY = {
    pt: {
      eyebrow: 'Pessoas',
      title: 'Trabalhe conosco',
      lede: 'Representantes, fornecedores, prestadores de serviço e colaboradores.',
      /* Áreas oferecidas no formulário do site legado. */
      areas: ['Representante', 'Fornecedor', 'Prestador de serviços', 'Colaborador'],
      messageLabel: 'Área de interesse e apresentação',
      messagePlaceholder: 'Conte em qual área tem interesse e um resumo da sua experiência.',
      submitLabel: 'Enviar candidatura',
      note: 'Para envio de currículo em anexo, responda ao e-mail de confirmação que você receberá.',
    },
    en: {
      eyebrow: 'People',
      title: 'Careers',
      lede: 'Sales representatives, suppliers, service partners and team members.',
      areas: ['Sales representative', 'Supplier', 'Service partner', 'Team member'],
      messageLabel: 'Area of interest and introduction',
      messagePlaceholder: 'Tell us which area interests you and a summary of your experience.',
      submitLabel: 'Send application',
      note: 'To attach a CV, simply reply to the confirmation e-mail you will receive.',
    },
  }[locale]

  return (
    <PageShell locale={locale} eyebrow={COPY.eyebrow} title={COPY.title} lede={COPY.lede}>
      <div className="mb-10 flex flex-wrap gap-2.5">
        {COPY.areas.map((a) => (
          <span
            key={a}
            className="inline-flex items-center rounded-[var(--radius-xs)] border border-[var(--border-subtle)] px-3 py-2 font-body text-xs font-semibold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]"
          >
            {a}
          </span>
        ))}
      </div>

      <ContactForm locale={locale}
        kind="TRABALHE"
        messageLabel={COPY.messageLabel}
        messagePlaceholder={COPY.messagePlaceholder}
        submitLabel={COPY.submitLabel}
      />

      <p className="mt-6 text-[14px] text-[var(--text-muted)]">{COPY.note}</p>
    </PageShell>
  )
}
