// Spec ad « All new AirPods Pro 3 » · construction du projet After Effects
// Lit data-<FORMAT>.js (généré par gen.mjs depuis les courbes de scene.js) et crée des calques natifs :
// fonds (solides + séquence d'anneaux), séquence 3D Blender (RGBA), textes Helvetica Neue éditables
// animés par images clés, logo Apple vectoriel, mention légale, musique et un calque par bruitage.
// Lancer via Construire-9x16.jsx ou Construire-16x9.jsx (ExtendScript, ES3).

(function () {
  var DIR = (typeof AP_DIR !== 'undefined') ? AP_DIR : File($.fileName).parent.fsName;
  var FORMAT = (typeof AP_FORMAT !== 'undefined') ? AP_FORMAT : '9x16';
  var OUT = (typeof AP_OUT !== 'undefined') ? AP_OUT : DIR + '/AirPods-Pro-3-' + FORMAT + '.aep';
  var LOGF = new File(DIR + '/construction-' + FORMAT + '.log');
  var logLines = [];
  function log(s) { logLines.push(s); }
  function flush() { LOGF.encoding = 'UTF-8'; LOGF.open('w'); LOGF.write(logLines.join('\n')); LOGF.close(); }
  var current = '';

  var folders = {};
  function folder(name) {
    if (!folders[name]) folders[name] = app.project.items.addFolder(name);
    return folders[name];
  }

  // spec : {v: valeur} ou {k: [[t, v], ...]} ; map(v) transforme chaque valeur
  function setP(prop, spec, map) {
    if (!spec) return;
    var f = map || function (v) { return v; };
    if (spec.k) {
      var ts = [], vs = [], i;
      for (i = 0; i < spec.k.length; i++) { ts.push(spec.k[i][0]); vs.push(f(spec.k[i][1])); }
      prop.setValuesAtTimes(ts, vs);
      for (i = 1; i <= prop.numKeys; i++) {
        if (prop.isSpatial) {
          try {
            prop.setSpatialAutoBezierAtKey(i, false);
            prop.setSpatialContinuousAtKey(i, false);
          } catch (e) { /* propriété non spatiale en pratique */ }
        }
        prop.setInterpolationTypeAtKey(i, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
      }
    } else {
      prop.setValue(f(spec.v));
    }
  }

  function tr(L) { return L.property('ADBE Transform Group'); }

  // position = (x, y) + décalage animé dx / dy (images clés aux mêmes instants)
  function setPos(L, x, y, dx, dy) {
    var P = tr(L).property('ADBE Position');
    P.dimensionsSeparated = true;
    setP(tr(L).property('ADBE Position_0'), dx || {v: 0}, function (v) { return x + v; });
    setP(tr(L).property('ADBE Position_1'), dy || {v: 0}, function (v) { return y + v; });
  }

  function addBlur(L, spec, name) {
    if (!spec) return null;
    if (spec.v !== undefined && spec.v === 0) return null;
    var fx = L.property('ADBE Effect Parade').addProperty('ADBE Gaussian Blur 2');
    fx.name = name || 'Flou d’entrée';
    setP(fx.property('ADBE Gaussian Blur 2-0001'), spec);
    try { fx.property('ADBE Gaussian Blur 2-0003').setValue(0); } catch (e) { /* option absente */ }
    return fx;
  }

  function textLayer(comp, name, text, d, just) {
    var L = comp.layers.addText(text);
    L.name = name;
    var src = L.property('ADBE Text Properties').property('ADBE Text Document');
    var td = src.value;
    try { td.resetCharStyle(); td.resetParagraphStyle(); } catch (e0) { /* versions anciennes */ }
    var font = DATA.fonts[String(d.weight)];
    td.font = font;
    td.fontSize = d.size;
    td.applyFill = true;
    td.fillColor = d.color;
    td.applyStroke = false;
    td.tracking = -20; // letter-spacing -0.02em
    td.justification = just;
    if (d.lineHeight) { td.autoLeading = false; td.leading = d.size * d.lineHeight; }
    td.text = text;
    src.setValue(td);
    var got = src.value.font;
    if (got !== font) log('ATTENTION police remplacée : ' + font + ' -> ' + got + ' (' + name + ')');
    // ancre : centre vertical de la boîte de ligne CSS (ligne de base − 0,37 × corps)
    tr(L).property('ADBE Anchor Point').setValue([0, -0.37 * d.size]);
    L.inPoint = d['in']; L.outPoint = d.out;
    return L;
  }

  function width(L) { var r = L.sourceRectAtTime(L.inPoint, false); return r.width; }

  function importSeq(firstFile, label) {
    var f = new File(firstFile);
    if (!f.exists) { log('ATTENTION séquence introuvable : ' + firstFile); return null; }
    var io = new ImportOptions(f);
    io.sequence = true;
    io.forceAlphabetical = true;
    var it = app.project.importFile(io);
    it.mainSource.conformFrameRate = DATA.fps;
    try { it.mainSource.alphaMode = AlphaMode.STRAIGHT; } catch (e) { /* sans alpha */ }
    it.name = label;
    it.parentFolder = folder('02 Médias');
    return it;
  }

  function firstPng(dirPath) {
    var fs = new Folder(dirPath).getFiles('f*.png');
    if (!fs || !fs.length) return null;
    fs.sort(function (a, b) { return a.name < b.name ? -1 : 1; });
    return fs[0];
  }

  var audioItems = {};
  function audio(comp, file, name, start, db) {
    var f = new File(DIR + '/' + file);
    if (!f.exists) { log('ATTENTION son introuvable : ' + file); return null; }
    if (!audioItems[file]) {
      audioItems[file] = app.project.importFile(new ImportOptions(f));
      audioItems[file].parentFolder = folder('03 Sons');
    }
    var L = comp.layers.add(audioItems[file]);
    L.name = name;
    L.startTime = start;
    if (db) L.property('ADBE Audio Group').property('ADBE Audio Levels').setValue([db, db]);
    return L;
  }

  var t0 = new Date().getTime();
  app.beginSuppressDialogs();
  try {
    $.evalFile(new File(DIR + '/data-' + FORMAT + '.js'));
    var W = DATA.w, H = DATA.h, Bt = DATA.beats;
    log('Construction ' + DATA.main + ' (' + W + 'x' + H + ', ' + DATA.fps + ' i/s, ' + DATA.dur + ' s)');
    var comp = app.project.items.addComp(DATA.main, W, H, 1, DATA.dur, DATA.fps);
    comp.bgColor = [0, 0, 0];
    comp.motionBlur = true;
    comp.shutterAngle = 180;
    comp.shutterPhase = -90;
    var L, i;

    // ---------- sons (en bas de la pile, invisibles) ----------
    current = 'sons';
    $.evalFile(new File(DIR + '/sons/cues.js'));
    for (i = AP_CUES.cues.length - 1; i >= 0; i--) {
      var c = AP_CUES.cues[i];
      audio(comp, 'sons/bruitages/' + c.stem, 'SFX ' + (i < 9 ? '0' : '') + (i + 1) + ' · ' + c.file.replace('.wav', '') + ' · ' + c.label, 0, 0);
    }
    audio(comp, 'sons/musique.wav', 'Musique · The Mood (Heyson)', 0, -3);
    var ref = audio(comp, 'sons/master.wav', 'Référence · mix master (coupé)', 0, 0);
    if (ref) ref.audioEnabled = false;

    // ---------- fonds ----------
    current = 'fonds';
    L = comp.layers.addSolid([0, 0, 0], 'Fond noir', W, H, 1, DATA.dur);
    var ringsFirst = firstPng(DIR + '/medias/anneaux-' + FORMAT);
    if (ringsFirst) {
      var rings = importSeq(ringsFirst.fsName, 'Anneaux ' + FORMAT + ' (séquence, 60 i/s)');
      L = comp.layers.add(rings);
      L.name = 'Anneaux (A bleu, C clair)';
      L.startTime = 0; L.inPoint = 0; L.outPoint = Math.min(DATA.dur, Bt.D + 0.6);
    }
    L = comp.layers.addSolid(DATA.gray.color, 'Fond gris #E8E8ED', W, H, 1, DATA.dur);
    L.inPoint = DATA.gray['in']; L.outPoint = DATA.gray.out;
    setP(tr(L).property('ADBE Opacity'), DATA.gray.o);

    // ---------- 3D Blender ----------
    current = '3D';
    var p3 = firstPng(DIR + '/medias/3d-' + FORMAT);
    if (p3) {
      var seq3 = importSeq(p3.fsName, 'AirPods 3D ' + FORMAT + ' (Blender, RGBA, 60 i/s)');
      L = comp.layers.add(seq3);
      L.name = 'AirPods 3D (Blender)';
      var n0 = parseInt(p3.name.replace(/[^0-9]/g, ''), 10);
      L.startTime = n0 / DATA.fps;
      var sc = W / seq3.width * 100;
      tr(L).property('ADBE Scale').setValue([sc, sc]);
      tr(L).property('ADBE Position').setValue([W / 2, H / 2]);
      L.inPoint = Bt.C; L.outPoint = Bt.J;
      log('3D : première image ' + p3.name + ', ' + seq3.width + 'x' + seq3.height + ' agrandie à ' + Math.round(sc * 100) / 100 + ' %');
    }

    // ---------- textes ----------
    var CENTER = ParagraphJustification.CENTER_JUSTIFY, RIGHT = ParagraphJustification.RIGHT_JUSTIFY, LEFT = ParagraphJustification.LEFT_JUSTIFY;
    for (i = 0; i < DATA.texts.length; i++) {
      var d = DATA.texts[i];
      current = d.name;
      L = textLayer(comp, d.name, d.text, d, d.align === 'right' ? RIGHT : CENTER);
      setPos(L, d.x, d.y, null, d.dy);
      setP(tr(L).property('ADBE Opacity'), d.o);
      if (d.s) setP(tr(L).property('ADBE Scale'), d.s, function (v) { return [v, v]; });
      addBlur(L, d.blur);
    }

    // E : un calque par mot, mis en page comme le navigateur (lignes centrées)
    var ph = DATA.phrase;
    current = ph.name;
    var wl = [], sp;
    for (i = 0; i < ph.words.length; i++) {
      wl.push(textLayer(comp, 'Mot ' + (i + 1) + ' · ' + ph.words[i].text, ph.words[i].text, ph, LEFT));
    }
    var probe = textLayer(comp, 'mesure', 'n n', ph, LEFT), probe2 = textLayer(comp, 'mesure', 'nn', ph, LEFT);
    sp = width(probe) - width(probe2);
    probe.remove(); probe2.remove();
    var nl = ph.lines.length;
    for (var li = 0; li < nl; li++) {
      var idx = ph.lines[li], tot = 0, j;
      for (j = 0; j < idx.length; j++) tot += width(wl[idx[j]]) + (j ? sp : 0);
      var x = ph.x - tot / 2;
      var y = ph.y + (li - (nl - 1) / 2) * ph.size * ph.lineHeight;
      for (j = 0; j < idx.length; j++) {
        var w = ph.words[idx[j]], Lw = wl[idx[j]];
        var r = Lw.sourceRectAtTime(Lw.inPoint, false);
        if (j) x += sp;
        // point d'ancrage au bas du mot pour l'étirement vertical de « up »
        tr(Lw).property('ADBE Anchor Point').setValue([r.left, -0.37 * ph.size]);
        setPos(Lw, x, y, null, w.dy);
        setP(tr(Lw).property('ADBE Opacity'), w.o);
        if (w.sy) setP(tr(Lw).property('ADBE Scale'), w.sy, function (v) { return [100, v]; });
        addBlur(Lw, w.blur);
        x += r.width;
      }
    }

    // H : « Touch » + « control »
    var th = DATA.touch;
    current = 'Touch control';
    var Lc = textLayer(comp, 'Touch control · control', 'control', th, RIGHT);
    var Lt = textLayer(comp, 'Touch control · Touch', 'Touch', th, RIGHT);
    var pr = textLayer(comp, 'mesure', 'n n', th, LEFT), pr2 = textLayer(comp, 'mesure', 'nn', th, LEFT);
    var sp2 = width(pr) - width(pr2); pr.remove(); pr2.remove();
    setPos(Lt, th.x - width(Lc) - sp2, th.y, null, null);
    setP(tr(Lt).property('ADBE Opacity'), th.o);
    addBlur(Lt, th.blur);
    setPos(Lc, th.x, th.y, th.control.dx, null);
    // « control » : sa propre entrée × la sortie commune du mot « Touch »
    setP(tr(Lc).property('ADBE Opacity'), th.control.o);
    tr(Lc).property('ADBE Opacity').expression = 'value * Math.min(1, thisComp.layer("Touch control · Touch").transform.opacity.valueAtTime(Math.max(time, ' + (Bt.I - 0.1) + ')) / 100)';
    addBlur(Lc, th.control.blur);

    // J : logo Apple vectoriel + mention légale
    current = 'logo';
    var lg = DATA.logo;
    L = comp.layers.addShape();
    L.name = 'Logo Apple';
    var grp = L.property('ADBE Root Vectors Group').addProperty('ADBE Vector Group');
    grp.name = 'Pomme';
    var k = lg.size / 24;
    for (i = 0; i < lg.shapes.length; i++) {
      var s = lg.shapes[i], sh = new Shape(), vv = [], ii = [], oo = [];
      for (var q = 0; q < s.v.length; q++) {
        vv.push([s.v[q][0] * k, s.v[q][1] * k]); ii.push([s.i[q][0] * k, s.i[q][1] * k]); oo.push([s.o[q][0] * k, s.o[q][1] * k]);
      }
      sh.vertices = vv; sh.inTangents = ii; sh.outTangents = oo; sh.closed = true;
      var pth = grp.property('ADBE Vectors Group').addProperty('ADBE Vector Shape - Group');
      pth.name = i === 0 ? 'Pomme' : 'Feuille';
      pth.property('ADBE Vector Shape').setValue(sh);
    }
    var fill = grp.property('ADBE Vectors Group').addProperty('ADBE Vector Graphic - Fill');
    fill.property('ADBE Vector Fill Color').setValue([1, 1, 1]);
    tr(L).property('ADBE Anchor Point').setValue([0, 0]);
    tr(L).property('ADBE Position').setValue([lg.x, lg.y]);
    setP(tr(L).property('ADBE Opacity'), lg.o);
    setP(tr(L).property('ADBE Scale'), lg.s, function (v) { return [v, v]; });
    addBlur(L, lg.blur);
    L.inPoint = lg['in']; L.outPoint = lg.out;

    current = 'mention';
    var dc = DATA.disc;
    L = textLayer(comp, dc.name, dc.lines.join('\r'), dc, CENTER);
    tr(L).property('ADBE Anchor Point').setValue([0, dc.size * dc.lineHeight / 2 - 0.37 * dc.size]);
    setPos(L, dc.x, dc.y, null, null);
    setP(tr(L).property('ADBE Opacity'), dc.o);

    comp.openInViewer();
    app.project.save(new File(OUT));
    log('OK enregistré : ' + OUT + ' en ' + Math.round((new Date().getTime() - t0) / 1000) + ' s');
  } catch (e) {
    log('ERREUR : ' + e.toString() + ' (ligne ' + e.line + ') dans ' + current);
  }
  app.endSuppressDialogs(false);
  flush();
})();
