'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Field, TextArea, Section, controlCls, labelCls } from './Field'
import { primaryBtnCls } from './Shell'
import { ImagesField, AccessoriesField, type ImageRow, type AccessoryRow } from './Repeaters'
import { TIPOS_DE_MOTOR } from '@/lib/listing-schema'
import type { ActionState } from '@/app/(pt)/admin/listing-actions'

export type ListingFormValues = {
  id?: string
  slug: string
  title: string
  brand: string | null
  kind: string
  year: number | null
  priceBrl: number | null
  sizeFt: number | null
  fuel: string | null
  hullType: string | null
  engine: string | null
  engineType: string | null
  capacity: string | null
  hours: string | null
  place: string | null
  tag: string | null
  description: string | null
  heroImage: string | null
  sourceUrl: string | null
  published: boolean
  sold: boolean
  order: number
  images: ImageRow[]
  accessories: AccessoryRow[]
}

type Props = {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>
  values: ListingFormValues
  submitLabel: string
}

export default function ListingForm({ action, values: v, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const err = (k: string) => state?.fieldErrors?.[k]

  return (
    <form action={formAction} className="space-y-6">
      {v.id && <input type="hidden" name="id" value={v.id} />}

      {state?.error && (
        <p role="alert" className="rounded-[var(--radius-sm)] border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm font-medium text-danger-500">
          {state.error}
        </p>
      )}

      <Section title="Identificação">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Título"
            name="title"
            defaultValue={v.title}
            required
            errors={err('title')}
            placeholder="Coral 40A FULL [2024]"
          />
          <Field
            label="Marca"
            name="brand"
            defaultValue={v.brand}
            errors={err('brand')}
            placeholder="Coral, Real, Sea-Doo…"
          />
          <div>
            <Field
              label="Endereço da página"
              name="slug"
              defaultValue={v.slug}
              required
              errors={err('slug')}
              placeholder="coral-40a-full-2024"
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              É o final do link do anúncio: /broker/…
              {v.id && ' Ao mudar, o link antigo para de funcionar.'}
            </p>
          </div>
          <div>
            <label htmlFor="f-kind" className={labelCls}>
              Tipo<span className="text-danger-500" title="Campo obrigatório"> *</span>
            </label>
            <select
              id="f-kind"
              name="kind"
              defaultValue={v.kind}
              className={`mt-1.5 ${controlCls}`}
            >
              <option value="LANCHA">Lancha</option>
              <option value="JETSKI">Jet ski</option>
            </select>
            {err('kind')?.map((e) => <p key={e} className="mt-1 text-xs font-medium text-danger-500">{e}</p>)}
          </div>
          <Field
            label="Selo"
            name="tag"
            defaultValue={v.tag}
            errors={err('tag')}
            placeholder="Certificado, Único dono…"
          />
          <Field
            label="Localização"
            name="place"
            defaultValue={v.place}
            errors={err('place')}
            placeholder="Angra dos Reis - RJ"
          />
        </div>

        <div className="mt-4">
          <TextArea label="Descrição" name="description" defaultValue={v.description} rows={5} errors={err('description')} />
        </div>
      </Section>

      <Section title="Ficha técnica">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Ano" name="year" defaultValue={v.year} type="number" errors={err('year')} />
          <Field
            label="Preço"
            name="priceBrl"
            defaultValue={v.priceBrl}
            type="number"
            suffix="R$"
            errors={err('priceBrl')}
            placeholder="Sem centavos"
          />
          <Field label="Tamanho" name="sizeFt" defaultValue={v.sizeFt} type="number" suffix="pés" errors={err('sizeFt')} />
          <Field label="Capacidade" name="capacity" defaultValue={v.capacity} errors={err('capacity')} placeholder="1+15" />
          <Field label="Combustível" name="fuel" defaultValue={v.fuel} errors={err('fuel')} placeholder="Diesel, Gasolina" />
          <Field label="Casco" name="hullType" defaultValue={v.hullType} errors={err('hullType')} placeholder="Fibra de vidro" />
          <Field
            label="Horas de uso"
            name="hours"
            defaultValue={v.hours}
            errors={err('hours')}
            placeholder="26 horas BB e 0 hora BE"
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <TextArea
              label="Motorização"
              name="engine"
              defaultValue={v.engine}
              rows={3}
              hint="Ex.: 2x Mercruiser 3.0L V6 250HP"
              errors={err('engine')}
            />
          </div>
          <div>
            <label htmlFor="f-engineType" className={labelCls}>
              Tipo do motor
            </label>
            <select
              id="f-engineType"
              name="engineType"
              defaultValue={v.engineType ?? ''}
              className={`mt-1.5 ${controlCls}`}
            >
              <option value="">Não informar</option>
              {TIPOS_DE_MOTOR.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Alimenta o filtro de busca do Broker. Sem isso, o anúncio não aparece quando o visitante filtra por motor.
            </p>
            {err('engineType')?.map((e) => <p key={e} className="mt-1 text-xs font-medium text-danger-500">{e}</p>)}
          </div>
        </div>
      </Section>

      <Section title="Galeria" description="A primeira imagem é usada como capa.">
        <ImagesField name="images" initial={v.images} />
      </Section>

      <Section title="Acessórios" description="Itens de série e opcionais do anúncio.">
        <AccessoriesField name="accessories" initial={v.accessories} />
      </Section>

      <Section title="Publicação">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ordem de exibição" name="order" defaultValue={v.order} type="number" />
          <div className="flex flex-wrap items-center gap-6 self-end pb-2.5">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="published"
                defaultChecked={v.published}
                className="h-4 w-4 rounded-[var(--radius-xs)] border-[var(--border-strong)] accent-[var(--color-ocean-700)]"
              />
              <span className="text-sm font-medium text-[var(--color-text-body)]">Publicado no site</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="sold"
                defaultChecked={v.sold}
                className="h-4 w-4 rounded-[var(--radius-xs)] border-[var(--border-strong)] accent-[var(--color-ocean-700)]"
              />
              <span className="text-sm font-medium text-[var(--color-text-body)]">Vendido</span>
            </label>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          <Field
            label="Imagem de capa"
            name="heroImage"
            defaultValue={v.heroImage}
            errors={err('heroImage')}
            hint="Deixe em branco para usar a primeira foto da galeria."
            placeholder="https://…"
          />
          <Field
            label="Link do anúncio original"
            name="sourceUrl"
            defaultValue={v.sourceUrl}
            errors={err('sourceUrl')}
            hint="Uso interno: de onde veio este anúncio. Não aparece no site."
            placeholder="https://broker.lanchascoral.com.br/…"
          />
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] bg-[var(--surface-page)]/92 px-1 py-4 backdrop-blur">
        <Link href="/admin/listings" className="text-sm font-medium text-[var(--text-muted)] transition-colors duration-[140ms] hover:text-[var(--text-strong)]">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className={primaryBtnCls}
        >
          {pending ? 'Salvando…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
