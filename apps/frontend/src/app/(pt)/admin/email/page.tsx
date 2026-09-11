import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/admin/Shell'
import ConfigEmailForm from '@/components/admin/ConfigEmailForm'
import ModoDeEnvio from '@/components/admin/ModoDeEnvio'
import DominiosNegados from '@/components/admin/DominiosNegados'
import { getConfigDeEnvio, podeEnviar } from '@/lib/email/config'
import { criptoConfigurado } from '@/lib/cripto'

export const dynamic = 'force-dynamic'

/* `timeZone` explícito: sem ele o servidor formata em UTC e o navegador no
   fuso local, os textos divergem e o React acusa erro de hidratação. */
const fmt = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

/** Rótulos de cada situação do histórico. */
const SITUACAO: Record<string, { texto: string; cor: string }> = {
  enviado: { texto: 'Enviado', cor: 'bg-success-500/15 text-success-500' },
  falhou: { texto: 'Falhou', cor: 'bg-danger-500/15 text-danger-500' },
  bloqueado: { texto: 'Bloqueado', cor: 'bg-warning-500/15 text-warning-500' },
}

export default async function EmailAdminPage() {
  await requireAdmin()

  const [cfg, dominios, historico] = await Promise.all([
    getConfigDeEnvio(),
    prisma.blockedDomain.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.mailLog.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
  ])

  const pronto = podeEnviar(cfg)

  return (
    <>
      <PageHeader
        title="Envio de e-mail"
        count={
          pronto
            ? `${cfg.fromEmail ?? cfg.user} · ${cfg.autoSend ? 'envio automático' : 'aprovação manual'}`
            : 'Ainda não configurado'
        }
      />

      {!criptoConfigurado() && (
        <p role="alert" className="mt-4 rounded-[var(--radius-sm)] border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm leading-relaxed text-danger-500">
          Falta a chave de criptografia no servidor (<code className="font-mono">CORAL_SECRET_KEY</code>).
          Sem ela a senha não pode ser guardada com segurança, e o campo de senha fica indisponível.
        </p>
      )}

      <div className="mt-8 space-y-6">
        <ModoDeEnvio
          automatico={cfg.autoSend}
          podeAtivar={pronto}
          motivo="Configure o servidor de saída antes de ligar o envio automático."
          dominiosNegados={dominios.length}
        />

        <DominiosNegados itens={dominios} />

        <ConfigEmailForm
          valores={{
            host: cfg.host,
            port: cfg.port,
            secure: cfg.secure,
            serverName: cfg.serverName,
            user: cfg.user,
            fromEmail: cfg.fromEmail,
            fromName: cfg.fromName,
            replyTo: cfg.replyTo,
            bcc: cfg.bcc,
            autoLimitPerHour: cfg.autoLimitPerHour,
            origemDaSenha: cfg.origemDaSenha,
          }}
        />

        <section className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--border-subtle)] pb-4">
            <h2 className="font-display text-base font-semibold tracking-[var(--tracking-display)] text-[var(--text-strong)]">
              Últimos envios
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
              Registro de tudo que saiu, falhou ou foi bloqueado.
            </p>
          </div>

          {historico.length === 0 ? (
            <p className="mt-5 text-sm text-[var(--text-muted)]">Nenhum envio ainda.</p>
          ) : (
            <ul className="mt-5 divide-y divide-[var(--border-subtle)]">
              {historico.map((h) => {
                const s = SITUACAO[h.status] ?? { texto: h.status, cor: 'bg-[var(--surface-sunken)] text-[var(--text-muted)]' }
                return (
                  <li key={h.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-strong)]">
                        {h.to}
                        <span className={`rounded-[var(--radius-pill)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[var(--tracking-wide)] ${s.cor}`}>
                          {s.texto}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {h.trigger === 'automatico' ? 'automático' : 'manual'}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {h.subject}
                        {h.detail && <> · {h.detail}</>}
                        {h.actor && <> · por {h.actor}</>}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs tabular-nums text-[var(--text-muted)]">
                      {fmt.format(h.createdAt)}
                    </time>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
