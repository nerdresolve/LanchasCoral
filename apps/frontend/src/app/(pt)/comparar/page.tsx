import type { Metadata } from 'next'
import CompararView from '@/views/comparar'
import SiteFooter from '@/components/SiteFooter'
import { alternates } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Comparar modelos',
  description:
    'Compare duas lanchas Coral lado a lado: dimensões, lotação, motorização, tanques e o que cada modelo tem de diferente.',
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
      <CompararView locale="pt" a={a} b={b} />
      <SiteFooter locale="pt" />
    </>
  )
}
