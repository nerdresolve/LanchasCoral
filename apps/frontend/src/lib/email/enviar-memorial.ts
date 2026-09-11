import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { prisma } from '../prisma'
import { enviarEmail } from './mailer'
import { COPIA_MEMORIAL } from './destinos'
import { memorialDescritivo } from './templates'
import {
  getConfigDeEnvio,
  podeEnviar,
  dominioBloqueado,
  enviosAutomaticosNaUltimaHora,
} from './config'
import { getTelefonesPublicados } from '../contatos'
import { anexoDoLogo } from './logo'
import { travarRegistro } from '../trava'

/**
 * Envio do memorial descritivo, usado pelos dois caminhos.
 *
 * O clique no painel e o disparo automático passam por aqui, para que as
 * regras sejam exatamente as mesmas: mesma checagem de domínio, mesmo
 * registro no histórico, mesmo tratamento de erro. Duas cópias divergiriam,
 * e a divergência apareceria justamente no modo automático — o que ninguém
 * está olhando na hora.
 */

export type ResultadoEnvio =
  | { ok: true; mensagem: string }
  | { ok: false; erro: string; bloqueado?: boolean }

/** Registra a tentativa. Nunca lança: um log que falha não pode derrubar o envio. */
/**
 * A falha é definitiva, ou vale tentar de novo?
 *
 * Códigos 5xx do SMTP e recusa de destinatário são permanentes: o mesmo
 * endereço vai ser recusado outra vez. Queda de conexão, tempo esgotado e
 * 4xx são transitórios.
 *
 * Na dúvida, trata como transitório: prender um pedido que poderia ser
 * reenviado é pior do que deixar tentar de novo.
 */
function permanente(e: unknown): boolean {
  const err = e as { responseCode?: number; code?: string; message?: string }
  if (typeof err?.responseCode === 'number') return err.responseCode >= 500 && err.responseCode < 600
  if (err?.code === 'EENVELOPE') return true
  return /no such user|does not exist|invalid recipient|recipient rejected|mailbox unavailable/i.test(
    err?.message ?? '',
  )
}

async function registrar(dados: {
  inquiryId?: string
  to: string
  subject: string
  status: 'enviado' | 'falhou' | 'bloqueado'
  detail?: string
  trigger: 'manual' | 'automatico'
  actor?: string
}) {
  await prisma.mailLog.create({ data: dados }).catch(() => {})
}

