import Link from 'next/link'
import { Logo, WaveDivider } from '@/components/ui'
import { COMPANY } from '@/lib/company'
import { getTelefonesPublicados } from '@/lib/contatos'
import { href, type Locale } from '@/i18n/config'
import { getDict } from '@/i18n/dictionary'

import NerdResolveBadge from './NerdResolveBadge'
/* Columns follow the design system's SiteFooter: Fleet / Company / Support. */


/**
 * Redes sociais do rodape. As URLs vem do COMPANY para nao divergirem da
 * fonte unica: estavam escritas aqui a mao e apontavam para perfis errados.
 * O Facebook faltava, embora ja constasse do site antigo.
 */
const SOCIAL = [
  {
    href: COMPANY.social.instagram,
    label: 'Instagram',
    path: 'M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 5.6a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Zm0 6.9a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm5.4-7a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
  },
  {
    href: COMPANY.social.facebook,
    label: 'Facebook',
    path: 'M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.3v7A10 10 0 0 0 22 12Z',
  },
  {
    href: COMPANY.social.youtube,
    label: 'YouTube',
    path: 'M21.6 7.2c-.2-.9-.9-1.5-1.7-1.7C18.3 5.1 12 5.1 12 5.1s-6.3 0-7.9.4c-.8.2-1.5.8-1.7 1.7C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.5 1.7 1.7 1.6.4 7.9.4 7.9.4s6.3 0 7.9-.4c.8-.2 1.5-.8 1.7-1.7.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15.1V8.9l5.2 3.1-5.2 3.1Z',
  },
]

export default async function SiteFooter({ locale = 'pt' }: { locale?: Locale } = {}) {
  /* Telefones do banco: trocar um ponto focal no painel muda o rodapé de
     todas as páginas junto, sem republicar o site. */
  const telefones = await getTelefonesPublicados()
  const year = new Date().getFullYear()
  const t = getDict(locale)

  const COLUMNS = [
    {
      title: t.footer.line,
      links: [
        { href: href('modelos', locale), label: t.footer.allModels },
        { href: href('modelos', locale, '?tipo=abertas'), label: t.footer.open },
        { href: href('modelos', locale, '?tipo=cabinadas'), label: t.footer.cabin },
        { href: href('modelos', locale, '?tipo=fly'), label: t.footer.fly },
      ],
    },
    {
      title: t.footer.institutional,
      links: [
        { href: href('sobre', locale), label: t.footer.about },
        { href: href('dicas', locale), label: t.dicas.title },
        { href: href('qualidade', locale), label: t.footer.quality },
        { href: href('privacidade', locale), label: t.footer.privacy },
        { href: href('trabalhe', locale), label: t.footer.careers },
      ],
    },
    {
      title: t.footer.support,
      links: [
        { href: href('contatos', locale), label: t.nav.contacts },
        { href: href('contato', locale), label: t.footer.contactCommercial },
        { href: href('servicos', locale), label: t.footer.services },
        { href: href('manual', locale), label: t.footer.manual },
        { href: href('vender', locale), label: t.footer.sell },
      ],
    },
  ]

  return (
    <footer className="bg-navy-900 text-pearl-0">
      <WaveDivider />

      <div className="container-page grid gap-x-8 gap-y-12 pb-12 pt-20 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link prefetch={false} href={href('home', locale)} className="inline-flex min-h-11 items-center" aria-label="Lanchas Coral">
            <Logo variant="white" height={28} />
          </Link>
          <p className="mt-5 max-w-[300px] text-sm leading-[1.65] text-on-dark-muted">
            {t.footer.blurb}
          </p>

          <address className="mt-5 not-italic text-sm leading-[1.7] text-on-dark-muted">
            {COMPANY.address.full}
            <br />
            {telefones.join(' · ')}
            <br />
            <span className="text-on-dark-muted">{COMPANY.hours.office}</span>
          </address>

          <div className="mt-6 flex gap-3">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={s.label}
                /* 44px, o mínimo das WCAG para alvo de toque: eram 36, e três
                   ícones lado a lado nesse tamanho erram fácil no dedo. */
                className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-on-dark)] text-on-dark-muted transition-colors hover:border-aqua-500 hover:text-aqua-500"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-aqua-500">
              {col.title}
            </p>
            <ul className="mt-5 flex flex-col gap-3">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link
                    prefetch={false}
                    href={l.href}
                    className="inline-flex min-h-8 min-w-11 items-center text-sm text-on-dark-muted transition-colors hover:text-pearl-0"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container-page">
        <div className="flex flex-wrap justify-between gap-4 border-t border-[var(--border-on-dark)] py-6 text-xs text-on-dark-muted">
          <span>© {year} {t.footer.rights}</span>
          <span className="flex flex-wrap gap-x-2">
            <Link prefetch={false} href={href('privacidade', locale)} className="inline-flex min-h-8 items-center transition-colors hover:text-pearl-0">
              {t.footer.privacy}
            </Link>
            <span aria-hidden>·</span>
            <Link prefetch={false} href={href('qualidade', locale)} className="inline-flex min-h-8 items-center transition-colors hover:text-pearl-0">
              {t.footer.quality}
            </Link>
          </span>
        </div>
      </div>
      <NerdResolveBadge />
    </footer>
  )
}
