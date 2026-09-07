import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import raw from './data/boats.raw.json'
import { normalize, type RawBoat } from './normalize'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

/** Order boats by hull length so listings read small -> large. */
const byLength = (a: { lengthM: number | null }, b: { lengthM: number | null }) =>
  (a.lengthM ?? 0) - (b.lengthM ?? 0)

async function main() {
  const boats = (raw as RawBoat[]).map(normalize).sort(byLength)

  // Idempotent: clear content tables so re-running seed does not duplicate.
  await prisma.equipment.deleteMany()
  await prisma.boatImage.deleteMany()
  await prisma.boat.deleteMany()
  await prisma.family.deleteMany()

  // Families, ordered by the smallest boat in each.
  const famNames: string[] = []
  for (const b of boats) if (!famNames.includes(b.familyName)) famNames.push(b.familyName)

  const famId = new Map<string, string>()
  for (const [i, name] of famNames.entries()) {
    const f = await prisma.family.create({
      data: { name, slug: name.toLowerCase().replace(/\s+/g, '-'), order: i },
    })
    famId.set(name, f.id)
  }

  for (const [i, b] of boats.entries()) {
    const label = [b.name, b.variant].filter(Boolean).join(' – ')
    const hero = b.images[0] ?? null

    await prisma.boat.create({
      data: {
        slug: b.slug,
        name: b.name,
        variant: b.variant,
        family: (() => {
          const id = famId.get(b.familyName)
          return id ? { connect: { id } } : undefined
        })(),
        order: i,
        published: true,
        heroImage: hero,
        seoTitle: label,
        lengthM: b.lengthM, beamM: b.beamM, draftM: b.draftM, depthM: b.depthM,
        cabinHeightM: b.cabinHeightM,
        weightKg: b.weightKg,
        /* Nem toda entrada da fonte traz este campo. O acesso é estreitado
           para o formato esperado em vez de silenciado com `any`, para que um
           erro de digitação no nome continue sendo pego pelo compilador. */
        engineWeightKg: (b as { engineWeightKg?: number | null }).engineWeightKg,
        fuelL: b.fuelL, waterL: b.waterL,
        powerMinHp: b.powerMinHp, powerMaxHp: b.powerMaxHp,
        capInteriorDay: b.capInteriorDay, capInteriorNight: b.capInteriorNight,
        capOpenSeaDay: b.capOpenSeaDay, capOpenSeaNight: b.capOpenSeaNight,
        performance: b.performance.length ? b.performance : undefined,
        images: {
          create: b.images.map((url, order) => ({ url, order, alt: `${label} — foto ${order + 1}` })),
        },
        equipment: {
          create: b.equip.flatMap((panel) =>
            panel.items.map((text, order) => ({ panel: panel.panel, text, order })),
          ),
        },
      },
    })
  }

  /*
   * Usuário do painel.
   *
   * `role` é passado explicitamente: o padrão da coluna é VIEWER (sem acesso),
   * justamente para que ninguém vire administrador por descuido. Aqui a
   * intenção é criar um administrador, então isso fica escrito.
   *
   * A senha padrão serve só para desenvolvimento. Em produção, defina
   * ADMIN_EMAIL e ADMIN_PASSWORD no ambiente antes de rodar o seed.
   */
  const email = process.env.ADMIN_EMAIL ?? 'admin@lanchascoral.com.br'
  const pw = process.env.ADMIN_PASSWORD ?? 'coral-admin'
  await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: { email, name: 'Administrador', passwordHash: await bcrypt.hash(pw, 10), role: 'ADMIN' },
  })

  const [nb, ni, ne] = await Promise.all([
    prisma.boat.count(), prisma.boatImage.count(), prisma.equipment.count(),
  ])
  console.log(`seeded: ${famNames.length} families, ${nb} boats, ${ni} images, ${ne} equipment rows`)
  console.log(`admin: ${email} / ${pw}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