export async function enviarMemorialPara(
  inquiryId: string,
  opcoes: {
    trigger: 'manual' | 'automatico'
    actor?: string
    /** `true` quando o operador pediu explicitamente para mandar de novo. */
    reenvio?: boolean
  },
): Promise<ResultadoEnvio> {
  const cfg = await getConfigDeEnvio()
  if (!podeEnviar(cfg)) {
    return { ok: false, erro: 'O envio de e-mail ainda não foi configurado.' }
  }

  /*
   * Reserva o pedido antes de qualquer coisa.
   *
   * O botão desabilita durante o envio, mas isso depende do React reagir
   * entre um clique e outro: numa rajada de milissegundos o segundo clique
   * sai antes de `pending` propagar, e o cliente recebe o e-mail duas vezes.
   * Reproduzido — três cliques geravam dois envios.
   *
   * A trava serializa as chamadas concorrentes no MESMO pedido, e o
   * `updateMany` condicional é o que de fato reserva: só uma das chamadas
   * encontra `manualSentAt: null` e segue; as outras veem a marca já posta e
   * desistem. É a mesma ideia do "comparar e trocar" — a decisão acontece
   * dentro do banco, não na aplicação.
   */
  const reservado = await prisma.$transaction(async (tx) => {
    await travarRegistro(tx, 'Inquiry', inquiryId)
    /* No reenvio explícito a condição cai: o operador viu que já foi enviado
       e decidiu mandar de novo. A trava continua valendo, então dois cliques
       no reenviar ainda se enfileiram e só um passa por vez. */
    const r = await tx.inquiry.updateMany({
      where: opcoes.reenvio ? { id: inquiryId } : { id: inquiryId, manualSentAt: null },
      data: { manualSentAt: new Date() },
    })
    return r.count === 1
  })

  if (!reservado) {
    const jaEnviado = await prisma.inquiry.findUnique({ where: { id: inquiryId } })
    return {
      ok: false,
      erro: jaEnviado
        ? 'Este memorial já foi enviado. Para mandar de novo, use "Enviar de novo".'
        : 'Mensagem não encontrada.',
    }
  }

  /* A partir daqui o pedido está reservado. Se algo falhar, a reserva precisa
     ser desfeita — senão o operador nunca mais consegue enviar. */
  const desfazerReserva = () =>
    prisma.inquiry.update({ where: { id: inquiryId }, data: { manualSentAt: null } }).catch(() => {})

  const pedido = await prisma.inquiry.findUnique({ where: { id: inquiryId } })
  if (!pedido) return { ok: false, erro: 'Mensagem não encontrada.' }
  if (!pedido.boatSlug) {
    await desfazerReserva()
    return { ok: false, erro: 'Este pedido não diz qual é o modelo, então não dá para saber qual memorial enviar.' }
  }

  const boat = await prisma.boat.findUnique({
    where: { slug: pedido.boatSlug },
    select: { name: true, variant: true, manualUrl: true },
  })
  if (!boat) {
    await desfazerReserva()
    return { ok: false, erro: 'O modelo deste pedido não existe mais no catálogo.' }
  }
  if (!boat.manualUrl) {
    await desfazerReserva()
    return {
      ok: false,
      erro: `O modelo ${boat.name} ainda não tem memorial anexado. Anexe o PDF na ficha do modelo antes de enviar.`,
    }
  }

  const modelo = boat.variant ? `${boat.name} ${boat.variant}` : boat.name

  /*
   * A lista de domínios negados vale só para o disparo automático.
   *
   * No modo manual quem clica já viu o endereço e decidiu; barrar aí seria
   * discutir com o operador sobre algo que ele acabou de escolher fazer.
   */
  if (opcoes.trigger === 'automatico') {
    const barrado = await dominioBloqueado(pedido.email)
    if (barrado) {
      await registrar({
        inquiryId,
        to: pedido.email,
        subject: `Memorial descritivo — ${modelo}`,
        status: 'bloqueado',
        detail: `Domínio na lista de negados: ${barrado}`,
        trigger: 'automatico',
      })
      // Fica pendente no painel em vez de sumir: um bloqueio por engano não
      // pode fazer o cliente legítimo nunca receber resposta.
      await desfazerReserva()
      return { ok: false, erro: `Domínio ${barrado} está na lista de negados. O pedido ficou para aprovação manual.`, bloqueado: true }
    }

    const jaSairam = await enviosAutomaticosNaUltimaHora()
    if (jaSairam >= cfg.autoLimitPerHour) {
      await registrar({
        inquiryId,
        to: pedido.email,
        subject: `Memorial descritivo — ${modelo}`,
        status: 'bloqueado',
        detail: `Teto de ${cfg.autoLimitPerHour} envios automáticos por hora atingido.`,
        trigger: 'automatico',
      })
      await desfazerReserva()
      return { ok: false, erro: 'Teto de envios automáticos por hora atingido. O pedido ficou para aprovação manual.', bloqueado: true }
    }
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lanchascoral.com.br'
  const urlDoMemorial = boat.manualUrl.startsWith('http') ? boat.manualUrl : `${base}${boat.manualUrl}`

  /*
   * Anexa o PDF quando ele é servido pelo próprio site.
   *
   * Lido do disco em vez de buscado por HTTP: o arquivo está em `public/` ao
   * lado da aplicação. Se a leitura falhar, o e-mail vai só com o link —
   * melhor entregar incompleto que não entregar.
   */
  /* `cid` e `contentDisposition` para o logotipo inline; os demais anexos
     (o PDF) usam só filename e content. */
  const anexos: {
    filename: string
    content: Buffer
    cid?: string
    contentDisposition?: "inline"
  }[] = []
  if (boat.manualUrl.startsWith('/')) {
    try {
      const raiz = path.join(process.cwd(), 'public')
      const arquivo = path.join(raiz, boat.manualUrl)
      // Confere que o caminho resolvido não escapou de `public/`.
      if (arquivo.startsWith(raiz)) {
        anexos.push({ filename: `Memorial ${modelo}.pdf`, content: await readFile(arquivo) })
      }
    } catch {
      // Segue com o link.
    }
  }

  const telefones = await getTelefonesPublicados()
  /* O logotipo vai como anexo inline (`cid:`) e entra no início da lista: se
     o arquivo não puder ser lido, o cabeçalho cai no nome em texto e a
     mensagem sai assim mesmo. */
  const logo = await anexoDoLogo()
  if (logo) anexos.unshift(logo)

  const { assunto, html, texto } = memorialDescritivo({
    nome: pedido.name,
    modelo,
    urlDoMemorial,
    telefones,
    comLogo: Boolean(logo),
  })

  try {
    /* Cópia para a assistência técnica: fica o registro de que material
       saiu, para quem e quando, sem depender de alguém encaminhar. */
    await enviarEmail({
      para: pedido.email,
      assunto,
      html,
      texto,
      anexos,
      copiaOculta: COPIA_MEMORIAL,
    })
  } catch (e) {
    const motivo = e instanceof Error ? e.message : 'erro desconhecido'
    await registrar({
      inquiryId,
      to: pedido.email,
      subject: assunto,
      status: 'falhou',
      detail: motivo,
      trigger: opcoes.trigger,
      actor: opcoes.actor,
    })
    /*
     * A reserva só volta atrás quando vale a pena tentar de novo.
     *
     * Servidor fora do ar, rede caída, tempo esgotado: são transitórios, e o
     * operador precisa poder reenviar depois de resolver. Endereço recusado
     * pelo servidor é permanente, e clicar de novo produz a mesma recusa.
     *
     * A distinção importa porque a janela entre desfazer a reserva e o
     * próximo clique é o que permitia dois envios: com endereço inválido, os
     * três cliques falhavam, cada falha liberava a trava, e o seguinte
     * passava. Mantendo a reserva no caso permanente, só o primeiro tenta.
     */
    if (permanente(e)) {
      await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { handled: true },
      }).catch(() => {})
      return {
        ok: false,
        erro: `O servidor recusou o endereço: ${motivo}. Corrija o e-mail do pedido antes de tentar de novo.`,
      }
    }

    await desfazerReserva()
    return { ok: false, erro: `Não foi possível enviar: ${motivo}` }
  }

  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { manualSentAt: new Date(), manualSentTo: pedido.email, handled: true },
  })

  await registrar({
    inquiryId,
    to: pedido.email,
    subject: assunto,
    status: 'enviado',
    trigger: opcoes.trigger,
    actor: opcoes.actor,
  })

  return { ok: true, mensagem: `Memorial do ${modelo} enviado para ${pedido.email}.` }
}
