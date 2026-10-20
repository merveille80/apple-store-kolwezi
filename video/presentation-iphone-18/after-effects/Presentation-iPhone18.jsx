// Présentation iPhone 18 Pro Max · Apple Store Kolwezi
// Construit le projet After Effects éditable : une composition par scène, une composition principale
// en 16:9 (3840×2160) et en 9:16 (2160×3840), 60 i/s, 35,5 s. Images clés natives, calques texte,
// formes, photos et sons séparés. Reprend les minutages de src/Video.jsx (Remotion).
// Utilisation : Fichier > Scripts > Exécuter le fichier de script…, avec les dossiers images/ et audio/ à côté.

(function () {
  var BASE = File($.fileName).parent;
  var FPS = 60, DUR = 35.5;
  var RATIO = 822 / 1726, IMG_W = 822, IMG_H = 1726;

  var S = {s1: 0, s2: 3.6, s3: 7.0, s4: 12.6, s5: 21.6, s6: 26.2, s7: 29.6};
  var T = {iphone: 0.9, n18: 1.4, promax: 2.0, colors: [7.55, 8.8, 10.05, 11.3],
    f: [18.45, 20.2, 20.5, 20.8], a20: 22.0, h43: 24.35, to2: 27.3, store: 31.35};

  function rgb(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }
  var INK = rgb('#1d1d1f'), GREY = rgb('#86868b'), GREY2 = rgb('#6e6e73'), LIGHT = rgb('#f5f5f7'), DARK = rgb('#111113'),
    BLUE = rgb('#0071e3'), WHITE = [1, 1, 1];

  // Polices : SF Pro Display si installée, sinon Inter, sinon Helvetica Neue
  function pickFont(list) {
    for (var i = 0; i < list.length; i++) {
      try {
        if (app.fonts && app.fonts.getFontsByPostScriptName && app.fonts.getFontsByPostScriptName(list[i]).length > 0) return list[i];
      } catch (e) {}
    }
    return list[list.length - 1];
  }
  var F_SEMI = pickFont(['SFProDisplay-Semibold', 'Inter-SemiBold', 'HelveticaNeue-Medium']);
  var F_BOLD = pickFont(['SFProDisplay-Bold', 'Inter-Bold', 'HelveticaNeue-Bold']);
  var F_MED = pickFont(['SFProDisplay-Medium', 'Inter-Medium', 'HelveticaNeue']);

  app.beginUndoGroup('Présentation iPhone 18 Pro Max');
  var proj = app.project || app.newProject();

  function folder(name, parent) { var f = proj.items.addFolder(name); if (parent) f.parentFolder = parent; return f; }
  var ROOT = folder('Présentation iPhone 18 Pro Max');
  var MEDIA = folder('Médias', ROOT);
  function imp(rel) {
    var f = new File(BASE.fsName + '/' + rel);
    if (!f.exists) throw new Error('Fichier introuvable : ' + f.fsName);
    var it = proj.importFile(new ImportOptions(f));
    it.parentFolder = MEDIA;
    return it;
  }
  var IMG = {noir: imp('images/noir-dos.png'), argent: imp('images/argent-dos.png'), glacier: imp('images/glacier-dos.png'), bordeaux: imp('images/bordeaux-dos.png')};
  var AUD = {voix: imp('audio/voix.wav'), musique: imp('audio/musique.wav'), bruitages: imp('audio/bruitages.wav'), mix: imp('audio/mix-final.wav')};

  // ---------- Images clés ----------
  var OFF = 0; // début de la composition de scène dans la composition principale
  function nEase(p) {
    var t = p.propertyValueType;
    if (t === PropertyValueType.TwoD_SPATIAL || t === PropertyValueType.ThreeD_SPATIAL) return 1;
    if (t === PropertyValueType.TwoD) return 2;
    if (t === PropertyValueType.ThreeD) return 3;
    if (t === PropertyValueType.COLOR) return 1;
    return 1;
  }
  function easeArr(n, inf) { var a = []; for (var i = 0; i < n; i++) a.push(new KeyframeEase(0, Math.max(0.1, Math.min(100, inf)))); return a; }
  var MODES = {out: [10, 85], io: [65, 65], 'in': [80, 15], soft: [33, 33]};
  function key(p, t, v) { p.setValueAtTime(Math.max(0, t - OFF), v); return p.nearestKeyIndex(Math.max(0, t - OFF)); }
  // keys : [[temps absolu, valeur, mode du segment qui suit]]
  function anim(p, keys, mode) {
    var idx = [];
    for (var i = 0; i < keys.length; i++) idx.push(key(p, keys[i][0], keys[i][1]));
    for (i = 0; i < keys.length; i++) idx[i] = p.nearestKeyIndex(Math.max(0, keys[i][0] - OFF));
    var n = nEase(p);
    for (i = 0; i < keys.length - 1; i++) {
      var m = MODES[keys[i][2] || mode || 'out'];
      var a = idx[i], b = idx[i + 1];
      p.setTemporalEaseAtKey(a, p.keyInTemporalEase(a), easeArr(n, m[0]));
      p.setTemporalEaseAtKey(b, easeArr(n, m[1]), p.keyOutTemporalEase(b));
    }
    if (p.isSpatial) {
      for (i = 0; i < idx.length; i++) {
        try {
          p.setSpatialAutoBezierAtKey(idx[i], false);
          p.setSpatialContinuousAtKey(idx[i], false);
          var z = []; for (var k = 0; k < p.value.length; k++) z.push(0);
          p.setSpatialTangentsAtKey(idx[i], z, z);
        } catch (e) {}
      }
    }
  }
  function lerpV(a, b, k) {
    if (a instanceof Array) { var r = []; for (var i = 0; i < a.length; i++) r.push(a[i] + (b[i] - a[i]) * k); return r; }
    return a + (b - a) * k;
  }
  // Ressort : dépassement léger puis retour, comme les springs de la version Remotion
  function spring(p, t0, from, to, dur, ov) {
    if (ov === undefined) ov = 0.06;
    anim(p, [[t0, from, 'out'], [t0 + dur * 0.5, lerpV(from, to, 1 + ov), 'io'], [t0 + dur, to]]);
  }

  // ---------- Calques ----------
  function fx(l, match) { return l.property('ADBE Effect Parade').addProperty(match); }
  function byType(eff, type, nth) {
    var c = 0;
    for (var i = 1; i <= eff.numProperties; i++) { var q = eff.property(i); if (q.propertyValueType === type) { if (c === (nth || 0)) return q; c++; } }
    return null;
  }
  function pct(p, v) { p.setValue(p.hasMax && p.maxValue > 100 ? v / 100 * p.maxValue : v); }
  function shadow(l, op, dist, soft) {
    var e = fx(l, 'ADBE Drop Shadow');
    e = l.property('ADBE Effect Parade').property(e.propertyIndex);
    pct(e.property('ADBE Drop Shadow-0002'), op);
    e.property('ADBE Drop Shadow-0003').setValue(180);
    e.property('ADBE Drop Shadow-0004').setValue(dist);
    e.property('ADBE Drop Shadow-0005').setValue(soft);
    return e;
  }
  function blur(l) {
    var e = fx(l, 'ADBE Gaussian Blur 2');
    e = l.property('ADBE Effect Parade').property(e.propertyIndex);
    try { e.property('ADBE Gaussian Blur 2-0003').setValue(1); } catch (er) {}
    return e.property('ADBE Gaussian Blur 2-0001');
  }
  function fillFx(l, color) {
    var e = fx(l, 'ADBE Fill');
    e = l.property('ADBE Effect Parade').property(e.propertyIndex);
    var c = byType(e, PropertyValueType.COLOR);
    c.setValue(color);
    return c;
  }
  function T_(l) { return l.property('ADBE Transform Group'); }
  function P(l) { return T_(l).property('ADBE Position'); }
  function SC(l) { return T_(l).property('ADBE Scale'); }
  function OP(l) { return T_(l).property('ADBE Opacity'); }
  function AN(l) { return T_(l).property('ADBE Anchor Point'); }

  function nul(comp, name, x, y) {
    var l = comp.layers.addNull();
    l.name = name; l.enabled = false;
    AN(l).setValue([0, 0]); P(l).setValue([x, y]);
    return l;
  }
  function phone(comp, c, x, y, h, dark) {
    var l = comp.layers.add(IMG[c]);
    l.name = 'iPhone ' + c;
    SC(l).setValue([h / IMG_H * 100, h / IMG_H * 100]);
    P(l).setValue([x, y]);
    l.motionBlur = true;
    shadow(l, dark ? 55 : 16, IMG_H * 0.035, IMG_H * 0.07);
    return l;
  }
  // Texte ; just : 'L' ou 'C'. Le point d'ancrage est placé au centre vertical (et horizontal si 'C')
  function txt(comp, str, size, color, font, just, x, yTop, track) {
    var l = comp.layers.addText(str);
    var p = l.property('ADBE Text Properties').property('ADBE Text Document');
    var d = p.value;
    try { d.resetCharStyle(); d.resetParagraphStyle(); } catch (e) {}
    d.font = font; d.fontSize = size; d.applyFill = true; d.fillColor = color; d.applyStroke = false;
    d.tracking = track === undefined ? -20 : track;
    d.justification = just === 'C' ? ParagraphJustification.CENTER_JUSTIFY : ParagraphJustification.LEFT_JUSTIFY;
    p.setValue(d);
    l.name = str;
    var r = l.sourceRectAtTime(0, false);
    AN(l).setValue([just === 'C' ? r.left + r.width / 2 : r.left, r.top + r.height / 2]);
    P(l).setValue([x, yTop + size * 0.6]);
    l.motionBlur = true;
    return l;
  }
  function width(l) { return l.sourceRectAtTime(0, false).width; }

  function vecGroup(l, name) {
    var root = l.property('ADBE Root Vectors Group');
    var g = root.addProperty('ADBE Vector Group');
    g.name = name;
    return g.propertyIndex;
  }
  function vecs(l, gi) { return l.property('ADBE Root Vectors Group').property(gi).property('ADBE Vectors Group'); }
  function addRect(l, gi, w, h, r) {
    var c = vecs(l, gi).addProperty('ADBE Vector Shape - Rect');
    var i = c.propertyIndex;
    vecs(l, gi).property(i).property('ADBE Vector Rect Size').setValue([w, h]);
    vecs(l, gi).property(i).property('ADBE Vector Rect Roundness').setValue(r);
  }
  function addEllipse(l, gi, d) {
    var c = vecs(l, gi).addProperty('ADBE Vector Shape - Ellipse');
    vecs(l, gi).property(c.propertyIndex).property('ADBE Vector Ellipse Size').setValue([d, d]);
  }
  function addFill(l, gi, color) {
    var c = vecs(l, gi).addProperty('ADBE Vector Graphic - Fill');
    var i = c.propertyIndex;
    vecs(l, gi).property(i).property('ADBE Vector Fill Color').setValue(color);
    return function () { return vecs(l, gi).property(i).property('ADBE Vector Fill Color'); };
  }
  function addStroke(l, gi, color, w) {
    var c = vecs(l, gi).addProperty('ADBE Vector Graphic - Stroke');
    var i = c.propertyIndex;
    vecs(l, gi).property(i).property('ADBE Vector Stroke Color').setValue(color);
    vecs(l, gi).property(i).property('ADBE Vector Stroke Width').setValue(w);
  }
  function shapeLayer(comp, name, x, y) {
    var l = comp.layers.addShape();
    l.name = name; AN(l).setValue([0, 0]); P(l).setValue([x, y]);
    return l;
  }
  function roundRect(comp, name, x, y, w, h, r, color) {
    var l = shapeLayer(comp, name, x, y);
    var gi = vecGroup(l, name);
    addRect(l, gi, w, h, r);
    var fill = addFill(l, gi, color);
    return {layer: l, fill: fill};
  }
  // Puce UI (pilule blanche + libellé), x, y = coin haut gauche comme dans Video.jsx
  function chip(comp, label, x, y, w, h, fs) {
    var r = roundRect(comp, 'Puce ' + label, x + w / 2, y + h / 2, w, h, h * 0.32, WHITE);
    shadow(r.layer, 9, h * 0.1, h * 0.35);
    var t = txt(comp, label, fs, INK, F_SEMI, 'C', x + w / 2, y + h / 2 - fs * 0.6, -10);
    t.parent = r.layer;
    return {bg: r.layer, fill: r.fill, text: t, textFill: fillFx(t, INK)};
  }
  function cursor(comp, s) {
    var l = shapeLayer(comp, 'Curseur', 0, 0);
    var gi = vecGroup(l, 'Flèche');
    var c = vecs(l, gi).addProperty('ADBE Vector Shape - Group');
    var sh = new Shape();
    var k = s / 20, pts = [[2, 2], [2, 22], [7, 17], [10.5, 25], [14, 23.5], [10.5, 15.8], [17, 15.5]];
    var v = []; for (var i = 0; i < pts.length; i++) v.push([pts[i][0] * k, pts[i][1] * k]);
    sh.vertices = v; sh.closed = true;
    vecs(l, gi).property(c.propertyIndex).property('ADBE Vector Shape').setValue(sh);
    addStroke(l, gi, WHITE, 1.6 * k);
    addFill(l, gi, rgb('#111111'));
    AN(l).setValue([2 * k, 2 * k]);
    shadow(l, 30, 2 * k, 4 * k);
    return l;
  }
  function ellipseShape(cx, cy, r) {
    var k = 0.5523 * r, s = new Shape();
    s.vertices = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
    s.inTangents = [[-k, 0], [0, -k], [k, 0], [0, k]];
    s.outTangents = [[k, 0], [0, k], [-k, 0], [0, -k]];
    s.closed = true;
    return s;
  }
  function fadeChip(c, t0, t1, dy) { fadeIn(c.bg, t0, t1, dy); anim(OP(c.text), [[t0, 0], [t1, 100]]); }
  function fadeIn(l, t0, t1, dy) {
    anim(OP(l), [[t0, 0], [t1, 100]]);
    if (dy) { var p = P(l).value; anim(P(l), [[t0, [p[0], p[1] + dy]], [t1, [p[0], p[1]]]]); }
  }

  // ---------- Construction d'un format ----------
  function build(V) {
    var W = V ? 2160 : 3840, H = V ? 3840 : 2160;
    var u = Math.min(W, H) / 100, cx = W / 2, cy = H / 2;
    var tag = V ? '9x16' : '16x9';
    var FOLD = folder(V ? 'Vertical 9:16' : 'Horizontal 16:9', ROOT);
    function sceneComp(name, a, b) {
      var c = proj.items.addComp(name + ' ' + tag, W, H, 1, b - a, FPS);
      c.parentFolder = FOLD; c.motionBlur = true; c.bgColor = LIGHT;
      return c;
    }

    // Scènes 1 et 2 : titre mot par mot, puis les 4 iPhone en cascade
    OFF = 0;
    var c1 = sceneComp('01-02 Titre et cascade', 0, 7.2);
    (function () {
      var size0 = V ? 10.5 * u : 8.6 * u, size1 = V ? 7.2 * u : 4.4 * u;
      var tStart = [cx, V ? cy - size0 * 0.1 : cy];
      var title = nul(c1, 'Titre (déplacer et redimensionner ici)', tStart[0], tStart[1]);
      var words = [['iPhone', INK, T.iphone], ['18', INK, T.n18], ['Pro Max', GREY, T.promax]];
      var L = [], tot = 0, gap = 0.22 * size0;
      for (var i = 0; i < 3; i++) { L.push(txt(c1, words[i][0], size0, words[i][1], F_SEMI, 'L', 0, -size0 * 0.6, -30)); tot += width(L[i]); }
      tot += 2 * gap;
      var x = -tot / 2;
      for (i = 0; i < 3; i++) {
        var l = L[i];
        l.parent = title;
        P(l).setValue([x, 0]);
        anim(P(l), [[words[i][2], [x + 80, 0]], [words[i][2] + 0.55, [x, 0]]]);
        anim(OP(l), [[words[i][2], 0], [words[i][2] + 0.55, 100]]);
        anim(blur(l), [[words[i][2], 28], [words[i][2] + 0.55, 0]]);
        x += width(l) + gap;
      }
      var k = size1 / size0;
      var endPos = V ? [cx, 20 * u + size1 * 0.6] : [7 * u + tot * k / 2, cy];
      spring(P(title), S.s2, tStart, endPos, 0.9, 0.02);
      spring(SC(title), S.s2, [100, 100], [k * 100, k * 100], 0.9, 0.02);
      var h = V ? 52 * u : 56 * u, C = ['noir', 'argent', 'glacier', 'bordeaux'];
      for (i = 0; i < 4; i++) {
        var px, py;
        if (!V) { px = (50 + i * 27.5) * u + RATIO * h / 2; py = cy; } else { px = (30 + (i % 2) * 40) * u; py = (62 + Math.floor(i / 2) * 58) * u; }
        var ph = phone(c1, C[i], px, py, h);
        var t0 = S.s2 + 0.3 + i * 0.25;
        spring(P(ph), t0, [px + W * 0.8, py], [px, py], 0.75, 0.025);
        anim(OP(ph), [[t0, 0], [t0 + 0.12, 100]]);
        anim(P(ph), [[S.s3 - 0.55, [px, py]], [S.s3 - 0.1, [px, py - 4 * u]]], 'io');
      }
    })();

    // Scène 3 : carrousel sombre, l'iPhone nommé se soulève
    OFF = 6.4;
    var c3 = sceneComp('03 Couleurs', 6.4, 12.9);
    (function () {
      var h = V ? 58 * u : 46 * u, gap = V ? 62 * u : 30 * u;
      var C = [['noir', 'Noir'], ['argent', 'Argent'], ['glacier', 'Glacier'], ['bordeaux', 'Bordeaux']];
      var baseX = V ? cx : cx - 1.5 * gap;
      function shift(k) { return V ? baseX - k * gap : baseX - (k - 1.5) * gap * 0.35; }
      var K = [[6.4, 0]];
      for (var j = 1; j < 4; j++) { K.push([T.colors[j] - 0.12, j - 1]); K.push([T.colors[j] + 0.33, j]); }
      K.push([12.9, 3]);
      var car = nul(c3, 'Carrousel', shift(0), 0);
      var pk = [[S.s3 - 0.3, [shift(0) + W * 0.6, 0]], [S.s3 + 0.35, [shift(0), 0]]];
      for (j = 1; j < 4; j++) { pk.push([T.colors[j] - 0.12, [shift(j - 1), 0]]); pk.push([T.colors[j] + 0.33, [shift(j), 0]]); }
      pk.push([S.s4 - 0.45, [shift(3), 0], 'in']); pk.push([S.s4 + 0.1, [shift(3) - W * 1.2, 0]]);
      anim(P(car), pk);
      for (var i = 0; i < 4; i++) {
        var ph = phone(c3, C[i][0], 0, 0, h, true);
        ph.parent = car;
        var lab = txt(c3, C[i][1], (V ? 4.4 : 2.8) * u, LIGHT, F_SEMI, 'C', 0, 0);
        lab.parent = car;
        var b = blur(lab);
        var yk = [], sk = [], ok = [], lk = [], lo = [], bk = [];
        for (j = 0; j < K.length; j++) {
          var d = Math.max(0, 1 - Math.abs(K[j][1] - i)), t = K[j][0], s = h / IMG_H * 100 * (1 + d * 0.06);
          yk.push([t, [i * gap, cy + (V ? 6 : 3) * u - d * 5 * u]]);
          sk.push([t, [s, s]]);
          ok.push([t, 42 + d * 58]);
          lk.push([t, [i * gap, cy - h / 2 - (V ? 12 : 10) * u - d * 2 * u + (V ? 4.4 : 2.8) * u * 0.6]]);
          lo.push([t, d * 100]);
          bk.push([t, (1 - d) * 16]);
        }
        anim(P(ph), yk, 'io'); anim(SC(ph), sk, 'io'); anim(OP(ph), ok, 'io');
        anim(P(lab), lk, 'io'); anim(OP(lab), lo, 'io'); anim(b, bk, 'io');
      }
      // Liste des couleurs en bas
      var fs = (V ? 3.2 : 2.4) * u, names = [], totW = 0, g = 1.6 * u;
      for (i = 0; i < 4; i++) { names.push(txt(c3, C[i][1], fs, GREY2, F_MED, 'L', 0, 0, 0)); totW += width(names[i]); }
      totW += 3 * g;
      var x = cx - totW / 2, y = H - (V ? 20 : 11) * u;
      for (i = 0; i < 4; i++) {
        P(names[i]).setValue([x, y + fs * 0.6]); x += width(names[i]) + g;
        var col = fillFx(names[i], GREY2), ck = [];
        for (j = 0; j < K.length; j++) ck.push([K[j][0], Math.round(K[j][1]) === i ? WHITE : GREY2]);
        anim(col, ck, 'io');
        anim(OP(names[i]), [[S.s3 - 0.3, 0], [S.s3 + 0.3, 100], [S.s4 - 0.45, 100, 'in'], [S.s4 + 0.1, 0]]);
      }
    })();

    // Scène 4 : zoom sur le bloc caméra, diaphragme et sélecteur d'ouverture
    OFF = 12.3;
    var c4 = sceneComp('04 Caméra ouverture variable', 12.3, 21.9);
    (function () {
      var ph = V ? 70 * u : 62 * u, base = ph / IMG_H * 100, zmax = V ? 2.05 : 2.2;
      var p = phone(c4, 'bordeaux', cx, cy, ph);
      AN(p).setValue([IMG_W / 2, IMG_H * 0.15]); // point d'ancrage sur le bloc caméra
      var fx2 = V ? cx : 36 * u, fy2 = V ? 26 * u : cy, zEnd = V ? zmax * 0.5 : zmax;
      anim(P(p), [[S.s4 + 0.1, [cx, cy - 0.35 * ph], 'io'], [S.s4 + 1.3, [cx, cy]]]);
      anim(SC(p), [[S.s4 + 0.1, [base, base], 'io'], [S.s4 + 1.3, [base * zmax, base * zmax]]]);
      spring(P(p), S.s4 + 1.4, [cx, cy], [fx2, fy2], 0.9, 0.02);
      if (V) spring(SC(p), S.s4 + 1.4, [base * zmax, base * zmax], [base * zEnd, base * zEnd], 0.9, 0.02);

      var ix = V ? cx : 112 * u, iy = V ? 130 * u : cy - 6 * u, R = V ? 17 * u : 14 * u;
      var ui0 = S.s4 + 1.7, ui1 = S.s4 + 2.4;
      var t1 = txt(c4, 'Ouverture variable', (V ? 4.6 : 4.2) * u, INK, F_SEMI, 'C', ix, iy - R * 1.95);
      var t2 = txt(c4, 'Caméra Fusion 48 Mpx', (V ? 2.8 : 2.4) * u, GREY, F_MED, 'C', ix, iy - R * 1.95 + (V ? 6.2 : 5.4) * u, 0);
      fadeIn(t1, ui0, ui1, 3 * u); fadeIn(t2, ui0, ui1, 3 * u);

      // Objectif : bague, verre (dégradé radial) et 9 lamelles
      var ring = shapeLayer(c4, 'Objectif bague', ix, iy);
      var gi = vecGroup(ring, 'Bague claire'); addEllipse(ring, gi, R * 2.34); addFill(ring, gi, rgb('#e8e8ed'));
      gi = vecGroup(ring, 'Bague noire'); addEllipse(ring, gi, R * 2.2); addFill(ring, gi, INK);
      // l'ordre des groupes : le premier ajouté est au-dessus, on remet la bague claire en dessous
      ring.property('ADBE Root Vectors Group').property(1).moveTo(2);
      var glass = c4.layers.addSolid([0, 0, 0], 'Objectif verre', Math.round(R * 2), Math.round(R * 2), 1, 21.9 - 12.3);
      P(glass).setValue([ix, iy]);
      var m = glass.property('ADBE Mask Parade').addProperty('ADBE Mask Atom');
      glass.property('ADBE Mask Parade').property(1).property('ADBE Mask Shape').setValue(ellipseShape(R, R, R));
      var ramp = fx(glass, 'ADBE Ramp');
      ramp = glass.property('ADBE Effect Parade').property(ramp.propertyIndex);
      ramp.property('ADBE Ramp-0001').setValue([R, R]);
      ramp.property('ADBE Ramp-0002').setValue(rgb('#9aa8d6'));
      ramp.property('ADBE Ramp-0003').setValue([R, 0]);
      ramp.property('ADBE Ramp-0004').setValue(rgb('#0b0b0c'));
      ramp.property('ADBE Ramp-0005').setValue(2);
      var bl = shapeLayer(c4, 'Diaphragme (lamelles)', ix, iy);
      gi = vecGroup(bl, 'Lamelles');
      addEllipse(bl, gi, R * 2); // le cercle d'abord : Soustraire retire le polygone (ajouté ensuite) du cercle
      var star = vecs(bl, gi).addProperty('ADBE Vector Shape - Star');
      var si = star.propertyIndex;
      vecs(bl, gi).property(si).property('ADBE Vector Star Type').setValue(2);
      vecs(bl, gi).property(si).property('ADBE Vector Star Points').setValue(9);
      var mg = vecs(bl, gi).addProperty('ADBE Vector Filter - Merge');
      vecs(bl, gi).property(mg.propertyIndex).property('ADBE Vector Merge Type').setValue(3);
      addFill(bl, gi, rgb('#26262a'));
      addStroke(bl, gi, rgb('#3a3a3e'), 2);
      var rad = vecs(bl, gi).property(si).property('ADBE Vector Star Outer Radius');
      var rot = vecs(bl, gi).property(si).property('ADBE Vector Star Rotation');
      var rr = [0.86, 0.68, 0.48, 0.3];
      var rk = [[ui0, R * rr[0]]], ok = [[ui0, 0]];
      for (var i = 1; i < 4; i++) { rk.push([T.f[i], R * rr[i - 1]]); rk.push([T.f[i] + 0.22, R * rr[i]]); ok.push([T.f[i], (0.86 - rr[i - 1]) * 69]); ok.push([T.f[i] + 0.22, (0.86 - rr[i]) * 69]); }
      anim(rad, rk); anim(rot, ok);
      var edge = shapeLayer(c4, 'Objectif contour', ix, iy);
      gi = vecGroup(edge, 'Contour'); addEllipse(edge, gi, R * 2); addStroke(edge, gi, [0, 0, 0], R * 0.04);
      var lens = [ring, glass, bl, edge];
      for (i = 0; i < 4; i++) fadeIn(lens[i], ui0, ui1, 3 * u);

      // Sélecteur ƒ
      var cw = V ? 19 * u : 12 * u, ch = V ? 7 * u : 5.6 * u, fs = V ? 3 * u : 2.4 * u, y0 = iy + R * 1.5;
      var labels = ['ƒ/1,48', 'ƒ/1,8', 'ƒ/2,8', 'ƒ/4,0'];
      function chipX(i) { return ix - 2 * cw - 1.5 * u + i * (cw + 1 * u); }
      for (i = 0; i < 4; i++) {
        var c = chip(c4, labels[i], chipX(i), y0, cw, ch, fs);
        fadeChip(c, ui0, ui1, 3 * u);
        var on = T.f[i], off = i < 3 ? T.f[i + 1] : 99;
        anim(c.fill(), [[on, WHITE], [on + 0.15, BLUE]].concat(off < 99 ? [[off, BLUE], [off + 0.1, WHITE]] : []));
        anim(c.textFill, [[on, INK], [on + 0.15, WHITE]].concat(off < 99 ? [[off, WHITE], [off + 0.1, INK]] : []));
      }
      var cur = cursor(c4, V ? 4 * u : 2.6 * u);
      var cyc = y0 + ch * 0.5, ck = [[T.f[0] - 0.9, [chipX(0) + cw * 0.55, cyc + 4 * u]], [T.f[0] - 0.3, [chipX(0) + cw * 0.55, cyc]]];
      for (i = 1; i < 4; i++) { ck.push([T.f[i] - 0.25, [chipX(i - 1) + cw * 0.55, cyc], 'io']); ck.push([T.f[i] - 0.02, [chipX(i) + cw * 0.55, cyc]]); }
      anim(P(cur), ck);
      anim(OP(cur), [[T.f[0] - 0.9, 0], [T.f[0] - 0.3, 100], [S.s5 - 0.8, 100], [S.s5 - 0.4, 0]]);
      var pk = [];
      for (i = 0; i < 4; i++) { pk.push([T.f[i] - 0.08, [100, 100]]); pk.push([T.f[i], [85, 85]]); pk.push([T.f[i] + 0.08, [100, 100]]); }
      anim(SC(cur), pk, 'io');
    })();

    // Scène 5 : puce A20 Pro et 43 h
    OFF = 21.3;
    var c5 = sceneComp('05 Puce A20 Pro et autonomie', 21.3, 26.5);
    (function () {
      var h = V ? 70 * u : 52 * u, py = V ? 14 * u + h / 2 : cy;
      var ph = phone(c5, 'noir', cx, py, h);
      spring(P(ph), S.s5, [cx, py + H * 0.6], [cx, py], 1.0, 0.02);
      var k = V ? 1.35 : 1;
      function card(name, x, y, w, hh, t0, from) {
        var n = nul(c5, 'Carte ' + name, x + w / 2, y + hh / 2);
        var r = roundRect(c5, 'Fond carte ' + name, x + w / 2, y + hh / 2, w, hh, 3 * u, WHITE);
        shadow(r.layer, 10, 1.5 * u, 5 * u);
        r.layer.parent = n;
        // animé après le rattachement du contenu, sinon le contenu reste décalé
        function go() {
          spring(P(n), t0, [x + w / 2 + from, y + hh / 2], [x + w / 2, y + hh / 2], 0.8, 0.03);
          spring(SC(n), t0, [92, 92], [100, 100], 0.8, 0.01);
        }
        return {n: n, cx: x + w / 2, cy: y + hh / 2, parts: [r.layer], go: go};
      }
      var A, B;
      if (!V) { A = card('A20', cx - 50 * u, cy - 13 * u, 32 * u, 26 * u, T.a20 - 0.1, -20 * u); B = card('43 h', cx + 18 * u, cy - 13 * u, 32 * u, 26 * u, T.h43 - 0.1, 20 * u); }
      else { A = card('A20', 6 * u, 100 * u, 42 * u, 30 * u, T.a20 - 0.1, -20 * u); B = card('43 h', 52 * u, 100 * u, 42 * u, 30 * u, T.h43 - 0.1, 20 * u); }
      // Carte puce
      var sq = 12 * u * k, lab = 1.9 * u * k, tot = sq + 1 * u + lab * 1.2, top = A.cy - tot / 2;
      var chipSq = roundRect(c5, 'Puce A20', A.cx, top + sq / 2, sq, sq, 2.4 * u * k, INK);
      addStroke(chipSq.layer, 1, rgb('#3a3a3c'), 0.5 * u);
      var a20 = txt(c5, 'A20', 2.8 * u * k, WHITE, F_BOLD, 'C', A.cx, top + sq / 2 - 2.8 * u * k * 0.95, -10);
      var pro = txt(c5, 'PRO', 1.5 * u * k, rgb('#a1a1a6'), F_SEMI, 'C', A.cx, top + sq / 2 + 0.6 * u * k, 40);
      var l1 = txt(c5, 'Puce A20 Pro', lab, GREY2, F_MED, 'C', A.cx, top + sq + 1 * u, 0);
      A.parts = A.parts.concat([chipSq.layer, a20, pro, l1]);
      // Carte autonomie, compteur 0 → 43 piloté par expression
      var big = 8 * u * k; tot = big + 1 * u + lab * 1.2; top = B.cy - tot / 2;
      var cnt = txt(c5, '43 h', big, INK, F_BOLD, 'C', B.cx, top, -30);
      cnt.name = 'Compteur 43 h';
      cnt.property('ADBE Text Properties').property('ADBE Text Document').expression =
        '// compteur : début, fin (secondes dans cette composition) et valeur finale\nvar a = ' + (T.h43 - OFF).toFixed(2) + ', b = a + 1.0, n = 43;\nMath.round(easeOut(time, a, b, 0, n)) + " h"';
      var l2 = txt(c5, 'de lecture vidéo', lab, GREY2, F_MED, 'C', B.cx, top + big + 1 * u, 0);
      B.parts = B.parts.concat([cnt, l2]);
      var cards = [[A, T.a20 - 0.1], [B, T.h43 - 0.1]];
      for (var i = 0; i < 2; i++) {
        for (var j = 0; j < cards[i][0].parts.length; j++) {
          var l = cards[i][0].parts[j];
          if (l.parent === null) l.parent = cards[i][0].n;
          anim(OP(l), [[cards[i][1], 0], [cards[i][1] + 0.25, 100]]);
        }
        cards[i][0].go();
      }
    })();

    // Scène 6 : sélecteur de capacité, le curseur clique 2 To
    OFF = 25.9;
    var c6 = sceneComp('06 Stockage', 25.9, 29.9);
    (function () {
      var L = ['256 Go', '512 Go', '1 To', '2 To'];
      var cw = V ? 36 * u : 18 * u, ch = V ? 11 * u : 7 * u, fs = V ? 4.6 * u : 2.8 * u, gapY = 2 * u;
      var h = V ? 88 * u : 66 * u;
      var px = V ? 50 * u + h * RATIO / 2 : cx + 2 * u + h * RATIO / 2, py = V ? 42 * u + h / 2 : cy;
      var ph = phone(c6, 'bordeaux', px, py, h);
      spring(P(ph), S.s6, [px + W * 0.5, py], [px, py], 0.9, 0.02);
      var x0 = V ? 7 * u : cx - 26 * u, y0 = V ? 60 * u : cy - 2 * ch - 3 * u;
      var st = txt(c6, 'Stockage', (V ? 4.2 : 2.8) * u, GREY2, F_MED, 'L', x0, y0 - (V ? 9 : 6) * u, 0);
      anim(OP(st), [[S.s6 + 0.1, 0], [S.s6 + 0.5, 100]]);
      for (var i = 0; i < 4; i++) {
        var c = chip(c6, L[i], x0, y0 + i * (ch + gapY), cw, ch, fs);
        var t0 = S.s6 + 0.15 + i * 0.09;
        fadeChip(c, t0, t0 + 0.35, 3 * u);
        if (i === 3) {
          anim(c.fill(), [[T.to2, WHITE], [T.to2 + 0.15, BLUE]]);
          anim(c.textFill, [[T.to2, INK], [T.to2 + 0.15, WHITE]]);
        }
      }
      var cur = cursor(c6, V ? 4.5 * u : 2.8 * u), cy0 = y0 + ch * 0.5, cxx = x0 + cw * 0.55;
      anim(P(cur), [[S.s6 + 0.6, [cxx, cy0], 'io'], [T.to2 - 0.1, [cxx, cy0 + 3 * (ch + gapY)]]]);
      anim(OP(cur), [[S.s6 + 0.2, 0], [S.s6 + 0.6, 100], [S.s7 - 0.6, 100], [S.s7 - 0.3, 0]]);
      anim(SC(cur), [[T.to2 - 0.09, [100, 100]], [T.to2, [85, 85]], [T.to2 + 0.09, [100, 100]]], 'io');
    })();

    // Scène 7 : trois iPhone montent, « Apple Store Kolwezi » se dévoile lettre par lettre
    OFF = 29.3;
    var c7 = sceneComp('07 Apple Store Kolwezi', 29.3, DUR);
    (function () {
      var h = V ? 95 * u : 60 * u, yBase = V ? H - h * 0.72 + h / 2 : H - h * 0.55 + h / 2;
      var P3 = [['glacier', -1.25 * RATIO * h + RATIO * h * 0.46, 0.92, 0.2], ['noir', 0.25 * RATIO * h + RATIO * h * 0.46, 0.92, 0.3], ['bordeaux', 0, 1, 0]];
      for (var i = 0; i < 3; i++) {
        var y = yBase + (P3[i][2] < 1 ? 4 * u : 0);
        var ph = phone(c7, P3[i][0], cx + P3[i][1], y, h * P3[i][2]);
        spring(P(ph), S.s7 + P3[i][3], [cx + P3[i][1], y + H * 0.7], [cx + P3[i][1], y], 1.3, 0.015);
      }
      var ty = V ? 43 * u : 16 * u, ts = (V ? 6.4 : 4.6) * u;
      var dispo = txt(c7, 'Disponible maintenant chez', (V ? 3.6 : 2.8) * u, GREY2, F_MED, 'C', cx, ty - (V ? 7.5 : 5) * u, 0);
      fadeIn(dispo, S.s7 + 0.4, S.s7 + 0.9, 20);
      var a = txt(c7, 'Apple Store', ts, INK, F_SEMI, 'L', 0, ty, -25);
      var b = txt(c7, 'Kolwezi', ts, GREY, F_SEMI, 'L', 0, ty, -25);
      AN(b).setValue([AN(b).value[0], AN(a).value[1]]); // même ligne de base que « Apple Store »
      var sp = ts * 0.26, tot = width(a) + sp + width(b), x = cx - tot / 2;
      P(a).setValue([x, ty + ts * 0.6]); P(b).setValue([x + width(a) + sp, ty + ts * 0.6]);
      function reveal(l, t0, n) {
        var anims = l.property('ADBE Text Properties').property('ADBE Text Animators');
        var an = anims.addProperty('ADBE Text Animator');
        an.name = 'Dévoilement lettre par lettre';
        var props = anims.property(an.propertyIndex).property('ADBE Text Animator Properties');
        props.addProperty('ADBE Text Opacity');
        props.addProperty('ADBE Text Position 3D');
        props.addProperty('ADBE Text Blur');
        props = anims.property(an.propertyIndex).property('ADBE Text Animator Properties');
        props.property('ADBE Text Opacity').setValue(0);
        props.property('ADBE Text Position 3D').setValue([0, ts * 0.45, 0]);
        props.property('ADBE Text Blur').setValue([20, 20]);
        var sels = anims.property(an.propertyIndex).property('ADBE Text Selectors');
        var se = sels.addProperty('ADBE Text Selector');
        se = anims.property(an.propertyIndex).property('ADBE Text Selectors').property(se.propertyIndex);
        anim(se.property('ADBE Text Percent Start'), [[t0, 0], [t0 + 0.04 * n + 0.6, 100]], 'soft');
      }
      reveal(a, T.store, 12);
      reveal(b, T.store + 0.7, 7);
      // Reflet lumineux qui passe sur le nom
      var lays = [a, b];
      for (i = 0; i < 2; i++) {
        try {
          var sw = fx(lays[i], 'CC Light Sweep');
          sw = lays[i].property('ADBE Effect Parade').property(sw.propertyIndex);
          var ctr = byType(sw, PropertyValueType.TwoD_SPATIAL);
          var r = lays[i].sourceRectAtTime(0, false);
          anim(ctr, [[T.store + 1.2, [r.left - ts * 2, r.top + r.height / 2]], [T.store + 2.2, [r.left + r.width + ts * 2, r.top + r.height / 2]]], 'io');
        } catch (e) {}
      }
      var line = roundRect(c7, 'Trait sous le nom', cx, ty + ts * 1.45 + Math.max(4, 0.25 * u) / 2, (V ? 18 : 12) * u, Math.max(4, 0.25 * u), 2, INK);
      OP(line.layer).setValue(85);
      anim(SC(line.layer), [[T.store + 1.0, [0, 100], 'io'], [T.store + 1.7, [100, 100]]]);
    })();

    // Composition principale
    OFF = 0;
    var main = proj.items.addComp('Présentation iPhone 18 Pro Max ' + tag, W, H, 1, DUR, FPS);
    main.parentFolder = ROOT; main.motionBlur = true; main.bgColor = LIGHT;
    var bg = main.layers.addSolid(LIGHT, 'Fond clair', W, H, 1, DUR);
    var dk = main.layers.addSolid(DARK, 'Fond sombre (scène couleurs)', W, H, 1, DUR);
    anim(OP(dk), [[S.s3 - 0.35, 0, 'io'], [S.s3 + 0.15, 100], [S.s4 - 0.4, 100, 'io'], [S.s4 + 0.05, 0]]);
    function place(c, a, envIn, envOut) {
      var l = main.layers.add(c);
      l.startTime = a;
      if (envIn) {
        var bl = blur(l), e0 = envIn - 0.05, e1 = envIn + 0.35;
        anim(OP(l), [[e0, 0], [e1, 100]]); anim(bl, [[e0, 20], [e1, 0]]);
        anim(SC(l), [[e0, [103, 103]], [e1, [100, 100]]]);
        if (envOut) {
          var o0 = envOut - 0.35, o1 = envOut + 0.05;
          anim(OP(l), [[o0, 100, 'io'], [o1, 0]]); anim(bl, [[o0, 0, 'io'], [o1, 24]]);
          anim(SC(l), [[o0, [100, 100], 'io'], [o1, [97, 97]]]);
        }
      }
      return l;
    }
    var L1 = place(c1, 0);
    anim(SC(L1), [[0, [108, 108], 'out'], [S.s2, [100, 100]]]);
    var b1 = blur(L1);
    anim(OP(L1), [[S.s3 - 0.55, 100, 'io'], [S.s3 - 0.1, 0]]); anim(b1, [[S.s3 - 0.55, 0, 'io'], [S.s3 - 0.1, 20]]);
    place(c3, 6.4);
    place(c4, 12.3, S.s4, S.s5);
    place(c5, 21.3, S.s5, S.s6);
    place(c6, 25.9, S.s6, S.s7);
    place(c7, 29.3, S.s7);
    // Sons séparés ; le mix final (identique à la vidéo livrée) est coupé, à activer si besoin
    var names = [['bruitages', 'Bruitages'], ['musique', 'Musique'], ['voix', 'Voix Hugo'], ['mix', 'Mix final (coupé)']];
    for (var i = 0; i < names.length; i++) {
      var al = main.layers.add(AUD[names[i][0]]);
      al.name = names[i][1];
      if (names[i][0] === 'mix') al.audioEnabled = false;
    }
    // Repères de scène
    var marks = [[0, '1 · Voici l’iPhone 18 Pro Max'], [S.s2, '2 · Design unibody en aluminium'], [S.s3, '3 · Noir, argent, glacier, bordeaux'],
      [S.s4, '4 · Caméra Fusion 48 Mpx, ouverture variable'], [S.s5, '5 · Puce A20 Pro, 43 h de vidéo'], [S.s6, '6 · Jusqu’à 2 To'], [S.s7, '7 · Apple Store Kolwezi']];
    for (i = 0; i < marks.length; i++) main.markerProperty.setValueAtTime(marks[i][0], new MarkerValue(marks[i][1]));
    return main;
  }

  var m1 = build(false);
  var m2 = build(true);
  app.endUndoGroup();
  m1.openInViewer();
  var out = new File(BASE.fsName + '/Presentation-iPhone18.aep');
  try { proj.save(out); } catch (e) {}
})();
