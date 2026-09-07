'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Field, TextArea, Section, controlCls, labelCls } from './Field'
import { primaryBtnCls } from './Shell'
import {
  ImagesField,
  EquipmentField,
  PerformanceField,
  type ImageRow,
  type EquipRow,
  type PerfRow,
} from './Repeaters'
import type { ActionState } from '@/app/(pt)/admin/boat-actions'

export type BoatFormValues = {
  id?: string
  slug: string
  name: string
  variant: string | null
  familyName: string | null
  tagline: string | null
  description: string | null
  variantEn: string | null
  taglineEn: string | null
  descriptionEn: string | null
  lengthM: string | null
  beamM: string | null
  draftM: string | null
  depthM: string | null
  cabinHeightM: string | null
  weightKg: number | null
  engineWeightKg: number | null
  fuelL: number | null
  waterL: number | null
  powerMinHp: number | null
  powerMaxHp: number | null
  capInteriorDay: number | null
  capInteriorNight: number | null
  capOpenSeaDay: number | null
  capOpenSeaNight: number | null
  published: boolean
  order: number
  heroImage: string | null
  manualUrl: string | null
  seoTitle: string | null
  seoDescription: string | null
  images: ImageRow[]
  equipment: EquipRow[]
  performance: PerfRow[]
}

type Props = {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>
  values: BoatFormValues
  families: string[]
  submitLabel: string
}

export default function BoatForm({ action, values: v, families, submitLabel }: Props) {
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
          <Field label="Nome" name="name" defaultValue={v.name} required errors={err('name')} placeholder="Coral 36" />
          <Field
            label="Variante"
            name="variant"
            defaultValue={v.variant}
            errors={err('variant')}
            placeholder="Cabinada, Aberta, BLACKLINE…"
          />
          <div>
            <Field
              label="Endereço da página"
              name="slug"
              defaultValue={v.slug}
              required
              errors={err('slug')}
              placeholder="coral-36-cabinada"
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              É o final do link do modelo: /modelos/…
              {v.id && ' Ao mudar, o link antigo para de funcionar.'}
            </p>
          </div>
          <div>
            <label htmlFor="f-familyName" className={labelCls}>
              Família
            </label>
            <input
              id="f-familyName"
              name="familyName"
              defaultValue={v.familyName ?? ''}
              list="families"
              placeholder="Coral 36"
              className={`mt-1.5 ${controlCls}`}
            />
            <datalist id="families">
              {families.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Agrupa as variantes no menu e na página de modelos. É criada sozinha se ainda não existir.
              <strong className="font-medium"> Sem família, o modelo não aparece em nenhuma das duas.</strong>
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <Field label="Chamada curta" name="tagline" defaultValue={v.tagline} placeholder="Uma frase de destaque" />
          <TextArea
            label="Descrição (português)"
            name="description"
            defaultValue={v.description}
            rows={5}
            errors={err('description')}
          />
        </div>
      </Section>

      <Section
        title="Tradução (inglês)"
        description="Opcional. Campos vazios usam automaticamente o texto em português no site em inglês."
      >
        <div className="space-y-4">
          <Field
            label="Variante"
            name="variantEn"
            defaultValue={v.variantEn}
            placeholder="Cabin / Open / Flybridge"
          />
          <Field
            label="Chamada curta"
            name="taglineEn"
            defaultValue={v.taglineEn}
            placeholder="A short headline"
          />
          <TextArea
            label="Descrição (inglês)"
            name="descriptionEn"
            defaultValue={v.descriptionEn}
            rows={5}
          />
        </div>
      </Section>

      <Section title="Dimensões">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Comprimento" name="lengthM" defaultValue={v.lengthM} type="number" step="0.01" suffix="m" errors={err('lengthM')} />
          <Field label="Boca" name="beamM" defaultValue={v.beamM} type="number" step="0.01" suffix="m" />
          <Field label="Pontal" name="depthM" defaultValue={v.depthM} type="number" step="0.01" suffix="m" />
          <Field label="Calado" name="draftM" defaultValue={v.draftM} type="number" step="0.01" suffix="m" />
          <Field label="Pé-direito da cabine" name="cabinHeightM" defaultValue={v.cabinHeightM} type="number" step="0.01" suffix="m" />
          <Field label="Peso sem motor" name="weightKg" defaultValue={v.weightKg} type="number" suffix="kg" />
          <Field label="Peso do motor" name="engineWeightKg" defaultValue={v.engineWeightKg} type="number" suffix="kg" />
        </div>
      </Section>

      <Section title="Motorização e tanques">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Potência mínima" name="powerMinHp" defaultValue={v.powerMinHp} type="number" suffix="HP" errors={err('powerMinHp')} />
          <Field label="Potência máxima" name="powerMaxHp" defaultValue={v.powerMaxHp} type="number" suffix="HP" />
          <Field label="Tanque de combustível" name="fuelL" defaultValue={v.fuelL} type="number" suffix="L" />
          <Field label="Tanque de água" name="waterL" defaultValue={v.waterL} type="number" suffix="L" />
        </div>
      </Section>

      <Section title="Capacidade" description="Número de pessoas por período.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Interior, dia" name="capInteriorDay" defaultValue={v.capInteriorDay} type="number" />
          <Field label="Interior, pernoite" name="capInteriorNight" defaultValue={v.capInteriorNight} type="number" />
          <Field label="Mar aberto, dia" name="capOpenSeaDay" defaultValue={v.capOpenSeaDay} type="number" />
          <Field label="Mar aberto, pernoite" name="capOpenSeaNight" defaultValue={v.capOpenSeaNight} type="number" />
        </div>
      </Section>

      <Section title="Desempenho" description="Uma entrada por opção de motorização.">
        <PerformanceField name="performance" initial={v.performance} />
      </Section>

      <Section title="Galeria" description="A primeira imagem é usada como capa.">
        <ImagesField name="images" initial={v.images} />
      </Section>

      <Section title="Descrição e equipamentos">
        <EquipmentField name="equipment" initial={v.equipment} />
      </Section>

      <Section title="Publicação e SEO">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ordem de exibição" name="order" defaultValue={v.order} type="number" />
          <label className="flex items-center gap-3 self-end pb-2.5">
            <input
              type="checkbox"
              name="published"
              defaultChecked={v.published}
              className="h-4 w-4 rounded-[var(--radius-xs)] border-[var(--border-strong)] accent-[var(--color-ocean-700)]"
            />
            <span className="text-sm font-medium text-[var(--color-text-body)]">Publicado no site</span>
          </label>
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
            label="Memorial descritivo (PDF)"
            name="manualUrl"
            defaultValue={v.manualUrl}
            errors={err('manualUrl')}
            hint="Link do arquivo. É o que o botão de download abre na página do modelo; em branco, o botão não aparece."
            placeholder="https://lanchascoral.com.br/wp-content/uploads/2021/12/36.pdf"
          />
          <Field
            label="Título para o Google"
            name="seoTitle"
            defaultValue={v.seoTitle}
            errors={err('seoTitle')}
            hint="Aparece como título nos resultados de busca. Em branco, usa o nome do modelo."
          />
          <TextArea
            label="Resumo para o Google"
            name="seoDescription"
            defaultValue={v.seoDescription}
            rows={2}
            errors={err('seoDescription')}
            hint="O trecho de duas linhas mostrado abaixo do título na busca."
          />
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] bg-[var(--surface-page)]/92 px-1 py-4 backdrop-blur">
        <Link href="/admin" className="text-sm font-medium text-[var(--text-muted)] transition-colors duration-[140ms] hover:text-[var(--text-strong)]">
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
