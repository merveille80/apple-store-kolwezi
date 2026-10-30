// Rend la composition principale du projet ouvert (« CyberSpace 9:16 » ou « CyberSpace 16:9 ») en 4K 60 i/s :
// qualité optimale, résolution complète, flou de bougé activé, en Apple ProRes dans rendus-ae/.
// Le son final (mix master) est ajouté ensuite par « node livrer.mjs ».
(function () {
  var DIR = (typeof CS_DIR !== 'undefined') ? CS_DIR : File($.fileName).parent.fsName;
  var OUTDIR = (typeof CS_RENDU_DIR !== 'undefined') ? CS_RENDU_DIR : DIR + '/rendus-ae';
  var lines = [];
  function log(s) { lines.push(s); }
  function pick(list, res) {
    for (var r = 0; r < res.length; r++) for (var j = 0; j < list.length; j++) if (res[r].test(list[j])) return list[j];
    return null;
  }
  var comp = null, fmt = '', i;
  try {
    for (i = 1; i <= app.project.numItems; i++) {
      var it = app.project.item(i);
      if (it instanceof CompItem && /^CyberSpace (9:16|16:9)$/.test(it.name)) comp = it;
    }
    if (!comp) throw new Error('composition principale introuvable');
    fmt = comp.name.replace('CyberSpace ', '').replace(':', 'x');
    new Folder(OUTDIR).create();
    var rq = app.project.renderQueue;
    for (i = rq.numItems; i >= 1; i--) if (rq.item(i).comp === comp && rq.item(i).status !== RQItemStatus.RENDERING) rq.item(i).remove();
    var item = rq.items.add(comp);
    var rs = pick(item.templates, [/^Best Settings$/i, /optimaux/i, /^Meilleur/i]);
    if (rs) item.applyTemplate(rs);
    log('Paramètres de rendu : ' + rs + ' (disponibles : ' + item.templates.join(' | ') + ')');
    try {
      item.setSettings({'Quality': 'Best', 'Resolution': 'Full', 'Motion Blur': 'On for Checked Layers', 'Frame Blending': 'Off for All Layers'});
    } catch (e) { log('setSettings rendu : ' + e); }
    var om = item.outputModule(1);
    var omt = pick(om.templates, [/ProRes 422 HQ/i, /ProRes 4444/i, /^High Quality$/i, /^Haute qualit/i, /^Lossless$/i, /^Sans perte$/i]);
    if (omt) om.applyTemplate(omt);
    log('Module de sortie : ' + omt + ' (disponibles : ' + om.templates.join(' | ') + ')');
    om.file = new File(OUTDIR + '/cyberspace-motion-' + fmt + '-ae.mov');
    log('Sortie : ' + om.file.fsName);
    app.project.save();
    var t0 = new Date().getTime();
    rq.render();
    log('Rendu terminé en ' + Math.round((new Date().getTime() - t0) / 1000) + ' s, statut ' + item.status);
  } catch (e) {
    log('ERREUR : ' + e.toString() + ' (ligne ' + e.line + ')');
  }
  var f = new File(DIR + '/rendu-' + (fmt || 'inconnu') + '.log');
  f.encoding = 'UTF-8';
  f.open('w');
  f.write(lines.join('\n'));
  f.close();
})();
