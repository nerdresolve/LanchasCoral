import { toNum, meters, litres, kilos, hp, capacity } from './format'

/**
 * Monta a comparação entre dois modelos.
 *
 * A lógica vive aqui, separada da tela, por dois motivos: pode ser testada
 * sem navegador, e a mesma comparação alimenta o painel em tela cheia e a
 * página `/comparar` — duas cópias divergiriam.
 *
 * ## O que se decidiu comparar, e por quê
 *
 * Os números (dimensões, capacidade, tanques) comparam bem: estão preenchidos
 * em 18/18 modelos e vão de 4,86 m a 15,24 m, de 90 a 860 HP.
 *
 * Dos textos, entra apenas o painel "Descrição" — lista curta de
 * características ("Possui 2 confortáveis camas de casal e banheiro"). O
 * painel "Equipamentos de série" fica de fora: são parágrafos técnicos de
 * construção, e entre o Coral 36 aberta e o cabinada há 1 item em comum
 * contra 18 diferentes. Compará-los viraria uma parede de texto que não
 * ajuda a escolher.
 */

/** Painel de equipamento que vira lista de características comparável. */
const PAINEL_CARACTERISTICAS = 'Descrição'

/**
 * Linhas do painel "Descrição" que não diferenciam nada.
 *
 * Aparecem quase iguais em todos os modelos — "E muito mais, confira na guia
 * Especificações" está em 17 dos 18 — então ocupariam espaço nos dois lados
 * dizendo o mesmo. São chamadas de marketing, não características.
 */
const RUIDO = [
  /^e muito mais/i,
  /garantia estrutural/i,
  /^altamente customiz/i,
]

/** Um valor de cada lado, já formatado para exibição. */
export type LinhaComparacao = {
  rotulo: string
  /** Valor formatado, ou `null` quando o modelo não informa. */
  a: string | null
  b: string | null
  /**
   * Diferença numérica, quando os dois lados têm número e são diferentes.
   * `null` quando são iguais, quando falta um dos lados, ou quando o campo
   * não é numérico.
   */
  diferenca: { maior: 'a' | 'b'; texto: string } | null
  /** `true` quando os dois lados dizem exatamente a mesma coisa. */
  iguais: boolean
  /**
   * Quanto cada valor representa do maior dos dois, de 0 a 1.
   *
   * Alimenta a barra que dá a leitura antes do número: "7,93" e "8,83" são
   * parecidos como texto, mas visivelmente diferentes como comprimento.
   * `null` quando falta um dos lados — meia barra contra nada não compara.
   */
  proporcao: { a: number; b: number } | null
}

export type GrupoComparacao = {
  titulo: string
  linhas: LinhaComparacao[]
}

/** Campos que a comparação lê. Espelha o que `getBoatBySlug` devolve. */
export type ModeloComparavel = {
  slug: string
  name: string
  variant: string | null
  tagline: string | null
  description: string | null
  lengthM: unknown
  beamM: unknown
  draftM: unknown
  depthM: unknown
  cabinHeightM: unknown
  weightKg: number | null
  fuelL: number | null
  waterL: number | null
  powerMinHp: number | null
  powerMaxHp: number | null
  capInteriorDay: number | null
  capInteriorNight: number | null
  capOpenSeaDay: number | null
  capOpenSeaNight: number | null
  images: { url: string; alt: string | null }[]
  equipment: { panel: string; text: string }[]
}

/** Nome de exibição: "Coral 36 Aberta". */
export const rotuloDoModelo = (m: { name: string; variant: string | null }) =>
  [m.name, m.variant].filter(Boolean).join(' ')

/**
 * Monta uma linha numérica.
 *
 * `formatar` recebe o número bruto e devolve o texto com unidade. A diferença
 * é calculada sobre os números, não sobre o texto: comparar "11,50 m" com
 * "9,80 m" como string daria a resposta errada.
 */
function linhaNumerica(
  rotulo: string,
  brutoA: unknown,
  brutoB: unknown,
  formatar: (v: never) => string | null,
  unidade: string,
): LinhaComparacao {
  const a = formatar(brutoA as never)
  const b = formatar(brutoB as never)
  const nA = toNum(brutoA as never)
  const nB = toNum(brutoB as never)

  let diferenca: LinhaComparacao['diferenca'] = null
  if (nA !== null && nB !== null && nA !== nB) {
    const delta = Math.abs(nA - nB)
    /* Casas decimais conforme a grandeza: metros pedem duas ("+2,40 m"),
       potência e litros não pedem nenhuma ("+120 HP"). */
    const casas = unidade === 'm' ? 2 : 0
    const numero = delta.toLocaleString('pt-BR', {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    })
    /* Concorda o plural: "+1 pessoa", não "+1 pessoas". Só as unidades que
       são substantivo têm singular — "1 m" e "1 HP" já estão certos. */
    const rotuloUnidade =
      unidade === 'pessoas' && delta === 1 ? 'pessoa' : unidade

    diferenca = {
      maior: nA > nB ? 'a' : 'b',
      texto: `+${numero} ${rotuloUnidade}`.trim(),
    }
  }

  /* A proporção é sobre o MAIOR dos dois, não sobre um máximo global: o que
     a barra mostra é a relação entre estes dois modelos. */
  let proporcao: LinhaComparacao['proporcao'] = null
  if (nA !== null && nB !== null) {
    const maior = Math.max(nA, nB)
    if (maior > 0) proporcao = { a: nA / maior, b: nB / maior }
  }

  return { rotulo, a, b, diferenca, iguais: a !== null && a === b, proporcao }
}

