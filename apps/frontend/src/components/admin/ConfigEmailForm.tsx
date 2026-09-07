'use client'

import { useActionState, useState } from 'react'
import { Field, Section, controlCls, labelCls } from './Field'
import { primaryBtnCls } from './Shell'
import { MARCA_SENHA_GUARDADA } from '@/lib/email/marcas'
import { salvarConfigEmail, testarConexao, type MailState } from '@/app/(pt)/admin/mail-actions'

export type ConfigValores = {
  host: string | null
  port: number
  secure: boolean
  serverName: string | null
  user: string | null
  fromEmail: string | null
  fromName: string
  replyTo: string | null
  bcc: string | null
  autoLimitPerHour: number
  /** De onde vem a senha em uso, para explicar o estado sem revelá-la. */
  origemDaSenha: 'painel' | 'ambiente' | 'nenhuma'
}

/**
 * Configuração do servidor de saída.
 *
 * Dois envios no mesmo formulário: testar e salvar. Testar usa o que está na
 * tela, sem gravar — assim dá para descobrir que a senha está errada antes de
 * guardá-la.
 *
 * A senha gravada nunca volta preenchida; o campo mostra uma marca de que
 * existe uma. Devolvê-la no HTML deixaria a senha do e-mail da empresa
 * legível no código-fonte da página.
 */
export default function ConfigEmailForm({ valores: v }: { valores: ConfigValores }) {
  const [estadoSalvar, salvar, salvando] = useActionState<MailState, FormData>(salvarConfigEmail, undefined)
  const [estadoTeste, testar, testando] = useActionState<MailState, FormData>(testarConexao, undefined)
  const [porta, setPorta] = useState(v.port)

  const estado = estadoTeste ?? estadoSalvar

  return (
    <form className="space-y-6 pb-4">
      <Section
        title="Servidor de saída"
        description="Os dados do provedor de e-mail. Teste antes de salvar."
      >
        {estado?.erro && (
          <p role="alert" className="mb-4 rounded-[var(--radius-sm)] border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm font-medium text-danger-500">
            {estado.erro}
          </p>
        )}
        {estado?.ok && (
          <p role="status" className="mb-4 rounded-[var(--radius-sm)] border border-ocean-700/30 bg-ocean-700/8 px-4 py-3 text-sm font-medium text-ocean-700">
            {estado.ok}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Servidor (host)"
            name="host"
            defaultValue={v.host}
            placeholder="mail.seuprovedor.com.br"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="f-port" className={labelCls}>Porta</label>
              <input
                id="f-port"
                name="port"
                type="number"
                value={porta}
                onChange={(e) => setPorta(Number(e.target.value))}
                className={`mt-1.5 ${controlCls}`}
              />
            </div>
            <div>
              <label htmlFor="f-secure" className={labelCls}>Conexão</label>
              <select
                id="f-secure"
                name="secure"
                defaultValue={v.secure ? 'true' : 'false'}
                className={`mt-1.5 ${controlCls}`}
              >
                <option value="true">TLS direto (465)</option>
                <option value="false">STARTTLS (587)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Usuário"
            name="user"
            defaultValue={v.user}
            placeholder="contato@lanchascoral.com.br"
          />
          <div>
            <label htmlFor="f-pass" className={labelCls}>Senha</label>
            <input
              id="f-pass"
              name="pass"
              type="password"
              autoComplete="new-password"
              defaultValue={v.origemDaSenha === 'painel' ? MARCA_SENHA_GUARDADA : ''}
              placeholder={v.origemDaSenha === 'ambiente' ? 'Vindo do servidor' : 'Digite a senha'}
              className={`mt-1.5 ${controlCls}`}
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {v.origemDaSenha === 'painel'
                ? 'Já existe uma senha guardada, cifrada. Deixe como está para mantê-la.'
                : v.origemDaSenha === 'ambiente'
                  ? 'Hoje a senha vem do arquivo do servidor. Digitar uma aqui passa a valer no lugar dela.'
                  : 'Nenhuma senha guardada ainda.'}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <Field
            label="Nome no certificado"
            name="serverName"
            defaultValue={v.serverName}
            hint="Só quando o certificado do servidor responde por outro nome. Em branco na maioria dos casos."
            placeholder="mail.seuprovedor.com.br"
          />
        </div>
      </Section>

      <Section title="Identidade do remetente" description="Como a mensagem aparece para quem recebe.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nome do remetente"
            name="fromName"
            defaultValue={v.fromName}
            required
            placeholder="Coral Indústria Naval"
          />
          <Field
            label="E-mail do remetente"
            name="fromEmail"
            defaultValue={v.fromEmail}
            hint="Em branco, usa o próprio usuário do servidor."
            placeholder="contato@lanchascoral.com.br"
          />
          <Field
            label="Responder para"
            name="replyTo"
            defaultValue={v.replyTo}
            hint="Para onde vão as respostas de quem receber."
          />
          <Field
            label="Cópia oculta"
            name="bcc"
            defaultValue={v.bcc}
            hint="Recebe uma cópia de tudo que sair. Útil para manter histórico."
          />
        </div>
      </Section>

      <Section
        title="Limite de segurança"
        description="Vale só para o envio automático."
      >
        <div className="max-w-xs">
          <Field
            label="Máximo de envios por hora"
            name="autoLimitPerHour"
            type="number"
            defaultValue={v.autoLimitPerHour}
            hint="Passando disso, os pedidos ficam pendentes para aprovação em vez de saírem sozinhos."
          />
        </div>
      </Section>

      {/* `bg` opaco, e não translúcido: com `backdrop-blur` o conteúdo de
          baixo aparecia por trás dos botões e ficava ilegível. */}
      <div className="sticky bottom-0 -mx-1 mt-2 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border-subtle)] bg-[var(--surface-page)] px-1 py-4">
        <button
          type="submit"
          formAction={testar}
          disabled={testando || salvando}
          className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--color-text-body)] transition-colors duration-[140ms] hover:bg-[var(--surface-sunken)] disabled:opacity-50"
        >
          {testando ? 'Testando…' : 'Testar conexão'}
        </button>
        <button
          type="submit"
          formAction={salvar}
          disabled={testando || salvando}
          className={primaryBtnCls}
        >
          {salvando ? 'Salvando…' : 'Salvar configuração'}
        </button>
      </div>
    </form>
  )
}
