# Présentation iPhone 18 Pro Max sans voix · rendu

Remotion 4, 60 i/s, 26 s, 9 scènes calées sur la musique (118 BPM, `B(n)` = n temps). Compositions : `SansVoixVertical` (1080×1920) et `SansVoix` (1920×1080), rendues en 4K avec `--scale=2`.

```bash
npm install
python3 mix.py public/mix.wav audio/pistes   # sons Epidemic dans audio/epidemic/ (voir audio/SOURCES.md)
npx remotion render src/index.jsx SansVoixVertical out/presentation-sans-voix-9x16-4k.mp4 --scale=2 --crf=18
npx remotion render src/index.jsx SansVoix out/presentation-sans-voix-16x9-4k.mp4 --scale=2 --crf=18
```

- Photos : dos des 4 coloris détourés depuis les visuels 5120 px de la page d'achat Apple (`public/*-dos.png`).
- After Effects : `after-effects/Construire-9x16.jsx` et `Construire-16x9.jsx` produisent un .aep par format (voir `after-effects/LISEZMOI.txt`).
- Sur un Mac, cloner hors du Bureau synchronisé iCloud avant de rendre.