/**
 * Características de um modelo, limpas do ruído de marketing.
 *
 * Normaliza para comparar: sem espaços nas pontas, sem ponto final, em
 * minúsculas. O texto original é preservado para exibição — o que muda é só
 * a chave usada para decidir se dois itens são "o mesmo".
 */
export function caracteristicasDe(m: ModeloComparavel) {
  const vistas = new Set<string>()
  return m.equipment
    .filter((e) => e.panel === PAINEL_CARACTERISTICAS)
    .map((e) => e.text.trim())
    .filter((texto) => {
      if (!texto || RUIDO.some((r) => r.test(texto))) return false
      const chave = normalizar(texto)
      if (vistas.has(chave)) return false
      vistas.add(chave)
      return true
    })
}

/** Chave de comparação: ignora caixa, pontuação final e espaços repetidos. */
const normalizar = (t: string) =>
  t.toLowerCase().replace(/\s+/g, ' ').replace(/[.!;]+$/, '').trim()

export type Caracteristicas = {
  /** Presentes nos dois modelos. */
  emComum: string[]
  /** Só no primeiro. */
  soA: string[]
  /** Só no segundo. */
  soB: string[]
}

export function compararCaracteristicas(
  a: ModeloComparavel,
  b: ModeloComparavel,
): Caracteristicas {
  const listaA = caracteristicasDe(a)
  const listaB = caracteristicasDe(b)
  const chavesB = new Set(listaB.map(normalizar))
  const chavesA = new Set(listaA.map(normalizar))

  return {
    emComum: listaA.filter((t) => chavesB.has(normalizar(t))),
    soA: listaA.filter((t) => !chavesB.has(normalizar(t))),
    soB: listaB.filter((t) => !chavesA.has(normalizar(t))),
  }
}

/**
 * Grupos de números, na ordem em que a dúvida costuma aparecer: primeiro o
 * tamanho, depois quantas pessoas cabem, depois o motor e por fim autonomia.
 */
export function gruposDe(a: ModeloComparavel, b: ModeloComparavel): GrupoComparacao[] {
  const grupos: GrupoComparacao[] = [
    {
      titulo: 'Dimensões',
      linhas: [
        linhaNumerica('Comprimento', a.lengthM, b.lengthM, meters, 'm'),
        linhaNumerica('Boca', a.beamM, b.beamM, meters, 'm'),
        linhaNumerica('Pontal', a.depthM, b.depthM, meters, 'm'),
        linhaNumerica('Calado', a.draftM, b.draftM, meters, 'm'),
        linhaNumerica('Pé-direito da cabine', a.cabinHeightM, b.cabinHeightM, meters, 'm'),
        linhaNumerica('Peso sem motor', a.weightKg, b.weightKg, kilos as never, 'kg'),
      ],
    },
    {
      titulo: 'Capacidade',
      linhas: [
        linhaNumerica('Interior, dia', a.capInteriorDay, b.capInteriorDay, capacity as never, 'pessoas'),
        linhaNumerica('Interior, pernoite', a.capInteriorNight, b.capInteriorNight, capacity as never, 'pessoas'),
        linhaNumerica('Mar aberto, dia', a.capOpenSeaDay, b.capOpenSeaDay, capacity as never, 'pessoas'),
        linhaNumerica('Mar aberto, pernoite', a.capOpenSeaNight, b.capOpenSeaNight, capacity as never, 'pessoas'),
      ],
    },
    {
      titulo: 'Motorização',
      linhas: [
        linhaNumerica('Potência mínima', a.powerMinHp, b.powerMinHp, hp as never, 'HP'),
        linhaNumerica('Potência máxima', a.powerMaxHp, b.powerMaxHp, hp as never, 'HP'),
      ],
    },
    {
      titulo: 'Tanques',
      linhas: [
        linhaNumerica('Combustível', a.fuelL, b.fuelL, litres as never, 'L'),
        linhaNumerica('Água', a.waterL, b.waterL, litres as never, 'L'),
      ],
    },
  ]

  /* Linha sem valor dos dois lados é descartada: mostrar "— / —" só ocuparia
     espaço dizendo que ninguém informou. Uma linha com um lado só permanece,
     porque a ausência ali É informação (um tem cabine, o outro não). */
  return grupos
    .map((g) => ({ ...g, linhas: g.linhas.filter((l) => l.a !== null || l.b !== null) }))
    .filter((g) => g.linhas.length > 0)
}

/**
 * Texto descritivo de um modelo.
 *
 * `description` tem precedência, mas hoje está vazia nos 18 modelos — o texto
 * real está na `tagline`. Assim que o cliente preencher a descrição pelo
 * painel, ela passa a valer sem mexer no código.
 */
export const descricaoDe = (m: ModeloComparavel) =>
  m.description?.trim() || m.tagline?.trim() || null

/** Comparação completa, pronta para a tela. */
export function compararModelos(a: ModeloComparavel, b: ModeloComparavel) {
  return {
    /* `fotos` além de `foto`: o painel deixa trocar a imagem de cada lado
       sem sair, e a barra do rodapé precisa só da capa. */
    a: {
      ...a,
      rotulo: rotuloDoModelo(a),
      descricao: descricaoDe(a),
      foto: a.images[0]?.url ?? null,
      fotos: a.images.map((i) => i.url),
    },
    b: {
      ...b,
      rotulo: rotuloDoModelo(b),
      descricao: descricaoDe(b),
      foto: b.images[0]?.url ?? null,
      fotos: b.images.map((i) => i.url),
    },
    grupos: gruposDe(a, b),
    caracteristicas: compararCaracteristicas(a, b),
  }
}
