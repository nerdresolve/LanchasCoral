import type { Metadata } from 'next'
import { Shell } from '../_shell'

/**
 * Layout raiz da árvore em inglês (`/en/...`).
 *
 * Existe separado do português para servir `<html lang="en">` já no HTML
 * inicial, e não via script depois da hidratação.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lanchascoral.com.br'),
  title: { default: 'Coral Boats', template: '%s | Coral Boats' },
  description:
    'Brazilian boatbuilder since 1990. Motor boats from 16 to 50 feet, Wood Free monocoque hulls and a 10-year structural warranty.',
  // O objeto `openGraph` SUBSTITUI o do outro layout, não mescla campo a
  // campo: tudo o que deve valer nas páginas EN precisa estar aqui.
  openGraph: {
    type: 'website',
    locale: 'en',
    siteName: 'Coral Boats',
    images: [
      {
        url: '/brand/hero-home-1280.jpg',
        width: 1280,
        height: 853,
        alt: 'Coral motor boat under way in Guanabara Bay',
      },
    ],
  },
  twitter: { card: 'summary_large_image' },
}

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <Shell lang="en">{children}</Shell>
}
