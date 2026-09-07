/*
 * Passa TODO o conteúdo já gravado pelas regras de validação novas.
 *
 * O risco que isto cobre: um schema mais rígido pode recusar dados que já
 * estavam no banco, e aí o operador abre um modelo antigo, clica em salvar
 * sem mudar nada, e leva um erro que não sabe explicar.
 *
 *   npx tsx audit/_valida-banco.mjs
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { boatSchema } from '../src/lib/boat-schema.ts'
import { listingSchema } from '../src/lib/listing-schema.ts'

const url = process.env.DATABASE_URL
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })

const num = (v) => (v === null || v === undefined ? '' : String(v))
let problemas = 0

const boats = await prisma.boat.findMany({
  include: { family: true, images: { orderBy: { order: 'asc' } }, equipment: { orderBy: { order: 'asc' } } },
})

for (const b of boats) {
  const r = boatSchema.safeParse({
    slug: b.slug, name: b.name,
    variant: b.variant ?? '', familyName: b.family?.name ?? '',
    tagline: b.tagline ?? '', description: b.description ?? '',
    variantEn: b.variantEn ?? '', taglineEn: b.taglineEn ?? '', descriptionEn: b.descriptionEn ?? '',
    lengthM: num(b.lengthM), beamM: num(b.beamM), draftM: num(b.draftM),
    depthM: num(b.depthM), cabinHeightM: num(b.cabinHeightM),
    weightKg: num(b.weightKg), engineWeightKg: num(b.engineWeightKg),
    fuelL: num(b.fuelL), waterL: num(b.waterL),
    powerMinHp: num(b.powerMinHp), powerMaxHp: num(b.powerMaxHp),
    capInteriorDay: num(b.capInteriorDay), capInteriorNight: num(b.capInteriorNight),
    capOpenSeaDay: num(b.capOpenSeaDay), capOpenSeaNight: num(b.capOpenSeaNight),
    published: b.published, order: String(b.order),
    heroImage: b.heroImage ?? '', manualUrl: b.manualUrl ?? '',
    seoTitle: b.seoTitle ?? '', seoDescription: b.seoDescription ?? '',
    images: b.images.map((i) => ({ url: i.url, alt: i.alt ?? undefined })),
    equipment: b.equipment.map((e) => ({ panel: e.panel, text: e.text, textEn: e.textEn ?? undefined })),
    performance: b.performance ?? [],
  })
  if (!r.success) {
    problemas++
    console.log(`MODELO ${b.slug}`)
    for (const i of r.error.issues) console.log(`   ${i.path.join('.')}: ${i.message}`)
  }
}

const listings = await prisma.listing.findMany({
  include: { images: { orderBy: { order: 'asc' } }, accessories: { orderBy: { order: 'asc' } } },
})

for (const l of listings) {
  const r = listingSchema.safeParse({
    slug: l.slug, title: l.title, brand: l.brand ?? '', kind: l.kind,
    year: num(l.year), priceBrl: num(l.priceBrl), sizeFt: num(l.sizeFt),
    fuel: l.fuel ?? '', hullType: l.hullType ?? '', engine: l.engine ?? '',
    engineType: l.engineType ?? '',
    capacity: l.capacity ?? '', hours: l.hours ?? '', place: l.place ?? '', tag: l.tag ?? '',
    description: l.description ?? '', heroImage: l.heroImage ?? '', sourceUrl: l.sourceUrl ?? '',
    published: l.published, sold: l.sold, order: String(l.order),
    images: l.images.map((i) => ({ url: i.url, alt: i.alt ?? undefined })),
    accessories: l.accessories.map((a) => ({ text: a.text })),
  })
  if (!r.success) {
    problemas++
    console.log(`ANUNCIO ${l.slug}`)
    for (const i of r.error.issues) console.log(`   ${i.path.join('.')}: ${i.message}`)
  }
}

console.log(
  problemas === 0
    ? `\nOs ${boats.length} modelos e ${listings.length} anuncios passam pelas regras novas.`
    : `\n${problemas} registro(s) seriam recusados ao salvar.`,
)
await prisma.$disconnect()
process.exit(problemas === 0 ? 0 : 1)
