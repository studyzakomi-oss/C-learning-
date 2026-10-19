// Arbre de compétences : 5 branches (syntaxe, logique, débogage, algorithmes, mémoire) + capacités spéciales.
import { h } from 'preact';
import { useStore } from '../hooks.js';
import { WORLDS } from '../../content/index.js';
import { SKILLS, skillLevels, isLessonComplete, lessonMastery, PERKS, skillPoints, allLessons } from '../../game/progression.js';
import { Ring } from '../components/visual.jsx';

export function SkillTree() {
  const store = useStore();
  const s = store.state;
  const lv = skillLevels(s, WORLDS);
  const pts = skillPoints(s);
  const lessons = allLessons(WORLDS);
  return (
    <div class="stack">
      <h1 class="title-grad">Arbre de compétences</h1>
      <p class="muted">Chaque leçon terminée fait pousser une branche. La maîtrise tient compte de tes essais, des indices utilisés et de tes révisions.</p>
      <div class="skill-tree">
        {Object.entries(SKILLS).map(([k, sk]) => (
          <div class="card skill-col" style={{ '--sc': sk.color }} key={k}>
            <div class="row" style={{ flexWrap: 'nowrap' }}>
              <Ring value={lv[k].mastery} color={sk.color} size={64} label={`${sk.name} ${lv[k].mastery} %`} />
              <div><b>{sk.icon} {sk.name}</b><div class="small muted">Rang {lv[k].rank}/5 · {lv[k].done}/{lv[k].lessons} leçons</div></div>
            </div>
            {lessons.filter((l) => (l.skills || [l.topic]).includes(k)).map((l) => {
              const done = isLessonComplete(s.lessons[l.id]);
              return <a class={'skill-node' + (done ? ' on' : '')} href={`#/lesson/${l.id}`} key={l.id}><span class="dot" /><span style={{ flex: 1 }}>{l.title}</span>{done && <span class="small faint">{lessonMastery(s.lessons[l.id])}%</span>}</a>;
            })}
          </div>
        ))}
      </div>
      <div class="section-title">Capacités spéciales</div>
      <div class="small muted">1 point de compétence tous les 2 niveaux. Points disponibles : <b>{pts}</b></div>
      <div class="grid two">
        {PERKS.map((p) => {
          const on = s.perks.includes(p.id);
          return (
            <div class="shop-item" key={p.id}>
              <span class="ic">{p.icon}</span>
              <div style={{ flex: 1 }}><b>{p.name}</b><div class="small muted">{p.desc}</div></div>
              {on ? <span class="badge green">Actif</span> : <button class="btn small" disabled={pts < p.cost} onClick={() => store.unlockPerk(p.id)}>{p.cost} pt</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
