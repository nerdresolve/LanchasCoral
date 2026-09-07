import type { Metadata } from 'next'
import SolicitarManualView from '@/views/solicitar-manual'
import SiteFooter from '@/components/SiteFooter'
import { alternatesEn } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Request a manual',
  description: "Request the owner's manual for your Coral boat.",
  alternates: alternatesEn('/solicitar-manual', '/en/request-manual'),
}

export default function Page() {
  return (
    <>
      <SolicitarManualView locale="en" />
      <SiteFooter locale="en" />
    </>
  )
}
