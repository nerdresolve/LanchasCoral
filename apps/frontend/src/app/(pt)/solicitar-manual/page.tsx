import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'
import SolicitarManualView from '@/views/solicitar-manual'
import { alternates } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Solicitar manual',
  description: 'Solicite o manual do proprietário da sua embarcação Coral.',
  alternates: alternates('/solicitar-manual', '/en/request-manual'),
}

export default function SolicitarManualPage() {
  return (
    <>
      <SolicitarManualView locale="pt" />
      <SiteFooter locale="pt" />
    </>
  )
}
