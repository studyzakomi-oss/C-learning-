// Coquille de l'application : thème, navigation, notifications, routes.
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { StoreContext, useRoute, navigate, useOnline, useStore } from './hooks.js';
import { levelFromXp } from '../game/progression.js';
import { Splash } from './screens/Splash.jsx';
import { Onboarding } from './screens/Onboarding.jsx';
import { Placement } from './screens/Placement.jsx';
import { Home } from './screens/Home.jsx';
import { WorldMap, WorldView } from './screens/Map.jsx';
import { LessonScreen } from './screens/Lesson.jsx';
import { ExerciseScreen } from './screens/ExerciseScreen.jsx';
import { BossScreen } from './screens/Boss.jsx';
import { Profile } from './screens/Profile.jsx';
import { SkillTree } from './screens/Skills.jsx';
import { Stats } from './screens/Stats.jsx';
import { Review } from './screens/Review.jsx';
import { Settings } from './screens/Settings.jsx';
import { Sandbox } from './screens/Sandbox.jsx';

function applySettings(s) {
  const r = document.documentElement;
  r.dataset.theme = s.theme;
  r.dataset.contrast = s.highContrast ? 'high' : 'normal';
  r.dataset.motion = s.reducedMotion ? 'reduced' : 'full';
  r.dataset.dyslexia = s.dyslexia ? 'true' : 'false';
  r.style.setProperty('--scale', String(s.fontScale));
  r.style.setProperty('--code-size', `${s.editorFontSize}px`);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', s.theme === 'light' ? '#e3e9ff' : '#0b1124');
}

function Toasts() {
  const store = useStore();
  const [items, setItems] = useState([]);
  useEffect(() => store.onNotify((n) => {
    if (n.type === 'reward' && !n.xp && !n.coins) return;
    const id = Math.random();
    let text = n.text;
    if (n.type === 'reward') text = `${n.text ? n.text + ' · ' : ''}${n.xp ? `+${n.xp} XP` : ''}${n.xp && n.coins ? ' · ' : ''}${n.coins ? `+${n.coins} 🪙` : ''}`;
    if (n.type === 'level') text = `⭐ ${n.text}`;
    setItems((l) => [...l.slice(-1), { id, text, type: n.type }]);
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), n.type === 'level' || n.type === 'achievement' ? 4500 : 2800);
  }), []);
  return <div class="toasts" aria-live="polite">{items.map((t) => <div class={'toast ' + t.type} key={t.id}>{t.text}</div>)}</div>;
}

const NAV = [
  { path: '/', icon: '🏠', label: 'Accueil', match: (p) => p === '/' },
  { path: '/map', icon: '🗺️', label: 'Carte', match: (p) => /^\/(map|world|lesson|boss|exercise)/.test(p) },
  { path: '/review', icon: '🔁', label: 'Révision', match: (p) => p.startsWith('/review') },
  { path: '/sandbox', icon: '🧪', label: 'Labo', match: (p) => p.startsWith('/sandbox') },
  { path: '/profile', icon: '👤', label: 'Profil', match: (p) => /^\/(profile|skills|stats|settings)/.test(p) },
];

function TopBar({ path }) {
  const store = useStore();
  const s = store.state;
  const showBack = path !== '/';
  return (
    <header class="topbar">
      {showBack && <button class="backbtn" onClick={() => history.length > 1 ? history.back() : navigate('/')} aria-label="Retour">‹</button>}
      <a class="brand" href="#/" aria-label="Accueil C Quest"><img src="./icons/icon.svg" alt="" /><span class="title-grad">C Quest</span></a>
      <span class="spacer" />
      <span class="chip xp" title="Niveau">⭐ {levelFromXp(s.xp)}</span>
      <span class="chip coin" title="Pièces">🪙 {s.coins}</span>
      {s.streak?.count > 0 && <span class="chip streak" title="Série de jours">🔥 {s.streak.count}</span>}
      <a class="btn icon ghost" href="#/settings" aria-label="Réglages">⚙️</a>
    </header>
  );
}

function Router({ path, parts }) {
  const store = useStore();
  const s = store.state;
  if (!s.profile.onboarded && !['onboarding', 'placement', 'settings'].includes(parts[0])) return <Onboarding />;
  switch (parts[0]) {
    case undefined: return <Home />;
    case 'onboarding': return <Onboarding />;
    case 'placement': return <Placement />;
    case 'map': return <WorldMap />;
    case 'world': return <WorldView id={parts[1]} />;
    case 'lesson': return <LessonScreen id={parts[1]} step={parts[2] != null ? +parts[2] : null} />;
    case 'exercise': return <ExerciseScreen id={parts[1]} />;
    case 'boss': return <BossScreen worldId={parts[1]} />;
    case 'profile': return <Profile />;
    case 'skills': return <SkillTree />;
    case 'stats': return <Stats />;
    case 'review': return <Review />;
    case 'settings': return <Settings />;
    case 'sandbox': return <Sandbox />;
    default:
      return <div class="card center"><h2>Page introuvable</h2><p class="muted">Ce chemin n'existe pas ({path}).</p><a class="btn primary" href="#/">Retour à l'accueil</a></div>;
  }
}

function Shell() {
  const store = useStore();
  const { path, parts } = useRoute();
  const online = useOnline();
  const [splash, setSplash] = useState(true);
  const settings = store.state.settings;
  useEffect(() => applySettings(settings), [JSON.stringify(settings)]);
  useEffect(() => {
    if (/^\/(lesson|exercise|boss|world)/.test(path)) store.setResume(path);
  }, [path]);
  useEffect(() => {
    // au démarrage : reprendre exactement là où on s'était arrêté
    const resume = store.state.resume.route;
    let resumed = '0';
    try { resumed = sessionStorage.getItem('cq-resumed'); } catch { /* stockage indisponible */ }
    if ((path === '/' || path === '') && resume && store.state.profile.onboarded && resumed !== '1') {
      try { sessionStorage.setItem('cq-resumed', '1'); } catch { /* ignore */ }
      navigate(resume, true);
    }
  }, []);
  const noNav = !store.state.profile.onboarded || parts[0] === 'onboarding' || parts[0] === 'placement' || parts[0] === 'boss';
  return (
    <div class={'app' + (noNav ? '' : ' with-nav')}>
      {splash && <Splash onDone={() => setSplash(false)} />}
      {!noNav && (
        <nav class="bottomnav" aria-label="Navigation principale">
          {NAV.map((n) => <a href={'#' + n.path} class={n.match(path) ? 'active' : ''} aria-current={n.match(path) ? 'page' : undefined} key={n.path}><span class="ico">{n.icon}</span>{n.label}</a>)}
        </nav>
      )}
      <div class="content-col" style={{ flex: 1, minWidth: 0 }}>
        {!online && <div class="offline-banner">📴 Hors-ligne : les leçons, l'éditeur et le compilateur intégré fonctionnent quand même.</div>}
        {store.state.profile.onboarded && <TopBar path={path} />}
        <main class="main" id="main">
          <Router path={path} parts={parts} />
        </main>
      </div>
      <Toasts />
    </div>
  );
}

export function App({ store }) {
  return (
    <StoreContext.Provider value={store}>
      <Shell />
    </StoreContext.Provider>
  );
}
