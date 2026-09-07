import Link from 'next/link'
import PageShell from '@/components/PageShell'
import ContactForm from '@/components/ContactForm'
import { href, type Locale } from '@/i18n/config'

export default function VendaSuaLanchaView({ locale }: { locale: Locale }) {
  const COPY = {
    pt: {
      eyebrow: 'Coral Broker',
      title: 'Venda sua lancha conosco',
      lede: 'Anuncie pelo nosso broker e conte com a ajuda dos maiores consultores náuticos do mercado.',
      advantagesTitle: 'Vantagens de anunciar',
      /* Vantagens transcritas da página /venda-sua-lancha/ do site legado. */
      vantagens: [
        'Revitalização da embarcação direto pelo estaleiro (pintura, elétrica e hidráulica).',
        'Sua embarcação alocada em uma de nossas lojas, acabando com seu custo de marina (Costa Verde / Região dos Lagos).',
        'Intermediamos a venda do começo ao fim, dando total segurança para ambas as partes.',
        'Consultores náuticos especializados.',
      ],
      disclaimer: 'Verificar condições e disponibilidade junto ao estaleiro.',
      formTitle: 'Anuncie sua embarcação',
      messageLabel: 'Dados da embarcação',
      messagePlaceholder: 'Marca e modelo, ano, motorização e valor pretendido.',
      submitLabel: 'Quero anunciar',
      stockPrefix: 'Prefere ver o estoque atual?',
      stockLink: 'Acesse o Coral Broker',
    },
    en: {
      eyebrow: 'Coral Broker',
      title: 'Sell your boat with us',
      lede: 'List with our brokerage and work alongside the most experienced yacht consultants in the market.',
      advantagesTitle: 'Why list with Coral',
      vantagens: [
        'Refit handled directly by the shipyard: paintwork, electrical and hydraulic systems.',
        'Your boat berthed at one of our showrooms, so your marina costs stop (Costa Verde / Região dos Lagos).',
        'We broker the sale from first enquiry to handover, with full security for both parties.',
        'Specialist yacht consultants at your side.',
      ],
      disclaimer: 'Terms and availability to be confirmed with the shipyard.',
      formTitle: 'List your boat',
      messageLabel: 'Boat details',
      messagePlaceholder: 'Builder and model, year, engine package and asking price.',
      submitLabel: 'List my boat',
      stockPrefix: 'Would you rather browse the current stock?',
      stockLink: 'Visit Coral Broker',
    },
  }[locale]

  return (
    <PageShell
      locale={locale}
      active="vender"
      eyebrow={COPY.eyebrow}
      title={COPY.title}
      lede={COPY.lede}
    >
      <h2 className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
        {COPY.advantagesTitle}
      </h2>
      <ul className="mt-5 flex flex-col gap-3">
        {COPY.vantagens.map((v) => (
          <li key={v} className="flex items-start gap-3">
            <span aria-hidden className="mt-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-aqua-500" />
            <span className="text-[16px] leading-[1.7] text-[var(--color-text-body)]">{v}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[13px] text-[var(--text-muted)]">{COPY.disclaimer}</p>

      <div className="mt-12 border-t border-[var(--border-subtle)] pt-12">
        <h2 className="mb-8 font-display text-2xl font-medium tracking-[var(--tracking-display)] text-[var(--text-strong)]">
          {COPY.formTitle}
        </h2>
        <ContactForm
          locale={locale}
          kind="ANUNCIAR"
          messageLabel={COPY.messageLabel}
          messagePlaceholder={COPY.messagePlaceholder}
          submitLabel={COPY.submitLabel}
        />
      </div>

      <p className="mt-10 text-[14px] text-[var(--text-muted)]">
        {COPY.stockPrefix}{' '}
        {/* O estoque agora vive neste site, não mais no subdomínio do broker. */}
        <Link
          href={href('broker', locale)}
          className="inline-block py-1.5 text-ocean-700 underline-offset-4 hover:text-aqua-600 hover:underline"
        >
          {COPY.stockLink}
        </Link>
        .
      </p>
    </PageShell>
  )
}
