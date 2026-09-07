/**
 * Scraper do Coral Broker (broker.lanchascoral.com.br).
 *
 * Percorre a listagem, abre cada anúncio e extrai título, preço, specs,
 * acessórios, descrição e galeria. Gera prisma/data/listings.raw.json.
 *
 * Uso: node prisma/data/scrape-broker.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const BASE = 'https://broker.lanchascoral.com.br'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36'
const OUT = path.join(import.meta.dirname, 'listings.raw.json')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function get(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (err) {
      if (i === tries) throw err
      await sleep(1200 * i)
    }
  }
}

/* ---------- helpers de texto ---------- */

const ENT = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '&#39;': "'",
  '&nbsp;': ' ', '&ndash;': '–', '&mdash;': '—', '&hellip;': '…',
}
const decode = (s = '') =>
  s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&[a-z]+;/gi, (m) => ENT[m] ?? m)

const strip = (html = '') =>
  decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|tr|h\d)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

/** Texto da página em uma única linha, para casar pares label/valor. */
const flatten = (html) => strip(html).replace(/\s+/g, ' ')

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/* ---------- extração ---------- */

function listingUrls(html) {
  const urls = new Set()
  const re = /href="(https?:\/\/broker\.lanchascoral\.com\.br\/listings\/[^"#?]+)"/gi
  for (const m of html.matchAll(re)) urls.add(m[1].replace(/\/$/, '') + '/')
  return [...urls]
}

function parsePrice(html) {
  const flat = flatten(html)
  // O tema grava o preço como número puro: "Preço 1990000".
  const raw = flat.match(/Pre[çc]o\s+(\d{4,9})\b/i)
  if (raw) return Number(raw[1])
  // Fallback: "R$1 990 000" — o separador é espaço, não ponto.
  const m = flat.match(/R\$\s*(\d[\d .]{3,})/)
  if (!m) return null
  const n = Number(m[1].replace(/[ .]/g, ''))
  return Number.isFinite(n) ? n : null
}

/** Rótulos de especificação usados pelo tema do broker. */
const SPEC_LABELS = [
  'Tamanho',
  'Ano de Fabricação',
  'Combustível',
  'Tipo de Casco',
  'Tipo do Motor',
  'Motorização',
  'Capacidade',
  'Horas',
  'Marca',
]

/** Termos que encerram o valor de uma spec. */
const STOP = [...SPEC_LABELS, 'Preço', 'Descrição', 'Equipamentos', 'Fotos', 'Negociar']

function parseSpecs(html) {
  const flat = flatten(html)
  const stop = STOP.map(escRe).join('|')
  const rows = []
  for (const label of SPEC_LABELS) {
    const re = new RegExp(`${escRe(label)}\\s+(.+?)(?=\\s+(?:${stop})\\b|$)`, 'i')
    const m = flat.match(re)
    if (!m) continue
    const value = m[1].trim()
    if (value && value.length <= 200) rows.push({ label, value })
  }
  return rows
}

function parseImages(html) {
  const urls = new Set()
  const push = (u) => {
    if (!u || !/\.(jpe?g|png|webp)(\?|$)/i.test(u)) return
    if (/logo|icon|favicon|placeholder|avatar|sprite/i.test(u)) return
    // Descarta assets de tema/plugin (bandeiras do gtranslate, etc.);
    // as fotos dos anúncios ficam sempre sob wp-content/uploads.
    if (!/\/wp-content\/uploads\//i.test(u)) return
    // Descarta o sufixo de thumbnail do WordPress (-300x200) para pegar o original.
    urls.add(u.replace(/-\d{2,4}x\d{2,4}(?=\.(?:jpe?g|png|webp))/i, ''))
  }
  for (const m of html.matchAll(/<img[^>]+src="([^"]+)"/gi)) push(decode(m[1]))
  for (const m of html.matchAll(/<a[^>]+href="([^"]+\.(?:jpe?g|png|webp))"/gi)) push(decode(m[1]))
  for (const m of html.matchAll(/data-(?:src|large_image|full)="([^"]+)"/gi)) push(decode(m[1]))
  for (const m of html.matchAll(/srcset="([^"]+)"/gi)) {
    for (const part of decode(m[1]).split(',')) push(part.trim().split(/\s+/)[0])
  }
  return [...urls]
}

function parseTitle(html) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (h1) return strip(h1[1])
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return t ? strip(t[1]).replace(/\s*[|–-]\s*.*$/, '') : ''
}

const UI_NOISE = /^(fotos|negociar|descri[çc][ãa]o|equipamentos de s[ée]rie|compartilhar|voltar|an[úu]ncios|home|contato|menu|buscar)$/i

function parseAccessories(html) {
  const idx = html.search(/acess[óo]rios|equipamentos|itens\s+inclu/i)
  if (idx < 0) return []
  const chunk = html.slice(idx, idx + 12000)
  const items = [...chunk.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => strip(m[1]))
    .filter((t) => t && t.length > 2 && t.length < 120)
    .filter((t) => !/^https?:/i.test(t) && !UI_NOISE.test(t))
  return [...new Set(items)]
}

function parseDescription(html, title) {
  const blocks = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => strip(m[1]))
    .filter((t) => t.length > 60)
    .filter((t) => !/cookie|política de privacidade|todos os direitos/i.test(t))
    .filter((t) => t !== title)
  return blocks.slice(0, 6).join('\n\n') || null
}

/* ---------- main ---------- */

async function main() {
  console.log('Buscando listagem…')
  const home = await get(BASE + '/')
  const urls = listingUrls(home)
  console.log(`  ${urls.length} anúncios encontrados`)

  const out = []
  for (const [i, url] of urls.entries()) {
    const slug = url.replace(/\/$/, '').split('/').pop()
    process.stdout.write(`  [${i + 1}/${urls.length}] ${slug} … `)
    try {
      const html = await get(url)
      const title = parseTitle(html)
      const rec = {
        slug,
        url,
        title,
        priceBrl: parsePrice(html),
        specs: parseSpecs(html),
        accessories: parseAccessories(html),
        description: parseDescription(html, title),
        images: parseImages(html),
      }
      out.push(rec)
      console.log(
        `ok (R$ ${rec.priceBrl ?? '?'}, specs ${rec.specs.length}, fotos ${rec.images.length}, acess ${rec.accessories.length})`,
      )
    } catch (err) {
      console.log('FALHOU:', err.message)
      out.push({ slug, url, error: String(err.message) })
    }
    await sleep(700) // educado com o servidor de origem
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8')
  console.log(`\nGravado ${OUT}`)
  console.log(`  anúncios: ${out.length}`)
  console.log(`  fotos totais: ${out.reduce((n, r) => n + (r.images?.length ?? 0), 0)}`)
}

main().catch((e) => {
  console.error('ERRO:', e)
  process.exit(1)
})
