// Tableau de progression : maîtrise par thème, mondes, activité des 14 derniers jours, erreurs fréquentes.
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useStore } from '../hooks.js';
import { WORLDS } from '../../content/index.js';
import { SKILLS, skillLevels, worldStats, dayKey, levelFromXp } from '../../game/progression.js';
import { RULES, RUNTIME } from '../../game/tutor.js';
import { Bar } from '../components/visual.jsx';

function lastDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); out.push(dayKey(d)); }
  return out;
}

/** Histogramme à une seule série (minutes par jour), avec info-bulle et vue tableau. */
function DayChart({ days, values, unit }) {
  const [hover, setHover] = useState(null);
  const [table, setTable] = useState(false);
  const max = Math.max(1, ...values);
  const W = 560, H = 170, pl = 30, pb = 24, pt = 14;
  const bw = (W - pl - 8) / days.length;
  if (table) {
    return (
      <div class="stack">
        <button class="btn small ghost" onClick={() => setTable(false)}>📊 Voir le graphique</button>
        <table class="small" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={{ textAlign: 'left' }}>Jour</th><th style={{ textAlign: 'right' }}>{unit}</th></tr></thead>
          <tbody>{days.map((d, i) => <tr key={d}><td>{new Date(d + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</td><td style={{ textAlign: 'right' }}>{values[i]}</td></tr>)}</tbody>
        </table>
      </div>
    );
  }
  const ticks = [0, Math.round(max / 2), max];
  return (
    <div class="stack">
      <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${unit} par jour sur ${days.length} jours`}>
        {ticks.map((t) => {
          const y = H - pb - ((H - pb - pt) * t) / max;
          return <g key={t}><line x1={pl} x2={W - 4} y1={y} y2={y} stroke="var(--line)" stroke-width="1" /><text x={pl - 6} y={y + 4} text-anchor="end" font-size="10" fill="var(--faint)">{t}</text></g>;
        })}
        {days.map((d, i) => {
          const v = values[i];
          const hh = ((H - pb - pt) * v) / max;
          const x = pl + i * bw + 3;
          const w = Math.max(4, bw - 6);
          const y = H - pb - hh;
          return (
            <g key={d} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)}>
              <rect x={pl + i * bw} y={pt} width={bw} height={H - pb - pt} fill="transparent" />
              {v > 0 && <path d={`M${x},${H - pb} V${y + 4} q0,-4 4,-4 h${w - 8} q4,0 4,4 V${H - pb} Z`} fill={hover === i ? 'var(--violet)' : 'var(--cyan)'} />}
              {(i % 2 === days.length % 2 || days.length <= 7) && <text x={pl + i * bw + bw / 2} y={H - 8} text-anchor="middle" font-size="10" fill="var(--faint)">{d.slice(8)}</text>}
            </g>
          );
        })}
        <line x1={pl} x2={W - 4} y1={H - pb} y2={H - pb} stroke="var(--line2)" />
      </svg>
      <div class="row between small">
        <span class="muted" aria-live="polite">{hover != null ? `${new Date(days[hover] + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} : ${values[hover]} ${unit}` : 'Survole ou touche une barre pour le détail.'}</span>
        <button class="btn small ghost" onClick={() => setTable(true)}>📋 Tableau</button>
      </div>
    </div>
  );
}

export function Stats() {
  const store = useStore();
  const s = store.state;
  const lv = skillLevels(s, WORLDS);
  const days = lastDays(14);
  const minutes = days.map((d) => Math.round((s.stats.days[d]?.seconds || 0) / 60));
  const totalMin = Math.round(Object.values(s.stats.days).reduce((a, d) => a + (d.seconds || 0), 0) / 60);
  const exDone = Object.values(s.exercises).filter((e) => e.passed).length;
  const attempts = Object.values(s.exercises).reduce((a, e) => a + e.attempts, 0);
  const lessonsDone = WORLDS.reduce((a, w) => a + worldStats(s, w).done, 0);
  const totalLessons = WORLDS.reduce((a, w) => a + w.lessons.length, 0);
  const errs = Object.entries(s.errorCodes).filter(([k]) => k !== 'logic' && k !== 'rules').sort((a, b) => b[1] - a[1]).slice(0, 6);
  const timeByWorld = WORLDS.map((w) => ({ w, sec: w.lessons.reduce((a, l) => a + (s.lessons[l.id]?.timeSpent || 0), 0) }));
  return (
    <div class="stack">
      <h1 class="title-grad">Progression</h1>
      <div class="grid three">
        <div class="card kpi"><span class="small muted">Niveau</span><b>{levelFromXp(s.xp)}</b><span class="small faint">{s.xp} XP</span></div>
        <div class="card kpi"><span class="small muted">Leçons terminées</span><b>{lessonsDone}/{totalLessons}</b></div>
        <div class="card kpi"><span class="small muted">Exercices réussis</span><b>{exDone}</b><span class="small faint">{attempts} essais · {s.stats.firstTry} du premier coup</span></div>
        <div class="card kpi"><span class="small muted">Temps d'étude</span><b>{totalMin} min</b></div>
        <div class="card kpi"><span class="small muted">Programmes exécutés</span><b>{s.stats.runs}</b></div>
        <div class="card kpi"><span class="small muted">Bugs corrigés</span><b>{s.stats.bugsFixed}</b></div>
      </div>

      <div class="section-title">Maîtrise par thème</div>
      <div class="card stack">
        {Object.entries(SKILLS).map(([k, sk]) => (
          <div key={k}><div class="row between small"><span>{sk.icon} {sk.name}</span><span>{lv[k].mastery} %</span></div><Bar value={lv[k].mastery} /></div>
        ))}
      </div>

      <div class="section-title">Minutes d'étude (14 derniers jours)</div>
      <div class="card"><DayChart days={days} values={minutes} unit="minutes" /></div>

      <div class="section-title">Par monde</div>
      <div class="card stack">
        {timeByWorld.map(({ w, sec }) => {
          const st = worldStats(s, w);
          return (
            <div key={w.id}>
              <div class="row between small"><span>{w.icon} Monde {w.num} — {w.title}</span><span class="faint">{st.done}/{st.total} · maîtrise {st.mastery} % · {Math.round(sec / 60)} min{st.bossDefeated ? ' · 🏆' : ''}</span></div>
              <Bar value={(st.done / st.total) * 100} />
            </div>
          );
        })}
      </div>

      <div class="section-title">Erreurs les plus fréquentes</div>
      <div class="card stack small">
        {errs.length === 0 && <div class="muted">Pas encore de données.</div>}
        {errs.map(([code, n]) => <div class="row between" key={code}><span>{RULES[code]?.title || RUNTIME[code]?.title || code}</span><span class="badge">{n}×</span></div>)}
        {errs.length > 0 && <a class="btn small" href="#/review">S'entraîner sur ces points</a>}
      </div>
    </div>
  );
}
