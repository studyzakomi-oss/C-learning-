// Personnages originaux dessinés en SVG (aucune image externe : tout fonctionne hors-ligne).
import { h } from 'preact';

export const CHARACTERS = {
  syntaxe: { name: 'Professeur Syntaxe', color: '#22d3ee', role: 'Mentor' },
  bug: { name: 'Bug Hunter', color: '#f472b6', role: 'Compagnon de débogage' },
  compilo: { name: 'Le Compilateur', color: '#fbbf24', role: 'Examinateur' },
  glitch: { name: 'Le Glitch', color: '#a78bfa', role: 'Antagoniste' },
};

function Syntaxe() {
  return (
    <g>
      <ellipse cx="50" cy="92" rx="26" ry="5" fill="#000" opacity=".25" />
      <path d="M22 88 Q50 30 78 88 Z" fill="#1e3a8a" stroke="#22d3ee" stroke-width="2" />
      <path d="M34 26 L50 2 L66 26 Z" fill="#312e81" stroke="#a78bfa" stroke-width="2" />
      <circle cx="58" cy="10" r="2.5" fill="#fbbf24" />
      <circle cx="50" cy="40" r="17" fill="#0f172a" stroke="#22d3ee" stroke-width="2" />
      <circle cx="43" cy="39" r="5" fill="#e0f2fe" /><circle cx="57" cy="39" r="5" fill="#e0f2fe" />
      <circle cx="43" cy="39" r="2.3" fill="#0f172a" /><circle cx="57" cy="39" r="2.3" fill="#0f172a" />
      <path d="M38 39 h10 M52 39 h10" stroke="#fbbf24" stroke-width="1.4" fill="none" />
      <path d="M44 49 q6 4 12 0" stroke="#22d3ee" stroke-width="2" fill="none" stroke-linecap="round" />
      <text x="50" y="76" text-anchor="middle" font-family="monospace" font-size="15" font-weight="700" fill="#22d3ee">{'{ }'}</text>
      <path d="M78 60 l10 -26" stroke="#a78bfa" stroke-width="3" stroke-linecap="round" />
      <circle cx="88" cy="32" r="4" fill="#22d3ee" />
    </g>
  );
}
function Bug() {
  return (
    <g>
      <ellipse cx="50" cy="92" rx="24" ry="5" fill="#000" opacity=".25" />
      <path d="M30 50 l-12 -8 M30 62 l-14 2 M30 74 l-12 10 M70 50 l12 -8 M70 62 l14 2 M70 74 l12 10" stroke="#f472b6" stroke-width="3" stroke-linecap="round" />
      <ellipse cx="50" cy="64" rx="22" ry="26" fill="#831843" stroke="#f472b6" stroke-width="2" />
      <path d="M50 40 v50" stroke="#f472b6" stroke-width="1.5" />
      <circle cx="50" cy="32" r="14" fill="#1f0a19" stroke="#f472b6" stroke-width="2" />
      <path d="M38 22 q-6 -14 -14 -12 M62 22 q6 -14 14 -12" stroke="#f9a8d4" stroke-width="2" fill="none" />
      <rect x="37" y="27" width="26" height="9" rx="4" fill="#22d3ee" opacity=".85" />
      <circle cx="44" cy="31" r="2" fill="#fff" /><circle cx="56" cy="31" r="2" fill="#fff" />
      <circle cx="78" cy="78" r="9" fill="none" stroke="#fbbf24" stroke-width="3" />
      <path d="M84 84 l8 8" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" />
    </g>
  );
}
function Compilo() {
  return (
    <g>
      <ellipse cx="50" cy="92" rx="26" ry="5" fill="#000" opacity=".25" />
      <path d="M50 8 L86 28 V70 L50 90 L14 70 V28 Z" fill="#422006" stroke="#fbbf24" stroke-width="2.5" />
      <path d="M50 8 L50 48 M14 28 L50 48 L86 28" stroke="#fbbf24" stroke-width="1.2" opacity=".5" fill="none" />
      <circle cx="50" cy="52" r="12" fill="#0b1124" stroke="#fbbf24" stroke-width="2" />
      <circle cx="50" cy="52" r="5" fill="#fbbf24" className="pulse" />
      <path d="M34 72 h32" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" />
      <text x="50" y="26" text-anchor="middle" font-family="monospace" font-size="9" font-weight="700" fill="#fde68a">gcc</text>
    </g>
  );
}
function Glitch() {
  return (
    <g class="glitch">
      <ellipse cx="50" cy="94" rx="24" ry="4" fill="#000" opacity=".3" />
      <path d="M24 90 V40 Q24 12 50 12 Q76 12 76 40 V90 l-8 -8 -8 8 -10 -8 -10 8 -8 -8 Z" fill="#2e1065" stroke="#a78bfa" stroke-width="2" />
      <rect x="20" y="44" width="16" height="5" fill="#22d3ee" opacity=".8" />
      <rect x="66" y="58" width="18" height="4" fill="#f472b6" opacity=".8" />
      <path d="M36 38 l8 6 -8 6 M64 38 l-8 6 8 6" stroke="#f472b6" stroke-width="3" fill="none" />
      <path d="M38 66 h4 v4 h4 v-4 h4 v4 h4 v-4 h4" stroke="#a78bfa" stroke-width="2" fill="none" />
      <text x="50" y="86" text-anchor="middle" font-family="monospace" font-size="8" fill="#c4b5fd">0xDEAD</text>
    </g>
  );
}

