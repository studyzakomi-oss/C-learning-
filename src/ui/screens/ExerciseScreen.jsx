// Écran d'exercice autonome (défis du monde, entraînement ciblé).
import { h } from 'preact';
import { getExercise } from '../../content/index.js';
import { Exercise } from '../components/Exercise.jsx';
import { useStore, useTimeTracker } from '../hooks.js';
import { isWorldUnlocked } from '../../game/progression.js';
import { WORLDS } from '../../content/index.js';

export function ExerciseScreen({ id }) {
  const store = useStore();
  const found = getExercise(id);
  useTimeTracker(store, found?.lesson?.id || null);
  if (!found) return <div class="card">Exercice introuvable.</div>;
  if (!isWorldUnlocked(store.state, WORLDS, found.world.id)) return <div class="card center"><h2>🔒 Monde verrouillé</h2><a class="btn" href="#/map">Carte</a></div>;
  const { ex, world } = found;
  return (
    <div class="stack">
      <div class="small faint"><a href={`#/world/${world.id}`}>{world.icon} Monde {world.num} — {world.title}</a></div>
      <h1>{ex.title}</h1>
      <Exercise ex={ex} />
    </div>
  );
}
