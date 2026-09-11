# E-mail do dominio nerdresolve.com

## Por que nao usamos o mailcow

O mailcow em Docker foi descartado nesta maquina por tres motivos medidos
em 07/09/2026, nao por preferencia:

- A porta 25 de entrada esta fechada vinda da internet (assim como 443 e 993).
  Nenhum servidor de fora consegue entregar mensagem aqui.
- O IP e residencial e dinamico (177.192.20.111, b1c0146f.virtua.com.br).
  Gmail e Outlook recusam mensagem vinda dessas faixas.
- Nao da para criar PTR para mail.nerdresolve.com: so a Claro pode, e nao faz
  isso em linha residencial.

O Cloudflare Tunnel resolve isso para os outros subdominios, mas so carrega
HTTP/HTTPS. SMTP e IMAP nao passam por CNAME proxied.

Se um dia o mailcow for necessario de verdade, ele precisa de VPS com porta 25
liberada e PTR proprio (Hetzner resolve por ~4 EUR/mes).

## O que existe hoje

Recebimento pelo Cloudflare Email Routing, de graca, sem servidor:

    contact@nerdresolve.com  ->  <caixa definida em EMAIL_DESTINO>

Registros criados na zona (id em CLOUDFLARE_ZONA):

| Tipo | Nome                    | Conteudo                                  |
|------|-------------------------|-------------------------------------------|
| MX   | nerdresolve.com         | route1/2/3.mx.cloudflare.net              |
| TXT  | nerdresolve.com         | v=spf1 include:_spf.mx.cloudflare.net ~all|
| TXT  | cf2024-1._domainkey     | DKIM, gerado pela Cloudflare              |
| TXT  | _dmarc                  | v=DMARC1; p=none; rua=mailto:contact@...  |

O DMARC esta em `p=none` de proposito: so observa e manda relatorio, nao
rejeita nada. Depois de umas semanas sem surpresa nos relatorios, da para
subir para `p=quarantine`.

Nao foi criado registro A/CNAME para mail.nerdresolve.com. Ele nao serve para
nada neste desenho: quem recebe a mensagem sao os MX da Cloudflare, e nao ha
webmail proprio para apontar.

## Passo que falta (so voce pode fazer)

A Cloudflare manda um e-mail de verificacao para a caixa de destino.
Enquanto o link nao for clicado, a regra de encaminhamento nao pode ser criada
(a API recusa com o codigo 2054).

Depois de clicar:

    CLOUDFLARE_API=<token do coral/.env> ./infra/finish-email-routing.sh

O script confere se o destino ja esta verificado e cria a regra.

## Enviar como contact@nerdresolve.com

O Email Routing so recebe, nao envia. Duas opcoes:

1. Gmail "Enviar e-mail como" (SMTP da Cloudflare nao existe, entao precisa de
   um relay de qualquer forma).
2. Relay proprio: Resend, Brevo ou Mailgun tem faixa gratuita suficiente.
   Ao configurar, o relay vai pedir para incluir o dominio dele no SPF. O SPF
   atual so autoriza a Cloudflare, entao vira algo como:

       v=spf1 include:_spf.mx.cloudflare.net include:<relay> ~all

   E o relay tambem publica um DKIM proprio, em outro seletor. O
   cf2024-1._domainkey continua onde esta, sem conflito.

O projeto Coral hoje envia por credencial emprestada da HClean
(SMTP_USER=contato@hcleanoil.com.br, veja .env). Quando o relay estiver de pe,
essa credencial deve sair de circulacao.
