import PageShell from '@/components/PageShell'
import ContactForm from '@/components/ContactForm'
import { getModelosComMemorial } from '@/lib/queries'
import type { Locale } from '@/i18n/config'

/**
 * Pedido do memorial descritivo.
 *
 * O modelo é escolhido numa lista, e não digitado: o campo livre gerava
 * pedidos de embarcações que não existem ou já saíram de linha, e o atendente
 * tinha de adivinhar qual arquivo mandar. A lista traz só o que está publicado
 * e tem memorial anexado.
 */
export default async function SolicitarManualView({ locale }: { locale: Locale }) {
  const modelos = await getModelosComMemorial()

  const COPY = {
    pt: {
      eyebrow: 'Proprietário',
      title: 'Solicitar memorial descritivo',
      lede: 'Escolha o modelo da sua embarcação e enviamos o memorial descritivo.',
      messageLabel: 'Observações',
      messagePlaceholder: 'Ano da embarcação, número do casco ou qualquer detalhe que ajude.',
      submitLabel: 'Solicitar memorial',
      semModelos:
        'Os memoriais estão sendo atualizados. Fale com a gente pelos canais de contato e enviamos o arquivo.',
    },
    en: {
      eyebrow: 'Owners',
      title: 'Request the specification sheet',
      lede: 'Choose your boat model and we will send you the specification sheet.',
      messageLabel: 'Notes',
      messagePlaceholder: 'Year, hull number or anything else that helps us.',
      submitLabel: 'Request sheet',
      semModelos:
        'The documents are being updated. Get in touch through our contact channels and we will send the file.',
    },
  }[locale]

  return (
    <PageShell locale={locale} eyebrow={COPY.eyebrow} title={COPY.title} lede={COPY.lede}>
      {modelos.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-7 text-[15px] leading-[1.6] text-[var(--color-text-body)]">
          {COPY.semModelos}
        </p>
      ) : (
        <ContactForm
          locale={locale}
          kind="MANUAL"
          boatOptions={modelos.map((m) => ({ slug: m.slug, label: m.label }))}
          messageLabel={COPY.messageLabel}
          messagePlaceholder={COPY.messagePlaceholder}
          submitLabel={COPY.submitLabel}
        />
      )}
    </PageShell>
  )
}
