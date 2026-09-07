import type { Metadata } from 'next'
import ContatoView from '@/views/contato'
import SiteFooter from '@/components/SiteFooter'
import { alternatesEn } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Talk to the Coral team: quotes, yard visits and owner support.',
  alternates: alternatesEn('/contato', '/en/contact'),
}

export default function Page({ searchParams }: { searchParams: Promise<{ modelo?: string }> }) {
  return (
    <>
      <ContatoView locale="en" searchParams={searchParams} />
      <SiteFooter locale="en" />
    </>
  )
}
