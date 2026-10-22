// Construit Presentation-SansVoix-16x9.aep dans un nouveau projet. Fichier > Scripts > Exécuter le fichier de script…
var FORMAT = '16x9';
app.newProject();
$.evalFile(new File(File($.fileName).parent.fsName + "/Presentation-SansVoix.jsx"));
