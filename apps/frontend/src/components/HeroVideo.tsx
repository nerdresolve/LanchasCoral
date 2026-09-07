'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Vídeo de fundo do hero, por cima da foto.
 *
 * ## A imagem continua sendo o LCP
 *
 * O hero é o elemento que o Lighthouse mede como Largest Contentful Paint, e
 * um vídeo pesado ali derruba a nota. Por isso a `heroImage` segue carregando
 * com `priority` e é ela que pinta primeiro; o vídeo só aparece depois de ter
 * quadro para mostrar (`canplay`), com uma transição suave.
 *
 * `preload="none"` até a página assentar: começar a buscar o vídeo junto com
 * a foto faria os dois disputarem a mesma banda, e a foto — que é o que a
 * métrica enxerga — chegaria mais tarde.
 *
 * ## Quem não quer movimento não recebe
 *
 * `prefers-reduced-motion` não é preferência estética: vídeo em laço no fundo
 * provoca desconforto real em quem tem sensibilidade vestibular. Nesses casos
 * o vídeo nem é buscado, e a foto fica.
 *
 * O mesmo vale para conexão limitada (`saveData`) e rede lenta — baixar
 * alguns megabytes de enfeite no 3G de alguém não se justifica.
 */
export default function HeroVideo({
  src,
  /** Descrição para leitor de tela. Vazia quando é puro enfeite. */
  titulo,
}: {
  src: string
  titulo?: string
}) {
  const video = useRef<HTMLVideoElement>(null)
  const [pronto, setPronto] = useState(false)
  const [liberado, setLiberado] = useState(false)

  useEffect(() => {
    const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (semMovimento) return

    /* `connection` não existe em todo navegador; onde existe, respeita. */
    const rede = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string }
      }
    ).connection
    if (rede?.saveData) return
    if (rede?.effectiveType && /^(slow-)?2g$/.test(rede.effectiveType)) return

    /*
     * Espera a página assentar antes de buscar o vídeo. Sem isto ele disputa
     * banda com a foto do hero, que é o elemento medido como LCP.
     */
    const liberar = () => setLiberado(true)
    if (document.readyState === 'complete') {
      const id = window.setTimeout(liberar, 400)
      return () => window.clearTimeout(id)
    }
    window.addEventListener('load', liberar, { once: true })
    return () => window.removeEventListener('load', liberar)
  }, [])

  useEffect(() => {
    const el = video.current
    if (!liberado || !el) return

    el.src = src
    el.load()

    /* `play()` devolve uma promessa que rejeita quando o navegador barra a
       reprodução automática. Sem o catch, vira erro não tratado no console. */
    const aoPoderTocar = () => {
      setPronto(true)
      void el.play().catch(() => {})
    }
    el.addEventListener('canplay', aoPoderTocar, { once: true })
    return () => el.removeEventListener('canplay', aoPoderTocar)
  }, [liberado, src])

  return (
    <video
      ref={video}
      /* `muted` e `playsInline` são o que permite tocar sozinho: com áudio, ou
         em tela cheia no iOS, o navegador barra. */
      muted
      loop
      playsInline
      preload="none"
      aria-label={titulo || undefined}
      aria-hidden={titulo ? undefined : true}
      tabIndex={-1}
      className={`pointer-events-none absolute inset-0 -z-30 h-full w-full object-cover transition-opacity duration-700 ease-[var(--ease-glide)] ${
        pronto ? 'opacity-100' : 'opacity-0'
      }`}
    />
  )
}
