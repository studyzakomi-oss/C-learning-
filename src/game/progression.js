// Règles de progression du jeu : XP, niveaux, pièces, maîtrise, déblocages, séries, missions du jour.
// Fonctions pures : elles reçoivent l'état et renvoient des valeurs, sans effet de bord.

export const XP = {
  lesson: 100,
  guide: 20,
  mission: 40,
  quizGood: 5,
  challenge: 50,
  boss: 300,
  review: 4,
  placement: 30,
};
export const COINS = {
  lesson: 20,
  exercise: 5,
  noHintBonus: 5,
  boss: 100,
  challenge: 15,
};
export const HINT_COST = 5;

/** XP total nécessaire pour atteindre le niveau L (L >= 1). */
export function xpForLevel(L) {
  return 50 * L * (L - 1);
}
export function levelFromXp(xp) {
  let L = 1;
  while (xpForLevel(L + 1) <= xp) L++;
  return L;
}
export function levelProgress(xp) {
  const L = levelFromXp(xp);
  const a = xpForLevel(L), b = xpForLevel(L + 1);
  return { level: L, current: xp - a, needed: b - a, ratio: (xp - a) / (b - a) };
}

export const RANKS = [
  [1, 'Apprenti du Code'],
  [3, 'Explorateur de Syntaxe'],
  [5, 'Dompteur de Variables'],
  [8, 'Maître des Boucles'],
  [11, 'Architecte des Fonctions'],
  [14, 'Gardien des Pointeurs'],
  [18, 'Maître du Code'],
];
export function rankFor(level) {
  let r = RANKS[0][1];
  for (const [l, name] of RANKS) if (level >= l) r = name;
  return r;
}

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/**
 * Score d'un exercice réussi (0-100) : récompense la compréhension
 * (peu d'essais, peu d'indices), la vitesse ne compte presque pas.
 */
export function exerciseScore({ attempts = 1, hints = 0, solutionShown = false, seconds = 0, expectedSeconds = 0 }) {
  if (solutionShown) return 35;
  let s = 100 - 12 * Math.max(0, attempts - 1) - 15 * hints;
  if (expectedSeconds && seconds && seconds < expectedSeconds) s += 3;
  return clamp(Math.round(s), 40, 100);
}

/** Maîtrise d'une leçon (0-100) à partir de ses résultats. */
export function lessonMastery(rec) {
  if (!rec) return 0;
  const quiz = rec.quizBest ?? 0; // 0-100
  const mission = rec.missionScore ?? 0;
  const guide = rec.guideScore ?? mission;
  const parts = [[quiz, 0.3], [mission, 0.45], [guide, 0.1]];
  let base = parts.reduce((s, [v, w]) => s + v * w, 0) / 0.85;
  if (rec.reviewSeen) {
    const r = (rec.reviewGood / rec.reviewSeen) * 100;
    base = base * 0.8 + r * 0.2;
  }
  return clamp(Math.round(base), 0, 100);
}

export const MASTERY_PASS = 60;

/** Une leçon est terminée quand la mission est réussie et le quiz >= 60 %. */
export function isLessonComplete(rec) {
  return !!(rec && rec.missionPassed && (rec.quizBest ?? 0) >= 60);
}

/** Liste plate des leçons dans l'ordre du jeu. */
export function allLessons(worlds) {
  return worlds.flatMap((w) => w.lessons.map((l) => ({ ...l, worldId: w.id })));
}

export function isWorldUnlocked(state, worlds, worldId) {
  const idx = worlds.findIndex((w) => w.id === worldId);
  if (idx <= 0) return true;
  if ((state.placement?.unlockedUpTo ?? 0) > idx) return true;
  const prev = worlds[idx - 1];
  return !!state.bosses?.[prev.boss.id]?.defeated;
}

export function isLessonUnlocked(state, worlds, lessonId) {
  for (const w of worlds) {
    const i = w.lessons.findIndex((l) => l.id === lessonId);
    if (i < 0) continue;
    if (!isWorldUnlocked(state, worlds, w.id)) return false;
    if (i === 0) return true;
    if (state.placement?.unlockedUpTo > worlds.indexOf(w)) return true;
    return isLessonComplete(state.lessons?.[w.lessons[i - 1].id]);
  }
  return false;
}

