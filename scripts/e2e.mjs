// Tests de bout en bout dans Chromium (téléphone + tablette) : parcours complet d'une leçon,
// sauvegarde/reprise, tous les écrans, mode hors-ligne. Usage : npm run build && node scripts/e2e.mjs
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { WORLDS } from '../src/content/index.js';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }

const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
mkdirSync('screenshots', { recursive: true });
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((r) => setTimeout(r, 2500));

let failures = 0;
const check = (cond, msg) => { if (cond) console.log('  ✓ ' + msg); else { failures++; console.log('  ✗ ' + msg); } };

const DEVICES = [
  { name: 'telephone', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'tablette-paysage', viewport: { width: 1280, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1.5 },
];

const browser = await pw.chromium.launch();
const l1 = WORLDS[0].lessons[0];

async function setEditor(page, code) {
  await page.evaluate(() => { const el = document.querySelector('.cm-content'); el.scrollIntoView({ block: 'center' }); el.focus(); });
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  // insertText évite l'auto-fermeture des accolades pendant la frappe
  await page.keyboard.insertText(code);
}

for (const dev of DEVICES) {
  console.log(`\n=== ${dev.name} ${dev.viewport.width}x${dev.viewport.height}`);
  const ctx = await browser.newContext({ ...dev, locale: 'fr-FR' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = (n) => page.screenshot({ path: `screenshots/${dev.name}-${n}.png`, fullPage: false });

  await page.goto(BASE);
  await shot('01-splash');
  await page.waitForSelector('text=Bienvenue dans C Quest', { timeout: 8000 });
  await shot('02-onboarding');
  await page.click('button:has-text("Commencer l\'aventure")');
  await page.fill('input[type=text]', 'Zakomi');
  await page.click('button:has-text("Continuer →")');
  await page.click('button:has-text("Gardien des Pointeurs")');
  await shot('03-avatar');
  await page.click('button:has-text("Continuer →")');
  await page.click('button:has-text("Passer le test de placement")');
  await page.waitForSelector('text=Test de placement');
  await shot('04-placement');
  for (let i = 0; i < 13; i++) await page.locator('.quiz-choice').first().click();
  await page.waitForSelector('text=Résultat');
  await shot('05-placement-resultat');
  await page.click('button:has-text("Commencer au Monde 1")');
  await page.waitForSelector('text=Carte du Royaume');
  await shot('06-carte');

  // leçon 1 complète
  await page.goto(BASE + `#/lesson/${l1.id}/0`);
  await page.waitForSelector('text=Objectif');
  await page.waitForTimeout(500);
  await shot('07-lecon-objectif');
  for (let s = 1; s <= 5; s++) {
    await page.click('.step-nav .btn.primary', { force: true });
    await page.waitForTimeout(300);
    if (s === 3) { await page.click('text=Exécuter cet exemple'); await page.waitForSelector('text=programme terminé'); await shot('08-exemple'); }
    if (s === 4) { await page.waitForSelector('.mem, text=Aucune variable', { timeout: 8000 }).catch(() => {}); await shot('09-visualisation'); }
    if (s === 5) { await page.click('text=Ce que disent le compilateur'); await page.waitForTimeout(400); await shot('10-erreur-frequente'); }
  }
  // exercice guidé (complète le code)
  await page.click('.step-nav .btn.primary', { force: true });
  const blanks = page.locator('input.blank');
  const answers = l1.guide.blanks.map((b) => b.answer);
  for (let i = 0; i < answers.length; i++) await blanks.nth(i).fill(answers[i]);
  await page.click('text=Vérifier en exécutant');
  await page.waitForSelector('text=Réussi !', { timeout: 10000 });
  await shot('11-guide-reussi');
  check(true, 'exercice guidé réussi');

  // mission : d'abord une erreur pour voir le tuteur, puis la solution
  await page.click('.step-nav .btn.primary', { force: true });
  await page.waitForSelector('.cm-content');
  await setEditor(page, '#include <stdio.h>\n\nint main(void)\n{\n    printf("Bonjour\\n")\n    return 0;\n}\n');
  await page.click('text=✔ Soumettre');
  await page.waitForSelector('.tutor', { timeout: 10000 });
  await shot('12-tuteur-erreur');
  check(await page.locator('text=Point-virgule manquant').count() > 0, 'le tuteur identifie le point-virgule manquant');
  await setEditor(page, l1.mission.solution);
  await page.click('text=✔ Soumettre');
  await page.waitForSelector('text=Réussi !', { timeout: 10000 });
  await shot('13-mission-reussie');

  // quiz
  await page.click('.step-nav .btn.primary', { force: true });
  for (const q of l1.quiz) {
    await page.locator('.quiz-choice').nth(q.answer).click();
    await page.locator('button:has-text("Question suivante"), button:has-text("Voir le résultat")').click();
  }
  await page.waitForSelector('text=bonnes réponses');
  await shot('14-quiz');
  await page.click('.step-nav .btn.primary', { force: true });
  await page.waitForSelector('text=Validation de la leçon');
  check(await page.locator('text=Terminée').count() > 0, 'leçon 1 marquée terminée');
  await shot('15-resume');

  // reprise après fermeture
  const xpBefore = await page.locator('.chip.xp').innerText();
  await page.goto(BASE + '#/lesson/w1l2/4');
  await page.waitForTimeout(800);
  await page.close();
  const page2 = await ctx.newPage();
  page2.on('pageerror', (e) => errors.push(e.message));
  await page2.goto(BASE);
  await page2.waitForTimeout(2600);
  check(page2.url().includes('#/lesson/w1l2/4'), `reprise exacte à la dernière étape (${page2.url().split('#')[1]})`);
  check((await page2.locator('.chip.xp').innerText()) === xpBefore, 'niveau conservé après rechargement');

  // tous les écrans
  const routes = ['/', '/map', '/world/w1', '/world/w2', '/review', '/sandbox', '/profile', '/skills', '/stats', '/settings', '/boss/w1', '/exercise/w1-c1'];
  for (const r of routes) {
    await page2.goto(BASE + '#' + r);
    await page2.waitForTimeout(500);
    const overflow = await page2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(overflow <= 1, `écran ${r} sans débordement horizontal (${overflow}px)`);
    await page2.screenshot({ path: `screenshots/${dev.name}-route${r.replace(/\//g, '_') || '_home'}.png` });
  }
  // labo : exécution avec entrée
  await page2.goto(BASE + '#/sandbox');
  await page2.click('text=Table de multiplication');
  await page2.click('text=▶ Exécuter');
  await page2.waitForSelector('text=programme terminé', { timeout: 10000 });
  check(await page2.locator('.console >> text=10 x 7 =  70').count() > 0, 'le labo exécute un programme avec scanf');
  await page2.screenshot({ path: `screenshots/${dev.name}-labo.png` });
  // boucle infinie arrêtée proprement
  await setEditor(page2, '#include <stdio.h>\nint main(void)\n{\n    int i = 0;\n    while (i < 10) { }\n    return 0;\n}\n');
  await page2.click('text=▶ Exécuter');
  await page2.waitForSelector('text=boucle infinie', { timeout: 15000 });
  check(true, 'boucle infinie détectée et arrêtée');

  // hors-ligne
  await page2.goto(BASE);
  await page2.evaluate(() => navigator.serviceWorker.ready);
  await page2.waitForTimeout(1500);
  await ctx.setOffline(true);
  await page2.reload();
  await page2.waitForTimeout(2500);
  check(await page2.locator('text=Hors-ligne').count() > 0 || await page2.locator('.bottomnav').count() > 0, 'l\'application se recharge hors-ligne');
  await page2.goto(BASE + '#/sandbox');
  await page2.click('button:has-text("Hello World")');
  await page2.click('text=▶ Exécuter');
  await page2.waitForSelector('text=programme terminé', { timeout: 10000 }).catch(() => {});
  check(await page2.locator('text=programme terminé').count() > 0, 'compilation et exécution hors-ligne');
  await ctx.setOffline(false);

  check(errors.length === 0, `aucune erreur JavaScript${errors.length ? ' : ' + errors.slice(0, 3).join(' | ') : ''}`);
  await ctx.close();
}

// --- combat de boss complet, déblocage du monde suivant, révision, thème clair ---
{
  console.log('\n=== boss + révision + thème clair (téléphone)');
  const w1 = WORLDS[0];
  const lessons = Object.fromEntries(w1.lessons.map((l) => [l.id, { step: 9, missionPassed: true, quizBest: 100, missionScore: 90, completedAt: '2026-10-18T10:00:00Z' }]));
  const cards = Object.fromEntries(w1.lessons[0].quiz.map((_, i) => [`${w1.lessons[0].id}-q${i}`, { box: 1, due: '2020-01-01', seen: 1, good: 1 }]));
  const save = { version: 1, profile: { name: 'Testeur', onboarded: true, avatar: { color: '#22d3ee', cls: 'mage' } }, xp: 600, coins: 80, lessons, cards, settings: { theme: 'light', editorFontSize: 15, fontScale: 1, bossTimer: true } };
  const ctx = await browser.newContext({ ...DEVICES[0], locale: 'fr-FR' });
  await ctx.addInitScript((data) => { if (!sessionStorage.getItem('init')) { localStorage.setItem('cquest.save.v1', data); sessionStorage.setItem('init', '1'); sessionStorage.setItem('cq-resumed', '1'); } }, JSON.stringify(save));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE + '#/world/w2');
  await page.waitForTimeout(2200);
  check(await page.locator('text=Monde verrouillé').count() > 0, 'Monde 2 verrouillé tant que le boss n\'est pas vaincu');
  await page.goto(BASE + '#/boss/w1');
  await page.click('button:has-text("Commencer le combat")');
  // phase 1 : prédiction
  const p1 = w1.boss.phases[0];
  const { runC } = await import('../src/engine/index.js');
  const { normalizeOutput } = await import('../src/game/grader.js');
  const out = runC(p1.code).stdout;
  const k = p1.choices.findIndex((c) => normalizeOutput(c) === normalizeOutput(out));
  await page.locator('.quiz-choice').nth(k).click();
  await page.click('button:has-text("Valider ma prédiction")');
  await page.waitForSelector('text=Phase 2/3', { timeout: 10000 });
  await page.screenshot({ path: 'screenshots/boss-phase2.png' });
  await setEditor(page, w1.boss.phases[1].solution);
  await page.click('text=✔ Soumettre');
  await page.waitForSelector('text=Phase 3/3', { timeout: 10000 });
  await setEditor(page, w1.boss.phases[2].solution);
  await page.click('text=✔ Soumettre');
  await page.waitForSelector('text=Victoire', { timeout: 10000 });
  await page.screenshot({ path: 'screenshots/boss-victoire.png' });
  check(true, 'boss du Monde 1 vaincu en 3 phases');
  await page.goto(BASE + '#/world/w2');
  await page.waitForTimeout(600);
  check(await page.locator('text=Variables et Types').count() > 0 && await page.locator('text=Monde verrouillé').count() === 0, 'Monde 2 débloqué après la victoire');
  await page.goto(BASE + '#/review');
  await page.click('button:has-text("Réviser")');
  for (let i = 0; i < w1.lessons[0].quiz.length; i++) {
    await page.locator('.quiz-choice').first().click();
    await page.click('button:has-text("Suivant")');
  }
  await page.waitForSelector('text=Révision terminée');
  check(true, 'session de révision espacée terminée');
  await page.goto(BASE + '#/');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/theme-clair-accueil.png' });
  check(await page.evaluate(() => document.documentElement.dataset.theme) === 'light', 'thème clair appliqué');
  check(errors.length === 0, `aucune erreur JavaScript${errors.length ? ' : ' + errors.join(' | ') : ''}`);
  await ctx.close();
}

await browser.close();
server.kill();
console.log(failures ? `\n${failures} échec(s)` : '\nTous les tests de bout en bout passent.');
process.exit(failures ? 1 : 0);
