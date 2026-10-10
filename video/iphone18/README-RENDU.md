# Pub iPhone 18 Pro Max · Apple Store Kolwezi

Vidéo motion design de 42,5 s (Remotion), 16:9 et 9:16, voix Théo (ElevenLabs, prise 2), musique composée en code.

## Rendu
```bash
npm install
python3 music.py audio/musique.wav          # musique 120 BPM (drop sur « Voici » à 16,12 s)
python3 mix.py audio/musique.wav public/mix.wav   # voix + bruitages + musique, -14 LUFS
npx remotion render src/index.jsx IPhone18 out/iphone18-16x9-4k.mp4 --scale=2 --crf=18
npx remotion render src/index.jsx IPhone18Vertical out/iphone18-9x16-4k.mp4 --scale=2 --crf=18
```
Sur Mac, retirer `Config.setBrowserExecutable` de remotion.config.js (chemin propre au cloud).

## Synchro
Tous les instants sont dans `T` (src/Video.jsx) et `EV` (mix.py), en secondes vidéo ; la voix est décalée de 0,35 s.
Prix, numéro WhatsApp, adresse et logo ne sont pas encore fournis : à ajouter dans la scène 9 (aucune réécriture de la voix nécessaire).
