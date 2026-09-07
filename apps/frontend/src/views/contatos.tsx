import Link from 'next/link'
import PageShell from '@/components/PageShell'
import { COMPANY } from '@/lib/company'
import { getPontosFocais } from '@/lib/contatos'
import { href, type Locale } from '@/i18n/config'
import { getDict } from '@/i18n/dictionary'

/**
 * Hub de contatos, equivalente ao /nossos-contatos/ do site antigo.
 *
 * O site legado publica telefones distintos por área — comercial, assistência
 * técnica e compras — e essa separação existe por um motivo prático: quem
 * precisa de garantia não deve cair na fila de vendas. A página anterior
 * oferecia apenas um formulário único, e os números por área tinham se
 * perdido na migração.
 *
 * Os números vêm do banco (`ContactPoint`), editáveis pelo painel: trocar um
 * ponto focal aqui muda também o rodapé, a página de contato e o JSON-LD.
 */

/** Só dígitos, para montar `tel:` a partir do número formatado. */
const soDigitos = (t: string) => t.replace(/\D/g, '')

export default async function ContatosView({ locale = 'pt' }: { locale?: Locale }) {
  const pontos = await getPontosFocais()
  const t = getDict(locale)
  const c = t.contatos

  /** Cada área aponta para o formulário que já existe no site. */
  const destino = {
    comercial: href('contato', locale),
    assistencia: href('servicos', locale),
    compras: href('trabalhe', locale),
  } as const

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lede={c.lede} active="contatos" locale={locale}>
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {pontos.map((area) => {
          /* O dicionário traz título e descrição de cada finalidade; o rótulo
             gravado no painel, quando existe, tem precedência sobre ele. */
          const info = c.areas[area.key as keyof typeof c.areas]
          if (!info) return null
          const titulo = (locale === 'en' ? area.labelEn : area.label) || info.title
          return (
            <li
              key={area.key}
              className="flex flex-col rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-7 shadow-[var(--shadow-sm)]"
            >
              <h2 className="font-display text-xl font-semibold tracking-[var(--tracking-display)] text-[var(--text-strong)]">
                {titulo}
              </h2>
              <p className="mt-3 text-[15px] leading-[1.6] text-[var(--color-text-body)]">{info.desc}</p>

              <div className="mt-5 flex flex-col gap-1">
                {area.phones.map((tel) => (
                  <a
                    key={tel}
                    href={`tel:+55${soDigitos(tel)}`}
                    className="inline-flex min-h-9 items-center font-mono text-[15px] text-ocean-700 underline-offset-4 hover:text-aqua-600 hover:underline"
                  >
                    {tel}
                  </a>
                ))}
                {area.whatsapp && (
                  <a
                    href={`https://wa.me/${area.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-ocean-700 underline-offset-4 hover:text-aqua-600 hover:underline"
                  >
                    {c.whatsapp}
                    <span aria-hidden>↗</span>
                  </a>
                )}
              </div>

              {/* `mt-auto` alinha os botões na base, mesmo com textos de
                  alturas diferentes entre os três cartões. */}
              <Link
                href={destino[area.key as keyof typeof destino]}
                className="mt-auto inline-flex min-h-11 items-center pt-6 font-body text-xs font-bold uppercase tracking-[var(--tracking-wide)] text-ocean-700 transition-colors hover:text-aqua-600"
              >
                {info.cta}
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="mt-14 border-t border-[var(--border-subtle)] pt-10">
        <h2 className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
          {c.otherTitle}
        </h2>
        <ul className="mt-4 flex flex-col gap-2 text-[15px]">
          <li>
            <Link
              href={href('manual', locale)}
              className="inline-flex min-h-10 items-center text-ocean-700 underline-offset-4 hover:text-aqua-600 hover:underline"
            >
              {c.manual}
            </Link>
          </li>
          <li>
            <Link
              href={href('trabalhe', locale)}
              className="inline-flex min-h-10 items-center text-ocean-700 underline-offset-4 hover:text-aqua-600 hover:underline"
            >
              {c.careers}
            </Link>
          </li>
          <li>
            <Link
              href={href('broker', locale)}
              className="inline-flex min-h-10 items-center text-ocean-700 underline-offset-4 hover:text-aqua-600 hover:underline"
            >
              {c.broker}
            </Link>
          </li>
        </ul>
      </div>

      <div className="mt-12 border-t border-[var(--border-subtle)] pt-10">
        <h2 className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
          {c.addressTitle}
        </h2>
        <address className="mt-4 not-italic text-[15px] leading-[1.7] text-[var(--color-text-body)]">
          {COMPANY.address.full}
        </address>
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">
          {COMPANY.hours.office} · {COMPANY.hours.factory}
        </p>
      </div>
    </PageShell>
  )
}
