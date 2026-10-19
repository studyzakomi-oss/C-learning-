// État du jeu + actions + sauvegarde locale (local-first, aucun compte nécessaire).
import {
  XP, COINS, HINT_COST, levelFromXp, isLessonComplete, lessonMastery, newAchievements, updateStreak, dayKey,
  dailyMissions, reviewSchedule, applyXpBonus, applyCoinBonus, exerciseScore, ACHIEVEMENTS, PERKS, skillPoints,
} from './progression.js';

export const SAVE_KEY = 'cquest.save.v1';
export const SAVE_VERSION = 1;

export function defaultState() {
  return {
    version: SAVE_VERSION,
    profile: { name: '', avatar: { color: '#22d3ee', cls: 'mage', accessory: null, title: null }, createdAt: null, onboarded: false },
    placement: { done: false, score: 0, perTopic: {}, recommended: 0, unlockedUpTo: 0 },
    xp: 0,
    coins: 30,
    lessons: {},
    exercises: {},
    bosses: {},
    cards: {},
    weak: {},
    errorCodes: {},
    stats: { runs: 0, compileErrors: 0, bugsFixed: 0, noHint: 0, firstTry: 0, reviews: 0, sandboxRuns: 0, dailyFull: 0, days: {} },
    daily: { day: null, progress: {}, claimed: [] },
    streak: {},
    achievements: [],
    perks: [],
    inventory: [],
    settings: { theme: 'dark', fontScale: 1, editorFontSize: 15, reducedMotion: false, highContrast: false, bossTimer: true, sound: false, dyslexia: false, autoClose: true },
    resume: { route: null },
    sandbox: { code: null, stdin: '' },
    log: [],
  };
}

/** Fusionne une sauvegarde avec les valeurs par défaut (migration douce). */
export function migrate(saved) {
  const base = defaultState();
  if (!saved || typeof saved !== 'object') return base;
  const out = { ...base, ...saved };
  for (const k of ['profile', 'placement', 'stats', 'daily', 'settings', 'resume', 'sandbox']) out[k] = { ...base[k], ...(saved[k] || {}) };
  out.profile.avatar = { ...base.profile.avatar, ...(saved.profile?.avatar || {}) };
  out.stats.days = { ...(saved.stats?.days || {}) };
  out.version = SAVE_VERSION;
  return out;
}

export function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

function safeStorage() {
  try {
    const s = globalThis.localStorage;
    s.setItem('__cq', '1');
    s.removeItem('__cq');
    return s;
  } catch {
    return memoryStorage();
  }
}

