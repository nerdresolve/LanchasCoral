import { prisma } from './prisma'
import { toNum } from './format'

/**
 * Famílias do menu, com os modelos publicados de cada uma.
 *
 * O `where` descarta família sem nenhum modelo publicado. Sem ele, uma família
 * criada por engano (ou que ficou órfã depois que o último modelo dela foi
 * apagado) virava um item vazio no menu e ainda vazava no HTML entregue ao
 * visitante, junto dos dados que o React usa para hidratar a página.
 */
export async function getNavFamilies() {
  return prisma.family.findMany({
    where: { boats: { some: { published: true } } },
    orderBy: { order: 'asc' },
    include: {
      boats: {
        where: { published: true },
        orderBy: { order: 'asc' },
        select: { slug: true, name: true, variant: true },
      },
    },
  })
}

export async function getBoats() {
  return prisma.boat.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
    include: { family: true, images: { orderBy: { order: 'asc' }, take: 1 } },
  })
}

export async function getBoatBySlug(slug: string) {
  return prisma.boat.findUnique({
    where: { slug },
    include: {
      family: true,
      images: { orderBy: { order: 'asc' } },
      equipment: { orderBy: [{ panel: 'asc' }, { order: 'asc' }] },
    },
  })
}

export async function getBoatSlugs() {
  return prisma.boat.findMany({ where: { published: true }, select: { slug: true } })
}

/** Display label: "Coral 36 – Cabinada". */
export const boatLabel = (b: { name: string; variant?: string | null }) =>
  [b.name, b.variant].filter(Boolean).join(' – ')

/**
 * Families with their published boats, including the fields the line-up cards
 * render. Powers the /modelos page, which groups by family.
 */
export async function getFamiliesWithBoats() {
  return prisma.family.findMany({
    // Mesma razão de `getNavFamilies`: família sem modelo publicado não
    // rende seção nenhuma na página, só um título solto.
    where: { boats: { some: { published: true } } },
    orderBy: { order: 'asc' },
    include: {
      boats: {
        where: { published: true },
        orderBy: { order: 'asc' },
        include: { images: { orderBy: { order: 'asc' }, take: 1 } },
      },
    },
  })
}

/**
 * "Modelos próximos": the boats nearest in hull length, same family first.
 * Falls back to catalogue order for boats with no length recorded.
 */
export async function getSiblingBoats(
  boat: { id: string; familyId: string | null; lengthM: unknown },
  take = 3,
) {
  const others = await prisma.boat.findMany({
    where: { published: true, id: { not: boat.id } },
    orderBy: { order: 'asc' },
    include: { images: { orderBy: { order: 'asc' }, take: 1 } },
  })

  const len = toNum(boat.lengthM as never)

  return others
    .map((b) => {
      const bLen = toNum(b.lengthM as never)
      return {
        boat: b,
        sameFamily: boat.familyId !== null && b.familyId === boat.familyId,
        // Unknown lengths sort last rather than pretending to be a perfect match.
        distance: len !== null && bLen !== null ? Math.abs(bLen - len) : Number.POSITIVE_INFINITY,
      }
    })
    .sort((a, b) =>
      a.sameFamily !== b.sameFamily ? Number(b.sameFamily) - Number(a.sameFamily) : a.distance - b.distance,
    )
    .slice(0, take)
    .map((x) => x.boat)
}

/**
 * Resolve os campos de texto de um barco para o idioma pedido.
 * Campos *En vazios caem no português — assim o site em inglês nunca
 * fica com buraco enquanto a tradução do catálogo não é preenchida.
 */
export function localizeBoat<
  T extends {
    variant: string | null
    variantEn?: string | null
    tagline: string | null
    taglineEn?: string | null
    description: string | null
    descriptionEn?: string | null
  },
