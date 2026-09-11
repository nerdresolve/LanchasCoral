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

const { MUTED, FONT, TEXT, OCEAN_700 } = cores

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
    'Equipe Coral — Lanchas Coral',
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

/**
 * Aviso interno de que alguém preencheu um formulário do site.
 *
 * Vai para o setor responsável, não para uma caixa geral: quem lê já é quem
 * resolve. O endereço de quem escreveu entra como `replyTo`, então responder
 * fala direto com a pessoa, sem copiar e colar.
 *
 * Sem logotipo e sem botão: é comunicação interna, e o que importa é ler os
 * dados rápido.
 */
export function avisoDeFormulario(dados: {
  titulo: string
  nome: string
  email: string
  telefone?: string | null
  mensagem?: string | null
  modelo?: string | null
  /** Endereço da solicitação no painel, para agir sem procurar. */
  urlNoPainel?: string
}) {
  const linhas: [string, string | null | undefined][] = [
    ['Nome', dados.nome],
    ['E-mail', dados.email],
    ['Telefone', dados.telefone],
    ['Modelo', dados.modelo],
  ]

  const tabela = linhas
    .filter(([, v]) => v)
    .map(
      ([r, v]) =>
        `<tr>
          <td style="padding:6px 16px 6px 0;font-family:${FONT};font-size:14px;color:${MUTED};white-space:nowrap;vertical-align:top;">${escapeHtml(r)}</td>
          <td style="padding:6px 0;font-family:${FONT};font-size:15px;color:${TEXT};">${escapeHtml(String(v))}</td>
        </tr>`,
    )
    .join('')

  const corpo = `
    ${sobrancelha('Contato pelo site')}
    ${h1(escapeHtml(dados.titulo))}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">${tabela}</table>
    ${
      dados.mensagem
        ? `${divisor()}${p(escapeHtml(dados.mensagem).replace(/\n/g, '<br />'))}`
        : ''
    }
    ${
      dados.urlNoPainel
        ? p(
            `<a href="${dados.urlNoPainel}" style="color:${OCEAN_700};">Ver no painel</a>`,
            `font-size:14px;`,
          )
        : ''
    }
    ${p('Responder este e-mail fala direto com quem escreveu.', `color:${MUTED};font-size:13px;`)}
  `

  const texto = [
    dados.titulo,
    '',
    ...linhas.filter(([, v]) => v).map(([r, v]) => `${r}: ${v}`),
    ...(dados.mensagem ? ['', dados.mensagem] : []),
    ...(dados.urlNoPainel ? ['', `No painel: ${dados.urlNoPainel}`] : []),
  ].join('\n')

  return {
    assunto: `${dados.titulo} — ${dados.nome}`,
    html: envolver(corpo, `${dados.titulo}: ${dados.nome}, ${dados.email}`, false),
    texto,
  }
}
