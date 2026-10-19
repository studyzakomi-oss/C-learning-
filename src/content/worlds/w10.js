import { t, ex } from '../helpers.js';

export default {
  id: 'w10',
  num: 10,
  title: 'Le Maître du Code',
  subtitle: 'Mémoire dynamique, algorithmes et complexité, débogage, programmation modulaire et projet final',
  color: '#818cf8',
  icon: '👑',
  intro: t`
    Tu as atteint la Tour du Maître. Ici, la mémoire n'est plus fixée d'avance : tu la demandes au système
    et tu dois la rendre. Les programmes deviennent de vrais logiciels, découpés en modules, mesurés, débogués.
    Au sommet t'attend le Glitch en personne. Tout ce que tu as appris sera nécessaire.
  `,
  lessons: [
    {
      id: 'w10l1',
      title: 'malloc et free : la mémoire dynamique',
      topic: 'memory',
      skills: ['memory'],
      objectif: 'Réserver de la mémoire à l\'exécution avec malloc, l\'utiliser comme un tableau et la libérer avec free.',
      explication: t`
        Jusqu'ici, la taille des tableaux était fixée à l'écriture du programme. Avec la **mémoire dynamique**,
        on réserve la taille exacte **pendant l'exécution**, dans une zone appelée le **tas** (heap).

        - \`malloc(taille_en_octets)\` réserve un bloc et renvoie son adresse (un \`void *\`), ou **NULL** si c'est impossible.
          On calcule toujours la taille avec sizeof : \`int *t = malloc(n * sizeof(int));\`.
        - Le bloc s'utilise comme un tableau : \`t[i]\`.
        - \`free(t);\` **rend** la mémoire. Chaque malloc doit avoir **exactement un** free.

        Erreurs classiques : oublier de tester NULL ; oublier free (**fuite mémoire**) ; utiliser le bloc après free ;
        libérer deux fois. C Quest les détecte toutes et affiche les fuites en fin d'exécution.

        Bonne habitude : après \`free(p);\`, écrire \`p = NULL;\`.
      `,
      syntaxe: {
        code: t`
          #include <stdlib.h>
          int *t = malloc(n * sizeof(int));
          if (t == NULL) {
              return 1;
          }
          t[0] = 42;
          free(t);
          t = NULL;
        `,
        note: 'malloc → test NULL → utilisation → free.',
      },
      exemple: {
        code: t`
          #include <stdio.h>
          #include <stdlib.h>

          int main(void)
          {
              int n;
              scanf("%d", &n);
              int *carres = malloc(n * sizeof(int));
              if (carres == NULL) {
                  printf("Memoire insuffisante\n");
                  return 1;
              }
              for (int i = 0; i < n; i++) {
                  carres[i] = (i + 1) * (i + 1);
              }
              for (int i = 0; i < n; i++) {
                  printf("%d ", carres[i]);
              }
              printf("\n");
              free(carres);
              carres = NULL;
              return 0;
          }
        `,
        stdin: '6\n',
        lines: {
          8: 'On réserve exactement n entiers, n étant connu seulement à l\'exécution.',
          9: 'malloc peut échouer : on teste NULL.',
          14: 'Le bloc s\'utilise comme un tableau.',
          20: 'On rend la mémoire…',
          21: '… et on neutralise le pointeur.',
        },
      },
      visualisation: { kind: 'trace', note: 'carres pointe vers un « bloc alloué » dans le tas, et non vers une variable de main.' },
      erreur: {
        code: t`
          #include <stdio.h>
          #include <stdlib.h>

          int main(void)
          {
              for (int k = 0; k < 3; k++) {
                  double *v = malloc(100 * sizeof(double));
                  if (v == NULL) {
                      return 1;
                  }
                  v[0] = k;
                  printf("%.1f\n", v[0]);
              }
              return 0;
          }
        `,
        explication: 'Chaque tour de boucle réserve 800 octets… qui ne sont jamais libérés : c\'est une fuite mémoire. Sur un programme qui tourne longtemps, la mémoire finit par s\'épuiser. Il manque free(v) à la fin de chaque tour.',
        correction: t`
          #include <stdio.h>
          #include <stdlib.h>

          int main(void)
          {
              for (int k = 0; k < 3; k++) {
                  double *v = malloc(100 * sizeof(double));
                  if (v == NULL) {
                      return 1;
                  }
                  v[0] = k;
                  printf("%.1f\n", v[0]);
                  free(v);
              }
              return 0;
          }
        `,
      },
      python: { py: 't = [0] * n   # le ramasse-miettes libère seul', c: 'int *t = malloc(n * sizeof(int));\n/* ... */\nfree(t);   /* c\'est TOI qui libères */', note: 'Python libère la mémoire automatiquement ; en C, c\'est ta responsabilité.' },
      guide: ex({
        id: 'w10l1-guide',
        mode: 'complete',
        title: 'Le tableau sur mesure',
        prompt: 'Complète pour réserver n réels, les lire, afficher leur somme avec 1 décimale, puis libérer. Entrée `3` puis `1.5 2 3.5` → `7.0`.',
        template: t`
          #include <stdio.h>
          #include <stdlib.h>

          int main(void)
          {
              int n;
              scanf("%d", &n);
              double *t = malloc(n * ⟦⟧);
              if (t == ⟦⟧) {
                  return 1;
              }
              double s = 0;
              for (int i = 0; i < n; i++) {
                  scanf("%lf", &t[i]);
                  s += t[i];
              }
              printf("%.1f\n", s);
              ⟦⟧(t);
              return 0;
          }
        `,
        blanks: [{ answer: 'sizeof(double)', width: 15 }, { answer: 'NULL', width: 5 }, { answer: 'free', width: 5 }],
        tests: [{ stdin: '3\n1.5 2 3.5\n' }, { stdin: '1\n-4\n', hidden: true }],
        hints: ['La taille d\'un élément se calcule avec sizeof.', 'malloc renvoie cette valeur en cas d\'échec.', 'La fonction qui rend la mémoire.'],
      }),
      mission: ex({
        id: 'w10l1-mission',
        mode: 'write',
        title: 'Copie dynamique d\'une chaîne',
        prompt: 'Écris `char *dupliquer(const char *s)` qui alloue **exactement** strlen(s) + 1 octets, y copie s et renvoie la copie (ou NULL). Dans main, lis un mot (≤ 99 lettres), duplique-le, mets la copie en majuscules, affiche `Original : <mot>` puis `Copie : <COPIE>`, et libère la mémoire. Aucune fuite n\'est tolérée.',
        solution: t`
          #include <stdio.h>
          #include <stdlib.h>
          #include <string.h>
          #include <ctype.h>

          char *dupliquer(const char *s)
          {
              char *c = malloc(strlen(s) + 1);
              if (c == NULL) {
                  return NULL;
              }
              strcpy(c, s);
              return c;
          }

          int main(void)
          {
              char mot[100];
              scanf("%99s", mot);
              char *copie = dupliquer(mot);
              if (copie == NULL) {
                  return 1;
              }
              for (size_t i = 0; copie[i] != '\0'; i++) {
                  copie[i] = (char) toupper(copie[i]);
              }
              printf("Original : %s\n", mot);
              printf("Copie : %s\n", copie);
              free(copie);
              return 0;
          }
        `,
        tests: [{ stdin: 'tour\n' }, { stdin: 'MaitreDuCode\n', hidden: true }],
        require: [{ pattern: 'malloc\\s*\\(\\s*strlen', message: 'Alloue exactement strlen(s) + 1 octets.' }, { pattern: '\\bfree\\s*\\(', message: 'Libère la copie avec free.' }],
        hints: ['+1 pour le \'\\0\' !', 'strcpy(copie, s) après l\'allocation.', 'free(copie) avant la fin de main.'],
      }),
      quiz: [
        { q: 'Que renvoie malloc si la mémoire est insuffisante ?', choices: ['0 octet', 'NULL', '-1', 'Un bloc vide'], answer: 1, explain: 'Toujours tester NULL.' },
        { q: 'Comment réserver un tableau de n double ?', choices: ['malloc(n)', 'malloc(n * sizeof(double))', 'malloc(sizeof(n))', 'new double[n]'], answer: 1, explain: 'malloc compte en octets.' },
        { q: 'Qu\'est-ce qu\'une fuite mémoire ?', choices: ['Un pointeur NULL', 'Un bloc alloué jamais libéré', 'Un tableau trop petit', 'Une boucle infinie'], answer: 1, explain: 'La mémoire reste occupée inutilement.' },
        { q: 'Après `free(p);`, que vaut-il mieux faire ?', choices: ['Réutiliser *p', 'p = NULL;', 'free(p) encore', 'Rien'], answer: 1, explain: 'Évite l\'utilisation après libération et la double libération.' },
      ],
      resume: [
        '`malloc(n * sizeof(type))` → tester NULL.',
        'Le bloc s\'utilise comme un tableau.',
        'Un malloc = un free ; puis `p = NULL`.',
        'Jamais d\'accès après free, jamais de double free.',
      ],
    },
    {
      id: 'w10l2',
      title: 'calloc, realloc et tableaux qui grandissent',
      topic: 'memory',
      skills: ['memory', 'algo'],
      objectif: 'Allouer une zone mise à zéro avec calloc, agrandir un bloc avec realloc et construire un tableau dynamique.',
      explication: t`
        - \`calloc(n, sizeof(type))\` : comme malloc, mais **remplit de zéros**. Pratique pour des compteurs.
        - \`realloc(p, nouvelle_taille)\` : **agrandit** (ou réduit) un bloc. Les anciennes valeurs sont conservées.
          realloc peut déplacer le bloc : il renvoie la **nouvelle** adresse (ou NULL en cas d'échec, l'ancien bloc restant valide).

        Écriture sûre :
        \`int *tmp = realloc(t, nouvelle * sizeof(int)); if (tmp == NULL) { free(t); return 1; } t = tmp;\`
        (Écrire directement \`t = realloc(t, ...)\` perdrait l'ancien bloc si realloc échoue.)

        **Tableau dynamique** : on garde \`taille\` (éléments utilisés) et \`capacite\` (place réservée).
        Quand c'est plein, on **double** la capacité : peu de realloc, ajout rapide en moyenne.
      `,
      syntaxe: {
        code: t`
          int *c = calloc(n, sizeof(int));      // n zéros
          int *tmp = realloc(t, cap * 2 * sizeof(int));
          if (tmp == NULL) { free(t); return 1; }
          t = tmp;
          cap *= 2;
        `,
        note: 'realloc via un pointeur temporaire.',
      },
      exemple: {
        code: t`
          #include <stdio.h>
          #include <stdlib.h>

          int main(void)
          {
              int capacite = 2, taille = 0, v;
              int *t = malloc(capacite * sizeof(int));
              if (t == NULL) {
                  return 1;
              }
              while (scanf("%d", &v) == 1) {
                  if (taille == capacite) {
                      int *tmp = realloc(t, 2 * capacite * sizeof(int));
                      if (tmp == NULL) {
                          free(t);
                          return 1;
                      }
                      t = tmp;
                      capacite *= 2;
                      printf("(capacite -> %d)\n", capacite);
                  }
                  t[taille++] = v;
              }
              for (int i = 0; i < taille; i++) {
                  printf("%d ", t[i]);
              }
              printf("\n");
              free(t);
              return 0;
          }
        `,
        stdin: '5 8 13 21 34\n',
        lines: {
          7: 'Départ modeste : 2 cases.',
          12: 'Plein ? On double la capacité.',
          13: 'realloc dans un pointeur temporaire.',
          21: 'On range la valeur puis on incrémente taille.',
        },
      },
      visualisation: { kind: 'trace', note: 'Observe capacite passer de 2 à 4 puis 8, et t changer d\'adresse lors du realloc.' },
      erreur: {
        code: t`
          #include <stdio.h>
          #include <stdlib.h>

          int main(void)
          {
              int *a = malloc(3 * sizeof(int));
              if (a == NULL) {
                  return 1;
              }
              a[0] = 1;
              free(a);
              a[0] = 2;
              printf("%d\n", a[0]);
              return 0;
          }
        `,
        explication: 'Le bloc est utilisé APRÈS free : il ne nous appartient plus (utilisation après libération). C\'est une des failles de sécurité les plus courantes. C Quest arrête le programme à la ligne 12.',
        correction: t`
          #include <stdio.h>
          #include <stdlib.h>

          int main(void)
          {
              int *a = malloc(3 * sizeof(int));
              if (a == NULL) {
                  return 1;
              }
              a[0] = 1;
              a[0] = 2;
              printf("%d\n", a[0]);
              free(a);
              a = NULL;
              return 0;
          }
        `,
      },
      python: { py: 'liste.append(v)  # grandit tout seul', c: 'if (taille == cap) { /* realloc x2 */ }\nt[taille++] = v;', note: 'Une liste Python fait exactement ce doublement de capacité… en coulisses.' },
      guide: ex({
        id: 'w10l2-guide',
        mode: 'predict',
        title: 'calloc et realloc',
        prompt: 'Que va afficher ce programme ?',
        code: t`
          #include <stdio.h>
          #include <stdlib.h>

          int main(void)
          {
              int *t = calloc(3, sizeof(int));
              if (t == NULL) {
                  return 1;
              }
              t[1] = 7;
              int *tmp = realloc(t, 5 * sizeof(int));
              if (tmp == NULL) {
                  free(t);
                  return 1;
              }
              t = tmp;
              t[3] = 9;
              t[4] = 1;
              printf("%d %d %d %d %d\n", t[0], t[1], t[2], t[3], t[4]);
              free(t);
              return 0;
          }
        `,
        choices: ['0 7 0 9 1', '7 0 0 9 1', '0 7 0 0 0', '? 7 ? 9 1'],
        hints: ['calloc met tout à zéro.', 'realloc conserve les anciennes valeurs.'],
      }),
      mission: ex({
        id: 'w10l2-mission',
        mode: 'write',
        title: 'Lecture d\'une liste de longueur inconnue',
        prompt: 'Lis des entiers jusqu\'à la fin de l\'entrée dans un tableau dynamique (capacité initiale 4, doublée quand c\'est plein). Affiche ensuite `n = <nombre>`, puis les nombres **pairs** dans l\'ordre de lecture, séparés par des espaces (ligne vide s\'il n\'y en a pas). Libère tout.',
        solution: t`
          #include <stdio.h>
          #include <stdlib.h>

          int main(void)
          {
              int cap = 4, n = 0, v;
              int *t = malloc(cap * sizeof(int));
              if (t == NULL) {
                  return 1;
              }
              while (scanf("%d", &v) == 1) {
                  if (n == cap) {
                      int *tmp = realloc(t, 2 * cap * sizeof(int));
                      if (tmp == NULL) {
                          free(t);
                          return 1;
                      }
                      t = tmp;
                      cap *= 2;
                  }
                  t[n++] = v;
              }
              printf("n = %d\n", n);
              int premier = 1;
              for (int i = 0; i < n; i++) {
                  if (t[i] % 2 == 0) {
                      printf(premier ? "%d" : " %d", t[i]);
                      premier = 0;
                  }
              }
              printf("\n");
              free(t);
              return 0;
          }
        `,
        tests: [{ stdin: '3 8 1 4 6 9 10 12 7\n' }, { stdin: '\n' }, { stdin: '1 3 5\n', hidden: true }],
        require: [{ pattern: '\\brealloc\\s*\\(', message: 'Fais grandir le tableau avec realloc.' }, { pattern: '\\bfree\\s*\\(', message: 'Libère le tableau.' }],
        hints: ['Garde n (taille) et cap (capacité).', 'Quand n == cap : realloc(t, 2 * cap * sizeof(int)) via un pointeur temporaire.'],
      }),
      quiz: [
        { q: 'Quelle différence entre malloc et calloc ?', choices: ['Aucune', 'calloc met la zone à zéro', 'malloc est plus sûr', 'calloc ne renvoie jamais NULL'], answer: 1, explain: 'calloc initialise à 0.' },
        { q: 'Pourquoi passer par un pointeur temporaire avec realloc ?', choices: ['C\'est plus rapide', 'Si realloc échoue (NULL), on ne perd pas l\'ancien bloc', 'C\'est obligatoire', 'Pour éviter un warning'], answer: 1, explain: 't = realloc(t, ...) perdrait t en cas d\'échec.' },
        { q: 'Pourquoi doubler la capacité plutôt qu\'ajouter 1 case ?', choices: ['Pour gaspiller', 'Pour faire peu de realloc (ajout rapide en moyenne)', 'Parce que realloc l\'exige', 'Pour trier'], answer: 1, explain: 'Moins de copies au total.' },
      ],
      resume: [
        '`calloc(n, taille)` : zone à zéro.',
        '`realloc` conserve les données, peut déplacer le bloc.',
        'Toujours `tmp = realloc(...)` puis tester.',
        'Tableau dynamique : taille + capacité, doubler quand plein.',
      ],
    },
    {
      id: 'w10l3',
      title: 'Algorithmes et complexité',
      topic: 'algo',
      skills: ['algo'],
      objectif: 'Comparer des algorithmes par leur nombre d\'opérations (complexité) et utiliser qsort.',
      explication: t`
        Deux programmes corrects peuvent avoir des vitesses très différentes. La **complexité** mesure comment le nombre
        d'opérations grandit avec la taille n des données :

        - **O(1)** : constant (accès à \`t[i]\`).
        - **O(log n)** : on divise le problème par deux à chaque étape (recherche dichotomique). 1 million → ~20 étapes.
        - **O(n)** : un parcours (somme, maximum, recherche simple).
        - **O(n log n)** : les bons tris (\`qsort\`).
        - **O(n²)** : deux boucles imbriquées (tri à bulles). 1 million → 10¹² opérations : trop lent !

        Compte les **tours de boucle** pour estimer la complexité. Une boucle dans une boucle sur n éléments → n².

        La bibliothèque standard offre \`qsort(t, n, sizeof t[0], comparer)\` : tu fournis seulement une fonction
        de comparaison qui renvoie un nombre négatif, nul ou positif.
      `,
      syntaxe: {
        code: t`
          int comparer(const void *a, const void *b)
          {
              int x = *(const int *) a;
              int y = *(const int *) b;
              return (x > y) - (x < y);
          }
          qsort(t, n, sizeof t[0], comparer);
        `,
        note: 'La comparaison renvoie < 0, 0 ou > 0.',
      },
      exemple: {
        code: t`
          #include <stdio.h>
          #include <stdlib.h>

          long long ops = 0;

          int comparer(const void *a, const void *b)
          {
              int x = *(const int *) a;
              int y = *(const int *) b;
              return (x > y) - (x < y);
          }

          void tri_bulles(int *t, int n)
          {
              for (int i = 0; i < n - 1; i++) {
                  for (int j = 0; j < n - 1 - i; j++) {
                      ops++;
                      if (t[j] > t[j + 1]) {
                          int tmp = t[j];
                          t[j] = t[j + 1];
                          t[j + 1] = tmp;
                      }
                  }
              }
          }

          int main(void)
          {
              int n = 1000;
              int *a = malloc(n * sizeof(int));
              int *b = malloc(n * sizeof(int));
              if (a == NULL || b == NULL) {
                  free(a);
                  free(b);
                  return 1;
              }
              srand(1);
              for (int i = 0; i < n; i++) {
                  a[i] = rand() % 10000;
                  b[i] = a[i];
              }
              tri_bulles(a, n);
              qsort(b, n, sizeof b[0], comparer);
              printf("Comparaisons du tri a bulles : %lld\n", ops);
              printf("Memes resultats : %d\n", a[0] == b[0] && a[n - 1] == b[n - 1]);
              free(a);
              free(b);
              return 0;
          }
        `,
        lines: {
          6: 'La fonction de comparaison reçoit des adresses génériques (void *).',
          16: 'Deux boucles imbriquées : environ n²/2 comparaisons.',
          43: 'qsort trie en O(n log n).',
          44: 'Pour n = 1000 : près de 500 000 comparaisons pour le tri à bulles.',
        },
      },
      visualisation: {
        kind: 'trace',
        note: 'Version miniature (5 éléments) : compte les tours des deux boucles du tri à bulles.',
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int t[5] = {5, 1, 4, 2, 3};
              int ops = 0;
              for (int i = 0; i < 4; i++) {
                  for (int j = 0; j < 4 - i; j++) {
                      ops++;
                      if (t[j] > t[j + 1]) {
                          int tmp = t[j];
                          t[j] = t[j + 1];
                          t[j + 1] = tmp;
                      }
                  }
              }
              printf("%d comparaisons\n", ops);
              return 0;
          }
        `,
      },
      erreur: {
        code: t`
          #include <stdio.h>

          int compter_doublons(const int *t, int n)
          {
              int c = 0;
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < n; j++) {
                      if (t[i] == t[j]) {
                          c++;
                      }
                  }
              }
              return c;
          }

          int main(void)
          {
              int t[4] = {1, 2, 2, 3};
              printf("%d\n", compter_doublons(t, 4));
              return 0;
          }
        `,
        logic: true,
        explication: 'La boucle intérieure part de 0 : chaque élément est comparé à lui-même (et chaque paire comptée deux fois). On obtient 6 au lieu de 1. Il faut j de i + 1 à n : chaque paire n\'est examinée qu\'une fois (et deux fois moins d\'opérations).',
        correction: t`
          #include <stdio.h>

          int compter_doublons(const int *t, int n)
          {
              int c = 0;
              for (int i = 0; i < n; i++) {
                  for (int j = i + 1; j < n; j++) {
                      if (t[i] == t[j]) {
                          c++;
                      }
                  }
              }
              return c;
          }

          int main(void)
          {
              int t[4] = {1, 2, 2, 3};
              printf("%d\n", compter_doublons(t, 4));
              return 0;
          }
        `,
      },
      python: { py: 'sorted(t)', c: 'qsort(t, n, sizeof t[0], comparer);', note: 'Comme sorted(), qsort est en O(n log n) ; mais tu fournis la comparaison.' },
      guide: ex({
        id: 'w10l3-guide',
        mode: 'complete',
        title: 'Tri décroissant avec qsort',
        prompt: 'Complète la comparaison pour que qsort trie par ordre **décroissant**. Entrée `5` puis `3 9 1 7 5` → `9 7 5 3 1`.',
        template: t`
          #include <stdio.h>
          #include <stdlib.h>

          int decroissant(const void *a, const void *b)
          {
              int x = *(const int *) a;
              int y = *(const int *) b;
              return (⟦⟧ > ⟦⟧) - (x > y);
          }

          int main(void)
          {
              int n, t[100];
              scanf("%d", &n);
              for (int i = 0; i < n; i++) {
                  scanf("%d", &t[i]);
              }
              qsort(t, n, sizeof t[0], ⟦⟧);
              for (int i = 0; i < n; i++) {
                  printf(i ? " %d" : "%d", t[i]);
              }
              printf("\n");
              return 0;
          }
        `,
        blanks: [{ answer: 'y', width: 2 }, { answer: 'x', width: 2 }, { answer: 'decroissant', width: 12 }],
        tests: [{ stdin: '5\n3 9 1 7 5\n' }, { stdin: '4\n-1 -5 0 2\n', hidden: true }],
        hints: ['Pour un ordre décroissant, x doit passer avant y quand x > y : le résultat doit être négatif.', 'qsort reçoit le nom de la fonction de comparaison.'],
      }),
      mission: ex({
        id: 'w10l3-mission',
        mode: 'write',
        title: 'Deux nombres qui font la somme',
        prompt: 'Lis n (≤ 100000), puis n entiers, puis une cible S. Affiche `Oui` s\'il existe deux éléments (à des positions différentes) dont la somme vaut S, sinon `Non`. Ton algorithme doit être en **O(n log n)** : trie avec qsort, puis utilise deux indices (un au début, un à la fin) qui se rapprochent. Une solution en O(n²) sera trop lente sur le test caché de 30 000 nombres.',
        solution: t`
          #include <stdio.h>
          #include <stdlib.h>

          int comparer(const void *a, const void *b)
          {
              int x = *(const int *) a;
              int y = *(const int *) b;
              return (x > y) - (x < y);
          }

          int main(void)
          {
              int n;
              if (scanf("%d", &n) != 1 || n < 0) {
                  return 1;
              }
              int *t = malloc((n > 0 ? n : 1) * sizeof(int));
              if (t == NULL) {
                  return 1;
              }
              for (int i = 0; i < n; i++) {
                  scanf("%d", &t[i]);
              }
              long long s;
              scanf("%lld", &s);
              qsort(t, n, sizeof t[0], comparer);
              int g = 0, d = n - 1, trouve = 0;
              while (g < d) {
                  long long somme = (long long) t[g] + t[d];
                  if (somme == s) {
                      trouve = 1;
                      break;
                  }
                  if (somme < s) {
                      g++;
                  } else {
                      d--;
                  }
              }
              printf(trouve ? "Oui\n" : "Non\n");
              free(t);
              return 0;
          }
        `,
        tests: [
          { stdin: '5\n8 3 11 5 1\n14\n' },
          { stdin: '4\n1 2 3 4\n9\n' },
          { stdin: '1\n7\n14\n', hidden: true },
          { name: 'Grand test (30 000 nombres)', stdin: '30000\n' + Array.from({ length: 30000 }, (_, i) => (i * 7919) % 1000003).join(' ') + '\n-5\n', hidden: true },
        ],
        require: [{ pattern: '\\bqsort\\s*\\(', message: 'Trie avec qsort.' }],
        hints: ['Après le tri : g = 0, d = n - 1.', 'Somme trop petite → g++ ; trop grande → d--.', 'Utilise malloc pour le tableau (n peut valoir 100 000).'],
      }),
      quiz: [
        { q: 'Quelle est la complexité de deux boucles imbriquées sur n éléments ?', choices: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], answer: 1, explain: 'n tours × n tours.' },
        { q: 'Combien d\'étapes au plus pour une recherche dichotomique dans 1 000 000 d\'éléments triés ?', choices: ['Environ 20', 'Environ 1000', '1 000 000', '500 000'], answer: 0, explain: '2^20 ≈ 1 million.' },
        { q: 'Que doit renvoyer la fonction de comparaison de qsort si a doit venir avant b ?', choices: ['Un nombre positif', 'Un nombre négatif', '0', 'true'], answer: 1, explain: 'Négatif : a avant b.' },
        { q: 'Quelle complexité pour qsort ?', choices: ['O(n)', 'O(n log n) en moyenne', 'O(n²) toujours', 'O(1)'], answer: 1, explain: 'Comme les bons tris.' },
      ],
      resume: [
        'Complexité = croissance du nombre d\'opérations avec n.',
        'O(log n) < O(n) < O(n log n) < O(n²).',
        'Boucles imbriquées → souvent O(n²).',
        '`qsort(t, n, sizeof t[0], comparer)`.',
      ],
    },
    {
      id: 'w10l4',
      title: 'Débogage, warnings et programmation modulaire',
      topic: 'debug',
      skills: ['debug', 'algo', 'memory'],
      objectif: 'Adopter une méthode de débogage, exploiter les avertissements, et assembler un programme modulaire complet.',
      explication: t`
        **Méthode de débogage** :
        1. **Reproduire** : trouve une entrée qui provoque le bug, la plus petite possible.
        2. **Lire** les messages : erreurs et **warnings** (compile avec \`-Wall -Wextra\` ; un warning est souvent un bug).
        3. **Isoler** : ajoute des \`printf\` de contrôle (« debug prints ») ou utilise un visualiseur pas à pas.
        4. **Formuler une hypothèse**, corriger UNE chose, re-tester.
        5. **Vérifier** les cas limites : 0, 1, négatif, maximum, entrée vide.

        \`assert(condition);\` (\`<assert.h>\`) arrête le programme si une condition supposée vraie est fausse : idéal pour
        vérifier ses hypothèses pendant le développement.

        **Programmation modulaire** : un module = un \`.h\` (interface) + un \`.c\` (implémentation). Les autres fichiers
        n'utilisent que l'interface. On peut ainsi tester, corriger ou remplacer un module sans toucher au reste.
      `,
      syntaxe: {
        code: t`
          #include <assert.h>
          assert(n > 0);            // stoppe si n <= 0
          printf("DEBUG i=%d s=%d\n", i, s);
        `,
        note: 'Supprime tes printf de debug une fois le bug corrigé.',
      },
      exemple: {
        code: t`
          #include <stdio.h>
          #include "pile.h"

          int main(void)
          {
              Pile *p = pile_creer();
              if (p == NULL) {
                  return 1;
              }
              for (int i = 1; i <= 5; i++) {
                  pile_empiler(p, i * 10);
              }
              while (!pile_vide(p)) {
                  printf("%d ", pile_depiler(p));
              }
              printf("\n");
              pile_detruire(p);
              return 0;
          }
        `,
        sources: {
          'pile.h': t`
            #ifndef PILE_H
            #define PILE_H

            typedef struct {
                int *donnees;
                int taille;
                int capacite;
            } Pile;

            Pile *pile_creer(void);
            int pile_empiler(Pile *p, int v);
            int pile_depiler(Pile *p);
            int pile_vide(const Pile *p);
            void pile_detruire(Pile *p);

            #endif
          `,
          'pile.c': t`
            #include <stdlib.h>
            #include <assert.h>
            #include "pile.h"

            Pile *pile_creer(void)
            {
                Pile *p = malloc(sizeof(Pile));
                if (p == NULL) {
                    return NULL;
                }
                p->capacite = 4;
                p->taille = 0;
                p->donnees = malloc(p->capacite * sizeof(int));
                if (p->donnees == NULL) {
                    free(p);
                    return NULL;
                }
                return p;
            }

            int pile_empiler(Pile *p, int v)
            {
                if (p->taille == p->capacite) {
                    int *tmp = realloc(p->donnees, 2 * p->capacite * sizeof(int));
                    if (tmp == NULL) {
                        return 0;
                    }
                    p->donnees = tmp;
                    p->capacite *= 2;
                }
                p->donnees[p->taille++] = v;
                return 1;
            }

            int pile_depiler(Pile *p)
            {
                assert(p->taille > 0);
                return p->donnees[--p->taille];
            }

            int pile_vide(const Pile *p)
            {
                return p->taille == 0;
            }

            void pile_detruire(Pile *p)
            {
                free(p->donnees);
                free(p);
            }
          `,
        },
        lines: {
          2: 'main ne connaît que l\'interface pile.h.',
          6: 'Le module alloue la pile (malloc caché dans pile.c).',
          13: 'On dépile jusqu\'à ce que la pile soit vide : ordre inverse d\'empilement.',
          17: 'Le module libère tout ce qu\'il a alloué : aucune fuite.',
        },
      },
      visualisation: {
        kind: 'trace',
        note: 'Version en un fichier d\'une pile de 3 éléments : observe taille monter puis descendre.',
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int pile[3];
              int taille = 0;
              pile[taille++] = 10;
              pile[taille++] = 20;
              pile[taille++] = 30;
              while (taille > 0) {
                  printf("%d ", pile[--taille]);
              }
              printf("\n");
              return 0;
          }
        `,
      },
      erreur: {
        code: t`
          #include <stdio.h>
          #include <assert.h>

          double moyenne(const int *t, int n)
          {
              assert(n > 0);
              int s = 0;
              for (int i = 0; i < n; i++) {
                  s += t[i];
              }
              return (double) s / n;
          }

          int main(void)
          {
              int t[1] = {0};
              printf("%.2f\n", moyenne(t, 0));
              return 0;
          }
        `,
        explication: 'moyenne suppose qu\'il y a au moins une valeur (sinon : division par zéro). assert vérifie cette hypothèse et arrête le programme avec un message clair dès qu\'elle est violée, au lieu de produire un résultat absurde (nan).',
        correction: t`
          #include <stdio.h>
          #include <assert.h>

          double moyenne(const int *t, int n)
          {
              assert(n > 0);
              int s = 0;
              for (int i = 0; i < n; i++) {
                  s += t[i];
              }
              return (double) s / n;
          }

          int main(void)
          {
              int t[3] = {12, 15, 9};
              int n = 3;
              if (n > 0) {
                  printf("%.2f\n", moyenne(t, n));
              }
              return 0;
          }
        `,
      },
      python: { py: 'assert n > 0\nimport pile', c: 'assert(n > 0);\n#include "pile.h"', note: 'assert existe dans les deux langages ; les modules C sont des paires .h/.c.' },
      guide: ex({
        id: 'w10l4-guide',
        mode: 'bug',
        title: 'Trois bugs dans la file d\'attente',
        prompt: 'Ce programme gère une file d\'attente de 5 places (premier arrivé, premier servi) avec un tableau circulaire. Il contient trois bugs (lis les warnings, puis teste !). Entrée `enfile 1 2 3 4 5 6` doit afficher :\n```\nFile pleine : 6 refuse\n1 2 3 4 5\n```',
        starter: t`
          #include <stdio.h>
          #include <string.h>

          #define N 5

          int main(void)
          {
              int file[N];
              int debut = 0, nb = 0, v;
              char commande[20];
              scanf("%19s", commande);
              if (commande == "enfile") {
                  while (scanf("%d", &v) == 1) {
                      if (nb == N) {
                          printf("File pleine : %d refuse\n", v);
                      } else {
                          file[(debut + nb) % N] = v;
                          nb++;
                      }
                  }
              }
              while (nb > 0) {
                  printf("%d ", file[debut]);
                  debut = debut + 1;
                  nb--;
              }
              printf("\n");
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>
          #include <string.h>

          #define N 5

          int main(void)
          {
              int file[N];
              int debut = 0, nb = 0, v;
              char commande[20];
              scanf("%19s", commande);
              if (strcmp(commande, "enfile") == 0) {
                  while (scanf("%d", &v) == 1) {
                      if (nb == N) {
                          printf("File pleine : %d refuse\n", v);
                      } else {
                          file[(debut + nb) % N] = v;
                          nb++;
                      }
                  }
              }
              int premier = 1;
              while (nb > 0) {
                  printf(premier ? "%d" : " %d", file[debut]);
                  premier = 0;
                  debut = (debut + 1) % N;
                  nb--;
              }
              printf("\n");
              return 0;
          }
        `,
        tests: [{ stdin: 'enfile 1 2 3 4 5 6\n' }, { stdin: 'enfile 7 8\n' }, { stdin: 'autre 1 2\n', hidden: true }],
        hints: ['Le compilateur te prévient sur la comparaison de chaînes : utilise strcmp.', 'L\'indice debut doit « boucler » : (debut + 1) % N.', 'Regarde la sortie attendue : pas d\'espace après le dernier nombre.'],
      }),
      mission: ex({
        id: 'w10l4-mission',
        mode: 'write',
        title: 'Utiliser le module de pile',
        prompt: 'Le projet fournit `pile.h` et `pile.c` (ouvre-les). Dans main.c, utilise uniquement l\'interface de la pile pour vérifier si une expression est **bien parenthésée** avec `( ) [ ] { }`. Lis une ligne (fgets) et affiche `Equilibree` ou `Desequilibree`. Pense à détruire la pile.\n\nExemples : `{a[(b)]}` → `Equilibree` ; `(]` → `Desequilibree` ; `((` → `Desequilibree`.',
        files: {
          'pile.h': t`
            #ifndef PILE_H
            #define PILE_H

            typedef struct {
                int *donnees;
                int taille;
                int capacite;
            } Pile;

            Pile *pile_creer(void);
            int pile_empiler(Pile *p, int v);
            int pile_depiler(Pile *p);
            int pile_vide(const Pile *p);
            void pile_detruire(Pile *p);

            #endif
          `,
          'pile.c': t`
            #include <stdlib.h>
            #include <assert.h>
            #include "pile.h"

            Pile *pile_creer(void)
            {
                Pile *p = malloc(sizeof(Pile));
                if (p == NULL) {
                    return NULL;
                }
                p->capacite = 4;
                p->taille = 0;
                p->donnees = malloc(p->capacite * sizeof(int));
                if (p->donnees == NULL) {
                    free(p);
                    return NULL;
                }
                return p;
            }

            int pile_empiler(Pile *p, int v)
            {
                if (p->taille == p->capacite) {
                    int *tmp = realloc(p->donnees, 2 * p->capacite * sizeof(int));
                    if (tmp == NULL) {
                        return 0;
                    }
                    p->donnees = tmp;
                    p->capacite *= 2;
                }
                p->donnees[p->taille++] = v;
                return 1;
            }

            int pile_depiler(Pile *p)
            {
                assert(p->taille > 0);
                return p->donnees[--p->taille];
            }

            int pile_vide(const Pile *p)
            {
                return p->taille == 0;
            }

            void pile_detruire(Pile *p)
            {
                free(p->donnees);
                free(p);
            }
          `,
        },
        solution: t`
          #include <stdio.h>
          #include "pile.h"

          int ouvrante(char c)
          {
              return c == '(' || c == '[' || c == '{';
          }

          char correspondante(char c)
          {
              if (c == ')') {
                  return '(';
              }
              if (c == ']') {
                  return '[';
              }
              return '{';
          }

          int main(void)
          {
              char ligne[256];
              if (fgets(ligne, sizeof ligne, stdin) == NULL) {
                  return 1;
              }
              Pile *p = pile_creer();
              if (p == NULL) {
                  return 1;
              }
              int ok = 1;
              for (int i = 0; ligne[i] != '\0' && ok; i++) {
                  char c = ligne[i];
                  if (ouvrante(c)) {
                      pile_empiler(p, c);
                  } else if (c == ')' || c == ']' || c == '}') {
                      if (pile_vide(p) || pile_depiler(p) != correspondante(c)) {
                          ok = 0;
                      }
                  }
              }
              if (!pile_vide(p)) {
                  ok = 0;
              }
              printf(ok ? "Equilibree\n" : "Desequilibree\n");
              pile_detruire(p);
              return 0;
          }
        `,
        tests: [{ stdin: '{a[(b)]}\n' }, { stdin: '(]\n' }, { stdin: '((\n' }, { stdin: 'x = (1 + [2 * 3]) / {4}\n', hidden: true }, { stdin: ')(\n', hidden: true }, { stdin: 'sans parenthese\n', hidden: true }],
        require: [{ pattern: 'pile_detruire\\s*\\(', message: 'Détruis la pile à la fin (aucune fuite mémoire).' }, { pattern: '#\\s*include\\s*"pile\\.h"', message: 'Inclue l\'interface du module : #include "pile.h".', raw: true }],
        hints: ['Empile chaque ouvrante ; pour chaque fermante, la pile ne doit pas être vide et le sommet doit correspondre.', 'À la fin, la pile doit être vide.', 'N\'appelle pas pile_depiler sur une pile vide (assert !).'],
      }),
      quiz: [
        { q: 'Quelle est la première étape pour corriger un bug ?', choices: ['Réécrire tout le programme', 'Le reproduire avec une entrée précise', 'Supprimer les warnings', 'Ajouter des commentaires'], answer: 1, explain: 'Sans reproduction, impossible de vérifier la correction.' },
        { q: 'Que fait `assert(n > 0);` si n vaut 0 ?', choices: ['Rien', 'Arrête le programme avec un message', 'Met n à 1', 'Affiche un warning de compilation'], answer: 1, explain: 'assert stoppe dès qu\'une hypothèse est fausse.' },
        { q: 'Dans un module bien conçu, que connaît main.c du module pile ?', choices: ['Tout le code de pile.c', 'Seulement l\'interface pile.h', 'Rien', 'Les variables locales de pile.c'], answer: 1, explain: 'L\'interface suffit pour l\'utiliser.' },
      ],
      resume: [
        'Reproduire → lire les messages → isoler → corriger → vérifier les cas limites.',
        'Un warning est souvent un bug : -Wall -Wextra.',
        '`assert` vérifie tes hypothèses.',
        'Module = interface .h + implémentation .c.',
      ],
    },
  ],
  challenges: [
    ex({
      id: 'w10-c1', mode: 'write', kind: 'challenge', title: 'Projet final : la bibliothèque',
      prompt: 'Gestionnaire de bibliothèque en ligne de commande. Lis des commandes jusqu\'à la fin de l\'entrée :\n- `ajouter <titre> <annee>` (titre sans espace) : ajoute un livre (tableau dynamique de structures, capacité doublée) ;\n- `emprunter <titre>` : affiche `Emprunte : <titre>`, ou `Indisponible : <titre>` s\'il est déjà emprunté, ou `Introuvable : <titre>` ;\n- `rendre <titre>` : affiche `Rendu : <titre>` (ou `Introuvable : <titre>`) ;\n- `liste` : affiche les livres triés par année croissante (qsort), un par ligne : `<titre> (<annee>) [disponible]` ou `[emprunte]`.\n\nLibère toute la mémoire à la fin.',
      solution: t`
        #include <stdio.h>
        #include <stdlib.h>
        #include <string.h>

        typedef struct {
            char titre[50];
            int annee;
            int emprunte;
        } Livre;

        int par_annee(const void *a, const void *b)
        {
            const Livre *x = a;
            const Livre *y = b;
            return (x->annee > y->annee) - (x->annee < y->annee);
        }

        Livre *trouver(Livre *t, int n, const char *titre)
        {
            for (int i = 0; i < n; i++) {
                if (strcmp(t[i].titre, titre) == 0) {
                    return &t[i];
                }
            }
            return NULL;
        }

        int main(void)
        {
            int n = 0, cap = 2;
            Livre *t = malloc(cap * sizeof(Livre));
            if (t == NULL) {
                return 1;
            }
            char cmd[20], titre[50];
            while (scanf("%19s", cmd) == 1) {
                if (strcmp(cmd, "ajouter") == 0) {
                    int annee;
                    if (scanf("%49s %d", titre, &annee) != 2) {
                        break;
                    }
                    if (n == cap) {
                        Livre *tmp = realloc(t, 2 * cap * sizeof(Livre));
                        if (tmp == NULL) {
                            free(t);
                            return 1;
                        }
                        t = tmp;
                        cap *= 2;
                    }
                    strcpy(t[n].titre, titre);
                    t[n].annee = annee;
                    t[n].emprunte = 0;
                    n++;
                } else if (strcmp(cmd, "emprunter") == 0 || strcmp(cmd, "rendre") == 0) {
                    if (scanf("%49s", titre) != 1) {
                        break;
                    }
                    Livre *l = trouver(t, n, titre);
                    if (l == NULL) {
                        printf("Introuvable : %s\n", titre);
                    } else if (cmd[0] == 'e') {
                        if (l->emprunte) {
                            printf("Indisponible : %s\n", titre);
                        } else {
                            l->emprunte = 1;
                            printf("Emprunte : %s\n", titre);
                        }
                    } else {
                        l->emprunte = 0;
                        printf("Rendu : %s\n", titre);
                    }
                } else if (strcmp(cmd, "liste") == 0) {
                    qsort(t, n, sizeof t[0], par_annee);
                    for (int i = 0; i < n; i++) {
                        printf("%s (%d) [%s]\n", t[i].titre, t[i].annee, t[i].emprunte ? "emprunte" : "disponible");
                    }
                }
            }
            free(t);
            return 0;
        }
      `,
      tests: [
        { stdin: 'ajouter Dune 1965\najouter Fondation 1951\najouter Neuromancien 1984\nemprunter Dune\nemprunter Dune\nemprunter Hyperion\nliste\nrendre Dune\nliste\n' },
        { stdin: 'liste\najouter A 2000\nrendre B\nliste\n', hidden: true },
      ],
      hints: ['Une structure Livre { titre, annee, emprunte } et un tableau dynamique.', 'Une fonction trouver() qui renvoie un pointeur ou NULL.', 'qsort avec une comparaison sur l\'année.'],
    }),
  ],
  boss: {
    id: 'boss-w10',
    name: 'Le Glitch',
    avatar: 'glitch',
    taunt: 'Enfin face à face ! Fuites mémoire, pointeurs pendants, boucles infinies, division entière… Je suis TOUS les bugs à la fois. Montre-moi ce que vaut un Maître du Code !',
    defeat: 'Impossible… Chaque malloc a son free… chaque pointeur est testé… Le royaume est restauré. Tu es un vrai Maître du Code.',
    timeLimit: 1500,
    phases: [
      ex({
        id: 'boss-w10-p1', mode: 'predict', title: 'Épreuve 1 : l\'illusion du Glitch',
        prompt: 'Que va afficher ce programme ? (Tous les concepts sont mélangés.)',
        code: t`
          #include <stdio.h>
          #include <stdlib.h>
          #include <string.h>

          typedef struct {
              char nom[8];
              int pts;
          } Joueur;

          int bonus(int *p, int fois)
          {
              int total = 0;
              for (int i = 0; i < fois; i++) {
                  *p += i;
                  total += *p;
              }
              return total;
          }

          int main(void)
          {
              Joueur *j = malloc(2 * sizeof(Joueur));
              if (j == NULL) {
                  return 1;
              }
              strcpy(j[0].nom, "Ada");
              j[0].pts = 10;
              j[1] = j[0];
              j[1].nom[0] = 'E';
              int t = bonus(&j[1].pts, 3);
              printf("%s %d %s %d %d %.1f\n", j[0].nom, j[0].pts, j[1].nom, j[1].pts, t, t / 2 * 1.0);
              free(j);
              return 0;
          }
        `,
        choices: ['Ada 10 Eda 13 34 17.0', 'Eda 13 Eda 13 34 17.0', 'Ada 10 Eda 13 34 17.5', 'Ada 13 Eda 13 33 16.0'],
        hints: ['j[1] = j[0] copie la structure : j[0] ne change plus ensuite.', 'bonus : pts passe à 10, 11, 13 et total = 10 + 11 + 13.', 't / 2 est une division entière avant la conversion.'],
      }),
      ex({
        id: 'boss-w10-p2', mode: 'bug', title: 'Épreuve 2 : le nid de bugs',
        prompt: 'Ce programme lit n puis n entiers, et affiche les valeurs supérieures à la moyenne (dans l\'ordre de lecture) puis la moyenne. Il contient des bugs de mémoire, de logique et de format. Corrige-le : entrée `4` puis `2 9 4 7` → `9 7` puis `Moyenne : 5.50`. Aucune fuite tolérée.',
        starter: t`
          #include <stdio.h>
          #include <stdlib.h>

          int main(void)
          {
              int n;
              scanf("%d", &n);
              int *t = malloc(n);
              int somme;
              for (int i = 0; i <= n; i++) {
                  scanf("%d", &t[i]);
                  somme += t[i];
              }
              double moy = somme / n;
              for (int i = 0; i < n; i++) {
                  if (t[i] > moy) {
                      printf("%d ", t[i]);
                  }
              }
              printf("\nMoyenne : %d\n", moy);
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>
          #include <stdlib.h>

          int main(void)
          {
              int n;
              if (scanf("%d", &n) != 1 || n <= 0) {
                  return 1;
              }
              int *t = malloc(n * sizeof(int));
              if (t == NULL) {
                  return 1;
              }
              int somme = 0;
              for (int i = 0; i < n; i++) {
                  scanf("%d", &t[i]);
                  somme += t[i];
              }
              double moy = (double) somme / n;
              int premier = 1;
              for (int i = 0; i < n; i++) {
                  if (t[i] > moy) {
                      printf(premier ? "%d" : " %d", t[i]);
                      premier = 0;
                  }
              }
              printf("\nMoyenne : %.2f\n", moy);
              free(t);
              return 0;
          }
        `,
        tests: [{ stdin: '4\n2 9 4 7\n' }, { stdin: '3\n1 1 2\n', hidden: true }, { stdin: '1\n5\n', hidden: true }],
        hints: ['malloc compte en octets : n * sizeof(int), et teste NULL.', 'somme non initialisée, boucle i <= n, division entière, %d pour un double, free oublié…', 'Pas d\'espace après le dernier nombre affiché.'],
      }),
      ex({
        id: 'boss-w10-p3', mode: 'write', title: 'Épreuve 3 : le registre des aventuriers',
        prompt: 'Le fichier `aventuriers.txt` contient des lignes `nom niveau xp` (nom sans espace). Charge-les dans un **tableau dynamique** de structures (taille inconnue à l\'avance). Puis :\n1. affiche les aventuriers triés par xp décroissant (qsort) : `<rang>. <nom> niv <niveau> - <xp> xp` ;\n2. affiche `Moyenne de niveau : <2 decimales>` ;\n3. écris dans `elite.txt` les noms des aventuriers de niveau ≥ 10, un par ligne, dans l\'ordre du classement.\n\nSi le fichier manque : `Registre introuvable`. Aucune fuite mémoire.',
        solution: t`
          #include <stdio.h>
          #include <stdlib.h>

          typedef struct {
              char nom[30];
              int niveau;
              int xp;
          } Aventurier;

          int par_xp(const void *a, const void *b)
          {
              const Aventurier *x = a;
              const Aventurier *y = b;
              return (y->xp > x->xp) - (y->xp < x->xp);
          }

          int main(void)
          {
              FILE *f = fopen("aventuriers.txt", "r");
              if (f == NULL) {
                  printf("Registre introuvable\n");
                  return 1;
              }
              int n = 0, cap = 2;
              Aventurier *t = malloc(cap * sizeof(Aventurier));
              if (t == NULL) {
                  fclose(f);
                  return 1;
              }
              Aventurier a;
              while (fscanf(f, "%29s %d %d", a.nom, &a.niveau, &a.xp) == 3) {
                  if (n == cap) {
                      Aventurier *tmp = realloc(t, 2 * cap * sizeof(Aventurier));
                      if (tmp == NULL) {
                          free(t);
                          fclose(f);
                          return 1;
                      }
                      t = tmp;
                      cap *= 2;
                  }
                  t[n++] = a;
              }
              fclose(f);
              qsort(t, n, sizeof t[0], par_xp);
              FILE *out = fopen("elite.txt", "w");
              if (out == NULL) {
                  free(t);
                  return 1;
              }
              int somme = 0;
              for (int i = 0; i < n; i++) {
                  printf("%d. %s niv %d - %d xp\n", i + 1, t[i].nom, t[i].niveau, t[i].xp);
                  somme += t[i].niveau;
                  if (t[i].niveau >= 10) {
                      fprintf(out, "%s\n", t[i].nom);
                  }
              }
              fclose(out);
              if (n > 0) {
                  printf("Moyenne de niveau : %.2f\n", (double) somme / n);
              }
              free(t);
              return 0;
          }
        `,
        tests: [
          { files: { 'aventuriers.txt': 'Ada 12 5400\nLinus 8 3100\nGrace 15 7200\nKen 10 4100\nDennis 6 900\n' }, expectFiles: true },
          { files: {} },
          { files: { 'aventuriers.txt': 'Solo 3 10\n' }, expectFiles: true, hidden: true },
        ],
        hints: ['Lecture : while (fscanf(f, "%29s %d %d", ...) == 3) dans une structure temporaire.', 'Tableau dynamique avec realloc (capacité doublée).', 'qsort décroissant sur xp ; n\'oublie ni fclose ni free.'],
      }),
    ],
  },
};
