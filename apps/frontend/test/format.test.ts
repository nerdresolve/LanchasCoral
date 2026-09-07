import { describe, it, expect } from 'vitest'
import * as fmt from '@/lib/format'

/**
 * Formatação dos números que aparecem na ficha técnica.
 *
 * São os valores que o cliente lê antes de decidir comprar: comprimento,
 * potência, preço. Um separador errado ou um arredondamento a mais mudam o
 * que a página comunica.
 *
 * Os valores vêm do Prisma como `Decimal`, que é objeto com `toString()`, não
 * número — daí os testes com esse formato.
 */

/** Imita o Decimal do Prisma: objeto cujo `toString` devolve o valor. */
const decimal = (v: string) => ({ toString: () => v })

describe('toNum', () => {
  it('converte Decimal do Prisma', () => {
    expect(fmt.toNum(decimal('11.50'))).toBe(11.5)
  })

  it('aceita número direto', () => {
    expect(fmt.toNum(42)).toBe(42)
  })

  it('devolve null para ausente', () => {
    expect(fmt.toNum(null)).toBeNull()
    expect(fmt.toNum(undefined)).toBeNull()
  })

  it('devolve null para valor não numérico', () => {
    // Melhor não mostrar nada que mostrar "NaN" na ficha.
    expect(fmt.toNum(decimal('abacaxi'))).toBeNull()
  })

  it('preserva o zero', () => {
    // Zero é medida válida; virar null esconderia a informação.
    expect(fmt.toNum(0)).toBe(0)
    expect(fmt.toNum(decimal('0'))).toBe(0)
  })
})

describe('medidas', () => {
  it('mostra metros com duas casas e vírgula', () => {
    expect(fmt.meters(decimal('11.5'))).toBe('11,50 m')
    expect(fmt.meters(11)).toBe('11,00 m')
  })

  it('mostra litros com separador de milhar', () => {
    expect(fmt.litres(1200)).toBe('1.200 L')
  })

  it('mostra quilos sem casas decimais', () => {
    expect(fmt.kilos(4500)).toBe('4.500 kg')
  })

  it('mostra potência', () => {
    expect(fmt.hp(250)).toBe('250 HP')
    expect(fmt.hpShort(250)).toBe('250 hp')
  })

  it('omite a medida ausente em vez de mostrar vazio', () => {
    // Um "null m" na ficha técnica seria pior que a linha não aparecer.
    expect(fmt.meters(null)).toBeNull()
    expect(fmt.litres(null)).toBeNull()
    expect(fmt.kilos(undefined)).toBeNull()
    expect(fmt.hp(null)).toBeNull()
  })
})

describe('lotação', () => {
  it('concorda o plural', () => {
    expect(fmt.capacity(1)).toBe('1 pessoa')
    expect(fmt.capacity(16)).toBe('16 pessoas')
  })

  it('usa a forma curta nos cartões', () => {
    expect(fmt.capacityShort(12)).toBe('12 pax')
  })

  it('junta dia e pernoite', () => {
    expect(fmt.people(12, 4)).toBe('12 dia · 4 pernoite')
  })

  it('mostra só o que existe', () => {
    expect(fmt.people(12, null)).toBe('12 dia')
    expect(fmt.people(null, 4)).toBe('4 pernoite')
  })

  it('omite quando não há nenhum dos dois', () => {
    expect(fmt.people(null, null)).toBeNull()
  })

  it('preserva zero pernoites', () => {
    // "0 pernoite" é informação: o barco não tem cabine para dormir.
    expect(fmt.people(12, 0)).toBe('12 dia · 0 pernoite')
  })
})

describe('preço', () => {
  it('formata em reais sem centavos', () => {
    const saida = fmt.brl(1990000)
    expect(saida).toContain('1.990.000')
    expect(saida).not.toContain(',00')
  })

  it('omite preço ausente (sob consulta)', () => {
    expect(fmt.brl(null)).toBeNull()
  })
})

describe('número sem unidade', () => {
  it('respeita as casas pedidas', () => {
    expect(fmt.num(decimal('11.5'), 2)).toBe('11,50')
    expect(fmt.num(decimal('11.5'), 0)).toBe('12')
  })
})
