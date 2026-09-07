import { describe, it, expect } from 'vitest'
import {
  compararModelos,
  compararCaracteristicas,
  caracteristicasDe,
  gruposDe,
  descricaoDe,
  rotuloDoModelo,
  type ModeloComparavel,
} from '@/lib/comparar'

/**
 * Comparação entre dois modelos.
 *
 * O que se verifica aqui é o que decide a compra: a diferença calculada sobre
 * números (e não sobre texto), o que aparece quando um lado não informa, e o
 * filtro que separa característica de chamada de marketing.
 */

/** Modelo com o mínimo; cada teste sobrescreve o que interessa. */
const modelo = (over: Partial<ModeloComparavel> = {}): ModeloComparavel => ({
  slug: 'coral-36',
  name: 'Coral 36',
  variant: null,
  tagline: null,
  description: null,
  lengthM: null,
  beamM: null,
  draftM: null,
  depthM: null,
  cabinHeightM: null,
  weightKg: null,
  fuelL: null,
  waterL: null,
  powerMinHp: null,
  powerMaxHp: null,
  capInteriorDay: null,
  capInteriorNight: null,
  capOpenSeaDay: null,
  capOpenSeaNight: null,
  images: [],
  equipment: [],
  ...over,
})

/** Imita o Decimal do Prisma, que chega como objeto com `toString`. */
const dec = (v: string) => ({ toString: () => v })

const linhaDe = (grupos: ReturnType<typeof gruposDe>, rotulo: string) =>
  grupos.flatMap((g) => g.linhas).find((l) => l.rotulo === rotulo)

describe('rótulo', () => {
  it('junta nome e variante', () => {
    expect(rotuloDoModelo({ name: 'Coral 36', variant: 'Aberta' })).toBe('Coral 36 Aberta')
  })

  it('usa só o nome quando não há variante', () => {
    expect(rotuloDoModelo({ name: 'Coral 40', variant: null })).toBe('Coral 40')
  })
})

describe('diferença numérica', () => {
  it('marca o maior e diz de quanto', () => {
    const g = gruposDe(modelo({ lengthM: dec('11.50') }), modelo({ lengthM: dec('9.10') }))
    const l = linhaDe(g, 'Comprimento')
    expect(l?.diferenca).toEqual({ maior: 'a', texto: '+2,40 m' })
  })

  it('aponta o lado certo quando o segundo é maior', () => {
    const g = gruposDe(modelo({ powerMaxHp: 300 }), modelo({ powerMaxHp: 860 }))
    expect(linhaDe(g, 'Potência máxima')?.diferenca).toEqual({ maior: 'b', texto: '+560 HP' })
  })

  it('compara pelo número, não pelo texto formatado', () => {
    /* Como texto, "9,80 m" > "11,50 m" na ordem alfabética. O cálculo precisa
       ser sobre o número, senão a comparação sai invertida. */
    const g = gruposDe(modelo({ lengthM: dec('11.50') }), modelo({ lengthM: dec('9.80') }))
    expect(linhaDe(g, 'Comprimento')?.diferenca?.maior).toBe('a')
  })

  it('não inventa diferença quando os valores são iguais', () => {
    const g = gruposDe(modelo({ beamM: dec('3.20') }), modelo({ beamM: dec('3.20') }))
    const l = linhaDe(g, 'Boca')
    expect(l?.diferenca).toBeNull()
    expect(l?.iguais).toBe(true)
  })

  it('não calcula diferença quando um lado não informa', () => {
    // "+2,40 m a mais que nada" não significa coisa alguma.
    const g = gruposDe(modelo({ cabinHeightM: dec('1.90') }), modelo({ cabinHeightM: null }))
    const l = linhaDe(g, 'Pé-direito da cabine')
    expect(l?.diferenca).toBeNull()
    expect(l?.a).toBe('1,90 m')
    expect(l?.b).toBeNull()
  })

  it('concorda o plural da unidade', () => {
    const um = gruposDe(modelo({ capInteriorNight: 6 }), modelo({ capInteriorNight: 5 }))
    expect(linhaDe(um, 'Interior, pernoite')?.diferenca?.texto).toBe('+1 pessoa')

    const varias = gruposDe(modelo({ capInteriorNight: 6 }), modelo({ capInteriorNight: 4 }))
    expect(linhaDe(varias, 'Interior, pernoite')?.diferenca?.texto).toBe('+2 pessoas')
  })

  it('usa casas decimais conforme a grandeza', () => {
    const metros = gruposDe(modelo({ lengthM: dec('11.50') }), modelo({ lengthM: dec('11.00') }))
    expect(linhaDe(metros, 'Comprimento')?.diferenca?.texto).toBe('+0,50 m')

    const litros = gruposDe(modelo({ fuelL: 800 }), modelo({ fuelL: 400 }))
    expect(linhaDe(litros, 'Combustível')?.diferenca?.texto).toBe('+400 L')
  })
})

describe('barra proporcional', () => {
  it('calcula sobre o maior dos dois', () => {
    // A barra mostra a relação ENTRE os dois, não contra um máximo global.
    const g = gruposDe(modelo({ lengthM: dec('5') }), modelo({ lengthM: dec('10') }))
    const l = linhaDe(g, 'Comprimento')
    expect(l?.proporcao).toEqual({ a: 0.5, b: 1 })
  })

  it('dá barra cheia aos dois quando são iguais', () => {
    const g = gruposDe(modelo({ beamM: dec('3') }), modelo({ beamM: dec('3') }))
    expect(linhaDe(g, 'Boca')?.proporcao).toEqual({ a: 1, b: 1 })
  })

  it('não calcula quando falta um lado', () => {
    // Meia barra contra nada não compara coisa alguma.
    const g = gruposDe(modelo({ cabinHeightM: dec('1.9') }), modelo())
    expect(linhaDe(g, 'Pé-direito da cabine')?.proporcao).toBeNull()
  })

  it('não divide por zero', () => {
    const g = gruposDe(modelo({ capInteriorNight: 0 }), modelo({ capInteriorNight: 0 }))
    expect(linhaDe(g, 'Interior, pernoite')?.proporcao).toBeNull()
  })
})

