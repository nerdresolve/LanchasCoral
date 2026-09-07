'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitInquiry, type ContactState } from '@/app/(pt)/contato/actions'
import { getDict } from '@/i18n/dictionary'
import type { Locale } from '@/i18n/config'

const FIELD =
  'w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 text-[15px] text-[var(--text-strong)] outline-none transition-colors placeholder:text-[var(--color-pearl-400)] focus:border-ocean-600'

function Label({ htmlFor, children, required }: { htmlFor: string; children: string; required?: boolean }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-[var(--text-muted)]"
    >
      {children}
      {required && <span className="text-danger-500"> *</span>}
    </label>
  )
}

function Err({ msgs }: { msgs?: string[] }) {
  if (!msgs?.length) return null
  return <p className="mt-1.5 text-[13px] text-danger-500">{msgs[0]}</p>
}

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-[58px] items-center justify-center rounded-[var(--radius-pill)] border border-transparent bg-[image:var(--grad-signature)] px-9 font-body text-[13px] font-bold uppercase tracking-[0.06em] text-pearl-0 shadow-[var(--shadow-sm)] transition-all duration-[240ms] ease-[var(--ease-glide)] hover:-translate-y-0.5 hover:shadow-[var(--glow-signature)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

export type InquiryKind =
  | 'CONTATO' | 'PROPOSTA' | 'VISITA' | 'SERVICOS'
  | 'MANUAL' | 'TRABALHE' | 'BROKER' | 'ANUNCIAR'

export default function ContactForm({
  boatSlug,
  boatLabel,
  boatOptions,
  kind,
  locale = 'pt',
  hideBoatNotice = false,
  messageLabel,
  messagePlaceholder,
  submitLabel,
}: {
  boatSlug?: string
  boatLabel?: string
  /**
   * Modelos que o visitante pode escolher, em vez de digitar o nome.
   *
   * Quando informado, vira uma lista suspensa obrigatória. É o que o
   * formulário de memorial descritivo usa: digitar livremente gerava pedidos
   * de modelos que não existem ou já saíram de linha, e o atendente tinha de
   * adivinhar qual arquivo mandar.
   */
  boatOptions?: { slug: string; label: string }[]
  kind?: InquiryKind
  locale?: Locale
  /** No pop-up o título já diz o modelo; evita repetir o aviso. */
  hideBoatNotice?: boolean
  messageLabel?: string
  messagePlaceholder?: string
  submitLabel?: string
}) {
  const [state, action] = useActionState<ContactState, FormData>(submitInquiry, {})
  const t = getDict(locale).form

  if (state.ok) {
    return (
      <div className="rounded-[var(--radius-md)] border border-success-500/30 bg-success-500/10 p-8">
        <p className="font-display text-xl font-medium text-[var(--text-strong)]">
          {t.sentTitle}
        </p>
        <p className="mt-2 text-[15px] leading-[1.6] text-[var(--color-text-body)]">
          {state.message}
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {boatSlug && !boatOptions && <input type="hidden" name="boatSlug" value={boatSlug} />}
      <input type="hidden" name="kind" value={kind ?? (boatSlug ? 'PROPOSTA' : 'CONTATO')} />

      {boatOptions && boatOptions.length > 0 && (
        <div className="sm:col-span-2">
          <Label htmlFor="boatSlug" required>{t.boatSelectLabel}</Label>
          <select
            id="boatSlug"
            name="boatSlug"
            required
            defaultValue={boatSlug ?? ''}
            className={FIELD}
          >
            <option value="" disabled>{t.boatSelectPlaceholder}</option>
            {boatOptions.map((b) => (
              <option key={b.slug} value={b.slug}>{b.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Honeypot — invisível para pessoas, atrai bots. */}
      <div aria-hidden className="hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {boatLabel && !hideBoatNotice && (
        <div className="sm:col-span-2">
          <p className="rounded-[var(--radius-sm)] border border-ocean-200 bg-ocean-100/60 px-4 py-3 text-[14px] text-ocean-800">
            {t.quoteFor} <strong className="font-semibold">{boatLabel}</strong>
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="name" required>{t.name}</Label>
        <input id="name" name="name" required autoComplete="name" className={FIELD} placeholder={t.namePlaceholder} />
        <Err msgs={state.errors?.name} />
      </div>

      <div>
        <Label htmlFor="email" required>{t.email}</Label>
        <input id="email" name="email" type="email" required autoComplete="email" className={FIELD} placeholder="voce@exemplo.com" />
        <Err msgs={state.errors?.email} />
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="phone">{t.phone}</Label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" className={FIELD} placeholder="(00) 00000-0000" />
        <Err msgs={state.errors?.phone} />
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="message">{messageLabel ?? t.message}</Label>
        <textarea id="message" name="message" rows={5} className={FIELD} placeholder={messagePlaceholder ?? t.messagePlaceholder} />
        <Err msgs={state.errors?.message} />
      </div>

      {state.message && !state.ok && (
        <p className="text-[14px] text-danger-500 sm:col-span-2">{state.message}</p>
      )}

      <div className="sm:col-span-2">
        <Submit label={submitLabel ?? t.submit} pendingLabel={t.sending} />
      </div>
    </form>
  )
}
