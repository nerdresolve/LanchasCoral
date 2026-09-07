import type { Metadata } from 'next'
import PoliticaDeQualidadeView from '@/views/politica-de-qualidade'
import SiteFooter from '@/components/SiteFooter'
import { alternatesEn } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Quality policy',
  description: 'The quality policy adopted by Lanchas Coral.',
  alternates: alternatesEn('/politica-de-qualidade', '/en/quality-policy'),
}

export default function Page() {
  return (
    <>
      <PoliticaDeQualidadeView locale="en" />
      <SiteFooter locale="en" />
    </>
  )
}
