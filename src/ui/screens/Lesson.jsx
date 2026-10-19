// Leçon au format imposé en 10 étapes : objectif → explication → syntaxe → exemple → visualisation →
// erreur fréquente → exercice guidé → mission autonome → quiz → résumé.
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { useStore, navigate, useTimeTracker } from '../hooks.js';
import { WORLDS, getLesson } from '../../content/index.js';
import { isLessonUnlocked, isLessonComplete, lessonMastery, isBossUnlocked } from '../../game/progression.js';
import { Speech } from '../components/characters.jsx';
import { CodeView, Md, Inline } from '../components/text.jsx';
import { TraceViewer } from '../components/visual.jsx';
import { Exercise } from '../components/Exercise.jsx';
import { Quiz } from '../components/Quiz.jsx';
import { ConsoleView, Diagnostics } from '../components/Lab.jsx';
import { runProgram } from '../engine-client.js';

const STEPS = ['Objectif', 'Explication simple', 'Syntaxe générale', 'Exemple commenté', 'Visualisation', 'Erreur fréquente', 'Exercice guidé', 'Mission autonome', 'Quiz rapide', 'Résumé'];

function RunBlock({ code, stdin, files, label = '▶ Exécuter cet exemple' }) {
  const [r, setR] = useState(null);
  const [busy, setBusy] = useState(false);
  return (
    <div class="stack">
      <div class="row">
        <button class="btn small primary" disabled={busy} onClick={async () => { setBusy(true); setR(await runProgram(code, { stdin: stdin || '', dataFiles: files || {} })); setBusy(false); }}>{label}</button>
        {stdin && <span class="small faint">Entrée utilisée : <code class="inline-code">{stdin.trim().replace(/\n/g, ' ⏎ ')}</code></span>}
      </div>
      {(r || busy) && <ConsoleView result={r} running={busy} />}
      {r && <Diagnostics diagnostics={r.diagnostics} />}
    </div>
  );
}

function ErrorStep({ l }) {
  const [r, setR] = useState(null);
  useEffect(() => { runProgram(l.erreur.code, { stdin: l.erreur.stdin || '', dataFiles: l.erreur.files || {} }).then(setR); }, [l.id]);
  const errLines = r ? [...new Set([...(r.diagnostics || []).filter((d) => d.severity !== 'info').map((d) => d.line), r.runtimeError?.line].filter(Boolean))] : [];
  return (
    <div class="stack">
      <Speech who="bug">Voici un piège dans lequel presque tout le monde tombe. Lis le code et cherche l'erreur <b>avant</b> de regarder ce que dit le compilateur.</Speech>
      <div class="badge red" style={{ alignSelf: 'flex-start' }}>❌ Code incorrect</div>
      <CodeView code={l.erreur.code} errorLines={errLines} />
      <details class="fold">
        <summary>Ce que disent le compilateur et l'exécution (vraie compilation)</summary>
        {r ? <><Diagnostics diagnostics={r.diagnostics} />{r.compiled && <ConsoleView result={r} />}</> : <div class="small faint">Compilation…</div>}
      </details>
      <div class="diag info"><b>Pourquoi ça échoue :</b> <Inline text={l.erreur.explication} /></div>
      <div class="badge green" style={{ alignSelf: 'flex-start' }}>✅ Version corrigée</div>
      <CodeView code={l.erreur.correction} />
      <RunBlock code={l.erreur.correction} stdin={l.erreur.stdin} files={l.erreur.files} label="▶ Exécuter la correction" />
    </div>
  );
}

