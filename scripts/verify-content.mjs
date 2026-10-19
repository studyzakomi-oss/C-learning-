// Vérifie TOUT le contenu : chaque solution est exécutée par le moteur de C Quest ET par gcc,
// chaque test doit passer, chaque exemple doit compiler sans avertissement, chaque « erreur fréquente » doit échouer.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { runC } from '../src/engine/index.js';
import { WORLDS, allExercises } from '../src/content/index.js';
import { gradeExercise, referenceSource, normalizeOutput, buildSource, shuffledOrder } from '../src/game/grader.js';
import { PLACEMENT } from '../src/content/placement.js';

const useGcc = !process.argv.includes('--no-gcc');
const work = mkdtempSync(join(tmpdir(), 'cqv-'));
const run = async (src, o) => runC(src, o);
let problems = 0;
let checked = 0;
const bad = (where, msg) => { problems++; console.log(`✗ ${where} : ${msg}`); };

function gcc(src, stdin = '', files = {}) {
  const dir = mkdtempSync(join(work, 'x'));
  writeFileSync(join(dir, 'main.c'), src);
  for (const [n, c] of Object.entries(files)) writeFileSync(join(dir, n), c);
  const c = spawnSync('gcc', ['-std=c99', '-Wall', '-Wextra', '-pedantic', 'main.c', '-o', 'prog', '-lm'], { cwd: dir, encoding: 'utf8' });
  if (c.status !== 0) return { ok: false, err: c.stderr };
  const r = spawnSync('./prog', [], { cwd: dir, input: stdin, encoding: 'utf8', timeout: 5000 });
  return { ok: true, warnings: c.stderr, stdout: r.stdout, status: r.status };
}

function engineWarnings(r) {
  return r.diagnostics.filter((d) => d.severity !== 'info');
}

async function checkProgram(where, src, { stdin = '', files = {}, allowWarnings = false } = {}) {
  checked++;
  const r = runC(src, { stdin, dataFiles: files });
  if (!r.compiled) return bad(where, `ne compile pas dans le moteur : ${r.diagnostics.find((d) => d.severity === 'error')?.message}`);
  if (r.runtimeError) return bad(where, `erreur d'exécution : ${r.runtimeError.message}`);
  if (!allowWarnings && engineWarnings(r).length) bad(where, `avertissement moteur : ${engineWarnings(r).map((d) => `l.${d.line} ${d.message}`).join(' | ')}`);
  if (r.runtimeWarnings.length) bad(where, `avertissement d'exécution : ${r.runtimeWarnings[0].message}`);
  if (useGcc) {
    const g = gcc(src, stdin, files);
    if (!g.ok) return bad(where, `gcc refuse : ${g.err}`);
    if (g.warnings && !allowWarnings) bad(where, `gcc avertit : ${g.warnings.split('\n')[0]}`);
    if (g.stdout !== r.stdout) bad(where, `sortie différente de gcc :\n gcc=${JSON.stringify(g.stdout)}\n cq =${JSON.stringify(r.stdout)}`);
  }
  return r;
}

async function checkExercise(e, where) {
  if (!e.id || !e.mode || !e.prompt) bad(where, 'exercice incomplet (id/mode/prompt)');
  if (e.mode === 'predict') {
    const r = await checkProgram(where, e.code, { stdin: e.stdin || '' });
    if (r && e.choices) {
      const n = e.choices.filter((c) => normalizeOutput(c) === normalizeOutput(r.stdout)).length;
      if (n !== 1) bad(where, `${n} choix correspondent à la sortie ${JSON.stringify(r.stdout)}`);
    }
    return;
  }
  const ref = referenceSource(e);
  if (!ref) return bad(where, 'pas de solution de référence');
  for (const tcase of e.tests?.length ? e.tests : [{}]) {
    await checkProgram(`${where} (solution, entrée ${JSON.stringify(tcase.stdin || '')})`, ref, { stdin: tcase.stdin || '', files: tcase.files || {} });
  }
  let sub;
  if (e.mode === 'complete') sub = { blanks: e.blanks.map((b) => b.answer) };
  else if (e.mode === 'order') sub = { order: e.lines.map((_, i) => i) };
  else sub = { code: ref };
  const g = await gradeExercise(e, sub, run);
  if (!g.passed) bad(where, `la solution ne passe pas ses propres tests (${g.stage}) ${g.ruleFailures.join(', ')}`);
  if (e.mode === 'bug') {
    const g2 = await gradeExercise(e, { code: e.starter }, run);
    if (g2.passed) bad(where, 'le code buggé passe déjà les tests');
  }
  if (e.mode === 'write' && e.starter) {
    const g2 = await gradeExercise(e, { code: e.starter }, run);
    if (g2.passed) bad(where, 'le code de départ passe déjà les tests');
  }
  if (e.mode === 'order') {
    const g3 = await gradeExercise(e, { order: shuffledOrder(e.lines.length, 7) }, run);
    if (g3.passed && buildSource(e, { order: shuffledOrder(e.lines.length, 7) }) !== ref) { /* ordre alternatif valide : accepté */ }
  }
  if (!e.hints || e.hints.length === 0) bad(where, 'aucun indice');
}

const PARTS = ['objectif', 'explication', 'syntaxe', 'exemple', 'visualisation', 'erreur', 'guide', 'mission', 'quiz', 'resume'];
const ids = new Set();
for (const w of WORLDS) {
  for (const l of w.lessons) {
    const where = `${l.id} « ${l.title} »`;
    if (ids.has(l.id)) bad(where, 'id dupliqué');
    ids.add(l.id);
    for (const p of PARTS) if (!l[p]) bad(where, `partie manquante : ${p}`);
    if (l.quiz.length < 3 || l.quiz.length > 5) bad(where, 'le quiz doit avoir 3 à 5 questions');
    for (const [i, q] of l.quiz.entries()) if (!(q.answer >= 0 && q.answer < q.choices.length) || !q.explain) bad(where, `question ${i + 1} invalide`);
    await checkProgram(`${where} exemple`, l.exemple.code, { stdin: l.exemple.stdin || '', files: l.exemple.files || {} });
    if (l.visualisation.code) await checkProgram(`${where} visualisation`, l.visualisation.code, { stdin: l.visualisation.stdin || '', files: l.visualisation.files || {} });
    const er = runC(l.erreur.code, { stdin: l.erreur.stdin || '', dataFiles: l.erreur.files || {} });
    checked++;
    const shows = !er.compiled || er.runtimeError || er.diagnostics.length || er.runtimeWarnings.length || er.leaks.length;
    if (!shows && !l.erreur.logic) bad(`${where} erreur fréquente`, 'le code « erreur » ne produit aucun diagnostic');
    await checkProgram(`${where} correction`, l.erreur.correction, { stdin: l.erreur.stdin || '', files: l.erreur.files || {} });
    await checkExercise(l.guide, `${where} guide`);
    await checkExercise(l.mission, `${where} mission`);
  }
  for (const c of w.challenges || []) await checkExercise(c, `${w.id} défi ${c.id}`);
  for (const p of w.boss.phases) await checkExercise(p, `${w.id} boss ${p.id}`);
}
for (const q of PLACEMENT) if (!(q.answer >= 0 && q.answer < q.choices.length)) bad('placement', `question invalide ${q.q}`);
const exIds = new Set();
for (const e of allExercises()) { if (exIds.has(e.id)) bad(e.id, 'id d\'exercice dupliqué'); exIds.add(e.id); }
console.log(`\n${checked} programmes vérifiés${useGcc ? ' (moteur + gcc)' : ''}, ${problems} problème(s).`);
process.exit(problems ? 1 : 0);
