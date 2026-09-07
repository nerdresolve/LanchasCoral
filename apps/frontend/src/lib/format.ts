/** pt-BR formatting helpers for spec display. */
const nf = (min = 0, max = 2) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: min, maximumFractionDigits: max })

type Decimalish = { toString(): string } | number | null | undefined

export const toNum = (v: Decimalish): number | null => {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : parseFloat(v.toString())
  return Number.isFinite(n) ? n : null
}

export const meters = (v: Decimalish) => {
  const n = toNum(v)
  return n === null ? null : `${nf(2, 2).format(n)} m`
}

export const litres = (v: number | null | undefined) =>
  v === null || v === undefined ? null : `${nf(0, 0).format(v)} L`

export const kilos = (v: number | null | undefined) =>
  v === null || v === undefined ? null : `${nf(0, 0).format(v)} kg`

export const hp = (v: number | null | undefined) =>
  v === null || v === undefined ? null : `${nf(0, 0).format(v)} HP`

export const people = (day: number | null, night: number | null) => {
  if (day === null && night === null) return null
  const parts: string[] = []
  if (day !== null) parts.push(`${day} dia`)
  if (night !== null) parts.push(`${night} pernoite`)
  return parts.join(' · ')
}

/** "16 pessoas" — the capacity figure used on cards and key-figure rails. */
export const capacity = (v: number | null | undefined) =>
  v === null || v === undefined ? null : `${v} ${v === 1 ? 'pessoa' : 'pessoas'}`

/* ---- Compact forms for the design system's mono spec rails ---- */

/** "250 hp" — lowercase unit, as the technical rails render it. */
export const hpShort = (v: number | null | undefined) =>
  v === null || v === undefined ? null : `${nf(0, 0).format(v)} hp`

/** "12 pax" — the lotação figure on model cards. */
export const capacityShort = (v: number | null | undefined) =>
  v === null || v === undefined ? null : `${v} pax`

/** Bare number, no unit — for rails that print the unit separately. */
export const num = (v: Decimalish, digits = 2) => {
  const n = toNum(v)
  return n === null ? null : nf(digits, digits).format(n)
}

/** "R$ 1.990.000" — preço de anúncio, sem centavos. */
export const brl = (v: number | null | undefined) =>
  v === null || v === undefined
    ? null
    : new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      }).format(v)
