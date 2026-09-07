import type { Metadata } from 'next'
import HomeView from '@/views/home'
import SiteFooter from '@/components/SiteFooter'
import { alternates } from '@/lib/alternates'

export const metadata: Metadata = {
  // A home herdava titulo e descricao do layout e nao declarava canonical
  // nem hreflang, justamente na pagina mais importante do site.
  title: { absolute: 'Lanchas Coral | Estaleiro brasileiro desde 1990' },
  description:
    'Fabricamos lanchas de 16 a 50 pes em Duque de Caxias, RJ. Mais de 3.000 embarcacoes entregues, casco monobloco Wood Free e 10 anos de garantia estrutural.',
  alternates: alternates('/', '/en'),
}

export default function Page() {
  return (
    <>
      <HomeView locale="pt" />
      <SiteFooter locale="pt" />
    </>
  )
}
