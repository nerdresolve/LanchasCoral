import type { Metadata } from 'next'
import BoatView from '@/views/modelo'
import SiteFooter from '@/components/SiteFooter'
import { getBoatBySlug, getBoatSlugs, boatLabel } from '@/lib/queries'
import { alternates } from '@/lib/alternates'

type Params = { params: Promise<{ slug: string }> }

/** Pré-renderiza cada barco publicado. */
export async function generateStaticParams() {
  const slugs = await getBoatSlugs()
  return slugs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const boat = await getBoatBySlug(slug)
  if (!boat) return {}

  const label = boatLabel(boat)
  return {
    title: boat.seoTitle ?? label,
    description:
      boat.seoDescription ?? boat.tagline ?? `Conheça a ${label}: especificações, equipamentos e galeria.`,
    alternates: alternates(`/modelos/${boat.slug}`, `/en/models/${boat.slug}`),
    openGraph: { title: label, images: boat.heroImage ? [{ url: boat.heroImage }] : undefined },
  }
}

export default async function Page({ params }: Params) {
  const { slug } = await params
  return (
    <>
      <BoatView slug={slug} locale="pt" />
      <SiteFooter locale="pt" />
    </>
  )
}
