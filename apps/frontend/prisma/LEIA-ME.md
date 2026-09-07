# Estado das migrações

## O histórico está defasado em relação ao banco

O banco de produção tem mudanças que **não** estão nos arquivos de
`prisma/migrations/`, porque foram aplicadas com `prisma db push` ou por SQL
direto. Hoje isso inclui:

- a tabela `Article` (blog), com seus índices;
- a coluna `Boat.manualUrl` (memorial descritivo);
- o `DEFAULT` da coluna `User.role`, mudado de `ADMIN` para `VIEWER`.

## Por que isso importa

`prisma migrate dev` detecta essa diferença como *drift* e **propõe resetar o
banco**, o que apagaria os modelos, os anúncios, as fotos e os contatos dos
clientes. Não aceite essa oferta.

O deploy atual (`infra/docker-compose.yml`) não roda `migrate deploy`, então
nada disso quebra o site. O risco aparece no dia em que alguém introduzir esse
passo no deploy, ou rodar `migrate dev` para criar uma migração nova.

## Como aplicar uma mudança de schema com segurança

Enquanto o histórico não for reconciliado:

1. Edite `schema.prisma`.
2. Gere o SQL sem aplicar:
   `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script`
3. Confira o SQL à mão e rode-o no banco.
4. Rode `npx prisma generate` para atualizar o client.

Antes de qualquer alteração estrutural, faça a cópia de segurança:

```sh
docker exec -e PGPASSWORD=<senha> coral-db pg_dump -U coral coral > backup.sql
```

## Como reconciliar de vez

Com o banco parado para escrita e um dump em mãos: gere uma migração que
represente o estado atual (`migrate diff` entre a última migração e o banco),
coloque-a em `prisma/migrations/<data>_reconciliacao/migration.sql`, e marque-a
como já aplicada com `prisma migrate resolve --applied <nome>`. A partir daí
`migrate dev` volta a funcionar normalmente.