export function worldStats(state, world) {
  const recs = world.lessons.map((l) => state.lessons?.[l.id]);
  const done = recs.filter(isLessonComplete).length;
  const mastery = recs.length ? Math.round(recs.reduce((s, r) => s + lessonMastery(r), 0) / recs.length) : 0;
  return { done, total: world.lessons.length, mastery, bossDefeated: !!state.bosses?.[world.boss.id]?.defeated };
}

/** Le boss est accessible quand toutes les leçons du monde sont terminées. */
export function isBossUnlocked(state, world) {
  if (!world.lessons.every((l) => isLessonComplete(state.lessons?.[l.id]))) return false;
  return true;
}

/** Prochaine étape recommandée pour le joueur. */
export function nextStep(state, worlds) {
  for (const w of worlds) {
    if (!isWorldUnlocked(state, worlds, w.id)) break;
    for (const l of w.lessons) {
      if (!isLessonComplete(state.lessons?.[l.id]) && isLessonUnlocked(state, worlds, l.id)) {
        return { kind: 'lesson', worldId: w.id, lessonId: l.id, title: l.title };
      }
    }
    if (!state.bosses?.[w.boss.id]?.defeated) return { kind: 'boss', worldId: w.id, title: w.boss.name };
  }
  return { kind: 'done' };
}

// ---------- compétences ----------
export const SKILLS = {
  syntax: { name: 'Syntaxe', icon: '⌨️', color: '#22d3ee' },
  logic: { name: 'Logique', icon: '🧭', color: '#a78bfa' },
  debug: { name: 'Débogage', icon: '🐞', color: '#f472b6' },
  algo: { name: 'Algorithmes', icon: '⚙️', color: '#34d399' },
  memory: { name: 'Mémoire', icon: '🧠', color: '#fbbf24' },
};

export function skillLevels(state, worlds) {
  const out = {};
  for (const k of Object.keys(SKILLS)) out[k] = { total: 0, sum: 0, lessons: 0, done: 0 };
  for (const l of allLessons(worlds)) {
    for (const k of l.skills || [l.topic]) {
      if (!out[k]) continue;
      out[k].lessons++;
      out[k].sum += lessonMastery(state.lessons?.[l.id]);
      if (isLessonComplete(state.lessons?.[l.id])) out[k].done++;
    }
  }
  const dbg = state.stats?.bugsFixed || 0;
  for (const k of Object.keys(out)) {
    const o = out[k];
    o.mastery = o.lessons ? Math.round(o.sum / o.lessons) : 0;
    if (k === 'debug') o.mastery = clamp(Math.round(o.mastery * 0.8 + Math.min(20, dbg)), 0, 100);
    o.rank = o.mastery >= 90 ? 5 : o.mastery >= 75 ? 4 : o.mastery >= 55 ? 3 : o.mastery >= 30 ? 2 : o.mastery > 0 ? 1 : 0;
  }
  return out;
}

export const PERKS = [
  { id: 'vision', name: 'Vision du Code', desc: '1 indice gratuit supplémentaire par exercice.', cost: 1, icon: '👁️' },
  { id: 'bouclier', name: 'Bouclier de Syntaxe', desc: 'Combat de boss : 1 cœur supplémentaire.', cost: 1, icon: '🛡️' },
  { id: 'sablier', name: 'Sablier du Temps', desc: 'Combat de boss : +3 minutes.', cost: 1, icon: '⏳' },
  { id: 'fortune', name: 'Bourse du Marchand', desc: '+30 % de pièces gagnées.', cost: 2, icon: '💰' },
  { id: 'sagesse', name: 'Sagesse ancienne', desc: '+10 % d\'XP gagnée.', cost: 2, icon: '📜' },
  { id: 'memoire', name: 'Mémoire d\'éléphant', desc: 'La révision espacée propose aussi des mini-programmes.', cost: 1, icon: '🐘' },
];
export function skillPoints(state) {
  const level = levelFromXp(state.xp || 0);
  const spent = (state.perks || []).reduce((s, id) => s + (PERKS.find((p) => p.id === id)?.cost || 0), 0);
  return Math.max(0, Math.floor(level / 2) - spent);
}

