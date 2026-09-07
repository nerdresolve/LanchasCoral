import 'server-only'
import { headers } from 'next/headers'

/**
 * IP de quem fez a requisição, usado como chave dos limites de envio.
 *
 * A ordem dos cabeçalhos é o ponto sensível. `cf-connecting-ip` vem primeiro
 * porque a borda da Cloudflare o REESCREVE a cada requisição: o valor que o
 * cliente mandar nesse cabeçalho é descartado antes de chegar aqui.
 *
 * `x-forwarded-for`, ao contrário, é uma lista à qual cada salto acrescenta um
 * item — e o cliente pode semear o primeiro. Se fosse a fonte principal,
 * bastaria variar esse valor a cada requisição para furar qualquer limite.
 * Ele fica como reserva para quando o site não estiver atrás da Cloudflare
 * (desenvolvimento local, outro proxy na frente).
 */
export async function ipDoCliente() {
  const h = await headers()
  const cf = h.get('cf-connecting-ip')
  if (cf) return cf.trim()
  const fwd = h.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return h.get('x-real-ip') ?? 'desconhecido'
}
