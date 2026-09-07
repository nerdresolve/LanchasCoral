'use client'

import { useState } from 'react'

type Item = { panel: string; text: string }

/**
 * Equipment disclosure list. The design draws it as hairline rules with a
 * +/− affordance and a two-column bulleted body — no boxes, no fills.
 * The first panel opens by default, matching the artboard.
 */
export default function EquipmentPanels({ items }: { items: Item[] }) {
  const panels = items.reduce<Record<string, string[]>>((acc, i) => {
    ;(acc[i.panel] ??= []).push(i.text)
    return acc
  }, {})
  const names = Object.keys(panels)
  const [open, setOpen] = useState<string | null>(names[0] ?? null)

  if (names.length === 0) return null

  return (
    <div className="border-t border-[var(--border-subtle)]">
      {names.map((name) => {
        const isOpen = open === name
        return (
          <div key={name} className="border-b border-[var(--border-subtle)]">
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : name)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-6 py-[30px] text-left"
              >
                <span className="font-display text-xl font-semibold tracking-[var(--tracking-display)] text-[var(--text-strong)]">
                  {name}
                </span>
                <span
                  aria-hidden
                  className="shrink-0 font-mono text-xl leading-none text-ocean-700"
                >
                  {isOpen ? '−' : '+'}
                </span>
              </button>
            </h3>

            {isOpen && (
              <ul className="grid grid-cols-1 gap-x-14 gap-y-3.5 pb-[34px] sm:grid-cols-2">
                {panels[name].map((text, i) => (
                  <li key={i} className="flex items-start gap-3.5">
                    <span
                      aria-hidden
                      className="mt-[9px] block h-1 w-1 shrink-0 rounded-full bg-aqua-500"
                    />
                    <span className="text-sm leading-[1.65] text-[var(--color-text-body)]">{text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
