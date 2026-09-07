import { href, type Locale } from '@/i18n/config'
  import { getDict } from '@/i18n/dictionary'

  /**
   * Busca do estoque com os mesmos cinco campos do portal de origem:
   * tamanho, marca, ano, tipo e tipo de motor.
   *
   * É um <form method="get"> puro — funciona sem JavaScript, e cada busca vira
   * uma URL própria, o que é bom para SEO e para o visitante compartilhar.
   */
  export type Facets = {
    brands: string[]
    years: number[]
    sizes: number[]
    kinds: string[]
    engineTypes: string[]
  }

  export type Selecao = {
    tamanho?: string
    marca?: string
    ano?: string
    tipo?: string
    motor?: string
  }

  const KIND_LABEL: Record<string, string> = {
    LANCHA: 'Lancha seminova',
    JETSKI: 'Jetski',
  }

  export default function ListingSearch({
    locale,
    facets,
    atual,
    action,
  }: {
    locale: Locale
    facets: Facets
    atual: Selecao
    action: string
  }) {
    const t = getDict(locale).broker

    const campo =
      'h-11 w-full appearance-none rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3.5 pr-9 font-body text-sm text-[var(--text-strong)] outline-none transition-colors focus:border-ocean-600'

    const seta =
      "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"

    const ativos = Object.values(atual).filter(Boolean).length
    const temFiltro = ativos > 0

    const selects: {
      name: keyof Selecao
      label: string
      options: { value: string; label: string }[]
    }[] = [
      {
        name: 'tamanho',
        label: t.anySize,
        options: facets.sizes.map((s) => ({ value: String(s), label: `${s} ${t.ft}` })),
      },
      {
        name: 'marca',
        label: t.anyBrand,
        options: facets.brands.map((b) => ({ value: b, label: b })),
      },
      {
        name: 'ano',
        label: t.anyYear,
        options: facets.years.map((y) => ({ value: String(y), label: String(y) })),
      },
      {
        name: 'tipo',
        label: t.anyKind,
        options: facets.kinds.map((k) => ({
          value: k,
          label: locale === 'en' ? (k === 'JETSKI' ? 'Jet ski' : 'Pre-owned boat') : KIND_LABEL[k] ?? k,
        })),
      },
      {
        name: 'motor',
        label: t.anyEngine,
        options: facets.engineTypes.map((e) => ({ value: e, label: e })),
      },
    ]

  /*
   * O formulário é montado uma vez e usado em dois lugares: dentro de um
   * <details> no celular e solto a partir de `sm`.
   *
   * Duplicar a marcação é o preço de uma solução que não depende de
   * JavaScript. A alternativa — um único <details> aberto por CSS no desktop —
   * não funciona: o navegador zera a caixa de TODO o conteúdo de um <details>
   * fechado, e nenhuma regra de `display` vence isso. (`::details-content`
   * resolveria, mas é recente demais para ser a única defesa.)
   */
  const formulario = (instancia: string, className = '') => (
        <form
          method="get"
          action={action}
          aria-label={t.search}
          className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 ${className}`}
        >
        {selects.map((s) => (
          <div key={s.name} className="relative">
            <label htmlFor={`f-${instancia}-${s.name}`} className="sr-only">
              {s.label}
            </label>
            <select
              id={`f-${instancia}-${s.name}`}
              name={s.name}
              defaultValue={atual[s.name] ?? ''}
              className={campo}
            >
              <option value="">{s.label}</option>
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <svg width="12" height="8" viewBox="0 0 12 8" className={seta} aria-hidden>
              <path d="M1 1.5 6 6.5l5-5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
        ))}

        <div className="flex gap-2">
          <button
            type="submit"
            className="h-11 flex-1 rounded-[var(--radius-pill)] bg-[image:var(--grad-signature)] px-5 font-body text-xs font-semibold uppercase tracking-[0.06em] text-pearl-0 shadow-[var(--shadow-sm)] transition-all duration-[240ms] ease-[var(--ease-glide)] hover:-translate-y-0.5 hover:shadow-[var(--glow-signature)]"
          >
            {t.apply}
          </button>

          {temFiltro && (
            <a
              href={href('broker', locale)}
              title={t.clear}
              aria-label={t.clear}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--border-subtle)] text-[var(--text-muted)] transition-colors hover:border-ocean-700 hover:text-ocean-700"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </a>
          )}
        </div>
      </form>
  )

  return (
    <>
      {/* Celular: retrátil. Os cinco campos empilhados ocupavam 384px de uma
          tela de 844px e empurravam o primeiro anúncio para 960px, abaixo da
          dobra — quem abria a página não via barco nenhum. */}
      <details className="group/f sm:hidden [&[open]_.seta-f]:rotate-180">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 font-body text-sm font-semibold text-[var(--text-strong)] transition-colors hover:border-ocean-600 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path d="M3 5h18M6 12h12M10 19h4" />
            </svg>
            {t.filtersToggle}
          </span>
          <span className="flex items-center gap-2">
            {/* O selo mantém o contexto com o painel fechado: sem ele, o
                visitante não saberia que a lista está filtrada. */}
            {temFiltro && (
              <span className="rounded-[var(--radius-pill)] bg-ocean-700 px-2 py-0.5 font-mono text-[11px] font-medium text-pearl-0">
                {ativos}
              </span>
            )}
            <svg width="12" height="8" viewBox="0 0 12 8" className="seta-f text-[var(--text-muted)] transition-transform duration-[240ms]" aria-hidden>
              <path d="M1 1.5 6 6.5l5-5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </span>
        </summary>
        {formulario('m', 'mt-3')}
      </details>

      {/* Tablet e desktop: sempre visível, em duas ou seis colunas. */}
      <div className="hidden sm:block">{formulario('d')}</div>
    </>
  )
}
