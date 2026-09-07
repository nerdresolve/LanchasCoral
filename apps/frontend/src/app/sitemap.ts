import type { MetadataRoute } from 'next'
import { getBoatSlugs, getListingSlugs , getArticles } from '@/lib/queries'
import { ROUTES, type RouteKey } from '@/i18n/config'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lanchascoral.com.br'

/**
 * Sitemap com as duas versões de idioma.
 * Cada entrada declara sua alternativa via `alternates.languages`, para o
 * buscador entender o par pt-BR / en.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [boats, listings, artigos] = await Promise.all([getBoatSlugs(), getListingSlugs(), getArticles()])

  const estaticas: RouteKey[] = [
    'home',
    'modelos',
    'broker',
    'sobre',
    'vender',
    'dicas',
    'contatos',
    'contato',
    'servicos',
    'manual',
    'trabalhe',
    'qualidade',
    'privacidade',
  ]

  const entrada = (ptPath: string, enPath: string, priority: number) => ({
    url: `${BASE}${ptPath}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority,
    alternates: {
      languages: {
        'pt-BR': `${BASE}${ptPath}`,
        en: `${BASE}/en${enPath === '/' ? '' : enPath}`,
      },
    },
  })

  return [
    ...estaticas.map((k) =>
      entrada(ROUTES[k].pt, ROUTES[k].en, k === 'home' ? 1 : k === 'modelos' ? 0.9 : 0.7),
    ),
    ...boats.map(({ slug }) =>
      entrada(`${ROUTES.modelos.pt}/${slug}`, `${ROUTES.modelos.en}/${slug}`, 0.8),
    ),
    ...listings.map(({ slug }) =>
      entrada(`${ROUTES.broker.pt}/${slug}`, `${ROUTES.broker.en}/${slug}`, 0.6),
    ),
    ...artigos.map(({ slug }) =>
      entrada(`${ROUTES.dicas.pt}/${slug}`, `${ROUTES.dicas.en}/${slug}`, 0.5),
    ),
  ]
}
