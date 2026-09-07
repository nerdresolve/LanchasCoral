import { describe, expect, it } from 'vitest'
import { urlDeVideo } from '@/lib/campos'

/*
 * O campo do vídeo do hero.
 *
 * Diferente das fotos, que aceitam hosts externos conhecidos, aqui só entra
 * arquivo servido pelo próprio site: um vídeo de terceiro num elemento que
 * toca sozinho no topo da página é risco desnecessário, e o Drive — de onde
 * estes arquivos vêm — bloqueia por cota quando há muito acesso.
 */
describe('urlDeVideo', () => {
  const v = urlDeVideo()
  const aceita = (s: unknown) => v.safeParse(s).success

  it('aceita arquivo interno em /videos', () => {
    expect(aceita('/videos/coral-40.mp4')).toBe(true)
    expect(aceita('/videos/coral-36-aberta.webm')).toBe(true)
    expect(aceita('/videos/coral_50.mp4')).toBe(true)
  })

  it('trata vazio como ausente, e não como erro', () => {
    /* O formulário manda string vazia quando o operador limpa o campo; isso
       precisa significar "sem vídeo", não "valor inválido". */
    expect(v.parse('')).toBeUndefined()
    expect(v.parse('   ')).toBeUndefined()
    expect(v.parse(undefined)).toBeUndefined()
  })

  it('recusa host externo', () => {
    expect(aceita('https://exemplo.com/v.mp4')).toBe(false)
    expect(aceita('https://drive.google.com/file/d/abc/view')).toBe(false)
    expect(aceita('//evil.test/v.mp4')).toBe(false)
  })

  it('recusa saída da pasta', () => {
    /* `..` chegaria a arquivos fora de /public/videos. */
    expect(aceita('/videos/../../etc/passwd')).toBe(false)
    expect(aceita('/videos/../.env')).toBe(false)
    expect(aceita('/outra/pasta/v.mp4')).toBe(false)
  })

  it('recusa esquema perigoso', () => {
    expect(aceita('javascript:alert(1)')).toBe(false)
    expect(aceita('data:video/mp4;base64,AAAA')).toBe(false)
    expect(aceita('file:///c:/windows/system32')).toBe(false)
  })

  it('recusa extensão que o navegador não toca como vídeo', () => {
    expect(aceita('/videos/coral.svg')).toBe(false)
    expect(aceita('/videos/coral.html')).toBe(false)
    expect(aceita('/videos/coral.mp4.html')).toBe(false)
    expect(aceita('/videos/coral')).toBe(false)
  })

  it('recusa nome com acento ou espaço', () => {
    /* Não é preciosismo: acento e espaço em nome de arquivo servido viram
       problema de codificação de URL em algum ponto da cadeia. */
    expect(aceita('/videos/coral 40.mp4')).toBe(false)
    expect(aceita('/videos/lanchação.mp4')).toBe(false)
  })

  it('recusa caminho absurdamente longo', () => {
    expect(aceita('/videos/' + 'a'.repeat(400) + '.mp4')).toBe(false)
  })
})
