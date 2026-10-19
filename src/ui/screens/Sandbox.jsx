// Laboratoire libre : écrire et exécuter n'importe quel programme C (sauvegardé automatiquement).
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useStore } from '../hooks.js';
import { Lab } from '../components/Lab.jsx';
import { t } from '../../content/helpers.js';

const EXAMPLES = {
  hello: t`
    #include <stdio.h>

    int main(void)
    {
        printf("Hello, World!\n");
        return 0;
    }
  `,
  table: t`
    #include <stdio.h>

    int main(void)
    {
        int n;
        printf("Table de : ");
        if (scanf("%d", &n) != 1) return 1;
        for (int i = 1; i <= 10; i++) {
            printf("%2d x %d = %3d\n", i, n, i * n);
        }
        return 0;
    }
  `,
  devine: t`
    #include <stdio.h>
    #include <stdlib.h>

    int main(void)
    {
        srand(42);
        int secret = rand() % 100 + 1;
        int essai, coups = 0;
        while (scanf("%d", &essai) == 1) {
            coups++;
            if (essai < secret) printf("%d : plus grand\n", essai);
            else if (essai > secret) printf("%d : plus petit\n", essai);
            else { printf("Trouve en %d coups !\n", coups); return 0; }
        }
        printf("Abandon. C'etait %d.\n", secret);
        return 0;
    }
  `,
};

export function Sandbox() {
  const store = useStore();
  const sb = store.state.sandbox;
  const [key, setKey] = useState(0);
  const load = (code, stdin = '') => { store.setSandbox({ code, stdin }); setKey(key + 1); };
  return (
    <div class="stack">
      <h1 class="title-grad">🧪 Laboratoire</h1>
      <p class="muted">Ton espace libre : écris, exécute, expérimente. Le code est sauvegardé automatiquement. Ctrl+Entrée pour exécuter.</p>
      <div class="row">
        <span class="small muted">Exemples :</span>
        <button class="btn small" onClick={() => load(EXAMPLES.hello)}>Hello World</button>
        <button class="btn small" onClick={() => load(EXAMPLES.table, '7\n')}>Table de multiplication</button>
        <button class="btn small" onClick={() => load(EXAMPLES.devine, '50\n25\n12\n')}>Devine le nombre</button>
      </div>
      <Lab key={key} initial={sb.code ?? EXAMPLES.hello} stdin={sb.stdin || ''} onChange={(c) => store.setSandbox({ code: c })} sandbox reset={EXAMPLES.hello} />
    </div>
  );
}