const BOSSES = {
  semicolon: (c) => (
    <g>
      <path d="M22 92 V46 Q22 10 50 10 Q78 10 78 46 V92 l-9 -9 -9 9 -10 -9 -10 9 -9 -9 Z" fill="#0c4a6e" stroke={c} stroke-width="2.5" opacity=".92" />
      <circle cx="50" cy="42" r="8" fill={c} /><path d="M50 58 q6 0 4 10 q-2 8 -8 10" stroke={c} stroke-width="7" fill="none" stroke-linecap="round" />
      <circle cx="36" cy="32" r="3" fill="#fff" /><circle cx="64" cy="32" r="3" fill="#fff" />
    </g>
  ),
  hydra: (c) => (
    <g>
      <path d="M30 92 Q20 60 34 40 M50 92 Q50 50 50 26 M70 92 Q80 60 66 40" stroke={c} stroke-width="10" fill="none" stroke-linecap="round" />
      <circle cx="34" cy="38" r="11" fill="#4c1d95" stroke={c} stroke-width="2" /><text x="34" y="42" text-anchor="middle" font-size="9" font-family="monospace" fill="#fff">int</text>
      <circle cx="50" cy="22" r="12" fill="#4c1d95" stroke={c} stroke-width="2" /><text x="50" y="26" text-anchor="middle" font-size="8" font-family="monospace" fill="#fff">dbl</text>
      <circle cx="66" cy="38" r="11" fill="#4c1d95" stroke={c} stroke-width="2" /><text x="66" y="42" text-anchor="middle" font-size="9" font-family="monospace" fill="#fff">chr</text>
    </g>
  ),
  divider: (c) => (
    <g>
      <circle cx="50" cy="52" r="34" fill="#1e1b4b" stroke={c} stroke-width="3" />
      <circle cx="50" cy="32" r="6" fill={c} /><rect x="24" y="48" width="52" height="8" rx="4" fill={c} /><circle cx="50" cy="72" r="6" fill={c} />
      <text x="50" y="98" text-anchor="middle" font-size="10" font-family="monospace" fill={c}>÷ 0</text>
    </g>
  ),
  sphinx: (c) => (
    <g>
      <path d="M16 90 L30 50 Q50 30 70 50 L84 90 Z" fill="#422006" stroke={c} stroke-width="2.5" />
      <circle cx="50" cy="40" r="16" fill="#713f12" stroke={c} stroke-width="2" />
      <text x="50" y="45" text-anchor="middle" font-size="14" font-weight="700" font-family="monospace" fill="#fff">?:</text>
      <path d="M30 64 h40" stroke={c} stroke-width="2" /><text x="50" y="82" text-anchor="middle" font-size="9" font-family="monospace" fill={c}>if/else</text>
    </g>
  ),
  loop: (c) => (
    <g>
      <circle cx="50" cy="52" r="32" fill="none" stroke={c} stroke-width="12" stroke-dasharray="180 22" class="pulse" />
      <path d="M78 34 l8 -4 -2 10" fill={c} />
      <circle cx="50" cy="52" r="14" fill="#064e3b" stroke={c} stroke-width="2" />
      <text x="50" y="57" text-anchor="middle" font-size="13" font-family="monospace" fill="#fff">∞</text>
    </g>
  ),
  monolith: (c) => (
    <g>
      <rect x="28" y="8" width="44" height="86" rx="4" fill="#0f172a" stroke={c} stroke-width="3" />
      {[18, 28, 38, 48, 58, 68, 78].map((y) => <rect x="34" y={y} width={y % 20 ? 28 : 20} height="3" fill={c} opacity=".6" />)}
      <circle cx="50" cy="44" r="6" fill={c} class="pulse" />
    </g>
  ),
  offbyone: (c) => (
    <g>
      <path d="M24 92 V44 Q24 12 50 12 Q76 12 76 44 V92 l-9 -9 -9 9 -10 -9 -10 9 -9 -9 Z" fill="#3b0764" stroke={c} stroke-width="2.5" />
      {[0, 1, 2, 3, 4].map((k) => <rect x={22 + k * 11} y="50" width="9" height="12" fill={k === 4 ? '#f87171' : c} opacity=".85" />)}
      <text x="50" y="76" text-anchor="middle" font-size="10" font-family="monospace" fill="#fff">[n]</text>
      <circle cx="40" cy="32" r="3" fill="#fff" /><circle cx="60" cy="32" r="3" fill="#fff" />
    </g>
  ),
  segfault: (c) => (
    <g>
      <path d="M50 6 L90 80 H10 Z" fill="#450a0a" stroke={c} stroke-width="3" />
      <text x="50" y="62" text-anchor="middle" font-size="26" font-weight="800" font-family="monospace" fill={c}>*</text>
      <text x="50" y="76" text-anchor="middle" font-size="8" font-family="monospace" fill="#fecaca">NULL</text>
      <path d="M30 88 l6 -8 6 8 6 -8 6 8 6 -8 6 8" stroke={c} stroke-width="2" fill="none" />
    </g>
  ),
  archiviste: (c) => (
    <g>
      <path d="M22 18 h40 l16 16 v58 h-56 Z" fill="#082f49" stroke={c} stroke-width="3" />
      <path d="M62 18 v16 h16" fill="none" stroke={c} stroke-width="3" />
      {[44, 54, 64, 74].map((y) => <path d={`M30 ${y} h${y % 20 ? 38 : 26}`} stroke={c} stroke-width="3" opacity=".7" />)}
      <circle cx="44" cy="32" r="3" fill="#f472b6" /><circle cx="54" cy="32" r="3" fill="#f472b6" />
    </g>
  ),
};

