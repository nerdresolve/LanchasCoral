import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { markHandled } from '../inquiry-actions'
import { PageHeader, EmptyState } from '@/components/admin/Shell'
import TableFilter from '@/components/admin/TableFilter'
import BotaoEnviarMemorial from '@/components/admin/BotaoEnviarMemorial'
import { emailConfigurado } from '@/lib/email/mailer'

export const dynamic = 'force-dynamic'

const fmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/**
 * Por quanto tempo uma mensagem já tratada continua na lista.
 *
 * Mensagens pendentes NUNCA são apagadas, por mais antigas que sejam: elas
 * representam alguém esperando resposta, e sumir com isso seria perder um
 * cliente silenciosamente. A poda alcança só o que já foi resolvido.
 */
const DIAS_DE_RETENCAO = 30

export default async function InquiriesPage() {
  await requireAdmin()

  /*
   * Limpeza no próprio carregamento da página, em vez de um cron: o painel é
   * visitado com frequência mais que suficiente, e assim não há um serviço a
   * mais para manter no ar.
   *
   * O lint acusa `Date.now()` durante a renderização, e a regra existe por um
   * bom motivo — em componente cacheado, o valor congelaria. Aqui não se
   * aplica: a página é `force-dynamic`, então roda a cada visita, e a data
   * precisa ser a de agora justamente para o corte fazer sentido.
   */
  // eslint-disable-next-line react-hooks/purity
  const corte = new Date(Date.now() - DIAS_DE_RETENCAO * 864e5)
  await prisma.inquiry.deleteMany({
    where: { handled: true, createdAt: { lt: corte } },
  })

  const inquiries = await prisma.inquiry.findMany({
    orderBy: [{ handled: 'asc' }, { createdAt: 'desc' }],
    take: 200,
  })

  /* Quais modelos citados nos pedidos realmente têm memorial anexado. Sem
     isto o botão apareceria habilitado para depois falhar com "modelo sem
     memorial", o que é pior do que já vir explicado. */
  const slugsPedidos = [...new Set(inquiries.map((i) => i.boatSlug).filter((s): s is string => Boolean(s)))]
  const comMemorial = new Set(
    (
      await prisma.boat.findMany({
        where: { slug: { in: slugsPedidos }, manualUrl: { not: null } },
        select: { slug: true },
      })
    ).map((b) => b.slug),
  )
  const smtpPronto = await emailConfigurado()

  const pending = inquiries.filter((i) => !i.handled).length

  return (
    <>
      <PageHeader
        title="Mensagens recebidas"
        count={
          inquiries.length === 0
            ? 'Nenhuma mensagem recebida ainda.'
            : `${inquiries.length} ${inquiries.length === 1 ? 'mensagem' : 'mensagens'} · ${pending} pendentes`
        }
      />

      {inquiries.length === 0 ? (
        <EmptyState
          title="Nenhuma mensagem recebida"
          description="Quando alguém preencher um formulário do site, a mensagem aparece aqui, com as pendentes no topo."
        />
      ) : (
        <TableFilter
          noun={inquiries.length === 1 ? 'mensagem' : 'mensagens'}
          total={inquiries.length}
          placeholder="Buscar por nome, e-mail ou modelo…"
          label="Buscar nas mensagens"
          statusLabel="Filtrar por situação"
          status={[
            { value: '', label: 'Todas', count: inquiries.length },
            { value: 'pendente', label: 'Pendentes', count: pending },
            { value: 'tratado', label: 'Tratadas', count: inquiries.length - pending },
          ]}
          note={`As mensagens marcadas como tratadas saem da lista depois de ${DIAS_DE_RETENCAO} dias. As pendentes ficam até serem respondidas.`}
        >
          <ul className="mt-6 space-y-3">
            {inquiries.map((i) => (
              <li
                key={i.id}
                data-search={`${i.name} ${i.email} ${i.phone ?? ''} ${i.boatSlug ?? ''} ${i.message ?? ''}`}
                data-status={i.handled ? 'tratado' : 'pendente'}
              >
                <article
                  className={`rounded-[var(--radius-lg)] border bg-[var(--surface-card)] p-5 shadow-[var(--shadow-sm)] ${
                    i.handled
                      ? 'border-[var(--border-subtle)] opacity-75'
                      : 'border-ocean-700/35'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-medium text-[var(--text-strong)]">
                        {i.name}
                        {!i.handled && (
                          <span className="rounded-[var(--radius-pill)] bg-ocean-700/12 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[var(--tracking-wide)] text-ocean-700">
                            Pendente
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                        <a
                          href={`mailto:${i.email}`}
                          className="transition-colors duration-[140ms] hover:text-ocean-700"
                        >
                          {i.email}
                        </a>
                        {i.phone && <> · {i.phone}</>}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <time className="text-xs tabular-nums text-[var(--text-muted)]">
                        {fmt.format(i.createdAt)}
                      </time>
                      <form action={markHandled}>
                        <input type="hidden" name="id" value={i.id} />
                        <button
                          className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold transition-colors duration-[140ms] ${
                            i.handled
                              ? 'border border-[var(--border-strong)] text-[var(--color-text-body)] hover:bg-[var(--surface-sunken)]'
                              : 'bg-[image:var(--grad-signature)] text-pearl-0 hover:shadow-[var(--glow-signature)]'
                          }`}
                        >
                          {i.handled ? 'Reabrir' : 'Marcar como tratado'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {i.boatSlug && (
                    <p className="mt-3 inline-block rounded-[var(--radius-pill)] bg-[var(--surface-sunken)] px-2.5 py-1 font-mono text-xs text-[var(--color-text-body)]">
                      Modelo: {i.boatSlug}
                    </p>
                  )}
                  {i.message && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-body)]">
                      {i.message}
                    </p>
                  )}

                  {i.kind === 'MANUAL' && (
                    <BotaoEnviarMemorial
                      id={i.id}
                      jaEnviadoEm={i.manualSentAt}
                      desabilitadoPorque={
                        !smtpPronto
                          ? 'O envio de e-mail ainda não foi configurado no servidor.'
                          : !i.boatSlug
                            ? 'Este pedido não informa o modelo.'
                            : !comMemorial.has(i.boatSlug)
                              ? 'Este modelo ainda não tem memorial anexado.'
                              : undefined
                      }
                    />
                  )}
                </article>
              </li>
            ))}
          </ul>
        </TableFilter>
      )}
    </>
  )
}
