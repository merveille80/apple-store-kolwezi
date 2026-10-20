# Présentation iPhone 18 Pro Max · rendu

Remotion 4, 60 i/s, 35,5 s. Compositions : `Presentation` (1920×1080) et `PresentationVertical` (1080×1920), rendues en 4K avec `--scale=2`.

```bash
npm install
npx remotion render src/index.jsx Presentation out/presentation-iphone18-16x9-4k.mp4 --scale=2 --crf=18
npx remotion render src/index.jsx PresentationVertical out/presentation-iphone18-9x16-4k.mp4 --scale=2 --crf=18
```

- Photos : dos des 4 coloris détourés depuis les visuels 5120 px de la page d'achat Apple (`public/*-dos.png`).
- Son : `public/mix.wav` (voix Hugo, musique et bruitages, -14 LUFS) produit par `mix.py`, sources dans `audio/SOURCES.md`.
- Scènes et repères calés sur la voix : constantes `S` et `T` de `src/Video.jsx`, placement des phrases dans `SEG` de `mix.py`.
- Sur un Mac, cloner hors du Bureau synchronisé iCloud avant de rendre.