export function applyXpBonus(state, xp) {
  return Math.round(xp * ((state.perks || []).includes('sagesse') ? 1.1 : 1));
}
export function applyCoinBonus(state, c) {
  return Math.round(c * ((state.perks || []).includes('fortune') ? 1.3 : 1));
}

// ---------- dates ----------
export function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
export function daysBetween(a, b) {
  const da = new Date(a + 'T12:00:00');
  const db = new Date(b + 'T12:00:00');
  return Math.round((db - da) / 86400000);
}
function weekKey(day) {
  const d = new Date(day + 'T12:00:00');
  const th = new Date(d);
  th.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const y = th.getFullYear();
  const jan4 = new Date(y, 0, 4);
  const w = 1 + Math.round(((th - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  return `${y}-W${w}`;
}

/**
 * Série bienveillante : jusqu'à 2 jours de repos par semaine ne cassent pas la série.
 * Une série cassée ne fait rien perdre (XP, pièces) : on garde le record.
 */
export function updateStreak(streak, today) {
  const s = { count: 0, best: 0, last: null, rest: 2, week: weekKey(today), ...streak };
  if (s.week !== weekKey(today)) { s.week = weekKey(today); s.rest = 2; }
  if (s.last === today) return { streak: s, event: null };
  let event = 'continue';
  if (!s.last) { s.count = 1; event = 'start'; }
  else {
    const gap = daysBetween(s.last, today);
    if (gap === 1) s.count++;
    else if (gap > 1 && gap - 1 <= s.rest) { s.rest -= gap - 1; s.count++; event = 'rest-used'; }
    else if (gap > 1) { s.count = 1; event = 'restart'; }
  }
  s.best = Math.max(s.best, s.count);
  s.last = today;
  return { streak: s, event };
}

// ---------- missions du jour ----------
export const DAILY_POOL = [
  { id: 'lesson', text: 'Termine 1 leçon', goal: 1, event: 'lesson', reward: 25 },
  { id: 'exercises', text: 'Réussis 3 exercices', goal: 3, event: 'exercise', reward: 20 },
  { id: 'nohint', text: 'Réussis 2 exercices sans indice', goal: 2, event: 'exercise-nohint', reward: 25 },
  { id: 'review', text: 'Révise 5 cartes', goal: 5, event: 'review', reward: 20 },
  { id: 'quiz', text: 'Donne 5 bonnes réponses aux quiz', goal: 5, event: 'quiz-good', reward: 15 },
  { id: 'run', text: 'Exécute 5 programmes', goal: 5, event: 'run', reward: 10 },
  { id: 'xp', text: 'Gagne 150 XP', goal: 150, event: 'xp', reward: 20 },
  { id: 'bug', text: 'Corrige 2 programmes buggés', goal: 2, event: 'bug-fixed', reward: 20 },
];

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function dailyMissions(day) {
  const pool = [...DAILY_POOL];
  const out = [];
  let h = hashStr(day);
  while (out.length < 3) {
    const k = h % pool.length;
    out.push(pool.splice(k, 1)[0]);
    h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0;
  }
  return out;
}

// ---------- révision espacée (Leitner) ----------
export const LEITNER_DAYS = [0, 1, 3, 7, 16, 35];
export function reviewSchedule(card, good, today) {
  const box = good ? Math.min((card?.box || 0) + 1, LEITNER_DAYS.length - 1) : 1;
  const due = new Date(today + 'T12:00:00');
  due.setDate(due.getDate() + LEITNER_DAYS[box]);
  return { box, due: dayKey(due), seen: (card?.seen || 0) + 1, good: (card?.good || 0) + (good ? 1 : 0) };
}
export function dueCards(cards, today) {
  return Object.entries(cards || {}).filter(([, c]) => c.due <= today).map(([id]) => id);
}

// ---------- succès ----------
export const ACHIEVEMENTS = [
  { id: 'first-run', icon: '▶️', name: 'Premier lancement', desc: 'Exécuter un premier programme.', test: (s) => (s.stats?.runs || 0) >= 1 },
  { id: 'hello', icon: '👋', name: 'Hello, World!', desc: 'Terminer la leçon « Afficher avec printf ».', test: (s) => !!s.lessons?.w1l2?.missionPassed },
  { id: 'world1', icon: '🏛️', name: 'Fondations solides', desc: 'Vaincre le boss du Monde 1.', test: (s) => !!s.bosses?.['boss-w1']?.defeated },
  { id: 'world3', icon: '🧮', name: 'Calculateur', desc: 'Vaincre le boss du Monde 3.', test: (s) => !!s.bosses?.['boss-w3']?.defeated },
  { id: 'world5', icon: '🔁', name: 'Seigneur des boucles', desc: 'Vaincre le boss du Monde 5.', test: (s) => !!s.bosses?.['boss-w5']?.defeated },
  { id: 'world8', icon: '📍', name: 'Navigateur de mémoire', desc: 'Vaincre le boss du Monde 8.', test: (s) => !!s.bosses?.['boss-w8']?.defeated },
  { id: 'master', icon: '👑', name: 'Maître du Code', desc: 'Vaincre le boss final.', test: (s) => !!s.bosses?.['boss-w10']?.defeated },
  { id: 'nohint5', icon: '🧠', name: 'Sans filet', desc: 'Réussir 5 exercices sans indice.', test: (s) => (s.stats?.noHint || 0) >= 5 },
  { id: 'firsttry10', icon: '🎯', name: 'Du premier coup', desc: 'Réussir 10 exercices au premier essai.', test: (s) => (s.stats?.firstTry || 0) >= 10 },
  { id: 'bug10', icon: '🐞', name: 'Chasseur de bugs', desc: 'Corriger 10 programmes buggés.', test: (s) => (s.stats?.bugsFixed || 0) >= 10 },
  { id: 'errors50', icon: '📕', name: 'Lecteur d\'erreurs', desc: 'Rencontrer 50 messages du compilateur (et ne pas abandonner !).', test: (s) => (s.stats?.compileErrors || 0) >= 50 },
  { id: 'streak3', icon: '🔥', name: 'Régularité', desc: 'Série de 3 jours.', test: (s) => (s.streak?.best || 0) >= 3 },
  { id: 'streak7', icon: '🌟', name: 'Une semaine de code', desc: 'Série de 7 jours.', test: (s) => (s.streak?.best || 0) >= 7 },
  { id: 'review20', icon: '🗂️', name: 'Mémoire vive', desc: 'Réviser 20 cartes.', test: (s) => (s.stats?.reviews || 0) >= 20 },
  { id: 'quiz100', icon: '✅', name: 'Quiz parfait', desc: 'Obtenir 100 % à un quiz.', test: (s) => Object.values(s.lessons || {}).some((r) => r.quizBest === 100) },
  { id: 'level5', icon: '⭐', name: 'Niveau 5', desc: 'Atteindre le niveau 5.', test: (s) => levelFromXp(s.xp || 0) >= 5 },
  { id: 'level10', icon: '💫', name: 'Niveau 10', desc: 'Atteindre le niveau 10.', test: (s) => levelFromXp(s.xp || 0) >= 10 },
  { id: 'rich', icon: '💰', name: 'Trésorier', desc: 'Posséder 300 pièces.', test: (s) => (s.coins || 0) >= 300 },
  { id: 'shopper', icon: '🛍️', name: 'Élégance', desc: 'Acheter un objet dans la boutique.', test: (s) => (s.inventory || []).length > 0 },
  { id: 'sandbox', icon: '🧪', name: 'Laborantin', desc: 'Exécuter 10 programmes dans le bac à sable.', test: (s) => (s.stats?.sandboxRuns || 0) >= 10 },
  { id: 'daily', icon: '📅', name: 'Missionnaire', desc: 'Terminer toutes les missions d\'une journée.', test: (s) => (s.stats?.dailyFull || 0) >= 1 },
];

export function newAchievements(state) {
  const have = new Set(state.achievements || []);
  return ACHIEVEMENTS.filter((a) => !have.has(a.id) && a.test(state)).map((a) => a.id);
}
