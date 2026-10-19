// Visualisation pas à pas (ligne courante, boîtes mémoire, adresses, console), particules, anneaux de progression.
import { h } from 'preact';
import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { CodeView } from './text.jsx';
import { runProgram } from '../engine-client.js';

export function TraceViewer({ code, stdin = '', files, note }) {
  const [res, setRes] = useState(null);
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    let live = true;
    runProgram(code, { stdin, dataFiles: files || {}, trace: true, traceLimit: 300 }).then((r) => {
      if (!live) return;
      // fusionne les étapes identiques consécutives
      const steps = [];
      for (const s of r.trace || []) {
        const prev = steps[steps.length - 1];
        if (prev && prev.line === s.line && JSON.stringify(prev.vars) === JSON.stringify(s.vars) && prev.out === s.out) continue;
        steps.push(s);
      }
      steps.push({ line: null, vars: steps.length ? steps[steps.length - 1].vars : [], out: new TextEncoder().encode(r.stdout).length, end: true, stack: [] });
      setRes({ ...r, steps });
      setI(0);
    });
    return () => { live = false; };
  }, [code, stdin]);
  useEffect(() => {
    if (!play || !res) return undefined;
    if (i >= res.steps.length - 1) { setPlay(false); return undefined; }
    const id = setTimeout(() => setI(i + 1), 900);
    return () => clearTimeout(id);
  }, [play, i, res]);

  const outBytes = useMemo(() => (res ? new TextEncoder().encode(res.stdout) : new Uint8Array()), [res]);
  if (!res) return <div class="console"><span class="sys pulse">Préparation de la visualisation…</span></div>;
  const s = res.steps[i];
  const prev = res.steps[i - 1];
  const out = new TextDecoder().decode(outBytes.slice(0, s.out));
  const changed = new Set();
  if (prev) for (const v of s.vars) { const p = prev.vars.find((x) => x.name === v.name && x.addr === v.addr); if (!p || p.text !== v.text) changed.add(v.name); }
  return (
    <div class="stack">
      {note && <div class="small muted">{note}</div>}
      <div class="split lab">
        <CodeView code={code} highlight={s.line ? [s.line] : []} label="Programme visualisé" />
        <div class="stack">
          <div class="small faint">{s.end ? '✔ Programme terminé' : <>Étape {i + 1}/{res.steps.length - 1} — ligne <b>{s.line}</b>{s.stack?.length > 1 ? <> — pile d'appels : <span class="mono">{s.stack.join(' → ')}</span></> : ''}</>}</div>
          <div>
            <div class="small muted" style={{ marginBottom: '4px' }}>🧠 Mémoire {s.stack?.length ? `(variables de ${s.stack[s.stack.length - 1]})` : ''}</div>
            {s.vars.length === 0 ? <div class="small faint">Aucune variable dans cette fonction.</div> : (
              <div class="mem">
                {s.vars.map((v) => (
                  <div class={'box' + (changed.has(v.name) ? ' changed' : '')} key={v.name + v.addr}>
                    <div class="nm">{v.name}</div>
                    <div class="ty">{v.type}</div>
                    {v.items && v.items.length > 1 ? (
                      <>
                        {v.text.startsWith('"') && <div class="val">{v.text}</div>}
                        <div class="cells">{v.items.map((it, k) => <span key={k}><i>[{k}]</i>{it}</span>)}</div>
                      </>
                    ) : <div class={'val' + (v.uninit ? ' unk' : '')}>{v.uninit ? '? (non initialisée)' : v.text}</div>}
                    {v.target !== undefined && v.target !== '' && <div class="arrow">→ pointe vers {v.target}</div>}
                    <div class="addr">adresse 0x{v.addr.toString(16)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div class="small muted" style={{ marginBottom: '4px' }}>🖥️ Console</div>
            <div class="console" style={{ minHeight: '60px' }}>{out || <span class="sys">(vide)</span>}</div>
          </div>
        </div>
      </div>
      <div class="row">
        <button class="btn small" onClick={() => setI(0)} aria-label="Début">⏮</button>
        <button class="btn small" onClick={() => setI(Math.max(0, i - 1))} aria-label="Étape précédente">◀</button>
        <button class="btn small primary" onClick={() => { if (i >= res.steps.length - 1) setI(0); setPlay(!play); }}>{play ? '⏸ Pause' : '▶ Lecture'}</button>
        <button class="btn small" onClick={() => setI(Math.min(res.steps.length - 1, i + 1))} aria-label="Étape suivante">▶</button>
        <input type="range" min="0" max={res.steps.length - 1} value={i} onInput={(e) => setI(+e.currentTarget.value)} aria-label="Avancement" style={{ flex: 1, minWidth: '120px' }} />
      </div>
    </div>
  );
}

export function Particles({ density = 40, color = '#22d3ee' }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced') return undefined;
    const ctx = cv.getContext('2d');
    let w, hh, raf;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const resize = () => { w = cv.clientWidth; hh = cv.clientHeight; cv.width = w * dpr; cv.height = hh * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();
    const pts = Array.from({ length: density }, () => ({ x: Math.random() * w, y: Math.random() * hh, r: Math.random() * 1.8 + 0.4, vx: (Math.random() - 0.5) * 0.25, vy: -Math.random() * 0.35 - 0.05, c: Math.random() < 0.5 ? color : '#a78bfa', a: Math.random() * 0.6 + 0.2 }));
    const tick = () => {
      ctx.clearRect(0, 0, w, hh);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -5) { p.y = hh + 5; p.x = Math.random() * w; }
        if (p.x < -5) p.x = w + 5; if (p.x > w + 5) p.x = -5;
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} aria-hidden="true" />;
}

export function Ring({ value, size = 76, color = 'var(--cyan)', label }) {
  const r = 30, c = 2 * Math.PI * r;
  return (
    <svg class="ring" width={size} height={size} viewBox="0 0 76 76" role="img" aria-label={label || `${value} %`}>
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--panel2)" stroke-width="8" />
      <circle cx="38" cy="38" r={r} fill="none" stroke={color} stroke-width="8" stroke-linecap="round" stroke-dasharray={c} stroke-dashoffset={c * (1 - Math.max(0, Math.min(100, value)) / 100)} transform="rotate(-90 38 38)" style={{ transition: 'stroke-dashoffset .8s' }} />
      <text x="38" y="43" text-anchor="middle" font-size="15" font-weight="700" fill="var(--text)">{Math.round(value)}%</text>
    </svg>
  );
}

export function Bar({ value, cls = '' }) {
  return <div class={'bar ' + cls} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
