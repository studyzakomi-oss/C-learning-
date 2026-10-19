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

/** Compile seulement (vérification rapide pendant la frappe). */
export function checkC(source) {
  return runC(source, { run: false }).diagnostics;
}

export { CError, RuntimeError };
