import type { SVGProps } from 'react'

/*
 * Ícones náuticos de traço, no peso do design system (1.5).
 * Usados nos rails de estatística e nos pilares da home.
 */

type P = SVGProps<SVGSVGElement> & { size?: number }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

/** Casco visto de frente — usado para "modelos". */
export const IconHull = ({ size = 22, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3 13h18l-2.2 5.2a2 2 0 0 1-1.85 1.2H7.05a2 2 0 0 1-1.85-1.2L3 13Z" />
    <path d="M12 13V4.5M12 4.5 7.5 8M12 4.5 16.5 8" />
  </svg>
)

/** Âncora — usado para "famílias de casco". */
export const IconAnchor = ({ size = 22, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="4.8" r="1.8" />
    <path d="M12 6.6V20M8.5 10h7" />
    <path d="M4.5 14a7.5 7.5 0 0 0 15 0" />
  </svg>
)

/** Hélice / propulsão — usado para "potência". */
export const IconPropeller = ({ size = 22, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="2" />
    <path d="M12 10c0-3.5-1-6-3-6s-2.4 2.6-1 5.2" />
    <path d="M13.7 13c3 1.7 5.7 2 6.7.3s-1.2-3.4-4-4" />
    <path d="M10.3 13c-3 1.7-5.7 2-6.7.3s1.2-3.4 4-4" />
  </svg>
)

/** Régua — usado para "comprimento / tamanho". */
export const IconRuler = ({ size = 22, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="2.5" y="8.5" width="19" height="7" rx="1.2" />
    <path d="M7 8.5v3M11 8.5v4.5M15 8.5v3M19 8.5v4.5" />
  </svg>
)

/** Escudo com check — garantia. */
export const IconShield = ({ size = 22, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3.2 19 6v5.5c0 4.2-2.9 7.4-7 9.3-4.1-1.9-7-5.1-7-9.3V6l7-2.8Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </svg>
)

/** Compasso / projeto — pilar de design. */
export const IconCompass = ({ size = 22, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m14.8 9.2-1.6 4.2-4.2 1.6 1.6-4.2 4.2-1.6Z" />
  </svg>
)

/** Camadas — laminação / materiais. */
export const IconLayers = ({ size = 22, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="m12 3.5 8.5 4.2-8.5 4.2L3.5 7.7 12 3.5Z" />
    <path d="m3.5 12.2 8.5 4.2 8.5-4.2M3.5 16.4l8.5 4.2 8.5-4.2" />
  </svg>
)

/** Ondas — navegação / testes em água. */
export const IconWaves = ({ size = 22, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M2.5 8.5c1.6 0 1.6 1.6 3.2 1.6s1.6-1.6 3.2-1.6 1.6 1.6 3.2 1.6 1.6-1.6 3.2-1.6 1.6 1.6 3.2 1.6 1.6-1.6 3.2-1.6" />
    <path d="M2.5 13.2c1.6 0 1.6 1.6 3.2 1.6s1.6-1.6 3.2-1.6 1.6 1.6 3.2 1.6 1.6-1.6 3.2-1.6 1.6 1.6 3.2 1.6 1.6-1.6 3.2-1.6" />
    <path d="M2.5 17.9c1.6 0 1.6 1.6 3.2 1.6s1.6-1.6 3.2-1.6 1.6 1.6 3.2 1.6 1.6-1.6 3.2-1.6 1.6 1.6 3.2 1.6 1.6-1.6 3.2-1.6" />
  </svg>
)

/** Chave / assistência técnica. */
export const IconWrench = ({ size = 22, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M15.5 3.5a5 5 0 0 0-4.6 6.9L3.8 17.5a2 2 0 0 0 2.8 2.8l7.1-7.1a5 5 0 0 0 6.2-6.4l-2.9 2.9-2.6-.7-.7-2.6 2.9-2.9a5 5 0 0 0-1.1 0Z" />
  </svg>
)

/** Play — botão de vídeo. */
export const IconPlay = ({ size = 22, ...p }: P) => (
  <svg {...base(size)} {...p} fill="currentColor" stroke="none">
    <path d="M9 6.8v10.4a.7.7 0 0 0 1.07.6l8.2-5.2a.7.7 0 0 0 0-1.2l-8.2-5.2A.7.7 0 0 0 9 6.8Z" />
  </svg>
)

/** Seta para baixo sobre uma base: download de arquivo. */
export const IconDownload = ({ size = 22, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />
  </svg>
)
