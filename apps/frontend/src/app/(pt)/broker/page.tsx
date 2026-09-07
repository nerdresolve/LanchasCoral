import type { Metadata } from 'next'
import BrokerView from '@/views/broker'
import SiteFooter from '@/components/SiteFooter'
import { alternates } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Coral Broker',
  description:
    'Seminovos inspecionados pelo estaleiro. Lanchas e jet skis de diversas marcas, com intermediação Coral.',
  alternates: alternates('/broker', '/en/broker'),
}

export default function Page({ searchParams }: { searchParams: Promise<{ tipo?: string; marca?: string }> }) {
  return (
    <>
      <BrokerView locale="pt" searchParams={searchParams} />
      <SiteFooter locale="pt" />
    </>
  )
}
