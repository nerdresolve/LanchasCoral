import type { Metadata } from 'next'
import SobreView from '@/views/sobre'
import SiteFooter from '@/components/SiteFooter'
import { alternatesEn } from '@/lib/alternates'

export const metadata: Metadata = {
  title: 'About',
  description: 'A 100% Brazilian shipyard since 1990. Over 2,000 boats built, from 16 to 50 feet.',
  alternates: alternatesEn('/sobre', '/en/about'),
}

export default async function Page() {
  return (
    <>
      <SobreView locale="en" />
      <SiteFooter locale="en" />
    </>
  )
}
