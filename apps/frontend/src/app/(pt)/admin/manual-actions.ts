'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { enviarMemorialPara } from '@/lib/email/enviar-memorial'

export type EnvioState = { erro?: string; ok?: string } | undefined

/**
 * Envia o memorial descritivo a quem pediu, por clique do operador.
 *
 * A regra de envio mora em `enviar-memorial.ts`, compartilhada com o disparo
 * automático: assim os dois caminhos aplicam as mesmas checagens e escrevem
 * no mesmo histórico.
 */
export async function enviarMemorial(_prev: EnvioState, fd: FormData): Promise<EnvioState> {
  const admin = await requireAdmin()

  const id = String(fd.get('id') ?? '')
  if (!id) return { erro: 'Mensagem não encontrada.' }

  /* `reenvio` vem de um campo escondido no formulário, preenchido quando o
     botão já mostra "Enviar de novo": é a diferença entre um duplo-clique
     acidental (que precisa ser barrado) e uma decisão de mandar outra vez. */
  const reenvio = fd.get('reenvio') === 'true'

  const r = await enviarMemorialPara(id, { trigger: 'manual', actor: admin.email, reenvio })

  revalidatePath('/admin/inquiries')
  return r.ok ? { ok: r.mensagem } : { erro: r.erro }
}
