import type { Metadata } from 'next'
import VendaSuaLanchaView from '@/views/venda-sua-lancha'
import SiteFooter from '@/components/SiteFooter'
import { alternatesEn } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Sell your boat',
  description: 'List your boat with Coral Broker and work with leading marine consultants.',
  alternates: alternatesEn('/venda-sua-lancha', '/en/sell-your-boat'),
}

export default function Page() {
  return (
    <>
      <VendaSuaLanchaView locale="en" />
      <SiteFooter locale="en" />
    </>
  )
}
