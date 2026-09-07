import { describe, it, expect } from 'vitest'
import { boatSchema, parseBoatForm } from '@/lib/boat-schema'
import { listingSchema, parseListingForm, TIPOS_DE_MOTOR } from '@/lib/listing-schema'

/**
 * Schemas dos formulários do painel.
 *
 * Além das regras de campo (cobertas em `campos.test.ts`), aqui se verifica o
 * conjunto: campos obrigatórios, coerência entre valores e os tetos que
 * protegem o banco de entrada abusiva.
 */

const MODELO_MINIMO = {
  slug: 'coral-36',
  name: 'Coral 36',
  published: true,
  order: '0',
  images: [],
  equipment: [],
  performance: [],
}

const ANUNCIO_MINIMO = {
  slug: 'coral-40a-2024',
  title: 'Coral 40A FULL',
  kind: 'LANCHA',
  published: true,
  sold: false,
  order: '0',
  images: [],
  accessories: [],
}

describe('modelo: campos obrigatórios', () => {
  it('aceita o mínimo', () => {
    expect(boatSchema.safeParse(MODELO_MINIMO).success).toBe(true)
  })

  it('exige nome', () => {
    expect(boatSchema.safeParse({ ...MODELO_MINIMO, name: '' }).success).toBe(false)
  })

  it('exige endereço de página', () => {
    expect(boatSchema.safeParse({ ...MODELO_MINIMO, slug: '' }).success).toBe(false)
  })
})

describe('modelo: coerência entre campos', () => {
  it('recusa potência mínima maior que a máxima', () => {
    const r = boatSchema.safeParse({ ...MODELO_MINIMO, powerMinHp: '400', powerMaxHp: '300' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/potência/i)
  })

  it('aceita mínima igual à máxima', () => {
    expect(
      boatSchema.safeParse({ ...MODELO_MINIMO, powerMinHp: '300', powerMaxHp: '300' }).success,
    ).toBe(true)
  })

  it('aceita só a máxima informada', () => {
    expect(boatSchema.safeParse({ ...MODELO_MINIMO, powerMaxHp: '300' }).success).toBe(true)
  })
})

describe('modelo: tetos contra abuso', () => {
  const gigante = 'A'.repeat(300_000)

  it('recusa nome enorme', () => {
    expect(boatSchema.safeParse({ ...MODELO_MINIMO, name: gigante }).success).toBe(false)
  })

  it('recusa descrição enorme', () => {
    expect(boatSchema.safeParse({ ...MODELO_MINIMO, description: gigante }).success).toBe(false)
  })

  it('recusa fotos demais', () => {
    const fotos = Array.from({ length: 250 }, () => ({ url: '/a.jpg' }))
    expect(boatSchema.safeParse({ ...MODELO_MINIMO, images: fotos }).success).toBe(false)
  })

  it('aceita a galeria mais cheia que existe hoje (92 fotos)', () => {
    // O teto não pode barrar conteúdo já cadastrado.
    const fotos = Array.from({ length: 92 }, () => ({ url: '/a.jpg' }))
    expect(boatSchema.safeParse({ ...MODELO_MINIMO, images: fotos }).success).toBe(true)
  })

  it('recusa equipamentos demais', () => {
    const itens = Array.from({ length: 5000 }, () => ({ panel: 'x', text: 'y' }))
    expect(boatSchema.safeParse({ ...MODELO_MINIMO, equipment: itens }).success).toBe(false)
  })

  it('aceita a quantidade real de equipamentos (33)', () => {
    const itens = Array.from({ length: 33 }, () => ({ panel: 'x', text: 'y' }))
    expect(boatSchema.safeParse({ ...MODELO_MINIMO, equipment: itens }).success).toBe(true)
  })
})

describe('anúncio: motorização', () => {
  it.each(TIPOS_DE_MOTOR)('aceita %s', (tipo) => {
    expect(listingSchema.safeParse({ ...ANUNCIO_MINIMO, engineType: tipo }).success).toBe(true)
  })

  it('recusa variação de caixa', () => {
    // O filtro público agrupa por igualdade exata; "popa" sumiria do grupo.
    expect(listingSchema.safeParse({ ...ANUNCIO_MINIMO, engineType: 'popa' }).success).toBe(false)
  })

  it('recusa valor inventado', () => {
    expect(listingSchema.safeParse({ ...ANUNCIO_MINIMO, engineType: 'Turbina' }).success).toBe(false)
  })

  it('permite deixar em branco', () => {
    // Nem todo anúncio traz a informação.
    const r = listingSchema.safeParse({ ...ANUNCIO_MINIMO, engineType: '' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.engineType).toBeUndefined()
  })
})

describe('anúncio: ano e preço', () => {
  it('aceita ano plausível', () => {
    expect(listingSchema.safeParse({ ...ANUNCIO_MINIMO, year: '2020' }).success).toBe(true)
  })

  it('recusa ano anterior à navegação a motor', () => {
    expect(listingSchema.safeParse({ ...ANUNCIO_MINIMO, year: '1800' }).success).toBe(false)
  })

  it('recusa ano muito à frente', () => {
    const daquiA10 = new Date().getFullYear() + 10
    expect(listingSchema.safeParse({ ...ANUNCIO_MINIMO, year: String(daquiA10) }).success).toBe(false)
  })

  it('aceita o maior preço do estoque real', () => {
    expect(listingSchema.safeParse({ ...ANUNCIO_MINIMO, priceBrl: '1990000' }).success).toBe(true)
  })

  it('recusa preço que estouraria a coluna', () => {
    expect(listingSchema.safeParse({ ...ANUNCIO_MINIMO, priceBrl: '999999999999' }).success).toBe(false)
  })
})

describe('conversão do formulário', () => {
  /* `parseBoatForm` recebe o FormData cru do navegador: checkbox vira
     booleano, repetidores chegam como JSON em campo escondido. */

  const fd = (campos: Record<string, string>) => {
    const f = new FormData()
    for (const [k, v] of Object.entries(campos)) f.append(k, v)
    return f
  }

  it('converte checkbox marcado', () => {
    const r = parseBoatForm(fd({ slug: 'x', name: 'X', published: 'on', order: '0' }))
    expect(r.success && r.data.published).toBe(true)
  })

  it('trata checkbox ausente como desmarcado', () => {
    // Navegador não envia checkbox desmarcado: a ausência É o valor `false`.
    const r = parseBoatForm(fd({ slug: 'x', name: 'X', order: '0' }))
    expect(r.success && r.data.published).toBe(false)
  })

  it('lê repetidores em JSON', () => {
    const r = parseBoatForm(
      fd({
        slug: 'x', name: 'X', order: '0',
        images: JSON.stringify([{ url: '/a.jpg' }, { url: '/b.jpg' }]),
      }),
    )
    expect(r.success && r.data.images).toHaveLength(2)
  })

  it('não quebra com JSON malformado', () => {
    // Um campo adulterado não pode derrubar a action com exceção crua.
    const r = parseBoatForm(fd({ slug: 'x', name: 'X', order: '0', images: '{quebrado' }))
    expect(r.success && r.data.images).toEqual([])
  })

  it('converte sold do anúncio', () => {
    const r = parseListingForm(
      fd({ slug: 'x', title: 'X', kind: 'LANCHA', order: '0', sold: 'on' }),
    )
    expect(r.success && r.data.sold).toBe(true)
  })
})
