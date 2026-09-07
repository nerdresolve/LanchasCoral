import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'
import DicasView from '@/views/dicas'
import { alternates } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Dicas',
  description:
    'Conteúdo técnico do estaleiro: gel coat ou tinta PU, laminação por infusão e o que observar na escolha de uma lancha.',
  alternates: alternates('/dicas', '/en/tips'),
}

export default function Page() {
  return (
    <>
      <DicasView locale="pt" />
      <SiteFooter locale="pt" />
    </>
  )
}