export const BOSS_COLORS = { semicolon: '#22d3ee', hydra: '#a78bfa', divider: '#60a5fa', sphinx: '#fbbf24', loop: '#34d399', monolith: '#f472b6', offbyone: '#c084fc', segfault: '#f87171', archiviste: '#38bdf8' };

export function Avatar({ who, size = 64, class: cls = '' }) {
  const body = who === 'syntaxe' ? <Syntaxe /> : who === 'bug' ? <Bug /> : who === 'compilo' ? <Compilo /> : <Glitch />;
  return <svg class={'avatar ' + cls} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={CHARACTERS[who]?.name}>{body}</svg>;
}

export function BossFigure({ kind, size = 140, class: cls = '' }) {
  if (kind === 'glitch') return <svg class={cls} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Le Glitch"><Glitch /></svg>;
  const f = BOSSES[kind] || BOSSES.semicolon;
  return <svg class={cls} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Boss">{f(BOSS_COLORS[kind] || '#22d3ee')}</svg>;
}

export const PLAYER_CLASSES = {
  mage: { name: 'Mage du Code', emblem: '✦' },
  gardien: { name: 'Gardien des Pointeurs', emblem: '◆' },
  pisteur: { name: 'Pisteur de Bugs', emblem: '✚' },
  architecte: { name: 'Architecte', emblem: '▲' },
};

