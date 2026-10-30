// CyberSpace SARL · « Construis ton prochain projet » · construction du projet After Effects
// Lit data-<FORMAT>.js (généré par gen.mjs depuis src/Video.jsx) et crée des calques natifs :
// textes éditables (polices Inter / JetBrains Mono), calques de forme, logo vectoriel, nuls de caméra,
// images clés réelles, expressions pour les parties procédurales, flou de bougé, sons sur calques séparés.
// Lancer via Construire-9x16.jsx ou Construire-16x9.jsx (ExtendScript, ES3).

(function () {
  var DIR = (typeof CS_DIR !== 'undefined') ? CS_DIR : File($.fileName).parent.fsName;
  var FORMAT = (typeof CS_FORMAT !== 'undefined') ? CS_FORMAT : '9x16';
  var OUT = (typeof CS_OUT !== 'undefined') ? CS_OUT : DIR + '/CyberSpace-' + FORMAT + '.aep';
  var LOGF = new File(DIR + '/construction-' + FORMAT + '.log');
  var logLines = [];
  function log(s) { logLines.push(s); }
  function flush() { LOGF.encoding = 'UTF-8'; LOGF.open('w'); LOGF.write(logLines.join('\n')); LOGF.close(); }

  var current = '';
  var audioItems = {};
  var SFX_OFFSET = 0;

  function fit(prop, val) {
    var cur = prop.value;
    if (cur instanceof Array) {
      if (!(val instanceof Array)) val = [val, val];
      var out = [];
      for (var i = 0; i < cur.length; i++) out.push(i < val.length ? val[i] : cur[i]);
      return out;
    }
    return val;
  }

  function setP(prop, spec) {
    if (!spec || !prop) return;
    if (spec.x !== undefined) {
      if (spec.v !== undefined) prop.setValue(fit(prop, spec.v));
      prop.expression = spec.x;
      return;
    }
    if (spec.k) {
      var ts = [], vs = [], i;
      for (i = 0; i < spec.k.length; i++) { ts.push(spec.k[i][0]); vs.push(fit(prop, spec.k[i][1])); }
      prop.setValuesAtTimes(ts, vs);
      var it = spec.h ? KeyframeInterpolationType.HOLD : KeyframeInterpolationType.LINEAR;
      var sp = prop.isSpatial, z = null;
      if (sp) { z = []; var dim = (prop.value instanceof Array) ? prop.value.length : 1; for (i = 0; i < dim; i++) z.push(0); }
      for (i = 1; i <= prop.numKeys; i++) {
        if (sp) {
          prop.setSpatialAutoBezierAtKey(i, false);
          prop.setSpatialContinuousAtKey(i, false);
          prop.setSpatialTangentsAtKey(i, z, z);
        }
        prop.setInterpolationTypeAtKey(i, it, it);
      }
      return;
    }
    prop.setValue(fit(prop, spec.v));
  }

  function dimSpec(spec, j) {
    var k = [];
    for (var i = 0; i < spec.k.length; i++) k.push([spec.k[i][0], spec.k[i][1][j]]);
    return {k: k, h: spec.h};
  }

  function scaleSpec(spec) {
    if (!spec) return spec;
    function sv(x) { return (x instanceof Array) ? x : [x, x]; }
    if (spec.k) {
      var k = [];
      for (var i = 0; i < spec.k.length; i++) k.push([spec.k[i][0], sv(spec.k[i][1])]);
      return {k: k, h: spec.h};
    }
    if (spec.x !== undefined) return spec;
    return {v: sv(spec.v)};
  }

  function setTransform(L, tr) {
    var T = L.property('ADBE Transform Group');
    setP(T.property('ADBE Anchor Point'), tr.a);
    if (tr.p && tr.p.k) {
      T.property('ADBE Position').dimensionsSeparated = true;
      setP(T.property('ADBE Position_0'), dimSpec(tr.p, 0));
      setP(T.property('ADBE Position_1'), dimSpec(tr.p, 1));
    } else {
      setP(T.property('ADBE Position'), tr.p);
    }
    setP(T.property('ADBE Scale'), scaleSpec(tr.s));
    setP(T.property('ADBE Rotate Z'), tr.r);
    setP(T.property('ADBE Opacity'), tr.o);
  }

  function setGroupTr(T, tr) {
    setP(T.property('ADBE Vector Anchor'), tr.a);
    setP(T.property('ADBE Vector Position'), tr.p);
    setP(T.property('ADBE Vector Scale'), scaleSpec(tr.s));
    setP(T.property('ADBE Vector Rotation'), tr.r);
    setP(T.property('ADBE Vector Group Opacity'), tr.o);
  }

  function addShapes(grp, items) {
    for (var n = 0; n < items.length; n++) {
      var it = items[n], p, idx;
      if (it.ty === 'gr') {
        p = grp.addProperty('ADBE Vector Group');
        if (it.nm) p.name = it.nm;
        if (it.tr) setGroupTr(p.property('ADBE Vector Transform Group'), it.tr);
        addShapes(p.property('ADBE Vectors Group'), it.it);
      } else if (it.ty === 'rect') {
        p = grp.addProperty('ADBE Vector Shape - Rect');
        if (it.nm) p.name = it.nm;
        setP(p.property('ADBE Vector Rect Size'), it.s);
        setP(p.property('ADBE Vector Rect Position'), it.p);
        setP(p.property('ADBE Vector Rect Roundness'), it.r);
      } else if (it.ty === 'el') {
        p = grp.addProperty('ADBE Vector Shape - Ellipse');
        if (it.nm) p.name = it.nm;
        setP(p.property('ADBE Vector Ellipse Size'), it.s);
        setP(p.property('ADBE Vector Ellipse Position'), it.p);
      } else if (it.ty === 'sh') {
        p = grp.addProperty('ADBE Vector Shape - Group');
        if (it.nm) p.name = it.nm;
        var sp = p.property('ADBE Vector Shape');
        if (it.x) {
          sp.expression = it.x;
        } else {
          var s = new Shape();
          s.vertices = it.v; s.inTangents = it.i; s.outTangents = it.o; s.closed = !!it.c;
          sp.setValue(s);
        }
      } else if (it.ty === 'fl') {
        p = grp.addProperty('ADBE Vector Graphic - Fill');
        setP(p.property('ADBE Vector Fill Color'), it.c);
        setP(p.property('ADBE Vector Fill Opacity'), it.o);
        if (it.rule) p.property('ADBE Vector Fill Rule').setValue(it.rule);
      } else if (it.ty === 'st') {
        p = grp.addProperty('ADBE Vector Graphic - Stroke');
        idx = grp.numProperties;
        setP(p.property('ADBE Vector Stroke Color'), it.c);
        setP(p.property('ADBE Vector Stroke Opacity'), it.o);
        setP(p.property('ADBE Vector Stroke Width'), it.w);
        if (it.cap) p.property('ADBE Vector Stroke Line Cap').setValue(it.cap);
        if (it.join) p.property('ADBE Vector Stroke Line Join').setValue(it.join);
        if (it.dash) {
          grp.property(idx).property('ADBE Vector Stroke Dashes').addProperty('ADBE Vector Stroke Dash 1').setValue(it.dash[0]);
          grp.property(idx).property('ADBE Vector Stroke Dashes').addProperty('ADBE Vector Stroke Gap 1').setValue(it.dash[1]);
          if (it.doff) setP(grp.property(idx).property('ADBE Vector Stroke Dashes').addProperty('ADBE Vector Stroke Offset'), it.doff);
        }
      } else if (it.ty === 'tm') {
        p = grp.addProperty('ADBE Vector Filter - Trim');
        setP(p.property('ADBE Vector Trim Start'), it.s);
        setP(p.property('ADBE Vector Trim End'), it.e);
        setP(p.property('ADBE Vector Trim Offset'), it.o);
        if (it.m) p.property('ADBE Vector Trim Type').setValue(it.m);
      } else if (it.ty === 'rp') {
        p = grp.addProperty('ADBE Vector Filter - Repeater');
        p.property('ADBE Vector Repeater Copies').setValue(it.n);
        setP(p.property('ADBE Vector Repeater Transform').property('ADBE Vector Repeater Position'), it.p);
      }
    }
  }

  function addFx(L, list) {
    for (var i = 0; i < list.length; i++) {
      var f = list[i], fx, op;
      if (f.t === 'blur') {
        if (f.v && f.v.v === 0) continue;
        fx = L.property('ADBE Effect Parade').addProperty('ADBE Gaussian Blur 2');
        fx.name = 'Flou d\'entr\u00e9e';
        setP(fx.property('ADBE Gaussian Blur 2-0001'), f.v);
        try { fx.property('ADBE Gaussian Blur 2-0003').setValue(0); } catch (e1) { /* option absente */ }
      } else if (f.t === 'glow') {
        fx = L.property('ADBE Effect Parade').addProperty('ADBE Drop Shadow');
        fx.name = f.dist ? 'Ombre douce' : 'Lueur';
        fx.property('ADBE Drop Shadow-0001').setValue(f.c);
        op = fx.property('ADBE Drop Shadow-0002');
        op.setValue(f.o * ((op.hasMax && op.maxValue <= 100) ? 100 : 255));
        fx.property('ADBE Drop Shadow-0003').setValue(f.dir);
        fx.property('ADBE Drop Shadow-0004').setValue(f.dist);
        fx.property('ADBE Drop Shadow-0005').setValue(f.soft);
      }
    }
  }

  function setupText(L, d) {
    var src = L.property('ADBE Text Properties').property('ADBE Text Document');
    var td = src.value;
    try { td.resetCharStyle(); td.resetParagraphStyle(); } catch (e0) { /* versions anciennes */ }
    td.font = d.font;
    td.fontSize = d.size;
    td.applyFill = true;
    td.fillColor = d.color;
    td.applyStroke = false;
    td.tracking = d.tracking;
    td.justification = ParagraphJustification.LEFT_JUSTIFY;
    td.text = d.text;
    src.setValue(td);
    var got = src.value.font;
    if (got !== d.font) log('ATTENTION police remplac\u00e9e : ' + d.font + ' -> ' + got + ' (' + current + ' / ' + d.name + ')');
    if (d.colorKeys) {
      for (var i = 0; i < d.colorKeys.length; i++) {
        var tdk = src.value;
        tdk.fillColor = d.colorKeys[i][1];
        src.setValueAtTime(d.colorKeys[i][0], tdk);
      }
    }
    if (d.srcx) src.expression = d.srcx;
    // Les r\u00e9f\u00e9rences aux propri\u00e9t\u00e9s deviennent invalides apr\u00e8s un ajout : on les relit \u00e0 chaque fois
    function anims() { return L.property('ADBE Text Properties').property('ADBE Text Animators'); }
    function last() { var x = anims(); return x.property(x.numProperties); }
    function addAnimator(name, props) {
      anims().addProperty('ADBE Text Animator');
      last().name = name;
      for (var j = 0; j < props.length; j++) last().property('ADBE Text Animator Properties').addProperty(props[j]);
      last().property('ADBE Text Selectors').addProperty('ADBE Text Selector');
      var sel = last().property('ADBE Text Selectors').property(1);
      sel.property('ADBE Text Range Advanced').property('ADBE Text Range Units').setValue(2); // index
      return sel;
    }
    var sel, ap;
    if (d.decode) {
      var dc = d.decode;
      var started = 'var x=(time-' + dc.t0 + ')/' + dc.st + '; x<-1e-6?0:Math.min(' + dc.n + ',Math.floor(x+1e-6)+1);';
      var done = 'var x=(time-' + (dc.t0 + dc.d) + ')/' + dc.st + '; x<-1e-6?0:Math.min(' + dc.n + ',Math.floor(x+1e-6)+1);';
      // Apparition : les lettres pas encore atteintes restent invisibles
      sel = addAnimator('Apparition', ['ADBE Text Opacity']);
      sel.property('ADBE Text Index Start').expression = started;
      sel.property('ADBE Text Index End').setValue(dc.n);
      last().property('ADBE Text Animator Properties').property('ADBE Text Opacity').setValue(0);
      // D\u00e9codage : les lettres en cours d\u00e9filent (caract\u00e8res d\u00e9cal\u00e9s, orange) puis se fixent
      sel = addAnimator('D\u00e9codage', dc.c ? ['ADBE Text Character Offset', 'ADBE Text Fill Color'] : ['ADBE Text Character Offset']);
      sel.property('ADBE Text Index Start').expression = done;
      sel.property('ADBE Text Index End').expression = started;
      ap = last().property('ADBE Text Animator Properties');
      ap.property('ADBE Text Character Offset').expression = 'seedRandom(Math.floor(time*36),true); Math.floor(random(3,24));';
      if (dc.c) last().property('ADBE Text Animator Properties').property('ADBE Text Fill Color').setValue(dc.c);
    }
    if (d.appear) {
      sel = addAnimator('Frappe', ['ADBE Text Opacity']);
      setP(sel.property('ADBE Text Index Start'), d.appear);
      sel.property('ADBE Text Index End').setValue(d.text.length);
      last().property('ADBE Text Animator Properties').property('ADBE Text Opacity').setValue(0);
    }
  }

  var compItems = {};
  var folders = {};
  function folder(name) {
    if (!folders[name]) folders[name] = app.project.items.addFolder(name);
    return folders[name];
  }

  function buildComp(c) {
    current = c.name;
    var comp = app.project.items.addComp(c.name, DATA.w, DATA.h, 1, DATA.dur, DATA.fps);
    comp.bgColor = [0, 0, 0];
    comp.motionBlur = true;
    comp.shutterAngle = 180;
    comp.shutterPhase = -90;
    comp.motionBlurSamplesPerFrame = 16;
    comp.motionBlurAdaptiveSampleLimit = 128;
    if (!c.main) comp.parentFolder = folder(c.name.indexOf('HUD') === 0 ? '02 HUD' : '01 Sc\u00e8nes');
    compItems[c.name] = comp;
    var made = {}, list = [], i, d, L;
    for (i = 0; i < c.layers.length; i++) {
      d = c.layers[i];
      if (d.type === 'solid') L = comp.layers.addSolid(d.color, d.name, comp.width, comp.height, 1, comp.duration);
      else if (d.type === 'shape') L = comp.layers.addShape();
      else if (d.type === 'text') L = comp.layers.addText(d.text);
      else if (d.type === 'null') L = comp.layers.addNull(comp.duration);
      else if (d.type === 'comp') L = comp.layers.add(compItems[d.ref]);
      else if (d.type === 'audio') {
        if (!audioItems[d.file]) {
          var f = new File(DIR + '/' + d.file);
          if (!f.exists) { log('ATTENTION son introuvable : ' + d.file); continue; }
          audioItems[d.file] = app.project.importFile(new ImportOptions(f));
          audioItems[d.file].parentFolder = folder('03 Sons');
        }
        L = comp.layers.add(audioItems[d.file]);
      }
      L.name = d.name;
      made[d.name] = L;
      list.push([L, d]);
    }
    for (i = 0; i < list.length; i++) {
      d = list[i][1];
      if (d.parent) {
        if (!made[d.parent]) log('ATTENTION parent introuvable : ' + d.parent);
        else list[i][0].parent = made[d.parent];
      }
    }
    for (i = 0; i < list.length; i++) {
      L = list[i][0]; d = list[i][1];
      current = c.name + ' / ' + d.name;
      if (d.type === 'audio') {
        L.startTime = d.start;
        var db = d.db + (d.sfx ? SFX_OFFSET : 0);
        if (db) L.property('ADBE Audio Group').property('ADBE Audio Levels').setValue([db, db]);
        continue;
      }
      if (d.type === 'text') setupText(L, d);
      if (d.type === 'shape') addShapes(L.property('ADBE Root Vectors Group'), d.c);
      setTransform(L, d.tr);
      if (d.fx) addFx(L, d.fx);
      if (d.mb) L.motionBlur = true;
      L.inPoint = d['in'];
      L.outPoint = d.out;
    }
    for (i = 0; i < list.length; i++) {
      L = list[i][0]; d = list[i][1];
      if (d.matte) {
        if (!made[d.matte]) log('ATTENTION cache introuvable : ' + d.matte);
        else L.setTrackMatte(made[d.matte], TrackMatteType.ALPHA);
      }
    }
    for (i = 0; i < list.length; i++) if (list[i][1].matteOnly) list[i][0].enabled = false;
    return comp;
  }

  var t0 = new Date().getTime();
  app.beginSuppressDialogs();
  try {
    $.evalFile(new File(DIR + '/data-' + FORMAT + '.js'));
    // Gain commun des bruitages, calculé par « node sons.mjs mixer » (même équilibre que le mix master)
    var dec = new File(DIR + '/sons/decalage.js');
    if (dec.exists) { $.evalFile(dec); SFX_OFFSET = CS_SFX_OFFSET; }
    log('Bruitages : d\u00e9calage ' + SFX_OFFSET + ' dB');
    log('Construction ' + DATA.main + ' (' + DATA.w + 'x' + DATA.h + ', ' + DATA.fps + ' i/s, ' + DATA.dur + ' s)');
    var main = null;
    for (var i = 0; i < DATA.comps.length; i++) {
      var cm = buildComp(DATA.comps[i]);
      if (DATA.comps[i].main) main = cm;
    }
    main.openInViewer();
    app.project.save(new File(OUT));
    log('OK enregistr\u00e9 : ' + OUT + ' en ' + Math.round((new Date().getTime() - t0) / 1000) + ' s');
  } catch (e) {
    log('ERREUR : ' + e.toString() + ' (ligne ' + e.line + ') dans ' + current);
  }
  app.endSuppressDialogs(false);
  flush();
})();
