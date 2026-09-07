/**
 * Dados institucionais da Coral, transcritos do site legado
 * (lanchascoral.com.br) durante a migração.
 *
 * ATENÇÃO — divergências encontradas no site de origem, mantidas aqui como
 * estão até que o cliente confirme qual é a correta:
 *   - rodapé geral: R. Bulhões Marcial, 751 · CEP 21241-370
 *   - página /contato: R. Bulhões Marcial, 753 · CEP 21241-368
 *   - subdomínio broker: R. Bulhões Marcial, 731 · CEP 21241-370
 * O site não expõe CNPJ nem e-mail público (o único e-mail citado, na política
 * de privacidade, vem ofuscado na página).
 */

export const COMPANY = {
  name: 'Lanchas Coral',
  legalName: 'Coral Indústria Naval',
  foundedYear: 1990,
  city: 'Duque de Caxias',
  state: 'RJ',

  /** Endereço do rodapé do site legado. */
  address: {
    street: 'R. Bulhões Marcial, 751',
    district: 'Duque de Caxias',
    state: 'RJ',
    zip: '21241-370',
    full: 'R. Bulhões Marcial, 751 – Duque de Caxias – RJ – CEP 21241-370',
  },

  /** Endereço informado na página de contato (comercial e fábrica). */
  addressCommercial: {
    street: 'R. Bulhões Marcial, 753',
    zip: '21241-368',
    full: 'R. Bulhões Marcial, 753 – Duque de Caxias – RJ – CEP 21241-368',
  },

  phones: ['(21) 3448-4763', '(21) 3448-7381'],
  phoneCommercial: '(21) 97159-8865',

  /**
   * Canais por area, como o site antigo os publica em /nossos-contatos/.
   * Os rotulos sao os do proprio site: quem procura assistencia tecnica nao
   * deve cair no comercial.
   */
  areas: [
    { key: 'comercial' as const, phones: ['(21) 3448-7381', '(21) 97159-8865'], whatsapp: null },
    { key: 'assistencia' as const, phones: ['(21) 98669-0285'], whatsapp: '5521986690285' },
    { key: 'compras' as const, phones: ['(21) 96997-3392'], whatsapp: null },
  ],

  hours: {
    office: 'Seg a Sex, 08h–18h',
    factory: 'Seg a Sex, 07h–17h',
    weekend: 'Sábado e domingo: fechado',
  },

  /** Números verificados no conteúdo institucional do site. */
  facts: {
    yearsApprox: new Date().getFullYear() - 1990,
    hullsBuilt: 'mais de 3.000',
    plantAreaM2: 6000,
    /* Duas garantias distintas, confirmadas pelo cliente:
       estrutural (casco) 10 anos; componentes/geral 2 anos. */
    warrantyStructural: '10 anos',
    warrantyComponents: '2 anos',
  },

  /**
   * Perfis conferidos no site antigo (/nossos-contatos/) e validados um a um.
   * Os anteriores apontavam para contas erradas: @lanchascoral no Instagram
   * tem 6 seguidores e nenhum post, enquanto @lanchas.coral.oficial tem 23 mil
   * e 1.411 publicacoes; no Facebook, /lanchascoral apenas redireciona para
   * /corallanchas; no YouTube, o canal com 80 videos e o do channelId abaixo.
   */
  social: {
    instagram: 'https://www.instagram.com/lanchas.coral.oficial/',
    youtube: 'https://www.youtube.com/channel/UCPTbrl5diVaj_pxsIyGK9cw',
    facebook: 'https://www.facebook.com/corallanchas/',
  },

  /** Subdomínios do site legado que seguem fora desta aplicação. */
  external: {
    broker: 'https://broker.lanchascoral.com.br',
    support: 'http://suporte.lanchascoral.com.br/authentication/login',
  },
} as const
