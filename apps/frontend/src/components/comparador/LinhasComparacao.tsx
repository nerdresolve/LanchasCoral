'use client'

import { getDict } from '@/i18n/dictionary'
import type { Locale } from '@/i18n/config'
import type { GrupoComparacao, Caracteristicas } from '@/lib/comparar'

/**
 * Os números e as características, em três colunas.
 *
 * ## Duas decisões de leitura
 *
 * O rótulo fica NO MEIO dos dois valores. Numa grade de duas colunas com o
 * rótulo em cima, num monitor largo os valores ficavam a mais de mil pixels
 * um do outro e o olho perdia a associação — que é justamente o que a
 * comparação precisa oferecer.
 *
 * A diferença é marcada com um sinal discreto ("+2,40 m") e uma barra
 * proporcional, nunca com cor de vencedor: entre duas lanchas, maior não é
 * melhor. Quem procura barco para marina pequena quer o menor.
 */
export default function LinhasComparacao({
  grupos,
  caracteristicas,
  rotuloA,
  rotuloB,
  locale = 'pt',
}: {
  grupos: GrupoComparacao[]
  caracteristicas: Caracteristicas
  rotuloA: string
  rotuloB: string
  locale?: Locale
}) {
  const t = getDict(locale).compare

  /* Todas as linhas, sempre. Havia um filtro "só o que difere"; quem compara
     quer ver o quadro inteiro, e o que coincide também informa — duas versões
     do mesmo casco terem a mesma boca é resposta, não ruído. As linhas iguais
     já se distinguem pelo fundo. */
  const visiveis = grupos.filter((g) => g.linhas.length > 0)

  return (
    <>
      {visiveis.map((grupo) => (
        <section key={grupo.titulo} className="mt-8">
          <h3 className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
            {grupo.titulo}
          </h3>

          <dl className="mt-3 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
            {grupo.linhas.map((linha) => (
              <div
                key={linha.rotulo}
                /* `data-iguais` em vez de `opacity`: baixar a opacidade reduz
                   o contraste real do texto e reprova na acessibilidade. A
                   distinção é pelo fundo, que não mexe no contraste. */
                data-iguais={linha.iguais || undefined}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 py-3 data-[iguais]:bg-[var(--surface-sunken)]/60 sm:gap-4 sm:px-0"
              >
                <dd className="min-w-0">
                  <Valor
                    valor={linha.a}
                    proporcao={linha.proporcao?.a ?? null}
                    lado="esquerda"
                  />
                </dd>

                {/*
                  O rótulo e, embaixo dele, a diferença.
                  
                  O selo morava ao lado do valor. Em três colunas de tela
                  estreita não cabia: ora quebrava a linha (74px contra 57px
                  das vizinhas), ora furava a coluna e encostava na borda, ora
                  truncava para "+100…" e perdia o dado. No meio há espaço, e
                  como pertence à linha e não a um lado, nada desnivela.
                  
                  O `max-w` evita que um rótulo longo como "Interior,
                  pernoite" coma a largura das colunas e parta os números.
                */}
                <dt className="flex max-w-[96px] flex-col items-center gap-1 px-0.5 text-center text-[10px] leading-tight text-[var(--color-text-body)] sm:max-w-none sm:px-3 sm:text-xs">
                  {linha.rotulo}
                  {linha.diferenca && (
                    <span className="whitespace-nowrap rounded-[var(--radius-pill)] bg-ocean-700/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-ocean-700">
                      {linha.diferenca.texto}
                    </span>
                  )}
                </dt>

                <dd className="min-w-0">
                  <Valor
                    valor={linha.b}
                    proporcao={linha.proporcao?.b ?? null}
                    lado="direita"
                  />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {/* Resta como rede de segurança: sem o filtro, só cai aqui um par cujos
          grupos venham todos vazios — dados incompletos nos dois modelos. */}
      {visiveis.length === 0 && (
        <p className="mt-8 text-center text-sm text-[var(--text-muted)]">{t.noDifferences}</p>
      )}

      {(caracteristicas.soA.length > 0 ||
        caracteristicas.soB.length > 0 ||
        caracteristicas.emComum.length > 0) && (
        <section className="mt-8">
          <h3 className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
            {t.features}
          </h3>

          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4">
            {(
              [
                ['a', rotuloA, caracteristicas.soA],
                ['b', rotuloB, caracteristicas.soB],
              ] as const
            ).map(([chave, rotulo, itens], i) => (
              <div key={chave} className={`min-w-0 ${i === 1 ? 'col-start-3' : ''}`}>
                <p className="text-xs font-medium text-[var(--text-strong)]">{t.onlyIn(rotulo)}</p>
                {itens.length === 0 ? (
                  <p className="mt-2 text-[13px] text-[var(--text-muted)]">—</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {itens.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-[13px] leading-[1.5] text-[var(--color-text-body)]"
                      >
                        <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-aqua-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {caracteristicas.emComum.length > 0 && (
            <div className="mt-5 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] p-4">
              <p className="text-xs font-medium text-[var(--text-muted)]">{t.inCommon}</p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                {caracteristicas.emComum.map((item) => (
                  <li key={item} className="text-[13px] leading-[1.5] text-[var(--text-muted)]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </>
  )
}

/**
 * Um valor e a barra proporcional.
 *
 * A barra dá a leitura antes do número: "7,93" e "8,83" são parecidos como
 * texto, mas visivelmente diferentes como comprimento. Cresce do centro para
 * fora, então as duas se encontram no rótulo.
 */
function Valor({
  valor,
  proporcao,
  lado,
}: {
  valor: string | null
  /** 0 a 1, quanto este valor representa em relação ao maior dos dois. */
  proporcao: number | null
  lado: 'esquerda' | 'direita'
}) {
  const direita = lado === 'direita'

  return (
    <span className={`block ${direita ? 'text-left' : 'text-right'}`}>
      {/* Só o número. O selo de diferença agora vive na coluna do meio, sob o
          rótulo: pertence à linha, não a um dos lados, e lá tem espaço para
          aparecer inteiro em qualquer largura de tela. */}
      <span
        className={`block whitespace-nowrap font-mono text-[13px] tabular-nums sm:text-[15px] ${
          valor === null ? 'text-[var(--text-muted)]' : 'font-medium text-[var(--text-strong)]'
        }`}
      >
        {valor ?? '—'}
      </span>

      {proporcao !== null && (
        <span
          aria-hidden
          /* `justify-end` no lado esquerdo: a barra cresce da direita para a
             esquerda, espelhando a outra. As duas se encontram no rótulo do
             meio, e a comparação fica simétrica. */
          className={`mt-1 flex h-1 overflow-hidden rounded-full bg-[var(--border-subtle)] ${
            direita ? '' : 'justify-end'
          }`}
        >
          <span
            className="block h-full rounded-full bg-ocean-700/45 transition-[width] duration-500 ease-[var(--ease-glide)]"
            style={{ width: `${Math.round(proporcao * 100)}%` }}
          />
        </span>
      )}
    </span>
  )
}
