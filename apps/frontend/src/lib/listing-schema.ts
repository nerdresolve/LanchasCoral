import { z } from 'zod'
import { inteiroOpcional, textoOpcional, urlDeImagem, slugValido } from './campos'

const optStr = textoOpcional()

/** Tipos de embarcação aceitos pelo estoque do Coral Broker. */
export const LISTING_KINDS = ['LANCHA', 'JETSKI'] as const

/**
 * Motorizações do filtro público de seminovos.
 *
 * A lista é fechada de propósito. O filtro em `/broker` agrupa por igualdade
 * exata de texto, então "Popa " ou "popa" viram uma opção separada e o
 * anúncio some do agrupamento certo. Os valores abaixo são os mesmos que
 * `prisma/classify-engines.ts` gravou na migração.
 */
export const TIPOS_DE_MOTOR = [
  'Popa',
  'Centro - Rabeta',
  'Centro - Parelha',
  'Centro - Single',
  'Hidrojato',
] as const

/*
 * Faixa aceita para o ano de fabricação.
 *
 * O teto é calculado a cada validação, e não uma vez no carregamento do
 * módulo: numa build de produção o módulo é avaliado no momento do build e o
 * limite ficaria congelado naquele ano para sempre.
 */
const ANO_MIN = 1950
const anoMaximo = () => new Date().getFullYear() + 2

export const listingSchema = z.object({
  slug: slugValido(),
  /* Teto com folga: o maior título hoje tem 31 caracteres. */
  title: z.string().trim().min(1, 'Informe o título.').max(200, 'Máximo de 200 caracteres.'),
  brand: optStr,
  kind: z.enum(LISTING_KINDS),

  year: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z
      .number({ message: 'Use um ano com quatro dígitos.' })
      .int('Use um ano com quatro dígitos.')
      .min(ANO_MIN, `A partir de ${ANO_MIN}.`)
      .refine((a) => a <= anoMaximo(), { message: `Até ${anoMaximo()}.` })
      .optional(),
  ),
  priceBrl: inteiroOpcional(100_000_000),
  sizeFt: inteiroOpcional(300),
  fuel: optStr,
  hullType: optStr,
  engine: optStr,
  /**
   * Motorização, usada pelo filtro "Tipo do motor" em `/broker`.
   *
   * Vinha só da migração: um anúncio criado pelo painel nascia sem valor e
   * nunca aparecia no filtro, sem nada indicando o motivo. Vazio continua
   * permitido — nem todo anúncio traz a informação.
   */
  engineType: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.enum(TIPOS_DE_MOTOR, { message: 'Escolha uma das motorizações da lista.' }).optional(),
  ),
  capacity: optStr,
  hours: optStr,
  place: optStr,
  tag: optStr,

  description: textoOpcional(8000),
  heroImage: urlDeImagem().optional().or(z.literal('').transform(() => undefined)),
  sourceUrl: optStr,

  published: z.boolean(),
  sold: z.boolean(),
  order: z.preprocess((v) => (v === '' || v == null ? 0 : Number(v)), z.number().int()),

  images: z
    .array(z.object({ url: urlDeImagem(), alt: z.string().trim().max(300).optional() }))
    // O teto existe só para conter abuso: a galeria mais cheia hoje tem 92
    // fotos, e um limite abaixo disso impediria de salvar modelos já cadastrados.
    .max(200, 'Máximo de 200 fotos.')
    .default([]),
  accessories: z
    .array(z.object({ text: z.string().trim().min(1).max(600, 'Item com texto longo demais.') }))
    // O anúncio com mais itens hoje tem 27.
    .max(300, 'Máximo de 300 acessórios.')
    .default([]),
})

export type ListingInput = z.infer<typeof listingSchema>

/** Converte o FormData (incluindo os repeaters em JSON) para o formato do schema. */
export function parseListingForm(fd: FormData) {
  const json = (k: string) => {
    const raw = fd.get(k)
    if (typeof raw !== 'string' || !raw) return []
    try { return JSON.parse(raw) } catch { return [] }
  }
  const obj: Record<string, unknown> = {}
  for (const [k, v] of fd.entries()) {
    if (['images', 'accessories', 'published', 'sold'].includes(k)) continue
    obj[k] = v
  }
  obj.published = fd.get('published') === 'on' || fd.get('published') === 'true'
  obj.sold = fd.get('sold') === 'on' || fd.get('sold') === 'true'
  obj.images = json('images')
  obj.accessories = json('accessories')
  return listingSchema.safeParse(obj)
}
