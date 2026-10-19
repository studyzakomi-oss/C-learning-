// Carte d'aventure (mondes verrouillés / débloqués) et vue détaillée d'un monde.
import { h } from 'preact';
import { useStore } from '../hooks.js';
import { WORLDS, getWorld } from '../../content/index.js';
import { isWorldUnlocked, isLessonUnlocked, isLessonComplete, lessonMastery, worldStats, isBossUnlocked } from '../../game/progression.js';
import { Speech, BossFigure } from '../components/characters.jsx';
import { Bar, Ring } from '../components/visual.jsx';
import { Md } from '../components/text.jsx';
import { MODE_LABELS } from '../components/Exercise.jsx';

export function WorldMap() {
  const store = useStore();
  const s = store.state;
  return (
    <div>
      <h1 class="title-grad">Carte du Royaume du Code</h1>
      <p class="muted">Chaque monde est gardé par un boss. Termine les leçons, bats le gardien, et le monde suivant s'ouvre.</p>
      <div class="map">
        {WORLDS.map((w, i) => {
          const open = isWorldUnlocked(s, WORLDS, w.id);
          const st = worldStats(s, w);
          return (
            <>
              {i > 0 && <div class="map-link" aria-hidden="true" />}
              <a class={'map-node' + (open ? '' : ' locked')} href={open ? `#/world/${w.id}` : undefined} aria-disabled={!open} style={{ '--wc': w.color }} key={w.id}>
                <div class="orb">{open ? w.icon : '🔒'}</div>
                <div class="meta">
                  <div class="small faint">Monde {w.num}{st.bossDefeated ? ' · 🏆 boss vaincu' : ''}</div>
                  <h3>{w.title}</h3>
                  <div class="small muted">{w.subtitle}</div>
                  {open && <div style={{ marginTop: '6px' }}><Bar value={(st.done / st.total) * 100} /></div>}
                  {!open && <div class="small faint">Bats le boss du Monde {w.num - 1} pour ouvrir ce monde.</div>}
                </div>
              </a>
            </>
          );
        })}
      </div>
    </div>
  );
}

export function WorldView({ id }) {
  const store = useStore();
  const s = store.state;
  const w = getWorld(id);
  if (!w) return <div class="card">Monde introuvable.</div>;
  const open = isWorldUnlocked(s, WORLDS, w.id);
  if (!open) return <div class="card center"><h2>🔒 Monde verrouillé</h2><p class="muted">Termine le monde précédent et bats son boss.</p><a class="btn" href="#/map">Retour à la carte</a></div>;
  const st = worldStats(s, w);
  const bossOpen = isBossUnlocked(s, w);
  const firstOpen = w.lessons.find((l) => !isLessonComplete(s.lessons[l.id]) && isLessonUnlocked(s, WORLDS, l.id));
  return (
    <div class="stack">
      <div class="card glow" style={{ '--accent': w.color }}>
        <div class="row" style={{ flexWrap: 'nowrap' }}>
          <Ring value={(st.done / st.total) * 100} color={w.color} label="Progression du monde" />
          <div>
            <div class="small faint">Monde {w.num}</div>
            <h1 style={{ margin: 0 }}>{w.icon} {w.title}</h1>
            <div class="muted small">{w.subtitle}</div>
            <div class="small">Maîtrise moyenne : <b>{st.mastery} %</b></div>
          </div>
        </div>
      </div>
      <Speech who="syntaxe"><Md text={w.intro} /></Speech>

      <div class="section-title">Leçons</div>
      <div class="lesson-list">
        {w.lessons.map((l, i) => {
          const rec = s.lessons[l.id];
          const done = isLessonComplete(rec);
          const unlocked = isLessonUnlocked(s, WORLDS, l.id);
          const cur = firstOpen?.id === l.id;
          return (
            <a class={'lesson-item' + (done ? ' done' : '') + (cur ? ' current' : '') + (unlocked ? '' : ' locked')} href={unlocked ? `#/lesson/${l.id}` : undefined} aria-disabled={!unlocked} key={l.id}>
              <span class="state">{done ? '✓' : unlocked ? i + 1 : '🔒'}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b>{l.title}</b>
                <div class="small muted">{done ? `Maîtrise ${lessonMastery(rec)} %` : rec?.step ? `En cours — étape ${rec.step + 1}/10` : unlocked ? 'À découvrir' : 'Termine la leçon précédente'}</div>
              </span>
              <span class="faint">›</span>
            </a>
          );
        })}
      </div>

      {w.challenges?.length > 0 && (
        <>
          <div class="section-title">Défis du monde (facultatifs)</div>
          <div class="grid two">
            {w.challenges.map((c) => {
              const r = s.exercises[c.id];
              return (
                <a class="card" href={`#/exercise/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }} key={c.id}>
                  <div class="row between"><b>{MODE_LABELS[c.mode].icon} {c.title}</b>{r?.passed ? <span class="badge green">Réussi</span> : <span class="badge amber">+ XP · 🪙</span>}</div>
                </a>
              );
            })}
          </div>
        </>
      )}

      <div class="section-title">Gardien du monde</div>
      <div class="boss-arena row" style={{ flexWrap: 'nowrap' }}>
        <BossFigure kind={w.boss.avatar} size={96} class={bossOpen ? 'float' : ''} />
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0 }}>⚔️ {w.boss.name}</h3>
          <div class="small muted">« {w.boss.taunt} »</div>
          {st.bossDefeated ? <div class="badge green" style={{ marginTop: '6px' }}>🏆 Vaincu</div> : null}
          <div style={{ marginTop: '8px' }}>
            {bossOpen ? <a class="btn primary small" href={`#/boss/${w.id}`}>{st.bossDefeated ? 'Revanche' : 'Combattre'}</a> : <span class="small faint">Termine toutes les leçons du monde pour l'affronter.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
