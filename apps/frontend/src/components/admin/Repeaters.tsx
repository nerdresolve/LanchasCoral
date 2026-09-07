'use client'

import { useState } from 'react'
import { HOSTS_DE_IMAGEM } from '@/lib/campos'

const inputCls =
  'w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-strong)] outline-none transition-colors duration-[140ms] placeholder:text-[var(--text-muted)] hover:border-[var(--border-strong)] focus:border-ocean-700'

/** Botão "Adicionar" dos repetidores. */
const addBtnCls =
  'shrink-0 rounded-[var(--radius-pill)] bg-[image:var(--grad-signature)] px-4 py-2 text-sm font-semibold text-pearl-0 shadow-[var(--shadow-sm)] transition-[box-shadow] duration-[240ms] hover:shadow-[var(--glow-signature)]'

/** Botão de ícone (mover / remover). */
const iconBtnCls =
  'rounded-[var(--radius-xs)] p-1 text-[var(--text-muted)] transition-colors duration-[140ms] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]'

const removeBtnCls =
  'rounded-[var(--radius-xs)] p-1 text-danger-500 transition-colors duration-[140ms] hover:bg-danger-500/10'

/* ---------------- Images ---------------- */

export type ImageRow = { url: string; alt?: string }

export function ImagesField({ name, initial }: { name: string; initial: ImageRow[] }) {
  const [rows, setRows] = useState<ImageRow[]>(initial)
  const [bulk, setBulk] = useState('')
  const [aviso, setAviso] = useState('')

  const move = (i: number, dir: number) => {
    const j = i + dir
    if (j < 0 || j >= rows.length) return
    const next = [...rows]
    ;[next[i], next[j]] = [next[j], next[i]]
    setRows(next)
  }

  /*
   * Colagem em lote.
   *
   * Antes, o que não casasse com o padrão de URL era descartado calado: colar
   * um endereço torto não acrescentava linha nenhuma e parecia que o botão
   * estava quebrado. Agora o que foi recusado é dito, com o motivo.
   *
   * Os hosts conferidos aqui são os mesmos de `HOSTS_DE_IMAGEM`, usados pelo
   * servidor. A checagem no navegador é conveniência — quem decide é o
   * schema —, mas evita o operador salvar o formulário inteiro só para
   * descobrir que uma foto não era aceita.
   */
  const addBulk = () => {
    const pedacos = bulk.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)
    if (!pedacos.length) return

    const aceitas: string[] = []
    const recusadas: string[] = []

    for (const p of pedacos) {
      if (p.startsWith('/')) { aceitas.push(p); continue }
      let u: URL | null = null
      try { u = new URL(p) } catch { u = null }
      const hostOk =
        u?.protocol === 'https:' &&
        HOSTS_DE_IMAGEM.some((h) => u!.hostname === h || u!.hostname.endsWith(`.${h}`))
      if (hostOk) aceitas.push(p)
      else recusadas.push(p)
    }

    if (aceitas.length) setRows([...rows, ...aceitas.map((url) => ({ url }))])
    setBulk(recusadas.join(' '))
    setAviso(
      recusadas.length
        ? `${recusadas.length === 1 ? 'Um endereço não foi aceito' : `${recusadas.length} endereços não foram aceitos`}: as fotos precisam começar com https:// e vir de ${HOSTS_DE_IMAGEM.join(', ')}.`
        : '',
    )
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />

      <div className="flex gap-2">
        <input
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          placeholder="Cole um ou mais endereços de foto"
          className={inputCls}
        />
        <button
          type="button"
          onClick={addBulk}
          className={addBtnCls}
        >
          Adicionar
        </button>
      </div>

      {aviso && (
        <p role="status" className="mt-2 text-xs font-medium text-danger-500">{aviso}</p>
      )}

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">Nenhuma imagem. A primeira será usada como capa.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((r, i) => (
            <li key={`${r.url}-${i}`} className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.url} alt="" className="h-12 w-16 shrink-0 rounded-[var(--radius-xs)] border border-[var(--border-subtle)] bg-[var(--surface-sunken)] object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-[var(--text-muted)]">{r.url}</p>
                <input
                  value={r.alt ?? ''}
                  onChange={(e) => {
                    const next = [...rows]
                    next[i] = { ...r, alt: e.target.value }
                    setRows(next)
                  }}
                  placeholder="Texto alternativo (acessibilidade)"
                  className="mt-1 w-full rounded-[var(--radius-xs)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-2 py-1 text-xs text-[var(--text-strong)] outline-none focus:border-ocean-700"
                />
              </div>
              {i === 0 && (
                <span className="shrink-0 rounded-[var(--radius-xs)] bg-ocean-700/12 px-2 py-1 text-[10px] font-semibold tracking-[var(--tracking-wide)] text-ocean-700">
                  CAPA
                </span>
              )}
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  aria-label="Mover para cima"
                  className={iconBtnCls}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  aria-label="Mover para baixo"
                  className={iconBtnCls}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setRows(rows.filter((_, x) => x !== i))}
                  aria-label="Remover imagem"
                  className={removeBtnCls}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------------- Equipment ---------------- */

export type EquipRow = { panel: string; text: string; textEn?: string }

const PANELS = ['Descrição', 'Equipamentos de série']

