import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'
import ContatoParaServicosView from '@/views/contato-para-servicos'
import { alternates } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Contato para serviços',
  description:
    'Assistência técnica Coral: revitalização, hard top, plataformas, revisão elétrica e hidráulica, peças e acessórios.',
  alternates: alternates('/contato-para-servicos', '/en/service'),
}

export default function ContatoServicosPage() {
  return (
    <>
      <ContatoParaServicosView locale="pt" />
      <SiteFooter locale="pt" />
    </>
  )
}
