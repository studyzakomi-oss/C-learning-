// Rendu du texte des leçons (mini-Markdown) et du code coloré en lecture seule.
import { h, Fragment } from 'preact';

const KW = new Set(['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'sizeof', 'typedef', 'struct', 'union', 'enum', 'const', 'static', 'extern', 'goto', 'volatile', 'register', 'auto', 'inline', 'restrict']);
const TYPES = new Set(['int', 'char', 'float', 'double', 'void', 'long', 'short', 'unsigned', 'signed', 'bool', '_Bool', 'size_t', 'FILE', 'NULL', 'true', 'false', 'EOF']);

/** Découpe une ligne de C en jetons colorés. */
export function highlightLine(line) {
  const out = [];
  const re = /(\/\/.*$|\/\*.*?\*\/|\/\*.*$|^\s*#\s*\w+(?:\s*<[^>]*>)?|"(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[fFuUlL]*\b|\b[A-Za-z_]\w*\b(?=\s*\()|\b[A-Za-z_]\w*\b)/g;
  let last = 0;
  let m;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const s = m[0];
    let cls = null;
    if (s.startsWith('//') || s.startsWith('/*')) cls = 'tok-com';
    else if (/^\s*#/.test(s)) cls = 'tok-pre';
    else if (s[0] === '"' || s[0] === "'") {
      // séquences d'échappement colorées
      const parts = s.split(/(\\.|%[-+ 0#]*\d*(?:\.\d+)?[hlLzj]*[diouxXcsfFeEgGp%])/);
      out.push(h('span', { class: 'tok-str' }, parts.map((p, i) => (i % 2 ? h('span', { class: 'tok-esc' }, p) : p))));
      last = m.index + s.length;
      continue;
    } else if (/^\d/.test(s)) cls = 'tok-num';
    else if (KW.has(s)) cls = 'tok-kw';
    else if (TYPES.has(s)) cls = 'tok-type';
    else if (/^[A-Za-z_]\w*$/.test(s) && /\s*\(/.test(line.slice(m.index + s.length, m.index + s.length + 3))) cls = 'tok-fn';
    out.push(cls ? h('span', { class: cls }, s) : s);
    last = m.index + s.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

export function CodeView({ code, highlight = [], errorLines = [], onLineClick, start = 1, numbers = true, label }) {
  const lines = String(code).split('\n');
  return (
    <pre class="code" aria-label={label || 'Code C'} tabIndex={0}>
      {lines.map((l, i) => {
        const n = i + start;
        const cls = 'ln' + (highlight.includes(n) ? ' hl' : '') + (errorLines.includes(n) ? ' err' : '');
        return (
          <div class={cls} key={i} onClick={onLineClick ? () => onLineClick(n) : undefined}>
            {numbers && <span class="num">{n}</span>}
            <span class="src">{highlightLine(l)}{'\u200b'}</span>
          </div>
        );
      })}
    </pre>
  );
}

function inline(text) {
  const parts = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const s = m[0];
    if (s[0] === '`') parts.push(<code>{s.slice(1, -1)}</code>);
    else parts.push(<strong>{s.slice(2, -2)}</strong>);
    last = m.index + s.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Mini-Markdown : paragraphes, listes « - », blocs ``` et `code`, **gras**. */
export function Md({ text, class: cls }) {
  if (!text) return null;
  const blocks = [];
  const lines = String(text).split('\n');
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.trim().startsWith('```')) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i++]);
      i++;
      blocks.push(<pre class="code"><div class="ln"><span class="src" style="padding-left:14px">{buf.join('\n')}</span></div></pre>);
      continue;
    }
    if (/^\s*[-•]\s+/.test(l)) {
      const items = [];
      while (i < lines.length && /^\s*[-•]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-•]\s+/, ''));
      blocks.push(<ul>{items.map((it) => <li>{inline(it)}</li>)}</ul>);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(l)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s+/, ''));
      blocks.push(<ol>{items.map((it) => <li>{inline(it)}</li>)}</ol>);
      continue;
    }
    if (!l.trim()) { i++; continue; }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^\s*[-•]\s+/.test(lines[i]) && !lines[i].trim().startsWith('```') && !/^\s*\d+\.\s+/.test(lines[i])) buf.push(lines[i++].trim());
    blocks.push(<p>{inline(buf.join(' '))}</p>);
  }
  return <div class={'prose ' + (cls || '')}>{blocks.map((b, k) => <Fragment key={k}>{b}</Fragment>)}</div>;
}

export function Inline({ text }) {
  return <>{inline(String(text ?? ''))}</>;
}
