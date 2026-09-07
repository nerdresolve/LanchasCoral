import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { Breadcrumb } from '@/components/admin/Shell'
import { createBoat } from '../../boat-actions'
import BoatForm from '@/components/admin/BoatForm'
import { emptyFormValues } from '@/lib/boat-form-values'

export const dynamic = 'force-dynamic'

export default async function NewBoatPage() {
  await requireAdmin()
  const families = await prisma.family.findMany({ orderBy: { order: 'asc' }, select: { name: true } })

  return (
    <>
      <Breadcrumb href="/admin" parent="Modelos" current="Novo modelo" />

      <h1 className="mt-2 font-display text-2xl font-semibold tracking-[var(--tracking-display)] text-[var(--text-strong)]">Novo modelo</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        A página pública é gerada automaticamente ao salvar.
      </p>

      <div className="mt-8">
        <BoatForm
          action={createBoat}
          values={emptyFormValues}
          families={families.map((f) => f.name)}
          submitLabel="Criar modelo"
        />
      </div>
    </>
  )
}
