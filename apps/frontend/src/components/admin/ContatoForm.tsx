'use client'

import { useActionState, useState } from 'react'
import { Field, Section } from './Field'
import { primaryBtnCls } from './Shell'
import { salvarContato, type ActionState } from '@/app/(pt)/admin/contact-actions'

export type ContatoValores = {
  key: string
  label: string | null
  labelEn: string | null
  phones: string[]
  whatsapp: string | null
  email: string | null
  hours: string | null
  hoursEn: string | null
  active: boolean
}

/**
 * Edição de um ponto focal.
 *
 * Cada finalidade (comercial, assistência, compras) tem o seu formulário. O
 * aviso no topo lembra que a alteração vale para o site inteiro — é o motivo
 * de existir esta tela, e não é óbvio para quem a abre pela primeira vez.
 */
export default function ContatoForm({
  valores: v,
  titulo,
  ondeAparece,
}: {
  valores: ContatoValores
  titulo: string
  /** Lugares do site que exibem este ponto, listados para o operador. */
  ondeAparece: string
}) {
  const [estado, formAction, pendente] = useActionState<ActionState, FormData>(salvarContato, undefined)
  const [telefones, setTelefones] = useState<string[]>(v.phones.length ? v.phones : [''])

  const alterar = (i: number, valor: string) =>
    setTelefones((t) => t.map((x, j) => (j === i ? valor : x)))

  return (
    <form action={formAction}>
      <input type="hidden" name="key" value={v.key} />

      <Section title={titulo} description={`Aparece em: ${ondeAparece}`}>
        {estado?.error && (
          <p role="alert" className="mb-4 rounded-[var(--radius-sm)] border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm font-medium text-danger-500">
            {estado.error}
          </p>
        )}
        {estado?.ok && (
          <p role="status" className="mb-4 rounded-[var(--radius-sm)] border border-ocean-700/30 bg-ocean-700/8 px-4 py-3 text-sm font-medium text-ocean-700">
            Salvo. O site já mostra os dados novos.
          </p>
        )}

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-body)]">Telefones</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Na ordem em que devem aparecer. O primeiro é o principal.
            </p>
            <div className="mt-2 space-y-2">
              {telefones.map((tel, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    name="phones"
                    value={tel}
                    onChange={(e) => alterar(i, e.target.value)}
                    placeholder="(21) 99999-9999"
                    aria-label={`Telefone ${i + 1}`}
                    className="w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3.5 py-2.5 text-sm text-[var(--text-strong)] outline-none transition-colors duration-[140ms] placeholder:text-[var(--text-muted)] hover:border-[var(--border-strong)] focus:border-ocean-700"
                  />
                  {telefones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setTelefones((t) => t.filter((_, j) => j !== i))}
                      aria-label={`Remover telefone ${i + 1}`}
                      className="shrink-0 rounded-[var(--radius-xs)] px-3 text-danger-500 transition-colors duration-[140ms] hover:bg-danger-500/10"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {telefones.length < 4 && (
              <button
                type="button"
                onClick={() => setTelefones((t) => [...t, ''])}
                className="mt-2 text-xs font-semibold text-ocean-700 transition-colors duration-[140ms] hover:text-aqua-600"
              >
                + Adicionar telefone
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="WhatsApp"
              name="whatsapp"
              defaultValue={v.whatsapp}
              hint="Só com DDD e número. Em branco, o botão do WhatsApp não aparece."
              placeholder="21 98669-0285"
            />
            <Field
              label="E-mail"
              name="email"
              defaultValue={v.email}
              hint="Opcional. Aparece junto dos telefones."
              placeholder="comercial@lanchascoral.com.br"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Horário de atendimento"
              name="hours"
              defaultValue={v.hours}
              hint="Em branco, usa o horário geral da empresa."
              placeholder="Seg a Sex, 08h-18h"
            />
            <Field
              label="Horário (inglês)"
              name="hoursEn"
              defaultValue={v.hoursEn}
              placeholder="Mon to Fri, 8am-6pm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Título no site"
              name="label"
              defaultValue={v.label}
              hint="Em branco, usa o título padrão desta finalidade."
            />
            <Field
              label="Título (inglês)"
              name="labelEn"
              defaultValue={v.labelEn}
            />
          </div>

          <label className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              name="active"
              defaultChecked={v.active}
              className="h-4 w-4 rounded-[var(--radius-xs)] border-[var(--border-strong)] accent-[var(--color-ocean-700)]"
            />
            <span className="text-sm font-medium text-[var(--color-text-body)]">
              Mostrar no site
            </span>
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="submit" disabled={pendente} className={primaryBtnCls}>
            {pendente ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </Section>
    </form>
  )
}
