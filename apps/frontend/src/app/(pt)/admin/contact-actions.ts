'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { textoOpcional } from '@/lib/campos'

export type ActionState = { error?: string; ok?: boolean } | undefined

/**
 * Revalida tudo que mostra um ponto focal.
 *
 * `'layout'` na raiz porque o rodapé aparece em todas as páginas: uma troca de
 * telefone precisa alcançar o site inteiro, não só a página de contatos. É o
 * que dá sentido a "editar uma vez e mudar em todos os lugares".
 */
function revalidarContatos() {
  revalidatePath('/', 'layout')
  /* A home entra explicitamente. `revalidatePath('/', 'layout')` derruba o
     layout, mas a página `/` tem cache próprio — e é ela que carrega o
     JSON-LD com os telefones. Sem esta linha, o rodapé de todas as páginas
     atualizava e só a home ficava com os números velhos. */
  revalidatePath('/')
  revalidatePath('/en')
  revalidatePath('/contatos')
  revalidatePath('/contato')
  revalidatePath('/en/contacts')
  revalidatePath('/en/contact')
  revalidatePath('/admin/contatos')
}

/**
 * Telefone brasileiro no formato que o site publica.
 *
 * Aceita fixo e celular, com ou sem o nono dígito: (21) 3448-7381 ou
 * (21) 97159-8865. A máscara é conferida porque o número vai para um link
 * `tel:` — um valor torto vira um telefone que não disca.
 */
const telefone = z
  .string()
  .trim()
  .regex(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/, 'Use o formato (21) 99999-9999.')

const schema = z.object({
  key: z.string().trim().min(1),
  label: textoOpcional(80),
  labelEn: textoOpcional(80),
  phones: z.array(telefone).max(4, 'No máximo 4 telefones por ponto.'),
  /* Só dígitos com DDI, que é o formato que o wa.me exige. O painel aceita o
     número digitado de qualquer jeito e normaliza antes de validar. */
  whatsapp: z.preprocess(
    (v) => {
      if (typeof v !== 'string' || !v.trim()) return undefined
      const digitos = v.replace(/\D/g, '')
      return digitos.startsWith('55') ? digitos : `55${digitos}`
    },
    z.string().regex(/^55\d{10,11}$/, 'WhatsApp inválido. Informe DDD e número.').optional(),
  ),
  email: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.email('E-mail inválido.').max(160).optional(),
  ),
  hours: textoOpcional(120),
  hoursEn: textoOpcional(120),
  active: z.boolean(),
})

export async function salvarContato(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = schema.safeParse({
    key: fd.get('key'),
    label: fd.get('label'),
    labelEn: fd.get('labelEn'),
    // Os telefones chegam como campos repetidos do mesmo nome.
    phones: fd.getAll('phones').map(String).map((t) => t.trim()).filter(Boolean),
    whatsapp: fd.get('whatsapp'),
    email: fd.get('email'),
    hours: fd.get('hours'),
    hoursEn: fd.get('hoursEn'),
    active: fd.get('active') === 'on' || fd.get('active') === 'true',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Verifique os campos.' }
  }

  const d = parsed.data
  if (!d.phones.length && !d.email) {
    return { error: 'Informe ao menos um telefone ou um e-mail.' }
  }

  await prisma.contactPoint.update({
    where: { key: d.key },
    data: {
      label: d.label ?? null,
      labelEn: d.labelEn ?? null,
      phones: d.phones,
      whatsapp: d.whatsapp ?? null,
      email: d.email ?? null,
      hours: d.hours ?? null,
      hoursEn: d.hoursEn ?? null,
      active: d.active,
    },
  })

  revalidarContatos()
  return { ok: true }
}
