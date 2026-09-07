import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'
import PoliticaDeQualidadeView from '@/views/politica-de-qualidade'
import { alternates } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Política de qualidade',
  description: 'A política da qualidade adotada pela Lanchas Coral.',
  alternates: alternates('/politica-de-qualidade', '/en/quality-policy'),
}

export default function QualidadePage() {
  return (
    <>
      <PoliticaDeQualidadeView locale="pt" />
      <SiteFooter locale="pt" />
    </>
  )
}
