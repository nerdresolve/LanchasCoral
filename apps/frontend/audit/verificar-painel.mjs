#!/usr/bin/env node
/*
 * Roda toda a conferência do painel de uma vez.
 *
 *   node audit/verificar-painel.mjs
 *
 * Vale rodar antes de cada publicação: os testes que falam com o site batem em
 * https://coral.nerdresolve.com, então conferem o que está NO AR, não o código
 * local. Rebuilde antes se quiser validar mudanças novas.
 *
 * Nada aqui altera conteúdo real de forma permanente: o que é criado é
 * apagado, e o que é editado volta ao valor original.
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))

const SUITES = [
  ['_teste-validacao', 'regras de validação (sem tocar no banco)'],
  ['_valida-banco', 'todo o conteúdo real passa pelas regras'],
  ['_teste-painel', 'acesso, campos e revalidação'],
  ['_teste-criacao', 'criar modelo e anúncio do zero'],
  ['_teste-persistencia', 'o que é salvo continua salvo'],
  ['_teste-exclusao', 'exclusão exige confirmação'],
  ['_teste-rodada', 'galeria, contatos, memorial e envio'],
  ['_teste-email-config', 'configurador de e-mail e domínios negados'],
  ['_pentest', 'ataques: XSS, injeção, IDOR, vazamento'],
  ['_pentest3', 'abuso: duplo-clique, série, campos sem teto'],
  ['_teste-comparador', 'comparação entre modelos'],
  ['_varredura', 'layout no celular: 20 rotas x 3 larguras'],
]

function rodar(nome) {
  return new Promise((resolve) => {
    /*
     * Roda o tsx pelo próprio Node, apontando para o .mjs do pacote.
     *
     * Nem `npx` com `shell: true` (o Node avisa que os argumentos não são
     * escapados), nem o atalho em node_modules/.bin (no Windows é um .cmd,
     * que o spawn recusa sem shell). Assim funciona nos dois sistemas.
     */
    const tsx = path.join(AQUI, '..', 'node_modules', 'tsx', 'dist', 'cli.mjs')
    const p = spawn(process.execPath, [tsx, path.join(AQUI, `${nome}.mjs`)], {
      cwd: path.join(AQUI, '..'),
    })
    let saida = ''
    p.stdout.on('data', (d) => (saida += d))
    p.stderr.on('data', (d) => (saida += d))
    p.on('close', (codigo) => resolve({ codigo, saida }))
  })
}

console.log('Conferindo o painel em https://coral.nerdresolve.com\n')

let quebrou = 0
let primeiro = true
for (const [nome, descricao] of SUITES) {
  /*
   * Uma folga entre conjuntos.
   *
   * Todos batem no mesmo site, e uma revalidação disparada pelo conjunto
   * anterior pode ainda estar em curso quando o seguinte começa a conferir
   * páginas — o que dava falha intermitente sem haver defeito nenhum.
   */
  if (!primeiro) await new Promise((r) => setTimeout(r, 4000))
  primeiro = false

  process.stdout.write(`${descricao.padEnd(46)}`)
  const { codigo, saida } = await rodar(nome)
  if (codigo === 0) {
    const casos = (saida.match(/^ {2}ok {2}/gm) ?? []).length
    console.log(`ok${casos ? `  (${casos} casos)` : ''}`)
  } else {
    quebrou++
    console.log('FALHOU')
    for (const linha of saida.split('\n')) {
      if (/^ FALHA|Error|error:/.test(linha)) console.log(`    ${linha.trim()}`)
    }
  }
}

console.log(
  quebrou === 0
    ? '\nTudo certo.'
    : `\n${quebrou} conjunto(s) com falha. Rode o script individual para ver o detalhe.`,
)
process.exit(quebrou === 0 ? 0 : 1)
