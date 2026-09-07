import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'
import SobreView from '@/views/sobre'
import { alternates } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Sobre',
  description:
    'Estaleiro 100% brasileiro fundado em 1990. Mais de 2.000 embarcações produzidas, de 16 a 50 pés.',
  alternates: alternates('/sobre', '/en/about'),
}

export default async function Page() {
  return (
    <>
      <SobreView locale="pt" />
      <SiteFooter locale="pt" />
    </>
  )
}