export function LessonScreen({ id, step }) {
  const store = useStore();
  const s = store.state;
  const found = getLesson(id);
  const rec = s.lessons[id];
  const [hl, setHl] = useState([]);
  useTimeTracker(store, id);
  const cur = step ?? rec?.step ?? 0;
  useEffect(() => { if (found) store.setLessonStep(id, cur); }, [id, cur]);
  if (!found) return <div class="card">Leçon introuvable.</div>;
  const { lesson: l, world: w, index } = found;
  if (!isLessonUnlocked(s, WORLDS, id)) {
    return <div class="card center"><h2>🔒 Leçon verrouillée</h2><p class="muted">Termine d'abord la leçon précédente (mission réussie + quiz ≥ 60 %).</p><a class="btn" href={`#/world/${w.id}`}>Retour au monde</a></div>;
  }
  const go = (n) => navigate(`/lesson/${id}/${Math.max(0, Math.min(9, n))}`, true);
  const done = isLessonComplete(rec);
  const nextLesson = w.lessons[index + 1];

  let body;
  switch (cur) {
    case 0:
      body = (
        <div class="stack">
          <Speech who="syntaxe"><b>Objectif :</b> <Inline text={l.objectif} /></Speech>
          <div class="card stack">
            <div class="small muted">Dans cette leçon :</div>
            <ol class="prose">{STEPS.map((t, i) => <li key={i}>{t}</li>)}</ol>
            <div class="small faint">Pour valider la leçon : réussir la mission autonome et obtenir au moins 60 % au quiz. Tout le reste est libre d'accès.</div>
          </div>
        </div>
      );
      break;
    case 1:
      body = (
        <div class="stack">
          <div class="card"><Md text={l.explication} /></div>
          {l.python && (
            <details class="fold">
              <summary>🐍 Tu connais Python ? Comparaison</summary>
              <div class="grid two" style={{ marginTop: '8px' }}>
                <div><div class="small muted">Python</div><pre class="code"><div class="ln"><span class="src" style="padding-left:14px">{l.python.py}</span></div></pre></div>
                <div><div class="small muted">C</div><CodeView code={l.python.c} numbers={false} /></div>
              </div>
              <p class="small"><Inline text={l.python.note} /></p>
            </details>
          )}
        </div>
      );
      break;
    case 2:
      body = (
        <div class="stack">
          <CodeView code={l.syntaxe.code} label="Syntaxe générale" />
          {l.syntaxe.note && <div class="diag info"><Inline text={l.syntaxe.note} /></div>}
        </div>
      );
      break;
    case 3:
      body = (
        <div class="stack">
          <div class="small muted">Touche une explication pour surligner la ligne correspondante.</div>
          <CodeView code={l.exemple.code} highlight={hl} />
          <div class="annot">
            {Object.entries(l.exemple.lines).map(([n, txt]) => (
              <><span class="k" onClick={() => setHl([+n])} role="button" tabIndex={0} key={'k' + n}>L{n}</span><span onClick={() => setHl([+n])} key={'t' + n}><Inline text={txt} /></span></>
            ))}
          </div>
          <RunBlock code={l.exemple.code} stdin={l.exemple.stdin} files={l.exemple.files} />
          <a class="btn small ghost" href="#/sandbox" onClick={() => store.setSandbox({ code: l.exemple.code, stdin: l.exemple.stdin || '' })}>🧪 Modifier cet exemple dans le labo</a>
        </div>
      );
      break;
    case 4:
      body = l.visualisation.kind === 'trace'
        ? <TraceViewer code={l.visualisation.code || l.exemple.code} stdin={l.visualisation.stdin ?? l.exemple.stdin ?? ''} files={l.visualisation.files || l.exemple.files} note={l.visualisation.note} />
        : <Md text={l.visualisation.text} />;
      break;
    case 5:
      body = <ErrorStep l={l} />;
      break;
    case 6:
      body = (
        <div class="stack">
          <Speech who="syntaxe">Exercice guidé : prends ton temps. Les indices arrivent un par un si tu en as besoin.</Speech>
          <Exercise ex={{ ...l.guide, kind: 'guide', lessonId: l.id }} onPassed={() => {}} />
        </div>
      );
      break;
    case 7:
      body = (
        <div class="stack">
          <Speech who="compilo">Mission autonome. Écris le programme toi-même, sans recopier l'exemple. Je vais l'exécuter sur plusieurs entrées, dont certaines cachées.</Speech>
          {rec?.missionPassed && <div class="badge green">✅ Mission déjà réussie — tu peux t'entraîner encore</div>}
          <Exercise ex={{ ...l.mission, kind: 'mission', lessonId: l.id }} />
        </div>
      );
      break;
    case 8:
      body = (
        <div class="stack">
          {rec?.quizBest != null && <div class="small muted">Meilleur score : {rec.quizBest} %</div>}
          <div class="card">
            <Quiz key={l.id} questions={l.quiz} onDone={(g, n) => store.recordQuiz(l.id, g, n, l.quiz.map((_, i) => `${l.id}-q${i}`))} />
          </div>
        </div>
      );
      break;
    default:
      body = (
        <div class="stack">
          <div class="card glow">
            <h2 style={{ marginTop: 0 }}>🧠 À retenir</h2>
            <ul class="prose">{l.resume.map((r, i) => <li key={i}><Inline text={r} /></li>)}</ul>
          </div>
          <div class="card stack">
            <div class="row between"><b>Validation de la leçon</b>{done ? <span class="badge green">Terminée · maîtrise {lessonMastery(rec)} %</span> : <span class="badge amber">En cours</span>}</div>
            <div class="small">{rec?.missionPassed ? '✅' : '◻️'} Mission autonome réussie</div>
            <div class="small">{(rec?.quizBest ?? 0) >= 60 ? '✅' : '◻️'} Quiz ≥ 60 % (meilleur : {rec?.quizBest ?? '—'} %)</div>
            <div class="small">{rec?.guidePassed ? '✅' : '◻️'} Exercice guidé (facultatif, améliore la maîtrise)</div>
            {!done && <div class="row">{!rec?.missionPassed && <button class="btn small" onClick={() => go(7)}>Aller à la mission</button>}{(rec?.quizBest ?? 0) < 60 && <button class="btn small" onClick={() => go(8)}>Aller au quiz</button>}</div>}
            {done && nextLesson && <a class="btn primary" href={`#/lesson/${nextLesson.id}/0`}>Leçon suivante : {nextLesson.title} →</a>}
            {done && !nextLesson && (isBossUnlocked(s, w) ? <a class="btn primary" href={`#/boss/${w.id}`}>⚔️ Affronter {w.boss.name}</a> : <a class="btn" href={`#/world/${w.id}`}>Retour au monde</a>)}
          </div>
        </div>
      );
  }

  return (
    <div>
      <div class="small faint"><a href={`#/world/${w.id}`}>{w.icon} Monde {w.num} — {w.title}</a> · Leçon {index + 1}/{w.lessons.length}</div>
      <h1>{l.title}</h1>
      <div class="steps" role="tablist" aria-label="Étapes de la leçon">
        {STEPS.map((t, i) => <button role="tab" aria-selected={i === cur} aria-label={`${i + 1}. ${t}`} title={t} class={i === cur ? 'cur' : i < cur ? 'done' : ''} onClick={() => go(i)} key={i} />)}
      </div>
      <div class="step-head" style={{ marginBottom: '12px' }}><span class="n">{cur + 1}</span><h2 style={{ margin: 0 }}>{STEPS[cur]}</h2></div>
      <div class="fade-in" key={cur}>{body}</div>
      <div class={'step-nav' + (cur >= 6 && cur <= 8 ? ' static' : '')}>
        <button class="btn" onClick={() => go(cur - 1)} disabled={cur === 0}>← Précédent</button>
        {cur < 9 ? <button class="btn primary" onClick={() => go(cur + 1)}><span>Suivant<span class="hide-xs"> : {STEPS[cur + 1]}</span> →</span></button> : <a class="btn" href={`#/world/${w.id}`}>Retour au monde</a>}
      </div>
    </div>
  );
}
