/**
 * Importa prisma/data/listings.raw.json (scrape do Coral Broker) para o banco.
 * Idempotente: reexecutar atualiza os anúncios existentes pelo slug.
 *
 * Uso: npx tsx prisma/seed-listings.ts
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { prisma } from '../src/lib/prisma'

type Raw = {
  slug: string
  url?: string
  title?: string
  priceBrl?: number | null
  specs?: { label: string; value: string }[]
  accessories?: string[]
  description?: string | null
  images?: string[]
  error?: string
}

const spec = (r: Raw, label: string) =>
  r.specs?.find((s) => s.label.toLowerCase() === label.toLowerCase())?.value ?? null

/** "Coral 40A FULL [2024]" -> 2024 */
const yearFrom = (r: Raw): number | null => {
  // O título é a fonte preferida: em alguns anúncios o campo "Ano de
  // Fabricação" diverge do ano exibido no título (ex.: Coral 41 HT [2020]).
  const m = r.title?.match(/\[(\d{4})\]|\((\d{4})\)/)
  const fromTitle = Number(m?.[1] ?? m?.[2])
  if (Number.isFinite(fromTitle)) return fromTitle
  const fromSpec = spec(r, 'Ano de Fabricação')
  const n = fromSpec ? Number(fromSpec.match(/\d{4}/)?.[0]) : NaN
  return Number.isFinite(n) ? n : null
}

/** Marca a partir do título, para os filtros da listagem. */
const brandFrom = (title = ''): string | null => {
  const t = title.toLowerCase()
  if (/sea\s*doo|seadoo/.test(t)) return 'Sea-Doo'
  if (/\bcoral\b/.test(t)) return 'Coral'
  if (/\breal\b/.test(t)) return 'Real'
  if (/\btriton\b/.test(t)) return 'Triton'
  if (/\bsolara\b/.test(t)) return 'Solara'
  return null
}

/** Jet ski vs lancha. Cobre "JET SKI", "Jet Sea Doo", "RTX-X", "GT R". */
const kindFrom = (title = ''): string =>
  /jet\s*ski|jetski|\bjet\b|\br[xt]t-?x?\b|\bgt ?r\b/i.test(title) ? 'JETSKI' : 'LANCHA'

const sizeFrom = (r: Raw): number | null => {
  const v = spec(r, 'Tamanho')
  const n = Number(v?.match(/\d{1,3}/)?.[0])
  return Number.isFinite(n) ? n : null
}

/** Extrai motorização/capacidade/horas do texto livre da descrição. */
function fromDescription(desc: string | null | undefined) {
  const d = desc ?? ''
  const grab = (re: RegExp) => d.match(re)?.[1]?.trim() ?? null
  return {
    engine: grab(/Motoriza[çc][ãa]o:\s*(.+)/i),
    capacity: grab(/Capacidade:\s*(.+)/i),
    hours: grab(/Horas?:\s*(.+)/i),
  }
}

async function main() {
  const file = path.join(import.meta.dirname, 'data', 'listings.raw.json')
  const raw: Raw[] = JSON.parse(fs.readFileSync(file, 'utf8'))
  const usable = raw.filter((r) => !r.error && r.title)
  console.log(`lendo ${raw.length} registros (${usable.length} utilizáveis)`)

  let created = 0
  let updated = 0

  for (const [i, r] of usable.entries()) {
    const meta = fromDescription(r.description)
    const images = (r.images ?? []).filter(Boolean)

    const data = {
      title: r.title!.trim(),
      brand: brandFrom(r.title),
      kind: kindFrom(r.title),
      year: yearFrom(r),
      priceBrl: r.priceBrl ?? null,
      sizeFt: sizeFrom(r),
      fuel: spec(r, 'Combustível'),
      hullType: spec(r, 'Tipo de Casco'),
      engine: meta.engine ?? spec(r, 'Motorização'),
      capacity: meta.capacity ?? spec(r, 'Capacidade'),
      hours: meta.hours ?? spec(r, 'Horas'),
      description: r.description ?? null,
      heroImage: images[0] ?? null,
      sourceUrl: r.url ?? null,
      order: i,
    }

    const existing = await prisma.listing.findUnique({ where: { slug: r.slug } })

    if (existing) {
      await prisma.listing.update({ where: { slug: r.slug }, data })
      // Regrava as coleções para refletir o estado atual da origem.
      await prisma.listingImage.deleteMany({ where: { listingId: existing.id } })
      await prisma.listingAccessory.deleteMany({ where: { listingId: existing.id } })
      updated++
    } else {
      await prisma.listing.create({ data: { ...data, slug: r.slug } })
      created++
    }

    const listing = await prisma.listing.findUniqueOrThrow({ where: { slug: r.slug } })

    if (images.length) {
      await prisma.listingImage.createMany({
        data: images.map((url, order) => ({ listingId: listing.id, url, order })),
      })
    }
    if (r.accessories?.length) {
      await prisma.listingAccessory.createMany({
        data: r.accessories.map((text, order) => ({ listingId: listing.id, text, order })),
      })
    }
  }

  const total = await prisma.listing.count()
  const imgs = await prisma.listingImage.count()
  const acc = await prisma.listingAccessory.count()
  console.log(`\ncriados ${created} | atualizados ${updated}`)
  console.log(`banco -> anúncios ${total} | fotos ${imgs} | acessórios ${acc}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('ERRO:', e)
    process.exit(1)
  })
