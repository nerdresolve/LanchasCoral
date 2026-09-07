import type { Metadata } from 'next'
import BrokerView from '@/views/broker'
import SiteFooter from '@/components/SiteFooter'
import { alternatesEn } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Coral Broker',
  description:
    'Pre-owned boats vetted by the shipyard. Boats and jet skis across brands, brokered by Coral.',
  alternates: alternatesEn('/broker', '/en/broker'),
}

export default function Page({ searchParams }: { searchParams: Promise<{ tipo?: string; marca?: string }> }) {
  return (
    <>
      <BrokerView locale="en" searchParams={searchParams} />
      <SiteFooter locale="en" />
    </>
  )
}
