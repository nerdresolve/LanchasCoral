import type { BoatFormValues } from '@/components/admin/BoatForm'

/** Decimal columns arrive as Prisma Decimal; forms need plain strings. */
const dec = (v: unknown): string | null =>
  v === null || v === undefined ? null : String(v)

type PerfRow = { label: string; fuel?: string | null; cruiseLh?: number | null; avgLh?: number | null }

type BoatWithRelations = {
  id: string
  slug: string
  name: string
  variant: string | null
  tagline: string | null
  description: string | null
  variantEn: string | null
  taglineEn: string | null
  descriptionEn: string | null
  family: { name: string } | null
  lengthM: unknown
  beamM: unknown
  draftM: unknown
  depthM: unknown
  cabinHeightM: unknown
  weightKg: number | null
  engineWeightKg: number | null
  fuelL: number | null
  waterL: number | null
  powerMinHp: number | null
  powerMaxHp: number | null
  capInteriorDay: number | null
  capInteriorNight: number | null
  capOpenSeaDay: number | null
  capOpenSeaNight: number | null
  performance: unknown
  published: boolean
  order: number
  heroImage: string | null
  heroVideo: string | null
  manualUrl: string | null
  seoTitle: string | null
  seoDescription: string | null
  images: { url: string; alt: string | null }[]
  equipment: { panel: string; text: string; textEn: string | null }[]
}

export function toFormValues(b: BoatWithRelations): BoatFormValues {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    variant: b.variant,
    familyName: b.family?.name ?? null,
    tagline: b.tagline,
    description: b.description,
    variantEn: b.variantEn,
    taglineEn: b.taglineEn,
    descriptionEn: b.descriptionEn,
    lengthM: dec(b.lengthM),
    beamM: dec(b.beamM),
    draftM: dec(b.draftM),
    depthM: dec(b.depthM),
    cabinHeightM: dec(b.cabinHeightM),
    weightKg: b.weightKg,
    engineWeightKg: b.engineWeightKg,
    fuelL: b.fuelL,
    waterL: b.waterL,
    powerMinHp: b.powerMinHp,
    powerMaxHp: b.powerMaxHp,
    capInteriorDay: b.capInteriorDay,
    capInteriorNight: b.capInteriorNight,
    capOpenSeaDay: b.capOpenSeaDay,
    capOpenSeaNight: b.capOpenSeaNight,
    published: b.published,
    order: b.order,
    heroImage: b.heroImage,
    heroVideo: b.heroVideo,
    manualUrl: b.manualUrl,
    seoTitle: b.seoTitle,
    seoDescription: b.seoDescription,
    images: b.images.map((i) => ({ url: i.url, alt: i.alt ?? undefined })),
    equipment: b.equipment.map((e) => ({ panel: e.panel, text: e.text, textEn: e.textEn ?? '' })),
    performance: (Array.isArray(b.performance) ? b.performance : []) as PerfRow[],
  }
}

export const emptyFormValues: BoatFormValues = {
  slug: '',
  name: '',
  variant: null,
  familyName: null,
  tagline: null,
  description: null,
  variantEn: null,
  taglineEn: null,
  descriptionEn: null,
  lengthM: null,
  beamM: null,
  draftM: null,
  depthM: null,
  cabinHeightM: null,
  weightKg: null,
  engineWeightKg: null,
  fuelL: null,
  waterL: null,
  powerMinHp: null,
  powerMaxHp: null,
  capInteriorDay: null,
  capInteriorNight: null,
  capOpenSeaDay: null,
  capOpenSeaNight: null,
  published: true,
  order: 0,
  heroImage: null,
  heroVideo: null,
  manualUrl: null,
  seoTitle: null,
  seoDescription: null,
  images: [],
  equipment: [],
  performance: [],
}
