// Point d'entrée du moteur C : compilation + exécution isolée et limitée.
import { preprocess } from './preprocessor.js';
import { parse } from './parser.js';
import { compileProgram } from './compiler.js';
import { Machine, decoder } from './runtime.js';
import { CError, RuntimeError, ExitSignal } from './errors.js';
import { commitFiles } from './builtins.js';

function makeDiag() {
  const list = [];
  const seen = new Set();
  const add = (d) => {
    const key = `${d.severity}|${d.file}|${d.line}|${d.code}|${d.message}`;
    if (seen.has(key)) return;
    seen.add(key);
    list.push(d);
  };
  return {
    list,
    add,
    addError(e, file) {
      add({ severity: 'error', line: e.line, col: e.col, file: e.file || file, message: e.message, gcc: e.gcc, code: e.code, data: e.data });
    },
    warn(e) {
      if (e.file && e.file.startsWith('<')) return;
      add({ severity: 'warning', line: e.line, col: e.col, file: e.file, message: e.message, gcc: e.gcc, code: e.code });
    },
    hint(h) {
      if (h.code === 'define-semicolon') {
        add({ severity: 'info', line: h.line, col: 1, file: 'main.c', message: `#define ${h.name} se termine par « ; » : ce point-virgule sera recopié partout où ${h.name} est utilisé. Une directive #define ne prend pas de ;`, gcc: '', code: 'define-semicolon' });
      }
    },
  };
}

function normalizeFiles(input) {
  if (typeof input === 'string') return { 'main.c': input };
  return { ...input };
}

/**
 * Compile (et exécute si opts.run !== false) un programme C.
 * @param {string|Record<string,string>} source code de main.c ou fichiers {nom: contenu}
 * @param {{stdin?:string, dataFiles?:Record<string,string>, maxSteps?:number, timeoutMs?:number, run?:boolean}} opts
 */
export function runC(source, opts = {}) {
  const t0 = Date.now();
  const files = normalizeFiles(source);
  const diag = makeDiag();
  const M = new Machine({ stdin: opts.stdin || '', files: opts.dataFiles || {}, maxSteps: opts.maxSteps, timeoutMs: opts.timeoutMs, maxOutput: opts.maxOutput });
  M.startTime = Date.now();
  const result = {
    compiled: false,
    diagnostics: diag.list,
    stdout: '',
    stderr: '',
    transcript: [],
    exitCode: null,
    runtimeError: null,
    runtimeWarnings: [],
    files: {},
    leaks: [],
    steps: 0,
    timeMs: 0,
  };
  let program = null;
  try {
    const units = [];
    const cFiles = Object.keys(files).filter((f) => f.endsWith('.c'));
    if (!cFiles.length) throw new CError('aucun fichier .c à compiler', { code: 'no-source' });
    for (const f of cFiles) {
      try {
        const { tokens } = preprocess(files, f, diag);
        units.push({ file: f, ast: parse(tokens) });
      } catch (e) {
        if (e instanceof CError) diag.addError(e, f);
        else throw e;
      }
    }
    if (!diag.list.some((d) => d.severity === 'error')) {
      program = compileProgram(units, M, diag);
    }
  } catch (e) {
    if (e instanceof CError) diag.addError(e, 'main.c');
    else {
      diag.add({ severity: 'error', line: 0, col: 0, file: 'main.c', message: `erreur interne du compilateur : ${e.message}`, gcc: '', code: 'internal' });
      if (opts.debug) throw e;
    }
  }
  diag.list.sort((a, b) => (a.file === b.file ? (a.line - b.line) || (a.col - b.col) : a.file < b.file ? -1 : 1));
  const hasError = diag.list.some((d) => d.severity === 'error');
  result.compiled = !hasError && !!program;
  if (!result.compiled || opts.run === false) {
    result.timeMs = Date.now() - t0;
    return result;
  }
  if (opts.trace) {
    result.trace = [];
    const max = opts.traceLimit || 400;
    M.tracer = () => {
      if (result.trace.length >= max) return;
      const fr = M.frames[M.frames.length - 1];
      if (!fr) return;
      result.trace.push({ line: M.line, fn: fr.fn.name, depth: M.frames.length, stack: M.frames.map((f) => f.fn.name), vars: snapshot(M, fr), out: M.out.length });
    };
  }
  try {
    result.exitCode = program.run();
  } catch (e) {
    if (e instanceof ExitSignal) result.exitCode = e.status;
    else if (e instanceof RuntimeError) {
      result.runtimeError = { message: e.message, code: e.code, line: e.line || M.line, signal: e.signal };
      result.exitCode = e.signal === 'SIGFPE' ? 136 : e.signal === 'SIGABRT' ? 134 : 139;
    } else if (e instanceof RangeError) {
      result.runtimeError = { message: 'Débordement de pile : récursion trop profonde (cas d\'arrêt manquant ?).', code: 'stack-overflow', line: M.line, signal: 'SIGSEGV' };
      result.exitCode = 139;
    } else {
      result.runtimeError = { message: `erreur interne du moteur : ${e && e.message}`, code: 'internal', line: M.line };
      if (opts.debug) throw e;
    }
  }
  try { commitFiles(M); } catch { /* ignore */ }
  result.stdout = M.stdoutText();
  result.transcript = M.transcriptText();
  result.stderr = result.transcript.filter((s) => s.kind === 'err').map((s) => s.text).join('');
  result.runtimeWarnings = M.warnings;
  for (const [name, data] of M.files) result.files[name] = decoder.decode(data);
  if (!result.runtimeError) {
    for (const [, b] of M.heap) result.leaks.push({ size: b.size, line: b.line });
  }
  result.steps = M.steps;
  result.timeMs = Date.now() - t0;
  return result;
}

