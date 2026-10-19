// Combat de boss (mode F) : plusieurs phases qui combinent les notions du monde, avec cœurs et chronomètre.
import { h } from 'preact';
import { useState, useRef } from 'preact/hooks';
import { useStore, navigate, useInterval } from '../hooks.js';
import { getWorld, WORLDS } from '../../content/index.js';
import { isBossUnlocked, worldStats } from '../../game/progression.js';
import { BossFigure, Speech } from '../components/characters.jsx';
import { Exercise } from '../components/Exercise.jsx';
import { Bar, Particles } from '../components/visual.jsx';

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function BossScreen({ worldId }) {
  const store = useStore();
  const s = store.state;
  const w = getWorld(worldId);
  const [phase, setPhase] = useState(-1);
  const [hearts, setHearts] = useState(3);
  const [left, setLeft] = useState(0);
  const [outcome, setOutcome] = useState(null);
  const [hit, setHit] = useState(false);
  const startedAt = useRef(0);
  const b = w?.boss;
  const maxHearts = 3 + (s.perks.includes('bouclier') ? 1 : 0);
  const mastery = w ? worldStats(s, w).mastery : 0;
  // adaptation : plus de temps si la maîtrise du monde est encore fragile (la vitesse n'est pas l'objectif)
  const timeLimit = b ? b.timeLimit + (s.perks.includes('sablier') ? 180 : 0) + (mastery < 70 ? Math.round(b.timeLimit * 0.25) : 0) : 0;
  const timed = s.settings.bossTimer;
  const n = b ? b.phases.length : 0;
  const bossHp = phase < 0 ? 100 : Math.round(((n - Math.min(phase, n)) / n) * 100);

  useInterval(() => {
    if (phase < 0 || outcome || !timed) return;
    if (left <= 1) { setLeft(0); lose('time'); } else setLeft(left - 1);
  }, phase >= 0 && !outcome && timed ? 1000 : null);

  if (!w) return <div class="card">Monde introuvable.</div>;
  if (!isBossUnlocked(s, w)) {
    return <div class="card center"><h2>🔒 Le gardien dort encore</h2><p class="muted">Termine toutes les leçons du monde pour l'affronter.</p><a class="btn" href={`#/world/${w.id}`}>Retour au monde</a></div>;
  }
  const start = () => { setPhase(0); setHearts(maxHearts); setLeft(timeLimit); setOutcome(null); startedAt.current = Date.now(); };
  const lose = (why) => { setOutcome({ victory: false, why }); store.bossResult(b.id, { victory: false, seconds: Math.round((Date.now() - startedAt.current) / 1000) }); };
  const onPassed = () => {
    setHit(true); setTimeout(() => setHit(false), 500);
    if (phase + 1 >= n) {
      const secs = Math.round((Date.now() - startedAt.current) / 1000);
      setPhase(n);
      setOutcome({ victory: true, secs });
      store.bossResult(b.id, { victory: true, seconds: secs });
    } else setTimeout(() => setPhase(phase + 1), 900);
  };
  const onFail = (res) => {
    if (res.stage === 'compile') return; // une erreur de compilation n'enlève pas de cœur : on apprend
    const hrt = hearts - 1;
    setHearts(hrt);
    if (hrt <= 0) lose('hearts');
  };

  const next = WORLDS[WORLDS.indexOf(w) + 1];
  return (
    <div class="stack">
      <div class="boss-arena">
        <Particles density={20} color="#f472b6" />
        <div class="row between" style={{ position: 'relative' }}>
          <a class="btn small ghost" href={`#/world/${w.id}`}>✕ Quitter</a>
          {phase >= 0 && !outcome && <span class="hearts" aria-label={`${hearts} cœurs`}>{'❤️'.repeat(Math.max(0, hearts))}{'🖤'.repeat(Math.max(0, maxHearts - hearts))}</span>}
          {phase >= 0 && !outcome && timed && <span class={'timer' + (left < 60 ? ' low' : '')} aria-label="Temps restant">⏱ {fmt(left)}</span>}
        </div>
        <div class={'boss-figure ' + (hit ? 'hit' : 'float')} style={{ position: 'relative' }}><BossFigure kind={b.avatar} size={140} /></div>
        <h2 class="center" style={{ position: 'relative', margin: '6px 0' }}>{b.name}</h2>
        <div class="boss-hp" style={{ position: 'relative' }}><span class="small">PV</span><div style={{ flex: 1 }}><Bar value={bossHp} cls="red" /></div><span class="small mono">{bossHp}%</span></div>
      </div>

      {phase < 0 && (
        <div class="stack">
          <Speech who="glitch">« {b.taunt} »</Speech>
          <div class="card stack">
            <b>Règles du combat</b>
            <div class="small">⚔️ {n} phases qui mélangent les notions du monde : chaque phase réussie inflige des dégâts au boss.</div>
            <div class="small">❤️ {maxHearts} cœurs : une réponse fausse (mauvaise sortie ou plantage) coûte un cœur. Une erreur de compilation ne coûte rien : lis le message et corrige.</div>
            <div class="small">⏱ {timed ? `Temps : ${fmt(timeLimit)}${mastery < 70 ? ' (temps bonus : ta maîtrise de ce monde est encore fraîche)' : ''}` : 'Chronomètre désactivé dans les réglages.'}</div>
            <div class="small">💡 Les indices restent disponibles.</div>
            <button class="btn primary block" onClick={start}>⚔️ Commencer le combat</button>
          </div>
        </div>
      )}

      {phase >= 0 && phase < n && !outcome && (
        <div class="card stack fade-in" key={phase}>
          <div class="row between"><b>{b.phases[phase].title}</b><span class="badge">Phase {phase + 1}/{n}</span></div>
          <Exercise ex={{ ...b.phases[phase], kind: 'boss' }} compact noReward onPassed={onPassed} onFail={onFail} />
        </div>
      )}

      {outcome && outcome.victory && (
        <div class="card glow center pop stack">
          <h1>🏆 Victoire !</h1>
          <Speech who="glitch">« {b.defeat} »</Speech>
          <div class="muted">Combat gagné en {fmt(outcome.secs)}. Trophée ajouté à ton inventaire.</div>
          {next ? <a class="btn primary" href={`#/world/${next.id}`}>Entrer dans le Monde {next.num} : {next.title} →</a> : <a class="btn primary" href="#/profile">Voir mes trophées</a>}
          <a class="btn" href="#/map">Carte</a>
        </div>
      )}
      {outcome && !outcome.victory && (
        <div class="card center stack pop">
          <h2>{outcome.why === 'time' ? '⏱ Temps écoulé…' : '💔 Plus de cœurs…'}</h2>
          <Speech who="syntaxe">Ce n'est pas un échec, c'est un entraînement. Relis les leçons concernées ou passe par le centre de révision, puis reviens : le boss garde exactement les mêmes faiblesses.</Speech>
          <button class="btn primary" onClick={start}>↺ Réessayer</button>
          <a class="btn" href="#/review">Réviser d'abord</a>
        </div>
      )}
    </div>
  );
}
