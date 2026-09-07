import { describe, it, expect } from 'vitest'
import { envolver, escapeHtml, tabelaDados, botao, assinatura } from '@/lib/email/layout'
import { memorialDescritivo } from '@/lib/email/templates'

/**
 * Montagem dos e-mails.
 *
 * O ponto sensível é o escape: o conteúdo vem do banco (nome do modelo, nome
 * de quem pediu) e vai para dentro de HTML. Um `<script>` que escape daqui
 * executa no cliente de e-mail de quem recebe.
 */

const PAYLOAD = '"><script>alert(1)</script><img src=x onerror=alert(2)>'

describe('escape de HTML', () => {
  it('neutraliza as aspas e os sinais de tag', () => {
    const saida = escapeHtml(PAYLOAD)
    expect(saida).not.toContain('<script>')
    expect(saida).not.toContain('">')
    expect(saida).toContain('&lt;')
  })

  it('escapa o & antes dos demais, sem duplicar', () => {
    // Se `&` fosse escapado por último, `&lt;` viraria `&amp;lt;`.
    expect(escapeHtml('a & b')).toBe('a &amp; b')
    expect(escapeHtml('<')).toBe('&lt;')
  })
})

describe('tabela de dados', () => {
  it('escapa o rótulo', () => {
    const html = tabelaDados([{ rotulo: PAYLOAD, valor: 'x' }])
    expect(html).not.toContain('<script>')
  })
})

describe('botão', () => {
  it('escapa o endereço e o rótulo', () => {
    const html = botao('https://exemplo.com/"><script>alert(1)</script>', PAYLOAD)
    expect(html).not.toContain('<script>alert(1)</script>')
  })
})

describe('assinatura', () => {
  it('monta o link tel: só com dígitos', () => {
    const html = assinatura(['(21) 3448-7381'])
    expect(html).toContain('tel:+552134487381')
    expect(html).toContain('(21) 3448-7381')
  })

  it('junta vários telefones', () => {
    const html = assinatura(['(21) 1111-1111', '(21) 2222-2222'])
    expect(html).toContain('1111-1111')
    expect(html).toContain('2222-2222')
  })
})

describe('casca do e-mail', () => {
  it('escapa o preheader', () => {
    // O preheader recebe o nome do modelo, vindo do banco.
    expect(envolver('<p>oi</p>', PAYLOAD)).not.toContain('<script>alert(1)</script>')
  })

  it('usa o logotipo quando disponível', () => {
    // `cid:` e não imagem externa: clientes de e-mail bloqueiam as externas.
    expect(envolver('<p>oi</p>', '', true)).toContain('cid:logo-coral')
  })

  it('cai no nome em texto sem o logotipo', () => {
    const html = envolver('<p>oi</p>', '', false)
    expect(html).not.toContain('cid:logo-coral')
    expect(html).toContain('CORAL')
  })

  it('declara a codificação', () => {
    // Sem isso os acentos chegam corrompidos em vários clientes.
    expect(envolver('<p>oi</p>')).toContain('charset=UTF-8')
  })
})

describe('memorial descritivo', () => {
  const base = {
    nome: 'Roberto Silva',
    modelo: 'Coral 36 Aberta',
    urlDoMemorial: 'https://exemplo.com/m.pdf',
    telefones: ['(21) 3448-7381'],
  }

  it('trata o primeiro nome', () => {
    expect(memorialDescritivo(base).html).toContain('Roberto')
  })

  it('usa o nome inteiro quando é uma palavra só', () => {
    expect(memorialDescritivo({ ...base, nome: 'Ana' }).html).toContain('Ana')
  })

  it('escapa nome com HTML', () => {
    // Quem preenche o formulário público controla este campo.
    const { html } = memorialDescritivo({ ...base, nome: PAYLOAD })
    expect(html).not.toContain('<script>alert(1)</script>')
  })

  it('escapa o modelo', () => {
    const { html } = memorialDescritivo({ ...base, modelo: PAYLOAD })
    expect(html).not.toContain('<script>alert(1)</script>')
  })

  it('leva o link do arquivo', () => {
    expect(memorialDescritivo(base).html).toContain(base.urlDoMemorial)
  })

  it('gera versão em texto puro', () => {
    // Cliente que não renderiza HTML precisa receber algo legível.
    const { texto } = memorialDescritivo(base)
    expect(texto).toContain('Coral 36 Aberta')
    expect(texto).toContain(base.urlDoMemorial)
    expect(texto).not.toContain('<')
  })

  it('nomeia o assunto com o modelo', () => {
    expect(memorialDescritivo(base).assunto).toContain('Coral 36 Aberta')
  })
})
