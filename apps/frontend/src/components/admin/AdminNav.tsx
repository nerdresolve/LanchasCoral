'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Navegação do painel com destaque da seção atual.
 *
 * A reclamação principal do cliente era não saber onde estava. O item ativo
 * ganha superfície clara e uma barra de acento; os demais ficam em texto suave.
 */

type Item = { href: string; label: string }

const ITEMS: Item[] = [
  { href: '/admin', label: 'Modelos' },
  { href: '/admin/listings', label: 'Seminovos' },
  /* "Mensagens" e não "Contatos": desde que os pontos focais viraram tela
     própria, dois itens chamados Contatos confundiriam o operador. */
  { href: '/admin/inquiries', label: 'Mensagens' },
  { href: '/admin/contatos', label: 'Contatos' },
  { href: '/admin/email', label: 'E-mail' },
]

/**
 * `/admin` só está ativo em correspondência exata — senão ficaria aceso em
 * todas as rotas do painel, que é justamente o problema que queremos evitar.
 */
function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin' || pathname.startsWith('/admin/boats')
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AdminNav() {
  const pathname = usePathname() ?? ''

  // `-mx-1 px-1`: a rolagem sobra ate a borda da tela quando os rotulos nao
  // cabem, em vez de cortar o ultimo item contra a caixa. Em telas estreitas
  // o padding menor faz as tres secoes caberem sem precisar rolar.
  return (
    <nav
      aria-label="Seções do painel"
      className="-mx-1 flex items-center gap-0.5 overflow-x-auto px-1 sm:gap-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {ITEMS.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`relative whitespace-nowrap rounded-[var(--radius-sm)] px-2.5 py-1.5 text-sm transition-colors duration-[140ms] sm:px-3 ${
              active
                ? 'bg-white/12 font-semibold text-pearl-0'
                : 'font-medium text-on-dark-muted hover:bg-white/8 hover:text-on-dark'
            }`}
          >
            {item.label}
            {active && (
              <span
                aria-hidden
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-aqua-500"
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
