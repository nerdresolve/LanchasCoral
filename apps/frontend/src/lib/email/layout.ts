/**
 * Casca visual dos e-mails da Coral.
 *
 * Construída em tabelas com estilo inline de propósito: Outlook e Gmail
 * descartam `<style>` do `<head>` e não suportam flex nem grid. A estrutura
 * segue a peça que já roda em produção na HClean — cabeçalho escuro com a
 * marca, filete de destaque, corpo branco, rodapé claro — trocando a paleta
 * verde pela azul-marinho da Coral.
 */

import { CID_LOGO } from './marcas'

/* Tons retirados de globals.css, para o e-mail combinar com o site. */
const NAVY_900 = '#080C18'
const NAVY_800 = '#0D1322'
const OCEAN_700 = '#075B88'
const AQUA_500 = '#16B8D4'
const PAPER = '#F4F7F8'
const TEXT = '#1F2937'
const MUTED = '#5B6875'
const BORDER = '#D7DFE4'

/* Arial em vez da fonte do site: webfont em e-mail é ignorada pela maioria
   dos clientes, então a pilha usa o que já existe na máquina de quem lê. */
const FONT = "Arial, 'Helvetica Neue', Helvetica, sans-serif"

export const cores = { NAVY_900, NAVY_800, OCEAN_700, AQUA_500, PAPER, TEXT, MUTED, BORDER, FONT }

export function escapeHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Cabeçalho: o logotipo sobre o azul-marinho, com o filete aqua embaixo.
 *
 * A marca viaja como anexo inline (`cid:`), e não como imagem hospedada: a
 * maioria dos clientes bloqueia imagens externas por padrão, e o cabeçalho
 * chegaria vazio na primeira leitura. Com `cid:` a imagem já vem dentro da
 * mensagem e aparece sem o destinatário precisar autorizar nada.
 *
 * O `alt` carrega o nome por extenso: se o cliente ainda assim não mostrar a
 * imagem, o leitor vê o nome da empresa em vez de um quadro vazio.
 *
 * Quando o arquivo não pôde ser lido (`comLogo = false`), volta ao nome em
 * texto — um logotipo ausente não pode estragar a mensagem inteira.
 */
function cabecalho(comLogo: boolean): string {
  const marca = comLogo
    ? `<img src="cid:${CID_LOGO}" width="180" height="43" alt="Coral Indústria Naval"
            style="display:block;border:0;outline:none;text-decoration:none;width:180px;height:auto;" />`
    : `<span style="font-family:${FONT};font-size:27px;line-height:1;font-weight:bold;color:#FFFFFF;letter-spacing:3px;">CORAL</span>
       <br />
       <span style="font-family:${FONT};font-size:11px;line-height:1.8;font-weight:bold;letter-spacing:2.4px;text-transform:uppercase;color:${AQUA_500};">Indústria Naval</span>`

  return `
  <tr>
    <td align="center" style="padding:34px 24px;background-color:${NAVY_800};">
      ${marca}
    </td>
  </tr>
  <tr>
    <td style="height:3px;line-height:3px;font-size:0;background-color:${AQUA_500};">&nbsp;</td>
  </tr>`
}

function rodape(): string {
  return `
  <tr>
    <td align="center" style="padding:18px 24px;background-color:${PAPER};border-top:1px solid ${BORDER};">
      <span style="font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">
        Coral Indústria Naval &ndash; Duque de Caxias, RJ<br />
        <a href="https://lanchascoral.com.br" style="color:${OCEAN_700};text-decoration:none;">lanchascoral.com.br</a>
      </span>
    </td>
  </tr>`
}

/** Envolve o corpo na casca da marca. */
export function envolver(corpoHtml: string, preheader = '', comLogo = true): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>Coral Indústria Naval</title>
</head>
<body style="margin:0;padding:0;background-color:${PAPER};">
  <!-- Preheader: primeira linha na caixa de entrada, invisível ao abrir. -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${PAPER};">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${PAPER};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
               style="border-collapse:collapse;width:600px;max-width:600px;background-color:#FFFFFF;border:1px solid ${BORDER};">
          ${cabecalho(comLogo)}
          <tr>
            <td style="padding:32px 34px 34px;">
              ${corpoHtml}
            </td>
          </tr>
          ${rodape()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/* ------------------------------------------------------------ utilitários */

export const p = (texto: string, extra = ''): string =>
  `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.65;color:${TEXT};${extra}">${texto}</p>`

export const h1 = (texto: string): string =>
  `<h1 style="margin:0 0 8px;font-family:${FONT};font-size:21px;line-height:1.3;font-weight:bold;color:${NAVY_900};">${texto}</h1>`

export const sobrancelha = (texto: string): string =>
  `<p style="margin:0 0 14px;font-family:${FONT};font-size:11px;line-height:1.4;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:${OCEAN_700};">${texto}</p>`

export const divisor = (): string =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:22px 0;">
     <tr><td style="height:1px;line-height:1px;font-size:0;background-color:${BORDER};">&nbsp;</td></tr>
   </table>`

/** Tabela rótulo/valor. O valor já deve vir escapado ou ser HTML confiável. */
export function tabelaDados(linhas: { rotulo: string; valor: string }[]): string {
  const corpo = linhas
    .map(
      (l, i) => `
      <tr>
        <td style="padding:11px 14px;background-color:${PAPER};border-top:${i ? `1px solid ${BORDER}` : '0'};font-family:${FONT};font-size:13px;line-height:1.5;color:${MUTED};width:38%;vertical-align:top;">${escapeHtml(l.rotulo)}</td>
        <td style="padding:11px 14px;border-top:${i ? `1px solid ${BORDER}` : '0'};font-family:${FONT};font-size:14px;line-height:1.5;color:${TEXT};font-weight:bold;vertical-align:top;">${l.valor}</td>
      </tr>`,
    )
    .join('')

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                 style="border-collapse:collapse;border:1px solid ${BORDER};">
            ${corpo}
          </table>`
}

/** Botão sólido. Tabela em vez de `<a>` estilizado, para o Outlook respeitar. */
export function botao(href: string, rotulo: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
    <tr>
      <td align="center" style="background-color:${OCEAN_700};border-radius:4px;">
        <a href="${escapeHtml(href)}"
           style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:14px;font-weight:bold;line-height:1;color:#FFFFFF;text-decoration:none;">
          ${escapeHtml(rotulo)}
        </a>
      </td>
    </tr>
  </table>`
}

/** Assinatura da equipe, montada com os dados de contato em vigor. */
export function assinatura(telefones: string[]): string {
  const linhas = telefones
    .map(
      (t) =>
        `<a href="tel:+55${t.replace(/\D/g, '')}" style="color:${TEXT};text-decoration:none;">${escapeHtml(t)}</a>`,
    )
    .join('&nbsp; &middot; &nbsp;')

  return `
  ${p('Atenciosamente,', `margin-bottom:4px;color:${MUTED};`)}
  <p style="margin:0 0 2px;font-family:${FONT};font-size:15px;line-height:1.5;font-weight:bold;color:${NAVY_900};">Equipe Coral</p>
  <p style="margin:0 0 12px;font-family:${FONT};font-size:15px;line-height:1.5;font-weight:bold;color:${NAVY_900};">Coral Indústria Naval</p>
  <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.9;color:${TEXT};">
    ${linhas}
    <br />
    <a href="https://lanchascoral.com.br" style="color:${OCEAN_700};text-decoration:none;">lanchascoral.com.br</a>
  </p>`
}