function readValue(M, t, a, depth = 0) {
  const sh = M.sh[a];
  const ok = (n) => { for (let k = 0; k < n; k++) { const s = M.sh[a + k]; if (s !== 1 && s !== 5) return false; } return true; };
  if (t.k === 'int' || t.k === 'enum') {
    if (!ok(t.size || 4)) return { text: '?', uninit: true };
    const dv = M.dv;
    let v;
    const size = t.size || 4;
    if (size === 1) v = t.signed === false ? dv.getUint8(a) : dv.getInt8(a);
    else if (size === 2) v = t.signed ? dv.getInt16(a, true) : dv.getUint16(a, true);
    else if (size === 4) v = t.signed === false ? dv.getUint32(a, true) : dv.getInt32(a, true);
    else v = t.signed ? dv.getBigInt64(a, true) : dv.getBigUint64(a, true);
    if (t.name === 'char' || t.name === 'unsigned char') {
      const c = Number(v);
      const ch = c === 0 ? "'\\0'" : c === 10 ? "'\\n'" : c >= 32 && c < 127 ? `'${String.fromCharCode(c)}'` : String(c);
      return { text: ch, num: c };
    }
    if (t.name === '_Bool') return { text: v ? 'true (1)' : 'false (0)' };
    return { text: String(v) };
  }
  if (t.k === 'float') {
    if (!ok(t.size)) return { text: '?', uninit: true };
    const v = t.size === 4 ? M.dv.getFloat32(a, true) : M.dv.getFloat64(a, true);
    return { text: Number.isInteger(v) ? v.toFixed(1) : String(t.size === 4 ? Number(v.toPrecision(7)) : v) };
  }
  if (t.k === 'ptr') {
    if (sh === 4 || !ok(8)) return { text: '?', uninit: true };
    const v = M.dv.getUint32(a, true) + M.dv.getUint32(a + 4, true) * 4294967296;
    if (v === 0) return { text: 'NULL', ptr: 0 };
    const d = M.describe(v);
    let target = d.name ? d.name.replace(/[«»]/g, '').trim() : '';
    if (d.start !== undefined && v !== d.start && d.type && d.type.k === 'array') target += `[${Math.floor((v - d.start) / d.type.of.size)}]`;
    else if (d.start !== undefined && v !== d.start) target += ` + ${v - d.start}`;
    if (v >= 0x1000 && v < 0x8000) target = 'fonction';
    return { text: '0x' + v.toString(16), ptr: v, target };
  }
  if (t.k === 'array') {
    if (depth > 1) return { text: '[…]' };
    const n = t.len ?? 0;
    if (t.of.k === 'int' && t.of.size === 1 && ok(1)) {
      const bytes = [];
      for (let k = 0; k < n && k < 64; k++) { if (!ok.call(null, 1)) break; const b = M.u8[a + k]; if (b === 0) break; bytes.push(b); }
      const items = [];
      for (let k = 0; k < Math.min(n, 16); k++) items.push(readValue(M, t.of, a + k * t.of.size, depth + 1).text);
      return { text: JSON.stringify(decoder.decode(new Uint8Array(bytes))), items, array: true };
    }
    const items = [];
    for (let k = 0; k < Math.min(n, 16); k++) items.push(readValue(M, t.of, a + k * t.of.size, depth + 1).text);
    return { text: `{${items.join(', ')}${n > 16 ? ', …' : ''}}`, items, array: true };
  }
  if (t.k === 'struct') {
    if (depth > 1 || !t.fields) return { text: '{…}' };
    const fields = t.fields.map((f) => ({ name: f.name, ...readValue(M, f.type, a + f.offset, depth + 1) }));
    return { text: `{${fields.map((f) => `.${f.name}=${f.text}`).join(', ')}}`, fields };
  }
  return { text: '' };
}

function typeLabel(t) {
  if (!t) return '';
  if (t.k === 'ptr') return typeLabel(t.to) + ' *';
  if (t.k === 'array') return `${typeLabel(t.of)}[${t.len ?? ''}]`;
  if (t.k === 'struct') return `struct ${t.tag || ''}`.trim();
  return (t.const ? 'const ' : '') + (t.name || t.k);
}

function snapshot(M, fr) {
  const vars = [];
  for (const l of fr.fn.locals) {
    if (l.name.startsWith('<')) continue;
    const a = fr.fp + l.offset;
    if (l.vlaOf) {
      const base = Number(M.dv.getBigUint64(a, true));
      const bytes = Number(M.dv.getBigUint64(a + 8, true));
      if (!base) { vars.push({ name: l.name, type: typeLabel(l.vlaOf), text: '?', uninit: true, addr: a }); continue; }
      const t = { ...l.vlaOf, len: Math.floor(bytes / l.vlaOf.of.size) };
      vars.push({ name: l.name, type: typeLabel(t), addr: base, ...readValue(M, t, base) });
      continue;
    }
    vars.push({ name: l.name, type: typeLabel(l.type), addr: a, ...readValue(M, l.type, a) });
  }
  return vars;
}

/** Compile seulement (vérification rapide pendant la frappe). */
export function checkC(source) {
  return runC(source, { run: false }).diagnostics;
}

export { CError, RuntimeError };
