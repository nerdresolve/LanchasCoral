#!/usr/bin/env bash
# Cria a regra contact@nerdresolve.com -> Gmail assim que o endereco de
# destino estiver verificado. Rode depois de clicar no link que a Cloudflare
# mandou para <caixa em EMAIL_DESTINO>.
set -euo pipefail

Z=<id em CLOUDFLARE_ZONA>
A=<id em CLOUDFLARE_ID>
T="${CLOUDFLARE_API:?defina CLOUDFLARE_API (veja coral/.env)}"
DEST=<caixa em EMAIL_DESTINO>

status=$(curl -s "https://api.cloudflare.com/client/v4/accounts/$A/email/routing/addresses" \
  -H "Authorization: Bearer $T" \
  | python -c "import json,sys;print(next((r['status'] for r in json.load(sys.stdin)['result'] if r['email']=='$DEST'),'missing'))")

if [ "$status" != "verified" ]; then
  echo "Destino ainda '$status'. Clique no link de verificacao no Gmail e rode de novo."
  exit 1
fi

curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$Z/email/routing/rules" \
  -H "Authorization: Bearer $T" -H "Content-Type: application/json" \
  -d "{\"name\":\"contact -> gmail\",\"enabled\":true,\"priority\":10,
       \"matchers\":[{\"type\":\"literal\",\"field\":\"to\",\"value\":\"contact@nerdresolve.com\"}],
       \"actions\":[{\"type\":\"forward\",\"value\":[\"$DEST\"]}]}" \
  | python -c "import json,sys;d=json.load(sys.stdin);print('Regra criada: contact@nerdresolve.com ->','$DEST') if d.get('success') else print('ERRO:',d.get('errors'))"
