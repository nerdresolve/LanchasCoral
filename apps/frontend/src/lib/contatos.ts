import { prisma } from './prisma'
import { COMPANY } from './company'

/**
 * Pontos focais de atendimento, lidos do banco.
 *
 * O painel edita uma vez e todo lugar que serve àquela finalidade muda junto:
 * rodapé, /contatos, /contato e o JSON-LD do Google. Antes cada um lia a
 * constante `COMPANY.areas`, e trocar um número exigia editar o código.
 *
 * `COMPANY` continua sendo o padrão de segurança: se a tabela estiver vazia
 * (banco novo, seed ainda não rodado), o site mostra os números conhecidos em
 * vez de uma página de contatos em branco.
 */

export type PontoFocal = {
  key: string
  label: string | null
  labelEn: string | null
  phones: string[]
  whatsapp: string | null
  email: string | null
  hours: string | null
  hoursEn: string | null
}

/** Reserva a partir de `company.ts`, para quando a tabela ainda não tem linhas. */
const RESERVA: PontoFocal[] = COMPANY.areas.map((a) => ({
  key: a.key,
  label: null,
  labelEn: null,
  // `COMPANY` é `as const`, então os arrays chegam somente-leitura.
  phones: [...a.phones],
  whatsapp: a.whatsapp,
  email: null,
  hours: null,
  hoursEn: null,
}))

export async function getPontosFocais(): Promise<PontoFocal[]> {
  const linhas = await prisma.contactPoint.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    select: {
      key: true, label: true, labelEn: true, phones: true,
      whatsapp: true, email: true, hours: true, hoursEn: true,
    },
  })
  return linhas.length ? linhas : RESERVA
}

/** Todos os telefones publicados, sem repetição — usado pelo JSON-LD. */
export async function getTelefonesPublicados(): Promise<string[]> {
  const pontos = await getPontosFocais()
  return [...new Set(pontos.flatMap((p) => p.phones))]
}
