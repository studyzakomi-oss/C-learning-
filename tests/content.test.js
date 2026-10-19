// Le contenu respecte le format imposé et chaque exercice a une solution qui passe ses propres tests.
import { describe, it, expect } from 'vitest';
import { runC } from '../src/engine/index.js';
import { WORLDS, allExercises } from '../src/content/index.js';
import { gradeExercise, referenceSource, normalizeOutput } from '../src/game/grader.js';

const PARTS = ['objectif', 'explication', 'syntaxe', 'exemple', 'visualisation', 'erreur', 'guide', 'mission', 'quiz', 'resume'];
const run = async (src, o) => runC(src, o);

describe('structure du curriculum', () => {
  it('10 mondes, chacun avec des leçons, des défis et un boss en plusieurs phases', () => {
    expect(WORLDS).toHaveLength(10);
    for (const w of WORLDS) {
      expect(w.lessons.length).toBeGreaterThanOrEqual(4);
      expect(w.boss.phases.length).toBeGreaterThanOrEqual(3);
    }
  });
  it('chaque leçon contient les 10 parties obligatoires et un quiz de 3 à 5 questions', () => {
    for (const w of WORLDS) for (const l of w.lessons) {
      for (const p of PARTS) expect(l[p], `${l.id}.${p}`).toBeTruthy();
      expect(l.quiz.length).toBeGreaterThanOrEqual(3);
      expect(l.quiz.length).toBeLessThanOrEqual(5);
    }
  });
  it('identifiants uniques', () => {
    const ids = allExercises().map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('les 5 modes d\'exercice A à E sont présents (plus boss et révision)', () => {
    const modes = new Set(allExercises().map((e) => e.mode));
    expect([...modes].sort()).toEqual(['bug', 'complete', 'order', 'predict', 'write']);
  });
});

describe('chaque exercice a une réponse validée', () => {
  for (const e of allExercises()) {
    it(`${e.id} (${e.mode})`, async () => {
      if (e.mode === 'predict') {
        const r = runC(e.code, { stdin: e.stdin || '' });
        expect(r.compiled).toBe(true);
        if (e.choices) expect(e.choices.filter((c) => normalizeOutput(c) === normalizeOutput(r.stdout))).toHaveLength(1);
        return;
      }
      const sub = e.mode === 'complete' ? { blanks: e.blanks.map((b) => b.answer) } : e.mode === 'order' ? { order: e.lines.map((_, i) => i) } : { code: referenceSource(e) };
      const g = await gradeExercise(e, sub, run);
      expect(g.passed, `${e.id} : ${g.stage} ${g.ruleFailures.join(' ')}`).toBe(true);
      if (e.mode === 'bug') expect((await gradeExercise(e, { code: e.starter }, run)).passed).toBe(false);
    }, 20000);
  }
});
