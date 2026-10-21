# Formation business iPhone · rendu

Montage UI motion design (Remotion 4, 60 i/s, 40,95 s) autour de la vidéo avatar HeyGen de merveille, dont la voix est gardée telle quelle.
Storyboard validé : `storyboard.md`. Compositions : `FormationVertical` (1080×1920) et `Formation` (1920×1080), rendues en 4K avec `--scale=2`.

```bash
bash rendu-mac.sh <fetch-audio.sh>   # son, aperçu 720p, 4K 9:16 et 16:9, calques B-roll alpha, dossier after-effects/
```
Puis, dans After Effects : exécuter `after-effects/lancer-9x16.jsx` et `after-effects/lancer-16x9.jsx` (un .aep par format).

- Scènes : tableau `SCENES` de `src/Video.jsx` (début, fin, cadre de l'avatar), dessinées dans l'espace 540×960 du storyboard.
- Prop `broll: true` : calque B-roll seul sur fond transparent, pour After Effects.
- Son : `mix.py` (voix de l'avatar + musique + 108 bruitages, -14 LUFS), sources dans `audio/SOURCES.md`.
- Lien du site : scène 12, « Lien du site » en attendant l'adresse.
- Sur un Mac, cloner hors du Bureau synchronisé iCloud avant de rendre.
