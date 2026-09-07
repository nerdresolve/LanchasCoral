'use client'

import { useRouter } from 'next/navigation'
import CabecalhoLado from './CabecalhoLado'
import LinhasComparacao from './LinhasComparacao'
import { type OpcaoModelo } from './TrocarModelo'
import { href as routeHref, type Locale } from '@/i18n/config'
import type { GrupoComparacao, Caracteristicas } from '@/lib/comparar'

/**
 * A mesma comparação do painel, na página com endereço próprio.
 *
 * Reaproveita os componentes do painel para as duas experiências serem
 * idênticas — trocar modelo, trocar foto, esconder o que é igual e pedir
 * proposta funcionam igual aqui.
 *
 * A diferença é o que acontece ao trocar: aqui a URL muda, porque é ela que
 * registra o que está sendo comparado. Assim recarregar ou compartilhar
 * mostra o mesmo par.
 */

type Lado = {
  slug: string
  rotulo: string
  descricao: string | null
  foto: string | null
  fotos: string[]
}

export default function ComparacaoNaPagina({
  a,
  b,
  grupos,
  caracteristicas,
  opcoes,
  locale = 'pt',
}: {
  a: Lado
  b: Lado
  grupos: GrupoComparacao[]
  caracteristicas: Caracteristicas
  opcoes: OpcaoModelo[]
  locale?: Locale
}) {
  const router = useRouter()

  const trocar = (lado: 'a' | 'b', slug: string) => {
    const p = new URLSearchParams({
      a: lado === 'a' ? slug : a.slug,
      b: lado === 'b' ? slug : b.slug,
    })
    router.push(`${routeHref('comparar', locale)}?${p}`)
  }

  return (
    <div className="mx-auto w-full max-w-[var(--layout-narrow)]">
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:gap-4">
        <CabecalhoLado
          {...a}
          outroSlug={b.slug}
          opcoes={opcoes}
          aoTrocar={(s) => trocar('a', s)}
          locale={locale}
        />
        <div aria-hidden />
        <CabecalhoLado
          {...b}
          outroSlug={a.slug}
          opcoes={opcoes}
          aoTrocar={(s) => trocar('b', s)}
          locale={locale}
        />
      </div>

      <LinhasComparacao
        grupos={grupos}
        caracteristicas={caracteristicas}
        rotuloA={a.rotulo}
        rotuloB={b.rotulo}
        locale={locale}
      />
    </div>
  )
}
