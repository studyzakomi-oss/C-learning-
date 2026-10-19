import { t, ex } from '../helpers.js';

export default {
  id: 'w6',
  num: 6,
  title: 'Fonctions',
  subtitle: 'Découper un programme en briques réutilisables : paramètres, return, portée, prototypes',
  color: '#f472b6',
  icon: '🧱',
  intro: t`
    La Cité des Artisans fonctionne grâce à ses ateliers : chacun fait UNE chose, bien.
    En C, ces ateliers s'appellent des fonctions. Le Monolithe, un programme géant de mille lignes
    entassées dans main, menace la cité. Apprends à le découper.
  `,
  lessons: [
    {
      id: 'w6l1',
      title: 'Pourquoi des fonctions ? Fonctions void',
      topic: 'syntax',
      skills: ['syntax', 'algo'],
      objectif: 'Définir et appeler une fonction sans valeur de retour (void) pour éviter de répéter du code.',
      explication: t`
        Une **fonction** est un bloc de code **nommé** que l'on peut **appeler** autant de fois qu'on veut.
        Avantages : on n'écrit le code qu'une fois, le programme se lit comme une liste d'actions claires,
        et on corrige un bug à un seul endroit.

        Une fonction \`void\` **ne renvoie rien** : elle fait une action (afficher une ligne, un menu…).

        **Définition** (le mode d'emploi) : \`void afficher_ligne(void) { ... }\`.
        **Appel** (l'utilisation) : \`afficher_ligne();\` — n'oublie pas les parenthèses !

        Le compilateur lit de haut en bas : définis tes fonctions **au-dessus** de main (ou déclare leur prototype, leçon 3).
      `,
      syntaxe: {
        code: t`
          void nom_fonction(void)
          {
              // instructions
          }

          // appel :
          nom_fonction();
        `,
        note: 'void devant : ne renvoie rien. (void) entre parenthèses : ne reçoit rien.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          void ligne(void)
          {
              printf("====================\n");
          }

          void titre(void)
          {
              ligne();
              printf("   ACADEMIE DU CODE\n");
              ligne();
          }

          int main(void)
          {
              titre();
              printf("Bienvenue !\n");
              ligne();
              return 0;
          }
        `,
        lines: {
          3: 'Définition : la fonction ligne affiche une bordure.',
          10: 'Une fonction peut en appeler une autre.',
          17: 'L\'exécution commence toujours dans main : elle appelle titre…',
          19: '… et réutilise ligne une troisième fois.',
        },
      },
      visualisation: { kind: 'trace', note: 'Observe la pile d\'appels : main → titre → ligne, puis le retour dans la fonction appelante.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              saluer();
              return 0;
          }

          void saluer(void)
          {
              printf("Salut !\n");
          }
        `,
        explication: 'saluer est utilisée dans main AVANT d\'être déclarée : quand le compilateur lit la ligne 5, il ne la connaît pas encore. Il faut la définir au-dessus de main, ou écrire son prototype en haut.',
        correction: t`
          #include <stdio.h>

          void saluer(void)
          {
              printf("Salut !\n");
          }

          int main(void)
          {
              saluer();
              return 0;
          }
        `,
      },
      python: { py: 'def ligne():\n    print("=====")\n\nligne()', c: 'void ligne(void)\n{\n    printf("=====\\n");\n}\n\nligne();', note: 'def devient le type de retour (ici void) ; le corps est entre accolades.' },
      guide: ex({
        id: 'w6l1-guide',
        mode: 'complete',
        title: 'Le cri de guerre',
        prompt: 'Complète pour définir la fonction `cri` et l\'appeler deux fois. Le programme affiche deux fois `En avant !`.',
        template: t`
          #include <stdio.h>

          ⟦⟧ cri(void)
          {
              printf("En avant !\n");
          }

          int main(void)
          {
              ⟦⟧;
              cri();
              return 0;
          }
        `,
        blanks: [{ answer: 'void', width: 5 }, { answer: 'cri()', width: 6 }],
        hints: ['Le type de retour d\'une fonction qui ne renvoie rien.', 'Un appel : le nom suivi de parenthèses.'],
      }),
      mission: ex({
        id: 'w6l1-mission',
        mode: 'write',
        title: 'Le cadre réutilisable',
        prompt: 'Écris une fonction `void bordure(void)` qui affiche `+----------+` et une fonction `void case_vide(void)` qui affiche `|          |` (10 espaces). Dans main, utilise-les pour afficher :\n```\n+----------+\n|          |\n|          |\n+----------+\n```',
        solution: t`
          #include <stdio.h>

          void bordure(void)
          {
              printf("+----------+\n");
          }

          void case_vide(void)
          {
              printf("|          |\n");
          }

          int main(void)
          {
              bordure();
              case_vide();
              case_vide();
              bordure();
              return 0;
          }
        `,
        require: [{ pattern: 'void\\s+bordure\\s*\\(', message: 'Définis la fonction void bordure(void).' }, { pattern: 'void\\s+case_vide\\s*\\(', message: 'Définis la fonction void case_vide(void).' }],
        hints: ['Deux petites fonctions au-dessus de main, chacune avec un printf.', 'main ne contient que des appels.'],
      }),
      quiz: [
        { q: 'Que signifie `void` devant le nom d\'une fonction ?', choices: ['Elle est vide', 'Elle ne renvoie aucune valeur', 'Elle renvoie 0', 'Elle est inutile'], answer: 1, explain: 'void = « rien » comme résultat.' },
        { q: 'Comment appeler la fonction `menu` sans paramètre ?', choices: ['menu;', 'menu();', 'call menu;', 'void menu();'], answer: 1, explain: 'Nom + parenthèses + ;.' },
        { q: 'Pourquoi découper un programme en fonctions ?', choices: ['Pour qu\'il soit plus long', 'Pour éviter les répétitions et le rendre lisible', 'C\'est obligatoire', 'Pour éviter printf'], answer: 1, explain: 'Une fonction = une tâche, réutilisable.' },
      ],
      resume: [
        'Une fonction = un bloc nommé, réutilisable.',
        '`void f(void) { ... }` : ne reçoit rien, ne renvoie rien.',
        'Appel : `f();` avec les parenthèses.',
        'Définis-la avant main (ou utilise un prototype).',
      ],
    },
    {
      id: 'w6l2',
      title: 'Paramètres et valeur de retour',
      topic: 'syntax',
      skills: ['syntax', 'algo'],
      objectif: 'Donner des valeurs à une fonction (paramètres) et récupérer son résultat (return).',
      explication: t`
        Les **paramètres** sont les « entrées » de la fonction : \`int carre(int x)\` reçoit un entier nommé x.
        À l'appel \`carre(7)\`, x vaut 7 pendant l'exécution de la fonction.

        Le **type de retour** (ici \`int\`) annonce la sortie. \`return valeur;\` **termine** la fonction et renvoie la valeur
        à l'endroit de l'appel : \`int r = carre(7);\` met 49 dans r.

        Plusieurs paramètres se séparent par des virgules, chacun avec son type : \`double moyenne(int a, int b)\`.

        Une fonction non void doit **toujours** renvoyer une valeur, sur tous les chemins (sinon : warning
        « control reaches end of non-void function » et résultat imprévisible).
      `,
      syntaxe: {
        code: t`
          type_retour nom(type1 p1, type2 p2)
          {
              ...
              return valeur;
          }

          resultat = nom(arg1, arg2);
        `,
        note: 'Autant d\'arguments que de paramètres, dans le même ordre.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int carre(int x)
          {
              return x * x;
          }

          double moyenne(int a, int b)
          {
              return (a + b) / 2.0;
          }

          int max(int a, int b)
          {
              if (a > b) {
                  return a;
              }
              return b;
          }

          int main(void)
          {
              int r = carre(7);
              printf("%d\n", r);
              printf("%.1f\n", moyenne(12, 15));
              printf("%d\n", max(carre(3), 10));
              return 0;
          }
        `,
        lines: {
          3: 'x est un paramètre : il reçoit la valeur passée à l\'appel.',
          5: 'return renvoie le résultat et termine la fonction.',
          16: 'Plusieurs return possibles : le premier atteint termine la fonction.',
          24: 'La valeur renvoyée est rangée dans r.',
          26: 'On peut passer le résultat d\'un appel à un autre appel.',
        },
      },
      visualisation: { kind: 'trace', note: 'À chaque appel, la fonction reçoit ses propres boîtes (paramètres) ; elles disparaissent au return.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int signe(int n)
          {
              if (n > 0) {
                  return 1;
              } else if (n < 0) {
                  return -1;
              }
          }

          int main(void)
          {
              printf("%d\n", signe(5));
              return 0;
          }
        `,
        explication: 'Si n vaut 0, aucune branche ne fait return : la fonction se termine sans valeur. Le compilateur avertit « control reaches end of non-void function ». Il faut traiter tous les cas.',
        correction: t`
          #include <stdio.h>

          int signe(int n)
          {
              if (n > 0) {
                  return 1;
              } else if (n < 0) {
                  return -1;
              }
              return 0;
          }

          int main(void)
          {
              printf("%d\n", signe(5));
              return 0;
          }
        `,
      },
      python: { py: 'def carre(x):\n    return x * x', c: 'int carre(int x)\n{\n    return x * x;\n}', note: 'En C, chaque paramètre et le résultat ont un type déclaré.' },
      guide: ex({
        id: 'w6l2-guide',
        mode: 'complete',
        title: 'Conversion de température',
        prompt: 'Complète la fonction qui convertit des degrés Celsius en Fahrenheit (F = C × 9 / 5 + 32). Entrée `100` → `212.0`.',
        template: t`
          #include <stdio.h>

          ⟦⟧ vers_fahrenheit(double c)
          {
              ⟦⟧ c * 9.0 / 5 + 32;
          }

          int main(void)
          {
              double c;
              scanf("%lf", &c);
              printf("%.1f\n", vers_fahrenheit(⟦⟧));
              return 0;
          }
        `,
        blanks: [{ answer: 'double', width: 7 }, { answer: 'return', width: 7 }, { answer: 'c', width: 2 }],
        tests: [{ stdin: '100\n' }, { stdin: '-40\n' }, { stdin: '37.5\n', hidden: true }],
        hints: ['Le résultat est un réel : quel type de retour ?', 'Quel mot-clé renvoie une valeur ?', 'On passe la température lue en argument.'],
      }),
      mission: ex({
        id: 'w6l2-mission',
        mode: 'write',
        title: 'La puissance',
        prompt: 'Écris une fonction `long long puissance(int base, int exposant)` qui calcule base^exposant avec une boucle (exposant ≥ 0, pas de fonction pow). Dans main, lis base et exposant puis affiche le résultat. Entrée `2 10` → `1024`.',
        solution: t`
          #include <stdio.h>

          long long puissance(int base, int exposant)
          {
              long long r = 1;
              for (int i = 0; i < exposant; i++) {
                  r *= base;
              }
              return r;
          }

          int main(void)
          {
              int b, e;
              scanf("%d %d", &b, &e);
              printf("%lld\n", puissance(b, e));
              return 0;
          }
        `,
        tests: [{ stdin: '2 10\n' }, { stdin: '5 0\n' }, { stdin: '3 13\n', hidden: true }, { stdin: '-2 5\n', hidden: true }, { stdin: '10 18\n', hidden: true }],
        require: [{ pattern: 'puissance\\s*\\(\\s*int\\s+\\w+\\s*,\\s*int\\s+\\w+\\s*\\)', message: 'Définis puissance(int base, int exposant).' }],
        forbid: [{ pattern: '\\bpow\\s*\\(', message: 'N\'utilise pas pow : écris la boucle toi-même.' }],
        hints: ['Accumulateur r initialisé à 1.', 'Multiplie r par base, exposant fois.', 'Le résultat est un long long : %lld.'],
      }),
      quiz: [
        { q: 'Que renvoie `int f(int x) { return x + 1; }` pour `f(4)` ?', choices: ['4', '5', 'x + 1', 'Rien'], answer: 1, explain: 'x vaut 4, la fonction renvoie 5.' },
        { q: 'Que se passe-t-il après `return` ?', choices: ['La fonction continue', 'La fonction se termine immédiatement', 'Le programme s\'arrête', 'On recommence la fonction'], answer: 1, explain: 'return termine la fonction.' },
        { q: '`double moy(int a, int b)` appelée avec `moy(3)`…', choices: ['b vaut 0', 'Erreur : pas assez d\'arguments', 'b vaut 3', 'Fonctionne'], answer: 1, explain: 'too few arguments to function.' },
      ],
      resume: [
        'Paramètres = entrées typées ; return = sortie.',
        '`return` termine la fonction.',
        'Arguments dans le même ordre et nombre que les paramètres.',
        'Une fonction non void renvoie une valeur sur tous les chemins.',
      ],
    },
    {
      id: 'w6l3',
      title: 'Prototypes, portée et passage par valeur',
      topic: 'logic',
      skills: ['logic', 'memory'],
      objectif: 'Déclarer des prototypes, comprendre la portée des variables et le passage des arguments par copie.',
      explication: t`
        Un **prototype** annonce une fonction avant sa définition : \`int carre(int x);\` (avec un \`;\`).
        On place les prototypes en haut du fichier : main peut alors être écrit en premier.

        **Portée** : une variable déclarée dans une fonction (ou un bloc) n'existe **que là**.
        Deux fonctions peuvent avoir chacune leur variable \`i\` : ce sont des boîtes différentes.

        **Passage par valeur** : la fonction reçoit une **copie** des arguments. Modifier le paramètre
        ne change **pas** la variable de l'appelant. Pour modifier une variable de l'appelant, il faudra
        les pointeurs (Monde 8).

        Les variables **globales** (déclarées hors de toute fonction) sont visibles partout, mais
        rendent le programme difficile à suivre : évite-les.
      `,
      syntaxe: {
        code: t`
          int carre(int x);      // prototype : se termine par ;

          int main(void) { ... carre(3) ... }

          int carre(int x)       // définition
          {
              return x * x;
          }
        `,
        note: 'Le prototype et la définition doivent correspondre exactement.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          void tenter_doubler(int n);

          int main(void)
          {
              int n = 10;
              tenter_doubler(n);
              printf("Dans main, n vaut toujours %d\n", n);
              return 0;
          }

          void tenter_doubler(int n)
          {
              n = n * 2;
              printf("Dans la fonction, n vaut %d\n", n);
          }
        `,
        lines: {
          3: 'Prototype : main peut appeler tenter_doubler avant sa définition.',
          8: 'On passe une COPIE de n.',
          15: 'On modifie la copie… pas l\'original.',
          9: 'Le n de main n\'a pas changé.',
        },
      },
      visualisation: { kind: 'trace', note: 'Deux boîtes « n » à des adresses différentes : celle de main et celle de la fonction.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int aire(int largeur, int hauteur);

          int main(void)
          {
              printf("%d\n", aire(3, 4));
              return 0;
          }

          int aire(int largeur)
          {
              return largeur * largeur;
          }
        `,
        explication: 'Le prototype annonce deux paramètres, la définition n\'en a qu\'un : « conflicting types for aire ». Le prototype est un contrat que la définition doit respecter.',
        correction: t`
          #include <stdio.h>

          int aire(int largeur, int hauteur);

          int main(void)
          {
              printf("%d\n", aire(3, 4));
              return 0;
          }

          int aire(int largeur, int hauteur)
          {
              return largeur * hauteur;
          }
        `,
      },
      python: { py: 'def f(liste):\n    liste.append(1)  # modifie l\'original !', c: 'void f(int n) { n++; }  // ne modifie pas l\'original', note: 'En C, les int, double, char sont toujours copiés.' },
      guide: ex({
        id: 'w6l3-guide',
        mode: 'predict',
        title: 'Copie ou original ?',
        prompt: 'Que va afficher ce programme ?',
        code: t`
          #include <stdio.h>

          int ajouter(int x)
          {
              x = x + 5;
              return x;
          }

          int main(void)
          {
              int a = 1;
              int b = ajouter(a);
              printf("%d %d\n", a, b);
              return 0;
          }
        `,
        choices: ['6 6', '1 6', '1 1', '6 1'],
        hints: ['ajouter reçoit une copie de a.', 'Mais elle renvoie la valeur modifiée.'],
      }),
      mission: ex({
        id: 'w6l3-mission',
        mode: 'write',
        title: 'Programme avec prototypes',
        prompt: 'Écris main **en premier** (après les prototypes), puis deux fonctions définies après main :\n- `int est_pair(int n)` renvoie 1 si n est pair, 0 sinon ;\n- `int somme_pairs(int n)` renvoie la somme des nombres pairs de 1 à n en utilisant est_pair.\n\nmain lit n et affiche `Somme des pairs : <resultat>`. Entrée `10` → `Somme des pairs : 30`.',
        solution: t`
          #include <stdio.h>

          int est_pair(int n);
          int somme_pairs(int n);

          int main(void)
          {
              int n;
              scanf("%d", &n);
              printf("Somme des pairs : %d\n", somme_pairs(n));
              return 0;
          }

          int est_pair(int n)
          {
              return n % 2 == 0;
          }

          int somme_pairs(int n)
          {
              int s = 0;
              for (int i = 1; i <= n; i++) {
                  if (est_pair(i)) {
                      s += i;
                  }
              }
              return s;
          }
        `,
        tests: [{ stdin: '10\n' }, { stdin: '1\n' }, { stdin: '101\n', hidden: true }],
        require: [{ pattern: 'int\\s+est_pair\\s*\\(\\s*int\\s+\\w+\\s*\\)\\s*;', message: 'Écris le prototype de est_pair en haut du fichier.' }, { pattern: 'main[\\s\\S]*int\\s+somme_pairs\\s*\\([^)]*\\)\\s*\\{', message: 'Définis somme_pairs après main.' }],
        hints: ['Prototypes : int est_pair(int n); et int somme_pairs(int n);', 'est_pair peut simplement renvoyer n % 2 == 0.', 'somme_pairs : boucle de 1 à n, accumulateur.'],
      }),
      quiz: [
        { q: 'Un prototype se termine par…', choices: ['{', ';', ':', 'rien'], answer: 1, explain: 'int f(int x);' },
        { q: 'Une variable déclarée dans une fonction est visible…', choices: ['Partout', 'Seulement dans cette fonction (son bloc)', 'Dans main uniquement', 'Dans les fonctions appelées'], answer: 1, explain: 'C\'est sa portée.' },
        { q: 'Si une fonction modifie son paramètre int, la variable de l\'appelant…', choices: ['Change aussi', 'Ne change pas (c\'est une copie)', 'Devient 0', 'Provoque une erreur'], answer: 1, explain: 'Passage par valeur.' },
      ],
      resume: [
        'Prototype en haut : `int f(int x);`.',
        'Les variables locales n\'existent que dans leur bloc.',
        'Les arguments sont copiés (passage par valeur).',
        'Évite les variables globales.',
      ],
    },
    {
      id: 'w6l4',
      title: 'Découper un problème en fonctions',
      topic: 'algo',
      skills: ['algo', 'logic'],
      objectif: 'Analyser un problème, le décomposer en petites fonctions testables, et découvrir la récursivité.',
      explication: t`
        Face à un gros problème, on le **découpe** : chaque fonction fait **une seule chose** et porte un nom qui le dit
        (\`lire_note\`, \`calculer_moyenne\`, \`afficher_bulletin\`). main devient un résumé lisible du programme.

        Méthode :
        1. Écris en français les étapes du programme.
        2. Chaque étape devient une fonction (entrées = paramètres, sortie = return).
        3. Teste chaque fonction séparément.

        Une fonction peut aussi **s'appeler elle-même** : c'est la **récursivité**. Il faut un **cas d'arrêt**
        (sinon débordement de pile) et chaque appel doit se rapprocher de ce cas.
        Exemple : \`fact(n) = n × fact(n - 1)\` avec \`fact(0) = 1\`.
      `,
      syntaxe: {
        code: t`
          int fact(int n)
          {
              if (n <= 1) {       // cas d'arrêt
                  return 1;
              }
              return n * fact(n - 1);   // appel récursif
          }
        `,
        note: 'Toujours un cas d\'arrêt atteignable.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int est_premier(int n)
          {
              if (n < 2) {
                  return 0;
              }
              for (int d = 2; d * d <= n; d++) {
                  if (n % d == 0) {
                      return 0;
                  }
              }
              return 1;
          }

          int compter_premiers(int max)
          {
              int nb = 0;
              for (int i = 2; i <= max; i++) {
                  nb += est_premier(i);
              }
              return nb;
          }

          int fact(int n)
          {
              if (n <= 1) {
                  return 1;
              }
              return n * fact(n - 1);
          }

          int main(void)
          {
              printf("%d premiers jusqu'a 30\n", compter_premiers(30));
              printf("5! = %d\n", fact(5));
              return 0;
          }
        `,
        lines: {
          3: 'Une fonction = une question simple : n est-il premier ?',
          17: 'Une autre fonction réutilise la première.',
          26: 'Récursivité : fact s\'appelle elle-même avec n - 1…',
          28: '… jusqu\'au cas d\'arrêt n <= 1.',
          36: 'main se lit comme un résumé.',
        },
      },
      visualisation: { kind: 'trace', note: 'Pour fact(5), regarde la pile d\'appels s\'empiler (fact → fact → …) puis se dépiler.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int somme(int n)
          {
              return n + somme(n - 1);
          }

          int main(void)
          {
              printf("%d\n", somme(3));
              return 0;
          }
        `,
        explication: 'Pas de cas d\'arrêt : somme s\'appelle sans fin (3, 2, 1, 0, -1, …) jusqu\'à saturer la pile d\'appels (stack overflow).',
        correction: t`
          #include <stdio.h>

          int somme(int n)
          {
              if (n <= 0) {
                  return 0;
              }
              return n + somme(n - 1);
          }

          int main(void)
          {
              printf("%d\n", somme(3));
              return 0;
          }
        `,
      },
      python: { py: 'def fact(n):\n    return 1 if n <= 1 else n * fact(n - 1)', c: 'int fact(int n)\n{\n    if (n <= 1) return 1;\n    return n * fact(n - 1);\n}', note: 'Même idée ; en C aussi la pile a une taille limitée.' },
      guide: ex({
        id: 'w6l4-guide',
        mode: 'bug',
        title: 'Fibonacci cassé',
        prompt: 'fib(0) = 0, fib(1) = 1, fib(n) = fib(n-1) + fib(n-2). Ce programme plante : corrige le cas d\'arrêt. Entrée `10` → `55`.',
        starter: t`
          #include <stdio.h>

          int fib(int n)
          {
              if (n == 1) {
                  return 1;
              }
              return fib(n - 1) + fib(n - 2);
          }

          int main(void)
          {
              int n;
              scanf("%d", &n);
              printf("%d\n", fib(n));
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          int fib(int n)
          {
              if (n < 2) {
                  return n;
              }
              return fib(n - 1) + fib(n - 2);
          }

          int main(void)
          {
              int n;
              scanf("%d", &n);
              printf("%d\n", fib(n));
              return 0;
          }
        `,
        tests: [{ stdin: '10\n' }, { stdin: '0\n' }, { stdin: '20\n', hidden: true }],
        hints: ['fib(2) appelle fib(1) et fib(0). Que fait fib(0) ?', 'Le cas d\'arrêt doit couvrir 0 et 1.'],
      }),
      mission: ex({
        id: 'w6l4-mission',
        mode: 'write',
        title: 'Le bulletin découpé',
        prompt: 'Lis 3 notes entières. Écris et utilise trois fonctions :\n- `double moyenne3(int a, int b, int c)`\n- `const char *mention(double m)` qui renvoie `"Tres bien"` (≥ 16), `"Bien"` (≥ 14), `"Assez bien"` (≥ 12), `"Passable"` (≥ 10) ou `"Insuffisant"`\n- `void afficher(double m)` qui affiche `Moyenne : <m 2 decimales> (<mention>)`\n\nEntrée `15 17 16` → `Moyenne : 16.00 (Tres bien)`.',
        solution: t`
          #include <stdio.h>

          double moyenne3(int a, int b, int c)
          {
              return (a + b + c) / 3.0;
          }

          const char *mention(double m)
          {
              if (m >= 16) {
                  return "Tres bien";
              } else if (m >= 14) {
                  return "Bien";
              } else if (m >= 12) {
                  return "Assez bien";
              } else if (m >= 10) {
                  return "Passable";
              }
              return "Insuffisant";
          }

          void afficher(double m)
          {
              printf("Moyenne : %.2f (%s)\n", m, mention(m));
          }

          int main(void)
          {
              int a, b, c;
              scanf("%d %d %d", &a, &b, &c);
              afficher(moyenne3(a, b, c));
              return 0;
          }
        `,
        tests: [{ stdin: '15 17 16\n' }, { stdin: '8 9 12\n' }, { stdin: '14 13 15\n', hidden: true }, { stdin: '11 12 13\n', hidden: true }, { stdin: '20 0 10\n', hidden: true }],
        require: [{ pattern: 'double\\s+moyenne3\\s*\\(', message: 'Définis double moyenne3(int a, int b, int c).' }, { pattern: 'mention\\s*\\(\\s*double', message: 'Définis const char *mention(double m).' }, { pattern: 'void\\s+afficher\\s*\\(', message: 'Définis void afficher(double m).' }],
        hints: ['mention renvoie un texte : son type est const char * et on écrit return "Bien";', 'afficher utilise %s pour la mention.', 'main ne fait que lire et appeler.'],
      }),
      quiz: [
        { q: 'Quelle est la règle d\'or d\'une bonne fonction ?', choices: ['Elle fait le plus de choses possible', 'Elle fait une seule chose, bien nommée', 'Elle n\'a pas de paramètres', 'Elle est très longue'], answer: 1, explain: 'Une fonction = une responsabilité.' },
        { q: 'Que manque-t-il à toute fonction récursive qui plante par débordement de pile ?', choices: ['Un printf', 'Un cas d\'arrêt atteignable', 'Un prototype', 'Une variable globale'], answer: 1, explain: 'Sans cas d\'arrêt, les appels ne finissent jamais.' },
        { q: 'Combien vaut `fact(4)` avec fact(n) = n × fact(n-1), fact(1) = 1 ?', choices: ['10', '24', '16', '4'], answer: 1, explain: '4 × 3 × 2 × 1.' },
      ],
      resume: [
        'Découpe : une étape = une fonction au nom clair.',
        'main devient un résumé lisible.',
        'Récursivité : cas d\'arrêt + appel qui s\'en rapproche.',
        'Teste chaque fonction séparément.',
      ],
    },
  ],
  challenges: [
    ex({
      id: 'w6-c1', mode: 'write', kind: 'challenge', title: 'Projet 2 : Devine le nombre',
      prompt: 'Le nombre secret est tiré avec `srand(42);` puis `rand() % 100 + 1`. Lis des propositions jusqu\'à trouver le nombre (ou fin de l\'entrée). Pour chaque proposition, affiche `Plus grand`, `Plus petit` ou `Bravo ! Trouve en <n> essai(s)`. Si l\'entrée se termine sans trouver : `Perdu ! C\'etait <secret>`. Écris au moins une fonction `int comparer(int essai, int secret)` qui renvoie -1, 0 ou 1.',
      solution: t`
        #include <stdio.h>
        #include <stdlib.h>

        int comparer(int essai, int secret)
        {
            if (essai < secret) {
                return -1;
            }
            if (essai > secret) {
                return 1;
            }
            return 0;
        }

        int main(void)
        {
            srand(42);
            int secret = rand() % 100 + 1;
            int essai, n = 0;
            while (scanf("%d", &essai) == 1) {
                n++;
                int r = comparer(essai, secret);
                if (r < 0) {
                    printf("Plus grand\n");
                } else if (r > 0) {
                    printf("Plus petit\n");
                } else {
                    printf("Bravo ! Trouve en %d essai(s)\n", n);
                    return 0;
                }
            }
            printf("Perdu ! C'etait %d\n", secret);
            return 0;
        }
      `,
      tests: [{ stdin: '50 25 12\n' }, { stdin: '50 75 63 69 72 71 70\n' }, { stdin: '1 2 3\n', hidden: true }],
      require: [{ pattern: 'int\\s+comparer\\s*\\(', message: 'Écris la fonction int comparer(int essai, int secret).' }],
      hints: ['#include <stdlib.h> pour srand et rand.', 'Une boucle while (scanf(...) == 1).', 'Le secret avec srand(42) est toujours le même : les tests sont reproductibles.'],
    }),
    ex({
      id: 'w6-c2', mode: 'write', kind: 'challenge', title: 'PGCD récursif',
      prompt: 'Écris `int pgcd(int a, int b)` **récursive** avec l\'algorithme d\'Euclide : pgcd(a, 0) = a, sinon pgcd(b, a % b). Lis deux entiers positifs et affiche leur PGCD. Entrée `84 36` → `12`.',
      solution: t`
        #include <stdio.h>

        int pgcd(int a, int b)
        {
            if (b == 0) {
                return a;
            }
            return pgcd(b, a % b);
        }

        int main(void)
        {
            int a, b;
            scanf("%d %d", &a, &b);
            printf("%d\n", pgcd(a, b));
            return 0;
        }
      `,
      tests: [{ stdin: '84 36\n' }, { stdin: '17 5\n', hidden: true }, { stdin: '100 75\n', hidden: true }],
      require: [{ pattern: 'pgcd\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*pgcd\\s*\\(', message: 'La fonction pgcd doit s\'appeler elle-même.' }],
      hints: ['Cas d\'arrêt : b == 0.', 'Appel récursif : pgcd(b, a % b).'],
    }),
  ],
  boss: {
    id: 'boss-w6',
    name: 'Le Monolithe',
    avatar: 'monolith',
    taunt: 'Mille lignes dans main ! Pas une seule fonction ! Je suis indestructible… et illisible !',
    defeat: 'Découpé… en petites briques élégantes… Je redeviens un programme clair.',
    timeLimit: 1020,
    phases: [
      ex({
        id: 'boss-w6-p1', mode: 'predict', title: 'Phase 1 : la pile d\'appels',
        prompt: 'Que va afficher ce programme ?',
        code: t`
          #include <stdio.h>

          int f(int n)
          {
              if (n == 0) {
                  return 0;
              }
              printf("%d ", n);
              return n + f(n - 1);
          }

          int main(void)
          {
              int r = f(3);
              printf("= %d\n", r);
              return 0;
          }
        `,
        choices: ['3 2 1 = 6', '1 2 3 = 6', '3 2 1 0 = 6', '= 6'],
        hints: ['Le printf est AVANT l\'appel récursif.'],
      }),
      ex({
        id: 'boss-w6-p2', mode: 'bug', title: 'Phase 2 : le contrat rompu',
        prompt: 'Corrige ce programme pour qu\'il affiche l\'aire et le périmètre d\'un rectangle lu au clavier. Entrée `3 4.5` → `Aire : 13.50` et `Perimetre : 15.00`.',
        starter: t`
          #include <stdio.h>

          double aire(double l, double h);
          double perimetre(double l, double h);

          int main(void)
          {
              double l, h;
              scanf("%lf %lf", &l, &h);
              printf("Aire : %.2f\n", aire(l));
              printf("Perimetre : %.2f\n", perimetre(l, h));
              return 0;
          }

          double aire(double l, double h)
          {
              return l * h;
          }

          int perimetre(double l, double h)
          {
              2 * (l + h);
          }
        `,
        solution: t`
          #include <stdio.h>

          double aire(double l, double h);
          double perimetre(double l, double h);

          int main(void)
          {
              double l, h;
              scanf("%lf %lf", &l, &h);
              printf("Aire : %.2f\n", aire(l, h));
              printf("Perimetre : %.2f\n", perimetre(l, h));
              return 0;
          }

          double aire(double l, double h)
          {
              return l * h;
          }

          double perimetre(double l, double h)
          {
              return 2 * (l + h);
          }
        `,
        tests: [{ stdin: '3 4.5\n' }, { stdin: '1 1\n', hidden: true }],
        hints: ['Combien d\'arguments attend aire ?', 'perimetre : le type de retour doit correspondre au prototype.', 'Une valeur calculée doit être renvoyée avec return.'],
      }),
      ex({
        id: 'boss-w6-p3', mode: 'write', title: 'Phase 3 : les nombres parfaits',
        prompt: 'Un nombre est **parfait** s\'il est égal à la somme de ses diviseurs propres (6 = 1 + 2 + 3). Écris `int somme_diviseurs(int n)` (diviseurs de 1 à n-1) et `int est_parfait(int n)`. Lis un entier max et affiche les nombres parfaits de 2 à max, séparés par des espaces, sur une ligne. Entrée `500` → `6 28 496`.',
        solution: t`
          #include <stdio.h>

          int somme_diviseurs(int n)
          {
              int s = 0;
              for (int d = 1; d < n; d++) {
                  if (n % d == 0) {
                      s += d;
                  }
              }
              return s;
          }

          int est_parfait(int n)
          {
              return somme_diviseurs(n) == n;
          }

          int main(void)
          {
              int max;
              scanf("%d", &max);
              int premier = 1;
              for (int n = 2; n <= max; n++) {
                  if (est_parfait(n)) {
                      printf(premier ? "%d" : " %d", n);
                      premier = 0;
                  }
              }
              printf("\n");
              return 0;
          }
        `,
        tests: [{ stdin: '500\n' }, { stdin: '10\n', hidden: true }, { stdin: '30\n', hidden: true }],
        require: [{ pattern: 'int\\s+somme_diviseurs\\s*\\(', message: 'Écris int somme_diviseurs(int n).' }, { pattern: 'int\\s+est_parfait\\s*\\(', message: 'Écris int est_parfait(int n).' }],
        hints: ['somme_diviseurs : boucle d de 1 à n-1, ajoute d si n % d == 0.', 'Pour les espaces : n\'en mets pas avant le premier nombre.'],
      }),
    ],
  },
};
