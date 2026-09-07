# Segredos: o que guardar fora desta máquina

Um backup do banco **não** restaura o sistema por completo sozinho. Estas
chaves vivem só no `.env` da raiz e em `infra/.env.tunnel`, que não entram nas
cópias e não vão para o Git.

Copie os valores do seu `.env` para um gerenciador de senhas ou cofre. Este
arquivo é só o roteiro — de propósito, ele não contém nenhum valor.

## 1. `CORAL_SECRET_KEY` — a mais importante

Cifra a senha do servidor de e-mail guardada na tabela `MailSettings`.

**Sem ela:** o backup restaura o site inteiro, mas o envio de e-mail fica mudo
e a senha precisa ser digitada de novo em `/admin/email`. Nada mais se perde.

**Trocá-la** invalida o que já foi cifrado — a senha do e-mail teria de ser
redigitada.

Para gerar uma nova, se um dia for preciso:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

## 2. `POSTGRES_PASSWORD`

Senha do banco. Sem ela não dá para restaurar um dump nem abrir o `psql`.

> **Pendência conhecida:** hoje a variável NÃO está no `.env`, então vale o
> padrão embutido no compose. O banco só escuta em 127.0.0.1, então não
> está exposto à rede — mas convém definir uma senha própria antes de entregar
> ao cliente. Para trocar: `ALTER USER coral WITH PASSWORD '...'` no Postgres,
> e depois atualizar o `.env`.

## 3. Credenciais do servidor de e-mail

`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` no `.env`.

> **Pendência conhecida:** hoje são as credenciais emprestadas do projeto
> HClean, e o remetente aparece como a caixa deles. Trocar por uma caixa da
> Coral antes de entregar ao cliente final.

## 4. Acesso ao painel

`https://coral.nerdresolve.com/admin/login` — usuário `admin@lanchascoral.com.br`.

> **Pendência conhecida:** a senha é a padrão desde 22/08/2026 e já circulou em
> texto plano. Trocar com:
>
> ```sh
> cd apps/frontend
> npx tsx prisma/trocar-senha.ts admin@lanchascoral.com.br <senha-nova>
> ```
>
> O comando exige no mínimo 12 caracteres e encerra as sessões abertas.

## 5. Túnel Cloudflare

O token do conector está em `infra/.env.tunnel`. Sem ele o site não fica
acessível pelo domínio, mesmo com tudo mais no ar. Guarde junto.

## Conferir o que está definido

Sem revelar os valores:

```sh
grep -oE "^[A-Z_]+=" .env | tr -d '='
```
