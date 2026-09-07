import { prisma } from '@/lib/prisma'
import PageShell from '@/components/PageShell'
import ComparacaoNaPagina from '@/components/comparador/ComparacaoNaPagina'
import SeletorComparacao from '@/components/comparador/SeletorComparacao'
import { compararModelos } from '@/lib/comparar'
import { getDict } from '@/i18n/dictionary'
import type { Locale } from '@/i18n/config'

/**
 * Comparação com endereço próprio: `/comparar?a=<slug>&b=<slug>`.
 *
 * O caminho principal é o painel que abre sobre a página, sem navegação. Esta
 * página existe para o que o painel não faz: guardar nos favoritos, mandar o
 * link para quem decide junto, e dar ao Google um endereço indexável para
 * quem procura "Coral 36 ou Coral 40".
 *
 * Sem os dois parâmetros, mostra os seletores para escolher ali mesmo.
 */

const CAMPOS = {
  slug: true, name: true, variant: true, tagline: true, description: true,
  lengthM: true, beamM: true, draftM: true, depthM: true, cabinHeightM: true,
  weightKg: true, fuelL: true, waterL: true, powerMinHp: true, powerMaxHp: true,
  capInteriorDay: true, capInteriorNight: true, capOpenSeaDay: true, capOpenSeaNight: true,
} as const

export default async function CompararView({
  locale,
  a,
  b,
}: {
  locale: Locale
  a?: string
  b?: string
}) {
  const t = getDict(locale).compare

  const [modelos, todos] = await Promise.all([
    a && b && a !== b
      ? prisma.boat.findMany({
          where: { slug: { in: [a, b] }, published: true },
          select: {
            ...CAMPOS,
            images: { orderBy: { order: 'asc' }, take: 1, select: { url: true, alt: true } },
            equipment: { orderBy: { order: 'asc' }, select: { panel: true, text: true } },
          },
        })
      : Promise.resolve([]),
    /* A lista para os seletores sai da mesma renderização: sem ela, quem
       chega pelo link com um slug errado ficaria sem saída. */
    prisma.boat.findMany({
      where: { published: true },
      orderBy: [{ family: { order: 'asc' } }, { order: 'asc' }],
      select: { slug: true, name: true, variant: true, lengthM: true, images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } } },
    }),
  ])

  const primeiro = modelos.find((m) => m.slug === a)
  const segundo = modelos.find((m) => m.slug === b)
  const comparacao = primeiro && segundo ? compararModelos(primeiro as never, segundo as never) : null

  const opcoes = todos.map((m) => ({
    slug: m.slug,
    rotulo: [m.name, m.variant].filter(Boolean).join(' '),
    familia: null,
    comprimento: m.lengthM ? Number(m.lengthM) : null,
    foto: m.images[0]?.url ?? null,
  }))

  return (
    <PageShell
      locale={locale}
      eyebrow={t.barTitle}
      title={t.shareTitle}
      lede={undefined}
      active="modelos"
    >
      {/* Só enquanto falta modelo: com o par completo, quem troca é o botão
          no cabeçalho de cada lado, que já mostra o que está comparando.
          Mostrar os dois empilhados era oferecer dois caminhos para a mesma
          coisa — e o pior deles aparecia primeiro. */}
      {!comparacao && (
        <SeletorComparacao
          opcoes={opcoes}
          /* Um slug sozinho ainda vale como escolha feita: mantém o lado que
             já veio no link em vez de descartá-lo. */
          a={a && todos.some((m) => m.slug === a) ? a : undefined}
          b={b && todos.some((m) => m.slug === b) ? b : undefined}
          locale={locale}
        />
      )}

      {comparacao && (
        <div className="mt-10">
          <ComparacaoNaPagina
            a={comparacao.a}
            b={comparacao.b}
            grupos={comparacao.grupos}
            caracteristicas={comparacao.caracteristicas}
            opcoes={opcoes}
            locale={locale}
          />
        </div>
      )}
    </PageShell>
  )
}
