import {
  envolver,
  p,
  h1,
  sobrancelha,
  divisor,
  botao,
  assinatura,
  escapeHtml,
  cores,
} from './layout'

const { MUTED } = cores

/**
 * E-mail que entrega o memorial descritivo ao proprietário.
 *
 * O arquivo vai anexado E como link: anexo grande é barrado por alguns
 * provedores, e um link sozinho costuma cair em filtro de spam. Com os dois, o
 * destinatário recebe de um jeito ou de outro.
 */
export function memorialDescritivo(dados: {
  nome: string
  modelo: string
  urlDoMemorial: string
  telefones: string[]
  /** `false` quando o arquivo do logotipo não pôde ser lido. */
  comLogo?: boolean
}) {
  const primeiroNome = dados.nome.trim().split(/\s+/)[0] ?? dados.nome

  const corpo = `
    ${sobrancelha('Memorial descritivo')}
    ${h1(`${escapeHtml(dados.modelo)}`)}
    ${p(`Olá, ${escapeHtml(primeiroNome)}.`)}
    ${p(
      `Segue o memorial descritivo do <strong>${escapeHtml(dados.modelo)}</strong>, conforme solicitado pelo nosso site. O arquivo vai anexado a esta mensagem e também pode ser baixado pelo botão abaixo.`,
    )}
    <div style="margin:24px 0;">
      ${botao(dados.urlDoMemorial, 'Baixar o memorial')}
    </div>
    ${p(
      'Se precisar de algum dado que não esteja no documento, é só responder este e-mail que a gente providencia.',
      `color:${MUTED};font-size:14px;`,
    )}
    ${divisor()}
    ${assinatura(dados.telefones)}
  `

  const texto = [
    `Olá, ${primeiroNome}.`,
    '',
    `Segue o memorial descritivo do ${dados.modelo}, conforme solicitado pelo nosso site.`,
    'O arquivo vai anexado a esta mensagem e também pode ser baixado em:',
    dados.urlDoMemorial,
    '',
    'Se precisar de algum dado que não esteja no documento, é só responder este e-mail.',
    '',
    'Atenciosamente,',
    'Equipe Coral — Coral Indústria Naval',
    dados.telefones.join(' · '),
    'lanchascoral.com.br',
  ].join('\n')

  return {
    assunto: `Memorial descritivo — ${dados.modelo}`,
    html: envolver(
      corpo,
      `Memorial descritivo do ${dados.modelo}, em anexo.`,
      dados.comLogo ?? true,
    ),
    texto,
  }
}
