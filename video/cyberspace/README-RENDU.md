# Pub CyberSpace SARL v5 : rendu 4K

Projet Remotion de la publicité CyberSpace v5, avec éléments 3D (three.js). Il y a deux compositions, toutes deux de 50,5 s à 60 i/s :

| Composition          | Format | Taille de la composition | Rendu `--scale=2` |
|----------------------|--------|--------------------------|-------------------|
| `CyberSpace`         | 16:9   | 1920×1080                | 3840×2160         |
| `CyberSpaceVertical` | 9:16   | 1080×1920                | 2160×3840         |

La bande-son finale est déjà mixée dans `audio/mix4.wav` : voix Théo avec prononciation corrigée, bruitages et musique synchronisée. Elle sert telle quelle aux deux formats.

## 1. Installer

Il faut Node 18 ou plus récent. Remotion télécharge lui-même son navigateur et embarque ffmpeg.

```bash
cd video/cyberspace
npm ci
```

## 2. Rendre l'image en 4K

`remotion.config.js` choisit tout seul le moteur 3D. Sur un Mac ou un PC avec carte graphique, il utilise `angle`, le WebGL accéléré. Sur le cloud Linux sans carte graphique, il utilise `swangle`, le rendu logiciel, beaucoup plus lent.

```bash
# 16:9
npx remotion render src/index.jsx CyberSpace out/v5-16x9.mp4 --scale=2 --crf=16 --x264-preset=medium --gl=angle

# 9:16 (TikTok, Instagram, Reels)
npx remotion render src/index.jsx CyberSpaceVertical out/v5-9x16.mp4 --scale=2 --crf=16 --x264-preset=medium --gl=angle
```

Pour vérifier une seule image avant le rendu complet, par exemple l'image 2924, qui montre le logo final :

```bash
npx remotion still src/index.jsx CyberSpace out/test.png --frame=2924 --scale=0.5 --gl=angle
```

Si le rendu sature la machine, ajoute `--concurrency=4`.

## 3. Ajouter la bande-son

Le mux se fait avec le ffmpeg embarqué par Remotion :

```bash
npx remotion ffmpeg -y -i out/v5-16x9.mp4 -i audio/mix4.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart cyberspace-sarl-v5-4k-16x9.mp4
npx remotion ffmpeg -y -i out/v5-9x16.mp4 -i audio/mix4.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart cyberspace-sarl-v5-4k-9x16.mp4
```

## 4. Refaire le mix (seulement si on change la voix, la musique ou les bruitages)

Il faut Python 3 avec numpy, et ffmpeg dans le PATH.

```bash
node scripts/remap_table.mjs > out/remap_table.txt          # table temps réel / temps des scènes
python3 scripts/music.py audio/music4.wav                    # musique 120 BPM recalée (facultatif, audio/music4.flac existe déjà)
python3 scripts/mix3.py audio out/remap_table.txt audio/mix4.wav audio/music4.flac -9   # 6e argument facultatif : autre fichier voix
```

Pour une nouvelle voix off, applique d'abord le lexique de prononciation au texte, puis génère la voix Théo dans ElevenLabs à partir du résultat :

```bash
python3 scripts/baliser.py scripts/script-vo.txt
```

## Contenu

- `src/Video.jsx` : les 14 scènes, avec les mises en page 16:9 et 9:16 (`Fmt.v`).
- `src/three3d.jsx` : la scène 3D de studio, les matières (argile blanche et noir laqué), le logo CS extrudé, la bulle, le plus, les blocs et les barres.
- `src/markShape.js` : le logo vectorisé depuis `public/cs-mark.png` par `scripts/trace_mark.py`.
- `src/remap.js` : le recalage mot à mot des scènes sur la voix off.
- `public/` : les logos et les polices Inter et Inter Display, embarquées pour un rendu identique partout.
- `audio/` : la voix (`theo4.mp3`), la musique (`music4.flac`), les bruitages (`sfx2/`) et le mix final (`mix4.wav`).
