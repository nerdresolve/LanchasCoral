import Link from 'next/link'

/*
 * Peças compartilhadas das telas de lista do painel: cabeçalho de página,
 * trilha, avisos, estado vazio e as pílulas de status das tabelas.
 */

/** Botão de ação primária — gradiente de assinatura, texto pearl-0. */
export const primaryBtnCls =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[image:var(--grad-signature)] px-5 py-2.5 text-sm font-semibold text-pearl-0 shadow-[var(--shadow-sm)] transition-[box-shadow,transform] duration-[240ms] ease-[var(--ease-glide)] hover:-translate-y-0.5 hover:shadow-[var(--glow-signature)] disabled:cursor-not-allowed disabled:opacity-60'

/** Ação secundária / neutra. */
export const secondaryBtnCls =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-[var(--surface-card)] px-5 py-2.5 text-sm font-semibold text-[var(--text-strong)] transition-colors duration-[140ms] hover:border-ocean-700 hover:bg-[var(--surface-sunken)]'

/** Ação destrutiva, discreta até o hover. */
export const dangerBtnCls =
  'inline-flex shrink-0 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-danger-500 transition-colors duration-[140ms] hover:border-danger-500 hover:bg-danger-500/8'

/**
 * Cabeçalho de tela: título, contagem de itens e a ação primária sempre visível.
 */
export function PageHeader({
  title, count, action, children,
}: {
  title: string
  /** Frase de contexto — normalmente a contagem de itens. */
  count?: string
  action?: { href: string; label: string }
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-[var(--tracking-display)] text-[var(--text-strong)]">
          {title}
        </h1>
        {count && <p className="mt-1 text-sm text-[var(--text-muted)]">{count}</p>}
      </div>
      {action ? (
        <Link href={action.href} className={primaryBtnCls}>
          {action.label}
        </Link>
      ) : null}
      {children}
    </div>
  )
}

/** Trilha de navegação das telas de formulário. */
export function Breadcrumb({ href, parent, current }: { href: string; parent: string; current: string }) {
  return (
    <nav aria-label="Trilha de navegação" className="text-sm text-[var(--text-muted)]">
      <Link href={href} className="transition-colors duration-[140ms] hover:text-ocean-700">
        {parent}
      </Link>
      <span aria-hidden className="px-1.5">/</span>
      <span className="font-medium text-[var(--color-text-body)]">{current}</span>
    </nav>
  )
}

/** Aviso de sucesso após salvar/excluir. */
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="mt-4 rounded-[var(--radius-sm)] border border-success-500/30 bg-success-500/10 px-4 py-3 text-sm font-medium text-[var(--color-success-text)]"
    >
      {children}
    </p>
  )
}

/**
 * Estado vazio: em vez de uma tabela sem linhas, diz o que aconteceu e qual é
 * o próximo passo.
 */
export function EmptyState({
  title, description, action,
}: {
  title: string
  description: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-card)] px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold tracking-[var(--tracking-display)] text-[var(--text-strong)]">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
        {description}
      </p>
      {action && (
        <Link href={action.href} className={`${primaryBtnCls} mt-6`}>
          {action.label}
        </Link>
      )}
    </div>
  )
}

/**
 * Container de tabela. O scroll horizontal fica AQUI dentro, nunca na página:
 * em telas pequenas a tabela rola sozinha e o resto do layout continua firme.
 */
export function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)]">
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

export const theadCls =
  'border-b border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-left text-xs font-semibold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]'

export const rowCls =
  'transition-colors duration-[140ms] hover:bg-[var(--surface-sunken)]/60'

/** Pílula de status publicado/rascunho, usada como botão de alternância. */
export function StatusPill({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-block rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold transition-colors duration-[140ms] ${
        published
          ? 'bg-success-500/12 text-[var(--color-success-text)] hover:bg-success-500/20'
          : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:bg-[var(--border-subtle)]'
      }`}
    >
      {published ? 'Publicado' : 'Rascunho'}
    </span>
  )
}

/** Miniatura da capa nas listas. */
export function Thumb({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-[var(--radius-xs)] border border-[var(--border-subtle)] bg-[var(--surface-sunken)]">
      {children}
    </div>
  )
}

/** Link "Editar" ao fim de cada linha. */
export function EditLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="font-semibold text-ocean-700 transition-colors duration-[140ms] hover:text-aqua-600"
    >
      Editar
    </Link>
  )
}
