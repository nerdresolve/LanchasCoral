import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'
import ContatosView from '@/views/contatos'
import { alternates } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Contatos',
  description:
    'Telefones e canais da Coral por área: comercial, assistência técnica e engenharia, e compras. Estaleiro em Duque de Caxias, RJ.',
  alternates: alternates('/contatos', '/en/contacts'),
}

export default function Page() {
  return (
    <>
      <ContatosView locale="pt" />
      <SiteFooter locale="pt" />
    </>
  )
}
