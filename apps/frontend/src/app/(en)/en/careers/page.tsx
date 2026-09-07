import type { Metadata } from 'next'
import TrabalheConoscoView from '@/views/trabalhe-conosco'
import SiteFooter from '@/components/SiteFooter'
import { alternatesEn } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join Coral as a dealer, supplier, service partner or team member.',
  alternates: alternatesEn('/trabalhe-conosco', '/en/careers'),
}

export default function Page() {
  return (
    <>
      <TrabalheConoscoView locale="en" />
      <SiteFooter locale="en" />
    </>
  )
}
