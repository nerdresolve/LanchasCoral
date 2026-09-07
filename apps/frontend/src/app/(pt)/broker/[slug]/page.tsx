import type { Metadata } from 'next'
import ListingView from '@/views/listing'
import SiteFooter from '@/components/SiteFooter'
import { getListingBySlug, getListingSlugs } from '@/lib/queries'
import { brl } from '@/lib/format'
import { alternates } from '@/lib/alternates'

type Params = { params: Promise<{ slug: string }> }

/** Pré-renderiza cada anúncio publicado. */
export async function generateStaticParams() {
  const slugs = await getListingSlugs()
  return slugs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const l = await getListingBySlug(slug)
  if (!l) return {}

  const preco = l.priceBrl ? `, ${brl(l.priceBrl)}` : ''
  return {
    title: l.title,
    description: `${l.title}${preco}. Seminovo intermediado pelo Coral Broker.`,
    alternates: alternates(`/broker/${l.slug}`, `/en/broker/${l.slug}`),
    openGraph: { title: l.title, images: l.heroImage ? [{ url: l.heroImage }] : undefined },
  }
}

export default async function Page({ params }: Params) {
  const { slug } = await params
  return (
    <>
      <ListingView slug={slug} locale="pt" />
      <SiteFooter locale="pt" />
    </>
  )
}
