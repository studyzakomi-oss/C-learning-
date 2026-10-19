// Réglages et accessibilité + sauvegarde (export / import / réinitialisation).
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useStore } from '../hooks.js';

function Toggle({ label, desc, checked, onChange }) {
  return (
    <div class="toggle">
      <div><b>{label}</b>{desc && <div class="small muted">{desc}</div>}</div>
      <label class="switch"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} aria-label={label} /><span /></label>
    </div>
  );
}

export function Settings() {
  const store = useStore();
  const st = store.state.settings;
  const [msg, setMsg] = useState('');
  const set = (p) => store.setSettings(p);
  const exportSave = () => {
    const blob = new Blob([store.exportSave()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cquest-sauvegarde-${store.today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    setMsg('Sauvegarde téléchargée.');
  };
  const importSave = (file) => {
    const r = new FileReader();
    r.onload = () => {
      try { store.importSave(String(r.result)); setMsg('Sauvegarde restaurée ✔'); } catch (e) { setMsg('Erreur : ' + e.message); }
    };
    r.readAsText(file);
  };
  return (
    <div class="stack" style={{ maxWidth: '760px' }}>
      <h1 class="title-grad">Réglages</h1>
      <div class="card">
        <h3>Affichage</h3>
        <div class="toggle">
          <div><b>Thème</b><div class="small muted">Sombre (néon) ou clair</div></div>
          <div class="row"><button class={'btn small' + (st.theme === 'dark' ? ' primary' : '')} onClick={() => set({ theme: 'dark' })}>🌙 Sombre</button><button class={'btn small' + (st.theme === 'light' ? ' primary' : '')} onClick={() => set({ theme: 'light' })}>☀️ Clair</button></div>
        </div>
        <div class="toggle">
          <div><b>Taille du texte</b><div class="small muted">{Math.round(st.fontScale * 100)} %</div></div>
          <input type="range" min="0.85" max="1.4" step="0.05" value={st.fontScale} onInput={(e) => set({ fontScale: +e.currentTarget.value })} aria-label="Taille du texte" style={{ maxWidth: '200px' }} />
        </div>
        <div class="toggle">
          <div><b>Taille du code (éditeur)</b><div class="small muted">{st.editorFontSize} px</div></div>
          <input type="range" min="11" max="26" step="1" value={st.editorFontSize} onInput={(e) => set({ editorFontSize: +e.currentTarget.value })} aria-label="Taille du code" style={{ maxWidth: '200px' }} />
        </div>
        <Toggle label="Contraste élevé" desc="Bordures et textes secondaires plus marqués" checked={st.highContrast} onChange={(v) => set({ highContrast: v })} />
        <Toggle label="Réduire les animations" desc="Désactive particules et mouvements" checked={st.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />
        <Toggle label="Lecture facilitée" desc="Espacement des lettres et des lignes augmenté" checked={st.dyslexia} onChange={(v) => set({ dyslexia: v })} />
      </div>
      <div class="card">
        <h3>Jeu</h3>
        <Toggle label="Chronomètre des boss" desc="Désactive-le si le temps te stresse : le combat reste identique." checked={st.bossTimer} onChange={(v) => set({ bossTimer: v })} />
      </div>
      <div class="card stack">
        <h3 style={{ margin: 0 }}>Sauvegarde</h3>
        <div class="small muted">Ta progression est enregistrée automatiquement sur cet appareil (stockage local, aucun compte, aucune donnée envoyée). Exporte-la pour la transférer sur un autre appareil.</div>
        <div class="row">
          <button class="btn" onClick={exportSave}>⬇️ Exporter</button>
          <label class="btn">⬆️ Importer<input type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => e.currentTarget.files[0] && importSave(e.currentTarget.files[0])} /></label>
          <button class="btn danger" onClick={() => { if (confirm('Effacer TOUTE ta progression ? Cette action est définitive (exporte d\'abord si tu veux la garder).')) { store.reset(); location.hash = '/'; } }}>🗑️ Tout réinitialiser</button>
        </div>
        {msg && <div class="diag info">{msg}</div>}
      </div>
      <div class="card small muted">
        <b>À propos</b>
        <p>C Quest — L'Académie du Code. Les programmes sont compilés et exécutés par un interpréteur C99 intégré, directement sur l'appareil (hors-ligne, gratuit, isolé dans un Web Worker avec limites de temps et de mémoire). Ses résultats sont vérifiés contre gcc pour tout le contenu du jeu.</p>
      </div>
    </div>
  );
}
