'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { enviarMemorial, type EnvioState } from '@/app/(pt)/admin/manual-actions'

/**
 * Dispara o envio do memorial descritivo para quem pediu.
 *
 * O envio é sempre manual, por decisão do cliente: o pedido chega, alguém
 * confere quem está do outro lado e só então clica. Nada sai sozinho.
 *
 * Quando já foi enviado, o botão continua disponível mas muda de aparência e
 * de texto — reenviar é legítimo (o primeiro pode ter caído no spam), mas
 * quem clica precisa saber que está repetindo.
 */
export default function BotaoEnviarMemorial({
  id,
  jaEnviadoEm,
  desabilitadoPorque,
}: {
  id: string
  /** Data do envio anterior, se houve. */
  jaEnviadoEm?: Date | null
  /** Motivo para não poder enviar (sem SMTP, sem memorial no modelo…). */
  desabilitadoPorque?: string
}) {
  const [estado, formAction] = useActionState<EnvioState, FormData>(enviarMemorial, undefined)

  /*
   * O reenvio exige confirmação, e não é preciosismo.
   *
   * Antes o campo escondido dizia "é reenvio" sempre que o pedido já tinha
   * data de envio. Numa rajada de cliques isso se voltava contra: o primeiro
   * clique enviava e marcava a data, o React re-renderizava com o campo em
   * `true`, e o terceiro clique — já em voo — passava como reenvio
   * deliberado. Dois e-mails para o cliente. Reproduzido em produção.
   *
   * Agora o valor vem deste estado, que só muda quando alguém confirma.
   * O formulário não troca de significado sozinho.
   */
  const [confirmandoReenvio, setConfirmandoReenvio] = useState(false)
  const jaEnviado = Boolean(jaEnviadoEm) || Boolean(estado?.ok)

  return (
    <div className="mt-3">
      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="reenvio" value={confirmandoReenvio ? 'true' : 'false'} />

        {jaEnviado && !confirmandoReenvio ? (
          <button
            type="button"
            onClick={() => setConfirmandoReenvio(true)}
            disabled={Boolean(desabilitadoPorque)}
            className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--border-strong)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text-body)] transition-colors duration-[140ms] hover:bg-[var(--surface-sunken)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Enviar de novo
          </button>
        ) : (
          <Botao jaEnviado={jaEnviado} impedido={desabilitadoPorque} />
        )}

        {confirmandoReenvio && (
          <button
            type="button"
            onClick={() => setConfirmandoReenvio(false)}
            className="text-xs font-medium text-[var(--text-muted)] transition-colors duration-[140ms] hover:text-[var(--text-strong)]"
          >
            Cancelar
          </button>
        )}

        {jaEnviadoEm && !estado?.ok && (
          <span className="text-xs text-[var(--text-muted)]">
            Enviado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(jaEnviadoEm)}
          </span>
        )}
        {desabilitadoPorque && (
          <span className="text-xs text-[var(--text-muted)]">{desabilitadoPorque}</span>
        )}
      </form>

      {estado?.erro && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger-500">
          {estado.erro}
        </p>
      )}
      {estado?.ok && (
        <p role="status" className="mt-2 text-xs font-medium text-ocean-700">
          {estado.ok}
        </p>
      )}
    </div>
  )
}

/**
 * Componente separado porque `useFormStatus` só enxerga o envio quando está
 * dentro do `<form>`; lido de fora, `pending` nunca mudaria e daria para
 * clicar duas vezes e mandar o e-mail em dobro.
 */
function Botao({ jaEnviado, impedido }: { jaEnviado: boolean; impedido?: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending || Boolean(impedido)}
      className={`inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-pill)] px-3.5 py-1.5 text-xs font-semibold transition-colors duration-[140ms] disabled:cursor-not-allowed disabled:opacity-40 ${
        jaEnviado
          ? 'border border-[var(--border-strong)] text-[var(--color-text-body)] hover:bg-[var(--surface-sunken)]'
          : 'bg-ocean-700 text-pearl-0 hover:bg-ocean-600'
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 5h16v14H4z" />
        <path d="M4 6l8 6 8-6" />
      </svg>
      {pending ? 'Enviando…' : jaEnviado ? 'Confirmar reenvio' : 'Enviar memorial'}
    </button>
  )
}
