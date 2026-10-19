// Exécute du C dans un Web Worker avec délai maximal ; le worker est recréé s'il ne répond plus.
import EngineWorker from '../engine/worker.js?worker';
import { runC } from '../engine/index.js';

let worker = null;
let seq = 0;
const pending = new Map();
const HARD_TIMEOUT = 9000;

function spawn() {
  try {
    worker = new EngineWorker();
    worker.onmessage = (e) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      clearTimeout(p.timer);
      pending.delete(e.data.id);
      p.resolve(e.data.result);
    };
    worker.onerror = () => {
      // le worker n'a pas pu démarrer : on exécute sur le fil principal (avec limite de temps)
      worker = null;
      for (const [id, p] of pending) {
        clearTimeout(p.timer);
        pending.delete(id);
        p.resolve(runC(p.source, { timeoutMs: 4000, ...p.opts }));
      }
    };
  } catch {
    worker = null;
  }
}

/** @returns {Promise<any>} résultat de runC */
export function runProgram(source, opts = {}) {
  if (!worker) spawn();
  if (!worker) return Promise.resolve(runC(source, { timeoutMs: 4000, ...opts }));
  const id = ++seq;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      worker.terminate();
      worker = null;
      resolve({
        compiled: true, diagnostics: [], stdout: '', transcript: [], runtimeWarnings: [], leaks: [], files: {}, exitCode: 137,
        runtimeError: { code: 'timeout', message: 'Le programme a été arrêté : il ne répondait plus (boucle infinie ?).', line: 0 },
      });
    }, HARD_TIMEOUT);
    pending.set(id, { resolve, timer, source, opts });
    worker.postMessage({ id, source, opts: { timeoutMs: 5000, ...opts } });
  });
}