export function createStore({ storage = safeStorage(), now = () => new Date(), saveDelay = 250 } = {}) {
  let state;
  try { state = migrate(JSON.parse(storage.getItem(SAVE_KEY) || 'null')); } catch { state = defaultState(); }
  const listeners = new Set();
  const notifyListeners = new Set();
  let timer = null;

  const today = () => dayKey(now());

  function save() {
    timer = null;
    try { storage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* stockage plein ou indisponible */ }
  }
  function changed() {
    for (const l of listeners) l(state);
    if (saveDelay <= 0) save();
    else if (!timer) timer = setTimeout(save, saveDelay);
  }
  function notify(n) { for (const l of notifyListeners) l(n); }
  function log(type, text) {
    state.log.unshift({ t: now().toISOString(), type, text });
    state.log.length = Math.min(state.log.length, 60);
  }

  function dayStats() {
    const d = today();
    state.stats.days[d] ??= { xp: 0, exercises: 0, seconds: 0, lessons: 0 };
    return state.stats.days[d];
  }

  function ensureDaily() {
    const d = today();
    if (state.daily.day !== d) state.daily = { day: d, progress: {}, claimed: [] };
    return dailyMissions(d);
  }

  /** Avancée des missions du jour. */
  function track(event, amount = 1) {
    const missions = ensureDaily();
    for (const m of missions) {
      if (m.event !== event) continue;
      state.daily.progress[m.id] = (state.daily.progress[m.id] || 0) + amount;
      if (state.daily.progress[m.id] >= m.goal && !state.daily.claimed.includes(m.id)) {
        state.daily.claimed.push(m.id);
        state.coins += m.reward;
        notify({ type: 'daily', text: `Mission du jour accomplie : ${m.text} (+${m.reward} 🪙)` });
        log('daily', `Mission accomplie : ${m.text}`);
        if (state.daily.claimed.length === missions.length) state.stats.dailyFull++;
      }
    }
  }

  function touchDay() {
    const { streak, event } = updateStreak(state.streak, today());
    state.streak = streak;
    if (event === 'rest-used') notify({ type: 'streak', text: `Jour de repos utilisé : ta série continue (${streak.count} jours) 🔥` });
    if (event === 'restart' && streak.best > 1) notify({ type: 'streak', text: `Bon retour ! Nouvelle série lancée. Ton record reste ${streak.best} jours.` });
  }

  function checkAchievements() {
    for (const id of newAchievements(state)) {
      state.achievements.push(id);
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      notify({ type: 'achievement', text: `Succès débloqué : ${a.icon} ${a.name}`, id });
      log('achievement', `Succès : ${a.name}`);
    }
  }

  function award({ xp = 0, coins = 0, reason = '' }) {
    touchDay();
    const before = levelFromXp(state.xp);
    const gx = applyXpBonus(state, xp);
    const gc = applyCoinBonus(state, coins);
    state.xp += gx;
    state.coins += gc;
    dayStats().xp += gx;
    if (gx) track('xp', gx);
    const after = levelFromXp(state.xp);
    if (gx || gc) notify({ type: 'reward', xp: gx, coins: gc, text: reason });
    if (after > before) {
      notify({ type: 'level', level: after, text: `Niveau ${after} atteint !` });
      log('level', `Niveau ${after}`);
    }
    checkAchievements();
  }

  const lessonRec = (id) => (state.lessons[id] ??= { step: 0, quizBest: null, guidePassed: false, missionPassed: false, timeSpent: 0, reviewSeen: 0, reviewGood: 0 });
  const exRec = (id) => (state.exercises[id] ??= { attempts: 0, hints: 0, passed: false, draft: null, solutionShown: false, best: 0 });

  const api = {
    get state() { return state; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    onNotify(fn) { notifyListeners.add(fn); return () => notifyListeners.delete(fn); },
    flush: save,
    today,
    dailyMissions: () => { ensureDaily(); return dailyMissions(today()).map((m) => ({ ...m, progress: Math.min(m.goal, state.daily.progress[m.id] || 0), done: state.daily.claimed.includes(m.id) })); },

    setProfile(patch) { Object.assign(state.profile, patch); if (!state.profile.createdAt) state.profile.createdAt = now().toISOString(); changed(); },
    setAvatar(patch) { Object.assign(state.profile.avatar, patch); changed(); },
    setSettings(patch) { Object.assign(state.settings, patch); changed(); },
    setResume(route) { if (state.resume.route !== route) { state.resume.route = route; changed(); } },
    setSandbox(patch) { Object.assign(state.sandbox, patch); changed(); },

    completePlacement({ score, perTopic, recommended }) {
      state.placement = { done: true, score, perTopic, recommended, unlockedUpTo: recommended };
      for (const [topic, ok] of Object.entries(perTopic)) if (ok < 0.5) state.weak[topic] = (state.weak[topic] || 0) + 1;
      award({ xp: XP.placement, reason: 'Test de placement terminé' });
      log('placement', `Test de placement : ${score} %`);
      changed();
    },

    /** Étape courante d'une leçon (reprise exacte). */
    setLessonStep(lessonId, step) {
      const r = lessonRec(lessonId);
      r.step = step;
      r.startedAt ??= now().toISOString();
      changed();
    },
    addTime(lessonId, seconds) {
      if (!seconds || seconds < 0) return;
      const s = Math.min(seconds, 600);
      if (lessonId) lessonRec(lessonId).timeSpent += s;
      dayStats().seconds += s;
      changed();
    },

    saveDraft(exId, draft) { exRec(exId).draft = draft; changed(); },
    exercise: (exId) => state.exercises[exId],
    lesson: (id) => state.lessons[id],

    /** Indice : le premier (et le 2e avec la compétence Vision) est gratuit, puis 5 pièces. */
    hintCost(exId) {
      const r = state.exercises[exId];
      const used = r?.hints || 0;
      const free = state.perks.includes('vision') ? 2 : 1;
      return used < free ? 0 : HINT_COST;
    },
    takeHint(exId) {
      const cost = api.hintCost(exId);
      if (state.coins < cost) return false;
      state.coins -= cost;
      exRec(exId).hints++;
      changed();
      return true;
    },
    showSolution(exId) { exRec(exId).solutionShown = true; changed(); },

    recordRun({ sandbox = false, compileError = false } = {}) {
      state.stats.runs++;
      if (sandbox) state.stats.sandboxRuns++;
      if (compileError) state.stats.compileErrors++;
      touchDay();
      track('run');
      checkAchievements();
      changed();
    },

    /**
     * Enregistre une tentative d'exercice. Renvoie {firstPass, score}.
     * @param {{id:string, mode:string, kind?:'guide'|'mission'|'challenge'|'boss'|'review', lessonId?:string, xp?:number}} ex
     */
    recordAttempt(ex, result, meta = {}) {
      const r = exRec(ex.id);
      r.attempts++;
      for (const c of meta.codes || []) state.errorCodes[c] = (state.errorCodes[c] || 0) + 1;
      if (!result.passed) {
        if (result.stage === 'compile') state.stats.compileErrors++;
        if (meta.topic) state.weak[meta.topic] = (state.weak[meta.topic] || 0) + 0.25;
        changed();
        return { firstPass: false, score: 0 };
      }
      const firstPass = !r.passed;
      const score = exerciseScore({ attempts: r.attempts, hints: r.hints, solutionShown: r.solutionShown, seconds: meta.seconds });
      r.best = Math.max(r.best, score);
      if (firstPass) {
        r.passed = true;
        r.passedAt = now().toISOString();
        dayStats().exercises++;
        track('exercise');
        if (!r.hints && !r.solutionShown) { state.stats.noHint++; track('exercise-nohint'); }
        if (r.attempts === 1) state.stats.firstTry++;
        if (ex.mode === 'bug') { state.stats.bugsFixed++; track('bug-fixed'); }
        if (meta.topic && state.weak[meta.topic]) state.weak[meta.topic] = Math.max(0, state.weak[meta.topic] - 0.5);
        const kind = ex.kind || 'mission';
        const baseXp = ex.xp ?? (kind === 'guide' ? XP.guide : kind === 'challenge' ? XP.challenge : XP.mission);
        const bonus = r.hints || r.solutionShown ? 0 : COINS.noHintBonus;
        const xp = r.solutionShown ? Math.round(baseXp / 3) : Math.round(baseXp * (0.6 + 0.4 * score / 100));
        award({ xp, coins: (kind === 'challenge' ? COINS.challenge : COINS.exercise) + bonus, reason: ex.title || 'Exercice réussi' });
        if (ex.lessonId) {
          const lr = lessonRec(ex.lessonId);
          if (kind === 'guide') { lr.guidePassed = true; lr.guideScore = score; }
          if (kind === 'mission') { lr.missionPassed = true; lr.missionScore = score; }
          api._maybeCompleteLesson(ex.lessonId);
        }
      }
      changed();
      return { firstPass, score };
    },

    /** Résultat du quiz rapide (pourcentage). */
    recordQuiz(lessonId, correct, total, cardIds = []) {
      const r = lessonRec(lessonId);
      const pct = Math.round((correct / total) * 100);
      const first = r.quizBest === null;
      r.quizBest = Math.max(r.quizBest ?? 0, pct);
      track('quiz-good', correct);
      if (first) award({ xp: correct * XP.quizGood, reason: 'Quiz rapide' });
      // les questions entrent dans la révision espacée
      for (const id of cardIds) if (!state.cards[id]) state.cards[id] = reviewSchedule(null, true, today());
      api._maybeCompleteLesson(lessonId);
      changed();
      return pct;
    },

    _maybeCompleteLesson(lessonId) {
      const r = lessonRec(lessonId);
      if (!r.completedAt && isLessonComplete(r)) {
        r.completedAt = now().toISOString();
        dayStats().lessons++;
        track('lesson');
        award({ xp: XP.lesson, coins: COINS.lesson, reason: 'Leçon terminée' });
        log('lesson', `Leçon terminée (${lessonId}) — maîtrise ${lessonMastery(r)} %`);
        notify({ type: 'lesson', lessonId, text: 'Leçon terminée !' });
      }
    },

    reviewAnswer(cardId, good, lessonId) {
      state.cards[cardId] = reviewSchedule(state.cards[cardId], good, today());
      state.stats.reviews++;
      track('review');
      if (lessonId) { const r = lessonRec(lessonId); r.reviewSeen++; if (good) r.reviewGood++; }
      if (good) award({ xp: XP.review, reason: '' }); else checkAchievements();
      changed();
    },

    bossResult(bossId, { victory, seconds }) {
      const b = (state.bosses[bossId] ??= { attempts: 0, defeated: false, bestTime: null });
      b.attempts++;
      if (victory) {
        const first = !b.defeated;
        b.defeated = true;
        b.bestTime = b.bestTime == null ? seconds : Math.min(b.bestTime, seconds);
        if (first) {
          b.trophyAt = now().toISOString();
          award({ xp: XP.boss, coins: COINS.boss, reason: 'Boss vaincu !' });
          log('boss', `Boss vaincu : ${bossId}`);
        } else award({ xp: 40, coins: 10, reason: 'Revanche gagnée' });
      }
      changed();
    },

    buy(item) {
      if (state.inventory.includes(item.id) || state.coins < item.price) return false;
      state.coins -= item.price;
      state.inventory.push(item.id);
      log('shop', `Achat : ${item.name}`);
      checkAchievements();
      changed();
      return true;
    },
    unlockPerk(id) {
      const p = PERKS.find((x) => x.id === id);
      if (!p || state.perks.includes(id) || skillPoints(state) < p.cost) return false;
      state.perks.push(id);
      changed();
      return true;
    },

    exportSave() { return JSON.stringify(state, null, 2); },
    importSave(text) {
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object' || !('xp' in data)) throw new Error('Fichier de sauvegarde invalide');
      state = migrate(data);
      changed();
      save();
    },
    reset() { state = defaultState(); changed(); save(); },
  };
  return api;
}
