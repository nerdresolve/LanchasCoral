import { z } from 'zod'

/**
 * Regras de campo compartilhadas pelos formulários do painel.
 *
 * Modelos e seminovos preenchem colunas do mesmo feitio (medidas, potências,
 * URLs de foto). Antes cada schema trazia a sua própria cópia dos ajudantes, e
 * elas já tinham divergido. Aqui ficam as regras únicas.
 */

/**
 * Endereços que o painel usa para as suas próprias telas.
 *
 * Um item salvo com um destes slugs ficaria inalcançável: `/admin/boats/new`
 * abriria o formulário de criação, nunca o registro. O slug é bloqueado na
 * validação para que o operador saiba na hora, em vez de descobrir depois que
 * o modelo não abre mais.
 */
export const SLUGS_RESERVADOS = ['new', 'novo', 'admin', 'api'] as const

/** Regra de slug compartilhada: minúsculas, números e hífens, sem reservados. */
export function slugValido(rotulo = 'endereço') {
  return z
    .string()
    .trim()
    .min(1, `Informe o ${rotulo}.`)
    .max(120, 'Máximo de 120 caracteres.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífens.')
    .refine((s) => !SLUGS_RESERVADOS.includes(s as (typeof SLUGS_RESERVADOS)[number]), {
      message: 'Este endereço é usado pelo próprio painel. Escolha outro.',
    })
}

/** Teto das colunas `Decimal(5, 2)` do schema: o Postgres recusa 1000 ou mais. */
export const MAX_DECIMAL_5_2 = 999.99

/** Teto de `Int` no Postgres (int4). Acima disso a inserção estoura. */
export const MAX_INT4 = 2_147_483_647

/**
 * Converte o texto do formulário em número.
 *
 * Campo vazio vira `undefined` (ausente), não zero — zero é uma medida válida
 * e gravá-lo apagaria a diferença entre "não informado" e "vale zero".
 *
 * A vírgula é trocada por ponto porque `Number('4,86')` devolve `NaN`. Os
 * campos do painel são `type="number"`, que já normaliza isso no navegador,
 * mas Server Actions são endpoints HTTP comuns: o valor pode chegar de um
 * POST montado à mão, e aí o `NaN` viraria erro de validação sem explicação.
 */
function paraNumero(v: unknown) {
  if (v === '' || v === null || v === undefined) return undefined
  if (typeof v === 'string') return Number(v.trim().replace(',', '.'))
  return Number(v)
}

/**
 * Número decimal opcional, limitado ao que a coluna aguenta.
 *
 * O teto não é preciosismo: sem ele um valor grande demais passa pelo zod e
 * explode no Postgres com "numeric field overflow", que chega ao operador
 * como erro genérico de servidor em vez de uma mensagem no campo.
 */
export function numeroOpcional(max = MAX_DECIMAL_5_2) {
  return z.preprocess(
    paraNumero,
    z
      .number({ message: 'Use um número.' })
      .finite('Use um número.')
      .nonnegative('Não pode ser negativo.')
      .max(max, `Valor máximo: ${max}.`)
      .optional(),
  )
}

/** Inteiro opcional, com o mesmo cuidado de teto. */
export function inteiroOpcional(max = MAX_INT4) {
  return z.preprocess(
    paraNumero,
    z
      .number({ message: 'Use um número inteiro.' })
      .int('Use um número inteiro.')
      .nonnegative('Não pode ser negativo.')
      .max(max, `Valor máximo: ${max.toLocaleString('pt-BR')}.`)
      .optional(),
  )
}

/** Texto opcional; em branco conta como ausente. */
export function textoOpcional(max = 2000) {
  return z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(max, `Máximo de ${max} caracteres.`).optional(),
  )
}

/*
 * Hosts que o `next/image` está autorizado a buscar (`next.config.ts`).
 *
 * A validação precisa conhecer esta lista. Uma foto de qualquer outro
 * endereço passa pela validação de URL, é salva no banco, e só falha na hora
 * de renderizar: o otimizador responde 400 e o card do barco aparece
 * quebrado no site público, sem nada no painel que indique o motivo.
 */
export const HOSTS_DE_IMAGEM = [
  'lanchascoral.com.br',
  'broker.lanchascoral.com.br',
  'mariath.dev',
] as const

/**
 * URL de foto: precisa ser https e vir de um host que o site saiba exibir.
 *
 * Caminhos internos (`/brand/foto.jpg`) também passam — são servidos direto
 * de `public/` e não dependem do otimizador.
 */
export function urlDeImagem() {
  return z.string().trim().superRefine((valor, ctx) => {
    if (valor.startsWith('/')) return

    let url: URL
    try {
      url = new URL(valor)
    } catch {
      ctx.addIssue({
        code: 'custom',
        message: 'Endereço inválido. Cole a URL completa da foto, começando com https://',
      })
      return
    }

    if (url.protocol !== 'https:') {
      ctx.addIssue({ code: 'custom', message: 'O endereço precisa começar com https://' })
      return
    }

    const permitido = HOSTS_DE_IMAGEM.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    )
    if (!permitido) {
      ctx.addIssue({
        code: 'custom',
        message: `Fotos só podem vir de: ${HOSTS_DE_IMAGEM.join(', ')}. Para usar outro site, é preciso liberá-lo antes.`,
      })
    }
  })
}

/**
 * URL de documento (memorial descritivo, por exemplo).
 *
 * Mais frouxa que a das fotos: o PDF é um link comum, não passa pelo
 * otimizador, então qualquer host https serve. O que se barra aqui é
 * `javascript:` e afins, que virariam link clicável na página pública.
 */
/**
 * Vídeo do hero: só arquivo servido pelo próprio site.
 *
 * Diferente das fotos, que aceitam hosts externos: vídeo de terceiro num
 * elemento que toca sozinho no topo da página é risco desnecessário — e o
 * Drive, que é de onde estes vêm, bloqueia por cota quando há muito acesso.
 * Os arquivos vivem em /public/videos e viajam com o site.
 */
export function urlDeVideo() {
  return z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z
      .string()
      .trim()
      .max(300, 'Máximo de 300 caracteres.')
      .refine((valor) => valor.startsWith('/videos/'), {
        message: 'Use um caminho interno começando com /videos/ — por exemplo /videos/coral-40.mp4',
      })
      /* `..` sairia da pasta; o resto barra caractere estranho em nome de
         arquivo, que não tem por que existir aqui. */
      .refine((valor) => !valor.includes('..') && /^\/videos\/[a-zA-Z0-9._-]+\.(mp4|webm)$/.test(valor), {
        message: 'O arquivo precisa terminar em .mp4 ou .webm, sem acento nem espaço no nome.',
      })
      .optional(),
  )
}

export function urlDeDocumento() {
  return z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z
      .string()
      .trim()
      .refine(
        (valor) => {
          if (valor.startsWith('/')) return true
          try {
            return new URL(valor).protocol === 'https:'
          } catch {
            return false
          }
        },
        { message: 'Use um endereço https:// completo, ou um caminho interno começando com /' },
      )
      .optional(),
  )
}
