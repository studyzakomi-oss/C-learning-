// Tableau de bord de l'aventure : prochaine étape, missions du jour, série, progression, révisions.
import { h } from 'preact';
import { useStore } from '../hooks.js';
import { WORLDS, getLesson } from '../../content/index.js';
import { levelProgress, rankFor, nextStep, worldStats, dueCards, SKILLS, isWorldUnlocked } from '../../game/progression.js';
import { PlayerAvatar, Speech } from '../components/characters.jsx';
import { Bar, Ring, Particles } from '../components/visual.jsx';

const TOPIC_NAMES = { ...Object.fromEntries(Object.entries(SKILLS).map(([k, v]) => [k, v.name])), logic: 'Logique', variables: 'Variables', conditions: 'Conditions', loops: 'Boucles', functions: 'Fonctions' };

export function Home() {
  const store = useStore();
  const s = store.state;
  const lp = levelProgress(s.xp);
  const next = nextStep(s, WORLDS);
  const daily = store.dailyMissions();
  const due = dueCards(s.cards, store.today()).length;
  const weak = Object.entries(s.weak).filter(([, v]) => v >= 0.75).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const resume = s.resume.route;
  const resumeLesson = resume?.startsWith('/lesson/') ? getLesson(resume.split('/')[2]) : null;
  const greet = new Date().getHours() < 12 ? 'Bonjour' : new Date().getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div class="stack">
      <div class="card hero glow">
        <Particles density={26} />
        <div class="row" style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
          <PlayerAvatar avatar={s.profile.avatar} size={76} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div class="muted small">{greet},</div>
            <h1 style={{ margin: 0 }}>{s.profile.name || 'Apprenti'}</h1>
            <div class="small" style={{ color: 'var(--violet)' }}>{rankFor(lp.level)} · Niveau {lp.level}</div>
            <div style={{ marginTop: '8px' }}><Bar value={lp.ratio * 100} /></div>
            <div class="small faint">{lp.current} / {lp.needed} XP vers le niveau {lp.level + 1}</div>
          </div>
        </div>
      </div>

      <div class="grid two">
        <div class="card glow stack">
          <div class="section-title" style={{ margin: 0 }}>Prochaine quête</div>
          {next.kind === 'lesson' && (
            <>
              <h2 style={{ margin: 0 }}>{next.title}</h2>
              <div class="muted small">{WORLDS.find((w) => w.id === next.worldId).icon} Monde {WORLDS.find((w) => w.id === next.worldId).num} — {WORLDS.find((w) => w.id === next.worldId).title}</div>
              <a class="btn primary" href={`#/lesson/${next.lessonId}`}>▶ Continuer la leçon</a>
            </>
          )}
          {next.kind === 'boss' && (
            <>
              <h2 style={{ margin: 0 }}>⚔️ {next.title}</h2>
              <div class="muted small">Toutes les leçons du monde sont terminées : le gardien t'attend.</div>
              <a class="btn primary" href={`#/boss/${next.worldId}`}>Affronter le boss</a>
            </>
          )}
          {next.kind === 'done' && <><h2>👑 Tous les mondes disponibles sont terminés !</h2><a class="btn" href="#/review">Entretenir ta mémoire</a></>}
          {resumeLesson && next.lessonId !== resumeLesson.lesson.id && <a class="btn small ghost" href={'#' + resume}>↩ Reprendre « {resumeLesson.lesson.title} »</a>}
        </div>

        <div class="card stack">
          <div class="section-title" style={{ margin: 0 }}>Missions du jour</div>
          {daily.map((m) => (
            <div key={m.id}>
              <div class="row between small"><span>{m.done ? '✅' : '◻️'} {m.text}</span><span class="faint">{m.progress}/{m.goal} · +{m.reward} 🪙</span></div>
              <Bar value={(m.progress / m.goal) * 100} cls={m.done ? 'green' : ''} />
            </div>
          ))}
          <div class="small faint">🔥 Série : {s.streak?.count || 0} jour(s) · record {s.streak?.best || 0} · {s.streak?.rest ?? 2} jour(s) de repos disponibles cette semaine (une pause ne casse pas ta série).</div>
        </div>
      </div>

      <div class="grid three">
        <a class="card stack" href="#/review" style={{ textDecoration: 'none', color: 'inherit' }}>
          <b>🔁 Centre de révision</b>
          <div class="kpi"><b>{due}</b><span class="small muted">carte(s) à revoir aujourd'hui</span></div>
        </a>
        <a class="card stack" href="#/skills" style={{ textDecoration: 'none', color: 'inherit' }}>
          <b>🌳 Arbre de compétences</b>
          <span class="small muted">Syntaxe, logique, débogage, algorithmes, mémoire</span>
        </a>
        <a class="card stack" href="#/stats" style={{ textDecoration: 'none', color: 'inherit' }}>
          <b>📊 Progression</b>
          <span class="small muted">Maîtrise par thème, temps, réussites</span>
        </a>
      </div>

      {weak.length > 0 && (
        <Speech who="bug">
          Je remarque des difficultés sur : <b>{weak.map(([k]) => TOPIC_NAMES[k] || k).join(', ')}</b>. Le centre de révision a préparé un entraînement ciblé. <a href="#/review">Y aller →</a>
        </Speech>
      )}

      <div class="section-title">Les mondes</div>
      <div class="grid three">
        {WORLDS.map((w) => {
          const st = worldStats(s, w);
          const open = isWorldUnlocked(s, WORLDS, w.id);
          return (
            <a class="card row" href={open ? `#/world/${w.id}` : '#/map'} style={{ textDecoration: 'none', color: 'inherit', flexWrap: 'nowrap', opacity: open ? 1 : 0.55 }} key={w.id}>
              <Ring value={(st.done / st.total) * 100} color={w.color} size={60} label={`${st.done} leçons sur ${st.total}`} />
              <div style={{ minWidth: 0 }}>
                <div class="small faint">Monde {w.num} {open ? '' : '🔒'}</div>
                <b>{w.icon} {w.title}</b>
                <div class="small muted">{st.done}/{st.total} leçons{st.bossDefeated ? ' · 🏆' : ''}</div>
              </div>
            </a>
          );
        })}
      </div>

      {s.log.length > 0 && (
        <>
          <div class="section-title">Journal de bord</div>
          <div class="card stack small">
            {s.log.slice(0, 6).map((l, i) => <div class="row between" key={i}><span>{l.text}</span><span class="faint">{new Date(l.t).toLocaleDateString('fr-FR')}</span></div>)}
          </div>
        </>
      )}
    </div>
  );
}
