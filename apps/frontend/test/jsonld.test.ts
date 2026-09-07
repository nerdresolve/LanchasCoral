import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import JsonLd from '@/components/JsonLd'

/**
 * Escape do JSON-LD.
 *
 * Estes testes existem por causa de uma vulnerabilidade real encontrada em
 * 02/09/2026: o componente fazia `.replace(/</g, '<')`, que não faz nada
 * — em JavaScript `'<'` É o caractere `<`. Um nome de modelo gravado
 * pelo painel com `"><script>…` escapava do bloco e executava no navegador de
 * quem abrisse a página.
 *
 * O conteúdo do JSON-LD vem do banco e é editável pelo painel, então o escape
 * é a única barreira. Um teste que falhe aqui é uma vulnerabilidade aberta.
 */

const render = (dados: object | object[]) =>
  renderToStaticMarkup(createElement(JsonLd, { data: dados }))

/**
 * Só o conteúdo entre as tags.
 *
 * O `<script>` tem a própria tag de fechamento, que sempre aparece no HTML —
 * procurar `</script>` no documento inteiro acusaria a tag legítima. O que
 * precisa estar limpo é o que vai DENTRO dela.
 */
const conteudoDe = (dados: object | object[]) =>
  render(dados).replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '')

describe('escape do JSON-LD', () => {
  it('não deixa </script> fechar o bloco', () => {
    // O ataque: o navegador encerra o <script> e interpreta o resto como HTML.
    const html = render({ name: '"><script>alert(1)</script>' })
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('\\u003c')
  })

  it('escapa a variação com espaço e barra', () => {
    expect(conteudoDe({ name: '</ script >' })).not.toMatch(/<\/\s*script\s*>/i)
  })

  it('escapa maiúsculas', () => {
    // O HTML não diferencia caixa nas tags.
    const dentro = conteudoDe({ name: '</SCRIPT><IMG SRC=x ONERROR=alert(1)>' })
    expect(dentro.toLowerCase()).not.toContain('</script>')
    expect(dentro).not.toContain('<IMG')
  })

  it('escapa o começo de comentário HTML', () => {
    // `<!--` dentro de <script> muda como o navegador lê o resto.
    expect(conteudoDe({ name: '<!--' })).not.toContain('<!--')
  })

  it('escapa & para não formar entidade', () => {
    expect(render({ name: 'a & b' })).toContain('\\u0026')
  })

  it('escapa em campo aninhado', () => {
    // O JSON-LD real tem objetos dentro de objetos (brand, breadcrumb).
    const dentro = conteudoDe({ brand: { name: '</script><script>alert(1)</script>' } })
    expect(dentro).not.toContain('<script>')
  })

  it('escapa dentro de array', () => {
    const dentro = conteudoDe([{ a: 1 }, { name: '</script><script>alert(1)</script>' }])
    expect(dentro).not.toContain('<script>')
  })

  it('mantém o JSON válido depois do escape', () => {
    // Dentro de uma string JSON, < é lido de volta como '<'.
    const original = { name: 'Coral <36> & "Aberta"', preco: 1990000 }
    expect(JSON.parse(conteudoDe(original))).toEqual(original)
  })

  it('preserva acentos', () => {
    const nome = 'Coral 36 Cabinada — Indústria Naval'
    expect(JSON.parse(conteudoDe({ name: nome })).name).toBe(nome)
  })

  it('declara o tipo correto', () => {
    // Sem `application/ld+json` o Google ignora o bloco.
    expect(render({ a: 1 })).toContain('type="application/ld+json"')
  })
})
