/**
 * Maps the scraped WordPress spec rows onto typed columns.
 *
 * The legacy site stored specs as hand-typed label/value strings, so the same
 * field appears under several spellings ("Capacidade máxima (interior)",
 * "Capacidade Máxima (interior)", "Capacidade interior"). Matching is done on a
 * normalized key (accent- and case-insensitive) so every variant lands in one column.
 */
export type RawRow = { label: string; value: string }
export type RawGroup = { group: string; rows: RawRow[] }
export type RawBoat = {
  slug: string
  title: string
  desc: string
  ogimg: string | null
  groups: RawGroup[]
  images: string[]
  equip: { panel: string; sections: string[]; items: string[] }[]
}

const key = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** "10,97m" -> 10.97 ; "3.000Kg" -> 3000 ; "220 litros" -> 220 */
export function num(v: string): number | null {
  if (!v) return null
  const m = v.replace(/\s/g, '').match(/-?[\d.,]+/)
  if (!m) return null
  let s = m[0]
  // pt-BR: "." thousands, "," decimals
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '')
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : null
}

/** "14/06" -> { day: 14, night: 6 } */
function pair(v: string): { day: number | null; night: number | null } {
  const m = v.match(/(\d+)\s*\/\s*(\d+)/)
  if (m) return { day: parseInt(m[1], 10), night: parseInt(m[2], 10) }
  const n = num(v)
  return { day: n === null ? null : Math.round(n), night: null }
}

const INTERIOR = new Set([
  'capacidade maxima interior', 'capacidade interior', 'capacidade dia noite m a int',
])
const OPEN_SEA = new Set(['capacidade maxima mar aberto', 'capacidade mar aberto'])

export function normalize(raw: RawBoat) {
  const spec: Record<string, string> = {}
  for (const g of raw.groups) for (const r of g.rows) spec[key(r.label)] = r.value

  const pick = (...keys: string[]) => {
    for (const k of keys) if (spec[k] !== undefined) return spec[k]
    return ''
  }
  const int = (...k: string[]) => { const n = num(pick(...k)); return n === null ? null : Math.round(n) }
  const dec = (...k: string[]) => num(pick(...k))

  const interior = pair(pick(...INTERIOR))
  const openSea = pair(pick(...OPEN_SEA))

  // Performance groups: "Desempenho (2x 2.8 220HP - Diesel)"
  const performance = raw.groups
    .filter((g) => /desempenho/i.test(g.group))
    .map((g) => {
      const label = (g.group.match(/\(([^)]*)\)/)?.[1] ?? g.group).trim()
      const get = (re: RegExp) => {
        const row = g.rows.find((r) => re.test(key(r.label)))
        return row ? num(row.value) : null
      }
      return {
        label,
        fuel: /diesel/i.test(label) ? 'Diesel' : /gasolina/i.test(label) ? 'Gasolina' : null,
        cruiseLh: get(/cruzeiro/),
        avgLh: get(/medio|passeio/),
      }
    })

  // Title -> name + variant. The legacy titles are inconsistent: some use a dash
  // ("Coral 36 - Cabinada"), others bake the variant into the name
  // ("Coral 32 Cabinada", "Coral 40A Sea Breeze", "Coral 50 Fly").
  const title = raw.title.replace(/\s+/g, ' ').trim()
  const dashed = title.split(/\s*[–-]\s*/)
  let name = dashed[0].trim()
  let variant: string | null = dashed.length > 1 ? dashed.slice(1).join(' - ').trim() : null

  if (!variant) {
    // "Coral 32 Cabinada" / "Coral 50 Fly" / "Coral 40A Sea Breeze" -> split after the model number
    const m = name.match(/^(Coral\s+\d+\s*[A-Za-z]?)\s+(.+)$/i)
    if (m) { name = m[1].trim(); variant = m[2].trim() }
  }

  // Family key ignores any trailing letter: "Coral 32A" and "Coral 32" are one family.
  const familyName = (name.match(/^Coral\s+\d+/i)?.[0] ?? name).replace(/\s+/g, ' ').trim()

  return {
    slug: raw.slug,
    name,
    variant,
    familyName,
    title: raw.title,
    lengthM: dec('comprimento'),
    beamM: dec('boca'),
    draftM: dec('calado'),
    depthM: dec('pontal'),
    cabinHeightM: dec('pe direito da cabine'),
    weightKg: int('peso sem motor'),
    engineWeightKg: int('peso do motor'),
    fuelL: int('tanque combustivel', 'tanque combustivel ate 60 hp'),
    waterL: int('agua'),
    powerMinHp: int('motorizacao minima'),
    powerMaxHp: int('motorizacao maxima'),
    capInteriorDay: interior.day,
    capInteriorNight: interior.night,
    capOpenSeaDay: openSea.day,
    capOpenSeaNight: openSea.night,
    performance,
    images: raw.images,
    equip: raw.equip,
  }
}
