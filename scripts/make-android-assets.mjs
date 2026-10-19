// Remplace les icônes et écrans de lancement Android par défaut (Capacitor) par ceux de C Quest.
// Usage : node scripts/make-android-assets.mjs (après « npx cap add android »)
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }

const res = 'android/app/src/main/res';
const svg = readFileSync('public/icons/icon.svg', 'utf8');
// motif seul (sans fond arrondi) pour le premier plan de l'icône adaptative
const motif = svg.replace(/<rect[^>]*\/>/, '');
const browser = await pw.chromium.launch();
async function render(file, w, h, html) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(`<html><body style="margin:0;width:${w}px;height:${h}px;overflow:hidden">${html}</body></html>`);
  await page.screenshot({ path: file, omitBackground: true });
  await page.close();
}
const pngSize = (f) => { const b = readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
for (const dir of readdirSync(res)) {
  const d = join(res, dir);
  for (const name of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png', 'splash.png']) {
    const f = join(d, name);
    if (!existsSync(f)) continue;
    const [w, h] = pngSize(f);
    const s = Math.min(w, h);
    if (name === 'ic_launcher.png') await render(f, w, h, svg.replace('<svg ', `<svg width="${w}" height="${h}" `));
    else if (name === 'ic_launcher_round.png') await render(f, w, h, `<div style="width:${w}px;height:${h}px;border-radius:50%;overflow:hidden;background:#070b1a">${svg.replace('<svg ', `<svg width="${w}" height="${h}" `)}</div>`);
    else if (name === 'ic_launcher_foreground.png') {
      const inner = Math.round(s * 0.62);
      await render(f, w, h, `<div style="width:${w}px;height:${h}px;display:grid;place-items:center">${motif.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div>`);
    } else {
      const icon = Math.round(s * 0.32);
      await render(f, w, h, `<div style="width:${w}px;height:${h}px;display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,#16214a,#070b1a 70%)">${svg.replace('<svg ', `<svg width="${icon}" height="${icon}" `)}</div>`);
    }
  }
}
writeFileSync(join(res, 'values/ic_launcher_background.xml'), '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#070B1A</color>\n</resources>\n');
await browser.close();
console.log('ressources Android générées');
