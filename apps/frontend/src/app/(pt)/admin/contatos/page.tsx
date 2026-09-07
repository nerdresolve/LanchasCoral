import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/admin/Shell'
import ContatoForm from '@/components/admin/ContatoForm'

export const dynamic = 'force-dynamic'

/**
 * Pontos focais de atendimento.
 *
 * Cada finalidade é editada uma vez e vale para o site inteiro. O texto de
 * cada bloco diz onde aquele ponto aparece, porque não é evidente que mexer
 * aqui muda também o rodapé de todas as páginas.
 */
const FINALIDADES: Record<string, { titulo: string; onde: string }> = {
  comercial: {
    titulo: 'Comercial',
    onde: 'rodapé de todas as páginas, /contatos, /contato e os dados que o Google lê',
  },
  assistencia: {
    titulo: 'Assistência técnica',
    onde: '/contatos e /contato-para-servicos',
  },
  compras: {
    titulo: 'Compras e fornecedores',
    onde: '/contatos',
  },
}

export default async function ContatosAdminPage() {
  await requireAdmin()
  const pontos = await prisma.contactPoint.findMany({ orderBy: { order: 'asc' } })

  return (
    <>
      <PageHeader
        title="Contatos"
        count={`${pontos.length} ${pontos.length === 1 ? 'ponto de atendimento' : 'pontos de atendimento'}`}
      />

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-text-body)]">
        Os telefones aqui valem para o site todo. Ao trocar um número, ele muda
        de uma vez em todos os lugares que atendem àquela finalidade.
      </p>

      <div className="mt-8 space-y-6">
        {pontos.map((p) => {
          const info = FINALIDADES[p.key] ?? { titulo: p.key, onde: 'site' }
          return (
            <ContatoForm
              key={p.id}
              valores={{
                key: p.key,
                label: p.label,
                labelEn: p.labelEn,
                phones: p.phones,
                whatsapp: p.whatsapp,
                email: p.email,
                hours: p.hours,
                hoursEn: p.hoursEn,
                active: p.active,
              }}
              titulo={info.titulo}
              ondeAparece={info.onde}
            />
          )
        })}
      </div>
    </>
  )
}
