'use client'

import { useActionState } from 'react'
import { loginAction } from '../actions'
import { Logo } from '@/components/ui'

const inputCls =
  'mt-1.5 w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2.5 text-sm text-[var(--text-strong)] outline-none transition-colors duration-[140ms] placeholder:text-[var(--text-muted)] hover:border-[var(--border-strong)] focus:border-ocean-700'

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined)

  return (
    <div className="grid min-h-dvh place-items-center bg-[image:var(--grad-deep)] px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo variant="white" height={30} priority />
        </div>

        <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-7 shadow-[var(--shadow-lg)]">
          <h1 className="font-display text-xl font-semibold tracking-[var(--tracking-display)] text-[var(--text-strong)]">
            Painel administrativo
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            Entre para gerenciar os modelos e anúncios.
          </p>

          <form action={action} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-body)]">
                E-mail
              </label>
              <input
                id="email" name="email" type="email" required autoComplete="email"
                placeholder="voce@coral.com.br"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-body)]">
                Senha
              </label>
              <input
                id="password" name="password" type="password" required autoComplete="current-password"
                className={inputCls}
              />
            </div>

            {state?.error && (
              <p
                role="alert"
                className="rounded-[var(--radius-sm)] border border-danger-500/30 bg-danger-500/10 px-3 py-2 text-sm font-medium text-danger-500"
              >
                {state.error}
              </p>
            )}

            <button
              type="submit" disabled={pending}
              className="w-full rounded-[var(--radius-pill)] bg-[image:var(--grad-signature)] px-4 py-3 text-sm font-semibold text-pearl-0 shadow-[var(--shadow-sm)] transition-[box-shadow,opacity] duration-[240ms] ease-[var(--ease-glide)] hover:shadow-[var(--glow-signature)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
