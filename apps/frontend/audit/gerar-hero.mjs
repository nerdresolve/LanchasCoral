/**
 * Gera as variantes da fotografia do hero a partir de um original.
 *
 * Produz dois enquadramentos (paisagem e retrato) em três formatos, que o
 * <picture> de src/components/HeroImage.tsx consome. Rodar ao trocar a foto:
 *
 *   node audit/gerar-hero.mjs <caminho-ou-url-do-original>
 */
import fs from 'node:fs'
import sharp from 'sharp'

const origem = process.argv[2]
if (!origem) {
  console.error('uso: node audit/gerar-hero.mjs <arquivo-ou-url>')
  process.exit(1)
}

const bruto = origem.startsWith('http')
  ? Buffer.from(await (await fetch(origem)).arrayBuffer())
  : fs.readFileSync(origem)

const FORMATOS = [
  ['avif', { quality: 55 }],
  ['webp', { quality: 72 }],
  ['jpg', { quality: 80, mozjpeg: true }],
]

/** Deslocamento horizontal do recorte: 0.62 mantém a embarcação à direita. */
const FOCO_X = 0.62

async function escrever(buf, base, larguras) {
  for (const w of larguras) {
    for (const [fmt, opt] of FORMATOS) {
      const b = await sharp(buf)
        .resize(w, null, { withoutEnlargement: true })
        [fmt === 'jpg' ? 'jpeg' : fmt](opt)
        .toBuffer()
      const nome = `public/brand/${base}-${w}.${fmt}`
      fs.writeFileSync(nome, b)
      console.log(`${nome.padEnd(46)} ${Math.round(b.length / 1024)}KB`)
    }
  }
}

const paisagem = await sharp(bruto).resize(2560, null, { withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer()
fs.writeFileSync('public/brand/hero-home.jpg', paisagem)
await escrever(paisagem, 'hero-home', [1280, 1920, 2560])

// Retrato: recorta ~9:19 do original, centrado no foco horizontal.
const m = await sharp(bruto).metadata()
const [alvoW, alvoH] = [1170, 2000]
const escala = Math.max(alvoW / m.width, alvoH / m.height)
const [rw, rh] = [Math.round(m.width * escala), Math.round(m.height * escala)]
const retrato = await sharp(bruto)
  .resize(rw, rh)
  .extract({
    left: Math.round((rw - alvoW) * FOCO_X),
    top: Math.round((rh - alvoH) * 0.5),
    width: alvoW,
    height: alvoH,
  })
  .jpeg({ quality: 80, mozjpeg: true })
  .toBuffer()
fs.writeFileSync('public/brand/hero-home-portrait.jpg', retrato)
await escrever(retrato, 'hero-home-portrait', [780, 1170])

console.log('\npronto.')
