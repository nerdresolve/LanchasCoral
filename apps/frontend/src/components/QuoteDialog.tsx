'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import ContactForm from '@/components/ContactForm'
import { getDict } from '@/i18n/dictionary'
import type { Locale } from '@/i18n/config'

/**
 * Pop-up de intenção de compra.
 *
 * Padrão do site: CTA de COMPRA (proposta, "quero minha Coral", falar com
 * consultor sobre um barco) abre este diálogo; contato de outras naturezas
 * — serviços, manual, trabalhe conosco — continua em página própria.
 *
 * O gatilho é passado como `children`, então qualquer botão pode abri-lo.
 */
export default function QuoteDialog({
  locale,
  boatSlug,
  boatLabel,
  title,
  children,
}: {
  locale: Locale
  /** Slug do modelo ou anúncio, gravado junto com a mensagem. */
  boatSlug?: string
  boatLabel?: string
  title?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [montado, setMontado] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  // `createPortal` depende do `document`, ausente no servidor.
  /* O lint alerta para `setState` dentro de efeito, e a regra faz sentido em
     geral — renderização em cascata. Aqui é o padrão de "montado no cliente":
     roda uma vez, sem dependências, só para liberar o `createPortal`, que
     precisa do `document`. Reescrever com `useSyncExternalStore` seria mais
     código para o mesmo efeito. */
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMontado(true), [])

  const t = getDict(locale)

  useEffect(() => {
    if (!open) return

    triggerRef.current = document.activeElement as HTMLElement
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      // Mantém o foco dentro do diálogo enquanto ele estiver aberto.
      if (e.key !== 'Tab' || !panelRef.current) return
      const alvos = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!alvos.length) return
      const first = alvos[0]
      const last = alvos[alvos.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    // Leva o foco para o primeiro campo ao abrir.
    const id = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('input, textarea')?.focus()
    }, 60)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      window.clearTimeout(id)
      triggerRef.current?.focus?.()
    }
  }, [open])

  return (
    <>
      {/*
        O gatilho costuma ser um <Link>; sem preventDefault o Next navega
        antes do diálogo abrir. Captura na fase de captura para agir primeiro.
      */}
      <span
        className="contents"
        onClickCapture={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
      >
        {children}
      </span>

      {/* Vai para o <body>: o gatilho do cabecalho vive sob uma barra com
          `backdrop-blur`, e backdrop-filter torna o elemento containing
          block do `position: fixed` — o `inset-0` passaria a medir os 76px
          da barra em vez da viewport. */}
      {open &&
        montado &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-navy-900/80 p-4 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setOpen(false)}
          >
            <div
              ref={panelRef}
              onClick={(e) => e.stopPropagation()}
              className="my-auto w-full max-w-[640px] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-card)] shadow-[var(--shadow-lg)]"
            >
              <div className="flex items-start justify-between gap-6 px-7 pt-7 sm:px-9 sm:pt-9">
                <div>
                  <p className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
                    {t.nav.quote}
                  </p>
                  <h2
                    id={titleId}
                    className="mt-2 font-display text-2xl font-semibold tracking-[var(--tracking-display)] text-[var(--text-strong)]"
                  >
                    {title ?? (boatLabel ? `${t.form.quoteFor} ${boatLabel}` : t.home.ctaTitle)}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t.boat.close}
                  className="-mr-2 -mt-1 shrink-0 rounded-[var(--radius-pill)] p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <div className="px-7 pb-9 pt-7 sm:px-9">
                <ContactForm
                  locale={locale}
                  boatSlug={boatSlug}
                  boatLabel={boatLabel}
                  kind="PROPOSTA"
                  hideBoatNotice
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