>(boat: T, locale: 'pt' | 'en') {
  if (locale === 'pt') return boat
  return {
    ...boat,
    variant: boat.variantEn?.trim() || boat.variant,
    tagline: boat.taglineEn?.trim() || boat.tagline,
    description: boat.descriptionEn?.trim() || boat.description,
  }
}

/** Idem para um item de equipamento. */
export function localizeEquipment<T extends { text: string; textEn?: string | null }>(
  item: T,
  locale: 'pt' | 'en',
) {
  return locale === 'en' && item.textEn?.trim() ? { ...item, text: item.textEn } : item
}

/* ---------------- Coral Broker: seminovos ---------------- */

/** Anúncios publicados, na ordem definida no admin. */
export async function getListings() {
  return prisma.listing.findMany({
    where: { published: true },
    orderBy: [{ sold: 'asc' }, { order: 'asc' }],
    include: { images: { orderBy: { order: 'asc' }, take: 1 } },
  })
}

export async function getListingBySlug(slug: string) {
  return prisma.listing.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { order: 'asc' } },
      accessories: { orderBy: { order: 'asc' } },
    },
  })
}

export async function getListingSlugs() {
  return prisma.listing.findMany({ where: { published: true }, select: { slug: true } })
}

/** Outros anúncios, para o rodapé da página de detalhe. */
export async function getRelatedListings(id: string, take = 3) {
  return prisma.listing.findMany({
    where: { published: true, sold: false, id: { not: id } },
    orderBy: { order: 'asc' },
    take,
    include: { images: { orderBy: { order: 'asc' }, take: 1 } },
  })
}

/** Valores presentes no estoque, para montar os filtros sem hardcode. */
export async function getListingFacets() {
  const rows = await prisma.listing.findMany({
    where: { published: true },
    select: { brand: true, year: true, sizeFt: true, kind: true, engineType: true },
  })
  const uniq = <T,>(xs: (T | null)[]) => [...new Set(xs.filter((x): x is T => x != null))]
  return {
    brands: uniq(rows.map((r) => r.brand)).sort(),
    years: uniq(rows.map((r) => r.year)).sort((a, b) => b - a),
    sizes: uniq(rows.map((r) => r.sizeFt)).sort((a, b) => a - b),
    kinds: uniq(rows.map((r) => r.kind)).sort(),
    engineTypes: uniq(rows.map((r) => r.engineType)).sort(),
  }
}

/* ---------- Artigos (/dicas) ---------- */

export async function getArticles() {
  return prisma.article.findMany({
    where: { published: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function getArticle(slug: string) {
  return prisma.article.findFirst({ where: { slug, published: true } })
}

/** Escolhe o idioma do artigo; campos vazios caem no português. */
export function localizeArticle<T extends {
  title: string; excerpt: string | null; body: string[]
  titleEn: string | null; excerptEn: string | null; bodyEn: string[]
}>(a: T, locale: 'pt' | 'en') {
  if (locale === 'pt') return { ...a, title: a.title, excerpt: a.excerpt, body: a.body }
  return {
    ...a,
    title: a.titleEn || a.title,
    excerpt: a.excerptEn || a.excerpt,
    body: a.bodyEn.length ? a.bodyEn : a.body,
  }
}

/**
 * Modelos que podem ter o memorial descritivo solicitado.
 *
 * Filtra por `published` e por ter `manualUrl`: um modelo fora de linha, ou
 * cujo memorial ainda não foi anexado, não deve aparecer na lista — o
 * visitante pediria um arquivo que ninguém tem para enviar.
 */
export async function getModelosComMemorial() {
  const boats = await prisma.boat.findMany({
    where: { published: true, manualUrl: { not: null } },
    orderBy: [{ family: { order: 'asc' } }, { order: 'asc' }],
    select: { slug: true, name: true, variant: true, manualUrl: true },
  })
  return boats.map((b) => ({
    slug: b.slug,
    label: b.variant ? `${b.name} ${b.variant}` : b.name,
    manualUrl: b.manualUrl!,
  }))
}
