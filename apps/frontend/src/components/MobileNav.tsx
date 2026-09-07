'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Button, Logo } from '@/components/ui'
import QuoteDialog from './QuoteDialog'
import { href, type Locale } from '@/i18n/config'
import { getDict } from '@/i18n/dictionary'

type Boat = { slug: string; name: string; variant: string | null }
type Family = { id: string; name: string; boats: Boat[] }


export default function MobileNav({
  families,
  locale = 'pt',
}: {
  families: Family[]
  locale?: Locale
}) {
  const [open, setOpen] = useState(false)
  const [montado, setMontado] = useState(false)
  const close = () => setOpen(false)

  // `createPortal` precisa do `document`, que nao existe no servidor.
  /* O lint alerta para `setState` dentro de efeito, e a regra faz sentido em
     geral — renderização em cascata. Aqui é o padrão de "montado no cliente":
     roda uma vez, sem dependências, só para liberar o `createPortal`, que
     precisa do `document`. Reescrever com `useSyncExternalStore` seria mais
     código para o mesmo efeito. */
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMontado(true), [])
  const t = getDict(locale)

  const LINKS = [
    { key: 'broker' as const, label: t.nav.broker },
    { key: 'vender' as const, label: t.nav.sell },
  ]

  // Mesmo motivo do grupo de contatos: sem hover no celular, o dropdown de
  // Institucional vira lista aberta com o rotulo em cima.
  const INSTITUCIONAL = [
    { key: 'sobre' as const, label: t.footer.about },
    { key: 'qualidade' as const, label: t.footer.quality },
  ]

  // No celular nao ha hover, entao os canais de contato aparecem em lista
  // aberta em vez de dropdown. O hub entra como primeiro item do grupo.
  const CONTATOS = [
    { key: 'contatos' as const, label: t.contatos.navLabel },
    { key: 'contato' as const, label: t.contatos.areas.comercial.title },
    { key: 'servicos' as const, label: t.contatos.areas.assistencia.title },
    { key: 'manual' as const, label: t.contatos.manual },
    { key: 'trabalhe' as const, label: t.contatos.careers },
  ]

  // Lock the page behind the panel while it is open; Esc dismisses it.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label={t.nav.openMenu}
        /* 44px é o mínimo das WCAG para alvo de toque; eram 36. O `-mr-2.5`
           puxa a folga para fora, então o ícone não se desloca no cabeçalho. */
        className="-mr-2.5 flex h-11 w-11 items-center justify-center text-pearl-0"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {/* O painel e levado para o <body>. Dentro do <header> ele nao
          funciona: a barra usa `backdrop-blur`, e um elemento com
          backdrop-filter vira containing block para descendentes
          `position: fixed` — entao `inset-0` media os 76px do cabecalho
          em vez da viewport, e a maior parte dos links ficava fora da
          tela, inalcancavel. */}
      {open &&
        montado &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex h-dvh flex-col bg-navy-900">
            <div className="container-page flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-[var(--border-on-dark)]">
              <Logo variant="white" height={24} />
              <button
                type="button"
                onClick={close}
                aria-label={t.nav.closeMenu}
                /* 44px é o mínimo das WCAG para alvo de toque; eram 36. O `-mr-2.5`
           puxa a folga para fora, então o ícone não se desloca no cabeçalho. */
        className="-mr-2.5 flex h-11 w-11 items-center justify-center text-pearl-0"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="container-page flex-1 overflow-y-auto py-8">
              <p className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-aqua-500">
                {t.nav.models}
              </p>

              <div className="mt-5 flex flex-col gap-5">
                {families.map((f) => {
                  const single = f.boats.length === 1
                  return (
                    <div key={f.id}>
                      {!single && (
                        <p className="font-body text-[11px] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-on-dark-muted">
                          {f.name}
                        </p>
                      )}
                      <div className={`flex flex-col gap-2 ${single ? '' : 'mt-2'}`}>
                        {f.boats.map((b) => (
                          <Link
                            prefetch={false}
                            key={b.slug}
                            href={href('modelos', locale, `/${b.slug}`)}
                            onClick={close}
                            className="font-display text-xl font-semibold tracking-[var(--tracking-display)] text-pearl-0"
                          >
                            {single ? b.name : (b.variant ?? b.name)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-9 flex flex-col gap-4 border-t border-[var(--border-on-dark)] pt-7">
                <p className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-aqua-500">
                  {t.nav.institutional}
                </p>
                {INSTITUCIONAL.map((l) => (
                  <Link
                    prefetch={false}
                    key={l.key}
                    href={href(l.key, locale)}
                    onClick={close}
                    className="font-display text-lg font-medium tracking-[var(--tracking-display)] text-pearl-0"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-[var(--border-on-dark)] pt-7">
                {LINKS.map((l) => (
                  <Link
                    prefetch={false}
                    key={l.key}
                    href={href(l.key, locale)}
                    onClick={close}
                    className="font-display text-xl font-semibold tracking-[var(--tracking-display)] text-pearl-0"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-[var(--border-on-dark)] pt-7">
                <p className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-aqua-500">
                  {t.nav.contacts}
                </p>
                {CONTATOS.map((l) => (
                  <Link
                    prefetch={false}
                    key={l.key}
                    href={href(l.key, locale)}
                    onClick={close}
                    className="font-display text-lg font-medium tracking-[var(--tracking-display)] text-pearl-0"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>

              {/* Nao fecha o menu aqui: isso desmontaria o pop-up junto.
                  O diálogo cobre a tela inteira por cima do painel. */}
              <div className="mt-8">
                <QuoteDialog locale={locale}>
                  <Button href="#" variant="signature" size="lg" fullWidth>
                    {t.nav.quote}
                  </Button>
                </QuoteDialog>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
