import 'server-only'
import type { Prisma } from '@prisma/client'

/**
 * Trava de escrita por registro, para gravações que apagam e recriam filhos.
 *
 * ## O problema
 *
 * As edições de modelo e de anúncio substituem a galeria por completo:
 * `deleteMany` das fotos, depois `create` da lista nova. Isso é correto para
 * aplicar ordem e remoções de uma vez, mas a transação sozinha não basta.
 *
 * O Postgres roda em READ COMMITTED, onde duas transações podem se intercalar:
 *
 *     A: apaga as 57 fotos
 *     B: apaga (não encontra nada, A ainda não confirmou)
 *     A: insere 57  → confirma
 *     B: insere 57  → confirma
 *     resultado: 114 fotos, cada uma duplicada
 *
 * Não é hipotético: reproduzido com duas abas do painel salvando o mesmo
 * modelo, e um duplo-clique no botão de salvar tem o mesmo efeito.
 *
 * ## A solução
 *
 * `pg_advisory_xact_lock` faz a segunda transação esperar a primeira terminar,
 * em vez de correr junto. É liberado sozinho quando a transação acaba (por
 * commit ou rollback), então uma falha no meio não deixa registro travado —
 * diferente de `pg_advisory_lock`, que exigiria unlock explícito.
 *
 * A chave é derivada do id do registro, então gravações em modelos diferentes
 * continuam em paralelo; só as concorrentes no MESMO registro se enfileiram.
 */

/**
 * Converte o id (cuid, texto) nos dois inteiros de 32 bits que a função do
 * Postgres recebe. É um hash FNV-1a simples: não precisa de qualidade
 * criptográfica, só de espalhar bem o suficiente para que dois registros
 * distintos raramente caiam na mesma chave — e, se caírem, o pior efeito é
 * uma gravação esperar a outra sem necessidade.
 */
function chaveDoId(id: string): [number, number] {
  let a = 0x811c9dc5
  let b = 0x01000193
  for (let i = 0; i < id.length; i++) {
    a = Math.imul(a ^ id.charCodeAt(i), 0x01000193) >>> 0
    b = Math.imul(b + id.charCodeAt(i), 0x85ebca6b) >>> 0
  }
  // `| 0` traz para o intervalo de int4 com sinal, que é o que a função espera.
  return [a | 0, b | 0]
}

/**
 * Pega a trava do registro dentro da transação corrente.
 *
 * Precisa ser a PRIMEIRA operação da transação: travar depois de já ter lido
 * ou escrito algo deixaria uma janela para a corrida acontecer antes.
 *
 * @param tx    cliente da transação (o `tx` de `prisma.$transaction`)
 * @param tabela nome da tabela, para que ids iguais em tabelas diferentes não
 *               disputem a mesma trava
 * @param id     id do registro que será alterado
 */
export async function travarRegistro(
  tx: Prisma.TransactionClient,
  tabela: string,
  id: string,
) {
  const [a, b] = chaveDoId(`${tabela}:${id}`)
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${a}::int, ${b}::int)`
}
