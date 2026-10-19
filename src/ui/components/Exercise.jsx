// Exercices : modes « Complète le code », « Trouve le bug », « Prédiction », « Écris le programme », « Remets en ordre ».
import { h, Fragment } from 'preact';
import { useState, useMemo, useEffect, useRef } from 'preact/hooks';
import { useStore } from '../hooks.js';
import { Lab, Diagnostics, ConsoleView } from './Lab.jsx';
import { CodeView, Md, highlightLine } from './text.jsx';
import { Speech } from './characters.jsx';
import { gradeExercise, referenceSource, shuffledOrder, normalizeOutput, expectedOutputs } from '../../game/grader.js';
import { analyze } from '../../game/tutor.js';
import { runProgram } from '../engine-client.js';

export const MODE_LABELS = {
  complete: { name: 'Complète le code', letter: 'A', icon: '🧩' },
  bug: { name: 'Trouve le bug', letter: 'B', icon: '🐞' },
  predict: { name: 'Prédiction', letter: 'C', icon: '🔮' },
  write: { name: 'Écris le programme', letter: 'D', icon: '✍️' },
  order: { name: 'Remets les lignes en ordre', letter: 'E', icon: '🔀' },
};

function HintBox({ ex, onUse }) {
  const store = useStore();
  const rec = store.exercise(ex.id) || {};
  const shown = Math.min(rec.hints || 0, ex.hints.length);
  const cost = store.hintCost(ex.id);
  const [err, setErr] = useState('');
  const take = () => {
    if (!store.takeHint(ex.id)) { setErr(`Il te faut ${cost} pièces. Gagne-en en réussissant des exercices, ou relis l'explication de la leçon (toujours gratuite).`); return; }
    setErr('');
    onUse?.();
  };
  return (
    <div class="stack">
      {ex.hints.slice(0, shown).map((hnt, i) => <div class="diag info" key={i}><b>💡 Indice {i + 1}</b> — <Md text={hnt} /></div>)}
      {shown < ex.hints.length && (
        <button class="btn small" onClick={take}>💡 Indice {shown + 1}/{ex.hints.length} {cost ? `(${cost} 🪙)` : '(gratuit)'}</button>
      )}
      {err && <div class="small muted">{err}</div>}
    </div>
  );
}

function TestResults({ res }) {
  if (!res || res.stage === 'compile') return null;
  return (
    <div class="tests">
      {res.tests.map((t, i) => (
        <div class={'test ' + (t.passed ? 'pass' : 'fail')} key={i}>
          <div class="row between"><b>{t.passed ? '✅' : '❌'} {t.name}{t.hidden ? ' (caché)' : ''}</b>{t.stdin && !t.hidden && <span class="small faint mono">entrée : {JSON.stringify(t.stdin.trim())}</span>}</div>
          {!t.passed && !t.hidden && (
            <div class="diffgrid">
              <div><div class="small muted">Sortie attendue</div><pre>{normalizeOutput(t.expected) || '(rien)'}</pre></div>
              <div><div class="small muted">Ta sortie</div><pre>{t.runtimeError ? normalizeOutput(t.got) + `\n💥 ${t.runtimeError.message}` : normalizeOutput(t.got) || '(rien)'}</pre></div>
            </div>
          )}
          {!t.passed && t.diff && !t.hidden && <div class="small">Première différence à la ligne {t.diff.line} : attendu <code class="inline-code">{t.diff.expected ?? '(fin)'}</code>, obtenu <code class="inline-code">{t.diff.got ?? '(fin)'}</code></div>}
          {!t.passed && t.hidden && <div class="small muted">Test caché : ton programme ne gère pas encore tous les cas (entrées différentes). {t.runtimeError ? `Erreur d'exécution : ${t.runtimeError.message}` : ''}</div>}
          {t.fileFail && <div class="small">Fichier « {t.fileFail.name} » incorrect.</div>}
        </div>
      ))}
      {res.ruleFailures?.length > 0 && res.ruleFailures.map((r) => <div class="diag">📏 Consigne : {r}</div>)}
    </div>
  );
}

