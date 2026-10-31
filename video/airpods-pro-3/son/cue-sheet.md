# Cue sheet — AirPods Pro 3 (11,1 s)

Mixage : `python3 mix.py ~/ap3-build/sons ~/ap3-build/sons/mix` (stems WAV 48 kHz / 24 bits, non versionnés — licence Epidemic Sound).

## Musique

« The Mood » — Heyson (Epidemic Sound), 126 BPM.

| Vidéo | Source | Rôle |
|---|---|---|
| 0,00–1,40 s | 33.81–35.21 s | A : deux mesures après le drop, grosse caisse nette ; fondu 0,12 s à la coupe |
| 1,40–1,90 s | 29,50–30,00 s | B (noir) : respiration d'avant-drop, passe-bas 700 Hz, −8 dB → quasi-silence |
| 1,90 s | 30,00 s | **Drop** calé sur l'apparition du boîtier |
| 1,90–11,10 s | 30,00–39,20 s | En plein ; fondu de sortie 0,6 s (10,5–11,1 s) |

## Bruitages

Alignement : *onset* = le transitoire tombe sur l'image ; *peak* = le maximum du whoosh tombe sur l'image (attaque avant).

| # | Temps | Fichier | Gain | Hauteur | Calage | Début réel | Pour |
|---|---|---|---|---|---|---|---|
| 1 | 0.00 s | whoosh-soft.wav | -9 dB | ×1.00 | onset | -0.186 s | titre |
| 2 | 1.40 s | boom-low.wav | -14 dB | ×1.00 | onset | 1.391 s | coupe au noir |
| 3 | 1.90 s | boom-deep.wav | -3 dB | ×1.00 | onset | 1.886 s | boîtier (impact principal) |
| 4 | 2.40 s | clic-couvercle.wav | -2 dB | ×1.00 | onset | 2.357 s | ouverture du couvercle |
| 5 | 2.55 s | whoosh-soft.wav | -6 dB | ×1.00 | peak | 2.166 s | écouteurs qui montent |
| 6 | 3.82 s | tick-ui.wav | -6 dB | ×1.00 | onset | 3.820 s | « Rebuilt » |
| 7 | 3.89 s | tick-ui.wav | -8 dB | ×1.06 | onset | 3.890 s | « from » |
| 8 | 3.96 s | tick-ui.wav | -8 dB | ×1.12 | onset | 3.960 s | « the » |
| 9 | 4.03 s | tick-ui.wav | -8 dB | ×1.19 | onset | 4.030 s | « ground » |
| 10 | 4.15 s | tick-dull.wav | -5 dB | ×1.00 | onset | 4.149 s | « up » |
| 11 | 4.40 s | whoosh-tonal.wav | -7 dB | ×1.00 | peak | 2.941 s | macro sur la paire |
| 12 | 5.92 s | tick-ui.wav | -7 dB | ×1.00 | onset | 5.920 s | embout L |
| 13 | 6.05 s | tick-ui.wav | -7 dB | ×1.06 | onset | 6.050 s | embout M |
| 14 | 6.18 s | tick-ui.wav | -7 dB | ×1.12 | onset | 6.180 s | embout S |
| 15 | 6.31 s | tick-ui.wav | -7 dB | ×1.19 | onset | 6.310 s | embout XS |
| 16 | 6.00 s | tick-dull.wav | -7 dB | ×1.00 | onset | 5.998 s | « Fit, finally figured out. » |
| 17 | 7.30 s | tick-ui.wav | -6 dB | ×1.00 | onset | 7.300 s | « Touch » |
| 18 | 7.45 s | hum-neon.wav | -16 dB | ×1.00 | onset | 7.373 s | capteur qui s’allume (0,8 s) |
| 19 | 7.75 s | tick-ui.wav | -6 dB | ×1.12 | onset | 7.750 s | « control » |
| 20 | 8.80 s | whoosh-tonal.wav | -7 dB | ×1.00 | peak | 7.341 s | paire héros |
| 21 | 10.00 s | boom-low.wav | -6 dB | ×1.00 | onset | 9.992 s | logo Apple |

## Master

Musique −3 dB + bruitages, puis loudnorm 2 passes : **−14 LUFS intégrés, −1 dBTP**. Fichiers : `master.wav`, `musique.wav`, `bruitages.wav`, `bruitages/NN_temps_nom.wav` (un stem par bruitage, calé sur la timeline, pour After Effects).
