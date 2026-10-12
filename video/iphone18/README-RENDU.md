# Pub iPhone 18 Pro Max · Apple Store Kolwezi

Vidéo motion design de 48,5 s (Remotion), 16:9 et 9:16, voix Théo (ElevenLabs, v2 prise 1), musique : le son de merveille (audio/son-merveille.mp3).

## Rendu
```bash
npm install
python3 musique.py audio/musique-v2.wav     # son de merveille : fondus, grand retour sur « Voici » à 16,55 s
python3 mix_epidemic.py audio/musique-v2.wav public/mix.wav audio/pistes   # v3 : voix + bruitages Epidemic Sound + musique, -14 LUFS, et pistes séparées
# (v2 : python3 mix.py audio/musique-v2.wav public/mix.wav, bruitages ElevenLabs)
npx remotion render src/index.jsx IPhone18 out/iphone18-16x9-4k.mp4 --scale=2 --crf=18
npx remotion render src/index.jsx IPhone18Vertical out/iphone18-9x16-4k.mp4 --scale=2 --crf=18
```
Sur Mac, retirer `Config.setBrowserExecutable` de remotion.config.js (chemin propre au cloud).

## Synchro
Tous les instants sont dans `T` (src/Video.jsx) et `EV` (mix.py), en secondes vidéo ; la voix est décalée de 0,36 s. Couleurs : photos officielles Apple (ref/couleurs-2k, recadrées dans public/couleurs).
Prix, numéro WhatsApp, adresse et logo ne sont pas encore fournis : à ajouter dans la scène 9 (aucune réécriture de la voix nécessaire).

## v3 (2026-10-12)
Bruitages Epidemic Sound (audio/epidemic/SOURCES.md, WAV non versionnés), même voix et même son. `public/mix.wav` est déjà le mix v3 : le rendu vidéo n'a pas besoin des WAV.
Compositions `IPhone18SansTexteFin` et `IPhone18VerticalSansTexteFin` : écran de fin sans ses textes, pour le projet invideo où ces textes sont des calques modifiables.
