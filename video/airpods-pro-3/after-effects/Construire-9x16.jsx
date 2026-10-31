// Construit AirPods-Pro-3-9x16.aep : composition « AirPods Pro 3 9:16 » (2160 × 3840, 60 i/s, 11,1 s).
// Dans After Effects : Fichier > Scripts > Exécuter le fichier de script… puis choisir ce fichier.
(function () {
  if (app.project && app.project.dirty) {
    alert('Enregistre ou ferme le projet ouvert avant de lancer la construction.');
    return;
  }
  app.newProject();
  AP_DIR = File($.fileName).parent.fsName;
  AP_FORMAT = '9x16';
  $.evalFile(new File(AP_DIR + '/AirPods-AE.jsx'));
})();
