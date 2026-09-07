import type { Metadata } from 'next'

/**
 * Monta `alternates` com hreflang RECÍPROCO.
 *
 * O Google exige que cada página do conjunto liste todas as variantes,
 * inclusive ela mesma. Um cluster sem autorreferência costuma ser ignorado
 * por inteiro — era o caso aqui: cada página declarava só a outra língua.
 *
 * `x-default` aponta para o português, que é a versão principal do site.
 */
export function alternates(pt: string, en: string): Metadata['alternates'] {
  return {
    canonical: pt === '/' ? '/' : pt,
    languages: {
      'pt-BR': pt,
      en,
      'x-default': pt,
    },
  }
}

/** Igual, mas quando a página corrente é a inglesa (muda só o canonical). */
export function alternatesEn(pt: string, en: string): Metadata['alternates'] {
  return {
    canonical: en,
    languages: {
      'pt-BR': pt,
      en,
      'x-default': pt,
    },
  }
}
