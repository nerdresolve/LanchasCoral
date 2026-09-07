import PageShell from '@/components/PageShell'
import ContactForm from '@/components/ContactForm'
import type { Locale } from '@/i18n/config'

export default function ContatoParaServicosView({ locale }: { locale: Locale }) {
  const COPY = {
    pt: {
      eyebrow: 'Assistência técnica',
      title: 'Contato para serviços',
      lede: 'Pequenos reparos ou reforma completa, com mão de obra especializada e peças originais.',
      servicesTitle: 'Serviços disponíveis',
      /* Serviços oferecidos no formulário do site legado, na íntegra. */
      services: [
        'Extensão da plataforma de popa',
        'Hard Top (HT)',
        'Plataforma hidráulica submersível',
        'Plataforma mecânica em inox – WetDeck',
        'Revitalização do gel coat',
        'Revisão elétrica',
        'Revisão hidráulica',
        'Compra de peças e acessórios',
      ],
      messageLabel: 'Modelo e serviço desejado',
      messagePlaceholder: 'Informe o modelo da embarcação e qual serviço você procura.',
      submitLabel: 'Solicitar atendimento',
    },
    en: {
      eyebrow: 'Service and refit',
      title: 'Service enquiries',
      lede: 'From minor repairs to a full refit, with specialist craftsmen and genuine parts.',
      servicesTitle: 'Services available',
      services: [
        'Swim platform extension',
        'Hard Top (HT)',
        'Submersible hydraulic platform',
        'Stainless steel mechanical platform – WetDeck',
        'Gel coat restoration',
        'Electrical system overhaul',
        'Hydraulic system overhaul',
        'Parts and accessories',
      ],
      messageLabel: 'Boat model and service required',
      messagePlaceholder: 'Let us know your boat model and which service you are looking for.',
      submitLabel: 'Request service',
    },
  }[locale]

  return (
    <PageShell locale={locale} eyebrow={COPY.eyebrow} title={COPY.title} lede={COPY.lede}>
      <h2 className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
        {COPY.servicesTitle}
      </h2>
      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COPY.services.map((s) => (
          <li key={s} className="flex items-start gap-3">
            <span aria-hidden className="mt-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-aqua-500" />
            <span className="text-[15px] leading-[1.6] text-[var(--color-text-body)]">{s}</span>
          </li>
        ))}
      </ul>

      <div className="mt-12 border-t border-[var(--border-subtle)] pt-12">
        <ContactForm locale={locale}
          kind="SERVICOS"
          messageLabel={COPY.messageLabel}
          messagePlaceholder={COPY.messagePlaceholder}
          submitLabel={COPY.submitLabel}
        />
      </div>
    </PageShell>
  )
}
