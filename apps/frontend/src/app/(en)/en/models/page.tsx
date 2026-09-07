import type { Metadata } from 'next'
import ModelosView from '@/views/modelos'
import SiteFooter from '@/components/SiteFooter'
import { alternatesEn } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Models',
  description:
    'The complete Coral line, grouped by hull family, from the compact day-boat to the offshore cabin cruiser.',
  alternates: alternatesEn('/modelos', '/en/models'),
}

export default function Page({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  return (
    <>
      <ModelosView locale="en" searchParams={searchParams} />
      <SiteFooter locale="en" />
    </>
  )
}
