import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { updateBoat, deleteBoat } from '../../boat-actions'
import BotaoExcluir from '@/components/admin/BotaoExcluir'
import BoatForm from '@/components/admin/BoatForm'
import { toFormValues } from '@/lib/boat-form-values'
import { Breadcrumb, Notice } from '@/components/admin/Shell'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ saved?: string; created?: string }>
}

export default async function EditBoatPage({ params, searchParams }: Props) {
  await requireAdmin()
  const { slug } = await params
  const { saved, created } = await searchParams

  const boat = await prisma.boat.findUnique({
    where: { slug },
    include: {
      family: true,
      images: { orderBy: { order: 'asc' } },
      equipment: { orderBy: [{ panel: 'asc' }, { order: 'asc' }] },
    },
  })
  if (!boat) notFound()

  const families = await prisma.family.findMany({ orderBy: { order: 'asc' }, select: { name: true } })
  const label = [boat.name, boat.variant].filter(Boolean).join(' – ')

  return (
    <>
      <Breadcrumb href="/admin" parent="Modelos" current={label} />

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[var(--tracking-display)] text-[var(--text-strong)]">{label}</h1>
          <Link
            href={`/modelos/${boat.slug}`}
            target="_blank"
            className="mt-1 inline-block text-sm font-medium text-ocean-700 transition-colors duration-[140ms] hover:text-aqua-600"
          >
            Ver página pública ↗
          </Link>
        </div>

        <BotaoExcluir id={boat.id} nome={label} tipo="modelo" action={deleteBoat} />
      </div>

      {(saved || created) && (
        <Notice>{created ? 'Modelo criado com sucesso.' : 'Alterações salvas.'}</Notice>
      )}

      <div className="mt-8">
        <BoatForm
          action={updateBoat}
          values={toFormValues(boat)}
          families={families.map((f) => f.name)}
          submitLabel="Salvar alterações"
        />
      </div>
    </>
  )
}