export function PlayerAvatar({ avatar, size = 72 }) {
  const c = avatar?.color || '#22d3ee';
  const acc = avatar?.accessory;
  const emblem = PLAYER_CLASSES[avatar?.cls]?.emblem || '✦';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Ton avatar">
      <defs><radialGradient id={'pg' + c.slice(1)} cx=".5" cy=".3" r=".8"><stop offset="0" stop-color={c} stop-opacity=".9" /><stop offset="1" stop-color="#0b1124" /></radialGradient></defs>
      <circle cx="50" cy="50" r="48" fill="#0b1124" stroke={c} stroke-width="2" />
      <path d="M22 96 Q22 58 50 58 Q78 58 78 96 Z" fill={`url(#pg${c.slice(1)})`} />
      <path d="M30 46 Q30 16 50 16 Q70 16 70 46 Q70 62 50 64 Q30 62 30 46 Z" fill="#111a3a" stroke={c} stroke-width="2" />
      <path d="M36 44 Q50 34 64 44 Q64 56 50 58 Q36 56 36 44 Z" fill="#070b1a" />
      <circle cx="44" cy="47" r="3" fill={c} /><circle cx="56" cy="47" r="3" fill={c} />
      <text x="50" y="86" text-anchor="middle" font-size="14" fill="#fff">{emblem}</text>
      {acc === 'couronne' && <path d="M34 20 l6 -12 10 9 10 -9 6 12 Z" fill="#fbbf24" stroke="#fde68a" />}
      {acc === 'casque' && <path d="M28 36 Q50 4 72 36 Z" fill="#475569" stroke="#cbd5e1" stroke-width="2" />}
      {acc === 'lunettes' && <g><rect x="35" y="42" width="12" height="9" rx="2" fill="#22d3ee" opacity=".7" /><rect x="53" y="42" width="12" height="9" rx="2" fill="#22d3ee" opacity=".7" /><path d="M47 46 h6" stroke="#22d3ee" stroke-width="2" /></g>}
      {acc === 'cape' && <path d="M24 70 Q10 88 18 98 L30 96 Z M76 70 Q90 88 82 98 L70 96 Z" fill="#be185d" />}
      {acc === 'aureole' && <ellipse cx="50" cy="12" rx="16" ry="4" fill="none" stroke="#fde68a" stroke-width="3" />}
      {acc === 'casque-audio' && <g><path d="M30 40 Q50 6 70 40" fill="none" stroke="#a78bfa" stroke-width="4" /><rect x="25" y="38" width="8" height="14" rx="3" fill="#a78bfa" /><rect x="67" y="38" width="8" height="14" rx="3" fill="#a78bfa" /></g>}
    </svg>
  );
}

/** Bulle de dialogue d'un personnage. */
export function Speech({ who, children, class: cls = '' }) {
  const ch = CHARACTERS[who];
  return (
    <div class={'speaker fade-in ' + cls}>
      <Avatar who={who} class="float" />
      <div class="bubble">
        <div class="who" style={{ color: ch.color }}>{ch.name}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}