describe('linhas sem informação', () => {
  it('descarta a linha em que ninguém informou nada', () => {
    // Mostrar "— / —" só ocuparia espaço dizendo que não se sabe.
    const g = gruposDe(modelo({ lengthM: dec('11.5') }), modelo({ lengthM: dec('9.1') }))
    expect(linhaDe(g, 'Peso sem motor')).toBeUndefined()
  })

  it('mantém a linha em que só um informou', () => {
    // A ausência é informação: um tem cabine, o outro não.
    const g = gruposDe(modelo({ cabinHeightM: dec('1.90') }), modelo())
    expect(linhaDe(g, 'Pé-direito da cabine')).toBeDefined()
  })

  it('descarta o grupo que ficou sem nenhuma linha', () => {
    const g = gruposDe(modelo({ lengthM: dec('11.5') }), modelo({ lengthM: dec('9.1') }))
    expect(g.map((x) => x.titulo)).not.toContain('Tanques')
    expect(g.map((x) => x.titulo)).toContain('Dimensões')
  })
})

describe('características', () => {
  const equip = (panel: string, ...textos: string[]) =>
    textos.map((text) => ({ panel, text }))

  it('lê só o painel de Descrição', () => {
    const m = modelo({
      equipment: [
        ...equip('Descrição', 'Possui 2 camas de casal'),
        ...equip('Equipamentos de série', 'O casco é moldado com resina de poliéster…'),
      ],
    })
    expect(caracteristicasDe(m)).toEqual(['Possui 2 camas de casal'])
  })

  it('descarta as chamadas de marketing', () => {
    // Aparecem em quase todos os modelos e não diferenciam nada.
    const m = modelo({
      equipment: equip(
        'Descrição',
        'Possui banheiro',
        'E muito mais, confira na guia Especificações',
        '10 anos de Garantia Estrutural!',
        'Altamente customizável',
      ),
    })
    expect(caracteristicasDe(m)).toEqual(['Possui banheiro'])
  })

  it('não repete o mesmo item duas vezes', () => {
    const m = modelo({ equipment: equip('Descrição', 'Possui banheiro', 'possui banheiro.') })
    expect(caracteristicasDe(m)).toHaveLength(1)
  })

  it('separa o que é comum do que é exclusivo', () => {
    const a = modelo({ equipment: equip('Descrição', 'Possui banheiro', 'Proa aberta') })
    const b = modelo({ equipment: equip('Descrição', 'Possui banheiro', 'Proa fechada') })

    const r = compararCaracteristicas(a, b)
    expect(r.emComum).toEqual(['Possui banheiro'])
    expect(r.soA).toEqual(['Proa aberta'])
    expect(r.soB).toEqual(['Proa fechada'])
  })

  it('reconhece como igual apesar de caixa e pontuação', () => {
    const a = modelo({ equipment: equip('Descrição', 'Possui banheiro.') })
    const b = modelo({ equipment: equip('Descrição', 'POSSUI BANHEIRO') })

    const r = compararCaracteristicas(a, b)
    expect(r.emComum).toHaveLength(1)
    expect(r.soA).toEqual([])
    expect(r.soB).toEqual([])
  })

  it('preserva o texto original para exibição', () => {
    // Normalizar é só para comparar; o que aparece na tela é o texto do banco.
    const a = modelo({ equipment: equip('Descrição', 'Possui 2 confortáveis camas de casal') })
    const b = modelo({ equipment: equip('Descrição', 'possui 2 confortáveis camas de casal.') })
    expect(compararCaracteristicas(a, b).emComum).toEqual([
      'Possui 2 confortáveis camas de casal',
    ])
  })
})

describe('descrição do modelo', () => {
  it('usa a description quando existe', () => {
    expect(descricaoDe(modelo({ description: 'Texto longo', tagline: 'Curto' }))).toBe('Texto longo')
  })

  it('cai na tagline quando a description está vazia', () => {
    // É o caso de hoje: description vazia nos 18 modelos.
    expect(descricaoDe(modelo({ description: '', tagline: 'Proa aberta com motor de popa' })))
      .toBe('Proa aberta com motor de popa')
  })

  it('devolve null quando não há nenhum dos dois', () => {
    expect(descricaoDe(modelo())).toBeNull()
  })
})

describe('comparação completa', () => {
  it('monta os dois lados com rótulo, descrição e foto', () => {
    const r = compararModelos(
      modelo({ name: 'Coral 36', variant: 'Aberta', tagline: 'Proa aberta', images: [{ url: '/a.jpg', alt: null }] }),
      modelo({ slug: 'coral-40', name: 'Coral 40', images: [] }),
    )

    expect(r.a.rotulo).toBe('Coral 36 Aberta')
    expect(r.a.descricao).toBe('Proa aberta')
    expect(r.a.foto).toBe('/a.jpg')
    expect(r.b.rotulo).toBe('Coral 40')
    expect(r.b.foto).toBeNull()
  })

  it('funciona com dois modelos sem nenhum dado', () => {
    // Não pode explodir: o painel precisa abrir mesmo com ficha incompleta.
    const r = compararModelos(modelo(), modelo({ slug: 'outro' }))
    expect(r.grupos).toEqual([])
    expect(r.caracteristicas.emComum).toEqual([])
  })
})
