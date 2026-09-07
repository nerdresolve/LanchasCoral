import Image from 'next/image'

/**
 * Fotografia de fundo do hero.
 *
 * Substituiu o embed de vídeo do YouTube: o player entrava num iframe 16:9 que
 * não preenchia a área do hero e deixava faixas laterais, além de custar caro
 * no carregamento. Uma fotografia estática é o próprio elemento de LCP.
 *
 * São dois enquadramentos, não dois tamanhos:
 *  - retrato (1170x2000) no celular, onde o hero é bem mais alto que largo;
 *  - paisagem (2560x1707) a partir de `sm`.
 *
 * A troca é feita com DUAS `next/image` alternadas por CSS, e não com um
 * `<picture>` de vários `<source>`. O motivo é medido: dentro de `<picture>` o
 * Chrome nunca registrava a foto como candidata a LCP — o trace mostrava zero
 * candidatos e oito invalidações, e o Lighthouse caía em `NO_LCP`. Com o
 * `<img>` que o `next/image` emite, o candidato aparece normalmente.
 *
 * O custo é uma tag a mais no HTML; só uma das duas é baixada, porque
 * `display: none` impede a busca e os `sizes` declaram larguras diferentes.
 *
 * Os arquivos são gerados por `audit/gerar-hero.mjs`.
 */
const PAISAGEM = '/brand/hero-home-1920.jpg'
const RETRATO = '/brand/hero-home-portrait-1170.jpg'

export default function HeroImage({ alt = '', className = '' }: { alt?: string; className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden bg-navy-900 ${className}`}>
      {/* Celular: recorte retrato. `sm:hidden` evita a busca do arquivo. */}
      <Image
        src={RETRATO}
        alt={alt}
        fill
        priority
        fetchPriority="high"
        quality={72}
        sizes="100vw"
        className="object-cover object-[52%_center] sm:hidden"
      />
      {/* Tablet e desktop: enquadramento paisagem. */}
      <Image
        src={PAISAGEM}
        alt={alt}
        fill
        priority
        fetchPriority="high"
        quality={72}
        sizes="100vw"
        className="hidden object-cover object-[68%_center] sm:block"
      />
    </div>
  )
}
