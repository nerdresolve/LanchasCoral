/*
 * Configurador de SMTP, modo de envio e domínios negados.
 *
 *   npx tsx audit/_teste-email-config.mjs
 *
 * Restaura o estado original ao final.
 */
import { chromium } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const BASE = 'https://coral.nerdresolve.com'
const EMAIL = 'admin@lanchascoral.com.br'
/* Sem valor embutido: a senha do painel no histórico do Git seria
   permanente. Defina CORAL_ADMIN_SENHA no ambiente antes de rodar. */
const SENHA = process.env.CORAL_ADMIN_SENHA
if (!SENHA) {
  console.error('Defina CORAL_ADMIN_SENHA no ambiente para rodar este script.')
  process.exit(1)
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

let falhas = 0
const conf = (cond, texto, extra = '') => {
  if (!cond) falhas++
  console.log(`${cond ? '  ok  ' : ' FALHA'} ${texto}${extra ? '  ' + extra : ''}`)
}

const SENHA_TESTE = 'senha-secreta-de-teste-98765'
const DOMINIO = 'zz-concorrente-teste.com.br'

const navegador = await chromium.launch()
const ctx = await navegador.newContext({ viewport: { width: 1400, height: 1000 } })
const p = await ctx.newPage()
const erros = []
p.on('pageerror', (e) => erros.push(String(e)))

/* Lido antes de qualquer alteração. Se a linha ainda não existir, o teste a
   cria e precisa APAGÁ-LA no fim — restaurar "o que havia" quando não havia
   nada deixaria a configuração de teste valendo em produção. */
const antes = await prisma.mailSettings.findUnique({ where: { id: 'singleton' } })
const linhaJaExistia = Boolean(antes)

try {
  console.log('--- ACESSO ---')
  const semSessao = await ctx.newPage()
  const r = await semSessao.goto(`${BASE}/admin/email`, { waitUntil: 'domcontentloaded' })
  conf(semSessao.url().includes('/admin/login'), 'o configurador exige login')
  await semSessao.close()

  await p.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' })
  await p.fill('input[name="email"]', EMAIL)
  await p.fill('input[name="password"]', SENHA)
  await p.click('button[type="submit"]:not(dialog *)')
  await p.waitForURL(/\/admin$/, { timeout: 30000 })

  console.log('\n--- CONFIGURAR O SERVIDOR ---')
  await p.goto(`${BASE}/admin/email`, { waitUntil: 'domcontentloaded' })
  conf((await p.locator('input[name="host"]').count()) === 1, 'a tela de configuração abre')

  await p.fill('input[name="host"]', 'smtp.exemplo-teste.com.br')
  await p.fill('input[name="user"]', 'envio@exemplo-teste.com.br')
  await p.fill('input[name="pass"]', SENHA_TESTE)
  await p.fill('input[name="fromName"]', 'Coral Teste')
  await p.click('button:has-text("Salvar configuração")')
  await p.waitForTimeout(3000)

  const gravado = await prisma.mailSettings.findUnique({ where: { id: 'singleton' } })
  conf(gravado.host === 'smtp.exemplo-teste.com.br', 'servidor gravado', gravado.host)

  console.log('\n--- A SENHA NÃO PODE VAZAR ---')
  conf(Boolean(gravado.passEnc), 'senha guardada')
  conf(!gravado.passEnc.includes(SENHA_TESTE), 'no banco está cifrada, não em texto puro')
  conf(gravado.passEnc.startsWith('v1.'), 'formato versionado', gravado.passEnc.slice(0, 3))

  // O ponto mais importante: a senha não pode voltar para o HTML da página.
  await p.goto(`${BASE}/admin/email`, { waitUntil: 'domcontentloaded' })
  const html = await p.content()
  conf(!html.includes(SENHA_TESTE), 'a senha não aparece no código-fonte da página')

  const campo = await p.inputValue('input[name="pass"]')
  conf(campo !== SENHA_TESTE, 'o campo não vem preenchido com a senha real', `-> "${campo}"`)
  conf(campo.length > 0, 'mas indica que existe uma senha guardada')

  // Salvar de novo sem tocar na senha precisa mantê-la.
  await p.fill('input[name="fromName"]', 'Coral Teste 2')
  await p.click('button:has-text("Salvar configuração")')
  await p.waitForTimeout(3000)
  const depois = await prisma.mailSettings.findUnique({ where: { id: 'singleton' } })
  conf(depois.passEnc === gravado.passEnc, 'salvar sem mexer na senha a preserva')
  conf(depois.fromName === 'Coral Teste 2', 'e grava o resto', depois.fromName)

  console.log('\n--- DOMÍNIOS NEGADOS ---')
  await p.fill('input[name="domain"]', DOMINIO)
  await p.fill('input[name="reason"]', 'Teste automatizado')
  await p.click('button:has-text("Bloquear")')
  await p.waitForTimeout(2500)

  const bloqueado = await prisma.blockedDomain.findUnique({ where: { domain: DOMINIO } })
  conf(Boolean(bloqueado), 'domínio gravado')

  // Colar um e-mail inteiro precisa extrair só o domínio.
  await p.fill('input[name="domain"]', 'alguem@zz-outro-teste.com')
  await p.click('button:has-text("Bloquear")')
  await p.waitForTimeout(2500)
  const extraido = await prisma.blockedDomain.findUnique({ where: { domain: 'zz-outro-teste.com' } })
  conf(Boolean(extraido), 'e-mail colado vira só o domínio')

  console.log('\n--- A LISTA DE NEGADOS FUNCIONA ---')
  /* A regra é replicada aqui, e não importada de `config.ts`: aquele módulo é
     `server-only` e recusa carregar fora do Next. A lógica é a mesma —
     domínio exato ou subdomínio dele. */
  const listados = (await prisma.blockedDomain.findMany({ select: { domain: true } })).map((b) => b.domain)
  const barra = (email) => {
    const d = email.split('@')[1]?.toLowerCase()
    return listados.find((b) => d === b || d.endsWith(`.${b}`)) ?? null
  }
  conf(barra(`x@${DOMINIO}`) === DOMINIO, 'domínio exato é barrado')
  conf(barra(`x@mail.${DOMINIO}`) === DOMINIO, 'subdomínio também é barrado')
  conf(barra('x@gmail.com') === null, 'domínio comum passa')

  console.log('\n--- MODO DE ENVIO ---')
  conf(depois.autoSend === false, 'nasce em aprovação manual')

  const rotulo = await p.locator('text=/Aprovação manual|Automático/').first().textContent()
  conf(/Aprovação manual/.test(rotulo ?? ''), 'a tela mostra o modo atual', rotulo?.trim())

  // Ligar precisa de confirmação, não de um clique só.
  await p.click('button:has-text("Ligar envio automático")')
  await p.waitForTimeout(600)
  const aindaManual = await prisma.mailSettings.findUnique({ where: { id: 'singleton' } })
  conf(aindaManual.autoSend === false, 'o primeiro clique não liga: pede confirmação')
  conf((await p.locator('text=Sim, enviar sozinho').count()) === 1, 'aparece a confirmação')

  await p.click('button:has-text("Sim, enviar sozinho")')
  await p.waitForTimeout(3000)
  const ligado = await prisma.mailSettings.findUnique({ where: { id: 'singleton' } })
  conf(ligado.autoSend === true, 'confirmando, o automático liga')

  await p.goto(`${BASE}/admin/email`, { waitUntil: 'domcontentloaded' })
  const aviso = await p.locator('body').innerText()
  conf(/sem ninguém conferir/i.test(aviso), 'o modo automático avisa do risco')

  // Desligar não pergunta nada.
  await p.click('button:has-text("Voltar para aprovação manual")')
  await p.waitForTimeout(3000)
  const desligado = await prisma.mailSettings.findUnique({ where: { id: 'singleton' } })
  conf(desligado.autoSend === false, 'desligar volta direto, sem confirmação')

  conf(erros.length === 0, 'nenhum erro de JavaScript', erros[0] ?? '')
} finally {
  console.log('\n--- RESTAURANDO ---')
  await prisma.blockedDomain.deleteMany({ where: { domain: { startsWith: 'zz-' } } })
  if (linhaJaExistia) {
    await prisma.mailSettings.update({ where: { id: 'singleton' }, data: {
      host: antes.host, port: antes.port, secure: antes.secure, serverName: antes.serverName,
      user: antes.user, passEnc: antes.passEnc, fromEmail: antes.fromEmail, fromName: antes.fromName,
      replyTo: antes.replyTo, bcc: antes.bcc, autoSend: antes.autoSend,
      autoLimitPerHour: antes.autoLimitPerHour,
    } })
  } else {
    // A linha nasceu neste teste: apagar devolve o estado anterior, e a
    // próxima leitura a recria a partir das variáveis de ambiente.
    await prisma.mailSettings.delete({ where: { id: 'singleton' } }).catch(() => {})
  }

  const final = await prisma.mailSettings.findUnique({ where: { id: 'singleton' } })
  conf(
    linhaJaExistia ? final?.fromName === antes.fromName : final === null,
    'configuração restaurada',
    final?.fromName ?? '(linha removida)',
  )
  conf((await prisma.blockedDomain.count({ where: { domain: { startsWith: 'zz-' } } })) === 0, 'domínios de teste removidos')

  await prisma.$disconnect()
  await navegador.close()
}

console.log(falhas === 0 ? '\nTodos os casos passaram.' : `\n${falhas} caso(s) falharam.`)
process.exit(falhas === 0 ? 0 : 1)
