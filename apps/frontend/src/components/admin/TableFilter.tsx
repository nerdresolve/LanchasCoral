'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { controlCls } from './Field'

/**
 * Busca simples sobre uma lista já renderizada pelo servidor.
 *
 * Não toca em dados nem em rotas: envolve as linhas e esconde as que não
 * batem com o termo. Cada filho precisa expor `data-search` com o texto
 * pesquisável. Sem JavaScript a lista continua completa e utilizável.
 *
 * Passando `status`, ganha também um filtro por situação. Cada linha então
 * precisa expor `data-status` com o valor correspondente.
 */
export type StatusOpcao = { value: string; label: string; count?: number }

export default function TableFilter({
  children,
  placeholder = 'Buscar…',
  label = 'Buscar na lista',
  /** Palavra usada nas mensagens de contagem: "3 de 12 anúncios". */
  noun,
  total,
  status,
  statusLabel = 'Filtrar por situação',
  note,
}: {
  children: React.ReactNode
  placeholder?: string
  label?: string
  noun: string
  total: number
  /** Opções de situação. A primeira é o padrão e deve casar com tudo. */
  status?: StatusOpcao[]
  statusLabel?: string
  /** Aviso fixo abaixo da lista, para regras que o operador precisa saber. */
  note?: string
}) {
  const [q, setQ] = useState('')
  const [situacao, setSituacao] = useState(status?.[0]?.value ?? '')
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(total)

  const needle = useMemo(
    () => q.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''),
    [q],
  )

  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    const rows = root.querySelectorAll<HTMLElement>('[data-search]')
    let shown = 0
    rows.forEach((row) => {
      const hay = (row.dataset.search ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
      const casaTexto = needle === '' || hay.includes(needle)
      // Situação vazia (a primeira opção) casa com tudo.
      const casaStatus = situacao === '' || row.dataset.status === situacao
      const match = casaTexto && casaStatus
      row.hidden = !match
      if (match) shown += 1
    })
    setVisible(shown)
  }, [needle, situacao, children])

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <label htmlFor="admin-filter" className="sr-only">
            {label}
          </label>
          <input
            id="admin-filter"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className={`${controlCls} max-w-sm`}
          />
        </div>

        {status && status.length > 1 && (
          /* Botões, e não um <select>: são poucas opções e a contagem de cada
             uma fica visível sem precisar abrir a lista. */
          <div
            role="group"
            aria-label={statusLabel}
            className="flex shrink-0 rounded-[var(--radius-pill)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-1"
          >
            {status.map((op) => {
              const ativo = op.value === situacao
              return (
                <button
                  key={op.value || 'todos'}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setSituacao(op.value)}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-pill)] px-3.5 font-body text-xs font-semibold transition-colors duration-[140ms] ${
                    ativo
                      ? 'bg-ocean-700 text-pearl-0'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'
                  }`}
                >
                  {op.label}
                  {typeof op.count === 'number' && (
                    <span className={`font-mono text-[11px] font-normal ${ativo ? 'text-pearl-0/75' : 'text-[var(--text-muted)]'}`}>
                      {op.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div ref={containerRef}>{children}</div>

      <p aria-live="polite" className="mt-3 text-xs text-[var(--text-muted)]">
        {needle === '' && situacao === ''
          ? `${total} ${noun}.`
          : visible === 0
            ? needle
              ? `Nenhum resultado para “${q.trim()}”.`
              : `Nenhum item nesta situação.`
            : `${visible} de ${total} ${noun}.`}
      </p>

      {note && <p className="mt-1 text-xs text-[var(--text-muted)]">{note}</p>}
    </>
  )
}