function TutorPanel({ res, onLine }) {
  const [n, setN] = useState(1);
  useEffect(() => setN(1), [res]);
  if (!res) return null;
  const a = analyze(res);
  if (a.kind === 'ok') {
    return (
      <Speech who="compilo">
        <b>{a.title}</b>
        {a.steps.map((s) => <div class="small">{s}</div>)}
        {res.diagnostics?.some((d) => d.severity === 'warning') && <Diagnostics diagnostics={res.diagnostics.filter((d) => d.severity !== 'error')} max={3} />}
      </Speech>
    );
  }
  const who = a.kind === 'syntax' || a.kind === 'rules' ? 'syntaxe' : 'bug';
  const kindLabel = { syntax: 'Erreur de syntaxe (compilation)', runtime: 'Erreur d\'exécution', logic: 'Erreur de logique', rules: 'Consigne', warning: 'Avertissement' }[a.kind];
  return (
    <div class="tutor fade-in">
      <Speech who={who}>
        <div class="small faint">{kindLabel}{a.line ? <> — <button class="linkish" style={{ background: 'none', border: 0, color: 'var(--cyan)', cursor: 'pointer', padding: 0 }} onClick={() => onLine?.(a.line)}>ligne {a.line}</button></> : ''}</div>
        <b>{a.title}</b>
        <ol>{a.steps.slice(0, n).map((s, i) => <li key={i}>{s}</li>)}</ol>
        {n < a.steps.length && <button class="btn small" onClick={() => setN(n + 1)}>{n === 1 ? 'Je ne vois pas… explique-moi' : 'Donne-moi une piste'}</button>}
        {n >= a.steps.length && a.python && <div class="small faint" style={{ marginTop: '6px' }}>🐍 Comparaison avec Python : {a.python}</div>}
      </Speech>
      {res.stage === 'compile' && <Diagnostics diagnostics={res.diagnostics} onLine={onLine} />}
    </div>
  );
}

function SolutionReveal({ ex, attempts, onReveal }) {
  const store = useStore();
  const rec = store.exercise(ex.id) || {};
  const can = attempts >= 3 || (rec.hints || 0) >= ex.hints.length;
  const [open, setOpen] = useState(rec.solutionShown);
  if (!can && !open) return <div class="small faint">La solution expliquée se débloque après 3 essais ou tous les indices.</div>;
  if (!open) return <button class="btn small ghost" onClick={() => { if (confirm('Voir la solution ? Tu gagneras moins d\'XP pour cet exercice. Essaie d\'abord de la comprendre, puis réécris-la toi-même.')) { store.showSolution(ex.id); setOpen(true); onReveal?.(); } }}>📖 Voir la solution expliquée</button>;
  return (
    <details class="fold" open>
      <summary>📖 Solution de référence</summary>
      <CodeView code={referenceSource(ex)} />
      {ex.explanation && <Md text={ex.explanation} />}
      <div class="small muted">Lis-la ligne par ligne, ferme-la, puis réécris le programme sans la regarder.</div>
    </details>
  );
}

