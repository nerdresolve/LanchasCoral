'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { alternarEnvioAutomatico } from '@/app/(pt)/admin/mail-actions'

/**
 * Alterna entre aprovar cada envio e enviar tudo sozinho.
 *
 * Ligar o automático pede confirmação, e não é preciosismo: o disparo manual
 * é a razão pela qual este fluxo existe — o cliente queria olhar quem está
 * pedindo antes de mandar material técnico. Ligar o automático abre mão
 * disso, e quem liga precisa saber o que está abrindo mão.
 *
 * Desligar não pergunta nada: voltar para o modo mais cauteloso nunca é o
 * movimento arriscado.
 */
export default function ModoDeEnvio({
  automatico,
  podeAtivar,
  motivo,
  dominiosNegados,
}: {
  automatico: boolean
  /** `false` quando falta configurar o servidor. */
  podeAtivar: boolean
  motivo?: string
  dominiosNegados: number
}) {
  const [confirmando, setConfirmando] = useState(false)

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold tracking-[var(--tracking-display)] text-[var(--text-strong)]">
            Modo de envio
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-body)]">
            {automatico
              ? 'O memorial sai sozinho assim que alguém pede pelo site.'
              : 'Cada pedido espera alguém clicar em "Enviar memorial" na tela de mensagens.'}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-[var(--radius-pill)] px-3 py-1 text-xs font-semibold uppercase tracking-[var(--tracking-wide)] ${
            automatico
              ? 'bg-warning-500/15 text-warning-500'
              : 'bg-ocean-700/12 text-ocean-700'
          }`}
        >
          {automatico ? 'Automático' : 'Aprovação manual'}
        </span>
      </div>

      {automatico && (
        <p className="mt-4 rounded-[var(--radius-sm)] border border-warning-500/30 bg-warning-500/8 px-4 py-3 text-sm leading-relaxed text-[var(--color-text-body)]">
          Qualquer pessoa que preencher o formulário recebe o memorial sem
          ninguém conferir quem é.{' '}
          {dominiosNegados > 0
            ? `${dominiosNegados} ${dominiosNegados === 1 ? 'domínio está bloqueado' : 'domínios estão bloqueados'}, mas quem usar Gmail ou outro endereço comum passa.`
            : 'Nenhum domínio está bloqueado no momento.'}
        </p>
      )}

      {!podeAtivar && !automatico && (
        <p className="mt-4 text-sm text-[var(--text-muted)]">{motivo}</p>
      )}

      <div className="mt-5">
        {automatico ? (
          <form action={alternarEnvioAutomatico}>
            <input type="hidden" name="ligar" value="false" />
            <Botao rotulo="Voltar para aprovação manual" />
          </form>
        ) : confirmando ? (
          <div className="rounded-[var(--radius-sm)] border border-warning-500/40 bg-warning-500/8 p-4">
            <p className="text-sm font-medium text-[var(--text-strong)]">
              Ligar o envio automático?
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-body)]">
              A partir daí, ninguém confere quem está pedindo antes de o
              memorial sair. Dá para voltar atrás a qualquer momento.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <form action={alternarEnvioAutomatico}>
                <input type="hidden" name="ligar" value="true" />
                <Botao rotulo="Sim, enviar sozinho" destaque />
              </form>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="text-sm font-medium text-[var(--text-muted)] transition-colors duration-[140ms] hover:text-[var(--text-strong)]"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            disabled={!podeAtivar}
            className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--color-text-body)] transition-colors duration-[140ms] hover:bg-[var(--surface-sunken)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ligar envio automático
          </button>
        )}
      </div>
    </section>
  )
}

function Botao({ rotulo, destaque }: { rotulo: string; destaque?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-11 items-center rounded-[var(--radius-pill)] px-4 py-2 text-sm font-semibold transition-colors duration-[140ms] disabled:opacity-50 ${
        destaque
          ? 'bg-warning-500 text-navy-900 hover:opacity-90'
          : 'border border-[var(--border-strong)] font-medium text-[var(--color-text-body)] hover:bg-[var(--surface-sunken)]'
      }`}
    >
      {pending ? 'Aplicando…' : rotulo}
    </button>
  )
}
