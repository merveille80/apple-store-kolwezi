# Planche de comparaison : Remotion (gauche) / données After Effects (droite)
import sys, os
from PIL import Image, ImageDraw
fmt, refdir, emudir, out = sys.argv[1:5]
names = sorted(f for f in os.listdir(emudir) if f.startswith(fmt))
pairs = []
for n in names:
    a = Image.open(os.path.join(refdir, n)).convert('RGB'); b = Image.open(os.path.join(emudir, n)).convert('RGB')
    b = b.resize(a.size)
    w, h = a.size
    im = Image.new('RGB', (w * 2 + 6, h + 24), (40, 40, 40))
    im.paste(a, (0, 24)); im.paste(b, (w + 6, 24))
    ImageDraw.Draw(im).text((6, 5), n + '  Remotion | AE', fill=(255, 255, 255))
    pairs.append(im)
cols = 2 if fmt == '9x16' else 1
for k in range(0, len(pairs), 4):
    grp = pairs[k:k + 4]
    w, h = grp[0].size
    rows = (len(grp) + cols - 1) // cols
    sheet = Image.new('RGB', (w * cols, h * rows), (0, 0, 0))
    for i, im in enumerate(grp):
        sheet.paste(im, ((i % cols) * w, (i // cols) * h))
    sheet.save(out + f'-{k // 4 + 1}.png')
print('ok')
