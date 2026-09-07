'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Animação de entrada discreta: o bloco sobe alguns pixels e ganha opacidade
 * quando entra na viewport.
 *
 * Escolhas feitas de propósito, pensando em SEO e peso:
 *  - o conteúdo é renderizado no servidor e já vem no HTML — a animação só
 *    altera `opacity`/`transform`, então nada fica oculto para o buscador;
 *  - sem biblioteca: um IntersectionObserver e duas classes;
 *  - anima uma única vez e desconecta o observer em seguida;
 *  - respeita `prefers-reduced-motion`, aparecendo direto no estado final.
 */
export default function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = '',
}: {
  children: ReactNode
  /** Atraso em ms, para escalonar itens de uma mesma linha. */
  delay?: number
  as?: 'div' | 'section' | 'li'
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setVisible(true)
        io.disconnect()
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as never}
      data-reveal
      className={`h-full motion-safe:transition-[opacity,transform] motion-safe:duration-[620ms] motion-safe:ease-[var(--ease-glide)] ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 motion-reduce:opacity-100 motion-reduce:translate-y-0'
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : undefined }}
    >
      {children}
    </Tag>
  )
}
