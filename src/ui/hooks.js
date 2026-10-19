// Liaison entre le store du jeu et Preact, routeur par hash (#/chemin).
import { createContext } from 'preact';
import { useContext, useEffect, useState, useRef, useCallback } from 'preact/hooks';

export const StoreContext = createContext(null);

export function useStore() {
  const store = useContext(StoreContext);
  const [, force] = useState(0);
  useEffect(() => store.subscribe(() => force((n) => n + 1)), [store]);
  return store;
}

function currentPath() {
  const h = location.hash.replace(/^#/, '');
  return h || '/';
}

export function useRoute() {
  const [path, setPath] = useState(currentPath());
  useEffect(() => {
    const on = () => setPath(currentPath());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return { path, parts: path.split('/').filter(Boolean) };
}

export function navigate(path, replace = false) {
  const url = '#' + path;
  if (replace) history.replaceState(null, '', url);
  else location.hash = path;
  if (replace) dispatchEvent(new HashChangeEvent('hashchange'));
  window.scrollTo?.(0, 0);
}

/** Chronomètre le temps passé sur un écran (pour les statistiques). */
export function useTimeTracker(store, lessonId) {
  const start = useRef(Date.now());
  useEffect(() => {
    start.current = Date.now();
    const flush = () => {
      const s = Math.round((Date.now() - start.current) / 1000);
      start.current = Date.now();
      store.addTime(lessonId, s);
    };
    const vis = () => { if (document.hidden) flush(); else start.current = Date.now(); };
    document.addEventListener('visibilitychange', vis);
    return () => { document.removeEventListener('visibilitychange', vis); flush(); };
  }, [lessonId]);
}

export function useOnline() {
  const [on, setOn] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true), b = () => setOn(false);
    addEventListener('online', a); addEventListener('offline', b);
    return () => { removeEventListener('online', a); removeEventListener('offline', b); };
  }, []);
  return on;
}

export function useInterval(fn, ms) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    if (ms == null) return undefined;
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

export function useAsync() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn) => {
    setBusy(true);
    try { return await fn(); } finally { setBusy(false); }
  }, []);
  return [busy, run];
}
