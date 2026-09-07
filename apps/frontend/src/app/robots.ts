import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lanchascoral.com.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // O painel e as rotas de API nunca devem ser rastreados.
        disallow: ['/admin', '/admin/*', '/api/*'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
