// Construit CyberSpace-9x16.aep : composition principale « CyberSpace 9:16 » (2160 × 3840, 60 i/s, 19,6 s).
// Dans After Effects : Fichier > Scripts > Exécuter le fichier de script… puis choisir ce fichier.
// Le projet ouvert est fermé (sans rien perdre : le script s'arrête s'il a des changements non enregistrés).
(function () {
  if (app.project && app.project.dirty) {
    alert('Enregistre ou ferme le projet ouvert avant de lancer la construction.');
    return;
  }
  app.newProject();
  CS_DIR = File($.fileName).parent.fsName;
  CS_FORMAT = '9x16';
  $.evalFile(new File(CS_DIR + '/CyberSpace-AE.jsx'));
})();
