import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'
import DicaView from '@/views/dica'
import { getArticle, getArticles, localizeArticle } from '@/lib/queries'
import { alternatesEn } from '@/lib/alternates'

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getArticles()).map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const bruto = await getArticle(slug)
  if (!bruto) return {}
  const a = localizeArticle(bruto, 'en')
  return {
    title: a.seoTitle ?? a.title,
    description: a.seoDescription ?? a.excerpt ?? a.body[0]?.slice(0, 200),
    alternates: alternatesEn(`/dicas/${a.slug}`, `/en/tips/${a.slug}`),
    openGraph: {
      type: 'article',
      title: a.title,
      images: a.heroImage ? [{ url: a.heroImage }] : undefined,
    },
  }
}

export default async function Page({ params }: Params) {
  const { slug } = await params
  return (
    <>
      <DicaView slug={slug} locale="en" />
      <SiteFooter locale="en" />
    </>
  )
}
