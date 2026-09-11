'use client'

import { useActionState } from 'react'
import { bloquearDominio, desbloquearDominio, type MailState } from '@/app/(pt)/admin/mail-actions'
import { controlCls, labelCls } from './Field'

export type DominioNegado = {
  id: string
  domain: string
  reason: string | null
  createdAt: Date
}

/**
 * Domínios que não recebem envio automático.
 *
 * O bloqueio não descarta o pedido: ele volta para a fila de aprovação
 * manual. Um domínio barrado por engano faria um cliente legítimo nunca
 * receber resposta, e ninguém saberia por quê.
 */
export default function DominiosNegados({ itens }: { itens: DominioNegado[] }) {
  const [estado, formAction, pendente] = useActionState<MailState, FormData>(bloquearDominio, undefined)

  // Fuso fixo: sem ele, servidor e navegador podem render datas diferentes.
  const fmt = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  })

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-sm)]">
      <div className="border-b border-[var(--border-subtle)] pb-4">
        <h2 className="font-display text-base font-semibold tracking-[var(--tracking-display)] text-[var(--text-strong)]">
          Domínios que não recebem envio automático
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
          Um pedido vindo destes domínios não é descartado: ele fica pendente
          na tela de mensagens para alguém decidir. Vale também para os
          subdomínios.
        </p>
      </div>

      <form action={formAction} className="mt-5">
        {estado?.erro && (
          <p role="alert" className="mb-3 text-xs font-medium text-danger-500">{estado.erro}</p>
        )}
        {estado?.ok && (
          <p role="status" className="mb-3 text-xs font-medium text-ocean-700">{estado.ok}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <div className="min-w-0 flex-1 basis-52">
            <label htmlFor="f-domain" className={labelCls}>Domínio</label>
            <input
              id="f-domain"
              name="domain"
              placeholder="concorrente.com.br"
              className={`mt-1.5 ${controlCls}`}
            />
          </div>
          <div className="min-w-0 flex-1 basis-52">
            <label htmlFor="f-reason" className={labelCls}>Motivo (opcional)</label>
            <input
              id="f-reason"
              name="reason"
              placeholder="Concorrente"
              className={`mt-1.5 ${controlCls}`}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={pendente}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--color-text-body)] transition-colors duration-[140ms] hover:bg-[var(--surface-sunken)] disabled:opacity-50"
            >
              {pendente ? 'Bloqueando…' : 'Bloquear'}
            </button>
          </div>
        </div>
      </form>

      {itens.length === 0 ? (
        <p className="mt-5 text-sm text-[var(--text-muted)]">
          Nenhum domínio bloqueado. No modo automático, todo pedido é atendido.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-[var(--border-subtle)]">
          {itens.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-mono text-sm text-[var(--text-strong)]">{d.domain}</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {d.reason ? `${d.reason} · ` : ''}
                  bloqueado em {fmt.format(d.createdAt)}
                </p>
              </div>
              <form action={desbloquearDominio}>
                <input type="hidden" name="id" value={d.id} />
                <button
                  className="rounded-[var(--radius-xs)] px-3 py-1.5 text-xs font-semibold text-danger-500 transition-colors duration-[140ms] hover:bg-danger-500/10"
                >
                  Remover
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
