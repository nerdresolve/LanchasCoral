import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Lista enxuta dos modelos publicados, para o seletor do painel.
 *
 * Só o necessário para montar a lista — slug, nome, foto e comprimento. A
 * ficha completa vem de `/api/comparar` quando o visitante escolhe.
 *
 * Estática: a lista muda quando alguém publica ou despublica um modelo, o que
 * já dispara revalidação pelas actions do painel.
 */
export const dynamic = 'force-static'

export async function GET() {
  const boats = await prisma.boat.findMany({
    where: { published: true },
    orderBy: [{ family: { order: 'asc' } }, { order: 'asc' }],
    select: {
      slug: true,
      name: true,
      variant: true,
      lengthM: true,
      family: { select: { name: true } },
      images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
    },
  })

  return NextResponse.json(
    boats.map((b) => ({
      slug: b.slug,
      rotulo: [b.name, b.variant].filter(Boolean).join(' '),
      familia: b.family?.name ?? null,
      // `Decimal` do Prisma não sobrevive ao JSON; vira número aqui.
      comprimento: b.lengthM ? Number(b.lengthM) : null,
      foto: b.images[0]?.url ?? null,
    })),
  )
}
