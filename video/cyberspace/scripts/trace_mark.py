"""Vectorise le logo CS (PNG) en polygones pour l'extrusion 3D -> src/markShape.js"""
import cv2, json, numpy as np
im = cv2.imread('public/cs-mark.png', cv2.IMREAD_UNCHANGED)
a = im[:, :, 3] if im.shape[2] == 4 else 255 - cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
# suréchantillonnage pour des courbes lisses
big = cv2.resize(a, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
_, m = cv2.threshold(big, 128, 255, cv2.THRESH_BINARY)
cs, hier = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
H, W = a.shape
out = []
for i, c in enumerate(cs):
    if hier[0][i][3] != -1 or cv2.contourArea(c) < 2000: continue
    ap = cv2.approxPolyDP(c, 1.2, True)[:, 0, :] / 2.0
    # repère centré, y vers le haut, largeur normalisée à 1
    pts = [[round((x - W / 2) / W, 5), round(-(y - H / 2) / W, 5)] for x, y in ap]
    holes = []
    j = hier[0][i][2]
    while j != -1:
        if cv2.contourArea(cs[j]) > 2000:
            hp = cv2.approxPolyDP(cs[j], 1.2, True)[:, 0, :] / 2.0
            holes.append([[round((x - W / 2) / W, 5), round(-(y - H / 2) / W, 5)] for x, y in hp])
        j = hier[0][j][0]
    out.append({'pts': pts, 'holes': holes})
print(len(out), [len(o['pts']) for o in out], [len(o['holes']) for o in out])
open('src/markShape.js', 'w').write('// Logo CS vectorisé depuis public/cs-mark.png (trace_mark.py). Largeur = 1, centré.\nexport const MARK = ' + json.dumps(out) + ';\nexport const MARK_ASPECT = %f;\n' % (H / W))
