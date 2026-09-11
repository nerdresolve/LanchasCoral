# Infraestrutura

O site roda em três contêineres, publicados em <https://coral.nerdresolve.com>
por um túnel Cloudflare dedicado.

```
Internet → Cloudflare (proxy + TLS) → túnel "coral" → app:3000 → db:5432
```

Nenhuma porta é aberta no firewall: o `cloudflared` faz uma conexão **de
saída** até a borda da Cloudflare. Não é preciso IP fixo.

## Serviços

| Serviço | Imagem | Exposição |
|---|---|---|
| `db` | postgres:16-alpine | `127.0.0.1:5433` (só local, para Prisma Studio e seeds) |
| `app` | build de `apps/frontend` | nenhuma, só a rede interna |
| `tunnel` | cloudflare/cloudflared | nenhuma, conexão de saída |

## Subir

```bash
# 1. Provisiona túnel, rota e DNS (idempotente; pode rodar de novo).
node infra/cloudflare-setup.mjs

# 2. Sobe a pilha.
docker compose -f infra/docker-compose.yml --env-file infra/.env.tunnel up -d --build
```

O `--env-file` é necessário porque o token do conector fica em
`infra/.env.tunnel`, gerado pelo passo 1 e **fora do controle de versão**.

## Operação

```bash
# Estado
docker compose -f infra/docker-compose.yml --env-file infra/.env.tunnel ps

# Logs
docker compose -f infra/docker-compose.yml --env-file infra/.env.tunnel logs -f app
docker logs coral-tunnel --tail 50

# Publicar uma alteração de código
docker compose -f infra/docker-compose.yml --env-file infra/.env.tunnel up -d --build app

# Parar tudo (o volume do banco permanece)
docker compose -f infra/docker-compose.yml --env-file infra/.env.tunnel down
```

## Dois pontos que exigem atenção

**O nome do projeto não é declarado.** O compose o deriva do diretório
(`infra`), e é assim que se chama o volume do banco em uso:
`infra_coral_pgdata`. Declarar `name:` criaria um volume novo e vazio, e o
site subiria sem barcos, anúncios nem artigos.

**O build acessa o banco.** Seis rotas usam `generateStaticParams` para
pré-renderizar modelos, seminovos e artigos. Por isso o estágio de build usa
`network: host` e recebe `DATABASE_URL` como argumento, apontando para a porta
5433 publicada no host. O Postgres precisa estar de pé antes do `--build`.

## Senha do banco

O padrão embutido no compose veio do ambiente de desenvolvimento. Para trocar:

```bash
# Em infra/.env.tunnel, ou exportado no shell:
POSTGRES_PASSWORD=<senha forte>
```

O compose repassa o valor ao Postgres e às duas URLs de conexão. Trocar a
senha de um volume **já existente** não basta: o Postgres só lê
`POSTGRES_PASSWORD` na primeira inicialização. Use `ALTER USER` no banco ou
recrie o volume a partir de um dump.
