// Écran de démarrage animé (touche pour passer).
import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { Particles } from '../components/visual.jsx';

export function Splash({ onDone }) {
  useEffect(() => {
    const reduced = document.documentElement.dataset.motion === 'reduced';
    const id = setTimeout(onDone, reduced ? 300 : 1700);
    return () => clearTimeout(id);
  }, []);
  return (
    <div class="splash" onClick={onDone} role="button" aria-label="Écran de démarrage, touche pour continuer" tabIndex={0} onKeyDown={onDone}>
      <Particles density={70} />
      <div class="logo">
        <img src="./icons/icon.svg" alt="" />
        <h1 class="title-grad" style={{ fontSize: '2.4rem', margin: '14px 0 4px' }}>C Quest</h1>
        <div class="muted">L'Académie du Code</div>
        <div class="faint small mono pulse" style={{ marginTop: '18px' }}>#include &lt;aventure.h&gt;</div>
      </div>
    </div>
  );
}
