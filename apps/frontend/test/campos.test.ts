import { describe, it, expect } from 'vitest'
import {
  numeroOpcional,
  inteiroOpcional,
  textoOpcional,
  urlDeImagem,
  urlDeDocumento,
  slugValido,
  HOSTS_DE_IMAGEM,
  MAX_DECIMAL_5_2,
} from '@/lib/campos'

/**
 * Regras de campo compartilhadas pelos formulários do painel.
 *
 * Cada caso aqui corresponde a algo que o operador digita de verdade, ou que
 * um POST forjado pode mandar — as Server Actions são endpoints HTTP comuns,
 * então a validação é a única barreira.
 */

describe('números', () => {
  const n = numeroOpcional()

  it('aceita vírgula decimal', () => {
    // O teclado brasileiro produz vírgula; `Number('4,86')` seria NaN.
    expect(n.parse('4,86')).toBe(4.86)
    expect(n.parse('11,5')).toBe(11.5)
  })

  it('aceita ponto decimal', () => {
    expect(n.parse('4.86')).toBe(4.86)
  })

  it('trata campo vazio como ausente, não como zero', () => {
    // Zero é uma medida válida; confundir os dois apagaria a diferença entre
    // "não informado" e "vale zero".
    expect(n.parse('')).toBeUndefined()
    expect(n.parse(null)).toBeUndefined()
    expect(n.parse(undefined)).toBeUndefined()
  })

  it('recusa valor acima do que a coluna aguenta', () => {
    // Decimal(5,2) no Postgres: acima de 999.99 estoura na inserção.
    expect(() => n.parse('1000')).toThrow()
    expect(n.parse(String(MAX_DECIMAL_5_2))).toBe(MAX_DECIMAL_5_2)
  })

  it('recusa negativo', () => {
    expect(() => n.parse('-3')).toThrow()
  })

  it('recusa texto que não é número', () => {
    expect(() => n.parse('abacaxi')).toThrow()
  })

  it('recusa infinito', () => {
    expect(() => n.parse('Infinity')).toThrow()
  })
})

describe('inteiros', () => {
  const i = inteiroOpcional(1000)

  it('aceita inteiro dentro do teto', () => {
    expect(i.parse('500')).toBe(500)
  })

  it('recusa fracionário', () => {
    expect(() => i.parse('1.5')).toThrow()
  })

  it('recusa acima do teto', () => {
    expect(() => i.parse('1001')).toThrow()
  })
})

describe('texto opcional', () => {
  const t = textoOpcional(10)

  it('remove espaços das pontas', () => {
    expect(t.parse('  oi  ')).toBe('oi')
  })

  it('trata só-espaços como ausente', () => {
    expect(t.parse('   ')).toBeUndefined()
  })

  it('recusa acima do limite', () => {
    expect(() => t.parse('12345678901')).toThrow()
  })
})

describe('URL de imagem', () => {
  const u = urlDeImagem()

  it.each(HOSTS_DE_IMAGEM)('aceita host permitido: %s', (host) => {
    expect(u.parse(`https://${host}/foto.jpg`)).toContain(host)
  })

  it('aceita subdomínio de host permitido', () => {
    expect(() => u.parse('https://cdn.mariath.dev/foto.jpg')).not.toThrow()
  })

  it('aceita caminho interno', () => {
    // Servido de `public/`, não passa pelo otimizador.
    expect(u.parse('/brand/foto.jpg')).toBe('/brand/foto.jpg')
  })

  it('recusa host fora da lista', () => {
    // O next/image responde 400 a esses, e a foto aparece quebrada no site.
    expect(() => u.parse('https://evil.example.com/a.jpg')).toThrow()
  })

  it('recusa http sem TLS', () => {
    expect(() => u.parse('http://lanchascoral.com.br/a.jpg')).toThrow()
  })

  it('recusa texto que não é endereço', () => {
    expect(() => u.parse('abacaxi')).toThrow()
  })

  it('não se deixa enganar por host parecido', () => {
    // `lanchascoral.com.br.evil.com` termina com o domínio permitido no meio,
    // mas o host real é outro.
    expect(() => u.parse('https://lanchascoral.com.br.evil.com/a.jpg')).toThrow()
    expect(() => u.parse('https://naolanchascoral.com.br/a.jpg')).toThrow()
  })
})

describe('URL de documento', () => {
  const d = urlDeDocumento()

  it('aceita https de qualquer host', () => {
    // O PDF é link comum, não passa pelo otimizador de imagem.
    expect(() => d.parse('https://exemplo.com/memorial.pdf')).not.toThrow()
  })

  it('aceita caminho interno', () => {
    expect(d.parse('/memoriais/coral-36.pdf')).toBe('/memoriais/coral-36.pdf')
  })

  it('recusa javascript:', () => {
    // Viraria link clicável executando script na página pública.
    expect(() => d.parse('javascript:alert(1)')).toThrow()
  })

  it('recusa data:', () => {
    expect(() => d.parse('data:text/html,<script>alert(1)</script>')).toThrow()
  })

  it('trata vazio como ausente', () => {
    expect(d.parse('')).toBeUndefined()
  })
})

describe('slug', () => {
  const s = slugValido()

  it('aceita minúsculas com hífen', () => {
    expect(s.parse('coral-36-cabinada')).toBe('coral-36-cabinada')
  })

  it('recusa maiúscula e espaço', () => {
    expect(() => s.parse('Coral 36')).toThrow()
  })

  it('recusa acento', () => {
    expect(() => s.parse('coral-36-cabinadá')).toThrow()
  })

  it.each(['new', 'novo', 'admin', 'api'])('recusa reservado: %s', (r) => {
    // Colidiria com as próprias telas do painel: /admin/boats/new.
    expect(() => s.parse(r)).toThrow(/painel/i)
  })

  it('recusa hífen no começo ou fim', () => {
    expect(() => s.parse('-coral')).toThrow()
    expect(() => s.parse('coral-')).toThrow()
  })

  it('recusa vazio', () => {
    expect(() => s.parse('')).toThrow()
  })
})
