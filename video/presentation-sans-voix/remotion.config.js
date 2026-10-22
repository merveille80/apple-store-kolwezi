import {Config} from '@remotion/cli/config';
import fs from 'fs';
// Chromium du conteneur cloud ; sur le Mac, Remotion utilise son navigateur par défaut
const CLOUD = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (fs.existsSync(CLOUD)) Config.setBrowserExecutable(CLOUD);
Config.setConcurrency(4);
