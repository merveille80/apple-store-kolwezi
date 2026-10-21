#!/bin/bash
# Rendu complet sur le Mac de merveille (hors iCloud) : son, aperçu, 4K 9:16 et 16:9, calques B-roll alpha, dossier After Effects.
# Usage : bash rendu-mac.sh <chemin de fetch-audio.sh>
set -e
cd "$(dirname "$0")"
DEST="$HOME/Desktop/motion design pro/apple-store-kolwezi"
FETCH="${1:-$DEST/formation-business-iphone/fetch-audio.sh}"
sed -i '' '/setBrowserExecutable/d' remotion.config.js 2>/dev/null || true
[ -d node_modules ] || npm install --no-audit --no-fund
bash "$FETCH" audio/epidemic
python3 mix.py public/mix.wav audio/pistes
mkdir -p out
P="--port=3187 --log=error"
npx remotion render src/index.jsx FormationVertical out/formation-9x16-4k.mp4 --scale=2 --crf=18 $P
ffmpeg -v error -y -i out/formation-9x16-4k.mp4 -vf scale=720:1280 -c:v libx264 -crf 23 -preset fast -c:a aac -b:a 160k out/formation-apercu-9x16-720p.mp4
npx remotion render src/index.jsx Formation out/formation-16x9-4k.mp4 --scale=2 --crf=18 $P
# Calques B-roll transparents pour After Effects (ProRes 4444 avec alpha)
for F in 9x16 16x9; do
  C=Formation; V=false; [ $F = 9x16 ] && C=FormationVertical && V=true
  npx remotion render src/index.jsx $C out/broll-$F.mov --scale=2 --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png --muted --props="{\"vertical\":$V,\"broll\":true}" $P
done
# Dossier After Effects
AE=after-effects; mkdir -p $AE/video $AE/audio/epidemic
cp public/avatar.mp4 $AE/video/; cp out/broll-*.mov $AE/video/
cp audio/pistes/voix.wav audio/pistes/musique.wav audio/pistes/bruitages.json $AE/audio/; cp public/mix.wav $AE/audio/mix-final.wav
cp audio/epidemic/sfx-*.mp3 $AE/audio/epidemic/
mkdir -p "$DEST/rendus/pistes-formation" "$DEST/after-effects/formation-business-iphone"
cp out/formation-9x16-4k.mp4 out/formation-16x9-4k.mp4 out/formation-apercu-9x16-720p.mp4 "$DEST/rendus/"
cp audio/pistes/*.wav public/mix.wav "$DEST/rendus/pistes-formation/"
echo "RENDU OK"; ls -la "$DEST/rendus/" | grep formation
