'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import TrocarModelo, { type OpcaoModelo } from './TrocarModelo'
import QuoteDialog from '@/components/QuoteDialog'
import { getDict } from '@/i18n/dictionary'
import { href as routeHref, type Locale } from '@/i18n/config'

/**
 * Um lado da comparação: foto, nome, e o que dá para fazer com ele.
 *
 * Aqui mora a diferença entre uma tabela e uma ferramenta. Sem sair do
 * painel dá para: trocar o modelo deste lado, ver outras fotos dele, abrir a
 * ficha completa e pedir proposta. Antes, qualquer uma dessas exigia fechar
 * a comparação — e, na prática, recomeçá-la.
 */
export default function CabecalhoLado({
  slug,
  rotulo,
  descricao,
  fotos,
  outroSlug,
  opcoes,
  aoTrocar,
  locale = 'pt',
}: {
  slug: string
  rotulo: string
  descricao: string | null
  fotos: string[]
  outroSlug: string
  opcoes: OpcaoModelo[]
  aoTrocar: (slug: string) => void
  locale?: Locale
}) {
  const t = getDict(locale).compare
  const [foto, setFoto] = useState(0)

  /* O índice volta ao começo quando o modelo muda: sem isso, trocar um
     modelo de 6 fotos por um de 2 deixaria o índice apontando para o vazio. */
  const [slugAnterior, setSlugAnterior] = useState(slug)
  if (slug !== slugAnterior) {
    setSlugAnterior(slug)
    setFoto(0)
  }

  const atual = fotos[foto] ?? fotos[0] ?? null

  return (
    /*
     * Coluna de altura total com os botões na base.
     *
     * Sem isto, cada lado empilhava por conta própria: uma descrição de três
     * linhas contra uma de duas jogava os botões da esquerda 39px abaixo dos
     * da direita, e no celular o desencontro fica evidente. `h-full` recebe a
     * altura da linha da grade (que é a do lado mais alto) e `mt-auto` no
     * bloco de botões come a sobra, então os dois terminam juntos.
     */
    <div className="flex h-full min-w-0 flex-col">
      {/* 16:10 e não 4:3: no painel a foto divide espaço com a tabela, e o
          formato mais baixo deixa as primeiras linhas visíveis sem rolar. */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-md)] bg-navy-800">
        {atual && (
          <Image
            key={atual}
            src={atual}
            alt=""
            fill
            sizes="(min-width: 820px) 390px, 46vw"
            className="object-cover"
          />
        )}

        {/* Miniaturas sobre a foto: trocar sem tirar o olho do modelo. */}
        {fotos.length > 1 && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5 bg-gradient-to-t from-navy-900/70 to-transparent p-2">
            {fotos.map((f, i) => (
              <button
                key={f}
                type="button"
                onClick={() => setFoto(i)}
                aria-label={`${i + 1} / ${fotos.length}`}
                aria-current={i === foto}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === foto ? 'w-5 bg-pearl-0' : 'w-1.5 bg-pearl-0/55 hover:bg-pearl-0/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
        <h2 className="min-w-0 font-display text-lg font-semibold leading-tight tracking-[var(--tracking-display)] text-[var(--text-strong)] sm:text-xl">
          {rotulo}
        </h2>
        <TrocarModelo
          atual={slug}
          outro={outroSlug}
          opcoes={opcoes}
          aoEscolher={aoTrocar}
          locale={locale}
        />
      </div>

      {descricao && (
        <p className="mt-1.5 text-[13px] leading-[1.5] text-[var(--text-muted)] sm:text-sm">
          {descricao}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        <QuoteDialog locale={locale} boatSlug={slug} boatLabel={rotulo}>
          <button
            type="button"
            className="inline-flex min-h-10 items-center rounded-[var(--radius-pill)] bg-ocean-700 px-4 font-body text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-pearl-0 transition-colors duration-[240ms] hover:bg-ocean-600"
          >
            {t.requestQuote}
          </button>
        </QuoteDialog>

        <Link
          href={routeHref('modelos', locale, `/${slug}`)}
          className="inline-flex min-h-10 items-center rounded-[var(--radius-pill)] border border-[var(--border-strong)] px-4 font-body text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-strong)] transition-colors duration-[240ms] hover:border-ocean-700 hover:text-ocean-700"
        >
          {t.seeFullSpecs}
        </Link>
      </div>
    </div>
  )
}
