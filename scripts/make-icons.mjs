// Génère les icônes PNG de la PWA à partir de l'icône SVG (nécessite Playwright + Chromium).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const svg = readFileSync('public/icons/icon.svg', 'utf8');
const browser = await pw.chromium.launch();
for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<html><body style="margin:0;background:#070b1a">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: `public/icons/icon-${size}.png` });
  await page.close();
}
await browser.close();
console.log('icônes générées');
