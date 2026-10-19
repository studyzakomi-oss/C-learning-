// Quiz rapide : une question à la fois, explication après chaque réponse, possibilité de recommencer.
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { Inline } from './text.jsx';

const looksLikeCode = (c) => /[;(){}"#\\]|%[a-z.]|\b(int|char|double|printf|scanf|return)\b|^[\d\s.+\-*/%=<>!&|]+$/.test(c) && !/[éèàùçâêîôû]|\b(le|la|les|un|une|des|du|de|est|pour|avec|sans)\b/i.test(c);

export function Quiz({ questions, onDone, title = 'Quiz rapide' }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [good, setGood] = useState(0);
  const [done, setDone] = useState(false);
  const q = questions[i];
  if (done) {
    const pct = Math.round((good / questions.length) * 100);
    return (
      <div class="card center pop">
        <h3>{pct >= 60 ? '🎉' : '📚'} {good} / {questions.length} bonnes réponses ({pct} %)</h3>
        <p class="muted">{pct === 100 ? 'Parfait !' : pct >= 60 ? 'Validé ! Les questions manquées reviendront en révision.' : 'Il faut au moins 60 % pour valider. Relis le résumé et retente : chaque essai t\'apprend quelque chose.'}</p>
        <button class="btn" onClick={() => { setI(0); setPicked(null); setGood(0); setDone(false); }}>↺ Recommencer le quiz</button>
      </div>
    );
  }
  const answer = (k) => {
    if (picked !== null) return;
    setPicked(k);
    if (k === q.answer) setGood(good + 1);
  };
  const next = () => {
    if (i + 1 >= questions.length) {
      const g = good;
      setDone(true);
      onDone?.(g, questions.length);
    } else { setI(i + 1); setPicked(null); }
  };
  return (
    <div class="stack" aria-live="polite">
      <div class="row between"><b>{title}</b><span class="badge">{i + 1} / {questions.length}</span></div>
      <div class="prose"><p><Inline text={q.q} /></p></div>
      {q.code && <pre class="code"><div class="ln"><span class="src" style="padding-left:14px">{q.code}</span></div></pre>}
      <div role="radiogroup">
        {q.choices.map((c, k) => {
          let cls = '';
          if (picked !== null) { if (k === q.answer) cls = ' right'; else if (k === picked) cls = ' wrong'; }
          return <button class={'quiz-choice' + cls} role="radio" aria-checked={picked === k} onClick={() => answer(k)} key={k}><Inline text={c.includes('`') || !looksLikeCode(c) ? c : '`' + c + '`'} /></button>;
        })}
      </div>
      {picked !== null && (
        <div class={'diag ' + (picked === q.answer ? 'info' : 'error') + ' fade-in'}>
          <b>{picked === q.answer ? '✅ Exact !' : '❌ Pas tout à fait.'}</b> <Inline text={q.explain} />
        </div>
      )}
      {picked !== null && <button class="btn primary" onClick={next}>{i + 1 >= questions.length ? 'Voir le résultat' : 'Question suivante →'}</button>}
    </div>
  );
}
