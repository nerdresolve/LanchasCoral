# Testes

Duas camadas, com propósitos diferentes.

## Rápidos — `npm test`

Testes unitários da lógica pura, em Vitest. Rodam em **cerca de 1 segundo**,
sem banco, sem rede, sem o site no ar.

```sh
npm test              # roda uma vez
npm run test:watch    # reroda ao salvar
npm run test:cobertura
```

O que cobrem:

| Arquivo | Assunto |
|---|---|
| `cripto.test.ts` | Cifragem dos segredos: ida e volta, adulteração, troca de chave |
| `campos.test.ts` | Regras de campo: vírgula decimal, tetos, hosts de imagem, slug |
| `schemas.test.ts` | Formulários completos: obrigatórios, coerência, limites |
| `email.test.ts` | Montagem do e-mail e escape do conteúdo |
| `jsonld.test.ts` | Escape do JSON-LD — impede a volta de um XSS real |
| `retencao.test.ts` | Política de retenção das cópias de segurança |

## Antes de publicar — `npm run verificar`

```sh
npm run verificar     # tipos + lint + testes rápidos
```

Vale rodar antes de todo `build`. Pega erro de tipo, código morto e regressão
de lógica sem esperar o deploy.

## Lentos — `npm run test:e2e`

Exercitam o site **publicado**, com navegador de verdade. Levam ~15 minutos e
cobrem o que só se prova contra o sistema no ar: revalidação de cache, sessão,
envio de e-mail, ataques.

```sh
npm run test:e2e      # todos os conjuntos
npx tsx audit/_pentest.mjs   # um conjunto só
```

Estão em `audit/`, com nomes começando em `_`. O `verificar-painel.mjs` roda
todos e resume o resultado.

## Por que dois níveis

Os rápidos respondem "a lógica está certa?" e cabem no ciclo de edição. Os
lentos respondem "o sistema funciona de verdade?" e valem antes de entregar.

Um teste rápido que precise de banco ou rede está no lugar errado — ou vira
lento, ou a lógica precisa ser separada do efeito colateral (foi o que se fez
com `decidirRetencao`, extraída de `infra/backup.mjs`).

## Um teste precisa poder falhar

Ao escrever um teste para um defeito corrigido, vale reintroduzir o defeito e
confirmar que ele falha. Os de `jsonld.test.ts` foram validados assim: com o
escape quebrado, 7 dos 10 falham.
