/**
 * Provisiona o túnel Cloudflare e o registro DNS do site.
 *
 * Idempotente: se o túnel ou o CNAME já existirem, reaproveita em vez de
 * duplicar. Pode ser rodado de novo com segurança.
 *
 *   node infra/cloudflare-setup.mjs
 *
 * Lê as credenciais de `.env` na raiz do repositório e grava o token do
 * conector em `infra/.env.tunnel`, que o docker compose consome.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const RAIZ = path.resolve(import.meta.dirname, '..')
const DOMINIO = 'coral.nerdresolve.com'
const ZONA_NOME = 'nerdresolve.com'
const TUNEL_NOME = 'coral'

/** Lê o .env sem depender de biblioteca: o arquivo é simples. */
function lerEnv(arquivo) {
  const txt = fs.readFileSync(arquivo, 'utf8')
  const out = {}
  for (const linha of txt.split('\n')) {
    const l = linha.trim()
    if (!l || l.startsWith('#')) continue
    const i = l.indexOf('=')
    if (i < 0) continue
    out[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}

const env = lerEnv(path.join(RAIZ, '.env'))
const TOKEN = env.CLOUDFLARE_API
const CONTA = env.CLOUDFLARE_ID
if (!TOKEN || !CONTA) {
  console.error('Faltam CLOUDFLARE_API / CLOUDFLARE_ID no .env da raiz.')
  process.exit(1)
}

async function cf(caminho, init = {}) {
  const r = await fetch(`https://api.cloudflare.com/client/v4${caminho}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  const body = await r.json()
  if (!body.success) {
    const msg = (body.errors ?? []).map((e) => `${e.code} ${e.message}`).join('; ')
    throw new Error(`${init.method ?? 'GET'} ${caminho} -> ${r.status} ${msg}`)
  }
  return body.result
}

/* ---------- 1. zona ---------- */
const zonas = await cf(`/zones?name=${ZONA_NOME}`)
if (!zonas.length) throw new Error(`Zona ${ZONA_NOME} não encontrada nesta conta.`)
const zona = zonas[0].id
console.log(`zona    ${ZONA_NOME} (${zona})`)

/* ---------- 2. túnel ---------- */
const existentes = await cf(`/accounts/${CONTA}/cfd_tunnel?name=${TUNEL_NOME}&is_deleted=false`)
let tunel = existentes.find((t) => t.name === TUNEL_NOME)
let segredo

if (tunel) {
  console.log(`túnel   ${TUNEL_NOME} já existe (${tunel.id}) — reaproveitando`)
} else {
  // O segredo é nosso: a Cloudflare não o devolve depois da criação, então
  // ele precisa ser guardado agora para montar o token do conector.
  segredo = crypto.randomBytes(32).toString('base64')
  tunel = await cf(`/accounts/${CONTA}/cfd_tunnel`, {
    method: 'POST',
    body: JSON.stringify({ name: TUNEL_NOME, tunnel_secret: segredo, config_src: 'cloudflare' }),
  })
  console.log(`túnel   ${TUNEL_NOME} criado (${tunel.id})`)
}

/* ---------- 3. token do conector ---------- */
// Preferimos o token que a própria API entrega: vale mesmo para um túnel que
// já existia, caso em que não temos mais o segredo original.
let tokenConector
try {
  tokenConector = await cf(`/accounts/${CONTA}/cfd_tunnel/${tunel.id}/token`)
} catch {
  if (!segredo) throw new Error('Túnel já existia e a API não devolveu o token; recrie o túnel.')
  tokenConector = Buffer.from(JSON.stringify({ a: CONTA, t: tunel.id, s: segredo })).toString('base64')
}

/* ---------- 4. rota de ingresso ---------- */
// `config_src: cloudflare` significa que o roteamento vive no painel, não no
// arquivo local — o conector baixa esta configuração ao subir.
await cf(`/accounts/${CONTA}/cfd_tunnel/${tunel.id}/configurations`, {
  method: 'PUT',
  body: JSON.stringify({
    config: {
      ingress: [
        // `http://app:3000` é o nome do serviço na rede do compose.
        { hostname: DOMINIO, service: 'http://app:3000' },
        // Regra final obrigatória: tudo que não casar recebe 404.
        { service: 'http_status:404' },
      ],
    },
  }),
})
console.log(`rota    ${DOMINIO} -> http://app:3000`)

/* ---------- 5. DNS ---------- */
const alvo = `${tunel.id}.cfargotunnel.com`
const jaExiste = (await cf(`/zones/${zona}/dns_records?name=${DOMINIO}`))[0]

if (jaExiste) {
  if (jaExiste.content === alvo) {
    console.log(`dns     ${DOMINIO} já aponta para o túnel`)
  } else {
    await cf(`/zones/${zona}/dns_records/${jaExiste.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ type: 'CNAME', name: DOMINIO, content: alvo, proxied: true }),
    })
    console.log(`dns     ${DOMINIO} atualizado (apontava para ${jaExiste.content})`)
  }
} else {
  await cf(`/zones/${zona}/dns_records`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'CNAME',
      name: DOMINIO,
      content: alvo,
      // `proxied` é obrigatório num túnel: sem o proxy da Cloudflare na
      // frente, o CNAME para .cfargotunnel.com não resolve.
      proxied: true,
      comment: 'Site da Coral, servido pelo túnel do compose em infra/',
    }),
  })
  console.log(`dns     ${DOMINIO} criado -> ${alvo}`)
}

/* ---------- 6. token para o compose ---------- */
const destino = path.join(RAIZ, 'infra', '.env.tunnel')
fs.writeFileSync(destino, `# Gerado por infra/cloudflare-setup.mjs. NÃO versionar.\nTUNNEL_TOKEN=${tokenConector}\n`)
console.log(`token   gravado em infra/.env.tunnel`)
console.log(`\nPronto. Suba com:  docker compose -f infra/docker-compose.yml up -d --build`)
