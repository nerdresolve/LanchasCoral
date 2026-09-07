import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'
import ContatosView from '@/views/contatos'
import { alternatesEn } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Contacts',
  description:
    'Coral phone lines by department: sales, service and engineering, and procurement. Shipyard in Duque de Caxias, Rio de Janeiro.',
  alternates: alternatesEn('/contatos', '/en/contacts'),
}

export default function Page() {
  return (
    <>
      <ContatosView locale="en" />
      <SiteFooter locale="en" />
    </>
  )
}
