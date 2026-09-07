import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'
import PoliticaDePrivacidadeView from '@/views/politica-de-privacidade'
import { alternates } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description: 'Como a Lanchas Coral trata os dados pessoais coletados neste site.',
  alternates: alternates('/politica-de-privacidade', '/en/privacy-policy'),
}

export default function PrivacidadePage() {
  return (
    <>
      <PoliticaDePrivacidadeView locale="pt" />
      <SiteFooter locale="pt" />
    </>
  )
}
