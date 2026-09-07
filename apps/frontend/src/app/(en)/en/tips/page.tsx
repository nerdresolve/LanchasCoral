import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'
import DicasView from '@/views/dicas'
import { alternatesEn } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'Tips',
  description:
    'Technical reading from the yard: gel coat or PU paint, vacuum infusion lamination and what to look for when choosing a boat.',
  alternates: alternatesEn('/dicas', '/en/tips'),
}

export default function Page() {
  return (
    <>
      <DicasView locale="en" />
      <SiteFooter locale="en" />
    </>
  )
}
