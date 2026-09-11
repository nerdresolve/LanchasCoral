import Link from 'next/link'
import { getNavFamilies, boatLabel } from '@/lib/queries'
import MobileNav from './MobileNav'
import LangSwitch from './LangSwitch'
import QuoteDialog from './QuoteDialog'
import { Button, Logo } from '@/components/ui'
import { href, type Locale } from '@/i18n/config'
import { getDict } from '@/i18n/dictionary'


/**
 * Site header, per the design system's SiteHeader:
 * 76px tall, navy-900 when solid, a dark glass gradient when laid over hero
 * media, aqua underline on the active item, and a single lime CTA.
 *
 * `transparent` is set by pages that open with a full-bleed hero.
 */
export default async function SiteHeader({
  transparent = false,
  active = '',
  locale = 'pt',
}: {
  transparent?: boolean
  active?: string
  locale?: Locale
} = {}) {
  const families = await getNavFamilies()
  const t = getDict(locale)

  const NAV = [
    { key: 'modelos' as const, label: t.nav.models },
    { key: 'sobre' as const, label: t.nav.institutional },
    { key: 'broker' as const, label: t.nav.broker },
    { key: 'vender' as const, label: t.nav.sell },
  ]

  /**
   * Institucional agrupa as paginas sobre a empresa, como no site antigo. O
   * gatilho continua levando a /sobre, entao quem so quer a pagina principal
   * nao precisa abrir o painel.
   */
  const INSTITUCIONAL = [
    { key: 'sobre' as const, label: t.footer.about },
    { key: 'qualidade' as const, label: t.footer.quality },
  ]

  /**
   * Canais de contato, agrupados como no site antigo: o visitante que procura
   * assistencia tecnica nao deve cair no formulario comercial. O gatilho leva
   * ao hub, e os itens vao direto a cada formulario.
   */
  const CONTATOS = [
    { key: 'contato' as const, label: t.contatos.areas.comercial.title },
    { key: 'servicos' as const, label: t.contatos.areas.assistencia.title },
    { key: 'manual' as const, label: t.contatos.manual },
    { key: 'trabalhe' as const, label: t.contatos.careers },
  ]

  return (
    <header
      className={`sticky top-0 z-50 h-[var(--header-h)] border-b ${
        transparent
          ? // Sobre o hero: barra escura solida com leve translucidez, nao um
            // desbotado sobre a foto. A borda inferior e um fio aqua->lime.
            'border-transparent bg-navy-900/92 backdrop-blur-xl backdrop-saturate-150'
          : 'border-[var(--border-on-dark)] bg-navy-900'
      }`}
    >
      {transparent && (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px opacity-70"
          style={{ background: 'var(--wave-line)' }}
        />
      )}
      {/* O respiro antigo (`gap-14`) nao cabe mais: sem a quebra de linha os
          rotulos ocupam a largura real que sempre precisaram. */}
      <div className="container-page flex h-full items-center gap-4 min-[1180px]:gap-8">
        <Link
          prefetch={false}
          href={href('home', locale)}
          className="flex h-full shrink-0 items-center"
          aria-label="Lanchas Coral"
        >
          <Logo variant="white" height={26} priority />
        </Link>

        {/* `items-stretch`: sem isso o gatilho do dropdown não herda a altura
            da barra, e o `top-full` do painel passa a medir a partir do meio
            do link — fazendo o painel abrir por cima da navbar. */}
        {/* Espacamento escalonado: apertado de 1024 a 1180px, folgado acima.
            Com os rotulos em `whitespace-nowrap` a barra pede ~1085px, e sem
            esse aperto ela estourava o container em 1024px — dando rolagem
            horizontal a PAGINA INTEIRA (o defeito ja existia antes, apenas
            mascarado pelo texto quebrado em duas linhas). */}
        <nav className="hidden h-full items-stretch gap-4 lg:ml-6 lg:flex min-[1180px]:ml-10 min-[1180px]:gap-6">
          {/* Models opens a family panel; the rest are plain links. */}
          {/* `h-full` faz o gatilho ocupar toda a altura da barra, para que o
              `top-full` do painel signifique a base do cabeçalho — e não o
              rodapé do link, que ficava no meio dos 76px e fazia o painel
              subir sobre o logo. */}
          <div className="group relative flex h-full items-center">
            <Link
              prefetch={false}
              href={href('modelos', locale)}
              className={`flex items-center gap-1.5 border-b pb-[3px] font-body text-xs font-bold uppercase tracking-[var(--tracking-wide)] transition-colors ${
                active === 'modelos'
                  ? 'border-aqua-500 text-pearl-0'
                  : 'border-transparent text-on-dark-muted hover:text-pearl-0'
              }`}
            >
              {t.nav.models}
              <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden>
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </Link>

            {/* `top-full` = base do header, gracas ao ancora de altura total
                acima; o painel so se desloca para BAIXO (translate-y-3 -> 0),
                entao nunca ocupa pixels sobre a barra. O z-40 o mantem ainda
                sob a barra de filtros das paginas, que tambem usa z-40. */}
            {/* Lista única, todos os itens no mesmo nível.
                A versão anterior misturava dois níveis: famílias com uma só
                embarcação viravam item solto, enquanto as com variantes ganhavam
                um cabeçalho em azul. O rótulo também alternava entre nome
                completo ("Coral 42") e só a variante ("Aberta"), sem que a
                diferença significasse nada — o olho lia como título e subtítulo
                onde havia apenas modelos irmãos. */}
            <div className="invisible absolute left-1/2 top-full z-40 w-[440px] max-w-[calc(100vw-2rem)] -translate-x-1/2 translate-y-3 rounded-[var(--radius-md)] border border-[var(--border-on-dark)] bg-navy-800 p-4 opacity-0 shadow-[var(--shadow-lg)] transition duration-[240ms] ease-[var(--ease-glide)] group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                {families.flatMap((f) => f.boats).map((b) => (
                  <li key={b.slug}>
                    <Link
                      prefetch={false}
                      href={href('modelos', locale, `/${b.slug}`)}
                      className="flex min-h-10 items-center rounded-[var(--radius-xs)] px-3 font-display text-[15px] font-medium leading-snug text-pearl-0 transition-colors hover:bg-white/8 hover:text-aqua-500"
                    >
                      {boatLabel(b)}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-3 border-t border-[var(--border-on-dark)] pt-3">
                <Link
                  prefetch={false}
                  href={href('modelos', locale)}
                  className="flex min-h-10 items-center rounded-[var(--radius-xs)] px-3 font-body text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-aqua-500 transition-colors hover:bg-white/8"
                >
                  {t.models.seeAll}
                </Link>
              </div>
            </div>
          </div>

          {/* Mesma ancoragem do painel de Modelos: `h-full` no gatilho para
              que `top-full` signifique a base do cabecalho. */}
          <div className="group relative flex h-full items-center">
            <Link
              prefetch={false}
              href={href('sobre', locale)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b pb-[3px] font-body text-xs font-bold uppercase tracking-[var(--tracking-wide)] transition-colors ${
                active === 'sobre'
                  ? 'border-aqua-500 text-pearl-0'
                  : 'border-transparent text-on-dark-muted hover:text-pearl-0'
              }`}
            >
              {t.nav.institutional}
              <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden>
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </Link>

            {/* `left-0` em vez do `right-0` de Contatos: este item fica no meio
                da barra, entao o painel alinha pela esquerda do gatilho e nao
                escapa para fora do container. */}
            <div className="invisible absolute left-0 top-full z-40 w-[280px] translate-y-3 rounded-[var(--radius-md)] border border-[var(--border-on-dark)] bg-navy-800 p-3 opacity-0 shadow-[var(--shadow-lg)] transition duration-[240ms] ease-[var(--ease-glide)] group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <ul className="flex flex-col gap-0.5">
                {INSTITUCIONAL.map((n) => (
                  <li key={n.key}>
                    <Link
                      prefetch={false}
                      href={href(n.key, locale)}
                      className="flex min-h-11 items-center rounded-[var(--radius-xs)] px-3 py-2 font-display text-[15px] font-medium leading-snug text-pearl-0 transition-colors hover:bg-white/8 hover:text-aqua-500"
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* `modelos` e `sobre` saem daqui porque tem painel proprio. */}
          {NAV.filter((n) => n.key !== 'modelos' && n.key !== 'sobre').map((n) => (
            <Link
              prefetch={false}
              key={n.key}
              href={href(n.key, locale)}
              className={`flex items-center whitespace-nowrap border-b pb-[3px] font-body text-xs font-bold uppercase tracking-[var(--tracking-wide)] transition-colors ${
                active === n.key
                  ? 'border-aqua-500 text-pearl-0'
                  : 'border-transparent text-on-dark-muted hover:text-pearl-0'
              }`}
            >
              {n.label}
            </Link>
          ))}

          <div className="group relative flex h-full items-center">
            <Link
              prefetch={false}
              href={href('contatos', locale)}
              className={`flex items-center gap-1.5 border-b pb-[3px] font-body text-xs font-bold uppercase tracking-[var(--tracking-wide)] transition-colors ${
                active === 'contatos'
                  ? 'border-aqua-500 text-pearl-0'
                  : 'border-transparent text-on-dark-muted hover:text-pearl-0'
              }`}
            >
              {t.nav.contacts}
              <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden>
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </Link>

            <div className="invisible absolute right-0 top-full z-40 w-[280px] translate-y-3 rounded-[var(--radius-md)] border border-[var(--border-on-dark)] bg-navy-800 p-3 opacity-0 shadow-[var(--shadow-lg)] transition duration-[240ms] ease-[var(--ease-glide)] group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <ul className="flex flex-col gap-0.5">
                {CONTATOS.map((n) => (
                  <li key={n.key}>
                    <Link
                      prefetch={false}
                      href={href(n.key, locale)}
                      className="flex min-h-11 items-center rounded-[var(--radius-xs)] px-3 py-2 font-display text-[15px] font-medium leading-snug text-pearl-0 transition-colors hover:bg-white/8 hover:text-aqua-500"
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </nav>

        <div className="ml-auto flex items-center gap-2 min-[1180px]:gap-3">
          <LangSwitch current={locale} />

          {/* Abaixo de `md` o CTA aperta a linha; o menu mobile o carrega.
              Envolvido num span porque o `inline-flex` do proprio Button
              venceria um utilitario `hidden` no mesmo elemento. */}
          {/* CTA de compra: abre o pop-up, nao leva para a pagina de contato. */}
          <span className="hidden lg:block">
            <QuoteDialog locale={locale}>
              {/* `px-3` ate `xl` e rotulo sem quebra: no intervalo apertado
                  (1024-1280px) o padding do tamanho `sm` e o que ainda da para
                  ceder sem mexer no token compartilhado do botao. */}
              <Button href="#" variant="signature" size="sm" className="whitespace-nowrap px-3 xl:px-5">
                {t.nav.quote}
              </Button>
            </QuoteDialog>
          </span>
          <MobileNav families={families} locale={locale} />
        </div>
      </div>
    </header>
  )
}
