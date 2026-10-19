// Tests de la progression, de la sauvegarde, de la correction des exercices et du tuteur.
import { describe, it, expect } from 'vitest';
import { runC } from '../src/engine/index.js';
import {
  levelFromXp, xpForLevel, lessonMastery, isLessonComplete, isWorldUnlocked, isLessonUnlocked, nextStep,
  updateStreak, dailyMissions, reviewSchedule, dueCards, exerciseScore, isBossUnlocked, skillPoints,
} from '../src/game/progression.js';
import { createStore, memoryStorage, SAVE_KEY, defaultState, migrate } from '../src/game/store.js';
import { gradeExercise, normalizeOutput, buildSource, stripCode } from '../src/game/grader.js';
import { analyze } from '../src/game/tutor.js';
import { WORLDS, getExercise } from '../src/content/index.js';
import { evaluatePlacement, PLACEMENT } from '../src/content/placement.js';

const run = async (src, o) => runC(src, o);

describe('niveaux et score', () => {
  it('seuils de niveau croissants', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(xpForLevel(2))).toBe(2);
    expect(levelFromXp(xpForLevel(5) - 1)).toBe(4);
  });
  it('le score récompense la compréhension plus que la vitesse', () => {
    const vite = exerciseScore({ attempts: 1, hints: 0, seconds: 10, expectedSeconds: 60 });
    const lent = exerciseScore({ attempts: 1, hints: 0, seconds: 600, expectedSeconds: 60 });
    const indices = exerciseScore({ attempts: 1, hints: 2 });
    expect(vite - lent).toBeLessThanOrEqual(5);
    expect(indices).toBeLessThan(lent);
    expect(exerciseScore({ solutionShown: true })).toBeLessThan(indices);
  });
  it('maîtrise d\'une leçon', () => {
    expect(lessonMastery({ quizBest: 100, missionScore: 100, guideScore: 100 })).toBe(100);
    expect(lessonMastery({ quizBest: 60, missionScore: 40 })).toBeLessThan(60);
  });
});

describe('déblocage basé sur la maîtrise', () => {
  const w = WORLDS;
  const done = (ids) => Object.fromEntries(ids.map((id) => [id, { missionPassed: true, quizBest: 80 }]));
  it('seul le Monde 1 est ouvert au départ', () => {
    const s = defaultState();
    expect(isWorldUnlocked(s, w, 'w1')).toBe(true);
    expect(isWorldUnlocked(s, w, 'w2')).toBe(false);
    expect(isLessonUnlocked(s, w, 'w1l1')).toBe(true);
    expect(isLessonUnlocked(s, w, 'w1l2')).toBe(false);
  });
  it('une leçon exige mission réussie ET quiz >= 60 %', () => {
    expect(isLessonComplete({ missionPassed: true, quizBest: 40 })).toBe(false);
    expect(isLessonComplete({ missionPassed: false, quizBest: 100 })).toBe(false);
    expect(isLessonComplete({ missionPassed: true, quizBest: 60 })).toBe(true);
  });
  it('le boss s\'ouvre après toutes les leçons, le monde suivant après le boss', () => {
    const s = { ...defaultState(), lessons: done(w[0].lessons.map((l) => l.id)) };
    expect(isBossUnlocked(s, w[0])).toBe(true);
    expect(isWorldUnlocked(s, w, 'w2')).toBe(false);
    expect(nextStep(s, w).kind).toBe('boss');
    s.bosses = { 'boss-w1': { defeated: true } };
    expect(isWorldUnlocked(s, w, 'w2')).toBe(true);
    expect(nextStep(s, w).lessonId).toBe('w2l1');
  });
  it('le test de placement débloque des mondes sans sauter les leçons du monde recommandé', () => {
    const answers = PLACEMENT.map((q) => q.answer);
    const res = evaluatePlacement(answers);
    expect(res.score).toBe(100);
    expect(res.recommended).toBe(5);
    const s = { ...defaultState(), placement: { done: true, unlockedUpTo: 3 } };
    expect(isWorldUnlocked(s, w, 'w4')).toBe(true);
    expect(isWorldUnlocked(s, w, 'w5')).toBe(false);
    expect(isLessonUnlocked(s, w, 'w2l3')).toBe(true);
    expect(isLessonUnlocked(s, w, 'w4l2')).toBe(false);
    expect(evaluatePlacement(PLACEMENT.map(() => -1)).recommended).toBe(0);
  });
});

