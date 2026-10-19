import { t, ex } from '../helpers.js';

export default {
  id: 'w8',
  num: 8,
  title: 'Pointeurs et Mémoire',
  subtitle: 'Adresses, & et *, pointeurs et fonctions, pointeurs et tableaux, NULL',
  color: '#f87171',
  icon: '📍',
  intro: t`
    Te voici dans la Cartographie de la Mémoire : chaque variable y habite une maison, et chaque maison a une adresse.
    Un pointeur est une boîte qui contient… l'adresse d'une autre boîte. C'est le super-pouvoir du C,
    et le terrain de chasse du Seigneur du Segfault. Avance prudemment, avec le visualiseur.
  `,
  lessons: [
    {
      id: 'w8l1',
      title: 'Adresses, & et *',
      topic: 'memory',
      skills: ['memory'],
      objectif: 'Comprendre la mémoire comme une rangée de cases numérotées, obtenir une adresse avec & et lire/écrire à travers un pointeur avec *.',
      explication: t`
        La mémoire est une immense rangée de cases numérotées : ce numéro est l'**adresse**.
        Chaque variable occupe une ou plusieurs cases à une certaine adresse.

        - \`&x\` : l'**adresse** de x (« où habite x ? »).
        - \`int *p;\` déclare un **pointeur vers int** : une variable qui contient une adresse.
        - \`p = &x;\` : p « pointe vers » x.
        - \`*p\` : la **valeur à l'adresse** contenue dans p (« ce qu'il y a dans la maison »). \`*p = 5;\` modifie donc x !

        Analogie : x est une maison, &x son adresse postale, p un papier sur lequel l'adresse est écrite, *p « aller à cette adresse ».

        Le type du pointeur indique le type de la valeur pointée : un \`int *\` pointe vers un int, un \`double *\` vers un double.
        On affiche une adresse avec \`%p\` (et un cast \`(void *)\`).
      `,
      syntaxe: {
        code: t`
          int x = 10;
          int *p = &x;     // p contient l'adresse de x
          *p = 20;         // x vaut maintenant 20
          printf("%d\n", *p);
        `,
        note: 'Dans une déclaration, * signifie « pointeur ». Dans une expression, *p signifie « valeur pointée ».',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int x = 10;
              int *p = &x;
              printf("x = %d, *p = %d\n", x, *p);
              *p = 20;
              printf("x vaut maintenant %d\n", x);
              int y = 3;
              p = &y;
              *p = *p * 100;
              printf("y = %d\n", y);
              printf("p contient bien l'adresse de y : %d\n", p == &y);
              return 0;
          }
        `,
        lines: {
          6: 'p reçoit l\'adresse de x : il « pointe vers » x.',
          8: 'Écrire *p, c\'est écrire dans x.',
          11: 'Un pointeur peut changer de cible.',
          12: '*p désigne maintenant y.',
        },
      },
      visualisation: { kind: 'trace', note: 'Regarde les adresses : p contient l\'adresse de x (flèche « pointe vers x »), puis celle de y.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int *p;
              *p = 42;
              printf("%d\n", *p);
              return 0;
          }
        `,
        explication: 'p est déclaré mais n\'a jamais reçu d\'adresse : il contient une valeur au hasard. Écrire *p écrit n\'importe où dans la mémoire → plantage (segmentation fault). Un pointeur doit toujours être initialisé.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int x = 0;
              int *p = &x;
              *p = 42;
              printf("%d\n", *p);
              return 0;
          }
        `,
      },
      python: { py: 'a = [1]\nb = a      # b référence la même liste\nb[0] = 9  # a change aussi', c: 'int x = 1;\nint *p = &x;\n*p = 9;   /* x change aussi */', note: 'Python manipule des références en cachette ; le C te donne les adresses explicitement.' },
      guide: ex({
        id: 'w8l1-guide',
        mode: 'predict',
        title: 'Suivre la flèche',
        prompt: 'Que va afficher ce programme ?',
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int a = 5, b = 8;
              int *p = &a;
              *p += 10;
              p = &b;
              *p = *p - a;
              printf("%d %d\n", a, b);
              return 0;
          }
        `,
        choices: ['15 -7', '5 8', '15 8', '5 -7'],
        hints: ['*p += 10 modifie a.', 'Ensuite p pointe vers b : b reçoit 8 - 15.'],
      }),
      mission: ex({
        id: 'w8l1-mission',
        mode: 'write',
        title: 'Modifier à distance',
        prompt: 'Lis deux entiers a et b. Déclare **un seul** pointeur `p`. Avec p (et sans écrire `a =` ni `b =` après la lecture), double a puis ajoute 1 à b. Affiche `a = <a>, b = <b>`.\n\nEntrée `4 9` → `a = 8, b = 10`.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int a, b;
              scanf("%d %d", &a, &b);
              int *p = &a;
              *p = *p * 2;
              p = &b;
              *p = *p + 1;
              printf("a = %d, b = %d\n", a, b);
              return 0;
          }
        `,
        tests: [{ stdin: '4 9\n' }, { stdin: '-3 0\n', hidden: true }],
        require: [{ pattern: '\\*\\s*p\\s*=', message: 'Modifie les valeurs à travers le pointeur : *p = ...' }],
        forbid: [{ pattern: '\\b[ab]\\s*=[^=]', message: 'N\'écris pas directement a = ... ou b = ... : passe par le pointeur.' }],
        hints: ['int *p = &a; puis *p = *p * 2;', 'Fais ensuite pointer p vers b.'],
      }),
      quiz: [
        { q: 'Que contient un pointeur ?', choices: ['Une valeur entière quelconque', 'Une adresse mémoire', 'Un tableau', 'Un caractère'], answer: 1, explain: 'Un pointeur stocke une adresse.' },
        { q: 'Avec `int x = 3; int *p = &x;`, que vaut `*p` ?', choices: ['L\'adresse de x', '3', '&x', 'p'], answer: 1, explain: '*p : la valeur à l\'adresse pointée.' },
        { q: 'Que fait `*p = 7;` si p pointe vers x ?', choices: ['Change p', 'Change x en 7', 'Erreur', 'Rien'], answer: 1, explain: 'On écrit à l\'adresse de x.' },
        { q: 'Pourquoi `int *p; *p = 1;` est dangereux ?', choices: ['p n\'est pas initialisé : il pointe n\'importe où', 'Il manque un printf', '1 n\'est pas un pointeur', 'Ce n\'est pas dangereux'], answer: 0, explain: 'Toujours initialiser un pointeur.' },
      ],
      resume: [
        '`&x` = adresse de x ; `int *p` = pointeur vers int.',
        '`*p` = valeur pointée (lecture et écriture).',
        'Un pointeur non initialisé est une bombe : initialise-le.',
        'Afficher une adresse : `%p` avec `(void *)`.',
      ],
    },
    {
      id: 'w8l2',
      title: 'Pointeurs et fonctions',
      topic: 'memory',
      skills: ['memory', 'algo'],
      objectif: 'Permettre à une fonction de modifier les variables de l\'appelant et de renvoyer plusieurs résultats.',
      explication: t`
        Rappel (Monde 6) : une fonction reçoit une **copie** de ses arguments. Elle ne peut donc pas modifier
        les variables de l'appelant… sauf si on lui donne leur **adresse** !

        \`void echanger(int *a, int *b)\` reçoit deux adresses ; à l'intérieur, \`*a\` et \`*b\` sont les vraies variables.
        L'appel s'écrit \`echanger(&x, &y);\`.

        C'est exactement ce que fait \`scanf("%d", &n)\` : on lui donne l'adresse de n pour qu'il y écrive.

        Autre usage : **renvoyer plusieurs résultats**. Une fonction n'a qu'un \`return\`, mais elle peut remplir
        des variables via des pointeurs : \`void division(int a, int b, int *q, int *r)\`.
      `,
      syntaxe: {
        code: t`
          void echanger(int *a, int *b)
          {
              int tmp = *a;
              *a = *b;
              *b = tmp;
          }

          echanger(&x, &y);
        `,
        note: 'Paramètre int * → appel avec &variable.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          void echanger(int *a, int *b)
          {
              int tmp = *a;
              *a = *b;
              *b = tmp;
          }

          void division(int a, int b, int *quotient, int *reste)
          {
              *quotient = a / b;
              *reste = a % b;
          }

          int main(void)
          {
              int x = 1, y = 2;
              echanger(&x, &y);
              printf("x = %d, y = %d\n", x, y);
              int q, r;
              division(17, 5, &q, &r);
              printf("17 = 5 x %d + %d\n", q, r);
              return 0;
          }
        `,
        lines: {
          3: 'a et b contiennent les adresses de x et y.',
          6: 'On écrit directement dans les variables de main.',
          10: 'Deux résultats renvoyés via deux pointeurs.',
          19: 'On passe les adresses avec &.',
        },
      },
      visualisation: { kind: 'trace', note: 'Dans echanger, a et b « pointent vers » x et y de main : regarde x et y changer à distance.' },
      erreur: {
        code: t`
          #include <stdio.h>

          void remise_a_zero(int n)
          {
              n = 0;
          }

          int main(void)
          {
              int score = 50;
              remise_a_zero(score);
              printf("%d\n", score);
              return 0;
          }
        `,
        logic: true,
        explication: 'La fonction reçoit une copie de score : elle met la copie à 0, l\'original reste 50. Il faut passer l\'adresse : void remise_a_zero(int *n) { *n = 0; } et appeler remise_a_zero(&score).',
        correction: t`
          #include <stdio.h>

          void remise_a_zero(int *n)
          {
              *n = 0;
          }

          int main(void)
          {
              int score = 50;
              remise_a_zero(&score);
              printf("%d\n", score);
              return 0;
          }
        `,
      },
      python: { py: 'def echanger(a, b):\n    return b, a\nx, y = echanger(x, y)', c: 'void echanger(int *a, int *b);\nechanger(&x, &y);', note: 'Python renvoie un tuple ; le C modifie directement les variables via leurs adresses.' },
      guide: ex({
        id: 'w8l2-guide',
        mode: 'complete',
        title: 'Le triple',
        prompt: 'Complète la fonction qui triple la variable passée en argument. Entrée `7` → `21`.',
        template: t`
          #include <stdio.h>

          void tripler(int ⟦⟧n)
          {
              ⟦⟧n = 3 * *n;
          }

          int main(void)
          {
              int v;
              scanf("%d", &v);
              tripler(⟦⟧v);
              printf("%d\n", v);
              return 0;
          }
        `,
        blanks: [{ answer: '*', width: 2 }, { answer: '*', width: 2 }, { answer: '&', width: 2 }],
        tests: [{ stdin: '7\n' }, { stdin: '-2\n', hidden: true }],
        hints: ['Le paramètre est un pointeur vers int.', 'On écrit dans la variable pointée.', 'À l\'appel, on donne l\'adresse.'],
      }),
      mission: ex({
        id: 'w8l2-mission',
        mode: 'write',
        title: 'Min et max en un appel',
        prompt: 'Écris `void min_max(const int t[], int n, int *min, int *max)` qui remplit *min et *max. Dans main, lis n (≤ 100) puis n entiers, appelle min_max et affiche `min = <min>, max = <max>`.\n\nEntrée `5` puis `3 9 -2 7 4` → `min = -2, max = 9`.',
        solution: t`
          #include <stdio.h>

          void min_max(const int t[], int n, int *min, int *max)
          {
              *min = t[0];
              *max = t[0];
              for (int i = 1; i < n; i++) {
                  if (t[i] < *min) {
                      *min = t[i];
                  }
                  if (t[i] > *max) {
                      *max = t[i];
                  }
              }
          }

          int main(void)
          {
              int n;
              int t[100];
              scanf("%d", &n);
              for (int i = 0; i < n; i++) {
                  scanf("%d", &t[i]);
              }
              int mn, mx;
              min_max(t, n, &mn, &mx);
              printf("min = %d, max = %d\n", mn, mx);
              return 0;
          }
        `,
        tests: [{ stdin: '5\n3 9 -2 7 4\n' }, { stdin: '1\n6\n', hidden: true }, { stdin: '4\n-1 -1 -1 -1\n', hidden: true }],
        require: [{ pattern: 'min_max\\s*\\([^)]*int\\s*\\*\\s*\\w+\\s*,\\s*int\\s*\\*', message: 'min_max doit recevoir deux pointeurs int *min, int *max.' }],
        hints: ['Initialise *min et *max avec t[0].', 'Dans main, déclare deux int et passe leurs adresses.'],
      }),
      quiz: [
        { q: 'Pour qu\'une fonction modifie un int de l\'appelant, son paramètre doit être…', choices: ['int', 'int *', 'int[]', 'void'], answer: 1, explain: 'Un pointeur vers int.' },
        { q: 'Comment appeler `void f(int *p)` avec la variable n ?', choices: ['f(n);', 'f(*n);', 'f(&n);', 'f(p);'], answer: 2, explain: 'On passe l\'adresse.' },
        { q: 'Pourquoi scanf a-t-il besoin de &n ?', choices: ['Pour afficher n', 'Pour écrire dans n via son adresse', 'Par convention seulement', 'Pour aller plus vite'], answer: 1, explain: 'Même principe que nos fonctions.' },
      ],
      resume: [
        'Paramètre `int *p` + appel `f(&x)` : la fonction modifie x.',
        'Dans la fonction, utiliser `*p`.',
        'Plusieurs résultats : plusieurs pointeurs en paramètres.',
        'C\'est le principe de scanf.',
      ],
    },
    {
      id: 'w8l3',
      title: 'Pointeurs et tableaux',
      topic: 'memory',
      skills: ['memory', 'algo'],
      objectif: 'Comprendre le lien entre tableaux et pointeurs, et l\'arithmétique des pointeurs.',
      explication: t`
        Le nom d'un tableau, utilisé dans une expression, devient **l'adresse de sa première case** : \`t\` vaut \`&t[0]\`.

        **Arithmétique des pointeurs** : si \`p\` pointe vers \`t[0]\`, alors \`p + 1\` pointe vers \`t[1]\` (l'adresse avance de
        la taille d'**une case**, par exemple 4 octets pour un int, pas d'un octet).
        Ainsi \`*(p + i)\` est exactement \`t[i]\` — d'ailleurs \`t[i]\` est défini comme \`*(t + i)\`.

        On peut parcourir un tableau avec un pointeur : \`for (int *p = t; p < t + n; p++)\`.
        Soustraire deux pointeurs d'un même tableau donne le nombre de cases qui les séparent.

        C'est pour cela qu'un tableau passé à une fonction n'est pas copié : la fonction reçoit un pointeur, et peut donc **modifier** le tableau de l'appelant.
      `,
      syntaxe: {
        code: t`
          int t[5];
          int *p = t;        // = &t[0]
          *(p + 2) = 7;      // = t[2] = 7
          p++;               // p pointe vers t[1]
        `,
        note: 't[i] ≡ *(t + i)',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          void doubler_tout(int *t, int n)
          {
              for (int i = 0; i < n; i++) {
                  t[i] *= 2;
              }
          }

          int main(void)
          {
              int t[4] = {10, 20, 30, 40};
              int *p = t;
              printf("%d %d %d\n", *p, *(p + 2), p[3]);
              p++;
              printf("p pointe vers t[%td] qui vaut %d\n", p - t, *p);
              doubler_tout(t, 4);
              for (int *q = t; q < t + 4; q++) {
                  printf("%d ", *q);
              }
              printf("\n");
              return 0;
          }
        `,
        lines: {
          13: 't seul = adresse de t[0].',
          14: '*(p + 2) et p[3] : deux écritures de l\'accès aux cases.',
          15: 'p avance d\'une case (4 octets).',
          16: 'p - t : nombre de cases d\'écart (%td pour ce type).',
          17: 'La fonction reçoit l\'adresse : elle modifie le vrai tableau.',
          18: 'Parcours avec un pointeur qui avance.',
        },
      },
      visualisation: { kind: 'trace', note: 'Regarde p : « pointe vers t[0] », puis « t[1] » après p++. Et q qui parcourt toutes les cases.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int t[3] = {1, 2, 3};
              int *p = t;
              for (int i = 0; i < 4; i++) {
                  printf("%d\n", *p);
                  p++;
              }
              return 0;
          }
        `,
        explication: 'Le pointeur avance d\'une case de trop : au 4e tour il pointe juste après t et lit hors du tableau. Avec les pointeurs, on garde la même discipline des bornes qu\'avec les indices.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int t[3] = {1, 2, 3};
              for (int *p = t; p < t + 3; p++) {
                  printf("%d\n", *p);
              }
              return 0;
          }
        `,
      },
      python: { py: 't[2]', c: 't[2]  /* ou *(t + 2) */', note: 'Python n\'expose pas d\'adresses ; en C, l\'indice n\'est qu\'un déplacement depuis le début du tableau.' },
      guide: ex({
        id: 'w8l3-guide',
        mode: 'predict',
        title: 'Arithmétique des pointeurs',
        prompt: 'Que va afficher ce programme ?',
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int t[] = {5, 10, 15, 20, 25};
              int *p = t + 1;
              int *q = &t[4];
              printf("%d %d %td\n", *p, *(q - 1), q - p);
              return 0;
          }
        `,
        choices: ['10 20 3', '5 20 4', '10 25 3', '10 20 12'],
        hints: ['t + 1 pointe vers t[1].', 'q - p compte des cases, pas des octets.'],
      }),
      mission: ex({
        id: 'w8l3-mission',
        mode: 'write',
        title: 'Inverser un tableau en place',
        prompt: 'Écris `void inverser(int *debut, int *fin)` qui inverse les éléments entre deux pointeurs (inclus) en les échangeant deux à deux et en rapprochant les pointeurs. Dans main, lis n (≤ 100) puis n entiers, appelle `inverser(t, t + n - 1)` et affiche le tableau (séparé par des espaces).\n\nEntrée `5` puis `1 2 3 4 5` → `5 4 3 2 1`.',
        solution: t`
          #include <stdio.h>

          void inverser(int *debut, int *fin)
          {
              while (debut < fin) {
                  int tmp = *debut;
                  *debut = *fin;
                  *fin = tmp;
                  debut++;
                  fin--;
              }
          }

          int main(void)
          {
              int n;
              int t[100];
              scanf("%d", &n);
              for (int i = 0; i < n; i++) {
                  scanf("%d", &t[i]);
              }
              inverser(t, t + n - 1);
              for (int i = 0; i < n; i++) {
                  printf(i ? " %d" : "%d", t[i]);
              }
              printf("\n");
              return 0;
          }
        `,
        tests: [{ stdin: '5\n1 2 3 4 5\n' }, { stdin: '4\n9 8 7 6\n', hidden: true }, { stdin: '1\n42\n', hidden: true }],
        require: [{ pattern: 'inverser\\s*\\(\\s*int\\s*\\*\\s*\\w+\\s*,\\s*int\\s*\\*', message: 'Écris void inverser(int *debut, int *fin).' }],
        hints: ['Tant que debut < fin : échange *debut et *fin.', 'Puis debut++ et fin--.'],
      }),
      quiz: [
        { q: 'Que vaut `t` (nom d\'un tableau) dans une expression ?', choices: ['La première valeur', 'L\'adresse de t[0]', 'La taille du tableau', 'Une copie du tableau'], answer: 1, explain: 't ≡ &t[0].' },
        { q: '`*(t + 3)` est équivalent à…', choices: ['t[3]', '*t + 3', 't + 3', '&t[3]'], answer: 0, explain: 'Définition de l\'indexation.' },
        { q: 'Si p pointe vers un int à l\'adresse 1000, où pointe p + 1 ?', choices: ['1001', '1004', '1008', '2000'], answer: 1, explain: 'Un int occupe 4 octets.' },
      ],
      resume: [
        'Le nom d\'un tableau = adresse de sa première case.',
        '`t[i]` ≡ `*(t + i)`.',
        '`p + 1` avance d\'une case (sizeof du type).',
        'Une fonction qui reçoit un tableau peut le modifier.',
      ],
    },
    {
      id: 'w8l4',
      title: 'NULL et les erreurs de pointeurs',
      topic: 'debug',
      skills: ['memory', 'debug'],
      objectif: 'Utiliser NULL comme « aucune adresse », tester les pointeurs et reconnaître les erreurs classiques.',
      explication: t`
        \`NULL\` est une adresse spéciale qui signifie **« ne pointe vers rien »**. Initialise un pointeur sans cible à NULL,
        et **teste-le** avant de l'utiliser : \`if (p != NULL) { ... }\`.
        Déréférencer NULL (\`*p\` quand p vaut NULL) provoque une **erreur de segmentation**.

        Les erreurs classiques avec les pointeurs :
        1. **Pointeur non initialisé** : contient une adresse au hasard.
        2. **Déréférencement de NULL** : oubli de test (fopen, malloc peuvent renvoyer NULL).
        3. **Adresse d'une variable locale renvoyée** : la variable disparaît à la fin de la fonction (pointeur « pendant »).
        4. **Sortie de tableau** par arithmétique de pointeurs.
        5. **Confusion \`*\` / \`&\`** : le compilateur te prévient (types incompatibles).

        C Quest détecte ces erreurs à l'exécution et t'indique la ligne — le vrai C, lui, plante ou, pire, continue avec des données corrompues.
      `,
      syntaxe: {
        code: t`
          int *p = NULL;
          if (p != NULL) {
              *p = 1;
          }
        `,
        note: 'NULL = « aucune cible ». Teste avant d\'utiliser.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int *chercher(int *t, int n, int valeur)
          {
              for (int i = 0; i < n; i++) {
                  if (t[i] == valeur) {
                      return &t[i];
                  }
              }
              return NULL;
          }

          int main(void)
          {
              int t[] = {4, 8, 15, 16};
              int *p = chercher(t, 4, 15);
              if (p != NULL) {
                  *p = 99;
                  printf("Trouve et remplace : t[2] = %d\n", t[2]);
              }
              int *q = chercher(t, 4, 42);
              if (q == NULL) {
                  printf("42 introuvable\n");
              }
              return 0;
          }
        `,
        lines: {
          7: 'On renvoie l\'adresse de la case trouvée (elle appartient à main, elle reste valide).',
          10: 'NULL signifie « pas trouvé ».',
          17: 'Toujours tester avant de déréférencer.',
        },
      },
      visualisation: { kind: 'trace', note: 'p pointe vers t[2] ; q vaut NULL.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int *creer_compteur(void)
          {
              int compteur = 10;
              return &compteur;
          }

          int main(void)
          {
              int *p = creer_compteur();
              printf("%d\n", *p);
              return 0;
          }
        `,
        explication: 'compteur est une variable locale : elle disparaît quand creer_compteur se termine. Le pointeur renvoyé désigne une zone qui n\'existe plus (pointeur pendant). Le compilateur avertit et C Quest bloque l\'accès. Solution : renvoyer la valeur, ou utiliser malloc (Monde 10).',
        correction: t`
          #include <stdio.h>

          int creer_compteur(void)
          {
              int compteur = 10;
              return compteur;
          }

          int main(void)
          {
              int v = creer_compteur();
              printf("%d\n", v);
              return 0;
          }
        `,
      },
      python: { py: 'x = None\nif x is not None: ...', c: 'int *p = NULL;\nif (p != NULL) { ... }', note: 'NULL joue le rôle de None… mais l\'utiliser par erreur fait planter le programme.' },
      guide: ex({
        id: 'w8l4-guide',
        mode: 'bug',
        title: 'Le pointeur imprudent',
        prompt: 'Ce programme plante quand le nombre recherché est absent. Corrige-le pour afficher `Absent` dans ce cas. Entrée `8` → `Trouve a l\'indice 1 (valeur 8)`, entrée `5` → `Absent`.',
        starter: t`
          #include <stdio.h>

          int *trouver(int *t, int n, int v)
          {
              for (int i = 0; i < n; i++) {
                  if (t[i] == v) {
                      return &t[i];
                  }
              }
              return NULL;
          }

          int main(void)
          {
              int t[] = {3, 8, 13, 21};
              int v;
              scanf("%d", &v);
              int *p = trouver(t, 4, v);
              printf("Trouve a l'indice %td (valeur %d)\n", p - t, *p);
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          int *trouver(int *t, int n, int v)
          {
              for (int i = 0; i < n; i++) {
                  if (t[i] == v) {
                      return &t[i];
                  }
              }
              return NULL;
          }

          int main(void)
          {
              int t[] = {3, 8, 13, 21};
              int v;
              scanf("%d", &v);
              int *p = trouver(t, 4, v);
              if (p == NULL) {
                  printf("Absent\n");
              } else {
                  printf("Trouve a l'indice %td (valeur %d)\n", p - t, *p);
              }
              return 0;
          }
        `,
        tests: [{ stdin: '8\n' }, { stdin: '5\n' }, { stdin: '21\n', hidden: true }],
        hints: ['Que renvoie trouver quand v est absent ?', 'Teste p == NULL avant d\'utiliser *p.'],
      }),
      mission: ex({
        id: 'w8l4-mission',
        mode: 'write',
        title: 'Premier mot qui commence par…',
        prompt: 'Écris `const char *premier_avec(const char *mots[], int n, char lettre)` qui renvoie le premier mot commençant par `lettre`, ou NULL. Dans main, utilise le tableau `{"pomme", "banane", "cerise", "brocoli"}`, lis une lettre (`scanf(" %c", ...)`) et affiche le mot trouvé ou `Aucun mot`.\n\nEntrée `b` → `banane`, entrée `z` → `Aucun mot`.',
        solution: t`
          #include <stdio.h>

          const char *premier_avec(const char *mots[], int n, char lettre)
          {
              for (int i = 0; i < n; i++) {
                  if (mots[i][0] == lettre) {
                      return mots[i];
                  }
              }
              return NULL;
          }

          int main(void)
          {
              const char *mots[] = {"pomme", "banane", "cerise", "brocoli"};
              char c;
              scanf(" %c", &c);
              const char *m = premier_avec(mots, 4, c);
              if (m == NULL) {
                  printf("Aucun mot\n");
              } else {
                  printf("%s\n", m);
              }
              return 0;
          }
        `,
        tests: [{ stdin: 'b\n' }, { stdin: 'z\n' }, { stdin: 'c\n', hidden: true }, { stdin: 'p\n', hidden: true }],
        require: [{ pattern: 'NULL', message: 'Renvoie NULL quand aucun mot ne convient, et teste-le.' }],
        hints: ['mots[i][0] est la première lettre du mot i.', 'Retourne mots[i] dès qu\'il convient, NULL à la fin.', 'Dans main, teste le résultat avant de l\'afficher.'],
      }),
      quiz: [
        { q: 'Que signifie un pointeur qui vaut NULL ?', choices: ['Il pointe vers 0', 'Il ne pointe vers rien', 'Il pointe vers main', 'Il est non initialisé'], answer: 1, explain: 'NULL = aucune cible.' },
        { q: 'Que se passe-t-il avec `*p` si p vaut NULL ?', choices: ['On lit 0', 'Erreur de segmentation', 'Erreur de compilation', 'Rien'], answer: 1, explain: 'Déréférencer NULL fait planter.' },
        { q: 'Pourquoi ne pas renvoyer `&locale` depuis une fonction ?', choices: ['C\'est trop lent', 'La variable locale disparaît à la fin de la fonction', 'Interdit par la syntaxe', 'Il faut un cast'], answer: 1, explain: 'Pointeur pendant.' },
        { q: 'Quelle habitude évite la plupart des plantages ?', choices: ['Ne jamais utiliser de pointeurs', 'Initialiser les pointeurs et tester NULL', 'Utiliser des variables globales', 'Ajouter des printf'], answer: 1, explain: 'Initialiser + tester.' },
      ],
      resume: [
        '`NULL` = aucune adresse ; initialise les pointeurs sans cible à NULL.',
        'Teste `p != NULL` avant `*p`.',
        'Ne renvoie jamais l\'adresse d\'une variable locale.',
        'Lis attentivement les warnings sur les types de pointeurs.',
      ],
    },
  ],
  challenges: [
    ex({
      id: 'w8-c1', mode: 'write', kind: 'challenge', title: 'Tri par sélection avec pointeurs',
      prompt: 'Écris `void echanger(int *a, int *b)` et `void trier(int *t, int n)` (tri par sélection : à chaque étape, cherche le minimum de la partie non triée et échange-le avec la première case non triée). Lis n (≤ 100) et n entiers, trie, affiche.\n\nEntrée `5` puis `4 1 3 9 2` → `1 2 3 4 9`.',
      solution: t`
        #include <stdio.h>

        void echanger(int *a, int *b)
        {
            int tmp = *a;
            *a = *b;
            *b = tmp;
        }

        void trier(int *t, int n)
        {
            for (int i = 0; i < n - 1; i++) {
                int imin = i;
                for (int j = i + 1; j < n; j++) {
                    if (t[j] < t[imin]) {
                        imin = j;
                    }
                }
                echanger(&t[i], &t[imin]);
            }
        }

        int main(void)
        {
            int n, t[100];
            scanf("%d", &n);
            for (int i = 0; i < n; i++) {
                scanf("%d", &t[i]);
            }
            trier(t, n);
            for (int i = 0; i < n; i++) {
                printf(i ? " %d" : "%d", t[i]);
            }
            printf("\n");
            return 0;
        }
      `,
      tests: [{ stdin: '5\n4 1 3 9 2\n' }, { stdin: '6\n-1 5 -7 0 5 3\n', hidden: true }],
      hints: ['echanger(&t[i], &t[imin]) : on passe des adresses de cases.'],
    }),
  ],
  boss: {
    id: 'boss-w8',
    name: 'Le Seigneur du Segfault',
    avatar: 'segfault',
    taunt: 'Un astérisque de trop, un NULL oublié… et BOUM : Segmentation fault (core dumped). Ha ha ha !',
    defeat: 'Chaque pointeur… initialisé… chaque NULL… testé. Je n\'ai plus aucune prise sur toi.',
    timeLimit: 1080,
    phases: [
      ex({
        id: 'boss-w8-p1', mode: 'predict', title: 'Phase 1 : la carte des adresses',
        prompt: 'Que va afficher ce programme ?',
        code: t`
          #include <stdio.h>

          void f(int *a, int b)
          {
              *a = *a + b;
              b = 0;
          }

          int main(void)
          {
              int x = 2, y = 5;
              int *p = &y;
              f(&x, y);
              f(p, x);
              printf("%d %d\n", x, y);
              return 0;
          }
        `,
        choices: ['7 12', '7 5', '2 12', '7 0'],
        hints: ['Premier appel : x devient 2 + 5.', 'Deuxième appel : y devient 5 + 7 ; b = 0 ne change que la copie.'],
      }),
      ex({
        id: 'boss-w8-p2', mode: 'bug', title: 'Phase 2 : le champ de mines',
        prompt: 'Ce programme doit lire 3 entiers et afficher leur somme et leur produit via la fonction `calculer`. Il contient plusieurs erreurs de pointeurs. Corrige-le : entrée `2 3 4` → `Somme : 9, produit : 24`.',
        starter: t`
          #include <stdio.h>

          void calculer(const int *t, int n, int *somme, int *produit)
          {
              somme = 0;
              produit = 1;
              for (int i = 0; i < n; i++) {
                  *somme += t[i];
                  *produit *= t[i];
              }
          }

          int main(void)
          {
              int t[3];
              for (int i = 0; i < 3; i++) {
                  scanf("%d", &t[i]);
              }
              int s, p;
              calculer(t, 3, s, p);
              printf("Somme : %d, produit : %d\n", s, p);
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          void calculer(const int *t, int n, int *somme, int *produit)
          {
              *somme = 0;
              *produit = 1;
              for (int i = 0; i < n; i++) {
                  *somme += t[i];
                  *produit *= t[i];
              }
          }

          int main(void)
          {
              int t[3];
              for (int i = 0; i < 3; i++) {
                  scanf("%d", &t[i]);
              }
              int s, p;
              calculer(t, 3, &s, &p);
              printf("Somme : %d, produit : %d\n", s, p);
              return 0;
          }
        `,
        tests: [{ stdin: '2 3 4\n' }, { stdin: '-1 5 2\n', hidden: true }],
        hints: ['somme = 0 change le POINTEUR (il devient NULL), pas la valeur pointée.', 'À l\'appel, il faut les adresses de s et p.'],
      }),
      ex({
        id: 'boss-w8-p3', mode: 'write', title: 'Phase 3 : la recherche dichotomique',
        prompt: 'Écris `const int *dichotomie(const int *t, int n, int v)` qui cherche v dans un tableau **trié** en coupant l\'intervalle en deux à chaque étape, et renvoie un pointeur vers la case trouvée ou NULL. Le tableau est `{2, 3, 5, 7, 11, 13, 17, 19, 23, 29}`. Lis v et affiche `Indice <i>` (calculé avec une soustraction de pointeurs) ou `Absent`.',
        solution: t`
          #include <stdio.h>

          const int *dichotomie(const int *t, int n, int v)
          {
              int g = 0, d = n - 1;
              while (g <= d) {
                  int m = (g + d) / 2;
                  if (t[m] == v) {
                      return t + m;
                  }
                  if (t[m] < v) {
                      g = m + 1;
                  } else {
                      d = m - 1;
                  }
              }
              return NULL;
          }

          int main(void)
          {
              const int t[] = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29};
              int v;
              scanf("%d", &v);
              const int *p = dichotomie(t, 10, v);
              if (p == NULL) {
                  printf("Absent\n");
              } else {
                  printf("Indice %td\n", p - t);
              }
              return 0;
          }
        `,
        tests: [{ stdin: '13\n' }, { stdin: '4\n' }, { stdin: '2\n', hidden: true }, { stdin: '29\n', hidden: true }, { stdin: '30\n', hidden: true }],
        hints: ['Deux bornes g et d ; milieu m = (g + d) / 2.', 'Si t[m] < v, cherche à droite (g = m + 1), sinon à gauche.', 'Indice = p - t (affiché avec %td).'],
      }),
    ],
  },
};
