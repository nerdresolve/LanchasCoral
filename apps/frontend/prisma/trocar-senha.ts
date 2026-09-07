/*
 * Troca a senha de acesso ao painel.
 *
 *   npx tsx prisma/trocar-senha.ts <e-mail> <senha-nova>
 *
 * A senha é guardada como hash bcrypt; o texto digitado não fica salvo em
 * lugar nenhum. Todas as sessões abertas daquele usuário são encerradas, para
 * que quem estivesse logado com a senha antiga precise entrar de novo.
 *
 * O corpo fica dentro de uma função porque esta pasta é compilada como
 * CommonJS, que não aceita `await` no nível do módulo.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

async function main() {
  const [email, senha] = process.argv.slice(2)

  if (!email || !senha) {
    console.error('Uso: npx tsx prisma/trocar-senha.ts <e-mail> <senha-nova>')
    return 1
  }

  if (senha.length < 12) {
    console.error('A senha precisa ter pelo menos 12 caracteres.')
    return 1
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('Defina DATABASE_URL antes de rodar.')
    return 1
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  try {
    const usuario = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (!usuario) {
      console.error(`Nenhum usuário com o e-mail ${email}.`)
      return 1
    }

    await prisma.user.update({
      where: { id: usuario.id },
      data: { passwordHash: await bcrypt.hash(senha, 10) },
    })

    const { count } = await prisma.session.deleteMany({ where: { userId: usuario.id } })

    console.log(`Senha de ${usuario.email} atualizada.`)
    console.log(
      count > 0
        ? `${count} sessão(ões) encerrada(s): será preciso entrar de novo.`
        : 'Nenhuma sessão estava aberta.',
    )
    return 0
  } finally {
    await prisma.$disconnect()
  }
}

main().then((codigo) => process.exit(codigo))
