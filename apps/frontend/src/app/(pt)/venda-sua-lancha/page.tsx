import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'
import VendaSuaLanchaView from '@/views/venda-sua-lancha'
import { alternates } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Venda sua lancha',
  description:
    'Anuncie sua embarcação pelo Coral Broker e conte com os maiores consultores náuticos do mercado.',
  alternates: alternates('/venda-sua-lancha', '/en/sell-your-boat'),
}

export default function Page() {
  return (
    <>
      <VendaSuaLanchaView locale="pt" />
      <SiteFooter locale="pt" />
    </>
  )
}
