# syntax=docker/dockerfile:1

# Imagem de produção do site da Coral.
#
# Três estágios para que a imagem final não carregue nem o código-fonte nem as
# dependências de build: só o bundle `standalone` do Next e o runtime do Node.
#
# `alpine` pede libc6-compat porque as engines nativas do Prisma são compiladas
# contra glibc.

# ---------- 1. dependências ----------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Só os manifestos: assim a camada de `npm ci` só é refeita quando as
# dependências mudam, não a cada alteração de código.
COPY package.json package-lock.json ./
RUN npm ci

# ---------- 2. build ----------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# O build CONSULTA o banco: seis rotas usam `generateStaticParams` para
# pré-renderizar modelos, seminovos e artigos. Por isso a conexão real entra
# como argumento — o compose a passa apontando para o Postgres da pilha.
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# `robots.txt` e `sitemap.xml` são gerados no BUILD: sem esta variável aqui,
# eles saem apontando para o domínio padrão do código, não para o que a
# aplicação realmente serve.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

ENV NEXT_TELEMETRY_DISABLED=1

# Gera o client do Prisma; sem isto o build falha ao importar `@prisma/client`.
RUN npx prisma generate

RUN npm run build

# ---------- 3. execução ----------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# `server.js` escuta em localhost por padrão, o que dentro do contêiner o
# tornaria inalcançável pelos outros serviços da rede.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Usuário sem privilégios: se a aplicação for comprometida, o atacante não
# ganha root dentro do contêiner.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# O `standalone` não inclui `public` nem `.next/static` — a documentação do
# Next é explícita quanto a copiá-los à mão.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# O schema acompanha a imagem para permitir `prisma migrate deploy` ou uma
# inspeção pontual sem reconstruir nada.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
