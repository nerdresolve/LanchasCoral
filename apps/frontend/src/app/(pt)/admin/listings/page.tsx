import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { toggleListingPublished } from '../listing-actions'
import {
  PageHeader,
  EmptyState,
  Notice,
  TableCard,
  StatusPill,
  Thumb,
  EditLink,
  theadCls,
  rowCls,
} from '@/components/admin/Shell'
import TableFilter from '@/components/admin/TableFilter'

export const dynamic = 'force-dynamic'

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const KIND_LABEL: Record<string, string> = { LANCHA: 'Lancha', JETSKI: 'Jet ski' }

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>
}) {
  await requireAdmin()
  const { deleted } = await searchParams

  const listings = await prisma.listing.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { images: true, accessories: true } } },
  })

  const published = listings.filter((l) => l.published).length

  return (
    <>
      <PageHeader
        title="Seminovos"
        count={
          listings.length === 0
            ? 'Nenhum anúncio cadastrado.'
            : `${listings.length} ${listings.length === 1 ? 'anúncio' : 'anúncios'} · ${published} publicados`
        }
        action={{ href: '/admin/listings/new', label: '+ Novo anúncio' }}
      />

      {deleted && <Notice>Anúncio excluído.</Notice>}

      {listings.length === 0 ? (
        <EmptyState
          title="Nenhum anúncio cadastrado ainda"
          description="Cadastre o primeiro seminovo. Ele aparece em /broker assim que for publicado."
          action={{ href: '/admin/listings/new', label: '+ Novo anúncio' }}
        />
      ) : (
        <TableFilter
          noun={listings.length === 1 ? 'anúncio' : 'anúncios'}
          total={listings.length}
          placeholder="Buscar por título, tipo, ano ou endereço…"
        >
          <TableCard>
            <table className="w-full min-w-[820px] text-sm">
              <thead className={theadCls}>
                <tr>
                  <th scope="col" className="px-5 py-3">Anúncio</th>
                  <th scope="col" className="px-5 py-3">Tipo</th>
                  <th scope="col" className="px-5 py-3 text-right">Ano</th>
                  <th scope="col" className="px-5 py-3 text-right">Preço</th>
                  <th scope="col" className="px-5 py-3 text-right">Mídia</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3 text-right">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {listings.map((l) => (
                  <tr
                    key={l.id}
                    className={rowCls}
                    data-search={`${l.title} ${KIND_LABEL[l.kind] ?? l.kind} ${l.year ?? ''} ${l.slug}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb>
                          {l.heroImage && (
                            <Image src={l.heroImage} alt="" fill sizes="56px" className="object-cover" />
                          )}
                        </Thumb>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--text-strong)]">{l.title}</p>
                          <p className="truncate font-mono text-xs text-[var(--text-muted)]">
                            /broker/{l.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[var(--color-text-body)]">
                      {KIND_LABEL[l.kind] ?? l.kind}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-[var(--color-text-body)]">
                      {l.year ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium text-[var(--text-strong)]">
                      {l.priceBrl === null ? '—' : brl.format(l.priceBrl)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-[var(--text-muted)]">
                      {l._count.images} fotos · {l._count.accessories} itens
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <form action={toggleListingPublished}>
                          <input type="hidden" name="id" value={l.id} />
                          <button
                            title={
                              l.published
                                ? 'Publicado. Clique para voltar a rascunho'
                                : 'Rascunho. Clique para publicar'
                            }
                          >
                            <StatusPill published={l.published} />
                          </button>
                        </form>
                        {l.sold && (
                          <span className="rounded-[var(--radius-pill)] bg-warning-500/15 px-2.5 py-1 text-xs font-semibold text-warning-500">
                            Vendido
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <EditLink href={`/admin/listings/${l.slug}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </TableFilter>
      )}
    </>
  )
}
