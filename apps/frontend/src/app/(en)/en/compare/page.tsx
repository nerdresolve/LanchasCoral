import type { Metadata } from 'next'
import CompararView from '@/views/comparar'
import SiteFooter from '@/components/SiteFooter'
import { alternates } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Compare models',
  description:
    'Compare two Coral boats side by side: dimensions, capacity, power, tanks and what sets each model apart.',
  alternates: alternates('/comparar', '/en/compare'),
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>
}) {
  const { a, b } = await searchParams
  return (
    <>
      <CompararView locale="en" a={a} b={b} />
      <SiteFooter locale="en" />
    </>
  )
}
