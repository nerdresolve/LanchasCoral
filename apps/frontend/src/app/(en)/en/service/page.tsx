import type { Metadata } from 'next'
import ContatoParaServicosView from '@/views/contato-para-servicos'
import SiteFooter from '@/components/SiteFooter'
import { alternatesEn } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Service',
  description: 'Coral technical service: refits, hard tops, platforms, electrical and hydraulic overhauls, parts.',
  alternates: alternatesEn('/contato-para-servicos', '/en/service'),
}

export default function Page() {
  return (
    <>
      <ContatoParaServicosView locale="en" />
      <SiteFooter locale="en" />
    </>
  )
}
