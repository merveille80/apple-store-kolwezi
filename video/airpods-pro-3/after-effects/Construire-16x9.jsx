// Construit AirPods-Pro-3-16x9.aep : composition « AirPods Pro 3 16:9 » (3840 × 2160, 60 i/s, 11,1 s).
// Dans After Effects : Fichier > Scripts > Exécuter le fichier de script… puis choisir ce fichier.
(function () {
  if (app.project && app.project.dirty) {
    alert('Enregistre ou ferme le projet ouvert avant de lancer la construction.');
    return;
  }
  app.newProject();
  AP_DIR = File($.fileName).parent.fsName;
  AP_FORMAT = '16x9';
  $.evalFile(new File(AP_DIR + '/AirPods-AE.jsx'));
})();
