import type { Metadata } from 'next'
import ModelosView from '@/views/modelos'
import SiteFooter from '@/components/SiteFooter'
import { alternates } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Modelos',
  description:
    'A linha completa de lanchas Coral, organizada por família de casco, do day-boat à cabinada oceânica.',
  alternates: alternates('/modelos', '/en/models'),
}

export default function Page({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  return (
    <>
      <ModelosView locale="pt" searchParams={searchParams} />
      <SiteFooter locale="pt" />
    </>
  )
}
