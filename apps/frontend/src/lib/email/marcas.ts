/**
 * Valor de fachada do campo de senha no configurador de e-mail.
 *
 * A senha gravada nunca é devolvida para a tela: se ela voltasse preenchida,
 * bastaria abrir o código-fonte da página para lê-la. O formulário mostra
 * esta marca, e a action entende que deve manter a senha atual.
 *
 * Vive num módulo próprio porque é lido pelo formulário (cliente) e pela
 * action (servidor), e um arquivo `'use server'` não pode exportar constantes.
 */
export const MARCA_SENHA_GUARDADA = '__mantida__'

/**
 * Content-ID do logotipo anexado ao e-mail.
 *
 * Vive aqui, e não em , porque aquele módulo é  (lê do
 * disco) e a casca do e-mail só precisa do identificador — não do arquivo.
 */
export const CID_LOGO = 'logo-coral'
