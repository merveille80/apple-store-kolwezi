// Sous-titres animés (mot par mot) pour le projet After Effects ouvert (composition « 9:16 » ou « 16:9 »).
// Lit sous-titres.json (produit par sous-titres.py), construit une précomposition « Sous-titres » au-dessus de tout,
// puis enregistre le projet. Relançable : l'ancienne précomposition est remplacée.
// Erreurs écrites dans erreur-sous-titres.txt (jamais de fenêtre bloquante).

(function () {
  var BASE = File($.fileName).parent;
  var LOG = new File(BASE.fsName + '/erreur-sous-titres.txt'); if (LOG.exists) LOG.remove();
  app.beginSuppressDialogs();
  try {
    var proj = app.project, main = null;
    for (var i = 1; i <= proj.numItems; i++) {
      var it = proj.item(i);
      if (it instanceof CompItem && (it.name === '9:16' || it.name === '16:9')) main = it;
    }
    if (!main) throw new Error('Composition 9:16 ou 16:9 introuvable');
    var V = main.name === '9:16';

    var f = new File(BASE.fsName + '/sous-titres.json'); f.encoding = 'UTF-8'; f.open('r'); var src = f.read(); f.close();
    var DATA = eval('(' + src + ')'); // JSON produit par notre sous-titres.py (ExtendScript n'a pas JSON.parse)

    // Style : Helvetica Neue, texte encre sur pastille blanche translucide (iOS), mot en cours noir, mots dits gris
    var S = V ? {size: 104, padX: 54, padY: 34, maxW: 1700, shadow: 50} : {size: 80, padX: 42, padY: 26, maxW: 1000, shadow: 40};
    var INK = [0.114, 0.114, 0.122], DONE = [0.43, 0.43, 0.45];

    // Placement (pixels 4K). 16:9 : tiers bas du cadre de l'avatar. 9:16 : selon le mode de la scène.
    var SCENES = [0, 3.4, 6.4, 10.2, 12.5, 14.3, 17.2, 20.8, 23.8, 28.2, 31.8, 36.2];
    var POS9 = [[1080, 2330], [1080, 3330], [1080, 2780], [1080, 2780], [1080, 3330], [1080, 2780],
                [1080, 2780], [1080, 2780], [1080, 2780], [1080, 2950], [1080, 3330], [1080, 2780]];
    function posAt(t) {
      if (!V) return [784, 1650];
      var k = 0; for (var s = 0; s < SCENES.length; s++) if (t >= SCENES[s] - 0.05) k = s;
      return POS9[k];
    }

    app.beginUndoGroup('Sous-titres ' + main.name);
    // Remplace une version précédente
    for (i = main.numLayers; i >= 1; i--) if (main.layer(i).name === 'Sous-titres') main.layer(i).remove();
    for (i = proj.numItems; i >= 1; i--) { var o = proj.item(i); if (o instanceof CompItem && o.name === 'Sous-titres ' + main.name) o.remove(); }

    var sub = proj.items.addComp('Sous-titres ' + main.name, main.width, main.height, 1, main.duration, main.frameRate);
    sub.bgColor = [1, 1, 1];
    sub.motionBlur = true;

    function ex(arr) { var a = []; for (var q = 0; q < arr.length; q++) a.push(arr[q]); return '[' + a.join(',') + ']'; }

    for (var g = 0; g < DATA.groupes.length; g++) {
      var G = DATA.groupes[g];
      var tin = Math.max(0, G.debut), tout = Math.min(main.duration, G.fin);
      if (tout <= tin) continue;
      var starts = [], keys = [];
      for (var w = 0; w < G.mots.length; w++) { starts.push(G.mots[w].t); keys.push(G.mots[w].cle ? 1 : 0); }

      var tl = sub.layers.addText(G.texte);
      tl.name = (g + 1 < 10 ? '0' : '') + (g + 1) + ' · ' + G.texte;
      var td = tl.property('ADBE Text Properties').property('ADBE Text Document');
      var doc = td.value;
      doc.resetCharStyle(); doc.resetParagraphStyle();
      doc.font = 'HelveticaNeue-Bold'; doc.fontSize = S.size; doc.applyFill = true; doc.fillColor = INK; doc.applyStroke = false;
      doc.tracking = -4; doc.justification = ParagraphJustification.CENTER_JUSTIFY;
      td.setValue(doc);
      // Mots clés en gras, le reste en Medium (API CharacterRange, AE 24.3+ ; sinon tout reste en gras)
      try {
        doc = td.value;
        doc.characterRange(0, G.texte.length).font = 'HelveticaNeue-Medium';
        var pos = 0, parts = G.texte.split(' ');
        for (w = 0; w < parts.length; w++) {
          if (keys[w]) doc.characterRange(pos, pos + parts[w].length).font = 'HelveticaNeue-Bold';
          pos += parts[w].length + 1;
        }
        td.setValue(doc);
      } catch (eRange) {}

      var more = tl.property('ADBE Text Properties').property('ADBE Text More Options');
      more.property('ADBE Text Anchor Point Option').setValue(2); // ancrage par mot (pour le pop d'échelle)
      more.property('ADBE Text Anchor Point Align').setValue([0, -30]);

      // Centre du texte complet (tous les mots visibles) : ancre fixe, pastille fixe, pas de tremblement
      var r = tl.sourceRectAtTime(tout - 0.01, false);
      var tr = tl.property('ADBE Transform Group');
      tr.property('ADBE Anchor Point').setValue([r.left + r.width / 2, r.top + r.height / 2]);
      var P = posAt(tin + 0.1);
      tr.property('ADBE Position').setValue(P);
      var fit = Math.min(1, S.maxW / (r.width + 2 * S.padX));
      // Entrée du groupe : légère montée d'échelle 96 % -> 100 %
      var sc = tr.property('ADBE Scale');
      sc.setValueAtTime(tin, [96 * fit, 96 * fit]); sc.setValueAtTime(tin + 0.22, [100 * fit, 100 * fit]);
      var op = tr.property('ADBE Opacity');
      op.setValueAtTime(tin, 0); op.setValueAtTime(tin + 0.12, 100);
      if (g === DATA.groupes.length - 1 || DATA.groupes[g + 1].debut > tout + 0.05) { op.setValueAtTime(tout - 0.18, 100); op.setValueAtTime(tout, 0); }
      for (var kk = 1; kk <= sc.numKeys; kk++) { var e = [new KeyframeEase(0, 70), new KeyframeEase(0, 70), new KeyframeEase(0, 70)]; sc.setTemporalEaseAtKey(kk, e, e); }

      var anims = tl.property('ADBE Text Properties').property('ADBE Text Animators');
      var T = 'var s=' + ex(starts) + ',k=' + ex(keys) + ',i=textIndex-1,t=s[i],n=(i+1<s.length)?s[i+1]:' + (tout + 1) + ';';

      // 1. Apparition par mot : opacité, montée de 20 px, flou qui se résorbe (0,16 s)
      var a1 = anims.addProperty('ADBE Text Animator'); a1.name = 'Apparition';
      var p1 = a1.property('ADBE Text Animator Properties');
      p1.addProperty('ADBE Text Opacity').setValue(0);
      p1.addProperty('ADBE Text Position 3D').setValue([0, V ? 26 : 20, 0]);
      p1.addProperty('ADBE Text Blur').setValue([10, 10]);
      var s1 = a1.property('ADBE Text Selectors').addProperty('ADBE Text Expressible Selector');
      s1.property('ADBE Text Range Type2').setValue(3); // par mots
      s1.property('ADBE Text Expressible Amount').expression = T + 'var p=ease(time,t-0.03,t+0.16,100,0);[p,p,p]';

      // 2. Mots déjà dits en gris, mot en cours en noir
      var a2 = anims.addProperty('ADBE Text Animator'); a2.name = 'Mots dits (gris)';
      var p2 = a2.property('ADBE Text Animator Properties');
      p2.addProperty('ADBE Text Fill Color').setValue(DONE);
      var s2 = a2.property('ADBE Text Selectors').addProperty('ADBE Text Expressible Selector');
      s2.property('ADBE Text Range Type2').setValue(3);
      s2.property('ADBE Text Expressible Amount').expression = T + 'var p=(n==t)?0:ease(time,n-0.02,n+0.1,0,100);[p,p,p]';

      // 3. Mots clés : petit pop d'échelle 105 % pendant qu'ils sont prononcés
      var a3 = anims.addProperty('ADBE Text Animator'); a3.name = 'Mots clés (pop)';
      var p3 = a3.property('ADBE Text Animator Properties');
      p3.addProperty('ADBE Text Scale 3D').setValue([105, 105, 100]);
      var s3 = a3.property('ADBE Text Selectors').addProperty('ADBE Text Expressible Selector');
      s3.property('ADBE Text Range Type2').setValue(3);
      s3.property('ADBE Text Expressible Amount').expression = T + 'var p=k[i]?(ease(time,t,t+0.12,0,100)-ease(time,n,n+0.15,0,100)):0;[p,p,p]';

      tl.inPoint = tin; tl.outPoint = tout;

      // Pastille blanche translucide (style iOS), enfant du texte : suit sa position et son échelle
      var pill = sub.layers.addShape();
      pill.name = 'Pastille ' + (g + 1 < 10 ? '0' : '') + (g + 1);
      var grp = pill.property('ADBE Root Vectors Group').addProperty('ADBE Vector Group');
      var rect = grp.property('ADBE Vectors Group').addProperty('ADBE Vector Shape - Rect');
      var fill = grp.property('ADBE Vectors Group').addProperty('ADBE Vector Graphic - Fill');
      fill.property('ADBE Vector Fill Color').setValue([1, 1, 1]);
      fill.property('ADBE Vector Fill Opacity').setValue(90);
      var w0 = r.width + 2 * S.padX, h0 = r.height + 2 * S.padY;
      rect = pill.property('ADBE Root Vectors Group').property(1).property('ADBE Vectors Group').property('ADBE Vector Shape - Rect');
      rect.property('ADBE Vector Rect Size').setValue([w0, h0]);
      rect.property('ADBE Vector Rect Position').setValue([r.left + r.width / 2, r.top + r.height / 2]);
      rect.property('ADBE Vector Rect Roundness').setValue(h0 / 2);
      var ds = pill.property('ADBE Effect Parade').addProperty('ADBE Drop Shadow');
      ds.property('ADBE Drop Shadow-0001').setValue([0, 0, 0, 1]);
      var dop = ds.property('ADBE Drop Shadow-0002');
      dop.setValue(dop.hasMax && dop.maxValue > 100 ? 0.16 * dop.maxValue : 16);
      ds.property('ADBE Drop Shadow-0003').setValue(180);
      ds.property('ADBE Drop Shadow-0004').setValue(V ? 14 : 10);
      ds.property('ADBE Drop Shadow-0005').setValue(S.shadow);
      pill.moveAfter(tl);
      pill.parent = tl;
      var ptr = pill.property('ADBE Transform Group');
      ptr.property('ADBE Anchor Point').setValue([0, 0]);
      ptr.property('ADBE Position').setValue([0, 0]);
      ptr.property('ADBE Scale').setValue([100, 100]);
      ptr.property('ADBE Opacity').expression = 'parent.transform.opacity';
      pill.inPoint = tin; pill.outPoint = tout;
      pill.label = 0; tl.label = 14;
    }

    var L = main.layers.add(sub);
    L.name = 'Sous-titres';
    L.moveToBeginning();
    L.label = 14;
    app.endUndoGroup();
    proj.save();
  } catch (err) {
    LOG.encoding = 'UTF-8'; LOG.open('w'); LOG.write(err.toString() + ' (ligne ' + err.line + ')'); LOG.close();
  } finally {
    app.endSuppressDialogs(false);
  }
})();