function ExpectedOutput({ ex }) {
  const [out, setOut] = useState(null);
  useEffect(() => {
    let live = true;
    if (ex.mode === 'predict') return undefined;
    const t0 = ex.tests?.[0];
    if (t0?.match) { setOut({ text: t0.matchLabel || '', stdin: t0.stdin }); return undefined; }
    expectedOutputs({ ...ex, tests: [ex.tests?.[0] || {}] }, (src, o) => runProgram(src, o)).then((r) => { if (live) setOut({ text: r[0].stdout, stdin: ex.tests?.[0]?.stdin }); }).catch(() => {});
    return () => { live = false; };
  }, [ex.id]);
  if (!out) return null;
  return (
    <details class="fold">
      <summary>🎯 Exemple de sortie attendue</summary>
      {out.stdin && <div class="small muted">Avec l'entrée : <code class="inline-code">{out.stdin.trim()}</code></div>}
      <pre class="console" style={{ minHeight: 0 }}>{normalizeOutput(out.text)}</pre>
      {ex.tests?.length > 1 && <div class="small faint">{ex.tests.length} tests au total, dont {ex.tests.filter((x) => x.hidden).length} cachés avec d'autres entrées.</div>}
    </details>
  );
}

// ---------- mode A : complète le code ----------
function CompleteMode({ ex, draft, setDraft, onSubmit, busy }) {
  const values = draft?.blanks || ex.blanks.map(() => '');
  const segs = ex.template.split('⟦⟧');
  const lines = [];
  // reconstruire ligne par ligne avec les champs
  let k = 0;
  const parts = [];
  segs.forEach((s, i) => {
    parts.push({ text: s });
    if (i < segs.length - 1) parts.push({ blank: k++ });
  });
  let cur = [];
  for (const p of parts) {
    if (p.blank !== undefined) { cur.push(p); continue; }
    const ls = p.text.split('\n');
    ls.forEach((l, j) => {
      if (j > 0) { lines.push(cur); cur = []; }
      if (l) cur.push({ text: l });
    });
  }
  lines.push(cur);
  const set = (i, v) => { const nv = [...values]; nv[i] = v; setDraft({ blanks: nv }); };
  return (
    <div class="stack">
      <pre class="code" aria-label="Code à compléter">
        {lines.map((ln, i) => (
          <div class="ln" key={i}>
            <span class="num">{i + 1}</span>
            <span class="src">
              {ln.map((p) => (p.blank !== undefined
                ? <input class="blank" aria-label={`Trou ${p.blank + 1}`} value={values[p.blank]} size={Math.max(ex.blanks[p.blank].width || 4, (values[p.blank] || '').length + 1)} onInput={(e) => set(p.blank, e.currentTarget.value)} autocapitalize="off" autocomplete="off" spellcheck={false} />
                : highlightLine(p.text)))}
              {'​'}
            </span>
          </div>
        ))}
      </pre>
      <div class="row"><button class="btn success" onClick={() => onSubmit({ blanks: values })} disabled={busy || values.some((v) => !v.trim())}>{busy ? '⏳ Exécution…' : '✔ Vérifier en exécutant'}</button></div>
    </div>
  );
}

// ---------- mode E : remets les lignes en ordre ----------
function OrderMode({ ex, draft, setDraft, onSubmit, busy }) {
  const initial = useMemo(() => shuffledOrder(ex.lines.length, ex.id.length * 31 + 7), [ex.id]);
  const order = draft?.order || initial;
  const [sel, setSel] = useState(null);
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const o = [...order];
    [o[i], o[j]] = [o[j], o[i]];
    setDraft({ order: o });
  };
  const tap = (i) => {
    if (sel === null) { setSel(i); return; }
    if (sel !== i) { const o = [...order]; [o[sel], o[i]] = [o[i], o[sel]]; setDraft({ order: o }); }
    setSel(null);
  };
  return (
    <div class="stack">
      <div class="small muted">Touche une ligne puis une autre pour les échanger, ou utilise les flèches.</div>
      {ex.prefix && <CodeView code={ex.prefix} numbers={false} />}
      <div role="list">
        {order.map((k, i) => (
          <div role="listitem" class={'order-line' + (sel === i ? ' sel' : '')} key={k} onClick={() => tap(i)}>
            <span class="faint">{i + 1}.</span>
            <span class="src">{highlightLine(ex.lines[k])}</span>
            <span class="mv" onClick={(e) => e.stopPropagation()}>
              <button aria-label="Monter" onClick={() => move(i, -1)}>▲</button>
              <button aria-label="Descendre" onClick={() => move(i, 1)}>▼</button>
            </span>
          </div>
        ))}
      </div>
      {ex.suffix && <CodeView code={ex.suffix} numbers={false} />}
      <div class="row"><button class="btn success" onClick={() => onSubmit({ order })} disabled={busy}>{busy ? '⏳ Exécution…' : '✔ Compiler et tester cet ordre'}</button></div>
    </div>
  );
}

// ---------- mode C : prédiction ----------
function PredictMode({ ex, draft, setDraft, onSubmit, busy, res }) {
  const pred = draft?.prediction ?? '';
  return (
    <div class="stack">
      <CodeView code={ex.code} />
      {ex.choices ? (
        <div role="radiogroup" aria-label="Choisis la sortie">
          {ex.choices.map((c, i) => {
            const chosen = draft?.choice === i;
            const cls = res && chosen ? (res.passed ? ' right' : ' wrong') : chosen ? ' right' : '';
            return <button class={'quiz-choice' + (res ? cls : chosen ? ' sel' : '')} style={chosen && !res ? { borderColor: 'var(--cyan)' } : {}} role="radio" aria-checked={chosen} onClick={() => setDraft({ choice: i })} key={i}><pre>{c}</pre></button>;
          })}
          <button class="btn success" onClick={() => onSubmit({ choice: draft?.choice })} disabled={busy || typeof draft?.choice !== 'number'}>{busy ? '⏳' : '🔮 Valider ma prédiction'}</button>
        </div>
      ) : (
        <div class="stack">
          <label class="field">Ta prédiction (sortie exacte)
            <textarea rows={4} value={pred} onInput={(e) => setDraft({ prediction: e.currentTarget.value })} placeholder="Écris ici ce que la console va afficher" />
          </label>
          <button class="btn success" onClick={() => onSubmit({ prediction: pred })} disabled={busy || !pred.trim()}>{busy ? '⏳' : '🔮 Valider puis exécuter'}</button>
        </div>
      )}
      {res && (
        <div class="stack">
          <div class="small muted">Exécution réelle du programme :</div>
          <ConsoleView result={res.run} />
        </div>
      )}
    </div>
  );
}

/**
 * Exercice complet avec énoncé, mode, indices, correction par tests et tuteur.
 * @param {{ex:any, onPassed?:(info:any)=>void, onFail?:(res:any)=>void, compact?:boolean, noReward?:boolean}} p
 */
export function Exercise({ ex, onPassed, onFail, compact = false, noReward = false, intro }) {
  const store = useStore();
  const rec = store.exercise(ex.id);
  const [draft, setDraftState] = useState(rec?.draft ?? null);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(rec?.attempts || 0);
  const [shake, setShake] = useState(false);
  const started = useRef(Date.now());
  const mode = MODE_LABELS[ex.mode];

  useEffect(() => { setDraftState(store.exercise(ex.id)?.draft ?? null); setRes(null); started.current = Date.now(); }, [ex.id]);
  const setDraft = (d) => { setDraftState(d); store.saveDraft(ex.id, d); };

  const submit = async (sub) => {
    setBusy(true);
    let r;
    try {
      r = await gradeExercise(ex, sub, (src, o) => runProgram(src, o));
    } catch (e) {
      setBusy(false);
      setRes({ passed: false, stage: 'compile', diagnostics: [{ severity: 'error', message: e.message, line: 0 }], tests: [] });
      return;
    }
    setBusy(false);
    setRes(r);
    setAttempts((a) => a + 1);
    const a = analyze(r);
    if (!noReward) store.recordAttempt(ex, r, { codes: a.codes, topic: a.topic, seconds: Math.round((Date.now() - started.current) / 1000) });
    store.recordRun({ compileError: r.stage === 'compile' });
    if (r.passed) onPassed?.({ result: r, attempts: attempts + 1 });
    else { setShake(true); setTimeout(() => setShake(false), 500); onFail?.(r); }
  };

  const codeInitial = draft?.code ?? (ex.mode === 'bug' ? ex.starter : (ex.starter ?? '#include <stdio.h>\n\nint main(void)\n{\n    \n    return 0;\n}\n'));

  return (
    <div class="stack">
      {!compact && <div class="row"><span class="badge violet">{mode.icon} Mode {mode.letter} — {mode.name}</span>{ex.kind === 'challenge' && <span class="badge amber">Défi</span>}</div>}
      {intro}
      <Md text={ex.prompt} />
      {ex.mode !== 'predict' && <ExpectedOutput ex={ex} />}
      {ex.mode === 'complete' && <CompleteMode ex={ex} draft={draft} setDraft={setDraft} onSubmit={submit} busy={busy} />}
      {ex.mode === 'order' && <OrderMode ex={ex} draft={draft} setDraft={setDraft} onSubmit={submit} busy={busy} />}
      {ex.mode === 'predict' && <PredictMode ex={ex} draft={draft} setDraft={setDraft} onSubmit={submit} busy={busy} res={res} />}
      {(ex.mode === 'write' || ex.mode === 'bug') && (
        <Lab
          key={ex.id}
          initial={codeInitial}
          reset={ex.mode === 'bug' ? ex.starter : (ex.starter ?? codeInitial)}
          stdin={ex.tests?.[0]?.stdin || ''}
          dataFiles={ex.tests?.[0]?.files}
          onChange={(c) => setDraft({ code: c })}
          onSubmit={(code) => submit({ code })}
          submitting={busy}
        />
      )}
      {res && <div class={shake ? 'shake' : ''}><TutorPanel res={res} /></div>}
      {res && ex.mode !== 'predict' && <TestResults res={res} />}
      {res?.passed && <div class="card glow pop center"><h3 style={{ margin: 0 }}>🎉 Réussi !</h3><div class="muted small">{attempts <= 1 ? 'Du premier coup, bravo.' : `Réussi en ${attempts} essais : la persévérance paie.`}</div></div>}
      {ex.hints?.length > 0 && !res?.passed && <HintBox ex={ex} />}
      {!res?.passed && (ex.solution || ex.mode === 'complete' || ex.mode === 'order') && ex.mode !== 'predict' && <SolutionReveal ex={ex} attempts={attempts} />}
    </div>
  );
}