export function EquipmentField({ name, initial }: { name: string; initial: EquipRow[] }) {
  const [rows, setRows] = useState<EquipRow[]>(initial)
  const [panel, setPanel] = useState(PANELS[1])
  const [text, setText] = useState('')

  const add = () => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length) setRows([...rows, ...lines.map((t) => ({ panel, text: t, textEn: '' }))])
    setText('')
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />

      <select
        value={panel}
        onChange={(e) => setPanel(e.target.value)}
        className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-strong)]"
      >
        {PANELS.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Um item por linha"
        className={`mt-2 ${inputCls}`}
      />
      <button
        type="button"
        onClick={add}
        className={`mt-2 ${addBtnCls}`}
      >
        Adicionar itens
      </button>

      {PANELS.map((p) => {
        const items = rows.map((r, i) => ({ ...r, i })).filter((r) => r.panel === p)
        if (!items.length) return null
        return (
          <div key={p} className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">{p}</p>
            <ul className="mt-2 space-y-1">
              {items.map((r) => (
                <li
                  key={r.i}
                  className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2"
                >
                  <div className="flex items-start gap-2">
                    <span className="flex-1 text-sm text-[var(--color-text-body)]">{r.text}</span>
                    <button
                      type="button"
                      onClick={() => setRows(rows.filter((_, x) => x !== r.i))}
                      aria-label="Remover item"
                      className="shrink-0 text-danger-500 transition-opacity duration-[140ms] hover:opacity-70"
                    >
                      ✕
                    </button>
                  </div>
                  {/* Tradução opcional; vazia usa o texto em português. */}
                  <input
                    value={r.textEn ?? ''}
                    onChange={(e) =>
                      setRows(
                        rows.map((row, x) =>
                          x === r.i ? { ...row, textEn: e.target.value } : row,
                        ),
                      )
                    }
                    placeholder="EN (opcional)"
                    aria-label={`Tradução em inglês de: ${r.text}`}
                    className="mt-1.5 w-full rounded-[var(--radius-xs)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-2 py-1 text-xs text-[var(--color-text-body)] outline-none focus:border-ocean-700"
                  />
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

/* ---------------- Performance ---------------- */

export type PerfRow = {
  label: string
  fuel?: string | null
  cruiseLh?: number | null
  avgLh?: number | null
}

export function PerformanceField({ name, initial }: { name: string; initial: PerfRow[] }) {
  const [rows, setRows] = useState<PerfRow[]>(initial)

  const set = (i: number, patch: Partial<PerfRow>) => {
    const next = [...rows]
    next[i] = { ...next[i], ...patch }
    setRows(next)
  }
  const num = (v: string) => (v === '' ? null : Number(v))

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />

      {rows.length === 0 && (
        <p className="text-sm text-[var(--text-muted)]">Nenhuma opção de motorização cadastrada.</p>
      )}

      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4">
            <div className="flex items-center gap-2">
              <input
                value={r.label}
                onChange={(e) => set(i, { label: e.target.value })}
                placeholder="Ex.: 2x 4.5 250HP - Gasolina"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setRows(rows.filter((_, x) => x !== i))}
                aria-label="Remover motorização"
                className={`shrink-0 ${removeBtnCls}`}
              >
                ✕
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="text-xs text-[var(--text-muted)]">
                Combustível
                <input
                  value={r.fuel ?? ''}
                  onChange={(e) => set(i, { fuel: e.target.value || null })}
                  placeholder="Gasolina / Diesel"
                  className={`mt-1 ${inputCls}`}
                />
              </label>
              <label className="text-xs text-[var(--text-muted)]">
                Consumo em cruzeiro (L/h)
                <input
                  type="number"
                  value={r.cruiseLh ?? ''}
                  onChange={(e) => set(i, { cruiseLh: num(e.target.value) })}
                  className={`mt-1 ${inputCls}`}
                />
              </label>
              <label className="text-xs text-[var(--text-muted)]">
                Consumo médio (L/h)
                <input
                  type="number"
                  value={r.avgLh ?? ''}
                  onChange={(e) => set(i, { avgLh: num(e.target.value) })}
                  className={`mt-1 ${inputCls}`}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRows([...rows, { label: '', fuel: null, cruiseLh: null, avgLh: null }])}
        className="mt-3 rounded-[var(--radius-pill)] border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold text-[var(--text-strong)] transition-colors duration-[140ms] hover:border-ocean-700 hover:bg-[var(--surface-sunken)]"
      >
        + Adicionar motorização
      </button>
    </div>
  )
}

/* ---------------- Accessories (Coral Broker) ---------------- */

export type AccessoryRow = { text: string }

/** Lista simples de itens de série/opcionais de um anúncio de seminovo. */
export function AccessoriesField({ name, initial }: { name: string; initial: AccessoryRow[] }) {
  const [rows, setRows] = useState<AccessoryRow[]>(initial)
  const [text, setText] = useState('')

  const move = (i: number, dir: number) => {
    const j = i + dir
    if (j < 0 || j >= rows.length) return
    const next = [...rows]
    ;[next[i], next[j]] = [next[j], next[i]]
    setRows(next)
  }

  const add = () => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length) setRows([...rows, ...lines.map((t) => ({ text: t }))])
    setText('')
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Um acessório por linha"
        className={inputCls}
      />
      <button
        type="button"
        onClick={add}
        className={`mt-2 ${addBtnCls}`}
      >
        Adicionar itens
      </button>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">Nenhum acessório cadastrado.</p>
      ) : (
        <ul className="mt-4 space-y-1">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2">
              <input
                value={r.text}
                onChange={(e) => setRows(rows.map((row, x) => (x === i ? { text: e.target.value } : row)))}
                aria-label={`Acessório ${i + 1}`}
                className="flex-1 rounded-[var(--radius-xs)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-2 py-1 text-sm text-[var(--color-text-body)] outline-none focus:border-ocean-700"
              />
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  aria-label="Mover para cima"
                  className={iconBtnCls}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  aria-label="Mover para baixo"
                  className={iconBtnCls}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setRows(rows.filter((_, x) => x !== i))}
                  aria-label="Remover acessório"
                  className={removeBtnCls}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
