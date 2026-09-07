'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOCALES, LOCALE_META, switchPath, type Locale } from '@/i18n/config'

/*
 * Bandeiras em SVG inline. Emoji de bandeira não renderiza no Windows
 * (mostra as letras do código do país), então o desenho é explícito.
 */
function FlagBR({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={className} aria-hidden>
      <rect width="28" height="20" fill="#009B3A" />
      <path d="M14 2.2 25.4 10 14 17.8 2.6 10Z" fill="#FEDF00" />
      <circle cx="14" cy="10" r="4.1" fill="#002776" />
      <path
        d="M10.2 8.6a10 10 0 0 1 7.7 1.9"
        stroke="#fff"
        strokeWidth="1.15"
        fill="none"
      />
    </svg>
  )
}

function FlagUS({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={className} aria-hidden>
      <rect width="28" height="20" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={(i * 20) / 13} width="28" height={20 / 13} fill="#B22234" />
      ))}
      <rect width="12" height={(20 / 13) * 7} fill="#3C3B6E" />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3, 4, 5].map((c) => (
          <circle
            key={`${r}-${c}`}
            cx={1.2 + c * 2}
            cy={1.1 + r * 2.6}
            r="0.55"
            fill="#fff"
          />
        )),
      )}
    </svg>
  )
}

const FLAGS: Record<Locale, (p: { className?: string }) => React.ReactElement> = {
  pt: FlagBR,
  en: FlagUS,
}

/**
 * Alterna entre português e inglês preservando a página atual:
 * /modelos/coral-40 -> /en/models/coral-40.
 */
export default function LangSwitch({ current }: { current: Locale }) {
  const pathname = usePathname() || '/'

  return (
    <div className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-on-dark)] p-1">
      {LOCALES.map((loc) => {
        const Flag = FLAGS[loc]
        const active = loc === current
        const meta = LOCALE_META[loc]

        return (
          <Link
            prefetch={false}
            key={loc}
            href={switchPath(pathname, loc)}
            hrefLang={meta.htmlLang}
            // Precisa conter o texto visivel ("BR"/"US"): um rotulo so com
            // "Portugues" quebra comando de voz, que casa pelo que se le.
            aria-label={`${meta.flag}, ${meta.label}`}
            aria-current={active ? 'true' : undefined}
            title={meta.label}
            // `px-1.5` ate `xl`: entre 1024 e 1280px a navbar desktop fica no
            // limite do container, e o respiro lateral daqui e o que sobra
            // para cortar sem encolher fonte nem esconder o rotulo BR/US.
            className={`flex min-h-9 items-center gap-1.5 rounded-[var(--radius-xs)] px-1.5 py-2 transition-all duration-[140ms] xl:px-2.5 ${
              active
                ? 'bg-white/12 opacity-100'
                : // 45% rebaixava o branco a #777980 = 4.49:1, um fio abaixo do
                  // minimo de 4.5. Em 55% da 6.27:1 e o inativo continua
                  // visivelmente mais apagado que o ativo.
                  'opacity-55 grayscale hover:opacity-90 hover:grayscale-0'
            }`}
          >
            <Flag className="h-3.5 w-[19px] rounded-[1px] ring-1 ring-black/25" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-pearl-0">
              {meta.flag}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
