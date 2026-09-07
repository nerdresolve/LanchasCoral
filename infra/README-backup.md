# Cópia de segurança do banco

O banco guarda tudo que o painel edita: modelos, seminovos, fotos, artigos e os
contatos enviados pelos clientes. As imagens em si ficam em servidores externos
(ver `HOSTS_DE_IMAGEM`), então o que precisa de cópia é o Postgres.

## Rotina

```sh
node infra/backup.mjs              # cria uma cópia
node infra/backup.mjs --listar     # mostra o que existe
node infra/backup.mjs --verificar  # confere a última
```

Cada execução gera `infra/backups/coral_AAAA-MM-DD_HHMM.dump`, no formato
custom do Postgres (comprimido, permite restaurar tabelas isoladas).

O script **confere a cópia nova antes de apagar as antigas**. Se o arquivo sair
ilegível, ele para, mantém tudo e avisa — nunca troca um backup bom por um ruim.

**Retenção:** as diárias ficam 14 dias; a primeira cópia de cada mês fica para
sempre. Depois de 5 meses isso dá cerca de 21 arquivos, somando poucos MB.

## Agendar (uma vez só)

Como Administrador:

```powershell
powershell -ExecutionPolicy Bypass -File infra\agendar-backup.ps1
```

Cria uma tarefa diária às 03:30. Outro horário: `-Hora '01:00'`.
Para remover: `-Remover`.

Conferir depois:

```powershell
Get-ScheduledTaskInfo -TaskName 'Coral - backup do banco'
```

`LastTaskResult` igual a 0 quer dizer que a última execução deu certo.

## Restaurar

> Restaurar SUBSTITUI o conteúdo atual. Antes de começar, faça uma cópia do
> estado presente — mesmo que ele pareça estragado, pode conter algo que a
> cópia antiga não tem.

```sh
node infra/backup.mjs
```

### Voltar o banco inteiro

```sh
# 1. Derrube a aplicação para ninguém escrever durante a restauração.
docker compose -f infra/docker-compose.yml stop app

# 2. Leve o arquivo para dentro do contêiner.
docker cp infra/backups/coral_2026-08-27_0330.dump coral-db:/tmp/r.dump

# 3. Restaure. `--clean` apaga os objetos antes de recriar.
docker exec -e PGPASSWORD=<senha> coral-db \
  pg_restore -U coral -d coral --clean --if-exists /tmp/r.dump

# 4. Confira antes de voltar ao ar.
docker exec -e PGPASSWORD=<senha> coral-db \
  psql -U coral -d coral -c 'SELECT count(*) FROM "Boat";'

# 5. Suba de novo.
docker compose -f infra/docker-compose.yml start app
docker exec coral-db rm -f /tmp/r.dump
```

No Git Bash, prefixe os `docker exec` que citam caminhos internos com
`MSYS_NO_PATHCONV=1` — sem isso o shell converte `/tmp/r.dump` num caminho
Windows e o comando falha dizendo que não achou o arquivo.

A senha é a `POSTGRES_PASSWORD` do `.env` da raiz (o padrão do compose, se não estiver
definida).

### Recuperar só uma tabela

Se apagaram os contatos por engano mas o resto está bom:

```sh
docker exec -e PGPASSWORD=<senha> coral-db \
  pg_restore -U coral -d coral --data-only -t Inquiry /tmp/r.dump
```

### Conferir sem arriscar o banco de produção

Restaure num banco descartável e olhe lá:

```sh
docker exec -e PGPASSWORD=<senha> coral-db psql -U coral -d postgres \
  -c 'CREATE DATABASE coral_conferencia;'
docker exec -e PGPASSWORD=<senha> coral-db \
  pg_restore -U coral -d coral_conferencia /tmp/r.dump
docker exec -e PGPASSWORD=<senha> coral-db psql -U coral -d coral_conferencia \
  -c 'SELECT count(*) FROM "Boat";'
docker exec -e PGPASSWORD=<senha> coral-db psql -U coral -d postgres \
  -c 'DROP DATABASE coral_conferencia;'
```

Este procedimento foi executado e confirmado em 27/08/2026: uma cópia restaurada
num banco vazio devolveu 18 modelos, 14 anúncios, 836 fotos, 13 contatos e o
usuário do painel.

## A chave de criptografia

A senha do servidor de e-mail fica **cifrada** na tabela `MailSettings`, e a
chave que a abre (`CORAL_SECRET_KEY`) vive só no `.env` da raiz — nunca no
banco. É o que impede que um dump vazado entregue a caixa de e-mail da empresa.

A consequência prática: **restaurar um backup numa máquina sem essa chave
devolve o site inteiro, mas com o envio de e-mail mudo.** A senha precisaria
ser digitada de novo no painel (`/admin/email`).

Guarde uma cópia da chave fora desta máquina, junto dos outros segredos.
Trocá-la invalida o que já foi cifrado.

## O que a cópia NÃO cobre

- **As fotos.** Ficam em `lanchascoral.com.br`, `broker.lanchascoral.com.br` e
  `mariath.dev`. Se algum desses hosts sair do ar, o banco continua íntegro mas
  as imagens somem do site.
- **Os PDFs dos memoriais**, servidos de `public/memoriais/` — versionados junto
  do código.
- **Os arquivos de segredo** (`.env`, `infra/.env.tunnel`). Guarde-os à parte,
  fora deste diretório.

## Levar as cópias para fora da máquina

`infra/backups/` está no mesmo disco que o banco: um defeito de hardware leva os
dois. Vale copiar a pasta periodicamente para outro lugar (nuvem, disco externo,
outro servidor). Os arquivos são pequenos — poucos MB no total.
