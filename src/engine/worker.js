// Web Worker : le programme C de l'élève s'exécute ici, isolé de l'interface.
import { runC } from './index.js';

self.onmessage = (e) => {
  const { id, source, opts } = e.data;
  let result;
  try {
    result = runC(source, opts);
  } catch (err) {
    result = { compiled: false, diagnostics: [{ severity: 'error', line: 0, col: 0, message: `erreur interne : ${err.message}`, code: 'internal' }], stdout: '', transcript: [], runtimeWarnings: [], leaks: [], files: {} };
  }
  self.postMessage({ id, result });
};
