# Assets de marca

## logo-coral.png / logo-coral-white.png
Marca oficial da Coral, extraída do bundle do design system.
`white` é para fundos escuros (header sobre o hero, rodapé).

## hero.mp4  (opcional — ainda não incluído)
Vídeo de fundo do hero da home.

O componente `HeroVideo` procura por `/brand/hero.mp4`. **Enquanto o arquivo
não existir, a home usa a fotografia normalmente** — nada quebra.

Para ativar, basta colocar o arquivo aqui com esse nome. Recomendações:

| item      | valor sugerido                          |
|-----------|------------------------------------------|
| duração   | 8–15 s em loop contínuo                  |
| resolução | 1920×1080 (ou 1280×720 para menor peso)  |
| peso      | até ~4 MB — é carregado em toda visita   |
| codec     | H.264 (mp4), `-movflags +faststart`      |
| áudio     | remover (o vídeo toca sempre mudo)       |

Exemplo de conversão:

```
ffmpeg -i original.mov -t 12 -an -vf "scale=1920:-2" \
       -c:v libx264 -crf 26 -preset slow -movflags +faststart \
       public/brand/hero.mp4
```

O componente já trata: autoplay mudo, loop, pausa quando a aba perde foco,
e respeita `prefers-reduced-motion` (quem pede menos animação vê só a foto).
