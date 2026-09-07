'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { dangerBtnCls } from './Shell'

/**
 * Exclusão em dois passos.
 *
 * Antes o botão apagava direto: um clique errado destruía um modelo com
 * dezenas de fotos e equipamentos, sem volta e sem aviso. Agora o primeiro
 * clique abre uma confirmação que exige digitar o nome do item — não é um
 * "tem certeza?" que se aceita no reflexo, e obriga a olhar o que se está
 * apagando.
 *
 * A confirmação é um `<dialog>` nativo: ele já traz o foco preso dentro do
 * diálogo, o fechamento por Esc e a camada de fundo, sem biblioteca.
 */
export default function BotaoExcluir({
  id,
  nome,
  tipo,
  action,
}: {
  id: string
  /** Nome que o operador precisa digitar para confirmar. */
  nome: string
  /** "modelo" ou "anúncio", usado nos textos. */
  tipo: string
  action: (fd: FormData) => void | Promise<void>
}) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const [digitado, setDigitado] = useState('')

  const confere = digitado.trim().toLowerCase() === nome.trim().toLowerCase()

  useEffect(() => {
    const el = dialogo.current
    if (!el) return
    // Limpa o campo sempre que o diálogo fecha, para o próximo uso começar
    // do zero em vez de reaproveitar o texto já validado.
    const aoFechar = () => setDigitado('')
    el.addEventListener('close', aoFechar)
    return () => el.removeEventListener('close', aoFechar)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => dialogo.current?.showModal()}
        className={dangerBtnCls}
      >
        Excluir {tipo}
      </button>

      <dialog
        ref={dialogo}
        className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-0 text-[var(--color-text-body)] shadow-[var(--shadow-lg)] backdrop:bg-navy-900/60"
      >
        <form action={action} className="p-6">
          <input type="hidden" name="id" value={id} />

          <h2 className="font-display text-lg font-semibold text-[var(--text-strong)]">
            Excluir {nome}?
          </h2>

          <p className="mt-3 text-sm leading-relaxed">
            As fotos, os equipamentos e o texto deste {tipo} serão apagados junto.
            A página no site sai do ar imediatamente.{' '}
            <strong className="font-semibold text-[var(--text-strong)]">Não há como desfazer.</strong>
          </p>

          <label htmlFor="confirmar-exclusao" className="mt-5 block text-sm font-medium">
            Para confirmar, digite <span className="font-mono text-[var(--text-strong)]">{nome}</span>:
          </label>
          <input
            id="confirmar-exclusao"
            value={digitado}
            onChange={(e) => setDigitado(e.target.value)}
            autoComplete="off"
            className="mt-1.5 w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-page)] px-3.5 py-2.5 text-sm text-[var(--text-strong)] outline-none focus:border-danger-500"
          />

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              className="text-sm font-medium text-[var(--text-muted)] transition-colors duration-[140ms] hover:text-[var(--text-strong)]"
            >
              Cancelar
            </button>
            <BotaoConfirmar habilitado={confere} tipo={tipo} />
          </div>
        </form>
      </dialog>
    </>
  )
}

/**
 * Botão de confirmação.
 *
 * Fica num componente à parte porque `useFormStatus` só enxerga o envio quando
 * está DENTRO do `<form>` — se fosse lido no componente de cima, `pending`
 * nunca mudaria e daria para clicar duas vezes.
 */
function BotaoConfirmar({ habilitado, tipo }: { habilitado: boolean; tipo: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={!habilitado || pending}
      className={`${dangerBtnCls} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {pending ? 'Excluindo…' : `Excluir ${tipo}`}
    </button>
  )
}
