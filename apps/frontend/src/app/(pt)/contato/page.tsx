import type { Metadata } from 'next'
import ContatoView from '@/views/contato'
import SiteFooter from '@/components/SiteFooter'
import { alternates } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com a equipe Coral: propostas, visitas ao estaleiro e atendimento ao proprietário.',
  alternates: alternates('/contato', '/en/contact'),
}

export default function Page({ searchParams }: { searchParams: Promise<{ modelo?: string }> }) {
  return (
    <>
      <ContatoView locale="pt" searchParams={searchParams} />
      <SiteFooter locale="pt" />
    </>
  )
}
