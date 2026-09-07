import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * Cifragem dos segredos guardados no banco.
 *
 * É o código mais sensível do sistema: se falhar, a senha do e-mail da
 * empresa fica legível em todo backup.
 *
 * O módulo é recarregado a cada teste (`vi.resetModules`) porque a chave é
 * lida do ambiente na primeira chamada; sem isso, trocar `CORAL_SECRET_KEY`
 * no meio da suíte não teria efeito.
 */

const CHAVE_A = 'chave-de-teste-com-mais-de-32-caracteres-aqui'
const CHAVE_B = 'outra-chave-completamente-diferente-e-longa-tambem'

async function carregar() {
  vi.resetModules()
  return import('@/lib/cripto')
}

let cripto: Awaited<ReturnType<typeof carregar>>

beforeEach(async () => {
  process.env.CORAL_SECRET_KEY = CHAVE_A
  cripto = await carregar()
})

afterEach(() => {
  delete process.env.CORAL_SECRET_KEY
})

describe('cifrar e decifrar', () => {
  it('devolve o texto original', () => {
    const segredo = 'senha-do-smtp-123!@#'
    expect(cripto.decifrar(cripto.cifrar(segredo))).toBe(segredo)
  })

  it('preserva acentos e emoji', () => {
    const segredo = 'çãõ~^ áéí 🔐 senha'
    expect(cripto.decifrar(cripto.cifrar(segredo))).toBe(segredo)
  })

  it('preserva texto vazio', () => {
    expect(cripto.decifrar(cripto.cifrar(''))).toBe('')
  })

  it('gera saída diferente a cada chamada', () => {
    // IV novo por cifragem: reusar IV em GCM quebra a segurança do modo.
    const a = cripto.cifrar('mesmo-texto')
    const b = cripto.cifrar('mesmo-texto')
    expect(a).not.toBe(b)
    expect(cripto.decifrar(a)).toBe(cripto.decifrar(b))
  })

  it('não deixa o segredo legível no texto cifrado', () => {
    const segredo = 'senha-super-secreta'
    expect(cripto.cifrar(segredo)).not.toContain(segredo)
  })

  it('marca a versão do formato', () => {
    expect(cripto.cifrar('x').startsWith('v1.')).toBe(true)
  })
})

describe('resistência a adulteração', () => {
  it('recusa texto cifrado alterado', () => {
    const partes = cripto.cifrar('original').split('.')
    partes[3] = Buffer.from('adulterado').toString('base64url')
    expect(() => cripto.decifrar(partes.join('.'))).toThrow()
  })

  it('recusa etiqueta de autenticação alterada', () => {
    const partes = cripto.cifrar('original').split('.')
    partes[2] = Buffer.from('0123456789abcdef').toString('base64url')
    expect(() => cripto.decifrar(partes.join('.'))).toThrow()
  })

  it('recusa formato desconhecido', () => {
    expect(() => cripto.decifrar('v2.a.b.c')).toThrow(/formato/i)
    expect(() => cripto.decifrar('sem-pontos')).toThrow()
  })
})

describe('troca de chave', () => {
  it('não decifra o que foi cifrado com outra chave', async () => {
    const guardado = cripto.cifrar('segredo')

    process.env.CORAL_SECRET_KEY = CHAVE_B
    const outro = await carregar()
    expect(() => outro.decifrar(guardado)).toThrow()
  })

  it('decifrarSeguro devolve null em vez de derrubar a página', async () => {
    const guardado = cripto.cifrar('segredo')

    process.env.CORAL_SECRET_KEY = CHAVE_B
    const outro = await carregar()
    expect(outro.decifrarSeguro(guardado)).toBeNull()
  })

  it('decifrarSeguro aceita null', () => {
    expect(cripto.decifrarSeguro(null)).toBeNull()
  })
})

describe('exigência de chave', () => {
  it('recusa chave curta demais', async () => {
    process.env.CORAL_SECRET_KEY = 'curta'
    const fraco = await carregar()
    expect(() => fraco.cifrar('x')).toThrow(/32/)
  })

  it('recusa ausência de chave', async () => {
    delete process.env.CORAL_SECRET_KEY
    const sem = await carregar()
    expect(() => sem.cifrar('x')).toThrow()
    expect(sem.criptoConfigurado()).toBe(false)
  })

  it('reconhece chave suficiente', () => {
    expect(cripto.criptoConfigurado()).toBe(true)
  })
})
