/**
 * Deriva o "Tipo do Motor" de cada anúncio a partir do texto da motorização.
 *
 * O site de origem tem esse filtro, mas o valor não aparece nas páginas de
 * detalhe — só na busca. Aqui ele é inferido da nomenclatura náutica usada
 * nos anúncios, com a ordem das regras importando: a transmissão (B3, Bravo,
 * Alpha, Axius = rabeta) tem precedência sobre a marca do motor.
 *
 * Uso: npx tsx prisma/classify-engines.ts
 */
import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

const REGRAS: [RegExp, string][] = [
  // 1. Jet ski antes de tudo: a propulsão define o tipo.
  [/hidrojato|jet\s*ski|jetski|sea[\s-]*doo|\brxt\b|\bgt\s*r\b/i, 'Hidrojato'],
  // 2. Duas máquinas.
  [/parelha|\b2\s*x\s*\d|\b2x\d/i, 'Centro - Parelha'],
  // 3. Rabeta: sufixo de transmissão vence a marca do motor.
  [/\bb3\b|\bbiii\b|bravo|alpha|aplpha|rabeta|axius/i, 'Centro - Rabeta'],
  // 4. Popa.
  [/sea\s*pro|\bpopa\b|outboard|\d+\s*hp\s*4t/i, 'Popa'],
  // 5. Resto de motor de centro.
  [/mercruiser|mercury|volvo|yanmar|centro|single/i, 'Centro - Single'],
]

function classificar(texto: string): string | null {
  for (const [re, tipo] of REGRAS) if (re.test(texto)) return tipo
  return null
}

async function main() {
  const rows = await prisma.listing.findMany({
    select: { id: true, slug: true, kind: true, engine: true, title: true, description: true },
  })

  let ok = 0
  for (const r of rows) {
    // Jet ski é sempre hidrojato, mesmo sem texto de motor.
    const base = `${r.engine ?? ''} ${r.title} ${r.description ?? ''}`
    const tipo = r.kind === 'JETSKI' ? 'Hidrojato' : classificar(base)

    if (!tipo) {
      console.log(`  ${r.slug.slice(0, 38).padEnd(39)} — sem dado de motor`)
      continue
    }

    await prisma.listing.update({ where: { id: r.id }, data: { engineType: tipo } })
    ok++
    console.log(`  ${r.slug.slice(0, 38).padEnd(39)} ${tipo}`)
  }

  console.log(`\nclassificados: ${ok} de ${rows.length}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('ERRO:', e)
    process.exit(1)
  })
