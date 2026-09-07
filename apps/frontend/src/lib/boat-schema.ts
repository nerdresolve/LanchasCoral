import { z } from 'zod'
import { numeroOpcional, inteiroOpcional, textoOpcional, urlDeImagem, urlDeDocumento, urlDeVideo, slugValido } from './campos'

/*
 * Os ajudantes vivem em `./campos` porque o formulário dos seminovos precisa
 * exatamente das mesmas regras. Mantê-los em um só lugar evita que os dois
 * formulários aceitem coisas diferentes.
 */
const optNum = numeroOpcional()
const optInt = inteiroOpcional()
const optStr = textoOpcional()

export const perfSchema = z.object({
  label: z.string().trim().min(1),
  fuel: z.string().trim().optional().nullable(),
  cruiseLh: z.number().nullable().optional(),
  avgLh: z.number().nullable().optional(),
})

export const boatSchema = z.object({
  slug: slugValido(),
  /* Tetos com folga sobre o uso real (o maior nome hoje tem 9 caracteres).
     Servem contra abuso e engano de colagem, não para apertar o operador. */
  name: z.string().trim().min(1, 'Informe o nome.').max(120, 'Máximo de 120 caracteres.'),
  variant: optStr,
  familyName: optStr,
  tagline: optStr,
  description: optStr,

  /* Versões em inglês. Vazias caem no português no site. */
  variantEn: optStr,
  taglineEn: optStr,
  descriptionEn: optStr,

  lengthM: optNum, beamM: optNum, draftM: optNum, depthM: optNum, cabinHeightM: optNum,
  weightKg: optInt, engineWeightKg: optInt,
  fuelL: optInt, waterL: optInt,
  powerMinHp: optInt, powerMaxHp: optInt,
  capInteriorDay: optInt, capInteriorNight: optInt,
  capOpenSeaDay: optInt, capOpenSeaNight: optInt,

  published: z.boolean(),
  order: z.preprocess((v) => (v === '' || v == null ? 0 : Number(v)), z.number().int()),
  // Validada como URL de imagem, e não como texto livre: vai direto para o
  // `next/image`, que responde 400 a qualquer host fora da lista.
  heroImage: urlDeImagem().optional().or(z.literal('').transform(() => undefined)),
  /** Vídeo de fundo do hero, por cima da foto. */
  heroVideo: urlDeVideo(),
  /** Memorial descritivo em PDF, oferecido para download na página do modelo. */
  manualUrl: urlDeDocumento(),
  seoTitle: optStr,
  seoDescription: optStr,

  images: z
    .array(z.object({ url: urlDeImagem(), alt: z.string().trim().max(300).optional() }))
    // O teto existe só para conter abuso: a galeria mais cheia hoje tem 92
    // fotos, e um limite abaixo disso impediria de salvar modelos já cadastrados.
    .max(200, 'Máximo de 200 fotos.')
    .default([]),
  equipment: z
    .array(
      z.object({
        panel: z.string().trim().max(80),
        text: z.string().trim().min(1).max(600, 'Item com texto longo demais.'),
        textEn: z.string().trim().max(600).optional(),
      }),
    )
    // O modelo com mais itens hoje tem 33; 300 é folga larga sem virar abuso.
    .max(300, 'Máximo de 300 equipamentos.')
    .default([]),
  performance: z.array(perfSchema).max(20, 'Máximo de 20 motorizações.').default([]),
})
  .refine((d) => d.powerMinHp == null || d.powerMaxHp == null || d.powerMinHp <= d.powerMaxHp, {
    message: 'A potência mínima não pode ser maior que a máxima.',
    path: ['powerMinHp'],
  })

export type BoatInput = z.infer<typeof boatSchema>

/** Parses FormData (incl. JSON-encoded repeaters) into the schema shape. */
export function parseBoatForm(fd: FormData) {
  const json = (k: string) => {
    const raw = fd.get(k)
    if (typeof raw !== 'string' || !raw) return []
    try { return JSON.parse(raw) } catch { return [] }
  }
  const obj: Record<string, unknown> = {}
  for (const [k, v] of fd.entries()) {
    if (['images', 'equipment', 'performance', 'published'].includes(k)) continue
    obj[k] = v
  }
  obj.published = fd.get('published') === 'on' || fd.get('published') === 'true'
  obj.images = json('images')
  obj.equipment = json('equipment')
  obj.performance = json('performance')
  return boatSchema.safeParse(obj)
}
