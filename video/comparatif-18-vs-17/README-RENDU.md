# Comparatif iPhone 18 Pro Max vs 17 Pro Max · Apple Store Kolwezi

Vidéo motion design « UI » de 66 s (Remotion), 9:16 et 16:9, 60 i/s. Storyboard validé : /mnt/project-files/videos/comparatif-18-vs-17/storyboard.md.
Voix Théo (ElevenLabs, prise 2), musique « Sunny Patterns » et bruitages Epidemic Sound (audio/SOURCES.md).

## Rendu
```bash
npm install
python3 mix.py public/mix.wav audio/pistes   # voix + musique + bruitages, -14 LUFS, et pistes séparées (demande audio/epidemic/)
npx remotion render src/index.jsx ComparatifVertical out/comparatif-9x16-4k.mp4 --scale=2 --crf=18
npx remotion render src/index.jsx Comparatif out/comparatif-16x9-4k.mp4 --scale=2 --crf=18
```
`public/mix.wav` est déjà versionné : le rendu vidéo n'a pas besoin des fichiers Epidemic.
Sur Mac, retirer `Config.setBrowserExecutable` de remotion.config.js (chemin propre au cloud).

## Synchro
Les instants viennent de la transcription de la voix (`w(x)` = instant de la voix + 0,5 s), dans src/Video.jsx et dans `EV` de mix.py.

## Visuels
Photos officielles Apple : public/p18.png (18 Pro Max bordeaux), public/p17.png (17 Pro Max orange cosmique, détouré), public/ap-*.jpg (exemples d'ouverture de la page iPhone 18 Pro).
Puces A19 Pro / A20 Pro et chambre à vapeur dessinées en code (l'image Apple de la puce n'existe qu'en 296 px). Aucun prix affiché.
Logo, WhatsApp et adresse de la boutique : à ajouter dans la scène 9 quand ils sont fournis.
