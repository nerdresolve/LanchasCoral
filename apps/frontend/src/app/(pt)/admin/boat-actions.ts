'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { parseBoatForm, type BoatInput } from '@/lib/boat-schema'
import { travarRegistro } from '@/lib/trava'

export type ActionState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined

/**
 * Revalida todas as superfícies onde um modelo aparece.
 *
 * As rotas em inglês entram junto: `/en/models` e `/en/models/[slug]` vivem
 * noutro route group e não são alcançadas pela revalidação das rotas em
 * português, então um preço ou uma ficha atualizada continuava velha para o
 * visitante internacional até o próximo build.
 *
 * Aceita mais de um slug para que, ao renomear, a página antiga também caia.
 */
function revalidateBoat(...slugs: (string | undefined)[]) {
  revalidatePath('/', 'layout')   // o menu do topo é montado a partir dos modelos
  /* A home entra explicitamente: `'/', 'layout'` derruba a árvore do layout,
     mas o HTML já gerado da página `/` continua no cache de rota. Sem esta
     linha, o menu da home ficava com os modelos antigos. */
  revalidatePath('/')
  revalidatePath('/en')
  revalidatePath('/modelos')
  revalidatePath('/en/models')
  /* A lista do formulário de memorial é montada a partir dos modelos
     publicados que têm PDF anexado: publicar, despublicar ou anexar um
     memorial muda o que ela oferece. */
  revalidatePath('/solicitar-manual')
  revalidatePath('/en/request-manual')
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/modelos/${slug}`)
    revalidatePath(`/en/models/${slug}`)
  }
  revalidatePath('/admin')
}

/**
 * Apaga famílias que ficaram sem nenhum modelo.
 *
 * A família nasce sozinha quando o operador digita um nome novo no formulário.
 * Se ele errar o nome, corrigir, e salvar, a errada fica órfã no banco para
 * sempre; o mesmo acontece ao apagar o último modelo de uma família. Elas se
 * acumulavam sem que ninguém visse, e chegavam a vazar no HTML da página de
 * modelos.
 *
 * Roda depois de cada gravação, que é barato: são poucas dezenas de linhas.
 */
async function limparFamiliasOrfas() {
  await prisma.family.deleteMany({ where: { boats: { none: {} } } })
}

/** Encontra a família do modelo, criando-a se ainda não existir. */
async function familyIdFor(name?: string) {
  if (!name) return null
  const slug = name.toLowerCase().replace(/\s+/g, '-')
  const existing = await prisma.family.findFirst({ where: { OR: [{ name }, { slug }] } })
  if (existing) return existing.id
  const max = await prisma.family.aggregate({ _max: { order: true } })
  const created = await prisma.family.create({
    data: { name, slug, order: (max._max.order ?? 0) + 1 },
  })
  return created.id
}

/** Colunas compartilhadas por criação e edição. */
function scalars(d: BoatInput) {
  return {
    name: d.name,
    variant: d.variant ?? null,
    tagline: d.tagline ?? null,
    description: d.description ?? null,
    variantEn: d.variantEn ?? null,
    taglineEn: d.taglineEn ?? null,
    descriptionEn: d.descriptionEn ?? null,
    lengthM: d.lengthM ?? null, beamM: d.beamM ?? null, draftM: d.draftM ?? null,
    depthM: d.depthM ?? null, cabinHeightM: d.cabinHeightM ?? null,
    weightKg: d.weightKg ?? null, engineWeightKg: d.engineWeightKg ?? null,
    fuelL: d.fuelL ?? null, waterL: d.waterL ?? null,
    powerMinHp: d.powerMinHp ?? null, powerMaxHp: d.powerMaxHp ?? null,
    capInteriorDay: d.capInteriorDay ?? null, capInteriorNight: d.capInteriorNight ?? null,
    capOpenSeaDay: d.capOpenSeaDay ?? null, capOpenSeaNight: d.capOpenSeaNight ?? null,
    // `Prisma.DbNull`, e não `undefined`: para o Prisma, `undefined` quer
    // dizer "não mexa nesta coluna", então apagar todas as motorizações no
    // formulário não salvava nada, e as antigas seguiam na ficha pública.
    // Numa coluna JSON o `null` da linguagem é ambíguo (JSON null vs. NULL do
    // banco), por isso o Prisma exige este marcador explícito.
    performance: d.performance.length ? d.performance : Prisma.DbNull,
    published: d.published,
    order: d.order,
    heroImage: d.heroImage ?? d.images[0]?.url ?? null,
    heroVideo: d.heroVideo ?? null,
    manualUrl: d.manualUrl ?? null,
    seoTitle: d.seoTitle ?? null,
    seoDescription: d.seoDescription ?? null,
  }
}

export async function createBoat(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const parsed = parseBoatForm(fd)
  if (!parsed.success) {
    return { error: 'Verifique os campos.', fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }
  const d = parsed.data

  if (await prisma.boat.findUnique({ where: { slug: d.slug } })) {
    return { error: 'Já existe um modelo com esse endereço de página.', fieldErrors: { slug: ['Endereço em uso por outro modelo.'] } }
  }

  const familyId = await familyIdFor(d.familyName)
  await prisma.boat.create({
    data: {
      slug: d.slug,
      ...scalars(d),
      ...(familyId ? { family: { connect: { id: familyId } } } : {}),
      images: { create: d.images.map((im, order) => ({ url: im.url, alt: im.alt ?? null, order })) },
      equipment: { create: d.equipment.map((e, order) => ({
          panel: e.panel,
          text: e.text,
          textEn: e.textEn || null,
          order,
        })) },
    },
  })

  revalidateBoat(d.slug)
  redirect(`/admin/boats/${d.slug}?created=1`)
}

export async function updateBoat(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = String(fd.get('id') ?? '')
  if (!id) return { error: 'Modelo não encontrado.' }

  const parsed = parseBoatForm(fd)
  if (!parsed.success) {
    return { error: 'Verifique os campos.', fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }
  const d = parsed.data

  const existing = await prisma.boat.findUnique({ where: { id } })
  if (!existing) return { error: 'Modelo não encontrado.' }

  const clash = await prisma.boat.findUnique({ where: { slug: d.slug } })
  if (clash && clash.id !== id) {
    return { error: 'Já existe um modelo com esse endereço de página.', fieldErrors: { slug: ['Endereço em uso por outro modelo.'] } }
  }

  const familyId = await familyIdFor(d.familyName)

  /*
   * Os filhos são substituídos por completo para aplicar ordem e remoções.
   *
   * A trava vem antes de tudo: sem ela, duas gravações do mesmo modelo (duas
   * abas abertas, ou um duplo-clique em salvar) se intercalavam e a galeria
   * saía duplicada — 57 fotos viravam 114. Ver `src/lib/trava.ts`.
   */
  await prisma.$transaction(async (tx) => {
    await travarRegistro(tx, 'Boat', id)

    await tx.boatImage.deleteMany({ where: { boatId: id } })
    await tx.equipment.deleteMany({ where: { boatId: id } })
    await tx.boat.update({
      where: { id },
      data: {
        slug: d.slug,
        ...scalars(d),
        family: familyId ? { connect: { id: familyId } } : { disconnect: true },
        images: { create: d.images.map((im, order) => ({ url: im.url, alt: im.alt ?? null, order })) },
        equipment: { create: d.equipment.map((e, order) => ({
          panel: e.panel,
          text: e.text,
          textEn: e.textEn || null,
          order,
        })) },
      },
    })
  })

  // A família anterior pode ter ficado sem nenhum modelo depois desta troca.
  await limparFamiliasOrfas()

  revalidateBoat(d.slug, existing.slug)
  redirect(`/admin/boats/${d.slug}?saved=1`)
}

export async function deleteBoat(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id') ?? '')
  if (!id) return
  const boat = await prisma.boat.findUnique({ where: { id } })
  if (!boat) return
  // Fotos e equipamentos caem em cascata pela relação no schema.
  await prisma.boat.delete({ where: { id } })
  await limparFamiliasOrfas()
  revalidateBoat(boat.slug)
  redirect('/admin?deleted=1')
}

export async function togglePublished(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id') ?? '')
  const boat = await prisma.boat.findUnique({ where: { id } })
  if (!boat) return
  await prisma.boat.update({ where: { id }, data: { published: !boat.published } })
  revalidateBoat(boat.slug)
}
