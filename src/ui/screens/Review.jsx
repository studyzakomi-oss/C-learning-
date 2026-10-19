// Centre de révision (mode G) : répétition espacée des notions déjà vues + entraînement ciblé sur les points faibles.
import { h } from 'preact';
import { useState, useMemo } from 'preact/hooks';
import { useStore } from '../hooks.js';
import { WORLDS, getLesson } from '../../content/index.js';
import { dueCards, isLessonComplete, SKILLS, allLessons, LEITNER_DAYS } from '../../game/progression.js';
import { Inline } from '../components/text.jsx';
import { Speech } from '../components/characters.jsx';
import { Exercise, MODE_LABELS } from '../components/Exercise.jsx';
import { Bar } from '../components/visual.jsx';

function cardInfo(id) {
  const m = /^(.+)-q(\d+)$/.exec(id);
  if (!m) return null;
  const f = getLesson(m[1]);
  if (!f) return null;
  const q = f.lesson.quiz[+m[2]];
  return q ? { id, q, lesson: f.lesson, world: f.world } : null;
}

function ReviewSession({ ids, onEnd }) {
  const store = useStore();
  const cards = useMemo(() => ids.map(cardInfo).filter(Boolean), []);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [good, setGood] = useState(0);
  if (i >= cards.length) {
    return <div class="card center pop stack"><h2>✅ Révision terminée</h2><div class="muted">{good}/{cards.length} bonnes réponses. Les cartes ratées reviendront demain, les autres plus tard.</div><button class="btn primary" onClick={onEnd}>Retour</button></div>;
  }
  const c = cards[i];
  const answer = (k) => {
    if (picked !== null) return;
    setPicked(k);
    const ok = k === c.q.answer;
    if (ok) setGood(good + 1);
    store.reviewAnswer(c.id, ok, c.lesson.id);
  };
  return (
    <div class="card stack fade-in" key={i}>
      <div class="row between"><span class="badge cyan">{c.world.icon} {c.lesson.title}</span><span class="badge">{i + 1}/{cards.length}</span></div>
      <Bar value={(i / cards.length) * 100} />
      <div class="prose"><p><Inline text={c.q.q} /></p></div>
      {c.q.choices.map((ch, k) => {
        let cls = '';
        if (picked !== null) { if (k === c.q.answer) cls = ' right'; else if (k === picked) cls = ' wrong'; }
        return <button class={'quiz-choice' + cls} onClick={() => answer(k)} key={k}><Inline text={ch} /></button>;
      })}
      {picked !== null && <div class={'diag ' + (picked === c.q.answer ? 'info' : 'error')}><Inline text={c.q.explain} /> <a href={`#/lesson/${c.lesson.id}/9`}>Revoir le résumé</a></div>}
      {picked !== null && <button class="btn primary" onClick={() => { setI(i + 1); setPicked(null); }}>Suivant →</button>}
    </div>
  );
}

export function Review() {
  const store = useStore();
  const s = store.state;
  const [session, setSession] = useState(null);
  const [practice, setPractice] = useState(null);
  const today = store.today();
  const due = dueCards(s.cards, today);
  const all = Object.keys(s.cards);
  const doneLessons = allLessons(WORLDS).filter((l) => isLessonComplete(s.lessons[l.id]));
  const weak = Object.entries(s.weak).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const weakTopics = weak.map(([k]) => k).filter((k) => SKILLS[k]);
  const targeted = [];
  for (const topic of weakTopics.slice(0, 3)) {
    for (const l of doneLessons.filter((x) => (x.skills || [x.topic]).includes(topic))) {
      targeted.push({ topic, ex: { ...l.guide, kind: 'guide', lessonId: l.id }, lesson: l });
    }
  }
  const miniPrograms = doneLessons.map((l) => l.guide).filter((g) => g.mode === 'predict' || g.mode === 'complete');
  const boxes = [1, 2, 3, 4, 5].map((b) => all.filter((id) => s.cards[id].box === b).length);

  if (session) return <ReviewSession ids={session} onEnd={() => setSession(null)} />;
  if (practice) {
    return (
      <div class="stack">
        <button class="btn small ghost" onClick={() => setPractice(null)}>← Centre de révision</button>
        <Exercise ex={practice} noReward={false} />
      </div>
    );
  }
  return (
    <div class="stack">
      <h1 class="title-grad">Centre de révision</h1>
      <Speech who="syntaxe">On oublie vite ce qu'on ne revoit pas. Ici, chaque notion revient au bon moment : une carte bien répondue revient plus tard ({LEITNER_DAYS.slice(1).join(', ')} jours), une carte ratée revient dès demain.</Speech>
      <div class="card stack">
        <div class="row between"><b>🗂️ Cartes à revoir aujourd'hui</b><span class="badge cyan">{due.length}</span></div>
        <div class="small muted">Boîtes : {boxes.map((n, i) => `B${i + 1} : ${n}`).join(' · ')}</div>
        {due.length > 0 && <button class="btn primary" onClick={() => setSession(due.slice(0, 10))}>Réviser {Math.min(10, due.length)} carte(s)</button>}
        {due.length === 0 && all.length > 0 && <button class="btn" onClick={() => setSession([...all].sort(() => Math.random() - 0.5).slice(0, 6))}>Rien d'urgent : réviser 6 cartes au hasard</button>}
        {all.length === 0 && <div class="small faint">Termine le quiz d'une leçon pour remplir ta pioche de révision.</div>}
      </div>

      <div class="card stack">
        <b>🎯 Entraînement ciblé</b>
        {weakTopics.length === 0 && <div class="small muted">Aucun point faible détecté pour l'instant. Continue comme ça !</div>}
        {weakTopics.length > 0 && <div class="small muted">Thèmes à renforcer (d'après tes erreurs) : {weakTopics.slice(0, 3).map((k) => SKILLS[k].name).join(', ')}</div>}
        {targeted.slice(0, 5).map((t) => (
          <button class="shop-item" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setPractice(t.ex)} key={t.ex.id}>
            <span class="ic">{MODE_LABELS[t.ex.mode].icon}</span>
            <span style={{ flex: 1 }}><b>{t.ex.title}</b><div class="small muted">{SKILLS[t.topic].name} · {t.lesson.title}</div></span>
          </button>
        ))}
        {weakTopics.length > 0 && targeted.length === 0 && <div class="small faint">Les exercices ciblés apparaîtront quand tu auras terminé des leçons de ces thèmes.</div>}
      </div>

      <div class="card stack">
        <b>🔮 Défi de révision : mini-programmes</b>
        {!s.perks.includes('memoire') && <div class="small faint">Avec la capacité « Mémoire d'éléphant » (arbre de compétences), un mini-programme tiré au sort est ajouté ici chaque jour. En attendant, tu peux en choisir un.</div>}
        {miniPrograms.length === 0 && <div class="small faint">Termine des leçons pour débloquer des mini-programmes.</div>}
        <div class="row">
          {miniPrograms.slice(0, s.perks.includes('memoire') ? 12 : 4).map((g) => <button class="btn small" onClick={() => setPractice({ ...g, id: g.id, kind: 'guide' })} key={g.id}>{MODE_LABELS[g.mode].icon} {g.title}</button>)}
        </div>
      </div>
    </div>
  );
}
