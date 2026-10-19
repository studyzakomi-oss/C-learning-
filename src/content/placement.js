// Test de placement : logique, variables, conditions, boucles, fonctions, syntaxe C.

export const PLACEMENT = [
  { topic: 'logic', q: 'Une recette dit : « Tant que l\'eau ne bout pas, attendre 1 minute ». Que décrit cette phrase ?', choices: ['Une condition simple', 'Une répétition (boucle)', 'Une variable', 'Une fonction'], answer: 1 },
  { topic: 'logic', q: 'On veut savoir si un nombre est pair. Quelle opération est la plus utile ?', choices: ['Le reste de la division par 2', 'La racine carrée', 'La multiplication par 2', 'L\'addition de 1'], answer: 0 },
  { topic: 'variables', q: 'Une variable sert à…', choices: ['Afficher du texte', 'Garder une valeur en mémoire sous un nom', 'Répéter des instructions', 'Arrêter le programme'], answer: 1 },
  { topic: 'variables', q: 'Après `x = 4; x = x + 3;`, combien vaut x ?', choices: ['4', '3', '7', 'Erreur'], answer: 2 },
  { topic: 'syntax', q: 'En C, quelle ligne affiche Bonjour puis passe à la ligne ?', choices: ['print("Bonjour")', 'printf("Bonjour\\n");', 'echo "Bonjour";', 'console.log("Bonjour");'], answer: 1 },
  { topic: 'syntax', q: 'En C, que vaut `7 / 2` si 7 et 2 sont des int ?', choices: ['3.5', '3', '4', 'Erreur'], answer: 1 },
  { topic: 'syntax', q: 'Quelle déclaration C est correcte ?', choices: ['int age = 17;', 'age = 17', 'var age = 17;', 'int age := 17;'], answer: 0 },
  { topic: 'conditions', q: 'Avec `int n = 5;`, que vaut la condition `n > 3 && n < 5` ?', choices: ['vraie', 'fausse', 'erreur', '5'], answer: 1 },
  { topic: 'conditions', q: 'En C, quel opérateur teste l\'égalité ?', choices: ['=', '==', '===', 'equals'], answer: 1 },
  { topic: 'loops', q: 'Combien de fois `for (int i = 0; i < 4; i++)` répète-t-elle son bloc ?', choices: ['3', '4', '5', 'à l\'infini'], answer: 1 },
  { topic: 'loops', q: 'Que fait `while (i < 10) { printf("x"); }` si i vaut 0 et ne change jamais ?', choices: ['Affiche x une fois', 'N\'affiche rien', 'Boucle infinie', 'Erreur de compilation'], answer: 2 },
  { topic: 'functions', q: 'Une fonction `int carre(int x) { return x * x; }` appelée avec `carre(3)` renvoie…', choices: ['3', '6', '9', 'Rien'], answer: 2 },
  { topic: 'functions', q: 'Que signifie `void` comme type de retour ?', choices: ['La fonction renvoie 0', 'La fonction ne renvoie aucune valeur', 'La fonction est vide', 'La fonction renvoie un texte'], answer: 1 },
];

/** Calcule le résultat et la recommandation (indice du monde de départ). */
export function evaluatePlacement(answers) {
  const per = {};
  for (const [i, q] of PLACEMENT.entries()) {
    per[q.topic] ??= { ok: 0, n: 0 };
    per[q.topic].n++;
    if (answers[i] === q.answer) per[q.topic].ok++;
  }
  const ratio = Object.fromEntries(Object.entries(per).map(([k, v]) => [k, v.ok / v.n]));
  const total = PLACEMENT.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);
  const strong = (k) => (ratio[k] ?? 0) >= 0.66;
  let recommended = 0;
  if (strong('syntax') && strong('variables')) {
    recommended = 2;
    if (strong('conditions')) recommended = 3;
    if (recommended === 3 && strong('loops')) recommended = 4;
    if (recommended === 4 && strong('functions')) recommended = 5;
  }
  return { score: Math.round((total / PLACEMENT.length) * 100), perTopic: ratio, recommended };
}

export const TOPIC_LABELS = { logic: 'Logique', variables: 'Variables', syntax: 'Syntaxe C', conditions: 'Conditions', loops: 'Boucles', functions: 'Fonctions' };
