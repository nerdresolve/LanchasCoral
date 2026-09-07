'use client'

import { useState } from 'react'
import Image from 'next/image'
import Lightbox, { type Img } from './Lightbox'
import { getDict } from '@/i18n/dictionary'
import type { Locale } from '@/i18n/config'

/**
 * Galeria do modelo.
 *
 * Na página fica um mosaico editorial — um quadro grande ao lado de dois
 * empilhados — e o conjunto completo abre no visualizador em tela cheia
 * (`Lightbox`), começando pela fotografia que foi clicada.
 */
export default function Gallery({
  images,
  locale = 'pt',
}: {
  images: Img[]
  locale?: Locale
}) {
  const t = getDict(locale).boat
  /* `null` = fechado. Guardar o índice em vez de um booleano evita o estado
     impossível "aberto sem foto escolhida". */
  const [aberto, setAberto] = useState<number | null>(null)

  const count = images.length
  if (count === 0) return null

  const open = (i: number) => setAberto(i)

  const [lead, ...rest] = images
  const side = rest.slice(0, 2)
  /** Fotos que o mosaico não mostra; viram o selo "+N" no último quadro. */
  const restantes = count - 1 - side.length

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <button
          type="button"
          onClick={() => open(0)}
          aria-label={`${t.enlarge}: ${lead.alt}`}
          className="group relative col-span-1 aspect-[16/10] overflow-hidden rounded-[var(--radius-xs)] bg-navy-800 lg:col-span-8"
        >
          <Image
            src={lead.url}
            alt={lead.alt}
            fill
            priority
            sizes="(min-width: 1024px) 66vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        </button>

        {side.length > 0 && (
          <div className="col-span-1 grid grid-cols-2 gap-4 lg:col-span-4 lg:grid-cols-1">
            {side.map((img, i) => (
              <button
                key={img.url + i}
                type="button"
                onClick={() => open(i + 1)}
                aria-label={`${t.enlarge}: ${img.alt}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xs)] bg-navy-800 lg:aspect-auto"
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                {/* No último quadro, quantas fotos ainda não aparecem. Sem
                    isto, nada indica que o mosaico é só uma amostra. */}
                {i === side.length - 1 && restantes > 0 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-navy-900/55 font-display text-2xl font-semibold text-pearl-0 transition-colors duration-300 group-hover:bg-navy-900/40">
                    +{restantes}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-[22px] flex items-center justify-between gap-4">
        <span className="font-mono text-xs text-[var(--text-muted)]">
          {t.photos(count)}
        </span>
        {count > 1 && (
          <button
            type="button"
            onClick={() => open(0)}
            className="inline-flex min-h-11 items-center font-body text-xs font-bold uppercase tracking-[var(--tracking-wide)] text-ocean-700 transition-colors hover:text-aqua-600"
          >
            {t.viewGallery}
          </button>
        )}
      </div>

      {aberto !== null && (
        <Lightbox
          images={images}
          inicial={aberto}
          aoFechar={() => setAberto(null)}
          locale={locale}
        />
      )}
    </>
  )
}
