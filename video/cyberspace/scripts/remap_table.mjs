import {remap} from '../src/remap.js';
const rows = [];
for (let i = 0; i <= 50500; i += 5) rows.push((i / 1000).toFixed(3) + ' ' + remap(i / 1000).toFixed(5));
console.log(rows.join('\n'));
