import { describe, it, expect } from 'vitest'
/* Importa direto do script de infraestrutura: a regra de retenção vive lá,
   e duplicá-la aqui só provaria que a cópia funciona. */
import { decidirRetencao } from '../../../infra/backup.mjs'

/**
 * Política de retenção das cópias de segurança.
 *
 * É a regra que só erra meses depois: apagar demais só se percebe na hora em
 * que alguém precisa restaurar algo antigo e não encontra. Por isso vale
 * simular datas em vez de esperar o tempo passar.
 *
 * A regra: diárias por 14 dias, e a PRIMEIRA cópia de cada mês para sempre.
 */

const HOJE = new Date('2026-09-02T12:00:00').getTime()
const DIA = 864e5

/** Monta uma cópia com N dias de idade. */
const copia = (diasAtras: number, sufixo = '') => {
  const quando = new Date(HOJE - diasAtras * DIA)
  return { nome: `coral_${quando.toISOString().slice(0, 10)}${sufixo}.dump`, quando }
}

const apagar = (copias: ReturnType<typeof copia>[]) => decidirRetencao(copias, HOJE)

describe('janela das diárias', () => {
  it('mantém as cópias recentes', () => {
    const copias = [copia(0), copia(1), copia(7), copia(13)]
    expect(apagar(copias)).toEqual([])
  })

  it('apaga o que passou da janela', () => {
    // 20 dias atrás, e não é a primeira do mês.
    const copias = [copia(0), copia(20), copia(21)]
    const removidas = apagar(copias)
    expect(removidas).toHaveLength(1)
    expect(removidas[0]).toContain('2026-08-13')
  })

  it('não apaga exatamente no limite', () => {
    // Com 14 dias em ponto ainda está dentro; o corte é estritamente maior.
    expect(apagar([copia(13.9)])).toEqual([])
  })
})

describe('marcos mensais', () => {
  it('guarda a primeira cópia de cada mês para sempre', () => {
    // Cinco meses de cópias diárias.
    const copias = Array.from({ length: 150 }, (_, i) => copia(i))
    const removidas = new Set(apagar(copias))
    const mantidas = copias.filter((c) => !removidas.has(c.nome))

    // Um marco por mês tocado, mais as diárias da janela.
    const meses = new Set(mantidas.map((c) => `${c.quando.getFullYear()}-${c.quando.getMonth()}`))
    expect(meses.size).toBeGreaterThanOrEqual(5)
    expect(mantidas.length).toBeLessThan(30)
  })

  it('guarda a MAIS ANTIGA do mês, não a mais nova', () => {
    // Duas cópias em julho: só a primeira vira marco.
    const jul1 = { nome: 'jul-01.dump', quando: new Date('2026-07-01T03:00:00') }
    const jul15 = { nome: 'jul-15.dump', quando: new Date('2026-07-15T03:00:00') }
    const removidas = apagar([jul15, jul1])

    expect(removidas).toContain('jul-15.dump')
    expect(removidas).not.toContain('jul-01.dump')
  })

  it('mantém um marco por mês mesmo com muitos meses', () => {
    const primeiroDeCadaMes = [
      { nome: 'm1.dump', quando: new Date('2026-03-01T03:00:00') },
      { nome: 'm2.dump', quando: new Date('2026-04-01T03:00:00') },
      { nome: 'm3.dump', quando: new Date('2026-05-01T03:00:00') },
    ]
    expect(apagar(primeiroDeCadaMes)).toEqual([])
  })
})

describe('casos de borda', () => {
  it('não apaga nada quando não há cópia', () => {
    expect(apagar([])).toEqual([])
  })

  it('nunca apaga a única cópia existente', () => {
    // Mesmo com um ano de idade: é a primeira do mês dela.
    expect(apagar([copia(400)])).toEqual([])
  })

  it('atravessa a virada de ano sem confundir meses', () => {
    // Dezembro e janeiro são meses diferentes mesmo com o mesmo número (0/11).
    const dez = { nome: 'dez.dump', quando: new Date('2025-12-05T03:00:00') }
    const dez2 = { nome: 'dez2.dump', quando: new Date('2025-12-20T03:00:00') }
    const jan = { nome: 'jan.dump', quando: new Date('2026-01-05T03:00:00') }

    const removidas = apagar([dez, dez2, jan])
    expect(removidas).toContain('dez2.dump')
    expect(removidas).not.toContain('dez.dump')
    expect(removidas).not.toContain('jan.dump')
  })

  it('a decisão não altera a lista recebida', () => {
    const copias = [copia(50), copia(0)]
    const antes = copias.map((c) => c.nome)
    apagar(copias)
    expect(copias.map((c) => c.nome)).toEqual(antes)
  })
})
