/**
 * Injeta dados estruturados (JSON-LD) na página.
 *
 * `dangerouslySetInnerHTML` é inevitável aqui: o conteúdo precisa sair como
 * JSON cru dentro de um `<script>`, e o React não renderiza isso de outro
 * jeito. O cuidado está no escape.
 *
 * ## Por que este escape existe
 *
 * O conteúdo vem do banco — nome do modelo, descrição, título do anúncio —,
 * tudo editável pelo painel. `JSON.stringify` escapa aspas e barras, mas NÃO
 * escapa a sequência `</script>`: o navegador encerra o bloco ali e passa a
 * interpretar o resto como HTML.
 *
 * Um nome de modelo gravado como
 *
 *     ZZ "><script>alert(1)</script>
 *
 * saía do JSON e executava. Reproduzido em produção: a página escapava o texto
 * corretamente no `<h1>`, mas o mesmo valor escorria pelo JSON-LD.
 *
 * O `replace` anterior era `/</g → '<'`, que não fazia nada: em
 * JavaScript, `'<'` É o caractere `<`. Para o navegador ver a sequência
 * de escape, ela precisa chegar como as seis letras `\`, `u`, `0`, `0`, `3`,
 * `c` — daí a barra dupla abaixo.
 *
 * `<`, `>` e `&` cobrem `</script>`, `<!--` e as entidades HTML. O JSON
 * continua válido: dentro de uma string JSON, `<` é lido como `<`.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
