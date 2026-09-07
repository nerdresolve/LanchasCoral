import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compararModelos } from '@/lib/comparar'

/**
 * Dados da comparação entre dois modelos.
 *
 * Existe porque o painel abre sem sair da página: o visitante escolhe as
 * lanchas navegando, e no clique final o painel precisa buscar as fichas
 * completas — que só o servidor tem.
 *
 * Público de propósito: os dados são os mesmos que a página de cada modelo já
 * publica. O que se protege aqui é o custo, não o segredo — daí o limite de
 * dois slugs por chamada e a resposta cacheável.
 */
/* Dinâmica de propósito: a resposta depende dos parâmetros da busca, e
   `force-static` congelaria a primeira combinação para todas as demais.
   O custo é baixo — duas linhas por consulta — e o cabeçalho abaixo deixa o
   resultado em cache na borda, então reabrir a mesma comparação não volta
   ao banco. */
export const dynamic = 'force-dynamic'

const CAMPOS = {
  slug: true, name: true, variant: true, tagline: true, description: true,
  lengthM: true, beamM: true, draftM: true, depthM: true, cabinHeightM: true,
  weightKg: true, fuelL: true, waterL: true, powerMinHp: true, powerMaxHp: true,
  capInteriorDay: true, capInteriorNight: true, capOpenSeaDay: true, capOpenSeaNight: true,
} as const

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const a = searchParams.get('a')?.trim()
  const b = searchParams.get('b')?.trim()

  if (!a || !b || a === b) {
    return NextResponse.json({ erro: 'Informe dois modelos diferentes.' }, { status: 400 })
  }

  /* Uma consulta para os dois, e só modelos publicados: um despublicado não
     deve reaparecer por aqui. */
  const modelos = await prisma.boat.findMany({
    where: { slug: { in: [a, b] }, published: true },
    select: {
      ...CAMPOS,
      /* Até 6 fotos: o painel deixa trocar a imagem de cada lado sem sair,
         e uma só não daria o que trocar. Mais que isso encheria a resposta
         sem ganho — quem quer a galeria inteira abre a ficha. */
      images: { orderBy: { order: 'asc' }, take: 6, select: { url: true, alt: true } },
      equipment: { orderBy: { order: 'asc' }, select: { panel: true, text: true } },
    },
  })

  const primeiro = modelos.find((m) => m.slug === a)
  const segundo = modelos.find((m) => m.slug === b)

  if (!primeiro || !segundo) {
    return NextResponse.json({ erro: 'Modelo não encontrado.' }, { status: 404 })
  }

  return NextResponse.json(compararModelos(primeiro as never, segundo as never), {
    headers: {
      /* Uma hora na borda, e até um dia servindo o valor velho enquanto
         revalida: uma ficha técnica não muda de minuto a minuto, e uma
         edição no painel chega no máximo uma hora depois. */
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
