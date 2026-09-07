import { requireAdmin } from '@/lib/auth'
import { Breadcrumb } from '@/components/admin/Shell'
import { createListing } from '../../listing-actions'
import ListingForm from '@/components/admin/ListingForm'
import { EMPTY_LISTING } from '@/lib/listing-form-values'

export const dynamic = 'force-dynamic'

export default async function NewListingPage() {
  await requireAdmin()

  return (
    <>
      <Breadcrumb href="/admin/listings" parent="Seminovos" current="Novo anúncio" />

      <h1 className="mt-2 font-display text-2xl font-semibold tracking-[var(--tracking-display)] text-[var(--text-strong)]">Novo anúncio</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        O anúncio aparece no Coral Broker assim que for publicado.
      </p>

      <div className="mt-8">
        <ListingForm action={createListing} values={EMPTY_LISTING} submitLabel="Criar anúncio" />
      </div>
    </>
  )
}