describe('séries, missions du jour, révision espacée', () => {
  it('une pause de 1 ou 2 jours ne casse pas la série', () => {
    let { streak } = updateStreak({}, '2026-10-12');
    ({ streak } = updateStreak(streak, '2026-10-13'));
    expect(streak.count).toBe(2);
    const r = updateStreak(streak, '2026-10-15');
    expect(r.event).toBe('rest-used');
    expect(r.streak.count).toBe(3);
  });
  it('une longue pause relance la série mais garde le record', () => {
    const r = updateStreak({ count: 9, best: 9, last: '2026-09-01', rest: 2, week: '2026-W36' }, '2026-10-19');
    expect(r.streak.count).toBe(1);
    expect(r.streak.best).toBe(9);
  });
  it('3 missions du jour stables pour une date', () => {
    const a = dailyMissions('2026-10-19');
    expect(a).toHaveLength(3);
    expect(dailyMissions('2026-10-19').map((m) => m.id)).toEqual(a.map((m) => m.id));
    expect(new Set(a.map((m) => m.id)).size).toBe(3);
  });
  it('Leitner : une bonne réponse espace la carte, une mauvaise la ramène à demain', () => {
    const c1 = reviewSchedule(null, true, '2026-10-19');
    const c2 = reviewSchedule(c1, true, '2026-10-20');
    expect(c2.box).toBe(2);
    expect(c2.due > c1.due).toBe(true);
    const c3 = reviewSchedule(c2, false, '2026-10-23');
    expect(c3.box).toBe(1);
    expect(c3.due).toBe('2026-10-24');
    expect(dueCards({ a: { due: '2026-10-19' }, b: { due: '2026-12-01' } }, '2026-10-20')).toEqual(['a']);
  });
});

describe('sauvegarde locale et reprise', () => {
  const ex = getExercise('w1l1-mission').ex;
  it('la progression survit à la fermeture de l\'application', () => {
    const storage = memoryStorage();
    const s1 = createStore({ storage, saveDelay: 0, now: () => new Date('2026-10-19T10:00:00') });
    s1.setProfile({ name: 'Zakomi', onboarded: true });
    s1.setLessonStep('w1l1', 7);
    s1.saveDraft(ex.id, { code: 'int main' });
    s1.recordAttempt(ex, { passed: true, stage: 'ok' }, {});
    s1.recordQuiz('w1l1', 4, 4, ['w1l1-q0']);
    s1.setSettings({ editorFontSize: 19, theme: 'light' });
    s1.setResume('/lesson/w1l1/7');
    const s2 = createStore({ storage, saveDelay: 0 });
    expect(s2.state.profile.name).toBe('Zakomi');
    expect(s2.state.lessons.w1l1.step).toBe(7);
    expect(s2.state.lessons.w1l1.completedAt).toBeTruthy();
    expect(s2.state.exercises[ex.id].draft.code).toBe('int main');
    expect(s2.state.settings.editorFontSize).toBe(19);
    expect(s2.state.resume.route).toBe('/lesson/w1l1/7');
    expect(s2.state.xp).toBeGreaterThan(100);
    expect(s2.state.cards['w1l1-q0']).toBeTruthy();
  });
  it('sauvegarde corrompue ou ancienne : migration sans perte', () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, '{pas du json');
    expect(createStore({ storage }).state.xp).toBe(0);
    const m = migrate({ xp: 50, settings: { theme: 'light' } });
    expect(m.xp).toBe(50);
    expect(m.settings.editorFontSize).toBe(15);
    expect(m.settings.theme).toBe('light');
  });
  it('export / import / réinitialisation', () => {
    const a = createStore({ storage: memoryStorage(), saveDelay: 0 });
    a.setProfile({ name: 'Test' });
    const dump = a.exportSave();
    const b = createStore({ storage: memoryStorage(), saveDelay: 0 });
    b.importSave(dump);
    expect(b.state.profile.name).toBe('Test');
    expect(() => b.importSave('{"bad":1}')).toThrow();
    b.reset();
    expect(b.state.profile.name).toBe('');
  });
  it('indices : le premier est gratuit, les suivants coûtent des pièces, jamais bloquants pour le cours', () => {
    const s = createStore({ storage: memoryStorage(), saveDelay: 0 });
    expect(s.hintCost('x')).toBe(0);
    expect(s.takeHint('x')).toBe(true);
    expect(s.hintCost('x')).toBe(5);
    s.state.coins = 2;
    expect(s.takeHint('x')).toBe(false);
  });
  it('XP, pièces, niveau et succès attribués', () => {
    const s = createStore({ storage: memoryStorage(), saveDelay: 0 });
    const notes = [];
    s.onNotify((n) => notes.push(n.type));
    s.recordRun();
    s.recordAttempt(getExercise('w1l2-mission').ex, { passed: true, stage: 'ok' }, {});
    expect(s.state.achievements).toEqual(expect.arrayContaining(['first-run']));
    expect(notes).toContain('achievement');
    expect(s.state.coins).toBeGreaterThan(30);
    s.bossResult('boss-w1', { victory: true, seconds: 300 });
    expect(s.state.bosses['boss-w1'].defeated).toBe(true);
    expect(s.state.achievements).toContain('world1');
    expect(skillPoints(s.state)).toBeGreaterThanOrEqual(0);
  });
});

