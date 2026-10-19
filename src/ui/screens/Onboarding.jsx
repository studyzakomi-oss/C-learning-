// Accueil et prise en main : présentation des personnages, nom du joueur, avatar, choix du test de placement.
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useStore, navigate } from '../hooks.js';
import { Speech, PlayerAvatar, PLAYER_CLASSES, Avatar, CHARACTERS } from '../components/characters.jsx';
import { Particles } from '../components/visual.jsx';
import { FREE_COLORS } from '../../content/shop.js';

export function Onboarding() {
  const store = useStore();
  const p = store.state.profile;
  const [step, setStep] = useState(0);
  const [name, setName] = useState(p.name || '');
  const [cls, setCls] = useState(p.avatar.cls || 'mage');
  const [color, setColor] = useState(p.avatar.color || '#22d3ee');

  const finish = (placement) => {
    store.setProfile({ name: name.trim() || 'Apprenti', onboarded: true });
    store.setAvatar({ cls, color });
    navigate(placement ? '/placement' : '/', true);
  };

  return (
    <div class="stack" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div class="card hero glow">
        <Particles density={30} />
        <h1 class="title-grad">Bienvenue dans C Quest</h1>
        <p class="muted">L'Académie du Code — de ton premier <code class="inline-code">printf()</code> jusqu'aux pointeurs et à la mémoire dynamique.</p>
        <div class="steps" aria-hidden="true">{[0, 1, 2, 3].map((k) => <button class={k < step ? 'done' : k === step ? 'cur' : ''} tabIndex={-1} />)}</div>
      </div>

      {step === 0 && (
        <div class="stack fade-in">
          <Speech who="syntaxe">Bonjour, jeune codeur. Je suis le <b>Professeur Syntaxe</b>, quarante ans passés à enseigner le C. Le royaume du code est en danger : <b>le Glitch</b> casse tous les programmes. Ensemble, nous allons restaurer les dix mondes.</Speech>
          <Speech who="glitch">Ha ! Point-virgule oublié, pointeur NULL, boucle infinie… Je suis dans chaque bug. Tu ne passeras pas le premier monde !</Speech>
          <Speech who="bug">Pas de panique ! Moi, c'est <b>Bug Hunter</b>. Quand ton programme plante, je t'aide à trouver pourquoi — sans te donner la réponse toute faite.</Speech>
          <Speech who="compilo">Et moi, <b>le Compilateur</b>. Strict, mais juste : je n'accepte que du code correct, et je vérifie chaque programme en l'exécutant vraiment.</Speech>
          <button class="btn primary block" onClick={() => setStep(1)}>Commencer l'aventure →</button>
        </div>
      )}

      {step === 1 && (
        <div class="card stack fade-in">
          <h2>Comment t'appelles-tu ?</h2>
          <label class="field">Ton nom d'aventurier
            <input type="text" value={name} maxLength={24} onInput={(e) => setName(e.currentTarget.value)} placeholder="Par exemple : Zakomi" autoFocus />
          </label>
          <div class="row">
            <button class="btn ghost" onClick={() => setStep(0)}>← Retour</button>
            <button class="btn primary" style={{ flex: 1 }} onClick={() => setStep(2)} disabled={!name.trim()}>Continuer →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div class="card stack fade-in">
          <h2>Crée ton personnage</h2>
          <div class="row" style={{ justifyContent: 'center' }}><PlayerAvatar avatar={{ cls, color }} size={120} /></div>
          <div class="small muted">Classe (purement cosmétique)</div>
          <div class="grid two">
            {Object.entries(PLAYER_CLASSES).map(([k, v]) => (
              <button class={'btn' + (cls === k ? ' primary' : '')} onClick={() => setCls(k)} key={k}>{v.emblem} {v.name}</button>
            ))}
          </div>
          <div class="small muted">Couleur d'aura (d'autres s'achètent dans la boutique)</div>
          <div class="avatar-pick">{FREE_COLORS.map((c) => <button class={color === c ? 'on' : ''} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Couleur ${c}`} key={c} />)}</div>
          <div class="row">
            <button class="btn ghost" onClick={() => setStep(1)}>← Retour</button>
            <button class="btn primary" style={{ flex: 1 }} onClick={() => setStep(3)}>Continuer →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div class="card stack fade-in">
          <h2>Par où commencer, {name.trim()} ?</h2>
          <Speech who="syntaxe">Un petit <b>test de placement</b> (13 questions, environ 4 minutes) me permet de te conseiller un point de départ. Tu as déjà programmé ? Tu pourras sauter des mondes. Débutant complet ? Commence directement au Monde 1 : c'est fait pour toi.</Speech>
          <button class="btn primary block" onClick={() => finish(true)}>🧭 Passer le test de placement</button>
          <button class="btn block" onClick={() => finish(false)}>🏛️ Commencer au Monde 1 (débutant)</button>
          <div class="small faint center">Ta progression est enregistrée sur cet appareil. Aucun compte n'est nécessaire.</div>
        </div>
      )}
      <div class="center small faint">Personnages : {Object.values(CHARACTERS).map((c) => c.name).join(' · ')}</div>
      <div style={{ display: 'none' }}><Avatar who="syntaxe" /></div>
    </div>
  );
}
