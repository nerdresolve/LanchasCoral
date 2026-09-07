import { getBoats, boatLabel } from '@/lib/queries'
import { COMPANY } from '@/lib/company'
import { toNum } from '@/lib/format'
import SiteHeader from '@/components/SiteHeader'
import Reveal from '@/components/Reveal'
import { HullArc, SonarGrid, SwellLine, WakeLines } from '@/components/SectionDecor'
import { Button, SectionHeading, StatBlock } from '@/components/ui'
import Timeline, { type Marco } from '@/components/Timeline'
import { href, type Locale } from '@/i18n/config'

export default async function SobreView({ locale }: { locale: Locale }) {
  const boats = await getBoats()

  /*
   * Conteúdo transcrito da página /sobre/ do site legado, preservado na íntegra
   * e apenas reorganizado no novo sistema visual.
   */
  const COPY = {
    pt: {
      eyebrow: 'Sobre nós',
      title: 'Um estaleiro 100% brasileiro, desde 1990.',
      lede: 'No ano de 1990 surgia a Coral, um estaleiro 100% brasileiro, localizado na cidade do Rio de Janeiro.',
      statYears: 'De estaleiro',
      statBoats: 'Embarcações',
      statPortfolio: 'Portfólio',
      statArea: 'Área industrial',
      unitYears: 'anos',
      unitFeet: 'pés',
      historyTitle: 'A história',
      /* Marcos tirados do próprio texto institucional; nenhuma data foi
         inferida. Preenchem a coluna que antes ficava vazia ao lado de mais
         de mil pixels de texto corrido. */
      /* Cada marco corresponde a um fato do texto institucional do site de
         origem. Nenhuma data foi inferida: onde não há ano registrado, o
         rótulo diz a fase ("Primeiros anos", "Hoje") em vez de inventar. */
      marcos: [
        {
          ano: '1990',
          titulo: 'Um estaleiro nasce no Rio',
          texto:
            'A Coral surge como estaleiro 100% brasileiro, na região metropolitana do Rio de Janeiro. A operação começa pequena, e o nome ainda não circula fora do meio náutico.',
        },
        {
          ano: 'Primeiros anos',
          titulo: 'Barcos de até 18 pés',
          texto:
            'As operações iniciais envolviam apenas embarcações de pequeno porte. Os barcos chamaram a atenção do mercado pelo design e pela navegabilidade suave, reconhecida e compartilhada espontaneamente pelos clientes.',
        },
        {
          ano: 'Crescimento',
          titulo: 'Quatro pilares',
          texto:
            'Produto, qualidade, honestidade e relacionamento sustentam a expansão. Cada projeto é conduzido como exclusivo pela equipe, que acompanha a entrega de cada embarcação.',
        },
        {
          ano: 'Construção',
          titulo: 'Wood Free e casco monobloco',
          texto:
            'Nenhuma madeira estrutural entra na fabricação. Casco e convés formam um monobloco com hastilhas e longarinas, e a cor vai em gel coat desde o início da industrialização, não em pintura automotiva.',
        },
        {
          ano: '38 pés+',
          titulo: 'Laminação por infusão a vácuo',
          texto:
            'Nas versões a partir de 38 pés entra o processo mais inovador da indústria náutica: menos peso estrutural e um grau extra de resistência, com o sistema sandwich em Divinycell e Renicell.',
        },
        {
          ano: 'Hoje',
          titulo: 'De 16 a 50 pés',
          texto:
            'O portfólio vai da menor aberta à cabinada oceânica, com opções de Teto Rígido Sea Breeze nos 32 pés e Hard Top nos 33 e 36. Presença confirmada no Rio Boat Show e no São Paulo Boat Show.',
        },
        {
          ano: '3.000+',
          titulo: 'Embarcações entregues',
          texto:
            'Mais de três mil cascos saíram do estaleiro desde 1990, cada um na configuração que o proprietário escolheu. Dez anos de garantia estrutural e dois de cobertura total dos componentes.',
        },
      ],
      yardTitle: 'O estaleiro',
      yardLede:
        'Região metropolitana do Rio de Janeiro, com área industrial de aproximadamente 6.000 m².',
      estaleiro: [
        'Temos como prioridade a saúde e a segurança dos nossos clientes e colaboradores, buscando sempre manter o equilíbrio entre o desenvolvimento de produtos e a preservação do meio ambiente.',
        'Possui sistema wood free, que consiste na não utilização de madeira estrutural na fabricação. Outro ponto a se destacar é a utilização de camadas de resina especial para o Skin Coat, que reduz a absorção de umidade no casco. Não são realizadas pinturas automotivas nas embarcações: toda pigmentação é aplicada na cor determinada pelo comprador, em gel coat no início da industrialização, aumentando a resistência em 100 vezes comparado com a pintura tradicional, além de oferecer uma vida útil muito maior.',
        'Conforme normas internacionais, são utilizadas mantas, tecidos biaxiais, reforços com Divinycell, Renicell e Coremat na laminação. Todas as embarcações são industrializadas no sistema monobloco, ou seja, após a pré-montagem, o casco e o convés são soldados, proporcionando maior resistência, durabilidade e menos ruído na navegação.',
        'Nas versões a partir de 38 pés é aplicado o processo de laminação por infusão a vácuo, atualmente considerado o processo mais inovador da indústria náutica, utilizado para construção de barcos de alta performance e qualidade: produz uma leveza estrutural e um grau extra de resistência.',
      ],
      whyEyebrow: 'Por que uma Coral?',
      whyTitle: 'O que o estaleiro entrega.',
      /* Transcrito da secao "POR QUE UMA CORAL?" da pagina /sobre/ do site
         legado, que nao tinha vindo na migracao. */
      why: [
        {
          title: 'Nossas lanchas',
          body: 'A Coral acompanha todo o processo industrial, do projeto à entrega da embarcação, e responde pela relação entre custo e benefício de cada modelo da linha.',
        },
        {
          title: 'Nossos serviços',
          body: 'A assistência técnica atende de pequenos reparos à reforma completa, com matéria-prima e acessórios selecionados e mão de obra especializada.',
        },
        {
          title: 'Nossa fábrica',
          body: 'Fundado em 1990 fabricando embarcações de pequeno porte, o estaleiro hoje produz lanchas de luxo de até 50 pés e é um dos maiores do país.',
        },
      ],
      serviceEyebrow: 'Serviço e garantia',
      serviceTitle: 'A Coral resolve.',
      servico: [
        'A Coral oferece 10 anos de garantia estrutural e 2 anos de garantia total dos componentes, a única no mercado com esta prática.',
        'Possui uma central de atendimento para os registros das chamadas e equipes próprias especializadas para realizar atendimentos, de baixa à alta complexidade. Além de possuir estoque de reposição imediata das principais peças, reduzindo assim o intervalo de conclusão dos atendimentos.',
        'O estaleiro adicionalmente realiza atendimentos extras para reparos e revitalizações de embarcações diversas, oferecendo serviço de qualidade, a preço justo.',
      ],
      serviceClosing:
        'Com a Coral, a única preocupação que se deve ter é com o vento a favor e o destino a navegar. O restante, a Coral resolve.',
      ctaTeam: 'Falar com a equipe',
      ctaModels: 'Ver os modelos',
    },
    en: {
      eyebrow: 'About us',
      title: 'A wholly Brazilian shipyard, since 1990.',
      lede: 'Coral was founded in 1990 in Rio de Janeiro as a wholly Brazilian shipyard.',
      statYears: 'Of shipbuilding',
      statBoats: 'Boats built',
      statPortfolio: 'Portfolio',
      statArea: 'Plant area',
      unitYears: 'years',
      unitFeet: 'ft',
      historyTitle: 'The story',
      marcos: [
        {
          ano: '1990',
          titulo: 'A yard opens in Rio',
          texto:
            'Coral is founded as a wholly Brazilian shipyard in the Rio de Janeiro metropolitan area. The operation starts small, and the name is still unknown outside boating circles.',
        },
        {
          ano: 'Early years',
          titulo: 'Boats up to 18 feet',
          texto:
            'The first years covered small craft only. Those boats drew attention for their design and for a smooth ride that owners talked about on their own.',
        },
        {
          ano: 'Growth',
          titulo: 'Four pillars',
          texto:
            'Product, quality, honesty and relationships carry the expansion. Every project is run as a one-off by the team, who see each boat through to handover.',
        },
        {
          ano: 'Construction',
          titulo: 'Wood Free, monocoque hull',
          texto:
            'No structural timber goes into any build. Hull and deck form a single monocoque with floors and stringers, and the colour is laid in gel coat from the start, never automotive paint.',
        },
        {
          ano: '38 feet+',
          titulo: 'Vacuum infusion lamination',
          texto:
            'From 38 feet up comes the most advanced process in the industry: less structural weight and an extra measure of strength, with a sandwich system in Divinycell and Renicell.',
        },
        {
          ano: 'Today',
          titulo: '16 to 50 feet',
          texto:
            'The range runs from the smallest open boat to the offshore cabin cruiser, with the Sea Breeze hard top on the 32 and Hard Top on the 33 and 36. Present at both the Rio and São Paulo boat shows.',
        },
        {
          ano: '3,000+',
          titulo: 'Boats delivered',
          texto:
            'More than three thousand hulls have left the yard since 1990, each in the configuration its owner specified. Ten years of structural warranty, two of full component cover.',
        },
      ],
      yardTitle: 'The shipyard',
      yardLede:
        'Greater Rio de Janeiro, with an industrial site of roughly 6,000 m².',
      estaleiro: [
        'The health and safety of our clients and our people come first, and we hold the balance between developing new product and protecting the environment around us.',
        'The yard is wood free: no structural timber goes into any build. Special resin layers in the Skin Coat reduce moisture absorption in the hull. We apply no automotive paint to our boats. Every pigment is laid down in gel coat, in the colour the owner specifies, at the very start of the build. The result is a hundred times more resistant than conventional paint, and lasts far longer.',
        'In line with international standards, lamination uses chopped strand mat, biaxial fabrics and Divinycell, Renicell and Coremat reinforcement. Every boat is built as a monocoque: after pre-assembly, hull and deck are bonded into one, for greater strength, longer life and less noise under way.',
        'From 38 feet up, the hull is laminated by vacuum infusion, the most advanced process in the industry today, used for high-performance, high-quality builds. It yields a lighter structure and an extra measure of strength.',
      ],
      whyEyebrow: 'Why a Coral?',
      whyTitle: 'What the yard delivers.',
      why: [
        {
          title: 'Our boats',
          body: 'Coral follows the whole industrial process, from drawing to handover, and stands behind the value each model in the range offers.',
        },
        {
          title: 'Our service',
          body: 'The service arm covers everything from small repairs to a full refit, with selected materials and fittings and specialist labour.',
        },
        {
          title: 'Our yard',
          body: 'Founded in 1990 building small craft, the yard today produces luxury boats up to 50 feet and ranks among the largest in the country.',
        },
      ],
      serviceEyebrow: 'Service and warranty',
      serviceTitle: 'Coral takes care of it.',
      servico: [
        'Coral offers a 10-year structural warranty and 2 years of full component cover, the only yard in the market to do so.',
        'A dedicated service desk logs every call, and our own specialist teams handle the work, from routine jobs to the most complex. We hold immediate replacement stock of the principal parts, which keeps turnaround times short.',
        'The yard also takes on repair and refit work for boats of other makes, with quality workmanship at a fair price.',
      ],
      serviceClosing:
        'With a Coral, the only things to think about are a following wind and where to drop anchor. Coral takes care of the rest.',
      ctaTeam: 'Talk to our team',
      ctaModels: 'View the models',
    },
  }[locale]

  /*
   * Fotografias da linha do tempo, do menor modelo ao maior: a sequência
   * acompanha o crescimento que o texto descreve, do barco de 18 pés à
   * cabinada de 50. Nem todo marco recebe imagem — alternar entre entradas
   * com e sem foto dá respiro à leitura.
   */
  const porTamanho = [...boats]
    .filter((b) => b.heroImage)
    .sort((a, b) => (toNum(a.lengthM) ?? 0) - (toNum(b.lengthM) ?? 0))

  const marcos: Marco[] = COPY.marcos.map((m, i) => {
    // Marcos 1, 3, 5 e 6 levam foto; os demais ficam só com texto.
    const comFoto = [1, 3, 5, 6]
    const posicao = comFoto.indexOf(i)
    if (posicao < 0) return m
    // Distribui do menor ao maior ao longo do acervo disponível.
    const barco = porTamanho[Math.round((posicao / (comFoto.length - 1)) * (porTamanho.length - 1))]
    return { ...m, imagem: barco?.heroImage ?? null, legenda: barco ? boatLabel(barco) : null }
  })

  return (
    <>
      <SiteHeader active="sobre" locale={locale} />
      <main className="flex-1">

      <section className="relative isolate overflow-hidden" style={{ background: 'var(--grad-deep)' }}>
        <WakeLines side="left" tone="dark" className="top-1/2 -translate-y-1/2" />
        <div className="container-page relative py-20 lg:py-28">
          <Reveal>
            <SectionHeading as="h1" inverse eyebrow={COPY.eyebrow} title={COPY.title} lede={COPY.lede} />
          </Reveal>

          <div className="mt-14 grid grid-cols-2 gap-4 lg:mt-16 sm:grid-cols-4">
            {[
              {
                value: COMPANY.facts.yearsApprox,
                unit: COPY.unitYears,
                label: COPY.statYears,
              },
              { value: '3.000', unit: '+', label: COPY.statBoats },
              { value: '16–50', unit: COPY.unitFeet, label: COPY.statPortfolio },
              { value: '6.000', unit: 'm²', label: COPY.statArea },
            ].map((f, i) => (
              <Reveal key={f.label} delay={i < 4 ? i * 70 : 0}>
                <div className="h-full rounded-[var(--radius-md)] border border-[var(--border-on-dark)] bg-white/[0.03] px-5 py-5 transition-colors duration-[240ms] ease-[var(--ease-glide)] hover:border-[var(--border-on-dark-strong)]">
                  <StatBlock inverse size="sm" value={f.value} unit={f.unit} label={f.label} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ A HISTÓRIA (linha do tempo) ============ */}
      <section className="section-y relative isolate overflow-hidden bg-[var(--surface-page)]">
        <SwellLine side="right" tone="light" className="top-24" />
        <div className="container-page relative">
          <Reveal>
            <div className="mx-auto max-w-[46rem] text-center">
              <div className="flex items-center justify-center gap-3">
                <span aria-hidden className="h-px w-7 bg-ocean-700" />
                <h2 className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
                  {COPY.historyTitle}
                </h2>
                <span aria-hidden className="h-px w-7 bg-ocean-700" />
              </div>
              <p className="mt-5 text-[17px] leading-[1.7] text-[var(--color-text-body)]">
                {COPY.lede}
              </p>
            </div>
          </Reveal>

          {/* A linha do tempo carrega o conteúdo que antes era texto corrido
              numa coluna só. As fotografias vêm do acervo dos modelos, do
              menor ao maior, acompanhando o crescimento que o texto descreve. */}
          <div className="mx-auto mt-16 max-w-[64rem]">
            <Timeline marcos={marcos} />
          </div>
        </div>
      </section>

      <section
        className="section-y relative isolate overflow-hidden"
        style={{ background: 'var(--grad-technical)' }}
      >
        <SonarGrid side="left" tone="dark" className="top-0" />
        <div className="container-page relative grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-16">
          <div className="lg:col-span-4">
            <Reveal>
              <div className="flex items-center gap-3">
                <span aria-hidden className="h-px w-7 bg-aqua-500" />
                <h2 className="font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-aqua-500">
                  {COPY.yardTitle}
                </h2>
              </div>
              <p className="mt-5 text-[15px] leading-[1.6] text-on-dark-muted">
                {COPY.yardLede}
              </p>
            </Reveal>
          </div>
          <Reveal className="flex flex-col gap-6 lg:col-span-8">
            {COPY.estaleiro.map((p, i) => (
              <p key={i} className="text-[17px] leading-[1.7] text-on-dark-soft">
                {p}
              </p>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ============ POR QUE UMA CORAL ============ */}
      <section className="relative isolate overflow-hidden bg-[var(--surface-page)] py-20 lg:py-24">
        <SwellLine side="left" tone="light" className="top-16" />
        <div className="container-page relative">
          <Reveal>
            <SectionHeading eyebrow={COPY.whyEyebrow} title={COPY.whyTitle} />
          </Reveal>
          {/* `items-stretch` + `h-full` no cartao: sem isso cada um assume a
              altura do proprio texto e a linha fica irregular. Os tres ficam
              do mesmo tamanho, independente do tamanho do paragrafo. */}
          <ul className="mt-12 grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
            {COPY.why.map((item, i) => (
              <Reveal key={item.title} as="li" delay={i * 70} className="h-full">
                <div className="flex h-full flex-col rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-sm)]">
                  <h3 className="font-display text-lg font-semibold tracking-[var(--tracking-display)] text-[var(--text-strong)]">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-[1.6] text-[var(--color-text-body)]">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-y relative isolate overflow-hidden bg-[var(--surface-sunken)]">
        <HullArc side="right" tone="light" className="top-1/2 -translate-y-1/2" />
        <div className="container-page relative grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-16">
          <div className="lg:col-span-4">
            <Reveal>
              <SectionHeading eyebrow={COPY.serviceEyebrow} title={COPY.serviceTitle} />
            </Reveal>
          </div>
          <Reveal className="flex flex-col gap-6 lg:col-span-8">
            {COPY.servico.map((p, i) => (
              <p key={i} className="text-[17px] leading-[1.7] text-[var(--color-text-body)]">
                {p}
              </p>
            ))}
            <p className="text-[17px] font-medium leading-[1.7] text-[var(--text-strong)]">
              {COPY.serviceClosing}
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <Button href={href('contato', locale)} variant="signature" size="lg">
                {COPY.ctaTeam}
              </Button>
              <Button href={href('modelos', locale)} variant="outline" size="lg">
                {COPY.ctaModels}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
      </main>
    </>
  )
}
