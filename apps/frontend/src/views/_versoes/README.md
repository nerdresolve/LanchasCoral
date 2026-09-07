# Versões guardadas

Variantes anteriores de páginas, mantidas para permitir regressão rápida.
**Não são importadas por nenhuma rota** — ficam aqui só como referência.

| Arquivo | O que é |
|---|---|
| `sobre-v1-coluna-sticky.tsx` | Institucional com coluna lateral `sticky`: título, linha do tempo de 4 marcos e uma foto, ao lado do texto corrido. Substituída pela versão em linha do tempo cronológica com fotos. |

## Como regredir

```bash
cp src/views/_versoes/sobre-v1-coluna-sticky.tsx src/views/sobre.tsx
npx tsc --noEmit
docker compose -f ../../infra/docker-compose.yml --env-file ../../infra/.env.tunnel up -d --build app
```
