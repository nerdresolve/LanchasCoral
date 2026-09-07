import type { ListingFormValues } from '@/components/admin/ListingForm'

type ListingWithRelations = {
  id: string
  slug: string
  title: string
  brand: string | null
  kind: string
  year: number | null
  priceBrl: number | null
  sizeFt: number | null
  fuel: string | null
  hullType: string | null
  engine: string | null
  engineType: string | null
  capacity: string | null
  hours: string | null
  place: string | null
  tag: string | null
  description: string | null
  heroImage: string | null
  sourceUrl: string | null
  published: boolean
  sold: boolean
  order: number
  images: { url: string; alt: string | null }[]
  accessories: { text: string }[]
}

export function toListingFormValues(l: ListingWithRelations): ListingFormValues {
  return {
    id: l.id,
    slug: l.slug,
    title: l.title,
    brand: l.brand,
    kind: l.kind,
    year: l.year,
    priceBrl: l.priceBrl,
    sizeFt: l.sizeFt,
    fuel: l.fuel,
    hullType: l.hullType,
    engine: l.engine,
    engineType: l.engineType,
    capacity: l.capacity,
    hours: l.hours,
    place: l.place,
    tag: l.tag,
    description: l.description,
    heroImage: l.heroImage,
    sourceUrl: l.sourceUrl,
    published: l.published,
    sold: l.sold,
    order: l.order,
    images: l.images.map((i) => ({ url: i.url, alt: i.alt ?? undefined })),
    accessories: l.accessories.map((a) => ({ text: a.text })),
  }
}

export const EMPTY_LISTING: ListingFormValues = {
  slug: '',
  title: '',
  brand: null,
  kind: 'LANCHA',
  year: null,
  priceBrl: null,
  sizeFt: null,
  fuel: null,
  hullType: null,
  engine: null,
  engineType: null,
  capacity: null,
  hours: null,
  place: null,
  tag: null,
  description: null,
  heroImage: null,
  sourceUrl: null,
  published: true,
  sold: false,
  order: 0,
  images: [],
  accessories: [],
}
