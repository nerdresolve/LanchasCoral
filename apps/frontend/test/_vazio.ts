/**
 * Substituto de `server-only` nos testes.
 *
 * O pacote real lança um erro ao ser importado fora de um Server Component —
 * é essa a função dele. Num teste de Node isso impediria qualquer módulo do
 * servidor de carregar, então o `vitest.config.ts` aponta `server-only` para
 * este arquivo, que não faz nada.
 *
 * A proteção continua valendo onde importa: no build do Next, o pacote real
 * é usado e barra o import indevido no cliente.
 */
export {}
