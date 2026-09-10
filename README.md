<div align="center">

# Coral

**Site institucional e painel de um estaleiro brasileiro.** Catálogo de 18
modelos, comparador lado a lado, seminovos e um painel onde o cliente edita
tudo sozinho — sem tocar em código.

[![Licença](https://img.shields.io/badge/licença-BSL%201.1%20→%20Apache%202.0-0E4C6B)](LICENSE.md)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-0E4C6B)](https://nextjs.org)
[![Testes](https://img.shields.io/badge/testes-172%20unitários%20%2B%20246%20e2e-0E4C6B)](#qualidade)
[![Acessibilidade](https://img.shields.io/badge/Lighthouse%20a11y-100-0E4C6B)](#qualidade)

**[Ver no ar →](https://coral.nerdresolve.com)**

<img src="docs/capturas/home.webp" alt="Home: lancha em navegação, com os números do estaleiro sobre a foto" width="100%">

</div>

---

## Índice

- [O que é](#o-que-é)
- [Subir em 5 minutos](#subir-em-5-minutos)
- [Comparador](#comparador)
- [O painel](#o-painel)
- [Arquitetura](#arquitetura)
- [Desempenho](#desempenho)
- [Qualidade](#qualidade)
- [Segurança](#segurança)
- [Referência de comandos](#referência-de-comandos)
- [Licença](#licença)

---

## O que é

A **Coral Indústria Naval** fabrica lanchas de 16 a 50 pés desde 1990, em
Duque de Caxias. O site antigo era WordPress: cada ficha de modelo tinha o
memorial descritivo colado à mão, e mudar um telefone significava abrir sete
páginas.

Este é o substituto. O conteúdo real — **18 modelos, 14 seminovos, 836 fotos e
365 itens de equipamento** — foi migrado para um banco, e o cliente passou a
editar tudo por um painel. Trocar um ponto de contato agora é um campo, e ele
muda em todas as páginas de uma vez.

Está em produção em **[coral.nerdresolve.com](https://coral.nerdresolve.com)**.

<img src="docs/capturas/modelos.webp" alt="Catálogo: cartões dos modelos agrupados por família de casco" width="100%">

---

## Subir em 5 minutos

Precisa de **Node 22+** e **Docker**.

```bash
git clone https://github.com/mariathdev/coral.git
cd coral
cp .env.example .env      # e defina POSTGRES_PASSWORD
docker compose -f infra/docker-compose.yml up -d --build
```

O site sobe em `http://localhost:3000` e o banco em `127.0.0.1:5433`.

Para desenvolver com recarga automática:

```bash
cd apps/frontend
npm install
npx prisma migrate deploy
npm run dev
```

> **O conteúdo não vem junto.** As fotos, os memoriais em PDF e os textos
> pertencem à Coral e não estão no repositório. Subindo do zero você tem a
> estrutura funcionando com o banco vazio — crie um modelo pelo painel para
> ver o fluxo completo.

---

## Comparador

Duas versões do mesmo casco diferem em cinco linhas de dezoito. Achar quais
exigia abrir duas abas e alternar entre elas.

<img src="docs/capturas/comparador.webp" alt="Comparação entre Coral 36 Aberta e Cabinada, com fotos, descrições e dimensões lado a lado" width="100%">

O ícone de velocímetro em cada cartão abre a lista das outras lanchas; escolher
uma abre a comparação **por cima da página**, sem navegar. Dali dá para trocar
qualquer um dos dois lados, ver outras fotos e pedir proposta — tudo sem
fechar.

O **rótulo fica no meio**, entre os dois valores. Numa grade de duas colunas
com o rótulo em cima, num monitor largo os números ficavam a mais de mil
pixels um do outro e o olho perdia a associação — que é justamente o que a
comparação precisa oferecer.

As barras dão a leitura antes do número: "7,93" e "8,83" são parecidos como
texto, mas visivelmente diferentes como comprimento. **Nunca há cor de
vencedor**: entre duas lanchas, maior não é melhor — quem procura barco para
marina pequena quer o menor.

Cada par tem endereço próprio (`/comparar?a=…&b=…`), então a comparação pode
ser guardada nos favoritos ou mandada para quem decide junto.

---

## O painel

Dez telas em `/admin`, atrás de sessão. O cliente cria e edita modelos e
anúncios de seminovos, reordena a galeria, escreve o SEO de cada página,
mantém os pontos de contato e dispara os memoriais por e-mail.

Três decisões que moldaram o resto:

**Contato em um lugar só.** Telefone e e-mail se repetiam em rodapé, páginas
de contato e formulários. Agora vivem numa tabela, e mudar um ponto focal
atualiza todas as ocorrências daquela finalidade.

**Envio de memorial é manual, por clique.** O disparo automático mandaria PDF
para qualquer um que preenchesse o formulário, concorrente incluído. O painel
lista as solicitações e o operador decide uma a uma. Há trava contra envio
duplicado: a reserva acontece no banco, dentro da transação, então dois
cliques rápidos não viram dois e-mails.

**Excluir exige digitar o nome.** Um modelo carrega dezenas de fotos e
equipamentos; um clique errado apagaria tudo.

---

## Arquitetura

```
apps/frontend/          Next.js 16 (App Router) + React 19
  src/app/(pt)/         rotas em português
  src/app/(en)/         rotas em inglês — root layout próprio
  src/app/(pt)/admin/   painel, atrás de sessão
  src/components/       44 componentes
  src/lib/              regras puras: comparação, validação, e-mail, cripto
  prisma/               16 tabelas, 8 migrações
  test/                 172 testes de unidade (Vitest)
  audit/                12 suítes ponta a ponta (Playwright)
infra/                  Docker Compose, backup, vídeos do Drive
docs/                   capturas
```

**Dois idiomas, dois root layouts.** `(pt)` e `(en)` são route groups
separados, cada um com seu `<html lang>`. Não é um seletor que troca strings:
são árvores independentes, e o Google indexa as duas.

**Postgres com driver adapter.** Prisma 7 com `PrismaPg`, conexão direta.
Escrita concorrente na galeria usa `pg_advisory_xact_lock` — três salvamentos
rápidos chegaram a duplicar 57 fotos em 114 antes disso existir.

**Tailwind v4 com tokens.** Cores, espaçamentos e curvas de animação são
variáveis CSS em `@theme`; nada de valor mágico espalhado por componente.

---

## Desempenho

O hero de cada modelo pode ter **vídeo de fundo**, e ele foi o teste mais duro
da arquitetura: o hero é o elemento que o Lighthouse mede como LCP, e um vídeo
pesado ali destrói a nota.

A solução foi o vídeo **nunca ser o LCP**. A foto carrega com `priority` e
pinta primeiro; o vídeo tem `preload="none"`, só começa a ser buscado depois
do `load` da página e aparece com transição quando tem quadro para mostrar.
Medido: **100 de desempenho com vídeo ativo, LCP de 0,6s** — contra 0,7s na
mesma página sem vídeo.

O vídeo também **não é baixado** para quem pediu `prefers-reduced-motion`,
está em economia de dados ou em rede 2G. Vídeo em laço no fundo causa
desconforto vestibular real, e alguns megabytes de enfeite não se justificam
numa conexão limitada.

| Métrica (desktop) | Resultado |
|---|---|
| Acessibilidade | **100** em todas as 17 páginas |
| Boas práticas | **100** em todas as 17 páginas |
| SEO | **100** em todas as 17 páginas |
| Desempenho | 88–100, conforme a latência do host de fotos |

> As fotos ainda são servidas pelo WordPress antigo
> (`lanchascoral.com.br`), que responde em 0,28s isolado e **3,74s sob
> concorrência**. É de onde vem toda a variação de desempenho — medidas
> isoladas dão 96–100. Hospedar as imagens junto com o site resolve, e é o
> próximo passo.

---

## Qualidade

<img src="docs/capturas/celular.webp" alt="Comparação no celular: botões alinhados e valores lado a lado" width="380">

**172 testes de unidade** (Vitest, ~2s) cobrem o que é regra pura: a lógica da
comparação, os validadores de campo, a criptografia dos segredos, a montagem
do e-mail, o escape do JSON-LD e a retenção do backup.

**246 casos ponta a ponta** (Playwright, contra o site real) cobrem o que só
aparece no navegador:

| Suíte | O que pega |
|---|---|
| `_teste-criacao` | criar modelo e anúncio do zero, com todos os campos |
| `_teste-persistencia` | o que foi salvo continua salvo depois de recarregar |
| `_teste-exclusao` | confirmação por nome digitado, e cancelar não apaga |
| `_teste-painel` | galeria, contatos, memorial e envio |
| `_teste-email-config` | SMTP, domínios negados, senha que não volta para o HTML |
| `_pentest` | XSS, injeção, IDOR, vazamento de dados |
| `_pentest3` | duplo-clique, rajada de requisições, campo sem teto |
| `_teste-comparador` | 79 casos: fluxo, posicionamento e alinhamento |
| `_varredura` | 20 rotas × 3 larguras de celular |

A varredura mede transbordo, rolagem lateral, alvo de toque abaixo de 44px e
texto cortado em 390, 360 e 320px. Foi o que pegou os ícones sociais de 36px
e os botões da home saindo cortados no iPhone SE.

---

## Segurança

O painel guarda credenciais de SMTP e dados de quem pediu memorial, então
levou tratamento próprio:

- **Senha com bcrypt** e hash-chamariz quando o usuário não existe — o tempo
  de resposta é o mesmo, então não dá para descobrir e-mails válidos por
  cronometragem.
- **Segredos com AES-256-GCM**, chave fora do banco. A senha do SMTP nunca
  volta para o HTML depois de salva.
- **Escrita serializada** por advisory lock, contra corrida.
- **Tetos de tamanho** calibrados pelo conteúdo real, não por chute.
- **Domínios bloqueáveis** no envio, para o memorial não ir para concorrente.

Uma vulnerabilidade real foi encontrada e corrigida no caminho: o escape do
JSON-LD usava `.replace(/</g, '<')` — que em JavaScript **é** o caractere
`<`, ou seja, um no-op. Um pentest automatizado provou a execução de script
injetado. A correção (`'\\u003c'`) foi validada reintroduzindo o bug: 7 de 10
testes falharam, como deveriam.

---

## Referência de comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm test` | 172 testes de unidade (~2s) |
| `npm run verificar` | typecheck, lint e testes de unidade |
| `npm run test:e2e` | bateria completa de 246 casos contra o site |
| `node audit/lh.mjs <url>` | Lighthouse em todas as páginas |
| `node audit/_varredura.mjs` | layout de celular, 20 rotas × 3 larguras |
| `node infra/backup.mjs` | cópia do banco, com verificação |
| `node infra/backup.mjs --listar` | cópias existentes |
| `node infra/videos-do-drive.mjs` | traz e comprime vídeos do Drive |

---

## Licença

**BSL 1.1**, virando **Apache 2.0** em quatro anos. Você pode ler, modificar,
e usar como base de sites próprios ou de clientes. O que não pode é vender
este código como produto ou SaaS concorrente. Detalhes em
**[LICENSE.md](LICENSE.md)**.

O **conteúdo não é coberto**: fotos, memoriais, textos e a marca pertencem à
Coral Indústria Naval.

---

<div align="center">

Feito por **[Matheus Mariath](https://github.com/mariathdev)** · NerdResolve

**[contato@mariath.dev](mailto:contato@mariath.dev)**

</div>
