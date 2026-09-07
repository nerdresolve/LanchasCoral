import PageShell from '@/components/PageShell'
import type { Locale } from '@/i18n/config'

export default function PoliticaDeQualidadeView({ locale }: { locale: Locale }) {
  const COPY = {
    pt: {
      eyebrow: 'Institucional',
      title: 'Política de qualidade',
      lede: 'A Lanchas Coral adota como política da qualidade:',
      statement:
        'Compromisso de fornecer lanchas com qualidade e atendendo às necessidades específicas de cada cliente, respeitando as especificações e normas técnicas aplicáveis, capacitando e desenvolvendo os colaboradores para a busca da melhoria contínua dos processos de trabalho e do seu sistema de gestão da qualidade, atuando de forma ética e responsável com nossos parceiros de negócios: fornecedores, representantes e revendedores.',
      objectivesTitle: 'Objetivos da qualidade',
      /* Objetivos transcritos da página /politica-de-qualidade/ do site legado. */
      objectives: [
        'Manter os colaboradores atualizados nas novas tecnologias aplicadas ao setor.',
        'Excelência no atendimento aos requisitos.',
        'Desenvolvimento de novos mercados.',
        'Melhoria contínua da eficácia dos processos.',
      ],
    },
    en: {
      eyebrow: 'Company',
      title: 'Quality policy',
      lede: 'Lanchas Coral upholds the following quality policy:',
      statement:
        'A commitment to building boats of the highest quality, tailored to the specific needs of each client, in full compliance with the applicable technical specifications and standards; to training and developing our people in pursuit of continuous improvement across our processes and our quality management system; and to working ethically and responsibly with our business partners: suppliers, representatives and dealers.',
      objectivesTitle: 'Quality objectives',
      objectives: [
        'Keeping our people current with new technologies applied to the industry.',
        'Excellence in meeting every requirement.',
        'Development of new markets.',
        'Continuous improvement of process effectiveness.',
      ],
    },
  }[locale]

  return (
    <PageShell locale={locale} eyebrow={COPY.eyebrow} title={COPY.title} lede={COPY.lede}>
      <blockquote className="border-l-2 border-aqua-500 pl-6 text-[18px] leading-[1.7] text-[var(--text-strong)]">
        {COPY.statement}
      </blockquote>

      <h2 className="mt-12 font-body text-[length:var(--text-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-ocean-700">
        {COPY.objectivesTitle}
      </h2>
      <ul className="mt-5 flex flex-col gap-3">
        {COPY.objectives.map((o) => (
          <li key={o} className="flex items-start gap-3">
            <span aria-hidden className="mt-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-aqua-500" />
            <span className="text-[16px] leading-[1.7] text-[var(--color-text-body)]">{o}</span>
          </li>
        ))}
      </ul>
    </PageShell>
  )
}
