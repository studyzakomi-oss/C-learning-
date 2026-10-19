// Profil du personnage : personnalisation, inventaire, boutique, trophées de boss, succès.
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useStore } from '../hooks.js';
import { PlayerAvatar, PLAYER_CLASSES, BossFigure } from '../components/characters.jsx';
import { levelProgress, rankFor, ACHIEVEMENTS } from '../../game/progression.js';
import { SHOP, FREE_COLORS } from '../../content/shop.js';
import { WORLDS } from '../../content/index.js';
import { Bar } from '../components/visual.jsx';

export function Profile() {
  const store = useStore();
  const s = store.state;
  const [tab, setTab] = useState('perso');
  const [msg, setMsg] = useState('');
  const lp = levelProgress(s.xp);
  const av = s.profile.avatar;
  const colors = [...FREE_COLORS, ...SHOP.filter((i) => i.kind === 'color' && s.inventory.includes(i.id)).map((i) => i.value)];
  const accessories = SHOP.filter((i) => i.kind === 'accessory' && s.inventory.includes(i.id));
  const trophies = WORLDS.filter((w) => s.bosses[w.boss.id]?.defeated);
  return (
    <div class="stack">
      <div class="card glow row" style={{ flexWrap: 'nowrap' }}>
        <PlayerAvatar avatar={av} size={96} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0 }}>{s.profile.name}</h1>
          <div class="small" style={{ color: 'var(--violet)' }}>{av.title || rankFor(lp.level)} · {PLAYER_CLASSES[av.cls]?.name}</div>
          <div class="small muted">Niveau {lp.level} · {s.xp} XP · 🪙 {s.coins}</div>
          <Bar value={lp.ratio * 100} />
        </div>
      </div>
      <div class="row">
        <a class="btn small" href="#/skills">🌳 Compétences</a>
        <a class="btn small" href="#/stats">📊 Statistiques</a>
        <a class="btn small" href="#/settings">⚙️ Réglages</a>
      </div>
      <div class="tabs" role="tablist">
        {[['perso', '🎨 Personnage'], ['inv', '🎒 Inventaire'], ['shop', '🛍️ Boutique'], ['trophees', '🏆 Trophées'], ['succes', '🎖️ Succès']].map(([k, l]) => (
          <button role="tab" aria-selected={tab === k} class={tab === k ? 'on' : ''} onClick={() => setTab(k)} key={k}>{l}</button>
        ))}
      </div>

      {tab === 'perso' && (
        <div class="card stack">
          <label class="field">Nom<input type="text" value={s.profile.name} maxLength={24} onInput={(e) => store.setProfile({ name: e.currentTarget.value })} /></label>
          <div class="small muted">Classe</div>
          <div class="grid two">{Object.entries(PLAYER_CLASSES).map(([k, v]) => <button class={'btn small' + (av.cls === k ? ' primary' : '')} onClick={() => store.setAvatar({ cls: k })} key={k}>{v.emblem} {v.name}</button>)}</div>
          <div class="small muted">Aura</div>
          <div class="avatar-pick">{colors.map((c) => <button class={av.color === c ? 'on' : ''} style={{ background: c }} onClick={() => store.setAvatar({ color: c })} aria-label={`Couleur ${c}`} key={c} />)}</div>
          <div class="small muted">Accessoire</div>
          <div class="row">
            <button class={'btn small' + (!av.accessory ? ' primary' : '')} onClick={() => store.setAvatar({ accessory: null })}>Aucun</button>
            {accessories.map((a) => <button class={'btn small' + (av.accessory === a.id ? ' primary' : '')} onClick={() => store.setAvatar({ accessory: a.id })} key={a.id}>{a.icon} {a.name}</button>)}
          </div>
          {accessories.length === 0 && <div class="small faint">Achète des accessoires dans la boutique avec tes pièces.</div>}
          <div class="small muted">Titre (débloqué par les succès)</div>
          <select value={av.title || ''} onChange={(e) => store.setAvatar({ title: e.currentTarget.value || null })}>
            <option value="">Rang automatique ({rankFor(lp.level)})</option>
            {ACHIEVEMENTS.filter((a) => s.achievements.includes(a.id)).map((a) => <option value={a.name} key={a.id}>{a.name}</option>)}
          </select>
        </div>
      )}

      {tab === 'inv' && (
        <div class="card stack">
          {s.inventory.length === 0 && <div class="muted">Ton inventaire est vide pour l'instant.</div>}
          {SHOP.filter((i) => s.inventory.includes(i.id)).map((i) => <div class="shop-item" key={i.id}><span class="ic">{i.icon}</span><b style={{ flex: 1 }}>{i.name}</b><span class="badge green">Possédé</span></div>)}
          <div class="small faint">Compétences spéciales : {s.perks.length ? s.perks.join(', ') : 'aucune (voir l\'arbre de compétences)'}</div>
        </div>
      )}

      {tab === 'shop' && (
        <div class="stack">
          <div class="small muted">Objets purement cosmétiques : l'apprentissage n'est jamais payant. Tu as 🪙 {s.coins}.</div>
          {msg && <div class="diag info">{msg}</div>}
          {SHOP.map((i) => {
            const owned = s.inventory.includes(i.id);
            return (
              <div class="shop-item" key={i.id}>
                <span class="ic">{i.icon}</span>
                <div style={{ flex: 1 }}><b>{i.name}</b><div class="small faint">{i.kind === 'color' ? 'Couleur d\'aura' : 'Accessoire'}</div></div>
                {owned ? <span class="badge green">Possédé</span> : <button class="btn small" disabled={s.coins < i.price} onClick={() => setMsg(store.buy(i) ? `${i.name} ajouté à l'inventaire !` : 'Pas assez de pièces.')}>🪙 {i.price}</button>}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'trophees' && (
        <div class="grid three">
          {WORLDS.map((w) => {
            const got = s.bosses[w.boss.id]?.defeated;
            return (
              <div class="card center" style={{ opacity: got ? 1 : 0.4 }} key={w.id}>
                <BossFigure kind={w.boss.avatar} size={72} />
                <b>{w.boss.name}</b>
                <div class="small muted">{got ? `Vaincu${s.bosses[w.boss.id].bestTime ? ` · record ${Math.floor(s.bosses[w.boss.id].bestTime / 60)} min ${s.bosses[w.boss.id].bestTime % 60} s` : ''}` : `Monde ${w.num}`}</div>
              </div>
            );
          })}
          {trophies.length === 0 && <div class="small faint">Aucun trophée encore : bats ton premier boss !</div>}
        </div>
      )}

      {tab === 'succes' && (
        <div class="grid two">
          {ACHIEVEMENTS.map((a) => {
            const got = s.achievements.includes(a.id);
            return <div class="shop-item" style={{ opacity: got ? 1 : 0.45 }} key={a.id}><span class="ic">{got ? a.icon : '🔒'}</span><div><b>{a.name}</b><div class="small muted">{a.desc}</div></div></div>;
          })}
        </div>
      )}
    </div>
  );
}
