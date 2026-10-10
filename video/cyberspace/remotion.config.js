import {Config} from '@remotion/cli/config';
import fs from 'fs';

// Cloud (Linux sans carte graphique) : Chromium fourni + rendu WebGL logiciel.
// Mac / PC avec carte graphique : Chrome de Remotion + WebGL accéléré (ANGLE).
const LINUX_SHELL = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (fs.existsSync(LINUX_SHELL)) {
  Config.setBrowserExecutable(LINUX_SHELL);
  Config.setChromiumOpenGlRenderer('swangle');
  Config.setConcurrency(4);
} else {
  Config.setChromiumOpenGlRenderer('angle');
}
