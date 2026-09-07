import 'server-only'
import { prisma } from './prisma'

/**
 * Proteção do login do painel contra força bruta.
 *
 * Duas chaves independentes são contadas na mesma janela:
 *  - por IP    → trava quem varre senhas de vários e-mails;
 *  - por e-mail → trava quem ataca uma conta específica de vários IPs.
 *
 * O bloqueio é temporário e por janela deslizante: passada a janela sem
 * novas falhas, o acesso volta sozinho — não há conta permanentemente
 * travada, o que evitaria um ataque de negação de serviço contra o admin.
 *
 * As tentativas ficam no banco (e não em memória) para que o limite valha
 * mesmo com várias instâncias do servidor e sobreviva a um restart.
 */

/** Falhas toleradas por janela, antes do bloqueio. */
const LIMITE_IP = 10
const LIMITE_EMAIL = 5

/** Janela de contagem e duração do bloqueio. */
const JANELA_MIN = 15

export type Bloqueio = { bloqueado: true; esperarSegundos: number } | { bloqueado: false }

const desde = () => new Date(Date.now() - JANELA_MIN * 60_000)

const chaveIp = (ip: string) => `ip:${ip}`
const chaveEmail = (email: string) => `email:${email.toLowerCase().trim()}`

/** Conta as falhas recentes de uma chave e devolve a mais antiga da janela. */
async function falhasRecentes(key: string) {
  const [total, maisAntiga] = await Promise.all([
    prisma.loginAttempt.count({ where: { key, success: false, createdAt: { gte: desde() } } }),
    prisma.loginAttempt.findFirst({
      where: { key, success: false, createdAt: { gte: desde() } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
  ])
  return { total, maisAntiga: maisAntiga?.createdAt ?? null }
}

/** Verifica, antes de comparar a senha, se o par IP/e-mail está bloqueado. */
export async function verificarBloqueio(ip: string, email: string): Promise<Bloqueio> {
  const [porIp, porEmail] = await Promise.all([
    falhasRecentes(chaveIp(ip)),
    falhasRecentes(chaveEmail(email)),
  ])

  const estourou =
    (porIp.total >= LIMITE_IP && porIp.maisAntiga) ||
    (porEmail.total >= LIMITE_EMAIL && porEmail.maisAntiga)

  if (!estourou) return { bloqueado: false }

  // Libera quando a falha mais antiga sair da janela.
  const liberaEm = new Date(estourou.getTime() + JANELA_MIN * 60_000)
  const segundos = Math.max(1, Math.ceil((liberaEm.getTime() - Date.now()) / 1000))
  return { bloqueado: true, esperarSegundos: segundos }
}

/** Registra o resultado de uma tentativa. */
export async function registrarTentativa(ip: string, email: string, success: boolean) {
  await prisma.loginAttempt.createMany({
    data: [
      { key: chaveIp(ip), success },
      { key: chaveEmail(email), success },
    ],
  })

  // Um acerto zera o histórico de falhas daquele e-mail e daquele IP.
  if (success) {
    await prisma.loginAttempt.deleteMany({
      where: { key: { in: [chaveIp(ip), chaveEmail(email)] }, success: false },
    })
  }

  // Poda oportunista: mantém a tabela pequena sem precisar de cron.
  if (Math.random() < 0.05) {
    await prisma.loginAttempt.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 24 * 3600_000) } },
    })
  }
}

/**
 * Limite genérico por chave, para formulários públicos.
 *
 * Reaproveita a mesma tabela do login: o que muda é só o prefixo da chave.
 * Serve para o formulário de contato, que antes tinha apenas o campo-isca —
 * um script que simplesmente não preenchesse a isca gravava uma linha por
 * requisição, sem teto nenhum.
 *
 * Diferente do login, aqui toda tentativa conta (não só as falhas): o abuso
 * que se quer conter é justamente o envio bem-sucedido em massa.
 *
 * Devolve `true` quando a requisição pode seguir.
 */
export async function permitirEnvio(chave: string, limite: number, janelaMin = 60) {
  const key = `envio:${chave}`
  const desdeQuando = new Date(Date.now() - janelaMin * 60_000)

  const total = await prisma.loginAttempt.count({
    where: { key, createdAt: { gte: desdeQuando } },
  })
  if (total >= limite) return false

  await prisma.loginAttempt.create({ data: { key, success: true } })
  return true
}

/** Texto de erro com o tempo restante, em minutos ou segundos. */
export function mensagemBloqueio(segundos: number) {
  const min = Math.ceil(segundos / 60)
  return min > 1
    ? `Muitas tentativas. Tente novamente em ${min} minutos.`
    : `Muitas tentativas. Tente novamente em ${segundos} segundos.`
}
