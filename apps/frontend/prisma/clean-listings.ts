/**
 * Limpa as descrições importadas do Coral Broker.
 *
 * O scrape trouxe, junto do texto do anúncio, blocos de interface do site de
 * origem (widget de chat, calculadora de financiamento, formulários de test
 * drive) e uma repetição da lista de acessórios — que já tem seção própria.
 *
 * Uso: npx tsx prisma/clean-listings.ts
 */
import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

/** Tudo a partir daqui é interface do site antigo, não conteúdo do anúncio. */
const CORTES = [
  /CONFIRMAR OS EQUIPAMENTOS QUE ACOMPANHAM/i,
  /O Design moderno e atual é requisito básico/i,
  /Oi,\s*tudo bem\?/i,
  /Iniciar chat/i,
  /Calculate Payment/i,
  /Calculadora de financiamento/i,
  /Programar um test drive/i,
  /Pedido de preço/i,
]

/** Linhas soltas de rótulo de formulário que sobram no meio do texto. */
const LIXO_LINHA =
  /^(nome|o email|telefone|best time|pedido|compare|calculate|pagamento (inicial|mensal)|total (interest payment|amount to pay)|preço do veículo.*|taxa de juro.*|período \(mês\))$/i

function limpar(raw: string | null): { texto: string | null; acessorios: string[] } {
  if (!raw) return { texto: null, acessorios: [] }

  let t = raw.replace(/\r/g, '')

  // 1) corta a partir do primeiro marcador de interface
  for (const re of CORTES) {
    const m = t.match(re)
    if (m?.index !== undefined) t = t.slice(0, m.index)
  }

  // 2) separa a lista de acessórios embutida ("* item") do texto corrido
  const acessorios: string[] = []
  const linhas: string[] = []
  for (const linha of t.split('\n')) {
    const l = linha.trim()
    if (!l) {
      linhas.push('')
      continue
    }
    if (/^\*\s+/.test(l)) {
      acessorios.push(l.replace(/^\*\s+/, '').trim())
      continue
    }
    if (LIXO_LINHA.test(l)) continue
    // rótulo "Acessórios:" perde o sentido depois de extrair a lista
    if (/^acess[óo]rios:?$/i.test(l)) continue
    linhas.push(l)
  }

  const texto = linhas.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  return { texto: texto || null, acessorios }
}

async function main() {
  const rows = await prisma.listing.findMany({
    include: { accessories: { orderBy: { order: 'asc' } } },
  })

  let limpas = 0
  let novosAcess = 0

  for (const r of rows) {
    const { texto, acessorios } = limpar(r.description)
    const mudou = texto !== r.description

    if (mudou) {
      await prisma.listing.update({ where: { id: r.id }, data: { description: texto } })
      limpas++
    }

    // Acessórios extraídos do texto entram apenas se ainda não existirem.
    if (acessorios.length) {
      const existentes = new Set(r.accessories.map((a) => a.text.toLowerCase().trim()))
      const novos = acessorios.filter((a) => !existentes.has(a.toLowerCase().trim()))
      if (novos.length) {
        await prisma.listingAccessory.createMany({
          data: novos.map((text, i) => ({
            listingId: r.id,
            text,
            order: r.accessories.length + i,
          })),
        })
        novosAcess += novos.length
      }
    }

    const antes = (r.description ?? '').length
    const depois = (texto ?? '').length
    if (mudou) {
      console.log(`  ${r.slug.slice(0, 40).padEnd(41)} ${String(antes).padStart(5)} -> ${String(depois).padStart(4)} chars`)
    }
  }

  console.log(`\ndescrições limpas: ${limpas} | acessórios recuperados do texto: ${novosAcess}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('ERRO:', e)
    process.exit(1)
  })
