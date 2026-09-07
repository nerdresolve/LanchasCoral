import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'
import TrabalheConoscoView from '@/views/trabalhe-conosco'
import { alternates } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Trabalhe conosco',
  description:
    'Seja representante, fornecedor, prestador de serviços ou colaborador da Coral.',
  alternates: alternates('/trabalhe-conosco', '/en/careers'),
}

export default function TrabalheConoscoPage() {
  return (
    <>
      <TrabalheConoscoView locale="pt" />
      <SiteFooter locale="pt" />
    </>
  )
}