describe('correction par exécution (pas par mots-clés)', () => {
  const mission = getExercise('w1l1-mission').ex;
  it('normalisation des sorties', () => {
    expect(normalizeOutput('a  \r\nb\n\n')).toBe('a\nb');
    expect(stripCode('x = "printf"; // printf\n/* for */ y')).not.toMatch(/printf|for/);
  });
  it('la solution passe, un programme qui contient les bons mots-clés mais affiche faux échoue', async () => {
    expect((await gradeExercise(mission, { code: mission.solution }, run)).passed).toBe(true);
    const leurre = '#include <stdio.h>\n\nint main(void)\n{\n    /* Bonjour C est strict */\n    printf("Bonjour\\n");\n    return 0;\n}\n';
    const r = await gradeExercise(mission, { code: leurre }, run);
    expect(r.passed).toBe(false);
    expect(r.stage).toBe('output');
    expect(analyze(r).kind).toBe('logic');
  });
  it('erreur de compilation analysée par le tuteur', async () => {
    const r = await gradeExercise(mission, { code: '#include <stdio.h>\nint main(void)\n{\n    printf("Bonjour\\n")\n    return 0;\n}\n' }, run);
    const a = analyze(r);
    expect(a.kind).toBe('syntax');
    expect(a.line).toBe(4);
    expect(a.steps).toHaveLength(3);
    expect(a.python).toMatch(/Python/);
  });
  it('tests cachés : un programme qui code la réponse en dur échoue', async () => {
    const e = getExercise('w3l2-mission').ex;
    const triche = '#include <stdio.h>\nint main(void)\n{\n    printf("Billets de 1000 : 3\\nBillets de 200 : 2\\nReste : 50\\n");\n    return 0;\n}\n';
    const r = await gradeExercise(e, { code: triche }, run);
    expect(r.passed).toBe(false);
    expect(r.tests.some((t) => t.hidden && !t.passed)).toBe(true);
  });
  it('erreur d\'exécution reconnue', async () => {
    const e = getExercise('w3l2-mission').ex;
    const r = await gradeExercise(e, { code: '#include <stdio.h>\nint main(void)\n{\n    int m;\n    scanf("%d", &m);\n    printf("%d\\n", m / (m - m));\n    return 0;\n}\n' }, run);
    expect(analyze(r).kind).toBe('runtime');
  });
  it('mode A : n\'importe quelle réponse correcte est acceptée (vérification par exécution)', async () => {
    const e = getExercise('w2l1-guide').ex;
    expect((await gradeExercise(e, { blanks: ['int', 'tirelire', 'tirelire'] }, run)).passed).toBe(true);
    expect((await gradeExercise(e, { blanks: ['int', 'tirelire', '25'] }, run)).passed).toBe(true);
    expect((await gradeExercise(e, { blanks: ['int', 'tirelire', '24'] }, run)).passed).toBe(false);
  });
  it('mode C : prédiction vérifiée contre la vraie exécution', async () => {
    const e = getExercise('w1l2-guide').ex;
    expect((await gradeExercise(e, { prediction: 'Motdepasse\nOK\n' }, run)).passed).toBe(true);
    expect((await gradeExercise(e, { prediction: 'Mot de passe\nOK' }, run)).passed).toBe(false);
  });
  it('mode E : un ordre invalide échoue, le bon ordre passe', async () => {
    const e = getExercise('w1l3-mission').ex;
    expect((await gradeExercise(e, { order: e.lines.map((_, i) => i) }, run)).passed).toBe(true);
    expect((await gradeExercise(e, { order: [1, 0, 2, 3, 4, 5, 6] }, run)).passed).toBe(false);
    expect(buildSource(e, { order: [0, 1] })).toContain('#include');
  });
  it('consignes require/forbid en plus des tests', async () => {
    const e = getExercise('w2l4-mission').ex;
    const sansConst = '#include <stdio.h>\nint main(void)\n{\n    double r = 2.0;\n    printf("Perimetre : %.2f\\n", 2 * 3.14159 * r);\n    printf("Aire : %.2f\\n", 3.14159 * r * r);\n    return 0;\n}\n';
    const r = await gradeExercise(e, { code: sansConst }, run);
    expect(r.tests.every((t) => t.passed)).toBe(true);
    expect(r.passed).toBe(false);
    expect(r.stage).toBe('rules');
  });
});
