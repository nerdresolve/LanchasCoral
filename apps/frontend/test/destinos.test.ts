import { describe, expect, it } from 'vitest'
import { CAIXAS, COPIA_MEMORIAL, destinoDe } from '@/lib/email/destinos'

/*
 * Para quem vai cada formulário.
 *
 * Errar aqui manda currículo para o comercial e pedido de peça para o RH, o
 * que não aparece em nenhum teste de tela: o formulário envia, o visitante vê
 * "recebemos", e a mensagem chega à caixa errada.
 */
describe('destinoDe', () => {
  it('manda assunto comercial para o comercial', () => {
    expect(destinoDe('CONTATO')).toBe(CAIXAS.comercial)
    expect(destinoDe('PROPOSTA')).toBe(CAIXAS.comercial)
  })

  it('manda memorial e serviços para a assistência', () => {
    expect(destinoDe('MANUAL')).toBe(CAIXAS.assistencia)
    expect(destinoDe('SERVICOS')).toBe(CAIXAS.assistencia)
  })

  it('manda currículo para o RH', () => {
    expect(destinoDe('TRABALHE')).toBe(CAIXAS.dp)
  })

  it('manda fornecedor para compras', () => {
    expect(destinoDe('ANUNCIAR')).toBe(CAIXAS.compras)
  })

  it('aceita o tipo em qualquer caixa', () => {
    /* O `kind` vem de formulário e do banco, onde nada garante maiúscula. */
    expect(destinoDe('manual')).toBe(CAIXAS.assistencia)
    expect(destinoDe('Trabalhe')).toBe(CAIXAS.dp)
  })

  it('não perde mensagem de tipo desconhecido', () => {
    /* Um `kind` novo que alguém acrescente sem passar por aqui ainda precisa
       chegar a alguém, em vez de sumir. */
    expect(destinoDe('TIPO_QUE_NAO_EXISTE')).toBe(CAIXAS.comercial)
    expect(destinoDe(null)).toBe(CAIXAS.comercial)
    expect(destinoDe(undefined)).toBe(CAIXAS.comercial)
    expect(destinoDe('')).toBe(CAIXAS.comercial)
  })

  it('a cópia do memorial vai para a assistência', () => {
    expect(COPIA_MEMORIAL).toBe(CAIXAS.assistencia)
  })

  it('todos os endereços são do domínio do cliente', () => {
    /* Um endereço de teste esquecido aqui mandaria contato de cliente para
       fora da empresa. */
    for (const caixa of Object.values(CAIXAS)) {
      expect(caixa).toMatch(/@lanchascoral\.com\.br$/)
    }
  })

  it('cada setor tem caixa própria', () => {
    const unicos = new Set(Object.values(CAIXAS))
    expect(unicos.size).toBe(Object.keys(CAIXAS).length)
  })
})
