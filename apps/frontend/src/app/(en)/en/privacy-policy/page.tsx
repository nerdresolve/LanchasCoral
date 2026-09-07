import type { Metadata } from 'next'
import PoliticaDePrivacidadeView from '@/views/politica-de-privacidade'
import SiteFooter from '@/components/SiteFooter'
import { alternatesEn } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How Lanchas Coral handles personal data collected on this site.',
  alternates: alternatesEn('/politica-de-privacidade', '/en/privacy-policy'),
}

export default function Page() {
  return (
    <>
      <PoliticaDePrivacidadeView locale="en" />
      <SiteFooter locale="en" />
    </>
  )
}
