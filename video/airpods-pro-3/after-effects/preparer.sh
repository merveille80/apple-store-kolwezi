#!/bin/zsh
# Rassemble le dossier After Effects (scripts, données, sons, médias) puis construit les deux .aep.
#   after-effects/preparer.sh "<dossier AE>" [--sans-3d]
set -e
HERE=${0:A:h}
AE=${1:?dossier AE}
mkdir -p "$AE/sons/bruitages" "$AE/medias"
node "$HERE/gen.mjs" "$AE"
cp "$HERE"/AirPods-AE.jsx "$HERE"/Construire-9x16.jsx "$HERE"/Construire-16x9.jsx "$HERE"/LISEZMOI.txt "$AE/"
MIX=${MIX:-$HOME/ap3-build/sons/mix}
cp "$MIX"/master.wav "$MIX"/musique.wav "$MIX"/bruitages.wav "$AE/sons/"
cp "$MIX"/bruitages/*.wav "$AE/sons/bruitages/"
node -e "const j=require('$MIX/cues.json'); require('fs').writeFileSync('$AE/sons/cues.js','AP_CUES = '+JSON.stringify(j)+';\n')"
if [[ "$2" != "--sans-3d" ]]; then
  for F in 9x16 16x9; do
    mkdir -p "$AE/medias/3d-$F"
    rsync -a --exclude '*.part.png' "$HOME/ap3-build/rendus-3d/final-$F/" "$AE/medias/3d-$F/"
  done
fi
for F in 9x16 16x9; do
  rm -f "$AE/construction-$F.log"
  osascript -e "tell application \"Adobe After Effects 2026\" to DoScriptFile \"$AE/Construire-$F.jsx\""
  cat "$AE/construction-$F.log"; echo
done
