/**
 * Scraper das páginas de modelo em mariath.dev (versão de referência).
 *
 * Serve para conferir se aquela versão tem fotos que o scrape do site
 * oficial não trouxe. Gera prisma/data/mariath.raw.json.
 *
 * Uso: node prisma/data/scrape-mariath.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const BASE = 'https://mariath.dev/lanchascoral-home/lanchascoral-modelos'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36'
const OUT = path.join(import.meta.dirname, 'mariath.raw.json')

/** slug em mariath.dev -> slug no nosso banco */
const MAP = {
  'lanchascoral-coral16': 'coral-16',
  'lanchascoral-coral21': 'coral-21-2',
  'lanchascoral-coral23': 'coral-23',
  'lanchascoral-coral26': 'coral-26',
  'lanchascoral-coral26-blackline': 'coral-26-blackline',
  'lanchascoral-coral29a': 'coral-29-aberta',
  'lanchascoral-coral29c': 'coral-29-cabinada',
  'lanchascoral-coral30c': 'coral-30-cabinada',
  'lanchascoral-coral32apopa': 'coral-32-aberta',
  'lanchascoral-coral32cpopa': 'coral-32-cabinada',
  'lanchascoral-coral33a': 'coral-33-aberta',
  'lanchascoral-coral33c': 'coral-33-cabinada',
  'lanchascoral-coral36a': 'coral-36-aberta',
  'lanchascoral-coral36c': 'coral-36-cabinada',
  'lanchascoral-coral40a': 'coral-40',
  'lanchascoral-coral42ht': 'coral-42-2',
  'lanchascoral-coral50fly': 'coral-50-ht-2',
  'lanchascoral-coral50ht': 'coral-50-ht',
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function get(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (err) {
      if (i === tries) throw err
      await sleep(1200 * i)
    }
  }
}

/** Fotos do conteúdo, sem assets de tema e sem sufixo de thumbnail. */
function images(html) {
  const out = new Set()
  const re = /https:\/\/mariath\.dev\/wp-content\/uploads\/[^\s"')]+\.(?:jpe?g|png|webp)/gi
  for (const m of html.matchAll(re)) {
    const u = m[0]
    if (/logo|icon|favicon|cropped|placeholder|avatar/i.test(u)) continue
    out.add(u.replace(/-\d{2,4}x\d{2,4}(?=\.(?:jpe?g|png|webp))/i, ''))
  }
  return [...out]
}

async function main() {
  const slugs = Object.keys(MAP)
  console.log(`Buscando ${slugs.length} páginas de modelo…`)
  const out = []

  for (const [i, src] of slugs.entries()) {
    process.stdout.write(`  [${i + 1}/${slugs.length}] ${src} … `)
    try {
      const html = await get(`${BASE}/${src}/`)
      const imgs = images(html)
      out.push({ source: src, slug: MAP[src], images: imgs })
      console.log(`${imgs.length} fotos`)
    } catch (err) {
      console.log('FALHOU:', err.message)
      out.push({ source: src, slug: MAP[src], images: [], error: String(err.message) })
    }
    await sleep(600)
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8')
  console.log(`\nGravado ${OUT}`)
  console.log(`  total de fotos: ${out.reduce((n, r) => n + r.images.length, 0)}`)
}

main().catch((e) => {
  console.error('ERRO:', e)
  process.exit(1)
})
