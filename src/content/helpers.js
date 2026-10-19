// Outils d'écriture du contenu : texte brut (les \n du C restent visibles), indentation retirée.

function dedent(s) {
  const lines = s.replace(/\t/g, '    ').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(Number.isFinite(ind) ? ind : 0)).join('\n');
}

/** Gabarit brut : t`printf("x\n");` conserve le \n tel quel ; \` donne un accent grave. */
export function t(strings, ...vals) {
  return dedent(String.raw(strings, ...vals)).replace(/\\`/g, '`');
}

/** Exercice : ajoute des valeurs par défaut. */
export function ex(o) {
  return { hints: [], tests: [{}], ...o };
}
