// Catalogue du contenu pédagogique (séparé de la logique du jeu).
import w1 from './worlds/w1.js';
import w2 from './worlds/w2.js';
import w3 from './worlds/w3.js';

export const WORLDS = [w1, w2, w3];

const lessonIndex = new Map();
const exerciseIndex = new Map();
for (const w of WORLDS) {
  w.lessons.forEach((l, i) => {
    lessonIndex.set(l.id, { lesson: l, world: w, index: i });
    exerciseIndex.set(l.guide.id, { ex: { ...l.guide, kind: 'guide', lessonId: l.id }, world: w, lesson: l });
    exerciseIndex.set(l.mission.id, { ex: { ...l.mission, kind: 'mission', lessonId: l.id }, world: w, lesson: l });
  });
  for (const c of w.challenges || []) exerciseIndex.set(c.id, { ex: { ...c, kind: 'challenge' }, world: w });
  for (const p of w.boss.phases) exerciseIndex.set(p.id, { ex: { ...p, kind: 'boss' }, world: w });
}

export const getWorld = (id) => WORLDS.find((w) => w.id === id);
export const getLesson = (id) => lessonIndex.get(id);
export const getExercise = (id) => exerciseIndex.get(id);
export const allExercises = () => [...exerciseIndex.values()].map((x) => x.ex);
