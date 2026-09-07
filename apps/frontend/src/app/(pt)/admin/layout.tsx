import Link from 'next/link'
import { currentUser } from '@/lib/auth'
import { logoutAction } from './actions'
import { Logo } from '@/components/ui'
import AdminNav from '@/components/admin/AdminNav'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()

  // The login page renders its own bare shell.
  if (!user) return <>{children}</>

  return (
    <div className="min-h-dvh bg-[var(--surface-page)]">
      {/* Cabeçalho escuro da marca — mesma superfície das seções escuras do site. */}
      <header className="bg-[image:var(--grad-deep)] text-on-dark">
        {/* `min-h-16` e nao `h-16`: com altura fixa o `flex-wrap` nao tem
              espaco para a segunda linha, e em 390px o ultimo item do menu
              ficava cortado contra a borda da tela. */}
        <div className="container-page flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2">
          {/* `w-full sm:w-auto` na nav: em 390px o logo come 128px e os tres
              rotulos nao cabem na mesma linha — o ultimo ficava cortado. Numa
              linha propria eles cabem inteiros. */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 sm:flex-nowrap sm:gap-6">
            <Link href="/admin" aria-label="Painel Coral, início" className="shrink-0">
              <Logo variant="white" height={22} />
            </Link>
            <div className="w-full sm:w-auto">
              <AdminNav />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden max-w-[22ch] truncate text-sm text-on-dark-muted lg:inline">
              {user.email}
            </span>
            <Link
              href="/"
              target="_blank"
              className="rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium text-on-dark-muted transition-colors duration-[140ms] hover:bg-white/8 hover:text-on-dark"
            >
              Ver site ↗
            </Link>
            <form action={logoutAction}>
              <button className="rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium text-on-dark-muted transition-colors duration-[140ms] hover:bg-white/8 hover:text-on-dark">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container-page py-10">{children}</main>
    </div>
  )
}
