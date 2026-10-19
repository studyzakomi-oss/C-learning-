// Test de placement : recommande un point de départ, sans jamais sauter l'essentiel de la syntaxe C.
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useStore, navigate } from '../hooks.js';
import { PLACEMENT, evaluatePlacement, TOPIC_LABELS } from '../../content/placement.js';
import { WORLDS } from '../../content/index.js';
import { Speech } from '../components/characters.jsx';
import { Bar } from '../components/visual.jsx';
import { Inline } from '../components/text.jsx';

export function Placement() {
  const store = useStore();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  const choose = (k) => {
    const a = [...answers];
    a[i] = k;
    setAnswers(a);
    if (i + 1 < PLACEMENT.length) setI(i + 1);
    else setResult(evaluatePlacement(a));
  };
  const accept = (recommended) => {
    store.completePlacement({ score: result.score, perTopic: result.perTopic, recommended: Math.min(recommended, WORLDS.length - 1) });
    navigate(recommended > 0 ? `/world/${WORLDS[Math.min(recommended, WORLDS.length - 1)].id}` : '/map', true);
  };

  if (result) {
    const rec = Math.min(result.recommended, WORLDS.length - 1);
    return (
      <div class="stack" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div class="card glow">
          <h1>Résultat : {result.score} %</h1>
          <div class="stack">
            {Object.entries(result.perTopic).map(([k, v]) => (
              <div key={k}><div class="row between small"><span>{TOPIC_LABELS[k]}</span><span>{Math.round(v * 100)} %</span></div><Bar value={v * 100} cls={v >= 0.66 ? 'green' : v < 0.34 ? 'red' : ''} /></div>
            ))}
          </div>
        </div>
        <Speech who="syntaxe">
          {rec === 0
            ? <>Je te conseille de commencer au <b>Monde 1 — Les Fondations</b>. Chaque notion y est expliquée pas à pas.</>
            : <>Tu as de bonnes bases ! Je te propose de débloquer jusqu'au <b>Monde {rec + 1} — {WORLDS[rec].title}</b>. Attention : même si tu connais la logique, la <b>syntaxe du C</b> a ses pièges (<code class="inline-code">;</code>, <code class="inline-code">&amp;</code> dans scanf, division entière). Les leçons des mondes précédents restent ouvertes pour réviser.</>}
        </Speech>
        {rec > 0 && <button class="btn primary block" onClick={() => accept(rec)}>Débloquer jusqu'au Monde {rec + 1}</button>}
        <button class={'btn block' + (rec === 0 ? ' primary' : '')} onClick={() => accept(0)}>Commencer au Monde 1</button>
      </div>
    );
  }
  const q = PLACEMENT[i];
  return (
    <div class="stack" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div class="row between"><h2 style={{ margin: 0 }}>🧭 Test de placement</h2><span class="badge">{i + 1} / {PLACEMENT.length}</span></div>
      <Bar value={(i / PLACEMENT.length) * 100} />
      <div class="card stack fade-in" key={i}>
        <span class="badge cyan">{TOPIC_LABELS[q.topic]}</span>
        <div class="prose"><p><Inline text={q.q} /></p></div>
        {q.choices.map((c, k) => <button class="quiz-choice" onClick={() => choose(k)} key={k}><Inline text={c} /></button>)}
        <div class="row between">
          <button class="btn small ghost" onClick={() => i > 0 && setI(i - 1)} disabled={i === 0}>← Précédente</button>
          <button class="btn small ghost" onClick={() => choose(-1)}>Je ne sais pas</button>
        </div>
      </div>
      <button class="btn ghost small" onClick={() => navigate('/', true)}>Passer le test et commencer au Monde 1</button>
    </div>
  );
}
