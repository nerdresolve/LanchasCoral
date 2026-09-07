'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { cifrar, criptoConfigurado } from '@/lib/cripto'
import { getConfigDeEnvio, getMailSettings } from '@/lib/email/config'
import { verificarConexao } from '@/lib/email/mailer'
import { textoOpcional } from '@/lib/campos'

export type MailState = { erro?: string; ok?: string } | undefined

/*
 * Marca usada no campo de senha quando já existe uma gravada.
 *
 * A senha nunca volta para a tela — nem para o próprio administrador. Se ela
 * fosse devolvida no HTML, bastaria abrir o código-fonte da página para lê-la.
 * Quando o formulário chega com este valor, o campo é ignorado e a senha
 * atual permanece.
 *
 * Fica em `@/lib/email/marcas` porque um arquivo `'use server'` só pode
 * exportar funções assíncronas — uma constante exportada daqui quebraria o
 * build.
 */
import { MARCA_SENHA_GUARDADA } from '@/lib/email/marcas'

const schema = z.object({
  host: textoOpcional(200),
  port: z.preprocess(
    (v) => (v === '' || v == null ? 465 : Number(v)),
    z.number().int().min(1).max(65535, 'Porta inválida.'),
  ),
  secure: z.boolean(),
  serverName: textoOpcional(200),
  user: textoOpcional(200),
  pass: z.string().max(400).optional(),
  fromEmail: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.email('Remetente inválido.').max(200).optional(),
  ),
  fromName: z.string().trim().min(1, 'Informe o nome do remetente.').max(120),
  replyTo: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.email('Endereço de resposta inválido.').max(200).optional(),
  ),
  bcc: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.email('Endereço de cópia inválido.').max(200).optional(),
  ),
  autoLimitPerHour: z.preprocess(
    (v) => (v === '' || v == null ? 20 : Number(v)),
    z.number().int().min(1, 'Mínimo 1.').max(500, 'Máximo 500.'),
  ),
})

function ler(fd: FormData) {
  return schema.safeParse({
    host: fd.get('host'),
    port: fd.get('port'),
    secure: fd.get('secure') === 'on' || fd.get('secure') === 'true',
    serverName: fd.get('serverName'),
    user: fd.get('user'),
    pass: fd.get('pass') ?? undefined,
    fromEmail: fd.get('fromEmail'),
    fromName: fd.get('fromName'),
    replyTo: fd.get('replyTo'),
    bcc: fd.get('bcc'),
    autoLimitPerHour: fd.get('autoLimitPerHour'),
  })
}

export async function salvarConfigEmail(_prev: MailState, fd: FormData): Promise<MailState> {
  const admin = await requireAdmin()

  const parsed = ler(fd)
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? 'Verifique os campos.' }
  const d = parsed.data

  // Senha nova só é gravada se o operador realmente digitou uma.
  const senhaNova = d.pass && d.pass !== MARCA_SENHA_GUARDADA ? d.pass : null
  if (senhaNova && !criptoConfigurado()) {
    return {
      erro:
        'Falta a chave de criptografia no servidor (CORAL_SECRET_KEY). Sem ela a senha ' +
        'ficaria em texto puro no banco, e portanto nas cópias de segurança.',
    }
  }

  await getMailSettings() // garante que a linha existe
  await prisma.mailSettings.update({
    where: { id: 'singleton' },
    data: {
      host: d.host ?? null,
      port: d.port,
      secure: d.secure,
      serverName: d.serverName ?? null,
      user: d.user ?? null,
      ...(senhaNova ? { passEnc: cifrar(senhaNova) } : {}),
      fromEmail: d.fromEmail ?? null,
      fromName: d.fromName,
      replyTo: d.replyTo ?? null,
      bcc: d.bcc ?? null,
      autoLimitPerHour: d.autoLimitPerHour,
      updatedBy: admin.email,
    },
  })

  revalidatePath('/admin/email')
  revalidatePath('/admin/inquiries')
  return { ok: 'Configuração salva.' }
}

/**
 * Testa a conexão com o que está NA TELA, antes de gravar.
 *
 * Testar só o que já foi salvo obrigaria a gravar dados possivelmente errados
 * para descobrir que estão errados.
 */
export async function testarConexao(_prev: MailState, fd: FormData): Promise<MailState> {
  await requireAdmin()

  const parsed = ler(fd)
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? 'Verifique os campos.' }
  const d = parsed.data

  // Senha em branco (ou a marca) significa "usa a que já está gravada".
  const atual = await getConfigDeEnvio()
  const senha = d.pass && d.pass !== MARCA_SENHA_GUARDADA ? d.pass : atual.pass

  if (!d.host || !d.user || !senha) {
    return { erro: 'Preencha servidor, usuário e senha antes de testar.' }
  }

  try {
    await verificarConexao({
      ...atual,
      host: d.host,
      port: d.port,
      secure: d.secure,
      serverName: d.serverName ?? null,
      user: d.user,
      pass: senha,
    })
    return { ok: 'Conexão e credenciais funcionando.' }
  } catch (e) {
    const motivo = e instanceof Error ? e.message : 'erro desconhecido'
    return { erro: `Não conectou: ${motivo}` }
  }
}

/** Liga ou desliga o envio automático. */
export async function alternarEnvioAutomatico(fd: FormData) {
  const admin = await requireAdmin()
  const ligar = fd.get('ligar') === 'true'

  if (ligar) {
    // Ligar sem servidor configurado deixaria a chave ligada sem efeito, e
    // ninguém entenderia por que nada é enviado.
    const cfg = await getConfigDeEnvio()
    if (!cfg.host || !cfg.user || !cfg.pass) return
  }

  await getMailSettings()
  await prisma.mailSettings.update({
    where: { id: 'singleton' },
    data: { autoSend: ligar, updatedBy: admin.email },
  })

  revalidatePath('/admin/email')
}

const dominioSchema = z
  .string()
  .trim()
  .toLowerCase()
  // Aceita "empresa.com.br" e também um e-mail colado inteiro, de onde
  // extraímos o domínio — é o erro mais provável de quem preenche.
  .transform((v) => (v.includes('@') ? v.split('@')[1]! : v))
  .pipe(
    z
      .string()
      .min(3, 'Domínio muito curto.')
      .max(200)
      .regex(
        /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/,
        'Use apenas o domínio, como empresa.com.br',
      ),
  )

export async function bloquearDominio(_prev: MailState, fd: FormData): Promise<MailState> {
  const admin = await requireAdmin()

  const parsed = dominioSchema.safeParse(fd.get('domain') ?? '')
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? 'Domínio inválido.' }

  const dominio = parsed.data
  const proprio = (await getConfigDeEnvio()).fromEmail?.split('@')[1]?.toLowerCase()
  if (proprio && (dominio === proprio || proprio.endsWith(`.${dominio}`))) {
    return { erro: 'Este é o domínio do próprio remetente. Bloqueá-lo impediria os testes internos.' }
  }

  const jaExiste = await prisma.blockedDomain.findUnique({ where: { domain: dominio } })
  if (jaExiste) return { erro: `${dominio} já está na lista.` }

  await prisma.blockedDomain.create({
    data: {
      domain: dominio,
      reason: String(fd.get('reason') ?? '').trim().slice(0, 200) || null,
      createdBy: admin.email,
    },
  })

  revalidatePath('/admin/email')
  return { ok: `${dominio} não receberá envios automáticos.` }
}

export async function desbloquearDominio(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id') ?? '')
  if (!id) return
  await prisma.blockedDomain.delete({ where: { id } }).catch(() => {})
  revalidatePath('/admin/email')
}
