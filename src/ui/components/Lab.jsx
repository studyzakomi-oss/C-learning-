// Laboratoire : éditeur + barre d'outils + entrée standard + console avec erreurs expliquées.
import { h } from 'preact';
import { useState, useRef } from 'preact/hooks';
import { Editor } from './Editor.jsx';
import { runProgram } from '../engine-client.js';
import { explainDiagnostic, explainRuntime } from '../../game/tutor.js';
import { useStore } from '../hooks.js';

export function Diagnostics({ diagnostics = [], onLine, max = 6 }) {
  const [open, setOpen] = useState({});
  const list = diagnostics.filter((d) => !d.file || !d.file.startsWith('<')).slice(0, max);
  if (!list.length) return null;
  return (
    <div role="list" aria-label="Messages du compilateur">
      {list.map((d, i) => {
        const ex = explainDiagnostic(d);
        const label = d.severity === 'error' ? 'Erreur' : d.severity === 'warning' ? 'Avertissement' : 'Conseil du Professeur';
        return (
          <div role="listitem" class={'diag ' + d.severity} key={i}>
            <div>
              <b>{d.severity === 'error' ? '⛔' : d.severity === 'warning' ? '⚠️' : '💡'} {label}</b>
              {d.line > 0 && <> — <button class="linkish" onClick={() => onLine?.(d.line)}>ligne {d.line}{d.col ? `, col. ${d.col}` : ''}</button></>}
              {d.file && d.file !== 'main.c' && <span class="faint"> ({d.file})</span>}
            </div>
            <div>{d.message}</div>
            {d.gcc && <span class="gcc">gcc : {d.gcc}</span>}
            {ex && (
              <div style={{ marginTop: '6px' }}>
                {!open[i] ? <button class="linkish" onClick={() => setOpen({ ...open, [i]: 1 })}>🦉 Le Professeur explique…</button> : (
                  <div class="small">
                    <div><b>Question :</b> {ex.question}</div>
                    {open[i] > 1 && <div><b>Pourquoi :</b> {ex.why}</div>}
                    {open[i] > 2 && <div><b>Piste :</b> {ex.fix}</div>}
                    {open[i] > 2 && ex.python && <div class="faint">🐍 {ex.python}</div>}
                    {open[i] < 3 && <button class="linkish" onClick={() => setOpen({ ...open, [i]: open[i] + 1 })}>Encore un indice →</button>}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {diagnostics.length > max && <div class="faint small">… et {diagnostics.length - max} autre(s) message(s). Corrige d'abord le premier.</div>}
    </div>
  );
}

export function ConsoleView({ result, running, placeholder = 'La sortie de ton programme apparaîtra ici.' }) {
  if (running) return <div class="console" aria-live="polite"><span class="sys pulse">▶ Compilation et exécution…</span></div>;
  if (!result) return <div class="console"><span class="sys">{placeholder}</span></div>;
  const rt = result.runtimeError;
  const ex = rt ? explainRuntime(rt) : null;
  return (
    <div class="stack">
      <div class="console" aria-live="polite" aria-label="Console">
        {!result.compiled && <span class="err">✖ Le programme ne compile pas : corrige les erreurs ci-dessous.{'\n'}</span>}
        {result.transcript?.map((s, i) => <span key={i} class={s.kind === 'in' ? 'in' : s.kind === 'err' ? 'err' : ''}>{s.text}</span>)}
        {result.compiled && !rt && (
          <span class="sys">{(result.stdout && !result.stdout.endsWith('\n') ? '\n' : '') + `\n— programme terminé (code ${result.exitCode ?? 0}) en ${result.timeMs ?? '?'} ms`}</span>
        )}
        {rt && <span class="err">{(result.stdout && !result.stdout.endsWith('\n') ? '\n' : '') + `\n💥 Erreur d'exécution${rt.line ? ` (ligne ${rt.line})` : ''} : ${rt.message}`}</span>}
      </div>
      {ex && (
        <div class="diag error small">
          <b>🐞 Bug Hunter :</b> {ex.question}
          <details><summary class="linkish" style={{ color: 'var(--cyan)', cursor: 'pointer' }}>Explication</summary><div>{ex.why}</div><div><b>Piste :</b> {ex.fix}</div></details>
        </div>
      )}
      {result.runtimeWarnings?.map((w, i) => <div class="diag small" key={i}>⚠️ Exécution, ligne {w.line} : {w.message}</div>)}
      {result.leaks?.length > 0 && <div class="diag info small">🧠 Fuite mémoire : {result.leaks.length} bloc(s) alloué(s) avec malloc jamais libéré(s) ({result.leaks.reduce((s, l) => s + l.size, 0)} octets, ligne {result.leaks[0].line}). Pense à free().</div>}
      {result.files && Object.keys(result.files).length > 0 && (
        <details class="fold"><summary>📁 Fichiers après exécution ({Object.keys(result.files).length})</summary>
          {Object.entries(result.files).map(([n, c]) => <div key={n}><b class="mono">{n}</b><pre class="console" style={{ minHeight: 0 }}>{c || '(vide)'}</pre></div>)}
        </details>
      )}
    </div>
  );
}

/**
 * @param {{initial:string, onChange?:(s:string)=>void, onSubmit?:(code:string)=>void, submitting?:boolean, reset?:string,
 *   stdin?:string, dataFiles?:object, extraTools?:any, onRunResult?:(r:any)=>void, sandbox?:boolean}} p
 */
export function Lab({ initial, onChange, onSubmit, submitting, reset, stdin: stdinDefault = '', dataFiles, extraTools, onRunResult, sandbox = false, files, children }) {
  const store = useStore();
  const settings = store.state.settings;
  const [code, setCode] = useState(initial ?? '');
  const [stdin, setStdin] = useState(stdinDefault);
  const [showIn, setShowIn] = useState(!!stdinDefault || /scanf|getchar|fgets/.test(initial || ''));
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState('');
  const [dirty, setDirty] = useState(false);
  const ed = useRef(null);
  const fs = settings.editorFontSize;

  const change = (v) => { setCode(v); onChange?.(v); setDirty(true); if (/scanf|getchar|fgets/.test(v)) setShowIn(true); };
  const run = async () => {
    setRunning(true);
    const src = files ? { ...files, 'main.c': code } : code;
    const r = await runProgram(src, { stdin, dataFiles: dataFiles || {} });
    setRunning(false);
    setResult(r);
    setDirty(false);
    store.recordRun({ sandbox, compileError: !r.compiled });
    onRunResult?.(r);
  };
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 1600); };
  const marks = [];
  if (result && !dirty) {
    for (const d of result.diagnostics || []) if (d.line && (!d.file || d.file === 'main.c')) marks.push({ line: d.line, cls: d.severity === 'error' ? 'cm-errline' : 'cm-warnline' });
    if (result.runtimeError?.line) marks.push({ line: result.runtimeError.line, cls: 'cm-errline' });
  }

  return (
    <div class="stack">
      <div class="editor-wrap" style={{ border: 0 }}>
        <div class="editor-toolbar" role="toolbar" aria-label="Outils de l'éditeur">
          <button class="btn primary" onClick={run} disabled={running} title="Ctrl+Entrée">▶ Exécuter</button>
          {onSubmit && <button class="btn success" onClick={() => onSubmit(code, stdin)} disabled={submitting || running}>{submitting ? '⏳ Tests…' : '✔ Soumettre'}</button>}
          <button class="btn ghost" onClick={() => ed.current?.undo()} aria-label="Annuler">↶</button>
          <button class="btn ghost" onClick={() => ed.current?.redo()} aria-label="Rétablir">↷</button>
          <button class="btn ghost" onClick={async () => flash((await ed.current?.copy()) ? 'Copié !' : 'Copie impossible')} aria-label="Copier">⧉</button>
          <button class="btn ghost" onClick={async () => { if (!(await ed.current?.paste())) flash('Utilise l\'appui long pour coller'); }} aria-label="Coller">📋</button>
          <button class="btn ghost" onClick={() => store.setSettings({ editorFontSize: Math.max(11, fs - 1) })} aria-label="Réduire la police">A−</button>
          <button class="btn ghost" onClick={() => store.setSettings({ editorFontSize: Math.min(26, fs + 1) })} aria-label="Agrandir la police">A+</button>
          {reset !== undefined && <button class="btn ghost" onClick={() => { if (confirm('Réinitialiser l\'exercice ? Ton code sera remplacé.')) { ed.current?.setValue(reset); setResult(null); } }}>↺ Réinitialiser</button>}
          {extraTools}
          {msg && <span class="small muted">{msg}</span>}
        </div>
        <Editor value={code} onChange={change} fontSize={fs} marks={marks} onRun={run} editorRef={ed} />
      </div>
      <div>
        <button class="btn small ghost" onClick={() => setShowIn(!showIn)} aria-expanded={showIn}>⌨️ Entrée (stdin) {showIn ? '▾' : '▸'}</button>
        {showIn && <textarea rows={3} value={stdin} onInput={(e) => setStdin(e.currentTarget.value)} placeholder="Ce que l'utilisateur tape au clavier (une valeur par ligne ou séparées par des espaces)" aria-label="Entrée standard" style={{ marginTop: '6px' }} />}
      </div>
      <ConsoleView result={result} running={running} />
      {result && <Diagnostics diagnostics={result.diagnostics} onLine={(n) => ed.current?.gotoLine(n)} />}
      {children}
    </div>
  );
}
