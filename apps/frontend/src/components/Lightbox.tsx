'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { getDict } from '@/i18n/dictionary'
import type { Locale } from '@/i18n/config'

export type Img = { url: string; alt: string }

/**
 * Visualizador de fotografias em tela cheia.
 *
 * O anterior mostrava uma foto e duas setas. Este acrescenta o que se espera de
 * uma galeria de produto:
 *
 *  - transição de deslize entre as fotos, com direção que acompanha o comando;
 *  - arrastar com o dedo ou o mouse, seguindo o movimento em tempo real e
 *    decidindo pela velocidade do gesto, não só pela distância percorrida;
 *  - aproximar com duplo toque, roda do mouse ou os botões, arrastando a foto
 *    ampliada para percorrê-la;
 *  - fita de miniaturas que acompanha a foto atual;
 *  - as vizinhas são pré-carregadas, então avançar não mostra tela preta.
 *
 * Vai num portal para `document.body`: dentro da página, qualquer ancestral com
 * `transform`, `filter` ou `backdrop-filter` vira bloco de contenção e o
 * `position: fixed` passa a se medir por ele em vez de pela janela — foi
 * exatamente o que quebrou o menu do celular antes.
 */

/** Distância mínima, em px, para o arrasto trocar de foto. */
const LIMIAR_ARRASTO = 60
/** Acima desta velocidade (px/ms) o gesto troca mesmo sem alcançar o limiar. */
const VELOCIDADE_DE_VIRADA = 0.45
const ZOOM_MAX = 4

