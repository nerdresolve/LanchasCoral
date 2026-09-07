/*
 * Primitivas de formulário do painel.
 *
 * Todas as cores vêm dos tokens do design system (os mesmos do site público).
 * As classes antigas `ink-*` e `navy-50/100/…/400` não existem no @theme do
 * globals.css — ou seja, não geravam utilitária nenhuma e o texto herdava a cor
 * do body. Por isso aqui o valor é sempre explícito.
 */

/** Classe base dos controles de texto. Compartilhada por input, select e textarea. */
export const controlCls =
  'w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3.5 py-2.5 text-sm text-[var(--text-strong)] outline-none transition-colors duration-[140ms] placeholder:text-[var(--text-muted)] focus:border-ocean-700 hover:border-[var(--border-strong)]'

/** Rótulo de campo. */
export const labelCls = 'block text-sm font-medium text-[var(--color-text-body)]'

export function Field({
  label, name, defaultValue, type = 'text', step, suffix, errors, required, placeholder, hint,
}: {
  label: string
  name: string
  defaultValue?: string | number | null
  type?: string
  step?: string
  suffix?: string
  errors?: string[]
  required?: boolean
  placeholder?: string
  hint?: string
}) {
  const id = `f-${name}`
  const hintId = hint ? `${id}-hint` : undefined
  const errId = errors?.length ? `${id}-err` : undefined
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
        {required && (
          <span className="text-danger-500" title="Campo obrigatório"> *</span>
        )}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id} name={name} type={type} step={step} required={required} placeholder={placeholder}
          defaultValue={defaultValue ?? ''}
          aria-describedby={describedBy}
          aria-invalid={errors?.length ? true : undefined}
          className={`${controlCls} ${suffix ? 'pr-12' : ''} ${
            errors?.length ? 'border-danger-500' : ''
          }`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p id={hintId} className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
      {errors?.length ? (
        <p id={errId} className="mt-1 text-xs font-medium text-danger-500">{errors.join(' ')}</p>
      ) : null}
    </div>
  )
}

export function TextArea({
  label, name, defaultValue, rows = 4, hint, required, errors,
}: {
  label: string
  name: string
  defaultValue?: string | null
  rows?: number
  hint?: string
  required?: boolean
  /* Sem isto, um texto recusado pela validação (longo demais, por exemplo)
     rejeitava o formulário sem mostrar o motivo ao lado do campo. */
  errors?: string[]
}) {
  const id = `f-${name}`
  const hintId = hint ? `${id}-hint` : undefined
  const errId = errors?.length ? `${id}-err` : undefined
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
        {required && <span className="text-danger-500" title="Campo obrigatório"> *</span>}
      </label>
      <textarea
        id={id} name={name} rows={rows} defaultValue={defaultValue ?? ''}
        aria-describedby={describedBy}
        aria-invalid={errors?.length ? true : undefined}
        className={`mt-1.5 ${controlCls} ${errors?.length ? 'border-danger-500' : ''}`}
      />
      {hint && <p id={hintId} className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
      {errors?.length ? (
        <p id={errId} className="mt-1 text-xs font-medium text-danger-500">{errors.join(' ')}</p>
      ) : null}
    </div>
  )
}

/**
 * Bloco de campos com título e frase de ajuda. É a unidade de leitura do
 * formulário: o usuário percorre seções, não campos soltos.
 */
export function Section({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-sm)]">
      <div className="border-b border-[var(--border-subtle)] pb-4">
        <h2 className="font-display text-base font-semibold tracking-[var(--tracking-display)] text-[var(--text-strong)]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{description}</p>
        )}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}
