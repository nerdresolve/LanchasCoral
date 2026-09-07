import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { togglePublished } from './boat-actions'
import { meters } from '@/lib/format'
import {
  PageHeader,
  EmptyState,
  TableCard,
  StatusPill,
  Thumb,
  EditLink,
  theadCls,
  rowCls,
} from '@/components/admin/Shell'
import TableFilter from '@/components/admin/TableFilter'

export const dynamic = 'force-dynamic'

export default async function AdminBoatsPage() {
  await requireAdmin()
  const boats = await prisma.boat.findMany({
    orderBy: { order: 'asc' },
    include: { family: true, _count: { select: { images: true, equipment: true } } },
  })

  const published = boats.filter((b) => b.published).length

  return (
    <>
      <PageHeader
        title="Modelos"
        count={
          boats.length === 0
            ? 'Nenhum modelo cadastrado.'
            : `${boats.length} ${boats.length === 1 ? 'modelo' : 'modelos'} · ${published} publicados`
        }
        action={{ href: '/admin/boats/new', label: '+ Novo modelo' }}
      />

      {boats.length === 0 ? (
        <EmptyState
          title="Nenhum modelo cadastrado ainda"
          description="Cadastre o primeiro modelo. Ele aparece em /modelos e no menu do site assim que for publicado com uma família definida."
          action={{ href: '/admin/boats/new', label: '+ Novo modelo' }}
        />
      ) : (
        <TableFilter
          noun={boats.length === 1 ? 'modelo' : 'modelos'}
          total={boats.length}
          placeholder="Buscar por nome, família ou endereço…"
        >
          <TableCard>
            <table className="w-full min-w-[720px] text-sm">
              <thead className={theadCls}>
                <tr>
                  <th scope="col" className="px-5 py-3">Modelo</th>
                  <th scope="col" className="px-5 py-3">Família</th>
                  <th scope="col" className="px-5 py-3 text-right">Compr.</th>
                  <th scope="col" className="px-5 py-3 text-right">Mídia</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3 text-right">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {boats.map((b) => {
                  const label = [b.name, b.variant].filter(Boolean).join(' – ')
                  return (
                    <tr
                      key={b.id}
                      className={rowCls}
                      data-search={`${label} ${b.family?.name ?? ''} ${b.slug}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb>
                            {b.heroImage && (
                              <Image src={b.heroImage} alt="" fill sizes="56px" className="object-cover" />
                            )}
                          </Thumb>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[var(--text-strong)]">{label}</p>
                            <p className="truncate font-mono text-xs text-[var(--text-muted)]">
                              /modelos/{b.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[var(--color-text-body)]">
                        {b.family?.name ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-[var(--color-text-body)]">
                        {meters(b.lengthM) ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-[var(--text-muted)]">
                        {b._count.images} fotos · {b._count.equipment} itens
                      </td>
                      <td className="px-5 py-3">
                        <form action={togglePublished}>
                          <input type="hidden" name="id" value={b.id} />
                          <button
                            title={
                              b.published
                                ? 'Publicado. Clique para voltar a rascunho'
                                : 'Rascunho. Clique para publicar'
                            }
                          >
                            <StatusPill published={b.published} />
                          </button>
                        </form>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <EditLink href={`/admin/boats/${b.slug}`} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableCard>
        </TableFilter>
      )}
    </>
  )
}
