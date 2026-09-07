import type { Metadata } from 'next'
import { Shell } from '../_shell'

/**
 * Layout raiz da árvore em português (URLs sem prefixo: `/`, `/modelos`…).
 * O par em inglês vive em `src/app/(en)/layout.tsx`.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lanchascoral.com.br'),
  title: {
    default: 'Coral Indústria Naval',
    template: '%s | Coral Indústria Naval',
  },
  description:
    'Estaleiro brasileiro desde 1990. Lanchas de 16 a 50 pés, com casco monobloco Wood Free e 10 anos de garantia estrutural.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Coral Indústria Naval',
    // Imagem padrão: sem ela, toda página sem foto própria era compartilhada
    // sem preview nenhum.
    images: [
      {
        url: '/brand/hero-home-1280.jpg',
        width: 1280,
        height: 853,
        alt: 'Lancha Coral navegando na Baía de Guanabara',
      },
    ],
  },
  twitter: { card: 'summary_large_image' },
}

export default function PtLayout({ children }: { children: React.ReactNode }) {
  return <Shell lang="pt-BR">{children}</Shell>
}
