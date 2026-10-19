// Correction des exercices : le code est EXÉCUTÉ et sa sortie comparée à celle de la solution de référence.
// Les mots-clés seuls ne suffisent jamais : seules les contraintes « require/forbid » complètent les tests.

export const BLANK = '⟦⟧';

/** Normalise une sortie : fins de ligne, espaces en fin de ligne, lignes vides finales. */
export function normalizeOutput(s) {
  return String(s ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

/** Retire commentaires et chaînes pour tester la présence d'une construction. */
export function stripCode(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""')
    .replace(/'(?:\\.|[^'\\\n])*'/g, "''");
}

/** Construit le code source à partir de la réponse du joueur selon le mode. */
export function buildSource(ex, sub) {
  switch (ex.mode) {
    case 'complete': {
      let i = 0;
      return ex.template.replace(/⟦⟧/g, () => (sub.blanks?.[i++] ?? '').trim());
    }
    case 'order': {
      const prefix = ex.prefix ? ex.prefix + '\n' : '';
      const suffix = ex.suffix ? '\n' + ex.suffix : '';
      return prefix + sub.order.map((k) => ex.lines[k]).join('\n') + suffix;
    }
    default:
      return sub.code ?? '';
  }
}

/** Programme complet à compiler : main.c seul, ou avec les fichiers fournis par l'exercice. */
export function programFiles(ex, mainSource) {
  return ex.files ? { ...ex.files, 'main.c': mainSource } : mainSource;
}

/** Solution de référence d'un exercice. */
export function referenceSource(ex) {
  if (ex.mode === 'complete') {
    let i = 0;
    return ex.template.replace(/⟦⟧/g, () => ex.blanks[i++].answer);
  }
  if (ex.mode === 'order') {
    return (ex.prefix ? ex.prefix + '\n' : '') + ex.lines.join('\n') + (ex.suffix ? '\n' + ex.suffix : '');
  }
  if (ex.mode === 'predict') return ex.code;
  return ex.solution;
}

function firstDiff(expected, got) {
  const a = expected.split('\n'), b = got.split('\n');
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) return { line: i + 1, expected: a[i] ?? null, got: b[i] ?? null };
  }
  return null;
}

const refCache = new Map();

/**
 * Calcule la sortie attendue de chaque test (explicite ou issue de la solution).
 * @param {(src:string, opts:object)=>Promise<any>} run
 */
export async function expectedOutputs(ex, run) {
  const ref = referenceSource(ex);
  const out = [];
  for (const t of ex.tests || [{}]) {
    if (t.expect !== undefined || t.match) { out.push({ stdout: t.expect, files: t.expectFiles }); continue; }
    const key = ref + '\u0000' + (t.stdin || '') + '\u0000' + JSON.stringify(t.files || {});
    let r = refCache.get(key);
    if (!r) {
      r = await run(programFiles(ex, ref), { stdin: t.stdin || '', dataFiles: t.files || {} });
      if (!r.compiled || r.runtimeError) {
        throw new Error(`Solution de référence invalide pour ${ex.id} : ${r.runtimeError?.message || r.diagnostics?.[0]?.message}`);
      }
      refCache.set(key, r);
    }
    out.push({ stdout: r.stdout, files: t.expectFiles ? r.files : undefined });
  }
  return out;
}

/**
 * Corrige une réponse.
 * @returns {Promise<{passed:boolean, stage:string, tests:any[], diagnostics:any[], run:any, source:string, ruleFailures:string[]}>}
 */
export async function gradeExercise(ex, sub, run) {
  if (ex.mode === 'predict') {
    const r = await run(ex.code, { stdin: ex.stdin || '' });
    const actual = r.stdout;
    let passed;
    if (ex.choices && typeof sub.choice === 'number') passed = normalizeOutput(ex.choices[sub.choice]) === normalizeOutput(actual);
    else passed = normalizeOutput(sub.prediction) === normalizeOutput(actual);
    return {
      passed, stage: passed ? 'ok' : 'output', source: ex.code, run: r, diagnostics: r.diagnostics, ruleFailures: [],
      tests: [{ name: 'Prédiction', expected: actual, got: ex.choices && typeof sub.choice === 'number' ? ex.choices[sub.choice] : sub.prediction, passed, diff: passed ? null : firstDiff(normalizeOutput(actual), normalizeOutput(sub.prediction ?? ex.choices?.[sub.choice] ?? '')) }],
    };
  }
  const source = buildSource(ex, sub);
  const tests = ex.tests && ex.tests.length ? ex.tests : [{}];
  const expected = await expectedOutputs(ex, run);
  const results = [];
  let firstRun = null;
  let stage = 'ok';
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    const r = await run(programFiles(ex, source), { stdin: t.stdin || '', dataFiles: t.files || {} });
    if (!firstRun) firstRun = r;
    if (!r.compiled) {
      return { passed: false, stage: 'compile', source, run: r, diagnostics: r.diagnostics, tests: [], ruleFailures: [] };
    }
    const got = normalizeOutput(r.stdout);
    let passed;
    let exp = expected[i].stdout;
    if (t.match) {
      passed = new RegExp(t.match, t.flags || '').test(normalizeOutput(r.stdout));
      exp = t.matchLabel || exp || '';
    } else passed = got === normalizeOutput(exp);
    let fileFail = null;
    if (passed && t.expectFiles) {
      for (const [name, content] of Object.entries(expected[i].files || t.expectFiles)) {
        if (normalizeOutput(r.files[name]) !== normalizeOutput(content)) { passed = false; fileFail = { name, expected: content, got: r.files[name] ?? null }; break; }
      }
    }
    if (r.runtimeError) passed = false;
    results.push({
      name: t.name || `Test ${i + 1}`, hidden: !!t.hidden, stdin: t.stdin || '', expected: exp ?? '', got: r.stdout, passed,
      runtimeError: r.runtimeError, fileFail, diff: passed || t.match ? null : firstDiff(normalizeOutput(exp), got), run: r,
    });
    if (!passed && stage === 'ok') stage = r.runtimeError ? 'runtime' : 'output';
  }
  const stripped = stripCode(source);
  const ruleFailures = [];
  for (const rule of ex.require || []) if (!new RegExp(rule.pattern).test(rule.raw ? source : stripped)) ruleFailures.push(rule.message);
  for (const rule of ex.forbid || []) if (new RegExp(rule.pattern).test(rule.raw ? source : stripped)) ruleFailures.push(rule.message);
  const allPassed = results.every((x) => x.passed);
  if (allPassed && ruleFailures.length) stage = 'rules';
  return {
    passed: allPassed && ruleFailures.length === 0,
    stage,
    source,
    run: firstRun,
    diagnostics: firstRun?.diagnostics || [],
    tests: results,
    ruleFailures,
  };
}

/** Mélange déterministe (pour l'exercice « remets les lignes en ordre »). */
export function shuffledOrder(n, seed = 1) {
  const idx = [...Array(n).keys()];
  let h = seed >>> 0 || 1;
  for (let i = n - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
    const j = h % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  if (n > 1 && idx.every((v, i) => v === i)) [idx[0], idx[1]] = [idx[1], idx[0]];
  return idx;
}
