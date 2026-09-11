import { COMPANY } from './company'
import { href, type Locale } from '@/i18n/config'

/**
 * Dados estruturados (JSON-LD, schema.org).
 *
 * Descrevem para o buscador o que as páginas já mostram para pessoas: quem é a
 * empresa, o que é cada barco, quanto custa um seminovo e onde a página está
 * na hierarquia do site. É o que habilita preço, disponibilidade e trilha
 * aparecerem direto no resultado da busca.
 *
 * Regra que vale para tudo aqui: só afirmar o que a página de fato mostra.
 * Marcar preço ou disponibilidade que não estão na tela é motivo de penalidade
 * manual, não só de perda de rich result.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lanchascoral.com.br'

/** Absolutiza caminhos internos; deixa passar URLs que já são absolutas. */
const abs = (caminho: string) =>
  caminho.startsWith('http') ? caminho : `${SITE}${caminho.startsWith('/') ? '' : '/'}${caminho}`

/** Só entra no JSON o que existe: campos vazios viram ruído para o validador. */
function limpar<T extends Record<string, unknown>>(obj: T): T {
  const saida = {} as T
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '') continue
    if (Array.isArray(v) && v.length === 0) continue
    saida[k as keyof T] = v as T[keyof T]
  }
  return saida
}

/** O estaleiro. Vai uma vez, no layout raiz. */
export function organizationSchema(telefones?: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE}/#organization`,
    name: COMPANY.name,
    url: SITE,
    logo: abs('/brand/logo-coral.png'),
    foundingDate: '1990',
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY.address.street,
      addressLocality: COMPANY.address.district,
      addressRegion: COMPANY.address.state,
      postalCode: COMPANY.address.zip,
      addressCountry: 'BR',
    },
    /* Telefones do banco quando informados; senão os da constante. É o mesmo
       conjunto que a página de contatos publica — o Google não deve receber
       um número que o site não mostra mais. */
    telephone: telefones ?? COMPANY.phones,
    sameAs: Object.values(COMPANY.social),
  }
}

/** O site, para o buscador entender a relação entre as páginas. */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    url: SITE,
    name: COMPANY.name,
    inLanguage: ['pt-BR', 'en'],
    publisher: { '@id': `${SITE}/#organization` },
  }
}

/** Trilha de navegação. Espelha o breadcrumb visível, nunca inventa níveis. */
export function breadcrumbSchema(itens: { nome: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.nome,
      item: abs(it.url),
    })),
  }
}

type BoatSchema = {
  slug: string
  name: string
  variant?: string | null
  tagline?: string | null
  description?: string | null
  heroImage?: string | null
  images?: { url: string }[]
  lengthM?: unknown
  beamM?: unknown
  powerMaxHp?: number | null
  capOpenSeaDay?: number | null
  capInteriorDay?: number | null
}

/**
 * Modelo de fábrica.
 *
 * Sai SEM `offers`: a Coral não publica preço de barco novo, e declarar oferta
 * sem preço visível na página é exatamente o tipo de marcação que o Google
 * trata como enganosa. As medidas viram `additionalProperty`, que é o encaixe
 * correto para especificação técnica.
 */
export function boatSchema(b: BoatSchema, locale: Locale) {
  const nome = b.variant ? `${b.name} ${b.variant}` : b.name
  const props: { '@type': 'PropertyValue'; name: string; value: string | number; unitCode?: string }[] = []

  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v))
  const loa = num(b.lengthM)
  const boca = num(b.beamM)
  const pt = locale === 'pt'

  if (loa) props.push({ '@type': 'PropertyValue', name: pt ? 'Comprimento' : 'Length overall', value: loa, unitCode: 'MTR' })
  if (boca) props.push({ '@type': 'PropertyValue', name: pt ? 'Boca' : 'Beam', value: boca, unitCode: 'MTR' })
  if (b.powerMaxHp) props.push({ '@type': 'PropertyValue', name: pt ? 'Potência máxima' : 'Maximum power', value: b.powerMaxHp, unitCode: 'BHP' })
  const lotacao = b.capOpenSeaDay ?? b.capInteriorDay
  if (lotacao) props.push({ '@type': 'PropertyValue', name: pt ? 'Lotação' : 'Capacity', value: lotacao })

  const fotos = [b.heroImage, ...(b.images ?? []).map((i) => i.url)].filter(Boolean).slice(0, 6) as string[]

  return limpar({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: nome,
    url: abs(href('modelos', locale, `/${b.slug}`)),
    description: b.tagline ?? b.description?.slice(0, 300) ?? undefined,
    image: fotos.map(abs),
    brand: { '@type': 'Brand', name: COMPANY.name },
    manufacturer: { '@id': `${SITE}/#organization` },
    category: pt ? 'Lancha' : 'Motor boat',
    additionalProperty: props,
  })
}

type ListingSchema = {
  slug: string
  title: string
  brand?: string | null
  year?: number | null
  priceBrl?: number | null
  description?: string | null
  heroImage?: string | null
  images?: { url: string }[]
  sold?: boolean
  engine?: string | null
}

/**
 * Anúncio de seminovo.
 *
 * Aqui o `offers` É correto: o preço aparece na página. Quando o anúncio é
 * "sob consulta" (`priceBrl` nulo) a oferta sai sem preço, com apenas a
 * disponibilidade — melhor do que inventar um valor.
 */
export function listingSchema(l: ListingSchema, locale: Locale) {
  const fotos = [l.heroImage, ...(l.images ?? []).map((i) => i.url)].filter(Boolean).slice(0, 6) as string[]
  const url = abs(href('broker', locale, `/${l.slug}`))

  const offers = limpar({
    '@type': 'Offer',
    url,
    priceCurrency: 'BRL',
    price: l.priceBrl ?? undefined,
    availability: l.sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/UsedCondition',
    seller: { '@id': `${SITE}/#organization` },
  })

  return limpar({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: l.title,
    url,
    description: l.description?.slice(0, 300) ?? undefined,
    image: fotos.map(abs),
    brand: l.brand ? { '@type': 'Brand', name: l.brand } : undefined,
    productionDate: l.year ? String(l.year) : undefined,
    category: locale === 'pt' ? 'Embarcação seminova' : 'Pre-owned boat',
    offers,
  })
}

/** Catálogo: diz ao buscador que a página lista itens, e quais são. */
export function itemListSchema(itens: { nome: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: itens.length,
    itemListElement: itens.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.nome,
      url: abs(it.url),
    })),
  }
}

type ArticleSchema = {
  slug: string
  title: string
  excerpt?: string | null
  body: string[]
  heroImage?: string | null
  publishedAt?: Date | null
}

/**
 * Artigo do blog técnico.
 *
 * `Article` (e não `BlogPosting`) porque o conteúdo é técnico e atemporal, não
 * um post datado. `author` é a própria empresa: os textos não são assinados
 * no site de origem, e atribuir a alguém seria inventar.
 */
export function articleSchema(a: ArticleSchema, locale: Locale) {
  return limpar({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title.slice(0, 110),
    url: abs(href('dicas', locale, `/${a.slug}`)),
    description: a.excerpt ?? a.body[0]?.slice(0, 200) ?? undefined,
    image: a.heroImage ? [abs(a.heroImage)] : undefined,
    datePublished: a.publishedAt ? a.publishedAt.toISOString() : undefined,
    inLanguage: locale === 'pt' ? 'pt-BR' : 'en',
    author: { '@id': `${SITE}/#organization` },
    publisher: { '@id': `${SITE}/#organization` },
  })
}
