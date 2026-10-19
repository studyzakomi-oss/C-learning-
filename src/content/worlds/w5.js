import { t, ex } from '../helpers.js';

export default {
  id: 'w5',
  num: 5,
  title: 'Les Boucles',
  subtitle: 'Répéter avec while, for, do…while ; compteurs, accumulateurs, break et continue',
  color: '#34d399',
  icon: '🔁',
  intro: t`
    Bienvenue dans la Spirale Éternelle. Ici, tout se répète : les marches, les échos, les jours.
    Une boucle bien écrite fait en trois lignes ce qui en demanderait mille.
    Mais attention : une boucle sans fin te piégerait à jamais… comme la Boucle Infinie, gardienne de ce monde.
  `,
  lessons: [
    {
      id: 'w5l1',
      title: 'La boucle while et les compteurs',
      topic: 'logic',
      skills: ['logic', 'algo'],
      objectif: 'Répéter des instructions tant qu\'une condition est vraie, avec un compteur bien initialisé et bien mis à jour.',
      explication: t`
        \`while (condition) { ... }\` répète le bloc **tant que** la condition est vraie.
        La condition est testée **avant** chaque tour : si elle est fausse dès le début, le bloc ne s'exécute jamais.

        Une boucle à compteur a toujours **3 ingrédients** :
        1. **Initialisation** avant la boucle : \`int i = 1;\`
        2. **Condition** : \`while (i <= 5)\`
        3. **Mise à jour** dans le bloc : \`i++;\`

        Oublie la mise à jour et la condition reste vraie pour toujours : **boucle infinie**.
        C Quest arrête automatiquement un programme qui tourne trop longtemps et te le signale.

        while est idéal quand on ne sait pas à l'avance combien de tours il faudra (« tant que l'utilisateur n'a pas trouvé »).
      `,
      syntaxe: {
        code: t`
          int i = 1;            // 1. initialisation
          while (i <= 5) {      // 2. condition
              ...
              i++;              // 3. mise à jour
          }
        `,
        note: 'Vérifie toujours que la condition finira par devenir fausse.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int i = 1;
              while (i <= 5) {
                  printf("Tour %d\n", i);
                  i++;
              }
              int n = 1000;
              int etapes = 0;
              while (n > 1) {
                  n = n / 2;
                  etapes++;
              }
              printf("%d divisions par 2\n", etapes);
              return 0;
          }
        `,
        lines: {
          5: 'Initialisation du compteur.',
          6: 'Testée avant chaque tour : quand i vaut 6, on sort.',
          8: 'Mise à jour : sans elle, boucle infinie !',
          12: 'Ici on ne sait pas d\'avance combien de tours : while est le bon choix.',
        },
      },
      visualisation: { kind: 'trace', note: 'Observe i augmenter à chaque tour, puis la sortie de boucle quand la condition devient fausse.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int i = 0;
              while (i < 3) {
                  printf("i = %d\n", i);
              }
              return 0;
          }
        `,
        explication: 'i n\'est jamais modifié : la condition i < 3 reste vraie pour toujours. C\'est une boucle infinie, le programme est arrêté au bout de quelques secondes.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int i = 0;
              while (i < 3) {
                  printf("i = %d\n", i);
                  i++;
              }
              return 0;
          }
        `,
      },
      python: { py: 'i = 1\nwhile i <= 5:\n    i += 1', c: 'int i = 1;\nwhile (i <= 5) {\n    i++;\n}', note: 'Même logique, avec des parenthèses et des accolades.' },
      guide: ex({
        id: 'w5l1-guide',
        mode: 'complete',
        title: 'Le compte à rebours',
        prompt: 'Complète pour afficher un compte à rebours de n jusqu\'à 1, puis `Decollage !`. Entrée `3` → `3`, `2`, `1`, `Decollage !` (une valeur par ligne).',
        template: t`
          #include <stdio.h>

          int main(void)
          {
              int n;
              scanf("%d", &n);
              while (n ⟦⟧ 1) {
                  printf("%d\n", n);
                  ⟦⟧;
              }
              printf("Decollage !\n");
              return 0;
          }
        `,
        blanks: [{ answer: '>=', width: 3 }, { answer: 'n--', width: 4 }],
        tests: [{ stdin: '3\n' }, { stdin: '1\n', hidden: true }, { stdin: '0\n', hidden: true }],
        hints: ['La boucle continue tant que n vaut au moins 1.', 'Chaque tour, n diminue de 1.'],
      }),
      mission: ex({
        id: 'w5l1-mission',
        mode: 'write',
        title: 'Le nombre de chiffres',
        prompt: 'Lis un entier positif n et affiche son nombre de chiffres, en divisant par 10 avec une boucle while. Entrée `2026` → `4`, entrée `0` → `1`.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int n;
              scanf("%d", &n);
              int chiffres = 1;
              while (n >= 10) {
                  n = n / 10;
                  chiffres++;
              }
              printf("%d\n", chiffres);
              return 0;
          }
        `,
        tests: [{ stdin: '2026\n' }, { stdin: '0\n' }, { stdin: '9\n', hidden: true }, { stdin: '10\n', hidden: true }, { stdin: '123456789\n', hidden: true }],
        require: [{ pattern: '\\bwhile\\s*\\(', message: 'Utilise une boucle while.' }],
        hints: ['Chaque division par 10 enlève un chiffre.', 'Attention au cas 0 : il a 1 chiffre.', 'Compte les divisions tant que n >= 10, puis ajoute 1.'],
      }),
      quiz: [
        { q: 'Combien de fois s\'exécute `int i = 5; while (i < 5) { i++; }` ?', choices: ['0', '1', '5', 'À l\'infini'], answer: 0, explain: 'La condition est fausse dès le départ.' },
        { q: 'Quels sont les 3 ingrédients d\'une boucle à compteur ?', choices: ['if, else, break', 'Initialisation, condition, mise à jour', 'printf, scanf, return', 'Début, milieu, fin'], answer: 1, explain: 'Sans l\'un d\'eux, la boucle est fausse ou infinie.' },
        { q: 'Que se passe-t-il si on oublie `i++` ?', choices: ['Erreur de compilation', 'Boucle infinie (si la condition est vraie au départ)', 'La boucle s\'arrête', 'i augmente quand même'], answer: 1, explain: 'La condition ne change jamais.' },
      ],
      resume: [
        '`while (cond) { ... }` répète tant que cond est vraie.',
        'Initialisation, condition, mise à jour.',
        'Condition testée avant chaque tour.',
        'Pas de mise à jour = boucle infinie.',
      ],
    },
    {
      id: 'w5l2',
      title: 'La boucle for et les accumulateurs',
      topic: 'algo',
      skills: ['algo', 'logic'],
      objectif: 'Écrire des boucles for compactes, et cumuler des résultats (somme, produit, comptage).',
      explication: t`
        \`for\` regroupe les 3 ingrédients sur une seule ligne : \`for (init; condition; mise à jour)\`.
        C'est la boucle idéale quand on connaît le nombre de tours.

        Un **accumulateur** est une variable qui « ramasse » un résultat au fil des tours :
        - somme : initialisée à **0**, puis \`somme += i;\`
        - produit (factorielle) : initialisé à **1**, puis \`produit *= i;\`
        - compteur : initialisé à 0, \`nb++\` quand une condition est vraie.

        ⚠️ Initialise l'accumulateur **avant** la boucle (pas dedans, sinon il repart de zéro à chaque tour).

        Pour une factorielle, le résultat grandit très vite : 13! dépasse la capacité d'un int.
        Utilise \`long long\` (affiché avec \`%lld\`) pour aller jusqu'à 20!.
      `,
      syntaxe: {
        code: t`
          int somme = 0;
          for (int i = 1; i <= n; i++) {
              somme += i;
          }
        `,
        note: 'for (début ; condition ; pas) — avec deux points-virgules.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int n = 5;
              int somme = 0;
              long long fact = 1;
              for (int i = 1; i <= n; i++) {
                  somme += i;
                  fact *= i;
              }
              printf("Somme 1..%d = %d\n", n, somme);
              printf("%d! = %lld\n", n, fact);
              for (int k = 1; k <= 3; k++) {
                  printf("7 x %d = %d\n", k, 7 * k);
              }
              return 0;
          }
        `,
        lines: {
          6: 'Accumulateur de somme : départ à 0.',
          7: 'Accumulateur de produit : départ à 1 (multiplier par 0 donnerait 0).',
          8: 'i va de 1 à n inclus.',
          13: '%lld pour un long long.',
          14: 'Une table de multiplication en 3 lignes.',
        },
      },
      visualisation: { kind: 'trace', note: 'Regarde somme et fact grandir à chaque tour de boucle.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              for (int i = 1; i <= 3; i++) {
                  int total = 0;
                  total += i;
                  printf("total = %d\n", total);
              }
              return 0;
          }
        `,
        logic: true,
        explication: 'total est déclaré DANS la boucle : il est remis à 0 à chaque tour. On obtient 1, 2, 3 au lieu de 1, 3, 6. L\'accumulateur doit être déclaré avant la boucle.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int total = 0;
              for (int i = 1; i <= 3; i++) {
                  total += i;
                  printf("total = %d\n", total);
              }
              return 0;
          }
        `,
      },
      python: { py: 'for i in range(1, n + 1):\n    s += i', c: 'for (int i = 1; i <= n; i++) {\n    s += i;\n}', note: 'range(1, n+1) correspond à i = 1 ; i <= n ; i++.' },
      guide: ex({
        id: 'w5l2-guide',
        mode: 'predict',
        title: 'Combien de tours ?',
        prompt: 'Que va afficher ce programme ?',
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int s = 0;
              for (int i = 2; i < 10; i += 3) {
                  s += i;
                  printf("%d ", i);
              }
              printf("| %d\n", s);
              return 0;
          }
        `,
        choices: ['2 5 8 | 15', '2 5 8 11 | 26', '2 3 4 5 6 7 8 9 | 44', '2 5 | 7'],
        hints: ['i commence à 2 et augmente de 3.', '11 n\'est pas < 10.'],
      }),
      mission: ex({
        id: 'w5l2-mission',
        mode: 'write',
        title: 'Factorielle et somme',
        prompt: 'Lis un entier n (0 ≤ n ≤ 20). Avec une boucle **for**, affiche :\n```\nSomme : <1 + 2 + ... + n>\nFactorielle : <n!>\n```\n(0! vaut 1). Utilise un `long long` pour la factorielle.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int n;
              scanf("%d", &n);
              long long somme = 0;
              long long fact = 1;
              for (int i = 1; i <= n; i++) {
                  somme += i;
                  fact *= i;
              }
              printf("Somme : %lld\n", somme);
              printf("Factorielle : %lld\n", fact);
              return 0;
          }
        `,
        tests: [{ stdin: '5\n' }, { stdin: '0\n' }, { stdin: '20\n', hidden: true }, { stdin: '13\n', hidden: true }],
        require: [{ pattern: '\\bfor\\s*\\(', message: 'Utilise une boucle for.' }],
        hints: ['Deux accumulateurs : somme commence à 0, fact à 1.', 'long long fact = 1; et %lld pour l\'afficher.', 'Si n vaut 0, la boucle ne fait aucun tour : c\'est très bien.'],
      }),
      quiz: [
        { q: 'Combien de tours fait `for (int i = 0; i < 5; i++)` ?', choices: ['4', '5', '6', '0'], answer: 1, explain: 'i = 0, 1, 2, 3, 4.' },
        { q: 'À quelle valeur initialiser un accumulateur de produit ?', choices: ['0', '1', '-1', 'n'], answer: 1, explain: 'Multiplier par 0 donnerait toujours 0.' },
        { q: 'Pourquoi `long long` pour 20! ?', choices: ['Pour la vitesse', 'Parce que 20! dépasse la capacité d\'un int', 'C\'est obligatoire dans un for', 'Pour avoir des décimales'], answer: 1, explain: 'int s\'arrête à environ 2,1 milliards.' },
        { q: 'Que fait `for (int i = 10; i > 0; i -= 2)` ?', choices: ['10 8 6 4 2', '10 8 6 4 2 0', '0 2 4 6 8 10', 'Boucle infinie'], answer: 0, explain: 'i diminue de 2 tant qu\'il est > 0.' },
      ],
      resume: [
        '`for (init; condition; pas) { ... }`.',
        'Somme : départ 0 ; produit : départ 1.',
        'Déclare l\'accumulateur AVANT la boucle.',
        '`long long` + `%lld` pour les grands entiers.',
      ],
    },
    {
      id: 'w5l3',
      title: 'do…while et la validation des saisies',
      topic: 'logic',
      skills: ['logic', 'debug'],
      objectif: 'Exécuter un bloc au moins une fois avec do…while, notamment pour redemander une saisie invalide.',
      explication: t`
        \`do { ... } while (condition);\` exécute le bloc **d'abord**, puis teste la condition.
        Le bloc s'exécute donc **au moins une fois**.

        Usage typique : **redemander une saisie** tant qu'elle est invalide.
        On demande d'abord, on vérifie ensuite.

        ⚠️ Le \`while (condition)\` final se termine **par un point-virgule**.

        Combinée à la valeur de retour de scanf, la boucle devient robuste : si l'entrée est terminée
        (scanf renvoie EOF), on arrête au lieu de boucler à l'infini.
      `,
      syntaxe: {
        code: t`
          do {
              // au moins une fois
          } while (condition);
        `,
        note: 'N\'oublie pas le ; après while (...).',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int note;
              int lu;
              do {
                  printf("Note (0-20) ? ");
                  lu = scanf("%d", &note);
                  if (lu == 1 && (note < 0 || note > 20)) {
                      printf("Hors limites !\n");
                  }
              } while (lu == 1 && (note < 0 || note > 20));
              if (lu == 1) {
                  printf("Note retenue : %d\n", note);
              }
              return 0;
          }
        `,
        stdin: '25\n-3\n14\n',
        lines: {
          7: 'On entre dans la boucle sans condition : la question est posée au moins une fois.',
          9: 'On garde le résultat de scanf.',
          13: 'On recommence tant que la note lue est hors limites.',
        },
      },
      visualisation: { kind: 'trace', note: 'Entrées : 25, -3, puis 14. La boucle tourne trois fois.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int x = 0;
              do {
                  x++;
              } while (x < 3)
              printf("%d\n", x);
              return 0;
          }
        `,
        explication: 'Le do…while doit se terminer par « ; » après la parenthèse du while. Sans lui, le compilateur ne sait pas où s\'arrête l\'instruction.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int x = 0;
              do {
                  x++;
              } while (x < 3);
              printf("%d\n", x);
              return 0;
          }
        `,
      },
      python: { py: 'while True:\n    n = int(input())\n    if 0 <= n <= 20: break', c: 'do {\n    scanf("%d", &n);\n} while (n < 0 || n > 20);', note: 'Python n\'a pas de do…while : on simule avec while True + break.' },
      guide: ex({
        id: 'w5l3-guide',
        mode: 'bug',
        title: 'La saisie récalcitrante',
        prompt: 'Ce programme doit lire des nombres jusqu\'à obtenir un nombre **positif**, puis l\'afficher. Avec l\'entrée `-5 0 8` il doit afficher `Retenu : 8`. Corrige-le.',
        starter: t`
          #include <stdio.h>

          int main(void)
          {
              int n;
              do {
                  scanf("%d", &n);
              } while (n > 0);
              printf("Retenu : %d\n", n);
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int n;
              do {
                  scanf("%d", &n);
              } while (n <= 0);
              printf("Retenu : %d\n", n);
              return 0;
          }
        `,
        tests: [{ stdin: '-5 0 8\n' }, { stdin: '3\n', hidden: true }],
        hints: ['La condition du while dit quand RECOMMENCER, pas quand s\'arrêter.', 'On recommence tant que n n\'est pas positif.'],
      }),
      mission: ex({
        id: 'w5l3-mission',
        mode: 'write',
        title: 'Le menu en boucle',
        prompt: 'Écris un menu qui lit des choix entiers en boucle **do…while** :\n- `1` → affiche `Bonjour`\n- `2` → affiche `Au revoir`\n- `0` → arrête la boucle et affiche `Fin`\n- autre → `Choix invalide`\n\nArrête aussi si la lecture échoue (plus d\'entrée). Entrée `1 5 2 0` → `Bonjour`, `Choix invalide`, `Au revoir`, `Fin`.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int choix;
              do {
                  if (scanf("%d", &choix) != 1) {
                      choix = 0;
                  } else if (choix == 1) {
                      printf("Bonjour\n");
                  } else if (choix == 2) {
                      printf("Au revoir\n");
                  } else if (choix != 0) {
                      printf("Choix invalide\n");
                  }
              } while (choix != 0);
              printf("Fin\n");
              return 0;
          }
        `,
        tests: [{ stdin: '1 5 2 0\n' }, { stdin: '0\n' }, { stdin: '2 2\n', hidden: true }, { stdin: '7 1 0 1\n', hidden: true }],
        require: [{ pattern: '\\bdo\\b', message: 'Utilise une boucle do…while.' }],
        hints: ['La boucle continue tant que choix != 0.', 'Si scanf ne renvoie pas 1, mets choix à 0 pour sortir.', '« Fin » s\'affiche après la boucle.'],
      }),
      quiz: [
        { q: 'Combien de fois s\'exécute `do { ... } while (0);` ?', choices: ['0', '1', 'À l\'infini', 'Erreur'], answer: 1, explain: 'Le bloc passe avant le test.' },
        { q: 'Que manque-t-il : `do { x++; } while (x < 3)` ?', choices: ['Des accolades', 'Un ; final', 'Un if', 'Rien'], answer: 1, explain: 'do…while se termine par ;.' },
        { q: 'Quand préférer do…while à while ?', choices: ['Quand on ne connaît pas le nombre de tours', 'Quand le bloc doit s\'exécuter au moins une fois', 'Pour aller plus vite', 'Jamais'], answer: 1, explain: 'Exemple typique : demander une saisie.' },
      ],
      resume: [
        '`do { ... } while (cond);` : au moins un passage.',
        'Point-virgule obligatoire à la fin.',
        'Idéal pour redemander une saisie invalide.',
        'Combine avec la valeur de retour de scanf pour éviter les boucles sans fin.',
      ],
    },
    {
      id: 'w5l4',
      title: 'break, continue et boucles imbriquées',
      topic: 'algo',
      skills: ['algo', 'logic'],
      objectif: 'Contrôler finement une boucle (sortir, sauter un tour) et imbriquer des boucles pour produire des grilles.',
      explication: t`
        - \`break;\` **sort immédiatement** de la boucle (la plus proche).
        - \`continue;\` **saute à la fin du tour** actuel et passe au suivant.

        Exemple : chercher le premier diviseur d'un nombre → on s'arrête (\`break\`) dès qu'on l'a trouvé.

        Une boucle peut en contenir une autre : la boucle **intérieure** fait tous ses tours pour **chaque** tour de la boucle extérieure.
        C'est ainsi qu'on dessine des rectangles, des triangles, des tables de multiplication complètes.

        Astuce : nomme les compteurs \`ligne\` et \`col\` plutôt que \`i\` et \`j\` quand tu dessines une grille.
      `,
      syntaxe: {
        code: t`
          for (int ligne = 1; ligne <= h; ligne++) {
              for (int col = 1; col <= w; col++) {
                  printf("*");
              }
              printf("\n");
          }
        `,
        note: 'break et continue ne concernent que la boucle la plus intérieure.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              for (int i = 1; i <= 10; i++) {
                  if (i % 3 == 0) {
                      continue;
                  }
                  if (i > 7) {
                      break;
                  }
                  printf("%d ", i);
              }
              printf("\n");
              for (int ligne = 1; ligne <= 4; ligne++) {
                  for (int col = 1; col <= ligne; col++) {
                      printf("*");
                  }
                  printf("\n");
              }
              return 0;
          }
        `,
        lines: {
          7: 'Les multiples de 3 sont sautés.',
          10: 'Dès que i dépasse 7, on quitte la boucle.',
          15: 'Boucle extérieure : une ligne par tour.',
          16: 'Boucle intérieure : autant d\'étoiles que le numéro de ligne.',
          19: 'Retour à la ligne après chaque ligne d\'étoiles.',
        },
      },
      visualisation: { kind: 'trace', note: 'Observe col repartir à 1 à chaque nouvelle ligne.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int t[5] = {4, 8, 15, 16, 23};
              for (int i = 0; i <= 5; i++) {
                  printf("%d\n", t[i]);
              }
              return 0;
          }
        `,
        explication: 'Erreur « off-by-one » : la boucle va jusqu\'à i = 5 alors que le tableau n\'a que 5 cases (indices 0 à 4). C Quest détecte la lecture hors limites ; en C réel, on lirait n\'importe quoi.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int t[5] = {4, 8, 15, 16, 23};
              for (int i = 0; i < 5; i++) {
                  printf("%d\n", t[i]);
              }
              return 0;
          }
        `,
      },
      python: { py: 'for i in range(1, 11):\n    if i % 3 == 0: continue\n    if i > 7: break', c: 'for (int i = 1; i <= 10; i++) {\n    if (i % 3 == 0) continue;\n    if (i > 7) break;\n}', note: 'break et continue fonctionnent exactement comme en Python.' },
      guide: ex({
        id: 'w5l4-guide',
        mode: 'complete',
        title: 'Le premier diviseur',
        prompt: 'Complète pour afficher le plus petit diviseur de n supérieur à 1. Entrée `91` → `7`, entrée `13` → `13`.',
        template: t`
          #include <stdio.h>

          int main(void)
          {
              int n;
              scanf("%d", &n);
              int d = 2;
              while (d <= n) {
                  if (n % d == 0) {
                      ⟦⟧;
                  }
                  d++;
              }
              printf("%d\n", ⟦⟧);
              return 0;
          }
        `,
        blanks: [{ answer: 'break', width: 6 }, { answer: 'd', width: 2 }],
        tests: [{ stdin: '91\n' }, { stdin: '13\n' }, { stdin: '100\n', hidden: true }, { stdin: '2\n', hidden: true }],
        hints: ['Dès qu\'on trouve un diviseur, on veut sortir de la boucle.', 'Quelle variable contient le diviseur trouvé ?'],
      }),
      mission: ex({
        id: 'w5l4-mission',
        mode: 'write',
        title: 'Le sapin paramétrable',
        prompt: 'Lis une hauteur h (1 à 20) et dessine un sapin centré avec des boucles imbriquées. Pour h = 3 :\n```\n  *\n ***\n*****\n  |\n```\nLa ligne k (de 1 à h) contient h - k espaces puis 2k - 1 étoiles ; le tronc `|` est précédé de h - 1 espaces.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int h;
              scanf("%d", &h);
              for (int k = 1; k <= h; k++) {
                  for (int s = 0; s < h - k; s++) {
                      printf(" ");
                  }
                  for (int e = 0; e < 2 * k - 1; e++) {
                      printf("*");
                  }
                  printf("\n");
              }
              for (int s = 0; s < h - 1; s++) {
                  printf(" ");
              }
              printf("|\n");
              return 0;
          }
        `,
        tests: [{ stdin: '3\n' }, { stdin: '1\n' }, { stdin: '6\n', hidden: true }],
        require: [{ pattern: '\\b(for|while)\\b[\\s\\S]*\\b(for|while)\\b', message: 'Utilise des boucles (imbriquées) pour dessiner.' }],
        hints: ['Une boucle extérieure pour les lignes k = 1..h.', 'Dans chaque ligne : une boucle pour les espaces, puis une pour les étoiles.', 'Le tronc : h - 1 espaces puis |.'],
      }),
      quiz: [
        { q: 'Que fait `continue;` dans une boucle ?', choices: ['Sort de la boucle', 'Passe directement au tour suivant', 'Recommence la boucle depuis le début', 'Rien'], answer: 1, explain: 'La fin du tour actuel est sautée.' },
        { q: 'Avec deux boucles imbriquées de 3 et 4 tours, combien de fois s\'exécute le bloc intérieur ?', choices: ['7', '12', '3', '4'], answer: 1, explain: '3 × 4.' },
        { q: 'Dans une boucle imbriquée, `break` dans la boucle intérieure…', choices: ['Sort des deux boucles', 'Sort seulement de la boucle intérieure', 'Arrête le programme', 'Est interdit'], answer: 1, explain: 'break concerne la boucle la plus proche.' },
        { q: '`for (int i = 0; i <= 5; i++)` sur un tableau de 5 cases provoque…', choices: ['Rien de grave', 'Un accès hors du tableau (indice 5)', 'Une erreur de compilation', 'Une boucle infinie'], answer: 1, explain: 'Off-by-one : indices valides 0 à 4.' },
      ],
      resume: [
        '`break` sort de la boucle, `continue` passe au tour suivant.',
        'Boucles imbriquées : intérieure complète à chaque tour extérieur.',
        'Grilles : extérieure = lignes, intérieure = colonnes, puis `\\n`.',
        'Attention aux bornes (`<` ou `<=`) : erreur off-by-one.',
      ],
    },
  ],
  challenges: [
    ex({
      id: 'w5-c1', mode: 'write', kind: 'challenge', title: 'Table de multiplication complète',
      prompt: 'Lis n (1 à 9) et affiche la table de multiplication de 1 à n sous forme de grille, chaque nombre sur 4 caractères (`%4d`). Pour n = 3 :\n```\n   1   2   3\n   2   4   6\n   3   6   9\n```',
      solution: t`
        #include <stdio.h>

        int main(void)
        {
            int n;
            scanf("%d", &n);
            for (int i = 1; i <= n; i++) {
                for (int j = 1; j <= n; j++) {
                    printf("%4d", i * j);
                }
                printf("\n");
            }
            return 0;
        }
      `,
      tests: [{ stdin: '3\n' }, { stdin: '9\n', hidden: true }],
      hints: ['Deux boucles imbriquées i et j, produit i * j.'],
    }),
    ex({
      id: 'w5-c2', mode: 'write', kind: 'challenge', title: 'Nombre premier',
      prompt: 'Lis un entier n ≥ 2 et affiche `premier` ou `pas premier`. Un nombre est premier s\'il n\'a aucun diviseur entre 2 et sa racine (teste d * d <= n).',
      solution: t`
        #include <stdio.h>

        int main(void)
        {
            int n;
            scanf("%d", &n);
            int premier = 1;
            for (int d = 2; d * d <= n; d++) {
                if (n % d == 0) {
                    premier = 0;
                    break;
                }
            }
            printf(premier ? "premier\n" : "pas premier\n");
            return 0;
        }
      `,
      tests: [{ stdin: '17\n' }, { stdin: '91\n' }, { stdin: '2\n', hidden: true }, { stdin: '1000003\n', hidden: true }, { stdin: '49\n', hidden: true }],
      hints: ['Une variable drapeau premier = 1, mise à 0 dès qu\'un diviseur est trouvé.'],
    }),
    ex({
      id: 'w5-c3', mode: 'write', kind: 'challenge', title: 'Moyenne d\'une série',
      prompt: 'Lis des notes entières jusqu\'à la fin de l\'entrée (scanf renvoie autre chose que 1). Affiche `Nombre : <n>`, `Moyenne : <m avec 2 decimales>`, `Max : <max>`. S\'il n\'y a aucune note, affiche `Aucune note`.',
      solution: t`
        #include <stdio.h>

        int main(void)
        {
            int note, nb = 0, somme = 0, max = 0;
            while (scanf("%d", &note) == 1) {
                if (nb == 0 || note > max) {
                    max = note;
                }
                somme += note;
                nb++;
            }
            if (nb == 0) {
                printf("Aucune note\n");
                return 0;
            }
            printf("Nombre : %d\n", nb);
            printf("Moyenne : %.2f\n", (double) somme / nb);
            printf("Max : %d\n", max);
            return 0;
        }
      `,
      tests: [{ stdin: '12 15 9 18\n' }, { stdin: '\n' }, { stdin: '7\n', hidden: true }, { stdin: '-1 -5\n', hidden: true }],
      hints: ['while (scanf("%d", &note) == 1) lit tant qu\'il y a des nombres.', 'Le premier nombre lu initialise le max.'],
    }),
  ],
  boss: {
    id: 'boss-w5',
    name: 'La Boucle Infinie',
    avatar: 'loop',
    taunt: 'Je tourne, je tourne, je tourne… et je ne m\'arrête JAMAIS ! Oseras-tu trouver ma condition de sortie ?',
    defeat: 'Ma condition… est devenue fausse… Je m\'arrête enfin.',
    timeLimit: 960,
    phases: [
      ex({
        id: 'boss-w5-p1', mode: 'predict', title: 'Phase 1 : le compte des tours',
        prompt: 'Que va afficher ce programme ?',
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int c = 0;
              for (int i = 0; i < 4; i++) {
                  for (int j = i; j < 4; j++) {
                      c++;
                  }
              }
              printf("%d\n", c);
              return 0;
          }
        `,
        choices: ['16', '10', '6', '4'],
        hints: ['Pour i = 0 : 4 tours ; i = 1 : 3 tours…'],
      }),
      ex({
        id: 'boss-w5-p2', mode: 'bug', title: 'Phase 2 : briser la spirale',
        prompt: 'Ce programme doit afficher les puissances de 2 inférieures ou égales à n (entrée `20` → `1 2 4 8 16`). Il tourne à l\'infini ou se trompe : corrige-le.',
        starter: t`
          #include <stdio.h>

          int main(void)
          {
              int n;
              scanf("%d", &n);
              int p = 0;
              while (p <= n) {
                  printf("%d ", p);
                  p = p * 2;
              }
              printf("\n");
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int n;
              scanf("%d", &n);
              int p = 1;
              while (p <= n) {
                  printf("%d ", p);
                  p = p * 2;
              }
              printf("\n");
              return 0;
          }
        `,
        tests: [{ stdin: '20\n' }, { stdin: '1\n', hidden: true }, { stdin: '1000\n', hidden: true }],
        hints: ['Que vaut 0 × 2 ?', 'La première puissance de 2 est 1.'],
      }),
      ex({
        id: 'boss-w5-p3', mode: 'write', title: 'Phase 3 : la suite de Syracuse',
        prompt: 'Coup final : lis n ≥ 1. Tant que n ≠ 1 : si n est pair, n devient n / 2, sinon n devient 3n + 1. Affiche chaque valeur sur une même ligne séparée par des espaces (en commençant par n), puis à la ligne `Etapes : <nombre de transformations>`.\n\nEntrée `6` → `6 3 10 5 16 8 4 2 1` puis `Etapes : 8`.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              long long n;
              scanf("%lld", &n);
              int etapes = 0;
              printf("%lld", n);
              while (n != 1) {
                  if (n % 2 == 0) {
                      n = n / 2;
                  } else {
                      n = 3 * n + 1;
                  }
                  printf(" %lld", n);
                  etapes++;
              }
              printf("\nEtapes : %d\n", etapes);
              return 0;
          }
        `,
        tests: [{ stdin: '6\n' }, { stdin: '1\n' }, { stdin: '27\n', hidden: true }],
        hints: ['Affiche n avant la boucle, puis chaque nouvelle valeur précédée d\'un espace.', 'Compte un tour par transformation.'],
      }),
    ],
  },
};
