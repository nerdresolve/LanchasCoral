/** Idiomas do site. `pt` é a raiz (/), `en` fica sob /en. */
export const LOCALES = ['pt', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'pt'

export const LOCALE_META: Record<Locale, { label: string; flag: string; htmlLang: string }> = {
  pt: { label: 'Português', flag: 'BR', htmlLang: 'pt-BR' },
  en: { label: 'English', flag: 'US', htmlLang: 'en' },
}

export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v)

/**
 * Rotas equivalentes entre idiomas. O caminho em inglês é traduzido para que a
 * URL faça sentido no idioma, como no site legado (/en/...).
 */
export const ROUTES = {
  home: { pt: '/', en: '/' },
  modelos: { pt: '/modelos', en: '/models' },
  // Comparação entre dois modelos: /comparar?a=<slug>&b=<slug>
  comparar: { pt: '/comparar', en: '/compare' },
  sobre: { pt: '/sobre', en: '/about' },
  broker: { pt: '/broker', en: '/broker' },
  // Detalhe de um seminovo: /broker/<slug>
  brokerItem: { pt: '/broker', en: '/broker' },
  vender: { pt: '/venda-sua-lancha', en: '/sell-your-boat' },
  // Hub que reune os canais por area, como /nossos-contatos/ no site antigo.
  contatos: { pt: '/contatos', en: '/contacts' },
  contato: { pt: '/contato', en: '/contact' },
  servicos: { pt: '/contato-para-servicos', en: '/service' },
  manual: { pt: '/solicitar-manual', en: '/request-manual' },
  trabalhe: { pt: '/trabalhe-conosco', en: '/careers' },
  // Blog tecnico, migrado de /dicas/ do site legado. O caminho em portugues
  // e o mesmo do site antigo, para nao perder o que ja esta indexado.
  dicas: { pt: '/dicas', en: '/tips' },
  qualidade: { pt: '/politica-de-qualidade', en: '/quality-policy' },
  privacidade: { pt: '/politica-de-privacidade', en: '/privacy-policy' },
} as const

export type RouteKey = keyof typeof ROUTES

/** Monta o href final já com o prefixo de idioma. */
export function href(key: RouteKey, locale: Locale, suffix = ''): string {
  const path = ROUTES[key][locale]
  const base = locale === DEFAULT_LOCALE ? path : `/en${path === '/' ? '' : path}`
  return (base || '/') + suffix
}

/** Dado um pathname atual, devolve o equivalente no outro idioma. */
export function switchPath(pathname: string, to: Locale): string {
  const clean = pathname.replace(/^\/en(?=\/|$)/, '') || '/'
  const from: Locale = pathname.startsWith('/en') ? 'en' : 'pt'
  if (from === to) return pathname

  // Rota estática conhecida: usa o caminho equivalente.
  for (const key of Object.keys(ROUTES) as RouteKey[]) {
    if (ROUTES[key][from] === clean) return href(key, to)
  }

  // Páginas com slug (modelo, seminovo e artigo): mantém o slug, troca a rota.
  // Faltando aqui, o seletor de idioma monta /en/dicas/... e cai em 404.
  for (const key of ['modelos', 'broker', 'dicas'] as const) {
    const seg = ROUTES[key]
    if (clean.startsWith(`${seg[from]}/`)) {
      const slug = clean.slice(seg[from].length + 1)
      return href(key, to, `/${slug}`)
    }
  }

  return to === DEFAULT_LOCALE ? clean : `/en${clean === '/' ? '' : clean}`
}
