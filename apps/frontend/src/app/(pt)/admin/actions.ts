'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { login, logout } from '@/lib/auth'
import { ipDoCliente } from '@/lib/ip'
import { mensagemBloqueio, registrarTentativa, verificarBloqueio } from '@/lib/rate-limit'

const schema = z.object({
  email: z.email().max(160),
  password: z.string().min(1).max(200),
})

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData) {
  const parsed = schema.safeParse({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  })

  // Mensagem única para formato inválido, usuário inexistente e senha errada:
  // qualquer diferença aqui vira um oráculo de enumeração de contas.
  const GENERICO = 'Credenciais inválidas.'
  if (!parsed.success) return { error: GENERICO }

  const { email, password } = parsed.data
  const ip = await ipDoCliente()

  const bloqueio = await verificarBloqueio(ip, email)
  if (bloqueio.bloqueado) {
    return { error: mensagemBloqueio(bloqueio.esperarSegundos) }
  }

  const user = await login(email, password)
  await registrarTentativa(ip, email, Boolean(user))

  if (!user) {
    // Atraso curto: encarece a varredura sem prejudicar quem erra a senha.
    await new Promise((r) => setTimeout(r, 400))
    return { error: GENERICO }
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function logoutAction() {
  await logout()
  redirect('/admin/login')
}
