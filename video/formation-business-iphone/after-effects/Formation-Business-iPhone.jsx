// Formation business iPhone · projet After Effects éditable
// Construit UN format par exécution (variable FORMAT = '9x16' ou '16x9', définie par lancer-9x16.jsx / lancer-16x9.jsx),
// puis enregistre Formation-Business-iPhone-<format>.aep à côté du script.
// Calques : fond blanc, vidéo de l'avatar (cadre arrondi animé, modifiable), B-roll (ProRes 4444 avec alpha, découpé par scène),
// voix de l'avatar, musique, un calque par bruitage, mix final (coupé). Minutages repris de src/Video.jsx.

(function () {
  var BASE = (typeof AE_BASE !== 'undefined') ? AE_BASE : File($.fileName).parent;
  var FMT = (typeof FORMAT !== 'undefined') ? FORMAT : '9x16';
  var V = FMT === '9x16';
  var W = V ? 2160 : 3840, H = V ? 3840 : 2160, FPS = 60, DUR = 40.95;

  var SCENES = [
    ['01 Le business d’iPhone en RDC', 0, 'full'], ['02 Par où commencer ?', 3.4, 'card'], ['03 150 000 FC', 6.4, 'bubble'],
    ['04 Couverture de la formation', 10.2, 'bubble'], ['05 Tu vas apprendre', 12.5, 'card'], ['06 Où acheter', 14.3, 'bubble'],
    ['07 Rentabilité et prix', 17.2, 'bubble'], ['08 Modèle selon le budget', 20.8, 'bubble'], ['09 Vendre sur les réseaux', 23.8, 'bubble'],
    ['10 L’objectif est simple', 28.2, 'full'], ['11 Claire, concrète, rentable', 31.8, 'card'], ['12 Inscris-toi', 36.2, 'bubble']
  ];
  // Cadres de l'avatar en 9:16, dans l'espace 540×960 de Remotion (×4 pour la 4K)
  var AV = {full: [0, 0, 540, 960, 0, 50], card: [24, 520, 492, 380, 30, 18], bubble: [404, 750, 112, 150, 24, 15]};

  app.beginUndoGroup('Formation business iPhone ' + FMT);
  app.newProject();
  var proj = app.project;
  function folder(name, parent) { var f = proj.items.addFolder(name); if (parent) f.parentFolder = parent; return f; }
  var MEDIA = folder('Médias'), SFX = folder('Bruitages', MEDIA);
  function imp(rel, fold) {
    var f = new File(BASE.fsName + '/' + rel);
    if (!f.exists) throw new Error('Fichier introuvable : ' + f.fsName);
    var it = proj.importFile(new ImportOptions(f));
    it.parentFolder = fold || MEDIA;
    return it;
  }
  var AVATAR = imp('video/avatar.mp4');
  var BROLL = imp('video/broll-' + FMT + '.mov');
  var AUD = {voix: imp('audio/voix.wav'), musique: imp('audio/musique.wav'), mix: imp('audio/mix-final.wav')};

  var comp = proj.items.addComp(V ? '9:16' : '16:9', W, H, 1, DUR, FPS);
  comp.bgColor = [1, 1, 1];
  comp.motionBlur = true;

  // Repères de scène
  for (var i = 0; i < SCENES.length; i++) {
    var mk = new MarkerValue(SCENES[i][0]);
    comp.markerProperty.setValueAtTime(SCENES[i][1], mk);
  }

  function easeKeys(p) {
    for (var k = 1; k <= p.numKeys; k++) {
      var n = p.propertyValueType === PropertyValueType.TwoD ? 2 : p.propertyValueType === PropertyValueType.ThreeD ? 3 : 1;
      var e = []; for (var j = 0; j < n; j++) e.push(new KeyframeEase(0, 75));
      try { p.setTemporalEaseAtKey(k, e, e); } catch (er) {}
      if (p.isSpatial) { try { p.setSpatialAutoBezierAtKey(k, false); p.setSpatialContinuousAtKey(k, false); } catch (er2) {} }
    }
  }

  // ---------- Calques image ----------
  var bg = comp.layers.addSolid([1, 1, 1], 'Fond blanc', W, H, 1, DUR);

  // Rectangle de l'avatar (en pixels 4K) à un instant donné
  function rectOf(mode) {
    if (!V) return [220, 140, 1128, 1880, 92, 30];
    var a = AV[mode]; return [a[0] * 4, a[1] * 4, a[2] * 4, a[3] * 4, a[4] * 4, a[5]];
  }
  function cover(r) {
    var sc = Math.max(r[2] / 1080, r[3] / 1920);
    var w = 1080 * sc, h = 1920 * sc;
    var left = r[0] - (w - r[2]) / 2, top = r[1] - (h - r[3]) * r[5] / 100;
    return {pos: [left + w / 2, top + h / 2], scale: [sc * 100, sc * 100]};
  }

  // Cadre (ombre portée), vidéo de l'avatar, cache arrondi
  var frame = comp.layers.addShape(); frame.name = 'Cadre avatar (ombre)';
  var mat = comp.layers.addShape(); mat.name = 'Cache avatar (forme arrondie)';
  function roundRect(layer, fillCol) {
    var g = layer.property('ADBE Root Vectors Group').addProperty('ADBE Vector Group');
    var rc = g.property('ADBE Vectors Group').addProperty('ADBE Vector Shape - Rect');
    var fl = g.property('ADBE Vectors Group').addProperty('ADBE Vector Graphic - Fill');
    fl.property('ADBE Vector Fill Color').setValue(fillCol);
    layer.property('ADBE Transform Group').property('ADBE Anchor Point').setValue([0, 0]);
    layer.property('ADBE Transform Group').property('ADBE Position').setValue([0, 0]);
    return rc;
  }
  var rcF = roundRect(frame, [1, 1, 1]), rcM = roundRect(mat, [1, 1, 1]);
  var av = comp.layers.add(AVATAR); av.name = 'Avatar (vidéo HeyGen)';
  av.audioEnabled = false;
  mat.moveBefore(av);
  frame.moveAfter(av);

  function setRect(rc, t, r) {
    rc.property('ADBE Vector Rect Size').setValueAtTime(t, [r[2], r[3]]);
    rc.property('ADBE Vector Rect Position').setValueAtTime(t, [r[0] + r[2] / 2, r[1] + r[3] / 2]);
    rc.property('ADBE Vector Rect Roundness').setValueAtTime(t, r[4]);
  }
  function setAv(t, r) {
    var c = cover(r);
    av.property('ADBE Transform Group').property('ADBE Position').setValueAtTime(t, c.pos);
    av.property('ADBE Transform Group').property('ADBE Scale').setValueAtTime(t, c.scale);
  }
  if (V) {
    for (i = 0; i < SCENES.length; i++) {
      var cur = rectOf(SCENES[i][2]), prev = rectOf((SCENES[i - 1] || SCENES[i])[2]);
      var t0 = Math.max(0, SCENES[i][1] - 0.05), t1 = SCENES[i][1] + 0.65;
      if (i === 0) { setRect(rcM, 0, cur); setRect(rcF, 0, cur); setAv(0, cur); continue; }
      if (SCENES[i][2] === SCENES[i - 1][2]) continue;
      setRect(rcM, t0, prev); setRect(rcF, t0, prev); setAv(t0, prev);
      setRect(rcM, t1, cur); setRect(rcF, t1, cur); setAv(t1, cur);
    }
  } else {
    var r = rectOf('card');
    setRect(rcM, 0, r); setRect(rcF, 0, r);
    var c = cover(r);
    av.property('ADBE Transform Group').property('ADBE Position').setValue(c.pos);
    av.property('ADBE Transform Group').property('ADBE Scale').setValueAtTime(0, c.scale);
    av.property('ADBE Transform Group').property('ADBE Scale').setValueAtTime(DUR, [c.scale[0] * 1.04, c.scale[1] * 1.04]);
  }
  var props = [rcM.property('ADBE Vector Rect Size'), rcM.property('ADBE Vector Rect Position'), rcM.property('ADBE Vector Rect Roundness'),
    rcF.property('ADBE Vector Rect Size'), rcF.property('ADBE Vector Rect Position'), rcF.property('ADBE Vector Rect Roundness'),
    av.property('ADBE Transform Group').property('ADBE Position'), av.property('ADBE Transform Group').property('ADBE Scale')];
  for (i = 0; i < props.length; i++) if (props[i].numKeys > 1) easeKeys(props[i]);

  // Cache alpha : API récente (setTrackMatte), sinon ancienne (calque juste au-dessus)
  try { av.setTrackMatte(mat, TrackMatteType.ALPHA); } catch (e) { av.trackMatteType = TrackMatteType.ALPHA; }
  var ds = frame.property('ADBE Effect Parade').addProperty('ADBE Drop Shadow');
  var op = ds.property('ADBE Drop Shadow-0002');
  op.setValue(op.hasMax && op.maxValue > 100 ? (V ? 40 : 35) / 100 * op.maxValue : (V ? 40 : 35));
  ds.property('ADBE Drop Shadow-0003').setValue(180);
  ds.property('ADBE Drop Shadow-0004').setValue(V ? 40 : 30);
  ds.property('ADBE Drop Shadow-0005').setValue(V ? 110 : 90);

  // B-roll découpé par scène (même fichier, coupes franches entre scènes)
  for (i = SCENES.length - 1; i >= 0; i--) {
    var l = comp.layers.add(BROLL);
    l.name = 'B-roll · ' + SCENES[i][0];
    l.audioEnabled = false;
    l.inPoint = SCENES[i][1];
    l.outPoint = i + 1 < SCENES.length ? SCENES[i + 1][1] : DUR;
    l.motionBlur = false;
    l.label = 9;
  }

  // ---------- Son ----------
  function audioLayer(item, name, db, t, mute) {
    var l = comp.layers.add(item);
    l.name = name;
    l.startTime = t || 0;
    try { l.property('ADBE Audio Group').property('ADBE Audio Levels').setValue([db, db]); } catch (e) {}
    if (mute) l.audioEnabled = false;
    l.moveToEnd();
    return l;
  }
  // ExtendScript (ES3) n'a pas JSON.parse : bruitages.json est produit par notre mix.py, pas une source externe
  var info = eval('(' + (function () { var f = new File(BASE.fsName + '/audio/bruitages.json'); f.encoding = 'UTF-8'; f.open('r'); var s = f.read(); f.close(); return s; })() + ')');
  audioLayer(AUD.voix, 'Voix de l’avatar', 0);
  audioLayer(AUD.musique, 'Musique · Moving Up (Epidemic Sound)', 0);
  var cache = {};
  for (i = 0; i < info.bruitages.length; i++) {
    var b = info.bruitages[i];
    if (!cache[b.son]) cache[b.son] = imp('audio/epidemic/sfx-' + b.son + '.mp3', SFX);
    var sl = audioLayer(cache[b.son], 'SFX ' + b.son + ' · ' + b.t.toFixed(2) + ' s', b.db + info.gain_db, b.t);
    sl.label = 11;
  }
  audioLayer(AUD.mix, 'Mix final (coupé, son exact de la vidéo livrée)', 0, 0, true);

  comp.openInViewer();
  app.endUndoGroup();
  var out = new File(BASE.fsName + '/Formation-Business-iPhone-' + FMT + '.aep');
  proj.save(out);
})();
