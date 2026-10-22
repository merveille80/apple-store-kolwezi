// Présentation iPhone 18 Pro Max sans voix · Apple Store Kolwezi
// Construit le projet After Effects éditable d'UN format (variable FORMAT : '9x16' ou '16x9', 9:16 par défaut) :
// une composition principale (2160×3840 ou 3840×2160, 60 i/s, 26 s), une composition par scène, images clés natives,
// calques texte, formes, photos et sons séparés. Reprend les minutages de src/Video.jsx (Remotion), calés sur la musique
// (118 BPM, 1 temps = 0,5085 s). Enregistre Presentation-SansVoix-9x16.aep ou -16x9.aep à côté du script.
// Utilisation : lancer Construire-9x16.jsx ou Construire-16x9.jsx (Fichier > Scripts > Exécuter le fichier de script…),
// avec les dossiers images/ et audio/ à côté.

(function () {
  var BASE = File($.fileName).parent;
  var FMT = (typeof FORMAT !== 'undefined') ? FORMAT : '9x16';
  var V = FMT === '9x16';
  var FPS = 60, DUR = 26.0, TB = 60 / 118;
  function B(n) { return n * TB; }
  var K = 2; // la maquette est en 1080 px, le projet en 4K
  var W0 = V ? 1080 : 1920, H0 = V ? 1920 : 1080, W = W0 * K, H = H0 * K;
  var IMG_W = 825, IMG_H = 1730, HAND_TIP = [155, 59];

  function rgb(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }
  var INK = rgb('#1d1d1f'), GREY = rgb('#86868b'), GREY2 = rgb('#8e8e93'), BLUE = rgb('#0071e3'), SKY = rgb('#5ab0ff'),
    WHITE = [1, 1, 1], BLACK = rgb('#0b0b0c'), CARD = rgb('#151517'), NAVY = rgb('#2c3e66'), GREEN = rgb('#30d158'), PALE = rgb('#eaf3ff'), RING = rgb('#d2d2d7');

  function pickFont(list) {
    for (var i = 0; i < list.length; i++) {
      try { if (app.fonts.getFontsByPostScriptName(list[i]).length > 0) return list[i]; } catch (e) {}
    }
    return list[list.length - 1];
  }
  var F_MED = pickFont(['InterDisplay-Medium', 'SFProDisplay-Medium', 'HelveticaNeue-Medium']);
  var F_SEMI = pickFont(['InterDisplay-SemiBold', 'SFProDisplay-Semibold', 'HelveticaNeue-Medium']);
  var F_BOLD = pickFont(['InterDisplay-Bold', 'SFProDisplay-Bold', 'HelveticaNeue-Bold']);

  app.beginUndoGroup('Présentation sans voix ' + FMT);
  var proj = app.project;
  function folder(name, parent) { var f = proj.items.addFolder(name); if (parent) f.parentFolder = parent; return f; }
  var SCENES = folder('Scènes ' + (V ? '9:16' : '16:9'));
  var MEDIA = folder('Médias');
  function imp(rel) {
    var f = new File(BASE.fsName + '/' + rel);
    if (!f.exists) throw new Error('Fichier introuvable : ' + f.fsName);
    var it = proj.importFile(new ImportOptions(f));
    it.parentFolder = MEDIA;
    return it;
  }
  var IMG = {noir: imp('images/noir-dos.png'), argent: imp('images/argent-dos.png'), glacier: imp('images/glacier-dos.png'), bordeaux: imp('images/bordeaux-dos.png'), main: imp('images/main.png'), puce: imp('images/a20-puce.png')};
  var AUD = {musique: imp('audio/musique.wav'), bruitages: imp('audio/bruitages.wav'), mix: imp('audio/mix-final.wav')};

  // ---------- Images clés ----------
  var OFF = 0; // début de la scène courante dans la composition principale
  function nDim(p) {
    var t = p.propertyValueType;
    if (t === PropertyValueType.TwoD) return 2;
    if (t === PropertyValueType.ThreeD) return 3;
    return 1;
  }
  function easeArr(n, inf) { var a = []; for (var i = 0; i < n; i++) a.push(new KeyframeEase(0, Math.max(0.1, Math.min(100, inf)))); return a; }
  var MODES = {out: [8, 88], io: [65, 65], 'in': [85, 12], soft: [33, 33], lin: [0.1, 0.1]};
  // keys : [[temps absolu, valeur, mode du segment qui suit]]
  function anim(p, keys, mode) {
    var i, idx = [];
    for (i = 0; i < keys.length; i++) p.setValueAtTime(Math.max(0, keys[i][0] - OFF), keys[i][1]);
    for (i = 0; i < keys.length; i++) idx.push(p.nearestKeyIndex(Math.max(0, keys[i][0] - OFF)));
    var n = nDim(p);
    for (i = 0; i < keys.length - 1; i++) {
      var m = MODES[keys[i][2] || mode || 'out'];
      if (m === MODES.lin) {
        p.setInterpolationTypeAtKey(idx[i], p.keyInInterpolationType(idx[i]), KeyframeInterpolationType.LINEAR);
        p.setInterpolationTypeAtKey(idx[i + 1], KeyframeInterpolationType.LINEAR, p.keyOutInterpolationType(idx[i + 1]));
        continue;
      }
      p.setTemporalEaseAtKey(idx[i], p.keyInTemporalEase(idx[i]), easeArr(n, m[0]));
      p.setTemporalEaseAtKey(idx[i + 1], easeArr(n, m[1]), p.keyOutTemporalEase(idx[i + 1]));
    }
    if (p.isSpatial) {
      for (i = 0; i < idx.length; i++) {
        try {
          p.setSpatialAutoBezierAtKey(idx[i], false); p.setSpatialContinuousAtKey(idx[i], false);
          var z = []; for (var k = 0; k < p.value.length; k++) z.push(0);
          p.setSpatialTangentsAtKey(idx[i], z, z);
        } catch (e) {}
      }
    }
  }
  function hold(p, keys) {
    for (var i = 0; i < keys.length; i++) {
      p.setValueAtTime(Math.max(0, keys[i][0] - OFF), keys[i][1]);
      var k = p.nearestKeyIndex(Math.max(0, keys[i][0] - OFF));
      p.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
    }
  }
  function lerpV(a, b, k) {
    if (a instanceof Array) { var r = []; for (var i = 0; i < a.length; i++) r.push(a[i] + (b[i] - a[i]) * k); return r; }
    return a + (b - a) * k;
  }
  // Ressort : dépassement puis retour (équivalent des springs Remotion)
  function spring(p, t0, from, to, dur, ov) {
    if (ov === undefined) ov = 0.08;
    anim(p, [[t0, from, 'out'], [t0 + dur * 0.45, lerpV(from, to, 1 + ov), 'io'], [t0 + dur * 0.75, lerpV(from, to, 1 - ov * 0.3), 'io'], [t0 + dur, to]]);
  }

  // ---------- Calques ----------
  function T_(l) { return l.property('ADBE Transform Group'); }
  function P(l) { return T_(l).property('ADBE Position'); }
  function SC(l) { return T_(l).property('ADBE Scale'); }
  function OP(l) { return T_(l).property('ADBE Opacity'); }
  function AN(l) { return T_(l).property('ADBE Anchor Point'); }
  function RO(l) { return T_(l).property('ADBE Rotate Z'); }
  function fx(l, match) { var e = l.property('ADBE Effect Parade').addProperty(match); return l.property('ADBE Effect Parade').property(e.propertyIndex); }
  function byType(eff, type, nth) {
    var c = 0;
    for (var i = 1; i <= eff.numProperties; i++) { var q = eff.property(i); if (q.propertyValueType === type) { if (c === (nth || 0)) return q; c++; } }
    return null;
  }
  function shadow(l, op, dist, soft, color) {
    var e = fx(l, 'ADBE Drop Shadow');
    if (color) e.property('ADBE Drop Shadow-0001').setValue(color);
    var o = e.property('ADBE Drop Shadow-0002'); o.setValue(o.hasMax && o.maxValue > 100 ? op / 100 * o.maxValue : op);
    e.property('ADBE Drop Shadow-0003').setValue(180);
    e.property('ADBE Drop Shadow-0004').setValue(dist * K);
    e.property('ADBE Drop Shadow-0005').setValue(soft * K);
    return e;
  }
  function blurP(l) {
    for (var i = 1; i <= l.property('ADBE Effect Parade').numProperties; i++) {
      var q = l.property('ADBE Effect Parade').property(i);
      if (q.matchName === 'ADBE Gaussian Blur 2') return q.property('ADBE Gaussian Blur 2-0001');
    }
    // Un flou neuf d'AE 2026 démarre à 25 avec « Recopier les pixels du contour » : tout remettre à 0
    var e = fx(l, 'ADBE Gaussian Blur 2'); e.property('ADBE Gaussian Blur 2-0003').setValue(0); e.property('ADBE Gaussian Blur 2-0001').setValue(0);
    return e.property('ADBE Gaussian Blur 2-0001');
  }
  function px(v) { return v * K; }
  function pt(x, y) { return [x * K, y * K]; }

  function nul(comp, name, x, y) {
    var l = comp.layers.addNull(); l.name = name; l.enabled = false;
    AN(l).setValue([0, 0]); P(l).setValue(pt(x, y));
    return l;
  }
  function phone(comp, c, x, y, h) {
    var l = comp.layers.add(IMG[c]);
    l.name = 'iPhone ' + c;
    var s = px(h) / IMG_H * 100; SC(l).setValue([s, s]);
    P(l).setValue(pt(x, y)); l.motionBlur = true;
    shadow(l, 16, h * 0.04, h * 0.05);
    return l;
  }
  // Texte centré sur (x, y) ; just : 'C', 'L' ou 'R'
  function txt(comp, str, size, color, font, x, y, just, track) {
    var l = comp.layers.addText(str);
    var p = l.property('ADBE Text Properties').property('ADBE Text Document');
    var d = p.value;
    try { d.resetCharStyle(); d.resetParagraphStyle(); } catch (e) {}
    d.font = font; d.fontSize = px(size); d.applyFill = true; d.fillColor = color; d.applyStroke = false;
    d.tracking = track === undefined ? -25 : track;
    d.justification = ParagraphJustification.CENTER_JUSTIFY; if (just === 'L') d.justification = ParagraphJustification.LEFT_JUSTIFY; if (just === 'R') d.justification = ParagraphJustification.RIGHT_JUSTIFY;
    p.setValue(d);
    l.name = str;
    // Ancre calculée en direct : le rectangle lu par script juste après setValue est périmé
    AN(l).expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width * ' + (just === 'L' ? 0 : (just === 'R' ? 1 : 0.5)) + ', r.top + r.height / 2]';
    P(l).setValue(pt(x, y)); l.motionBlur = true;
    return l;
  }
  function q(str) { return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; }
  function vecGroup(l, name) { var g = l.property('ADBE Root Vectors Group').addProperty('ADBE Vector Group'); g.name = name; return g.propertyIndex; }
  function vecs(l, gi) { return l.property('ADBE Root Vectors Group').property(gi).property('ADBE Vectors Group'); }
  function addRect(l, gi, w, h, r) {
    var i = vecs(l, gi).addProperty('ADBE Vector Shape - Rect').propertyIndex;
    vecs(l, gi).property(i).property('ADBE Vector Rect Size').setValue(pt(w, h));
    vecs(l, gi).property(i).property('ADBE Vector Rect Roundness').setValue(px(r));
  }
  function addEllipse(l, gi, d, x, y) {
    var i = vecs(l, gi).addProperty('ADBE Vector Shape - Ellipse').propertyIndex;
    vecs(l, gi).property(i).property('ADBE Vector Ellipse Size').setValue(pt(d, d));
    if (x !== undefined) vecs(l, gi).property(i).property('ADBE Vector Ellipse Position').setValue(pt(x, y));
  }
  function addPath(l, gi, verts, inT, outT, closed) {
    var i = vecs(l, gi).addProperty('ADBE Vector Shape - Group').propertyIndex;
    var s = new Shape(), v = [], a = [], b = [];
    for (var k = 0; k < verts.length; k++) {
      v.push(pt(verts[k][0], verts[k][1]));
      a.push(inT ? pt(inT[k][0], inT[k][1]) : [0, 0]); b.push(outT ? pt(outT[k][0], outT[k][1]) : [0, 0]);
    }
    s.vertices = v; s.inTangents = a; s.outTangents = b; s.closed = !!closed;
    vecs(l, gi).property(i).property('ADBE Vector Shape').setValue(s);
  }
  function addFill(l, gi, color) {
    var i = vecs(l, gi).addProperty('ADBE Vector Graphic - Fill').propertyIndex;
    vecs(l, gi).property(i).property('ADBE Vector Fill Color').setValue(color);
    return vecs(l, gi).property(i).property('ADBE Vector Fill Color');
  }
  function addStroke(l, gi, color, w, round) {
    var i = vecs(l, gi).addProperty('ADBE Vector Graphic - Stroke').propertyIndex;
    var st = vecs(l, gi).property(i);
    st.property('ADBE Vector Stroke Color').setValue(color);
    st.property('ADBE Vector Stroke Width').setValue(px(w));
    if (round) { try { st.property('ADBE Vector Stroke Line Cap').setValue(2); } catch (e) {} }
    return st;
  }
  function addTrim(l, gi) {
    var i = vecs(l, gi).addProperty('ADBE Vector Filter - Trim').propertyIndex;
    return vecs(l, gi).property(i).property('ADBE Vector Trim End');
  }
  function shapeLayer(comp, name, x, y) {
    var l = comp.layers.addShape(); l.name = name; AN(l).setValue([0, 0]); P(l).setValue(pt(x, y)); l.motionBlur = true;
    return l;
  }
  function roundRect(comp, name, x, y, w, h, r, color) {
    var l = shapeLayer(comp, name, x, y), gi = vecGroup(l, name);
    addRect(l, gi, w, h, r);
    var f = addFill(l, gi, color);
    return {layer: l, fill: f, gi: gi};
  }
  function circle(comp, name, x, y, d, color) {
    var l = shapeLayer(comp, name, x, y), gi = vecGroup(l, name);
    addEllipse(l, gi, d);
    var f = addFill(l, gi, color);
    return {layer: l, fill: f, gi: gi};
  }
  function glow(comp, name, x, y, r, color, op) {
    var g = circle(comp, name, x, y, r * 2, color);
    var b = blurP(g.layer); b.setValue(px(r * 0.45));
    OP(g.layer).setValue(op);
    g.layer.motionBlur = false;
    return g.layer;
  }

  // Entrée floue → nette (signature de la référence) et sortie inverse, sur un ou plusieurs calques
  function blurIn(ls, t0, d, o) {
    o = o || {}; if (!(ls instanceof Array)) ls = [ls];
    var s0 = o.s0 === undefined ? 0.86 : o.s0, bl = o.blur === undefined ? 26 : o.blur;
    for (var i = 0; i < ls.length; i++) {
      var l = ls[i];
      anim(OP(l), [[t0, 0], [t0 + d * 0.6, o.op === undefined ? 100 : o.op]], 'soft');
      if (bl) anim(blurP(l), [[t0, px(bl)], [t0 + d, 0]]);
      if (!o.noMove) {
        var s = SC(l).value, p = P(l).value;
        anim(SC(l), [[t0, [s[0] * s0, s[1] * s0]], [t0 + d, s]]);
        if (o.dx || o.dy) anim(P(l), [[t0, [p[0] + px(o.dx || 0), p[1] + px(o.dy || 0)]], [t0 + d, p]]);
      }
    }
  }
  function blurOut(ls, t0, d, o) {
    o = o || {}; if (!(ls instanceof Array)) ls = [ls];
    var s1 = o.s1 === undefined ? 1.08 : o.s1, bl = o.blur === undefined ? 30 : o.blur;
    for (var i = 0; i < ls.length; i++) {
      var l = ls[i];
      var op = OP(l).numKeys ? OP(l).keyValue(OP(l).numKeys) : OP(l).value;
      anim(OP(l), [[t0, op], [t0 + d, 0]], 'in');
      if (bl) { var bp = blurP(l), b0 = bp.numKeys ? bp.keyValue(bp.numKeys) : bp.value; anim(bp, [[t0, b0], [t0 + d, b0 + px(bl)]], 'in'); }
      if (!o.noMove) {
        var s = SC(l).numKeys ? SC(l).keyValue(SC(l).numKeys) : SC(l).value;
        var p = P(l).numKeys ? P(l).keyValue(P(l).numKeys) : P(l).value;
        anim(SC(l), [[t0, s], [t0 + d, [s[0] * s1, s[1] * s1]]], 'in');
        if (o.dx || o.dy) anim(P(l), [[t0, p], [t0 + d, [p[0] + px(o.dx || 0), p[1] + px(o.dy || 0)]]], 'in');
      }
    }
  }
  // Mots qui arrivent un par un, centrés sur (cx, cy)
  function words(comp, list, size, color, font, cx, cy) {
    var ls = [], names = [], gap = size * 0.26, i;
    for (i = 0; i < list.length; i++) {
      var l = txt(comp, list[i][0], size, list[i][2] || color, font, 0, cy, 'L');
      l.name = 'Mot · ' + list[i][0]; ls.push(l); names.push(q(l.name));
    }
    for (i = 0; i < ls.length; i++) {
      P(ls[i]).setValue(pt(0, cy));
      blurIn(ls[i], list[i][1], 0.4, {dy: size * 0.35, s0: 0.9, blur: 18});
      // Mots centrés ensemble sur cx, largeurs mesurées en direct (modifier un mot recentre le titre)
      P(ls[i]).expression = 'var n = [' + names.join(', ') + '], g = ' + px(gap) + ', w = [], t = 0, i;\n' +
        'for (i = 0; i < n.length; i++) { var r = thisComp.layer(n[i]).sourceRectAtTime(0, false); w.push(r.width); t += r.width; }\n' +
        'var x = ' + px(cx) + ' - (t + g * (n.length - 1)) / 2;\nfor (i = 0; i < ' + i + '; i++) x += w[i] + g;\nvalue + [x, 0]';
    }
    return ls;
  }
  function hand(comp) {
    var l = comp.layers.add(IMG.main); l.name = 'Main (curseur)';
    AN(l).setValue(HAND_TIP); var s = px(90) / 360 * 100; SC(l).setValue([s, s]); l.motionBlur = true;
    return l;
  }
  // Déplacements de la main : [[t, x, y, clic]]
  function handMoves(l, keys, tIn, tOut) {
    var k = [], i;
    for (i = 0; i < keys.length; i++) k.push([keys[i][0], pt(keys[i][1], keys[i][2]), 'io']);
    anim(P(l), k);
    var s = SC(l).value;
    for (i = 0; i < keys.length; i++) if (keys[i][3]) {
      var t = keys[i][0];
      anim(SC(l), [[t - 0.08, s, 'io'], [t, [s[0] * 0.86, s[1] * 0.86], 'io'], [t + 0.14, s]]);
    }
    anim(OP(l), [[tIn, 0], [tIn + 0.25, 100]], 'soft');
    anim(OP(l), [[tOut - 0.3, 100], [tOut, 0]], 'soft');
  }

  // ---------- Compositions de scène ----------
  function sceneComp(name, a, b) {
    var c = proj.items.addComp(name, W, H, 1, b - a, FPS);
    c.parentFolder = SCENES; c.motionBlur = true; c.bgColor = WHITE;
    c.shutterAngle = 180; OFF = a;
    return c;
  }
  var cx = W0 / 2;
  var built = [];

  // 1 · Hook : point bleu → Dynamic Island
  (function () {
    var a = 0, b = B(5) + 0.4, c = sceneComp('1 · Il est arrivé', a, b);
    var cy = V ? H0 * 0.47 : H0 * 0.52;
    var t1 = words(c, [['Il est', B(2)], ['arrivé.', B(2.5)]], 64, GREY, F_SEMI, cx, cy - 190);
    blurOut(t1, B(4.75), 0.28, {dy: -40});
    var g = nul(c, 'Pastille (déplacer ici)', cx, cy);
    var pill = roundRect(c, 'Dynamic Island', 0, 0, 760, 150, 75, BLACK);
    pill.layer.parent = g; P(pill.layer).setValue([0, 0]);
    var size = vecs(pill.layer, pill.gi).property(1).property('ADBE Vector Rect Size');
    var rnd = vecs(pill.layer, pill.gi).property(1).property('ADBE Vector Rect Roundness');
    anim(size, [[B(1), pt(70, 70)], [B(1) + 0.5, pt(760, 150)]]);
    anim(rnd, [[B(1), px(35)], [B(1) + 0.5, px(75)]]);
    hold(pill.fill, [[0, BLUE], [B(1) + 0.02, BLACK]]);
    shadow(pill.layer, 25, 30, 70);
    blurIn(pill.layer, 0.05, 0.45, {s0: 0.2, blur: 30});
    var th = phone(c, 'bordeaux', -380 + 26 + 25, 0, 104); th.parent = g; P(th).setValue(pt(-380 + 26 + 25, 0));
    th.property('ADBE Effect Parade').property(1).remove();
    var l1 = txt(c, 'Nouveau', 30, GREY2, F_MED, -380 + 26 + 50 + 26, -22, 'L', 0); l1.parent = g; P(l1).setValue(pt(-380 + 102, -22));
    var l2 = txt(c, 'iPhone 18 Pro Max', 46, WHITE, F_SEMI, 0, 18, 'L', -20); l2.parent = g; P(l2).setValue(pt(-380 + 102, 18));
    var dot = circle(c, 'Point bleu', 0, 0, 64, BLUE); dot.layer.parent = g; P(dot.layer).setValue(pt(380 - 26 - 32, 0));
    shadow(dot.layer, 85, 0, 30, BLUE);
    SC(dot.layer).expression = 'var s = 100 + 8 * Math.sin(time * 9); [s, s]';
    var content = [th, l1, l2, dot.layer];
    blurIn(content, B(1) + 0.25, 0.35, {blur: 14, s0: 0.95, noMove: true});
    blurOut([pill.layer].concat(content), B(5), 0.32, {noMove: true, blur: 16});
    anim(SC(g), [[B(5), [100, 100], 'in'], [B(5) + 0.32, [40, 40]]]);
    anim(P(g), [[B(5), pt(cx, cy), 'in'], [B(5) + 0.32, pt(cx, cy - H0 * 0.18)]]);
    built.push([c, a, b, '1 · Il est arrivé']);
  })();

  // 2 · Révélation sur le drop
  (function () {
    var a = B(5.9), b = B(9) + 0.35, c = sceneComp('2 · Révélation', a, b);
    var ph = V ? 1080 : 640, cy = V ? H0 * 0.43 : H0 * 0.42;
    var gl = glow(c, 'Halo', cx, cy, ph * 0.48, rgb('#787887'), 0);
    anim(OP(gl), [[B(6), 0], [B(6) + 0.6, 16]]);
    var p = phone(c, 'bordeaux', cx, cy, ph);
    var s = SC(p).value;
    anim(P(p), [[B(6) - 0.06, pt(cx, cy + H0 * 0.55)], [B(6) + 0.75, pt(cx, cy)]]);
    anim(SC(p), [[B(6) - 0.06, [s[0] * 1.28, s[1] * 1.28]], [B(6) + 0.75, s, 'io'], [B(9), [s[0] * 0.97, s[1] * 0.97]]]);
    anim(RO(p), [[B(6) - 0.06, -9], [B(6) + 0.75, -4, 'io'], [B(9), -2]]);
    anim(OP(p), [[B(6) - 0.06, 0], [B(6) + 0.2, 100]], 'soft');
    anim(blurP(p), [[B(6) - 0.06, px(40)], [B(6) + 0.75, 0]]);
    var tl = words(c, [['iPhone', B(7)], ['18', B(7.5)], ['Pro', B(8)], ['Max', B(8.5)]], V ? 118 : 96, INK, F_BOLD, cx, V ? H0 * 0.8 : H0 * 0.88);
    blurOut([p, gl].concat(tl), B(9) - 0.05, 0.32, {dy: -120, s1: 1.06});
    built.push([c, a, b, '2 · iPhone 18 Pro Max (drop)']);
  })();

  // 3 · Les 4 couleurs
  (function () {
    var a = B(9), b = B(16), c = sceneComp('3 · Couleurs', a, b);
    var COLS = [['noir', 'Noir', '#2b2b2d'], ['argent', 'Argent', '#e3e4e6'], ['glacier', 'Glacier', '#a9c3e0'], ['bordeaux', 'Bordeaux', '#5e1f2c']];
    var CL = [B(10.5), B(11.5), B(12.5), B(13.5)];
    var ph = V ? 960 : 720, pcx = V ? cx : W0 * 0.36, pcy = V ? H0 * 0.38 : H0 * 0.5;
    var ux = V ? cx : W0 * 0.68, uy = V ? H0 * 0.8 : H0 * 0.6;
    var cam = nul(c, 'Zoom vers la caméra', pcx, pcy - ph * 0.3);
    var phones = [], i;
    for (i = 0; i < 4; i++) {
      var p = phone(c, COLS[i][0], pcx, pcy, ph); p.parent = cam; P(p).setValue(pt(0, ph * 0.3));
      phones.push(p);
      if (i === 0) blurIn(p, B(9), 0.5, {dy: 140, blur: 24});
      else {
        anim(P(p), [[CL[i], pt(520, ph * 0.3)], [CL[i] + 0.38, pt(0, ph * 0.3)]]);
        anim(RO(p), [[CL[i], 8], [CL[i] + 0.38, 0]]);
        anim(OP(p), [[CL[i] - 0.01, 0], [CL[i] + 0.24, 100]], 'soft');
        anim(blurP(p), [[CL[i], px(22)], [CL[i] + 0.38, 0]]);
      }
      if (i < 3) {
        var t = CL[i + 1];
        anim(P(p), [[t, pt(0, ph * 0.3)], [t + 0.3, pt(-520, ph * 0.3)]], 'in');
        anim(RO(p), [[t, 0], [t + 0.3, -8]], 'in');
        anim(OP(p), [[t, 100], [t + 0.3, 0]], 'in');
        anim(blurP(p), [[t, 0], [t + 0.3, px(22)]], 'in');
      }
    }
    anim(SC(cam), [[B(15.3), [100, 100], 'in'], [B(16), [320, 320]]]);
    anim(OP(phones[3]), [[B(15.3), 100], [B(16), 10]], 'in');
    // Libellé de couleur (un calque par couleur, en fondu flou)
    var ly = uy - (V ? 150 : 190), labels = [];
    for (i = 0; i < 4; i++) {
      var lb = txt(c, COLS[i][1], V ? 70 : 76, INK, F_SEMI, ux, ly, 'C');
      labels.push(lb);
      blurIn(lb, i === 0 ? B(9.8) : CL[i], 0.35, {dy: 30});
      if (i < 3) anim(OP(lb), [[CL[i + 1], 100], [CL[i + 1] + 0.12, 0]], 'in');
    }
    // Sélecteur
    var dot = 92, gap = 54, padX = 46, cw = 4 * dot + 3 * gap + 2 * padX;
    var card = roundRect(c, 'Sélecteur de couleur', ux, uy, cw, dot + 68, (dot + 68) / 2, WHITE);
    shadow(card.layer, 9, 20, 60);
    var dots = [];
    for (i = 0; i < 4; i++) {
      var dx = ux - cw / 2 + padX + dot / 2 + i * (dot + gap);
      var d = circle(c, 'Pastille ' + COLS[i][1], dx, uy, dot, rgb(COLS[i][2]));
      addStroke(d.layer, d.gi, [0, 0, 0], 2).property('ADBE Vector Stroke Opacity').setValue(8);
      dots.push(d.layer);
      anim(SC(d.layer), [[CL[i], [100, 100], 'io'], [CL[i] + 0.1, [114, 114], 'io'], [CL[i] + 0.25, [100, 100]]]);
    }
    var ring = shapeLayer(c, 'Anneau de sélection', 0, uy), rg = vecGroup(ring, 'Anneau');
    addEllipse(ring, rg, dot + 19); addStroke(ring, rg, BLUE, 3);
    var rk = []; for (i = 0; i < 4; i++) rk.push([CL[i], pt(ux - cw / 2 + padX + dot / 2 + i * (dot + gap), uy)]);
    hold(P(ring), rk);
    anim(OP(ring), [[CL[0] - 0.01, 0], [CL[0], 100]], 'lin');
    blurIn([card.layer].concat(dots), B(9.5), 0.45, {dy: 60, s0: 0.8});
    var hd = hand(c);
    var hk = [[B(9.6), ux + 300, uy + 380]];
    for (i = 0; i < 4; i++) hk.push([CL[i], ux - cw / 2 + padX + dot / 2 + i * (dot + gap) + 8, uy + 10, true]);
    hk.push([B(14.6), ux + 360, uy + 420]);
    handMoves(hd, hk, B(9.6), B(14.6));
    blurOut([card.layer, ring, labels[3]].concat(dots), B(15), 0.3, {dy: 60});
    built.push([c, a, b, '3 · Noir, argent, glacier, bordeaux']);
  })();

  // 4 · Caméra : ouverture variable
  (function () {
    var a = B(15.8), b = B(22) + 0.3, c = sceneComp('4 · Caméra ouverture variable', a, b);
    var camH = V ? 2300 : 1500;
    var box = V ? [0, 0, W0, H0 * 0.58] : [0, 0, W0 * 0.52, H0];
    var p = c.layers.add(IMG.bordeaux); p.name = 'Gros plan caméra (bordeaux)';
    var s = px(camH) / IMG_H * 100; SC(p).setValue([s, s]); AN(p).setValue([0, 0]);
    var x0 = (V ? -0.04 : -0.08) * box[2], y0 = -camH * 0.02;
    anim(P(p), [[B(16), pt(x0, y0), 'lin'], [B(22), pt(x0 - 30, y0 - 20)]]);
    fx(p, 'ADBE Brightness & Contrast 2');
    // Masque : le gros plan occupe le haut (9:16) ou la gauche (16:9), bord intérieur fondu vers le blanc
    // (contour progressif ; les autres bords dépassent du cadre)
    var m = p.property('ADBE Mask Parade').addProperty('ADBE Mask Atom');
    var ms = new Shape(), sc = 100 / s, fe = (V ? box[3] : box[2]) * 0.3, mg = fe + 120;
    function lp(x, y) { return [(x - x0) * K * sc, (y - y0) * K * sc]; }
    var x1 = V ? W0 + mg : box[2] - fe / 2, y1 = V ? box[3] - fe / 2 : H0 + mg;
    ms.vertices = [lp(-mg, -mg), lp(x1, -mg), lp(x1, y1), lp(-mg, y1)]; ms.closed = true;
    m.property('ADBE Mask Shape').setValue(ms);
    m.property('ADBE Mask Feather').setValue([px(fe) * sc, px(fe) * sc]);
    blurIn(p, B(15.8), 0.45, {s0: 1.25, blur: 30, noMove: true});
    // Carte noire
    var cw = 900, ch = 560, ccx = V ? cx : W0 * 0.74, ccy = V ? H0 * 0.74 : H0 * 0.5;
    var g = nul(c, 'Carte (déplacer ici)', ccx, ccy);
    var card = roundRect(c, 'Carte noire', 0, 0, cw, ch, 56, CARD); card.layer.parent = g; P(card.layer).setValue([0, 0]);
    shadow(card.layer, 28, 30, 80);
    function inCard(l, x, y) { l.parent = g; P(l).setValue(pt(x - cw / 2, y - ch / 2)); return l; }
    var t1 = inCard(txt(c, 'Caméra Fusion 48 MP', 34, WHITE, F_MED, 0, 0, 'L', 0), 54, 70);
    var t2 = inCard(txt(c, 'Ouverture variable', 34, SKY, F_MED, 0, 0, 'R', 0), cw - 54, 70);
    var r = 250, acx = cw / 2, acy = ch * 0.78, A0 = Math.PI * 1.15, A1 = Math.PI * 1.85, N = 48, verts = [], i;
    for (i = 0; i <= N; i++) { var an = A0 + (A1 - A0) * i / N; verts.push([acx + Math.cos(an) * r - cw / 2, acy + Math.sin(an) * r - ch / 2]); }
    var arcBg = shapeLayer(c, 'Arc (fond)', 0, 0); arcBg.parent = g; P(arcBg).setValue([0, 0]);
    var ag = vecGroup(arcBg, 'Arc'); addPath(arcBg, ag, verts); addStroke(arcBg, ag, NAVY, 22, true);
    anim(addTrim(arcBg, ag), [[B(17), 0], [B(17.8), 100]]);
    // Curseur piloté par « Progression » (0 à 100) : l'arc bleu et le bouton suivent
    var ctl = nul(c, 'Contrôle ouverture', 0, 0);
    var sl = fx(ctl, 'ADBE Slider Control'); sl.name = 'Progression';
    var prog = sl.property(1);
    var STOPS = ['ƒ/1,48', 'ƒ/1,8', 'ƒ/2,8', 'ƒ/4,0'], ST = [B(18), B(19), B(20), B(21)];
    var pk = [[ST[0], 0, 'io']]; for (i = 1; i < 4; i++) { pk.push([ST[i] - 0.2, (i - 1) / 3 * 100, 'io']); pk.push([ST[i], i / 3 * 100, 'io']); }
    anim(prog, pk);
    var arc = shapeLayer(c, 'Arc (progression)', 0, 0); arc.parent = g; P(arc).setValue([0, 0]);
    var bg = vecGroup(arc, 'Arc'); addPath(arc, bg, verts); addStroke(arc, bg, SKY, 22, true);
    var te = addTrim(arc, bg); te.expression = 'thisComp.layer("Contrôle ouverture").effect("Progression")(1)';
    shadow(arc, 80, 0, 12, SKY);
    var knob = circle(c, 'Bouton', 0, 0, 68, BLUE); knob.layer.parent = g;
    addStroke(knob.layer, knob.gi, WHITE, 9);
    P(knob.layer).expression = 'var p = thisComp.layer("Contrôle ouverture").effect("Progression")(1) / 100;\n' +
      'var a = Math.PI * 1.15 + Math.PI * 0.7 * p;\n[' + px(acx - cw / 2) + ' + Math.cos(a) * ' + px(r) + ', ' + px(acy - ch / 2) + ' + Math.sin(a) * ' + px(r) + ']';
    anim(SC(knob.layer), [[B(17), [0, 0]], [B(17.8), [100, 100]]]);
    var vals = [];
    for (i = 0; i < 4; i++) {
      var vl = inCard(txt(c, STOPS[i], 96, WHITE, F_SEMI, 0, 0, 'C'), cw / 2, ch * 0.47 + 50);
      vals.push(vl);
      blurIn(vl, i === 0 ? B(17.6) : ST[i], 0.25, {dy: 24, blur: 10, s0: 0.96});
      if (i < 3) anim(OP(vl), [[ST[i + 1], 100], [ST[i + 1] + 0.06, 0]], 'lin');
    }
    var e1 = inCard(txt(c, 'ƒ/1,48', 30, GREY2, F_MED, 0, 0, 'L', 0), 70, ch - 58);
    var e2 = inCard(txt(c, 'ƒ/4,0', 30, GREY2, F_MED, 0, 0, 'R', 0), cw - 70, ch - 58);
    anim(OP(e1), [[B(17), 0], [B(17.8), 100]]); anim(OP(e2), [[B(17), 0], [B(17.8), 100]]);
    anim(byType(p.property('ADBE Effect Parade').property('ADBE Brightness & Contrast 2'), PropertyValueType.OneD, 0), [[ST[0], 0], [ST[3], -22]]);
    var cardLs = [card.layer, t1, t2, arcBg, arc, knob.layer, e1, e2];
    blurIn(cardLs, B(16.5), 0.5, {noMove: true});
    anim(P(g), [[B(16.5), pt(ccx, ccy + 160)], [B(17), pt(ccx, ccy)]]);
    blurOut(cardLs.concat([p, vals[3]]), B(22) - 0.05, 0.3, {noMove: true});
    anim(SC(g), [[B(22) - 0.05, [100, 100], 'in'], [B(22) + 0.25, [110, 110]]]);
    built.push([c, a, b, '4 · Caméra Fusion 48 MP, ouverture variable']);
  })();

  // 5 · Puce A20 Pro : la vraie puce (tracé Apple) en 3D, épaisseur métal, traits qui s'allument, reflet qui balaie
  (function () {
    var a = B(22.3), b = B(27) + 0.3, c = sceneComp('5 · Puce A20 Pro', a, b);
    var cy = V ? H0 * 0.4 : H0 * 0.36, sz = V ? 560 : 470, depth = 44, N = 10, t0 = B(22.5), i;
    var gl = glow(c, 'Halo bleu', cx, cy, 360, BLUE, 0);
    anim(OP(gl), [[B(23), 0], [B(24), 18]]);
    OP(gl).expression = 'value * (0.75 + 0.25 * Math.sin((time - ' + (t0 - a).toFixed(3) + ') * 3.2))';
    var sh = circle(c, 'Ombre au sol', cx, cy + sz * 0.18, 100, [0, 0, 0]);
    SC(sh.layer).setValue([sz * 1.05, sz * 0.5]); blurP(sh.layer).setValue(px(46));
    anim(OP(sh.layer), [[t0, 0], [t0 + 0.9, 42]]);
    // Caméra (une caméra AE vise toujours le centre de la composition)
    var cam = c.layers.addCamera('Caméra', [px(cx), px(cy)]);
    cam.property('ADBE Camera Options Group').property('ADBE Camera Zoom').setValue(px(1700));
    T_(cam).property('ADBE Position').setValue([W / 2, H / 2, -px(1700)]);
    T_(cam).property('ADBE Anchor Point').setValue([W / 2, H / 2, 0]);
    // Deux nuls 3D : inclinaison (X, Y, montée, échelle) puis rotation à plat (Z). Mouvement piloté par expressions.
    var R = 'var t0 = ' + (t0 - a).toFixed(3) + ', rise = easeOut(time, t0, t0 + 0.9, 0, 1), drift = linear(time, t0 + 0.9, ' + (B(27) - a).toFixed(3) + ', 0, 1);\n';
    var tilt = nul(c, 'Puce 3D · inclinaison (déplacer ici)', cx, cy); tilt.threeDLayer = true;
    P(tilt).expression = R + 'value - [0, (1 - rise) * ' + px(260) + ', 0]';
    T_(tilt).property('ADBE Rotate X').expression = R + '-(66 - 40 * rise - 8 * drift)';
    T_(tilt).property('ADBE Rotate Y').expression = R + '10 * (1 - rise) - 4 * Math.sin((time - t0) * 1.3)';
    spring(SC(tilt), t0, [62, 62, 62], [100, 100, 100], 0.8, 0.04);
    var spin = nul(c, 'Puce 3D · rotation', 0, 0); spin.threeDLayer = true; spin.setParentWithJump(tilt); P(spin).setValue([0, 0, 0]);
    RO(spin).expression = R + '-30 + 22 * rise + 6 * drift';
    function in3D(l, z) { l.threeDLayer = true; l.setParentWithJump(spin); P(l).setValue([0, 0, px(z)]); return l; }
    var parts = [];
    // Épaisseur : tranches de métal (de la plus profonde à la face)
    for (i = N - 1; i >= 0; i--) {
      var k = i / (N - 1);
      var sl = roundRect(c, 'Épaisseur ' + (i + 1), 0, 0, sz, sz, 6, lerpV(rgb('#8e8e93'), rgb('#2c2c2e'), k));
      parts.push(in3D(sl.layer, depth * (i + 1) / N));
    }
    var base = roundRect(c, 'Fond noir de la puce', 0, 0, sz, sz, 6, [0, 0, 0]); parts.push(in3D(base.layer, 0));
    function face(name) {
      var l = c.layers.add(IMG.puce); l.name = name;
      var s = px(sz) / 1440 * 100; in3D(l, 0); SC(l).setValue([s, s, s]); return l;
    }
    var dark = face('Puce A20 Pro (éteinte)'); OP(dark).setValue(32); parts.push(dark);
    var lit = face('Puce A20 Pro (allumée)'); parts.push(lit);
    // Les traits s'allument en diagonale
    var lw = fx(lit, 'ADBE Linear Wipe');
    byType(lw, PropertyValueType.OneD, 1).setValue(315);
    byType(lw, PropertyValueType.OneD, 2).setValue(360);
    anim(byType(lw, PropertyValueType.OneD, 0), [[B(23), 100, 'io'], [B(24.3), 0]]);
    // Reflet qui balaie la puce
    try {
      var sw = fx(lit, 'CC Light Sweep'); sw.property('CC Light Sweep-0002').setValue(45);
      anim(byType(sw, PropertyValueType.TwoD_SPATIAL), [[B(25), [-400, -400], 'io'], [B(26.3), [1840, 1840]]]);
    } catch (e) {}
    for (i = 0; i < parts.length; i++) {
      parts[i].motionBlur = true;
      anim(OP(parts[i]), [[t0, 0], [t0 + 0.25, parts[i] === dark ? 32 : 100]], 'soft');
    }
    anim(blurP(lit), [[t0, px(22)], [t0 + 0.5, 0]]); anim(blurP(dark), [[t0, px(22)], [t0 + 0.5, 0]]);
    var ty = V ? H0 * 0.62 : H0 * 0.72;
    var tl = words(c, [['Puce', B(24)], ['A20 Pro.', B(24.5)]], 76, INK, F_BOLD, cx, ty);
    var sub = txt(c, 'Chambre à vapeur nouvelle génération.', 50, GREY, F_MED, cx, ty + (V ? 100 : 88), 'C');
    blurIn(sub, B(25), 0.4, {dy: 30, blur: 14});
    blurOut([gl, sh.layer, sub].concat(tl), B(27) - 0.05, 0.3, {noMove: true});
    for (i = 0; i < parts.length; i++) anim(OP(parts[i]), [[B(27) - 0.05, parts[i] === dark ? 32 : 100], [B(27) + 0.25, 0]], 'in');
    anim(SC(tilt), [[B(27) - 0.05, [100, 100, 100], 'in'], [B(27) + 0.25, [90, 90, 90]]]);
    built.push([c, a, b, '5 · Puce A20 Pro (3D)']);
  })();

  // 6 · Autonomie : ligne bleue + compteur
  (function () {
    var a = B(27), b = B(33) + 0.3, c = sceneComp('6 · Autonomie 43 h', a, b);
    var line = shapeLayer(c, 'Ligne bleue', 0, 0), lg = vecGroup(line, 'Ligne');
    // Courbe de Bézier identique à Video.jsx : [point, poignée sortante, poignée entrante du point suivant]
    var segs = V
      ? [[-40, 1180], [140, 1180, 160, 1060, 230, 980], [300, 900, 360, 1000, 380, 1120], [400, 1260, 520, 1300, 640, 1210], [760, 1120, 860, 1100, W0 + 40, 860]]
      : [[-40, 700], [300, 700, 330, 520, 460, 470], [600, 420, 640, 600, 700, 700], [780, 830, 1000, 820, 1150, 680], [1300, 540, 1500, 560, W0 + 40, 380]];
    var vs = [[segs[0][0], segs[0][1]]], ins = [[0, 0]], outs = [], i;
    for (i = 1; i < segs.length; i++) {
      var prev = vs[vs.length - 1], s = segs[i];
      outs.push([s[0] - prev[0], s[1] - prev[1]]);
      vs.push([s[4], s[5]]); ins.push([s[2] - s[4], s[3] - s[5]]);
    }
    outs.push([0, 0]);
    addPath(line, lg, vs, ins, outs); addStroke(line, lg, BLUE, 34, true);
    anim(addTrim(line, lg), [[B(27), 0, 'io'], [B(29), 100]]);
    var py = V ? H0 * 0.31 : H0 * 0.17;
    var g = nul(c, 'Pastille (déplacer ici)', cx, py);
    var pill = roundRect(c, 'Pastille noire', 0, 0, 700, 130, 65, BLACK); pill.layer.parent = g; P(pill.layer).setValue([0, 0]);
    shadow(pill.layer, 25, 30, 70);
    var bat = shapeLayer(c, 'Batterie', 0, 0); bat.parent = g; P(bat).setValue(pt(-350 + 36 + 35, 0));
    var bg1 = vecGroup(bat, 'Contour'); addRect(bat, bg1, 58, 32, 9); addStroke(bat, bg1, GREY2, 3);
    var bg2 = vecGroup(bat, 'Borne'); addPath(bat, bg2, [[31, -6], [31, 6]]); addStroke(bat, bg2, GREY2, 5, true);
    var lvl = shapeLayer(c, 'Niveau de charge', 0, 0); lvl.parent = g; P(lvl).setValue(pt(-350 + 36 + 35 - 22, 0));
    var lg2 = vecGroup(lvl, 'Niveau'); addRect(lvl, lg2, 44, 22, 5); addFill(lvl, lg2, GREEN);
    vecs(lvl, lg2).property(1).property('ADBE Vector Rect Position').setValue(pt(22, 0));
    anim(SC(lvl), [[B(28.5), [8, 100]], [B(30.5), [100, 100]]]);
    var lab = txt(c, 'Lecture vidéo', 30, SKY, F_MED, 0, 0, 'L', 0); lab.parent = g; P(lab).setValue(pt(-350 + 36 + 70 + 22, 0));
    // Compteur : texte piloté par « Heures »
    var cnt = txt(c, '43 h', 84, SKY, F_SEMI, 0, 0, 'R'); cnt.parent = g; P(cnt).setValue(pt(350 - 36, 0)); cnt.name = 'Compteur heures';
    var sl = fx(cnt, 'ADBE Slider Control'); sl.name = 'Heures';
    anim(sl.property(1), [[B(28.5), 0], [B(30.5), 43]], 'io');
    cnt.property('ADBE Text Properties').property('ADBE Text Document').expression = 'Math.round(effect("Heures")(1)) + " h"';
    anim(SC(cnt), [[B(30.5), [100, 100], 'io'], [B(30.5) + 0.1, [112, 112], 'io'], [B(30.5) + 0.3, [100, 100]]]);
    var pls = [pill.layer, bat, lvl, lab, cnt];
    blurIn(pls, B(28), 0.45, {noMove: true});
    anim(SC(g), [[B(28), [60, 60]], [B(28) + 0.45, [100, 100]]]);
    anim(P(g), [[B(28), pt(cx, py - 80)], [B(28) + 0.45, pt(cx, py)]]);
    var ty = V ? H0 * 0.76 : H0 * 0.8;
    var tl = words(c, [['Jusqu’à', B(30.5)], ['43 heures', B(31)]], V ? 76 : 72, INK, F_BOLD, cx, ty);
    var sub = txt(c, 'd’autonomie en vidéo.', V ? 76 : 60, GREY, F_BOLD, cx, ty + (V ? 96 : 88), 'C');
    blurIn(sub, B(31.5), 0.4, {dy: 30, blur: 16});
    blurOut([line, sub].concat(pls, tl), B(33) - 0.05, 0.3, {dx: -200});
    built.push([c, a, b, '6 · Jusqu’à 43 h de vidéo']);
  })();

  // 7 · Stockage
  (function () {
    var a = B(33), b = B(39) + 0.3, c = sceneComp('7 · Stockage', a, b);
    var CAPS = ['256 Go', '512 Go', '1 To', '2 To'];
    var rowH = V ? 140 : 112, step = V ? 175 : 136, rowW = V ? 760 : 700, top = V ? H0 * 0.42 : H0 * 0.33, CLK = B(37), i;
    var tl = words(c, [['Quelle', B(33.3)], ['capacité ?', B(33.8)]], V ? 92 : 80, INK, F_BOLD, cx, V ? H0 * 0.3 : H0 * 0.15);
    var all = [].concat(tl);
    for (i = 0; i < 4; i++) {
      var y = top + i * step;
      var g = nul(c, 'Ligne ' + CAPS[i] + ' (déplacer ici)', cx, y);
      var r = roundRect(c, 'Fond ' + CAPS[i], 0, 0, rowW, rowH, 34, WHITE); r.layer.parent = g; P(r.layer).setValue([0, 0]);
      shadow(r.layer, 8, 20, 60);
      var ring = circle(c, 'Bouton radio ' + CAPS[i], 0, 0, 40, WHITE); ring.layer.parent = g; P(ring.layer).setValue(pt(-rowW / 2 + 46 + 20, 0));
      var rs = addStroke(ring.layer, ring.gi, RING, 3);
      var lab = txt(c, CAPS[i], V ? 52 : 46, INK, F_SEMI, 0, 0, 'L'); lab.parent = g; P(lab).setValue(pt(-rowW / 2 + 46 + 40 + 30, 0));
      var ls = [r.layer, ring.layer, lab];
      blurIn(ls, B(34.3 + i * 0.5), 0.42, {noMove: true, blur: 22});
      anim(P(g), [[B(34.3 + i * 0.5), pt(cx, y - 70)], [B(34.3 + i * 0.5) + 0.42, pt(cx, y)]]);
      if (i === 3) {
        anim(r.fill, [[CLK, WHITE], [CLK + 0.15, PALE]], 'lin');
        var bs = addStroke(r.layer, r.gi, BLUE, 4); bs.property('ADBE Vector Stroke Opacity').setValue(0);
        anim(bs.property('ADBE Vector Stroke Opacity'), [[CLK, 0], [CLK + 0.15, 100]], 'lin');
        hold(vecs(ring.layer, ring.gi).property('ADBE Vector Graphic - Fill').property('ADBE Vector Fill Color'), [[0, WHITE], [CLK + 0.08, BLUE]]); hold(rs.property('ADBE Vector Stroke Color'), [[0, RING], [CLK + 0.08, BLUE]]);
        var tf = fx(lab, 'ADBE Fill'); var fc = byType(tf, PropertyValueType.COLOR); fc.setValue(INK); hold(fc, [[0, INK], [CLK + 0.08, BLUE]]);
        anim(SC(g), [[CLK, [100, 100], 'io'], [CLK + 0.1, [105, 105], 'io'], [CLK + 0.28, [100, 100]]]);
      }
      all = all.concat(ls);
    }
    var hd = hand(c);
    handMoves(hd, [[B(35.6), cx + 420, top + 4 * step + 200], [CLK, cx + 220, top + 3 * step + 10, true], [B(38.4), cx + 460, top + 4 * step + 260]], B(35.6), B(38.4));
    blurOut(all, B(39) - 0.05, 0.3, {noMove: true});
    built.push([c, a, b, '7 · Jusqu’à 2 To']);
  })();

  // 8 · Les 4 ensemble
  (function () {
    var a = B(38.9), b = B(44.4) + 0.35, c = sceneComp('8 · Les 4 couleurs', a, b);
    var ph = V ? 820 : 560, cy = H0 * 0.4, sp = V ? 200 : 190, i;
    var lay = [['noir', -1.5, -10, 40], ['argent', -0.5, -3, 0], ['glacier', 0.5, 3, 0], ['bordeaux', 1.5, 10, 40]], ps = [];
    for (i = 0; i < 4; i++) {
      var x = cx + lay[i][1] * sp, y = cy + lay[i][3], t0 = B(39 + i * 0.5);
      var p = phone(c, lay[i][0], x, y, ph); ps.push(p);
      spring(P(p), t0, pt(x, y + H0 * 0.5), pt(x, y), 0.6, 0.05);
      anim(RO(p), [[t0, 0], [t0 + 0.6, lay[i][2]]]);
      anim(OP(p), [[t0, 0], [t0 + 0.3, 100]], 'soft');
      anim(blurP(p), [[t0, px(24)], [t0 + 0.5, 0]]);
    }
    var ty = V ? H0 * 0.77 : H0 * 0.83;
    var tl = words(c, [['iPhone', B(41)], ['18', B(41.25)], ['Pro', B(41.5)], ['Max', B(41.75)]], V ? 104 : 84, INK, F_BOLD, cx, ty);
    var sub = txt(c, 'Disponible maintenant.', V ? 56 : 48, GREY, F_MED, cx, ty + (V ? 120 : 96), 'C');
    blurIn(sub, B(42.5), 0.4, {dy: 26, blur: 14});
    blurOut(ps.concat(tl, [sub]), B(44.4), 0.32, {s1: 0.92, blur: 26, noMove: true});
    built.push([c, a, b, '8 · Disponible maintenant']);
  })();

  // 9 · Signature
  (function () {
    var a = B(44.8), b = DUR, c = sceneComp('9 · apple store kolwezi', a, b);
    var cy = H0 / 2, t0 = B(45);
    var gl = glow(c, 'Halo bleu', cx, cy, 260, BLUE, 0);
    anim(OP(gl), [[t0, 0], [t0 + 0.4, 12]]);
    var g = nul(c, 'Bulle (déplacer ici)', cx, cy);
    var name = txt(c, 'apple store kolwezi', 56, WHITE, F_SEMI, 0, 0, 'C', -10); name.parent = g; P(name).setValue([0, 0]);
    var h = 56 * 1.1 + 60;
    var bub = roundRect(c, 'Bulle bleue', 0, 0, 560, h, h / 2, BLUE); bub.layer.parent = g; P(bub.layer).setValue([0, 0]);
    vecs(bub.layer, bub.gi).property(1).property('ADBE Vector Rect Size').expression =
      'var r = thisComp.layer("apple store kolwezi").sourceRectAtTime(0, false); [r.width + ' + px(116) + ', value[1]]';
    shadow(bub.layer, 30, 20, 50, BLUE);
    var tail = shapeLayer(c, 'Pointe de la bulle', 0, 0); tail.parent = g; P(tail).setValue(pt(0, -h / 2 + 2));
    var tg = vecGroup(tail, 'Pointe'); addPath(tail, tg, [[-22, 0], [0, -24], [22, 0]], null, null, true); addFill(tail, tg, BLUE);
    bub.layer.moveAfter(name); tail.moveAfter(bub.layer);
    try {
      var sw = fx(name, 'CC Light Sweep');
      var ctr = byType(sw, PropertyValueType.TwoD_SPATIAL);
      ctr.expression = 'var r = sourceRectAtTime(0, false), e = ' + px(120) + ', k = ease(time, ' + (B(45.6) - a).toFixed(3) + ', ' + (B(46.8) - a).toFixed(3) + ', 0, 1);\n' +
        '[r.left - e + (r.width + 2 * e) * k, r.top + r.height / 2]';
    } catch (e) {}
    spring(SC(g), t0, [30, 30], [100, 100], 0.5, 0.08);
    var ls = [name, bub.layer, tail];
    for (var i = 0; i < ls.length; i++) {
      anim(OP(ls[i]), [[t0, 0], [t0 + 0.25, 100, 'soft'], [DUR - 0.6, 100, 'lin'], [DUR, 0]]);
      anim(blurP(ls[i]), [[t0, px(18)], [t0 + 0.4, 0]]);
    }
    anim(OP(gl), [[DUR - 0.6, 12], [DUR, 0]], 'lin');
    built.push([c, a, b, '9 · apple store kolwezi']);
  })();

  // ---------- Composition principale ----------
  OFF = 0;
  var mainName = 'Présentation sans voix ' + (V ? '9:16' : '16:9');
  var main = proj.items.addComp(mainName, W, H, 1, DUR, FPS);
  main.motionBlur = true; main.bgColor = WHITE;
  main.layers.addSolid(WHITE, 'Fond blanc', W, H, 1, DUR);
  for (var i = 0; i < built.length; i++) {
    var l = main.layers.add(built[i][0]);
    l.startTime = built[i][1]; l.inPoint = built[i][1]; l.outPoint = Math.min(DUR, built[i][2]);
    l.name = built[i][0].name;
    main.markerProperty.setValueAtTime(built[i][1], new MarkerValue(built[i][3]));
  }
  var names = [['bruitages', 'Bruitages (Epidemic Sound)'], ['musique', 'Musique · Hotshot (oomiee)'], ['mix', 'Mix final (coupé)']];
  for (i = 0; i < names.length; i++) {
    var al = main.layers.add(AUD[names[i][0]]); al.name = names[i][1];
    if (names[i][0] === 'mix') al.audioEnabled = false;
  }
  app.endUndoGroup();
  main.openInViewer();
  try { proj.save(new File(BASE.fsName + '/Presentation-SansVoix-' + FMT + '.aep')); } catch (e) {}
})();
