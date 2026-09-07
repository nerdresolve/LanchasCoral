'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { permitirEnvio } from '@/lib/rate-limit'
import { ipDoCliente } from '@/lib/ip'

const schema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(120),
  email: z.email('E-mail inválido.').max(160),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().max(4000).optional(),
  boatSlug: z.string().trim().max(120).optional(),
  kind: z
    .enum(['CONTATO', 'PROPOSTA', 'VISITA', 'SERVICOS', 'MANUAL', 'TRABALHE', 'BROKER', 'ANUNCIAR'])
    .default('CONTATO'),
  // Honeypot: preenchido apenas por bots.
  website: z.string().max(0).optional(),
})

export type ContactState = {
  ok?: boolean
  errors?: Record<string, string[]>
  message?: string
}

export async function submitInquiry(
  _prev: ContactState,
  fd: FormData,
): Promise<ContactState> {
  const parsed = schema.safeParse({
    name: fd.get('name') ?? '',
    email: fd.get('email') ?? '',
    phone: fd.get('phone') ?? undefined,
    message: fd.get('message') ?? undefined,
    boatSlug: fd.get('boatSlug') ?? undefined,
    kind: fd.get('kind') ?? 'CONTATO',
    website: fd.get('website') ?? undefined,
  })

  if (!parsed.success) {
    // Mesma convenção das actions do painel.
    return { ok: false, errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { website, ...data } = parsed.data
  // Bot detectado pelo campo-isca: responde como se tivesse dado certo, mas
  // não grava nada. Sinalizar a recusa só ensinaria o autor a contorná-la.
  if (website) return { ok: true, message: 'Recebemos sua mensagem.' }

  /*
   * Teto de envios por IP.
   *
   * O campo-isca sozinho não segurava nada: bastava um script que não o
   * preenchesse para gravar uma linha por requisição, enchendo a caixa de
   * contatos do estaleiro. O limite é folgado o bastante para quem manda
   * mensagens legítimas de vários formulários do site (proposta, visita,
   * catálogo) numa mesma visita.
   */
  const ip = await ipDoCliente()
  if (!(await permitirEnvio(`contato:${ip}`, 8, 60))) {
    return {
      ok: false,
      message: 'Você já enviou várias mensagens agora há pouco. Aguarde alguns minutos ou fale com a gente pelo WhatsApp.',
    }
  }

  let criado
  try {
    criado = await prisma.inquiry.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        message: data.message || null,
        boatSlug: data.boatSlug || null,
        kind: data.kind,
      },
    })
  } catch {
    return {
      ok: false,
      message: 'Não foi possível enviar agora. Tente novamente em instantes.',
    }
  }

  /*
   * Envio automático do memorial, quando ligado no painel.
   *
   * Nasce desligado: o disparo manual é a proteção contra mandar material
   * técnico a um concorrente. Quando ligado, a lista de domínios negados e o
   * teto por hora ainda valem — um pedido barrado fica pendente no painel em
   * vez de sumir.
   *
   * O `catch` é largo de propósito: qualquer falha no envio não pode fazer o
   * visitante ver "não foi possível enviar" depois de a mensagem já estar
   * gravada. O pedido fica pendente e alguém resolve pelo painel.
   */
  if (data.kind === 'MANUAL' && data.boatSlug) {
    try {
      const { getConfigDeEnvio } = await import('@/lib/email/config')
      const cfg = await getConfigDeEnvio()
      if (cfg.autoSend) {
        const { enviarMemorialPara } = await import('@/lib/email/enviar-memorial')
        await enviarMemorialPara(criado.id, { trigger: 'automatico' })
      }
    } catch {
      // Fica pendente no painel.
    }
  }

  return { ok: true, message: 'Recebemos seu contato. Nossa equipe responde em breve.' }
}
