/**
 * Acrescenta as fotos das páginas de modelo do mariath.dev às galerias
 * existentes, sem remover nada do que já veio do site oficial.
 *
 * Idempotente: reexecutar não duplica (compara pela URL já gravada).
 *
 * Uso: npx tsx prisma/merge-mariath-images.ts
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { prisma } from '../src/lib/prisma'

type Row = { source: string; slug: string; images: string[]; error?: string }

/** Descarta capas de post e artes que não são fotos da embarcação. */
const isPhoto = (u: string) => !/Design-sem-nome|banner|capa|thumb/i.test(u)

async function main() {
  const file = path.join(import.meta.dirname, 'data', 'mariath.raw.json')
  const rows: Row[] = JSON.parse(fs.readFileSync(file, 'utf8'))

  let added = 0
  let skipped = 0

  for (const r of rows) {
    if (r.error) continue
    const boat = await prisma.boat.findUnique({
      where: { slug: r.slug },
      include: { images: { orderBy: { order: 'asc' } } },
    })
    if (!boat) {
      console.log(`  ! sem barco para ${r.slug}`)
      continue
    }

    const existing = new Set(boat.images.map((i) => i.url))
    const novas = r.images.filter(isPhoto).filter((u) => !existing.has(u))

    if (!novas.length) {
      skipped++
      continue
    }

    // Entram ao fim da galeria; a capa atual é preservada.
    const start = boat.images.length
    await prisma.boatImage.createMany({
      data: novas.map((url, i) => ({
        boatId: boat.id,
        url,
        alt: null,
        order: start + i,
      })),
    })

    added += novas.length
    console.log(`  ${r.slug.padEnd(22)} +${String(novas.length).padStart(3)} (tinha ${start})`)
  }

  const total = await prisma.boatImage.count()
  console.log(`\nfotos acrescentadas: ${added} | modelos sem novidade: ${skipped}`)
  console.log(`total de fotos no banco: ${total}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('ERRO:', e)
    process.exit(1)
  })
