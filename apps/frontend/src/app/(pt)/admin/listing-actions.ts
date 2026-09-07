'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { parseListingForm, type ListingInput } from '@/lib/listing-schema'
import { travarRegistro } from '@/lib/trava'

export type ActionState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined

/**
 * Revalida todas as superfícies onde um seminovo aparece.
 *
 * As páginas de detalhe entram aqui, e não só as listagens: `/broker/[slug]`
 * e `/en/broker/[slug]` são pré-renderizadas por `generateStaticParams`, então
 * sem esta chamada o anúncio ficava com preço velho — ou continuava à venda
 * depois de vendido — até o próximo build.
 *
 * Aceita mais de um slug porque, ao renomear, a página antiga também precisa
 * ser derrubada.
 */
function revalidateListing(...slugs: (string | undefined)[]) {
  revalidatePath('/admin/listings')
  revalidatePath('/broker')
  revalidatePath('/en/broker')
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/broker/${slug}`)
    revalidatePath(`/en/broker/${slug}`)
  }
}

/** Colunas compartilhadas por criação e edição. */
function scalars(d: ListingInput) {
  return {
    title: d.title,
    brand: d.brand ?? null,
    kind: d.kind,
    year: d.year ?? null,
    priceBrl: d.priceBrl ?? null,
    sizeFt: d.sizeFt ?? null,
    fuel: d.fuel ?? null,
    hullType: d.hullType ?? null,
    engine: d.engine ?? null,
    engineType: d.engineType ?? null,
    capacity: d.capacity ?? null,
    hours: d.hours ?? null,
    place: d.place ?? null,
    tag: d.tag ?? null,
    description: d.description ?? null,
    heroImage: d.heroImage ?? d.images[0]?.url ?? null,
    sourceUrl: d.sourceUrl ?? null,
    published: d.published,
    sold: d.sold,
    order: d.order,
  }
}

export async function createListing(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const parsed = parseListingForm(fd)
  if (!parsed.success) {
    return { error: 'Verifique os campos.', fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }
  const d = parsed.data

  if (await prisma.listing.findUnique({ where: { slug: d.slug } })) {
    return { error: 'Já existe um anúncio com esse endereço de página.', fieldErrors: { slug: ['Endereço em uso por outro anúncio.'] } }
  }

  await prisma.listing.create({
    data: {
      slug: d.slug,
      ...scalars(d),
      images: { create: d.images.map((im, order) => ({ url: im.url, alt: im.alt ?? null, order })) },
      accessories: { create: d.accessories.map((a, order) => ({ text: a.text, order })) },
    },
  })

  revalidateListing(d.slug)
  redirect(`/admin/listings/${d.slug}?created=1`)
}

export async function updateListing(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = String(fd.get('id') ?? '')
  if (!id) return { error: 'Anúncio não encontrado.' }

  const parsed = parseListingForm(fd)
  if (!parsed.success) {
    return { error: 'Verifique os campos.', fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }
  const d = parsed.data

  const existing = await prisma.listing.findUnique({ where: { id } })
  if (!existing) return { error: 'Anúncio não encontrado.' }

  const clash = await prisma.listing.findUnique({ where: { slug: d.slug } })
  if (clash && clash.id !== id) {
    return { error: 'Já existe um anúncio com esse endereço de página.', fieldErrors: { slug: ['Endereço em uso por outro anúncio.'] } }
  }

  /*
   * Os filhos são substituídos por completo para aplicar ordem e remoções.
   *
   * A trava vem antes de tudo, pelo mesmo motivo do formulário de modelos:
   * duas gravações simultâneas do mesmo anúncio duplicavam a galeria em vez
   * de uma sobrescrever a outra. Ver `src/lib/trava.ts`.
   */
  await prisma.$transaction(async (tx) => {
    await travarRegistro(tx, 'Listing', id)

    await tx.listingImage.deleteMany({ where: { listingId: id } })
    await tx.listingAccessory.deleteMany({ where: { listingId: id } })
    await tx.listing.update({
      where: { id },
      data: {
        slug: d.slug,
        ...scalars(d),
        images: { create: d.images.map((im, order) => ({ url: im.url, alt: im.alt ?? null, order })) },
        accessories: { create: d.accessories.map((a, order) => ({ text: a.text, order })) },
      },
    })
  })

  // O slug antigo entra junto: ao renomear, a página anterior continuaria
  // no ar com o conteúdo velho.
  revalidateListing(d.slug, existing.slug)
  redirect(`/admin/listings/${d.slug}?saved=1`)
}

export async function deleteListing(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id') ?? '')
  if (!id) return
  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) return
  // Imagens e acessórios caem em cascata pela relação no schema.
  await prisma.listing.delete({ where: { id } })
  revalidateListing(listing.slug)
  redirect('/admin/listings?deleted=1')
}

export async function toggleListingPublished(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id') ?? '')
  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) return
  await prisma.listing.update({ where: { id }, data: { published: !listing.published } })
  revalidateListing(listing.slug)
}