export default function Lightbox({
  images,
  inicial,
  aoFechar,
  locale = 'pt',
}: {
  images: Img[]
  inicial: number
  aoFechar: () => void
  locale?: Locale
}) {
  const t = getDict(locale).boat
  const total = images.length

  const [atual, setAtual] = useState(inicial)
  const [montado, setMontado] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  /* Deslocamento do arrasto em curso. `null` quando ninguém está arrastando —
     é o que distingue "parado no zero" de "seguindo o dedo no zero". */
  const [arrasto, setArrasto] = useState<number | null>(null)

  const gesto = useRef<{ x: number; y: number; t: number; panX: number; panY: number } | null>(null)
  const fita = useRef<HTMLDivElement>(null)
  const ultimoToque = useRef(0)

  const ampliado = zoom > 1

  const ir = useCallback(
    (dir: number) => {
      setAtual((i) => (i + dir + total) % total)
      setZoom(1)
      setPan({ x: 0, y: 0 })
    },
    [total],
  )

  /* Espera um quadro antes de animar a entrada: aplicar a classe final no
     mesmo quadro em que o elemento nasce faz o navegador pular a transição. */
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar()
      else if (e.key === 'ArrowRight') ir(1)
      else if (e.key === 'ArrowLeft') ir(-1)
      else if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(ZOOM_MAX, z + 0.5))
      else if (e.key === '-') setZoom((z) => Math.max(1, z - 0.5))
      else if (e.key === '0') { setZoom(1); setPan({ x: 0, y: 0 }) }
    }
    window.addEventListener('keydown', aoTeclar)

    // Trava a rolagem do fundo enquanto o visualizador está aberto.
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = anterior
    }
  }, [aoFechar, ir])

  /* Mantém a miniatura da foto atual visível na fita. */
  useEffect(() => {
    const alvo = fita.current?.querySelector<HTMLElement>(`[data-indice="${atual}"]`)
    alvo?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [atual])

  /* ----------------------------------------------------------- gestos */

  const comecarGesto = (x: number, y: number) => {
    gesto.current = { x, y, t: performance.now(), panX: pan.x, panY: pan.y }
    if (!ampliado) setArrasto(0)
  }

  const moverGesto = (x: number, y: number) => {
    const g = gesto.current
    if (!g) return
    if (ampliado) {
      // Com zoom, o gesto percorre a própria foto em vez de trocar de imagem.
      setPan({ x: g.panX + (x - g.x), y: g.panY + (y - g.y) })
    } else {
      setArrasto(x - g.x)
    }
  }

  const terminarGesto = (x: number) => {
    const g = gesto.current
    gesto.current = null
    if (!g || ampliado) return

    const distancia = x - g.x
    const decorrido = Math.max(1, performance.now() - g.t)
    const velocidade = Math.abs(distancia) / decorrido

    if (Math.abs(distancia) > LIMIAR_ARRASTO || velocidade > VELOCIDADE_DE_VIRADA) {
      ir(distancia < 0 ? 1 : -1)
    }
    setArrasto(null)
  }

  const aoTocar = () => {
    // Duplo toque alterna entre tamanho normal e ampliado.
    const agora = performance.now()
    if (agora - ultimoToque.current < 300) {
      if (ampliado) { setZoom(1); setPan({ x: 0, y: 0 }) }
      else setZoom(2)
    }
    ultimoToque.current = agora
  }

  const img = images[atual]
  const deslocamento = arrasto ?? 0

  const corpo = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.galleryAria}
      className={`fixed inset-0 z-[120] flex flex-col bg-navy-900/97 transition-opacity duration-300 ${
        montado ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backdropFilter: 'blur(4px)' }}
    >
      {/* Barra superior: contagem, zoom e fechar. */}
      <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <span className="font-mono text-xs tabular-nums text-white/70">
          {atual + 1} / {total}
        </span>

        <div className="flex items-center gap-1">
          <BotaoIcone
            rotulo={t.zoomOut}
            desabilitado={zoom <= 1}
            aoClicar={() => setZoom((z) => Math.max(1, z - 0.5))}
          >
            <path d="M5 12h14" />
          </BotaoIcone>
          <button
            type="button"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
            aria-label={t.zoomReset}
            className="min-w-14 rounded-[var(--radius-pill)] px-2 py-2 font-mono text-xs tabular-nums text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            {Math.round(zoom * 100)}%
          </button>
          <BotaoIcone
            rotulo={t.zoomIn}
            desabilitado={zoom >= ZOOM_MAX}
            aoClicar={() => setZoom((z) => Math.min(ZOOM_MAX, z + 0.5))}
          >
            <path d="M12 5v14M5 12h14" />
          </BotaoIcone>
          <BotaoIcone rotulo={t.close} aoClicar={aoFechar}>
            <path d="M6 6l12 12M18 6L6 18" />
          </BotaoIcone>
        </div>
      </div>

      {/* Palco da fotografia. */}
      <div
        className="relative min-h-0 flex-1 select-none overflow-hidden"
        onPointerDown={(e) => {
          ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
          comecarGesto(e.clientX, e.clientY)
          aoTocar()
        }}
        onPointerMove={(e) => gesto.current && moverGesto(e.clientX, e.clientY)}
        onPointerUp={(e) => terminarGesto(e.clientX)}
        onPointerCancel={() => { gesto.current = null; setArrasto(null) }}
        onWheel={(e) => {
          if (!e.ctrlKey && !ampliado) return
          setZoom((z) => Math.min(ZOOM_MAX, Math.max(1, z - e.deltaY * 0.003)))
        }}
        onClick={(e) => {
          // Clicar no vazio fecha; sobre a foto, não.
          if (e.target === e.currentTarget && !ampliado) aoFechar()
        }}
        style={{ cursor: ampliado ? 'grab' : total > 1 ? 'ew-resize' : 'default' }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center p-3 sm:p-8"
          style={{
            transform: `translate3d(${deslocamento + pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            /* Sem transição enquanto o dedo está na tela: a foto precisa
               acompanhar o movimento, não perseguí-lo com atraso. */
            transition: arrasto === null ? 'transform 320ms var(--ease-glide)' : 'none',
          }}
        >
          <div className="relative h-full w-full">
            <Image
              key={img.url}
              src={img.url}
              alt={img.alt}
              fill
              sizes="100vw"
              priority
              draggable={false}
              className="object-contain"
            />
          </div>
        </div>

        {/* Vizinhas, fora da vista, só para o navegador já as ter em mãos. */}
        {total > 1 && (
          <div aria-hidden className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0">
            {[-1, 1].map((d) => {
              const vizinha = images[(atual + d + total) % total]
              return (
                <Image key={`${d}-${vizinha.url}`} src={vizinha.url} alt="" width={64} height={64} />
              )
            })}
          </div>
        )}

        {total > 1 && !ampliado && (
          <>
            <Seta lado="esquerda" rotulo={t.prev} aoClicar={() => ir(-1)} />
            <Seta lado="direita" rotulo={t.next} aoClicar={() => ir(1)} />
          </>
        )}
      </div>

      {/* Legenda, quando a foto tem uma que valha a pena mostrar. */}
      {img.alt && (
        <p className="shrink-0 px-6 pb-1 pt-2 text-center text-[13px] leading-snug text-white/60">
          {img.alt}
        </p>
      )}

      {/* Fita de miniaturas. */}
      {total > 1 && (
        <div
          ref={fita}
          aria-label={t.thumbnails}
          className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3 sm:px-6 [scrollbar-width:thin]"
        >
          {images.map((m, i) => (
            <button
              key={m.url + i}
              data-indice={i}
              type="button"
              onClick={() => { setAtual(i); setZoom(1); setPan({ x: 0, y: 0 }) }}
              aria-label={`${i + 1} / ${total}`}
              aria-current={i === atual}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-[var(--radius-xs)] transition-all duration-200 ${
                i === atual
                  ? 'opacity-100 ring-2 ring-aqua-600'
                  : 'opacity-45 hover:opacity-80'
              }`}
            >
              <Image src={m.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return createPortal(corpo, document.body)
}

function BotaoIcone({
  children,
  rotulo,
  aoClicar,
  desabilitado,
}: {
  children: React.ReactNode
  rotulo: string
  aoClicar: () => void
  desabilitado?: boolean
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={desabilitado}
      aria-label={rotulo}
      className="rounded-[var(--radius-pill)] p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        {children}
      </svg>
    </button>
  )
}

function Seta({
  lado,
  rotulo,
  aoClicar,
}: {
  lado: 'esquerda' | 'direita'
  rotulo: string
  aoClicar: () => void
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); aoClicar() }}
      aria-label={rotulo}
      className={`absolute top-1/2 hidden -translate-y-1/2 rounded-full bg-navy-900/50 p-3 text-white/70 transition-all duration-200 hover:bg-navy-900/80 hover:text-white sm:block ${
        lado === 'esquerda' ? 'left-4' : 'right-4'
      }`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={lado === 'direita' ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} />
      </svg>
    </button>
  )
}
