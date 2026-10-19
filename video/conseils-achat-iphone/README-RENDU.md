# Conseils d'achat iPhone · Apple Store Kolwezi

Pub motion design « UI » de 89,5 s (Remotion), 9:16 et 16:9, 60 i/s. Timeline validée : /mnt/project-files/videos/conseils-achat-iphone/storyboard.md.
Voix Koraly fournie par merveille, musique « A Step Ahead » et bruitages Epidemic Sound (audio/SOURCES.md).

## Rendu (sur le Mac)
```bash
npm install
# placer les sons Epidemic dans audio/epidemic/ (noms dans audio/SOURCES.md)
python3 mix.py public/mix.wav audio/pistes     # voix + musique + bruitages, -14 LUFS, et pistes séparées
npx remotion render src/index.jsx ConseilsVertical out/conseils-9x16-4k.mp4 --scale=2 --crf=18
npx remotion render src/index.jsx Conseils out/conseils-16x9-4k.mp4 --scale=2 --crf=18
```
Sur Mac, retirer `Config.setBrowserExecutable` de remotion.config.js (chemin propre au cloud). La police -apple-system donne San Francisco sur Mac.

## Synchro
Tous les instants (src/Video.jsx et `EV` de mix.py) sont ceux de la voix, d'après audio/voix-mots.json ; la voix démarre à 0 s.

## Visuels
public/bm-*.png : iPhone 11 à 17 Pro Max, photos Back Market détourées. public/p18.png : 18 Pro Max bordeaux officiel Apple.
Logo, WhatsApp et adresse de la boutique : à ajouter dans la scène 15 (S15 de Video.jsx) quand ils sont fournis.
