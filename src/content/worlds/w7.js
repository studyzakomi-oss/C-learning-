import { t, ex } from '../helpers.js';

export default {
  id: 'w7',
  num: 7,
  title: 'Tableaux et Chaînes',
  subtitle: 'Ranger plusieurs valeurs, les parcourir, et manipuler du texte avec <string.h>',
  color: '#c084fc',
  icon: '🗃️',
  intro: t`
    Les Archives de l'Académie contiennent des rangées de casiers numérotés : des tableaux.
    Les messages y sont stockés lettre par lettre, terminés par un mystérieux caractère '\0'.
    Le Spectre du Décalage hante les lieux : il pousse les apprentis à ouvrir le casier qui n'existe pas…
  `,
  lessons: [
    {
      id: 'w7l1',
      title: 'Les tableaux à une dimension',
      topic: 'memory',
      skills: ['memory', 'syntax'],
      objectif: 'Déclarer un tableau, accéder à ses cases par indice et le parcourir avec une boucle.',
      explication: t`
        Un **tableau** regroupe plusieurs valeurs **du même type**, rangées côte à côte en mémoire.
        \`int notes[5];\` réserve 5 cases d'entiers.

        Chaque case a un **indice** qui commence à **0** : les cases de \`notes\` sont \`notes[0]\` à \`notes[4]\`.
        \`notes[5]\` n'existe pas !

        Initialisation : \`int t[4] = {3, 1, 4, 1};\` — si on donne moins de valeurs, le reste est mis à 0 (\`{0}\` remplit tout de zéros).
        Si on initialise, la taille peut être déduite : \`int t[] = {3, 1, 4};\`.

        On parcourt un tableau avec une boucle \`for (int i = 0; i < N; i++)\`. Utilise une **constante** pour la taille
        (\`#define N 5\`) : si elle change, tu ne la modifies qu'à un endroit.

        Un tableau ne se copie pas avec \`=\` : on copie case par case.
      `,
      syntaxe: {
        code: t`
          #define N 5
          int t[N];                 // 5 cases : t[0] .. t[4]
          int u[3] = {7, 8, 9};
          t[0] = 42;                // écrire une case
          for (int i = 0; i < N; i++) {
              t[i] = i * i;
          }
        `,
        note: 'Indices de 0 à N-1. Toujours i < N.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          #define N 5

          int main(void)
          {
              int notes[N] = {12, 15, 9, 18, 11};
              notes[2] = 10;
              for (int i = 0; i < N; i++) {
                  printf("notes[%d] = %d\n", i, notes[i]);
              }
              int carres[N];
              for (int i = 0; i < N; i++) {
                  carres[i] = i * i;
              }
              printf("Dernier carre : %d\n", carres[N - 1]);
              return 0;
          }
        `,
        lines: {
          7: 'Déclaration et initialisation des 5 cases.',
          8: 'On modifie la case d\'indice 2 (la troisième).',
          9: 'Parcours : i va de 0 à 4.',
          13: 'Remplissage par une boucle.',
          16: 'La dernière case a l\'indice N - 1.',
        },
      },
      visualisation: { kind: 'trace', note: 'Le tableau apparaît comme une rangée de cases numérotées [0] à [4].' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int t[3] = {1, 2, 3};
              int somme = 0;
              for (int i = 1; i <= 3; i++) {
                  somme += t[i];
              }
              printf("%d\n", somme);
              return 0;
          }
        `,
        explication: 'Les indices vont de 0 à 2 : la boucle oublie t[0] et lit t[3], qui est HORS du tableau. C Quest arrête le programme ; en C réel, on lirait une valeur au hasard.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int t[3] = {1, 2, 3};
              int somme = 0;
              for (int i = 0; i < 3; i++) {
                  somme += t[i];
              }
              printf("%d\n", somme);
              return 0;
          }
        `,
      },
      python: { py: 't = [12, 15, 9]\nt.append(4)', c: 'int t[3] = {12, 15, 9};\n/* taille fixe : pas de append */', note: 'Un tableau C a une taille fixe et un seul type ; une liste Python grandit et mélange les types.' },
      guide: ex({
        id: 'w7l1-guide',
        mode: 'complete',
        title: 'Lire puis afficher à l\'envers',
        prompt: 'Complète pour lire 4 entiers dans un tableau puis les afficher dans l\'ordre inverse, séparés par des espaces. Entrée `1 2 3 4` → `4 3 2 1`.',
        template: t`
          #include <stdio.h>

          #define N 4

          int main(void)
          {
              int t[N];
              for (int i = 0; i < N; i++) {
                  scanf("%d", ⟦⟧);
              }
              for (int i = ⟦⟧; i >= 0; i--) {
                  printf("%d ", t[i]);
              }
              printf("\n");
              return 0;
          }
        `,
        blanks: [{ answer: '&t[i]', width: 6 }, { answer: 'N - 1', width: 6 }],
        tests: [{ stdin: '1 2 3 4\n' }, { stdin: '9 8 7 6\n', hidden: true }],
        hints: ['scanf a besoin de l\'adresse de la case i.', 'La dernière case a l\'indice N - 1.'],
      }),
      mission: ex({
        id: 'w7l1-mission',
        mode: 'write',
        title: 'Températures de la semaine',
        prompt: 'Lis 7 températures entières dans un tableau. Affiche ensuite :\n```\nAu-dessus de la moyenne : <liste des jours (1 a 7) separes par des espaces>\n```\nUn jour compte s\'il est strictement supérieur à la moyenne (réelle). Entrée `20 22 19 25 24 18 21` (moyenne 21.29) → `Au-dessus de la moyenne : 2 4 5`.',
        solution: t`
          #include <stdio.h>

          #define JOURS 7

          int main(void)
          {
              int t[JOURS];
              int somme = 0;
              for (int i = 0; i < JOURS; i++) {
                  scanf("%d", &t[i]);
                  somme += t[i];
              }
              double moy = (double) somme / JOURS;
              printf("Au-dessus de la moyenne :");
              for (int i = 0; i < JOURS; i++) {
                  if (t[i] > moy) {
                      printf(" %d", i + 1);
                  }
              }
              printf("\n");
              return 0;
          }
        `,
        tests: [{ stdin: '20 22 19 25 24 18 21\n' }, { stdin: '10 10 10 10 10 10 11\n', hidden: true }, { stdin: '-5 0 5 -10 3 2 1\n', hidden: true }],
        hints: ['Deux boucles : une pour lire et sommer, une pour comparer à la moyenne.', 'Le numéro de jour est i + 1.', 'Affiche chaque jour précédé d\'un espace.'],
      }),
      quiz: [
        { q: 'Quel est le dernier indice valide de `int t[10];` ?', choices: ['10', '9', '11', '1'], answer: 1, explain: 'Indices de 0 à 9.' },
        { q: 'Que contient `int t[5] = {1, 2};` ?', choices: ['1 2 ? ? ?', '1 2 0 0 0', '1 2 1 2 1', 'Erreur'], answer: 1, explain: 'Les cases non précisées valent 0.' },
        { q: 'Comment lire un entier dans la case i avec scanf ?', choices: ['scanf("%d", t[i]);', 'scanf("%d", &t[i]);', 'scanf("%d", &t);', 'scanf("%d", *t[i]);'], answer: 1, explain: 'Adresse de la case : &t[i].' },
        { q: 'Peut-on écrire `a = b;` pour copier un tableau b dans a ?', choices: ['Oui', 'Non, il faut copier case par case', 'Seulement si même taille', 'Seulement pour des char'], answer: 1, explain: 'assignment to expression with array type.' },
      ],
      resume: [
        '`type nom[N];` : N cases, indices 0 à N-1.',
        'Parcours : `for (int i = 0; i < N; i++)`.',
        'Taille dans une constante (`#define N`).',
        'Dépasser les bornes = erreur grave.',
      ],
    },
    {
      id: 'w7l2',
      title: 'Minimum, maximum, moyenne, recherche',
      topic: 'algo',
      skills: ['algo'],
      objectif: 'Écrire les algorithmes classiques sur tableaux et passer un tableau à une fonction.',
      explication: t`
        Algorithmes incontournables :
        - **Somme / moyenne** : accumulateur.
        - **Maximum** : on suppose que le max est \`t[0]\`, puis on compare avec chaque case suivante.
          (Ne pas initialiser le max à 0 : si toutes les valeurs sont négatives, le résultat serait faux.)
        - **Recherche** : on parcourt jusqu'à trouver la valeur ; on renvoie son indice ou -1.

        **Tableau en paramètre** : \`int somme(const int t[], int n)\`. La fonction reçoit l'adresse du tableau,
        **pas sa taille** : il faut toujours passer n en plus. (\`sizeof\` sur un paramètre tableau donne la taille d'un pointeur !)
        \`const\` promet que la fonction ne modifiera pas le tableau.
      `,
      syntaxe: {
        code: t`
          int maximum(const int t[], int n)
          {
              int max = t[0];
              for (int i = 1; i < n; i++) {
                  if (t[i] > max) max = t[i];
              }
              return max;
          }
        `,
        note: 'Toujours passer la taille en paramètre.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int maximum(const int t[], int n)
          {
              int max = t[0];
              for (int i = 1; i < n; i++) {
                  if (t[i] > max) {
                      max = t[i];
                  }
              }
              return max;
          }

          int chercher(const int t[], int n, int valeur)
          {
              for (int i = 0; i < n; i++) {
                  if (t[i] == valeur) {
                      return i;
                  }
              }
              return -1;
          }

          int main(void)
          {
              int t[] = {-7, -3, -12, -5};
              int n = sizeof(t) / sizeof(t[0]);
              printf("max = %d\n", maximum(t, n));
              printf("-12 est a l'indice %d\n", chercher(t, n, -12));
              printf("8 est a l'indice %d\n", chercher(t, n, 8));
              return 0;
          }
        `,
        lines: {
          5: 'Le max démarre à la première case (pas à 0 : ici tout est négatif !).',
          18: 'Dès qu\'on trouve, on renvoie l\'indice.',
          22: '-1 signifie « pas trouvé » (aucun indice n\'est négatif).',
          28: 'sizeof(t) / sizeof(t[0]) : nombre de cases (seulement là où t est déclaré).',
        },
      },
      visualisation: { kind: 'trace', note: 'Suis max : il ne change que lorsqu\'une case plus grande est rencontrée.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int taille(int t[])
          {
              return sizeof(t) / sizeof(t[0]);
          }

          int main(void)
          {
              int t[10] = {0};
              printf("%d\n", taille(t));
              return 0;
          }
        `,
        explication: 'Dans la fonction, t est en réalité un pointeur (8 octets) : sizeof(t) / sizeof(int) vaut 2, pas 10. Le compilateur le signale. On passe toujours la taille en paramètre.',
        correction: t`
          #include <stdio.h>

          int somme(const int t[], int n)
          {
              int s = 0;
              for (int i = 0; i < n; i++) {
                  s += t[i];
              }
              return s;
          }

          int main(void)
          {
              int t[10] = {0};
              int n = sizeof(t) / sizeof(t[0]);
              printf("%d cases, somme %d\n", n, somme(t, n));
              return 0;
          }
        `,
      },
      python: { py: 'max(t), t.index(v)', c: 'maximum(t, n), chercher(t, n, v)', note: 'Pas de max() ni de index() intégrés en C : on écrit ces algorithmes soi-même… et on les comprend !' },
      guide: ex({
        id: 'w7l2-guide',
        mode: 'bug',
        title: 'Le minimum négatif',
        prompt: 'Cette fonction doit renvoyer le minimum d\'un tableau. Elle échoue sur certains tableaux. Corrige-la. Entrée `5` puis `4 9 2 7 3` → `2`.',
        starter: t`
          #include <stdio.h>

          int minimum(const int t[], int n)
          {
              int min = 0;
              for (int i = 0; i < n; i++) {
                  if (t[i] < min) {
                      min = t[i];
                  }
              }
              return min;
          }

          int main(void)
          {
              int n;
              int t[100];
              scanf("%d", &n);
              for (int i = 0; i < n; i++) {
                  scanf("%d", &t[i]);
              }
              printf("%d\n", minimum(t, n));
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          int minimum(const int t[], int n)
          {
              int min = t[0];
              for (int i = 1; i < n; i++) {
                  if (t[i] < min) {
                      min = t[i];
                  }
              }
              return min;
          }

          int main(void)
          {
              int n;
              int t[100];
              scanf("%d", &n);
              for (int i = 0; i < n; i++) {
                  scanf("%d", &t[i]);
              }
              printf("%d\n", minimum(t, n));
              return 0;
          }
        `,
        tests: [{ stdin: '5\n4 9 2 7 3\n' }, { stdin: '3\n-4 -9 -1\n' }, { stdin: '1\n42\n', hidden: true }],
        hints: ['Avec 4 9 2 7 3, que renvoie la fonction ? Toutes les valeurs sont > 0…', 'Initialise min avec la première case du tableau.'],
      }),
      mission: ex({
        id: 'w7l2-mission',
        mode: 'write',
        title: 'Statistiques de classe',
        prompt: 'Lis n (1 ≤ n ≤ 50) puis n notes entières. Écris les fonctions `double moyenne(const int t[], int n)`, `int maximum(const int t[], int n)` et `int compter_admis(const int t[], int n)` (notes ≥ 10). Affiche :\n```\nMoyenne : <2 decimales>\nMax : <max>\nAdmis : <nb>/<n>\n```',
        solution: t`
          #include <stdio.h>

          #define MAX_ELEVES 50

          double moyenne(const int t[], int n)
          {
              int s = 0;
              for (int i = 0; i < n; i++) {
                  s += t[i];
              }
              return (double) s / n;
          }

          int maximum(const int t[], int n)
          {
              int m = t[0];
              for (int i = 1; i < n; i++) {
                  if (t[i] > m) {
                      m = t[i];
                  }
              }
              return m;
          }

          int compter_admis(const int t[], int n)
          {
              int c = 0;
              for (int i = 0; i < n; i++) {
                  if (t[i] >= 10) {
                      c++;
                  }
              }
              return c;
          }

          int main(void)
          {
              int n;
              int notes[MAX_ELEVES];
              scanf("%d", &n);
              for (int i = 0; i < n; i++) {
                  scanf("%d", &notes[i]);
              }
              printf("Moyenne : %.2f\n", moyenne(notes, n));
              printf("Max : %d\n", maximum(notes, n));
              printf("Admis : %d/%d\n", compter_admis(notes, n), n);
              return 0;
          }
        `,
        tests: [{ stdin: '4\n12 8 15 10\n' }, { stdin: '1\n7\n' }, { stdin: '6\n20 19 3 4 10 9\n', hidden: true }],
        require: [{ pattern: 'moyenne\\s*\\(\\s*const\\s+int', message: 'Écris double moyenne(const int t[], int n).' }, { pattern: 'compter_admis\\s*\\(', message: 'Écris int compter_admis(const int t[], int n).' }],
        hints: ['Déclare un tableau de 50 cases et n\'en utilise que n.', 'Chaque fonction reçoit le tableau ET n.', 'Max initialisé à t[0].'],
      }),
      quiz: [
        { q: 'Pourquoi initialiser le max avec t[0] plutôt que 0 ?', choices: ['C\'est plus rapide', 'Si toutes les valeurs sont négatives, 0 serait faux', 'Pour éviter un warning', 'Ce n\'est pas important'], answer: 1, explain: 'Le max doit être une valeur du tableau.' },
        { q: 'Une fonction `f(int t[])` connaît-elle la taille du tableau ?', choices: ['Oui grâce à sizeof', 'Non, il faut la passer en paramètre', 'Oui si t est global', 'Seulement pour les char'], answer: 1, explain: 'Elle reçoit seulement l\'adresse.' },
        { q: 'Que renvoie souvent une fonction de recherche si l\'élément est absent ?', choices: ['0', '-1', 'n', 'NULL'], answer: 1, explain: '-1 ne peut pas être un indice valide.' },
      ],
      resume: [
        'Max/min : partir de `t[0]`.',
        'Recherche : renvoyer l\'indice ou -1.',
        'Fonction : `f(const int t[], int n)` — toujours la taille.',
        '`sizeof(t)/sizeof(t[0])` seulement là où le tableau est déclaré.',
      ],
    },
    {
      id: 'w7l3',
      title: 'Les chaînes de caractères',
      topic: 'memory',
      skills: ['memory', 'syntax'],
      objectif: 'Comprendre qu\'une chaîne est un tableau de char terminé par \'\\0\', la lire et la parcourir.',
      explication: t`
        En C, une **chaîne** est un **tableau de char** dont la fin est marquée par le caractère nul \`'\0'\`.
        \`char nom[] = "Ali";\` occupe **4** cases : \`'A' 'l' 'i' '\0'\`.

        Prévois donc toujours **une case de plus** que le nombre de lettres.

        Lire un mot : \`scanf("%49s", nom);\` (pas de &, et 49 limite la lecture pour un tableau de 50).
        Lire une ligne entière (avec espaces) : \`fgets(ligne, sizeof ligne, stdin);\` — attention, fgets garde le \`'\n'\` final.

        Parcourir une chaîne : on avance jusqu'au \`'\0'\` : \`for (int i = 0; s[i] != '\0'; i++)\`.

        \`'A'\` (apostrophes) est un char ; \`"A"\` (guillemets) est une chaîne de 2 cases.
      `,
      syntaxe: {
        code: t`
          char nom[50];
          scanf("%49s", nom);                 // un mot
          fgets(ligne, sizeof ligne, stdin);  // une ligne
          for (int i = 0; nom[i] != '\0'; i++) { ... }
        `,
        note: 'Une case de plus pour \'\\0\'.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              char mot[20];
              scanf("%19s", mot);
              int longueur = 0;
              while (mot[longueur] != '\0') {
                  longueur++;
              }
              printf("%s a %d lettres\n", mot, longueur);
              int voyelles = 0;
              for (int i = 0; mot[i] != '\0'; i++) {
                  char c = mot[i];
                  if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u' || c == 'y') {
                      voyelles++;
                  }
              }
              printf("dont %d voyelle(s)\n", voyelles);
              return 0;
          }
        `,
        stdin: 'programme\n',
        lines: {
          5: '20 cases : 19 lettres maximum + \'\\0\'.',
          6: 'Pas de & : le nom du tableau est déjà une adresse. %19s protège du débordement.',
          8: 'On compte jusqu\'au caractère de fin.',
          14: 'On examine chaque caractère.',
        },
      },
      visualisation: { kind: 'trace', note: 'Regarde les cases du tableau mot : les lettres puis \'\\0\'.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              char code[4] = "ABCD";
              printf("%s\n", code);
              return 0;
          }
        `,
        explication: '"ABCD" a 4 lettres + \'\\0\' = 5 cases, mais le tableau n\'en a que 4. Le \'\\0\' ne tient pas : printf continue de lire au-delà du tableau.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              char code[5] = "ABCD";
              printf("%s\n", code);
              return 0;
          }
        `,
      },
      python: { py: 's = "Ali"\nlen(s)  # 3', c: 'char s[] = "Ali";  /* 4 cases */\nstrlen(s)          /* 3 */', note: 'Une str Python connaît sa longueur ; une chaîne C se termine par \'\\0\'.' },
      guide: ex({
        id: 'w7l3-guide',
        mode: 'complete',
        title: 'Compter un caractère',
        prompt: 'Complète pour compter les `e` d\'un mot. Entrée `excellence` → `4`.',
        template: t`
          #include <stdio.h>

          int main(void)
          {
              char mot[50];
              scanf("%49s", mot);
              int n = 0;
              for (int i = 0; mot[i] != ⟦⟧; i++) {
                  if (mot[i] == ⟦⟧) {
                      n++;
                  }
              }
              printf("%d\n", n);
              return 0;
          }
        `,
        blanks: [{ answer: "'\\0'", width: 5 }, { answer: "'e'", width: 4 }],
        tests: [{ stdin: 'excellence\n' }, { stdin: 'xyz\n', hidden: true }],
        hints: ['La boucle s\'arrête au caractère de fin de chaîne.', 'Un caractère s\'écrit entre apostrophes.'],
      }),
      mission: ex({
        id: 'w7l3-mission',
        mode: 'write',
        title: 'Le miroir',
        prompt: 'Lis un mot (49 lettres max). Affiche-le à l\'envers sur une ligne, puis `palindrome` s\'il se lit pareil dans les deux sens, sinon `pas palindrome`. **N\'utilise pas `<string.h>`** : calcule la longueur toi-même. Entrée `radar` → `radar` puis `palindrome`.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              char mot[50];
              scanf("%49s", mot);
              int n = 0;
              while (mot[n] != '\0') {
                  n++;
              }
              for (int i = n - 1; i >= 0; i--) {
                  printf("%c", mot[i]);
              }
              printf("\n");
              int ok = 1;
              for (int i = 0; i < n / 2; i++) {
                  if (mot[i] != mot[n - 1 - i]) {
                      ok = 0;
                  }
              }
              printf(ok ? "palindrome\n" : "pas palindrome\n");
              return 0;
          }
        `,
        tests: [{ stdin: 'radar\n' }, { stdin: 'code\n' }, { stdin: 'a\n', hidden: true }, { stdin: 'kayak\n', hidden: true }, { stdin: 'abba\n', hidden: true }],
        forbid: [{ pattern: '#\\s*include\\s*<string\\.h>', message: 'N\'utilise pas <string.h> pour cet exercice.', raw: true }],
        hints: ['Longueur : avance jusqu\'au \'\\0\'.', 'À l\'envers : de n - 1 jusqu\'à 0.', 'Palindrome : compare mot[i] et mot[n - 1 - i].'],
      }),
      quiz: [
        { q: 'Combien de cases occupe `"Bonjour"` ?', choices: ['7', '8', '6', '9'], answer: 1, explain: '7 lettres + \'\\0\'.' },
        { q: 'Pourquoi pas de & dans `scanf("%s", nom)` ?', choices: ['Erreur du cours', 'Le nom d\'un tableau est déjà une adresse', 'Les chaînes n\'ont pas d\'adresse', 'Pour aller plus vite'], answer: 1, explain: 'nom « devient » &nom[0].' },
        { q: 'Quelle fonction lit une ligne entière, espaces compris ?', choices: ['scanf("%s")', 'getchar', 'fgets', 'printf'], answer: 2, explain: 'fgets(ligne, taille, stdin).' },
        { q: '`\'A\'` et `"A"` sont…', choices: ['Identiques', 'Un char et une chaîne de 2 cases', 'Deux chaînes', 'Deux char'], answer: 1, explain: 'Apostrophes = char, guillemets = chaîne.' },
      ],
      resume: [
        'Chaîne = tableau de char terminé par `\'\\0\'`.',
        'Taille = nombre de lettres + 1.',
        '`scanf("%49s", mot)` (mot) ; `fgets` (ligne).',
        'Parcours jusqu\'au `\'\\0\'`.',
      ],
    },
    {
      id: 'w7l4',
      title: 'La bibliothèque <string.h>',
      topic: 'memory',
      skills: ['memory', 'algo'],
      objectif: 'Utiliser strlen, strcpy, strcat, strcmp correctement et en toute sécurité.',
      explication: t`
        \`#include <string.h>\` donne des fonctions toutes prêtes :
        - \`strlen(s)\` : longueur (sans le \`'\0'\`), de type \`size_t\` (affiché avec \`%zu\`).
        - \`strcpy(dest, src)\` : copie src dans dest (c'est **le** moyen d'« affecter » une chaîne).
        - \`strcat(dest, src)\` : ajoute src à la fin de dest.
        - \`strcmp(a, b)\` : compare ; renvoie **0 si égales**, négatif si a < b, positif sinon (ordre alphabétique).

        ⚠️ \`dest\` doit être **assez grand** : strcpy et strcat ne vérifient rien. Un débordement écrase la mémoire voisine.
        ⚠️ On ne compare jamais deux chaînes avec \`==\` (cela compare les adresses) : \`strcmp(a, b) == 0\`.

        \`<ctype.h>\` complète : \`toupper\`, \`tolower\`, \`isdigit\`, \`isalpha\`, \`isspace\`.
      `,
      syntaxe: {
        code: t`
          #include <string.h>
          size_t n = strlen(s);
          strcpy(dest, "texte");
          strcat(dest, " suite");
          if (strcmp(a, b) == 0) { /* égales */ }
        `,
        note: 'Égalité de chaînes : strcmp(a, b) == 0.',
      },
      exemple: {
        code: t`
          #include <stdio.h>
          #include <string.h>
          #include <ctype.h>

          int main(void)
          {
              char prenom[30] = "ada";
              char complet[60];
              strcpy(complet, prenom);
              strcat(complet, " lovelace");
              complet[0] = (char) toupper(complet[0]);
              printf("%s (%zu caracteres)\n", complet, strlen(complet));
              if (strcmp(prenom, "ada") == 0) {
                  printf("Meme texte\n");
              }
              printf("%d\n", strcmp("abc", "abd") < 0);
              return 0;
          }
        `,
        lines: {
          9: 'Copie : complet contient "ada".',
          10: 'Concaténation : "ada lovelace".',
          11: 'toupper renvoie la majuscule.',
          12: 'strlen renvoie un size_t : %zu.',
          13: 'Comparaison du TEXTE avec strcmp.',
        },
      },
      visualisation: { kind: 'trace', note: 'Observe complet se remplir : copie, puis ajout à la fin.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              char reponse[10] = "oui";
              if (reponse == "oui") {
                  printf("Accepte\n");
              } else {
                  printf("Refuse\n");
              }
              return 0;
          }
        `,
        explication: '== compare deux ADRESSES (celle du tableau et celle de la chaîne littérale), jamais le texte : le résultat est « Refuse ». Il faut strcmp(reponse, "oui") == 0.',
        correction: t`
          #include <stdio.h>
          #include <string.h>

          int main(void)
          {
              char reponse[10] = "oui";
              if (strcmp(reponse, "oui") == 0) {
                  printf("Accepte\n");
              } else {
                  printf("Refuse\n");
              }
              return 0;
          }
        `,
      },
      python: { py: 'a == b\na + b\nlen(a)', c: 'strcmp(a, b) == 0\nstrcat(a, b)\nstrlen(a)', note: 'Les opérateurs == et + ne fonctionnent pas sur les chaînes C.' },
      guide: ex({
        id: 'w7l4-guide',
        mode: 'complete',
        title: 'Le mot de passe',
        prompt: 'Complète pour afficher `Bienvenue` si le mot lu est `sesame`, sinon `Refuse`.',
        template: t`
          #include <stdio.h>
          #include <string.h>

          int main(void)
          {
              char mdp[30];
              scanf("%29s", mdp);
              if (⟦⟧(mdp, "sesame") == ⟦⟧) {
                  printf("Bienvenue\n");
              } else {
                  printf("Refuse\n");
              }
              return 0;
          }
        `,
        blanks: [{ answer: 'strcmp', width: 7 }, { answer: '0', width: 2 }],
        tests: [{ stdin: 'sesame\n' }, { stdin: 'Sesame\n' }, { stdin: 'ses\n', hidden: true }],
        hints: ['La fonction de comparaison de chaînes.', 'Quelle valeur renvoie-t-elle pour deux chaînes égales ?'],
      }),
      mission: ex({
        id: 'w7l4-mission',
        mode: 'write',
        title: 'Le générateur d\'identifiant',
        prompt: 'Lis un prénom et un nom (deux mots, 29 lettres max chacun). Construis un identifiant : l\'initiale du prénom + `.` + le nom, le tout en minuscules (utilise `tolower`). Affiche `Identifiant : <id> (<longueur> caracteres)`.\n\nEntrée `Ada Lovelace` → `Identifiant : a.lovelace (10 caracteres)`.',
        solution: t`
          #include <stdio.h>
          #include <string.h>
          #include <ctype.h>

          int main(void)
          {
              char prenom[30], nom[30], id[64];
              scanf("%29s %29s", prenom, nom);
              id[0] = (char) tolower(prenom[0]);
              id[1] = '.';
              id[2] = '\0';
              strcat(id, nom);
              for (size_t i = 0; i < strlen(id); i++) {
                  id[i] = (char) tolower(id[i]);
              }
              printf("Identifiant : %s (%zu caracteres)\n", id, strlen(id));
              return 0;
          }
        `,
        tests: [{ stdin: 'Ada Lovelace\n' }, { stdin: 'Linus TORVALDS\n', hidden: true }, { stdin: 'k R\n', hidden: true }],
        hints: ['Construis le début à la main : id[0], id[1] = \'.\', id[2] = \'\\0\'.', 'Puis strcat(id, nom).', 'Une boucle tolower sur chaque caractère ; strlen renvoie un size_t (%zu).'],
      }),
      quiz: [
        { q: 'Que renvoie `strcmp("chat", "chat")` ?', choices: ['1', '0', 'true', '-1'], answer: 1, explain: '0 = égales.' },
        { q: 'Comment mettre "Ali" dans `char nom[20];` déjà déclaré ?', choices: ['nom = "Ali";', 'strcpy(nom, "Ali");', 'nom[] = "Ali";', 'strcat("Ali", nom);'], answer: 1, explain: 'On ne peut pas affecter un tableau avec =.' },
        { q: 'Quel format pour afficher `strlen(s)` ?', choices: ['%d', '%zu', '%s', '%f'], answer: 1, explain: 'strlen renvoie un size_t.' },
        { q: 'Que risque `strcat(petit, long_texte)` si petit est trop court ?', choices: ['Rien', 'Un débordement de mémoire', 'Une troncature automatique', 'Une erreur de compilation'], answer: 1, explain: 'strcat ne vérifie pas la taille.' },
      ],
      resume: [
        '`strlen`, `strcpy`, `strcat`, `strcmp` dans `<string.h>`.',
        'Égalité : `strcmp(a, b) == 0`, jamais `==`.',
        'La destination doit être assez grande.',
        '`toupper`, `tolower`, `isdigit` dans `<ctype.h>`.',
      ],
    },
  ],
  challenges: [
    ex({
      id: 'w7-c1', mode: 'write', kind: 'challenge', title: 'Projet 3 : gestionnaire de notes',
      prompt: 'Lis n (≤ 30) puis n notes réelles. Affiche les notes triées par ordre croissant (tri à bulles) sur une ligne avec 1 décimale, puis la médiane (`Mediane : x.xx`) : élément du milieu si n est impair, moyenne des deux du milieu sinon.\n\nEntrée `4` puis `12 8.5 15 10` → `8.5 10.0 12.0 15.0` puis `Mediane : 11.00`.',
      solution: t`
        #include <stdio.h>

        int main(void)
        {
            int n;
            double t[30];
            scanf("%d", &n);
            for (int i = 0; i < n; i++) {
                scanf("%lf", &t[i]);
            }
            for (int i = 0; i < n - 1; i++) {
                for (int j = 0; j < n - 1 - i; j++) {
                    if (t[j] > t[j + 1]) {
                        double tmp = t[j];
                        t[j] = t[j + 1];
                        t[j + 1] = tmp;
                    }
                }
            }
            for (int i = 0; i < n; i++) {
                printf(i ? " %.1f" : "%.1f", t[i]);
            }
            printf("\n");
            double med = n % 2 ? t[n / 2] : (t[n / 2 - 1] + t[n / 2]) / 2;
            printf("Mediane : %.2f\n", med);
            return 0;
        }
      `,
      tests: [{ stdin: '4\n12 8.5 15 10\n' }, { stdin: '5\n3 1 2 5 4\n', hidden: true }, { stdin: '1\n7\n', hidden: true }],
      hints: ['Tri à bulles : deux boucles, échange si t[j] > t[j+1].', 'Médiane : attention aux indices n/2 - 1 et n/2.'],
    }),
    ex({
      id: 'w7-c2', mode: 'write', kind: 'challenge', title: 'Le chiffre de César',
      prompt: 'Lis un décalage k (0-25) puis une ligne de texte avec `fgets`. Décale chaque lettre minuscule et majuscule de k positions dans l\'alphabet (avec retour au début), les autres caractères restent inchangés. Affiche le résultat.\n\nEntrée `3` puis `Bonjour, Zakomi !` → `Erqmrxu, Cdnrpl !`.',
      solution: t`
        #include <stdio.h>
        #include <ctype.h>

        int main(void)
        {
            int k;
            char ligne[200];
            scanf("%d", &k);
            getchar();
            if (fgets(ligne, sizeof ligne, stdin) == NULL) {
                return 1;
            }
            for (int i = 0; ligne[i] != '\0'; i++) {
                char c = ligne[i];
                if (islower(c)) {
                    ligne[i] = (char) ('a' + (c - 'a' + k) % 26);
                } else if (isupper(c)) {
                    ligne[i] = (char) ('A' + (c - 'A' + k) % 26);
                }
            }
            printf("%s", ligne);
            return 0;
        }
      `,
      tests: [{ stdin: '3\nBonjour, Zakomi !\n' }, { stdin: '13\nHello World\n', hidden: true }, { stdin: '0\nabc xyz\n', hidden: true }],
      hints: ['Après scanf, un getchar() consomme le \\n avant fgets.', 'Lettre décalée : \'a\' + (c - \'a\' + k) % 26.'],
    }),
  ],
  boss: {
    id: 'boss-w7',
    name: 'Le Spectre du Décalage',
    avatar: 'offbyone',
    taunt: 'Indice 0 ? Indice N ? Je me glisse dans la case de trop… et j\'efface le \'\\0\' de tes chaînes !',
    defeat: 'Tes bornes sont exactes… plus une seule case pour me cacher.',
    timeLimit: 1080,
    phases: [
      ex({
        id: 'boss-w7-p1', mode: 'predict', title: 'Phase 1 : les casiers',
        prompt: 'Que va afficher ce programme ?',
        code: t`
          #include <stdio.h>
          #include <string.h>

          int main(void)
          {
              char s[10] = "code";
              int t[5] = {1, 2};
              s[2] = '\0';
              printf("%s %zu %d %d\n", s, strlen(s), t[1] + t[4], (int) sizeof(t));
              return 0;
          }
        `,
        choices: ['co 2 2 20', 'code 4 2 5', 'co 2 3 20', 'cde 3 2 20'],
        hints: ['\'\\0\' coupe la chaîne.', 't[4] vaut 0, sizeof(t) = 5 × 4.'],
      }),
      ex({
        id: 'boss-w7-p2', mode: 'bug', title: 'Phase 2 : le débordement',
        prompt: 'Ce programme assemble un message et compte les majuscules. Il déborde de la mémoire et compte mal. Corrige-le : entrée `Hello` → `Hello World !` puis `2 majuscule(s)`.',
        starter: t`
          #include <stdio.h>
          #include <string.h>
          #include <ctype.h>

          int main(void)
          {
              char mot[20];
              char message[8];
              scanf("%19s", mot);
              strcpy(message, mot);
              strcat(message, " World !");
              printf("%s\n", message);
              int maj = 0;
              for (size_t i = 0; i <= strlen(message); i++) {
                  if (isupper(message[i])) {
                      maj++;
                  }
              }
              printf("%d majuscule(s)\n", maj);
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>
          #include <string.h>
          #include <ctype.h>

          int main(void)
          {
              char mot[20];
              char message[40];
              scanf("%19s", mot);
              strcpy(message, mot);
              strcat(message, " World !");
              printf("%s\n", message);
              int maj = 0;
              for (size_t i = 0; i < strlen(message); i++) {
                  if (isupper(message[i])) {
                      maj++;
                  }
              }
              printf("%d majuscule(s)\n", maj);
              return 0;
          }
        `,
        tests: [{ stdin: 'Hello\n' }, { stdin: 'ABC\n', hidden: true }],
        hints: ['« Hello World ! » fait 13 caractères + \'\\0\' : message est trop petit.', 'La boucle doit s\'arrêter avant strlen (i < strlen).'],
      }),
      ex({
        id: 'boss-w7-p3', mode: 'write', title: 'Phase 3 : la fréquence des lettres',
        prompt: 'Lis une ligne de texte (fgets). Compte les occurrences de chaque lettre (sans distinguer majuscules et minuscules) dans un tableau `int freq[26]`. Affiche, par ordre alphabétique, chaque lettre présente sous la forme `a:3` (une par ligne).\n\nEntrée `Abracadabra` → `a:5`, `b:2`, `c:1`, `d:1`, `r:2`.',
        solution: t`
          #include <stdio.h>
          #include <ctype.h>

          int main(void)
          {
              char ligne[256];
              int freq[26] = {0};
              if (fgets(ligne, sizeof ligne, stdin) == NULL) {
                  return 1;
              }
              for (int i = 0; ligne[i] != '\0'; i++) {
                  if (isalpha(ligne[i])) {
                      freq[tolower(ligne[i]) - 'a']++;
                  }
              }
              for (int k = 0; k < 26; k++) {
                  if (freq[k] > 0) {
                      printf("%c:%d\n", 'a' + k, freq[k]);
                  }
              }
              return 0;
          }
        `,
        tests: [{ stdin: 'Abracadabra\n' }, { stdin: 'Le C, c\'est Classe !\n', hidden: true }, { stdin: '123 !!!\n', hidden: true }],
        hints: ['int freq[26] = {0}; puis freq[c - \'a\']++ pour chaque lettre minuscule.', 'Affiche la lettre avec \'a\' + k et %c.'],
      }),
    ],
  },
};
