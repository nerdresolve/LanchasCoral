/**
 * Remove dos acessórios os itens que na verdade são rodapé do site de origem
 * (endereço, telefone, horário de funcionamento) — capturados pelo scrape
 * porque ficavam dentro da mesma lista <li> do anúncio.
 *
 * Uso: npx tsx prisma/purge-accessories.ts
 */
import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

const RODAPE =
  /bulh[õo]es|duque de caxias|cep\s*:?\s*\d|^\(?\d{2}\)?\s*\d{4,5}-?\d{4}$|seg\s*[–-]\s*sex|s[áa]bado\s*:|domingo\s*:|\d{2}:\d{2}\s*(am|pm)/i

async function main() {
  const todos = await prisma.listingAccessory.findMany({ select: { id: true, text: true } })
  const alvos = todos.filter((a) => RODAPE.test(a.text))

  if (!alvos.length) {
    console.log('nada a remover')
    return
  }

  for (const a of alvos) console.log('  removendo:', a.text.slice(0, 64))

  await prisma.listingAccessory.deleteMany({ where: { id: { in: alvos.map((a) => a.id) } } })

  const restam = await prisma.listingAccessory.count()
  console.log(`\nremovidos: ${alvos.length} | acessórios restantes: ${restam}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('ERRO:', e)
    process.exit(1)
  })
