# Vídeos do hero

Cada modelo pode ter um vídeo de fundo no topo da sua página. Os arquivos
vêm de uma pasta do Google Drive, são comprimidos e servidos pelo próprio
site.

## Configurar o acesso ao Drive (uma vez só)

```
rclone config
```

Responda: `n` (novo) → nome **`drive`** → tipo **`drive`** → client_id e
client_secret **em branco** → escopo **`2`** (somente leitura basta) →
root_folder_id e service_account em branco → `n` (avançado) → `y` (autorizar
no navegador) → `n` (shared drive) → `y` (confirmar).

O navegador abre para você entrar na conta Google e autorizar. A credencial
fica em `%APPDATA%\rclone\rclone.conf` e não é versionada.

Se o seu remote tiver outro nome, defina `CORAL_DRIVE_REMOTE`.

## Trazer os vídeos

```
node infra/videos-do-drive.mjs --so-listar --pasta "Coral/Videos"
node infra/videos-do-drive.mjs --pasta "Coral/Videos"
```

O primeiro comando só mostra o que há na pasta, com os tamanhos. O segundo
baixa, comprime e deixa tudo em `apps/frontend/public/videos/`, imprimindo no
fim o caminho de cada arquivo.

A compressão mira **2 a 4 MB por vídeo**: 1280px de largura, 10 segundos, sem
áudio. Vídeo de câmera chega com 50 a 200 MB, e no hero isso é desperdício: o
elemento tem cerca de 720px de altura, toca em laço mudo e ninguém assiste. É
textura de fundo.

## Associar cada vídeo à sua lancha

Pelo painel, em cada modelo, campo **"Vídeo do hero"**. Use o caminho que o
script imprimiu, por exemplo `/videos/coral-40.mp4`.

O casamento é manual de propósito: qual vídeo pertence a qual modelo é
decisão de quem conhece o acervo, não de um script adivinhando por nome de
arquivo.

## Por que o vídeo não derruba o Lighthouse

O hero é o elemento que o Lighthouse mede como LCP, e um vídeo pesado ali
destrói a nota. Por isso:

- a **imagem continua carregando com `priority`** e é ela que pinta primeiro;
- o vídeo tem `preload="none"` e só começa a ser buscado **depois do `load`**
  da página, para não disputar banda com a foto;
- ele aparece com transição só quando tem quadro para mostrar (`canplay`).

Além disso, o vídeo **não é buscado** para quem pediu menos movimento
(`prefers-reduced-motion`), está em modo de economia de dados (`saveData`) ou
em rede 2G. Vídeo em laço no fundo provoca desconforto real em quem tem
sensibilidade vestibular, e alguns megabytes de enfeite não se justificam
numa conexão limitada.

## Os arquivos não estão no Git

`public/videos/` está no `.gitignore`: binários de alguns MB por modelo
inchariam o repositório para sempre. Eles entram na imagem Docker no momento
do build (`COPY . .`), então o deploy os leva normalmente.

A consequência: **quem clonar o projeto em outra máquina não terá os
vídeos** e precisa rodar o script acima antes de construir a imagem. Sem
eles, o hero simplesmente usa a foto, sem quebrar nada.

Os arquivos brutos baixados ficam em `infra/_videos-brutos/`, também fora do
Git. Pode apagar depois de conferir o resultado.
