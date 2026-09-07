'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getDict } from '@/i18n/dictionary'
import { href as routeHref, type Locale } from '@/i18n/config'

/**
 * A escolha inicial na página `/comparar`, quando ainda falta um modelo.
 *
 * Antes eram dois `<select>` nativos rotulados "1" e "2". Numa página cujo
 * assunto é escolher lancha olhando, isso pedia que o visitante soubesse o
 * nome do que procura — e a tela vazia era dois campos cinzentos num vazio,
 * sem nenhuma lancha à vista.
 *
 * Agora são os próprios modelos, com foto e comprimento. Clicar num escolhe;
 * o segundo clique completa o par e a comparação aparece embaixo.
 *
 * Some quando os dois lados já estão escolhidos: dali em diante quem troca é
 * o botão no cabeçalho de cada lado, que já mostra o que está comparando.
 * Manter os dois ao mesmo tempo era oferecer dois caminhos para a mesma
 * coisa, e o pior deles vinha primeiro.
 *
 * A escolha vai para a URL, não para estado local: o endereço continua sendo
 * o registro do que está sendo comparado, então recarregar ou compartilhar
 * mostra a mesma coisa.
 */

type Opcao = {
  slug: string
  rotulo: string
  comprimento: number | null
  foto: string | null
}

export default function SeletorComparacao({
  opcoes,
  a,
  b,
  locale = 'pt',
}: {
  opcoes: Opcao[]
  a?: string
  b?: string
  locale?: Locale
}) {
  const router = useRouter()
  const t = getDict(locale).compare
  const base = routeHref('comparar', locale)

  /* Já escolhido é o lado que existe: com um só, o clique preenche o outro. */
  const escolhido = a ?? b
  const jaEscolhido = escolhido ? opcoes.find((o) => o.slug === escolhido) : undefined

  const irPara = (slug: string) => {
    const p = new URLSearchParams()
    if (escolhido) {
      p.set('a', escolhido)
      p.set('b', slug)
    } else {
      p.set('a', slug)
    }
    router.push(`${base}?${p.toString()}`)
  }

  return (
    <div className="mx-auto w-full max-w-[var(--layout-max)]">
      {/* Mostra o que já foi escolhido. Sem isto, o primeiro clique só fazia
          um cartão sumir da grade e o visitante ficava sem ver a própria
          escolha — nem por que aquele modelo desapareceu. */}
      {jaEscolhido && (
        <div className="mx-auto mb-6 flex max-w-[420px] items-center gap-3 rounded-[var(--radius-md)] border border-ocean-700/30 bg-ocean-700/5 p-2.5">
          <span className="relative block h-12 w-16 shrink-0 overflow-hidden rounded-[var(--radius-xs)] bg-navy-800">
            {jaEscolhido.foto && (
              <Image src={jaEscolhido.foto} alt="" fill sizes="64px" className="object-cover" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-[var(--text-strong)]">
              {jaEscolhido.rotulo}
            </span>
            <span className="block text-[11px] text-[var(--text-muted)]">{t.firstPicked}</span>
          </span>
          <button
            type="button"
            onClick={() => router.push(base)}
            className="shrink-0 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-body)] transition-colors duration-[140ms] hover:text-ocean-700"
          >
            {t.changeFirst}
          </button>
        </div>
      )}

      <p className="text-center text-sm text-[var(--text-muted)]">
        {escolhido ? t.pickSecond : t.pickFirst}
      </p>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {opcoes
          /* O já escolhido sai da grade: comparar um modelo com ele mesmo não
             diria nada, e deixar a opção ali criaria um estado sem saída. */
          .filter((o) => o.slug !== escolhido)
          .map((o) => (
            <li key={o.slug}>
              <button
                type="button"
                onClick={() => irPara(o.slug)}
                className="group block w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] text-left transition-colors duration-[160ms] hover:border-ocean-700 focus-visible:border-ocean-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-600"
              >
                <span className="relative block aspect-[16/10] overflow-hidden bg-navy-800">
                  {o.foto && (
                    <Image
                      src={o.foto}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 300px, (min-width: 640px) 33vw, 46vw"
                      className="object-cover transition-transform duration-[400ms] ease-[var(--ease-glide)] group-hover:scale-[1.03]"
                    />
                  )}
                </span>
                <span className="block p-3">
                  <span className="block truncate text-sm font-medium text-[var(--text-strong)]">
                    {o.rotulo}
                  </span>
                  {o.comprimento && (
                    <span className="mt-0.5 block font-mono text-[11px] text-[var(--text-muted)]">
                      {o.comprimento.toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      m
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
      </ul>
    </div>
  )
}
