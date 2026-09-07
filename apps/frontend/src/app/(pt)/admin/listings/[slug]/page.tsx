import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { updateListing, deleteListing } from '../../listing-actions'
import BotaoExcluir from '@/components/admin/BotaoExcluir'
import ListingForm from '@/components/admin/ListingForm'
import { toListingFormValues } from '@/lib/listing-form-values'
import { Breadcrumb, Notice } from '@/components/admin/Shell'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ saved?: string; created?: string }>
}

export default async function EditListingPage({ params, searchParams }: Props) {
  await requireAdmin()
  const { slug } = await params
  const { saved, created } = await searchParams

  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { order: 'asc' } },
      accessories: { orderBy: { order: 'asc' } },
    },
  })
  if (!listing) notFound()

  return (
    <>
      <Breadcrumb href="/admin/listings" parent="Seminovos" current={listing.title} />

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[var(--tracking-display)] text-[var(--text-strong)]">{listing.title}</h1>
          <Link
            href={`/broker/${listing.slug}`}
            target="_blank"
            className="mt-1 inline-block text-sm font-medium text-ocean-700 transition-colors duration-[140ms] hover:text-aqua-600"
          >
            Ver página pública ↗
          </Link>
        </div>

        <BotaoExcluir id={listing.id} nome={listing.title} tipo="anúncio" action={deleteListing} />
      </div>

      {(saved || created) && (
        <Notice>{created ? 'Anúncio criado com sucesso.' : 'Alterações salvas.'}</Notice>
      )}

      <div className="mt-8">
        <ListingForm
          action={updateListing}
          values={toListingFormValues(listing)}
          submitLabel="Salvar alterações"
        />
      </div>
    </>
  )
}
