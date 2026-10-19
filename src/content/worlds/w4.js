import { t, ex } from '../helpers.js';

export default {
  id: 'w4',
  num: 4,
  title: 'Conditions',
  subtitle: 'Faire des choix : if, else, opérateurs logiques et switch',
  color: '#fbbf24',
  icon: '🔀',
  intro: t`
    Le Carrefour des Choix est un labyrinthe : chaque embranchement pose une question.
    Un programme doit savoir décider : « si ceci, alors cela, sinon autre chose ».
    Au centre, le Sphinx des Conditions attend ceux qui confondent = et ==.
  `,
  lessons: [
    {
      id: 'w4l1',
      title: 'if et else : prendre une décision',
      topic: 'logic',
      skills: ['logic', 'syntax'],
      objectif: 'Exécuter des instructions seulement si une condition est vraie, et prévoir un « sinon ».',
      explication: t`
        \`if (condition) { ... }\` exécute le bloc **seulement si** la condition est vraie.
        \`else { ... }\` est exécuté dans le cas contraire.

        Une condition compare des valeurs avec un **opérateur de comparaison** :
        \`==\` égal, \`!=\` différent, \`<\` \`>\` \`<=\` \`>=\`.

        En C, une condition vaut **0 (faux)** ou **1 (vrai)**. Toute valeur non nulle est considérée comme vraie.

        ⚠️ Le piège le plus célèbre : \`if (x = 5)\` **affecte** 5 à x (et c'est toujours vrai). Pour comparer, il faut \`==\`.
        Autre piège : \`if (x > 0);\` — le \`;\` termine le if, le bloc suivant s'exécute toujours.

        Mets toujours des accolades \`{ }\`, même pour une seule instruction : c'est plus sûr.
      `,
      syntaxe: {
        code: t`
          if (condition) {
              // si vrai
          } else {
              // si faux
          }
        `,
        note: 'Pas de ; après la parenthèse du if.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int n;
              scanf("%d", &n);
              if (n % 2 == 0) {
                  printf("%d est pair\n", n);
              } else {
                  printf("%d est impair\n", n);
              }
              if (n < 0) {
                  printf("Il est negatif\n");
              }
              return 0;
          }
        `,
        stdin: '7\n',
        lines: {
          7: 'La condition : le reste de n / 2 vaut-il 0 ?',
          9: 'Sinon : le bloc else est exécuté.',
          12: 'Un if sans else : si la condition est fausse, rien ne se passe.',
        },
      },
      visualisation: { kind: 'trace', note: 'Avec n = 7, la condition n % 2 == 0 est fausse : l\'exécution saute directement au else.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int note = 8;
              if (note = 20) {
                  printf("Note parfaite !\n");
              }
              printf("note vaut %d\n", note);
              return 0;
          }
        `,
        explication: '`note = 20` est une affectation : note devient 20 et la condition vaut 20, donc vrai. Le compilateur avertit « suggest parentheses around assignment used as truth value ». Il fallait `note == 20`.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int note = 8;
              if (note == 20) {
                  printf("Note parfaite !\n");
              }
              printf("note vaut %d\n", note);
              return 0;
          }
        `,
      },
      python: { py: 'if n % 2 == 0:\n    print("pair")\nelse:\n    print("impair")', c: 'if (n % 2 == 0) {\n    printf("pair\\n");\n} else {\n    printf("impair\\n");\n}', note: 'Parenthèses obligatoires autour de la condition, accolades au lieu des deux-points et de l\'indentation.' },
      guide: ex({
        id: 'w4l1-guide',
        mode: 'complete',
        title: 'Le plus grand des deux',
        prompt: 'Complète pour afficher le maximum de deux entiers lus. Entrée `4 9` → `Max : 9`.',
        template: t`
          #include <stdio.h>

          int main(void)
          {
              int a, b;
              scanf("%d %d", &a, &b);
              if (a ⟦⟧ b) {
                  printf("Max : %d\n", a);
              } ⟦⟧ {
                  printf("Max : %d\n", b);
              }
              return 0;
          }
        `,
        blanks: [{ answer: '>', width: 3 }, { answer: 'else', width: 5 }],
        tests: [{ stdin: '4 9\n' }, { stdin: '12 3\n' }, { stdin: '5 5\n', hidden: true }, { stdin: '-2 -8\n', hidden: true }],
        hints: ['Quand faut-il afficher a ? Quand a est plus grand que b.', 'Le mot-clé du « sinon ».'],
      }),
      mission: ex({
        id: 'w4l1-mission',
        mode: 'write',
        title: 'Le videur du club',
        prompt: 'Lis un âge (entier). Affiche `Acces autorise` si l\'âge est au moins 18, sinon `Acces refuse : encore <n> an(s)` où n est le nombre d\'années manquantes.\n\nExemples : `20` → `Acces autorise` ; `15` → `Acces refuse : encore 3 an(s)`.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int age;
              scanf("%d", &age);
              if (age >= 18) {
                  printf("Acces autorise\n");
              } else {
                  printf("Acces refuse : encore %d an(s)\n", 18 - age);
              }
              return 0;
          }
        `,
        tests: [{ stdin: '20\n' }, { stdin: '15\n' }, { stdin: '18\n', hidden: true }, { stdin: '17\n', hidden: true }],
        hints: ['« au moins 18 » s\'écrit age >= 18.', 'Les années manquantes : 18 - age.'],
      }),
      quiz: [
        { q: 'Que vaut la condition `(5 > 3)` en C ?', choices: ['0', '1', '5', 'true (texte)'], answer: 1, explain: 'Vrai vaut 1.' },
        { q: 'Que fait `if (x = 0) { ... }` ?', choices: ['Teste si x vaut 0', 'Met 0 dans x et n\'exécute jamais le bloc', 'Erreur de compilation', 'Exécute toujours le bloc'], answer: 1, explain: 'Affectation de 0 : la condition vaut 0, donc faux.' },
        { q: 'Avec `if (n > 10); printf("grand");`, quand « grand » s\'affiche-t-il ?', choices: ['Si n > 10', 'Jamais', 'Toujours', 'Si n < 10'], answer: 2, explain: 'Le ; termine le if : le printf n\'en dépend plus.' },
        { q: 'Quel opérateur signifie « différent de » ?', choices: ['<>', '!=', '=!', '=/='], answer: 1, explain: '!=' },
      ],
      resume: [
        '`if (cond) { ... } else { ... }`.',
        'Comparer : `==`, `!=`, `<`, `>`, `<=`, `>=`.',
        '`=` affecte, `==` compare.',
        'Jamais de `;` juste après `if (...)`.',
      ],
    },
    {
      id: 'w4l2',
      title: 'else if et conditions imbriquées',
      topic: 'logic',
      skills: ['logic'],
      objectif: 'Choisir entre plusieurs cas avec une chaîne else if, et imbriquer des conditions.',
      explication: t`
        Quand il y a **plus de deux cas**, on enchaîne avec \`else if\` :
        le programme teste les conditions **dans l'ordre** et exécute **le premier** bloc dont la condition est vraie, puis saute tout le reste.

        L'ordre compte ! Pour un barème de notes, on teste d'abord la note la plus haute :
        si \`note >= 16\` est faux, on sait déjà que note < 16 dans le \`else if (note >= 14)\` suivant.

        On peut aussi **imbriquer** un if dans un autre. Indente bien chaque niveau, sinon tu te perdras dans les accolades.
      `,
      syntaxe: {
        code: t`
          if (cond1) {
              ...
          } else if (cond2) {
              ...
          } else {
              ...   // aucun cas précédent
          }
        `,
        note: 'Un seul bloc de la chaîne s\'exécute.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int temp;
              scanf("%d", &temp);
              if (temp < 0) {
                  printf("Glace\n");
              } else if (temp < 100) {
                  printf("Liquide\n");
              } else {
                  printf("Vapeur\n");
              }
              if (temp >= 0) {
                  if (temp == 37) {
                      printf("Temperature du corps humain\n");
                  }
              }
              return 0;
          }
        `,
        stdin: '37\n',
        lines: {
          7: 'Premier test.',
          9: 'Testé seulement si temp >= 0 : on sait donc que 0 <= temp < 100 ici.',
          11: 'Tous les autres cas.',
          15: 'Une condition imbriquée dans une autre.',
        },
      },
      visualisation: { kind: 'trace', note: 'Avec 37 : le premier test échoue, le deuxième réussit… et les suivants de la chaîne sont sautés.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int note = 17;
              if (note >= 10) {
                  printf("Passable\n");
              } else if (note >= 14) {
                  printf("Bien\n");
              } else if (note >= 16) {
                  printf("Tres bien\n");
              }
              return 0;
          }
        `,
        logic: true,
        explication: 'Avec 17, la première condition (>= 10) est déjà vraie : le programme affiche « Passable » et ignore la suite. Les conditions doivent aller de la plus exigeante à la moins exigeante.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int note = 17;
              if (note >= 16) {
                  printf("Tres bien\n");
              } else if (note >= 14) {
                  printf("Bien\n");
              } else if (note >= 10) {
                  printf("Passable\n");
              }
              return 0;
          }
        `,
      },
      python: { py: 'if a: ...\nelif b: ...\nelse: ...', c: 'if (a) { ... }\nelse if (b) { ... }\nelse { ... }', note: 'Le elif de Python s\'écrit else if en C.' },
      guide: ex({
        id: 'w4l2-guide',
        mode: 'order',
        title: 'Le signe d\'un nombre',
        prompt: 'Remets les lignes dans l\'ordre pour afficher `positif`, `negatif` ou `nul`.',
        prefix: '#include <stdio.h>\n\nint main(void)\n{\n    int n;\n    scanf("%d", &n);',
        suffix: '    return 0;\n}',
        lines: [
          '    if (n > 0) {',
          '        printf("positif\\n");',
          '    } else if (n < 0) {',
          '        printf("negatif\\n");',
          '    } else {',
          '        printf("nul\\n");',
          '    }',
        ],
        tests: [{ stdin: '5\n' }, { stdin: '-3\n' }, { stdin: '0\n' }],
        hints: ['Le premier if ouvre la chaîne.', 'Le else final n\'a pas de condition.'],
      }),
      mission: ex({
        id: 'w4l2-mission',
        mode: 'write',
        title: 'Calculateur de mention',
        prompt: 'Lis une note entière sur 20. Affiche la mention :\n- `Note invalide` si la note n\'est pas entre 0 et 20\n- `Tres bien` (≥ 16), `Bien` (≥ 14), `Assez bien` (≥ 12), `Passable` (≥ 10), sinon `Insuffisant`.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int note;
              scanf("%d", &note);
              if (note < 0 || note > 20) {
                  printf("Note invalide\n");
              } else if (note >= 16) {
                  printf("Tres bien\n");
              } else if (note >= 14) {
                  printf("Bien\n");
              } else if (note >= 12) {
                  printf("Assez bien\n");
              } else if (note >= 10) {
                  printf("Passable\n");
              } else {
                  printf("Insuffisant\n");
              }
              return 0;
          }
        `,
        tests: [{ stdin: '17\n' }, { stdin: '9\n' }, { stdin: '12\n' }, { stdin: '25\n', hidden: true }, { stdin: '14\n', hidden: true }, { stdin: '10\n', hidden: true }, { stdin: '-1\n', hidden: true }, { stdin: '20\n', hidden: true }],
        hints: ['Commence par traiter le cas invalide.', 'Teste ensuite de la plus haute mention à la plus basse.', 'Attention aux bornes : 16 donne « Tres bien ».'],
      }),
      quiz: [
        { q: 'Dans une chaîne if / else if / else, combien de blocs s\'exécutent au maximum ?', choices: ['Tous ceux dont la condition est vraie', 'Un seul', 'Deux', 'Aucun'], answer: 1, explain: 'Le premier bloc vrai, puis on sort de la chaîne.' },
        { q: 'Pourquoi tester `note >= 16` avant `note >= 10` ?', choices: ['Pour aller plus vite', 'Sinon une note de 18 serait classée au premier test vrai (>= 10)', 'C\'est obligatoire en C', 'Pour éviter un warning'], answer: 1, explain: 'L\'ordre des tests détermine le résultat.' },
        { q: 'Le bloc `else` final s\'exécute quand…', choices: ['Toutes les conditions précédentes sont fausses', 'La première est fausse', 'Toujours', 'Jamais'], answer: 0, explain: 'C\'est le cas par défaut.' },
      ],
      resume: [
        '`else if` enchaîne plusieurs cas, testés dans l\'ordre.',
        'Seul le premier cas vrai s\'exécute.',
        'Ordonne les conditions de la plus restrictive à la plus large.',
        'Indente chaque niveau d\'imbrication.',
      ],
    },
    {
      id: 'w4l3',
      title: 'Opérateurs logiques : &&, ||, !',
      topic: 'logic',
      skills: ['logic'],
      objectif: 'Combiner plusieurs conditions avec ET, OU, NON.',
      explication: t`
        - \`a && b\` (**ET**) : vrai si **les deux** sont vraies.
        - \`a || b\` (**OU**) : vrai si **au moins une** est vraie.
        - \`!a\` (**NON**) : inverse la condition.

        Exemple : un nombre est dans l'intervalle [10, 20] si \`n >= 10 && n <= 20\`.
        ⚠️ On ne peut pas écrire \`10 <= n <= 20\` comme en maths : en C, cela compare d'abord \`10 <= n\` (0 ou 1)… à 20 !

        Autre piège : \`x == 1 || 2\` est **toujours vrai** (2 est non nul). Il faut \`x == 1 || x == 2\`.

        **Évaluation paresseuse** : dans \`a && b\`, si a est faux, b n'est même pas évalué. Pratique : \`if (b != 0 && a / b > 2)\` ne divise jamais par zéro.

        Priorité : \`!\` avant \`&&\` avant \`||\`. Dans le doute, mets des parenthèses.
      `,
      syntaxe: {
        code: t`
          if (age >= 12 && age <= 17) { ... }   // ET
          if (jour == 6 || jour == 7) { ... }   // OU
          if (!trouve) { ... }                  // NON
        `,
        note: '&& et || : deux symboles collés.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int annee;
              scanf("%d", &annee);
              int bissextile = (annee % 4 == 0 && annee % 100 != 0) || annee % 400 == 0;
              if (bissextile) {
                  printf("%d est bissextile\n", annee);
              } else {
                  printf("%d n'est pas bissextile\n", annee);
              }
              if (!bissextile && annee % 2 == 0) {
                  printf("mais elle est paire\n");
              }
              return 0;
          }
        `,
        stdin: '1900\n',
        lines: {
          7: 'Règle : divisible par 4 et pas par 100, OU divisible par 400. Le résultat (0 ou 1) est rangé dans un int.',
          8: 'Une variable peut servir directement de condition.',
          13: '! inverse : « pas bissextile ET paire ».',
        },
      },
      visualisation: { kind: 'trace', note: '1900 est divisible par 4 et par 100, mais pas par 400 : bissextile vaut 0.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int choix = 5;
              if (choix == 1 || 2) {
                  printf("Option 1 ou 2\n");
              }
              return 0;
          }
        `,
        explication: '`choix == 1 || 2` signifie « (choix == 1) OU (2) ». Or 2 est non nul, donc toujours vrai : le message s\'affiche même avec 5. Chaque côté de || doit être une comparaison complète.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int choix = 5;
              if (choix == 1 || choix == 2) {
                  printf("Option 1 ou 2\n");
              }
              return 0;
          }
        `,
      },
      python: { py: 'if 10 <= n <= 20 and not fini:', c: 'if (n >= 10 && n <= 20 && !fini)', note: 'and/or/not deviennent &&, ||, !. Et la double comparaison de Python n\'existe pas en C.' },
      guide: ex({
        id: 'w4l3-guide',
        mode: 'complete',
        title: 'Le tarif réduit',
        prompt: 'Le tarif réduit s\'applique aux moins de 12 ans **ou** aux 65 ans et plus. Complète les opérateurs. Entrée `70` → `Tarif reduit`.',
        template: t`
          #include <stdio.h>

          int main(void)
          {
              int age;
              scanf("%d", &age);
              if (age ⟦⟧ 12 ⟦⟧ age >= 65) {
                  printf("Tarif reduit\n");
              } else {
                  printf("Plein tarif\n");
              }
              return 0;
          }
        `,
        blanks: [{ answer: '<', width: 3 }, { answer: '||', width: 3 }],
        tests: [{ stdin: '70\n' }, { stdin: '30\n' }, { stdin: '8\n', hidden: true }, { stdin: '12\n', hidden: true }, { stdin: '65\n', hidden: true }],
        hints: ['« moins de 12 ans » : age < 12.', '« ou » s\'écrit avec deux barres verticales.'],
      }),
      mission: ex({
        id: 'w4l3-mission',
        mode: 'write',
        title: 'Le triangle',
        prompt: 'Lis trois longueurs entières a, b, c. Affiche :\n- `Impossible` si l\'une est ≤ 0 ou si un côté est ≥ la somme des deux autres ;\n- sinon `Equilateral` (3 égaux), `Isocele` (exactement 2 égaux) ou `Quelconque`.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int a, b, c;
              scanf("%d %d %d", &a, &b, &c);
              if (a <= 0 || b <= 0 || c <= 0 || a >= b + c || b >= a + c || c >= a + b) {
                  printf("Impossible\n");
              } else if (a == b && b == c) {
                  printf("Equilateral\n");
              } else if (a == b || b == c || a == c) {
                  printf("Isocele\n");
              } else {
                  printf("Quelconque\n");
              }
              return 0;
          }
        `,
        tests: [{ stdin: '3 3 3\n' }, { stdin: '3 4 5\n' }, { stdin: '1 2 10\n' }, { stdin: '5 5 8\n', hidden: true }, { stdin: '0 4 4\n', hidden: true }, { stdin: '2 3 5\n', hidden: true }, { stdin: '7 4 7\n', hidden: true }],
        hints: ['Teste d\'abord tous les cas impossibles avec ||.', 'Équilatéral : a == b && b == c.', 'Isocèle : au moins une paire égale (les équilatéraux sont déjà traités).'],
      }),
      quiz: [
        { q: 'Comment écrire « n est entre 1 et 9 inclus » ?', choices: ['1 <= n <= 9', 'n >= 1 && n <= 9', 'n >= 1 || n <= 9', 'n => 1 && n =< 9'], answer: 1, explain: 'Deux comparaisons reliées par &&.' },
        { q: 'Que vaut `!(3 > 5)` ?', choices: ['0', '1', '-1', 'Erreur'], answer: 1, explain: '3 > 5 vaut 0, ! inverse en 1.' },
        { q: 'Dans `b != 0 && a / b > 1`, si b vaut 0…', choices: ['Division par zéro', 'La division n\'est pas évaluée', 'Erreur de compilation', 'Le résultat est 1'], answer: 1, explain: 'Évaluation paresseuse : le premier test faux arrête tout.' },
        { q: '`x == 1 || 2` est…', choices: ['Vrai si x vaut 1 ou 2', 'Toujours vrai', 'Toujours faux', 'Une erreur'], answer: 1, explain: '2 est non nul, donc vrai.' },
      ],
      resume: [
        '`&&` ET, `||` OU, `!` NON.',
        'Intervalle : `n >= a && n <= b` (jamais `a <= n <= b`).',
        'Chaque côté de `||` est une comparaison complète.',
        'Évaluation paresseuse : utile pour éviter une division par zéro.',
      ],
    },
    {
      id: 'w4l4',
      title: 'switch, case et break',
      topic: 'logic',
      skills: ['logic', 'syntax'],
      objectif: 'Choisir parmi des valeurs précises avec switch, sans oublier break.',
      explication: t`
        \`switch\` compare une valeur **entière** (ou un caractère) à une liste de **constantes** :
        chaque \`case valeur:\` est une étiquette, \`default:\` traite les autres cas.

        L'exécution **saute** à l'étiquette correspondante puis continue **jusqu'au prochain \`break\`**.
        Si tu oublies \`break\`, l'exécution « tombe » dans le case suivant (*fall-through*).

        On peut regrouper plusieurs valeurs : \`case 'a': case 'A': ...\`.

        Limites : switch ne marche pas avec des \`double\` ni des chaînes, et chaque case doit être une constante (pas une variable, pas un intervalle).
      `,
      syntaxe: {
        code: t`
          switch (valeur) {
              case 1:
                  ...
                  break;
              case 2:
              case 3:
                  ...
                  break;
              default:
                  ...
                  break;
          }
        `,
        note: 'Un break à la fin de chaque case.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              char op;
              int a = 12, b = 4;
              scanf(" %c", &op);
              switch (op) {
                  case '+':
                      printf("%d\n", a + b);
                      break;
                  case '-':
                      printf("%d\n", a - b);
                      break;
                  case 'x':
                  case '*':
                      printf("%d\n", a * b);
                      break;
                  default:
                      printf("Operateur inconnu\n");
                      break;
              }
              return 0;
          }
        `,
        stdin: 'x\n',
        lines: {
          8: 'On compare op à chaque étiquette.',
          15: 'Deux étiquettes pour le même code.',
          19: 'Tous les autres caractères.',
          11: 'break : sortie du switch.',
        },
      },
      visualisation: { kind: 'trace', note: 'Avec « x », l\'exécution saute directement au case \'x\', glisse vers le code du \'*\' et s\'arrête au break.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int jour = 1;
              switch (jour) {
                  case 1:
                      printf("Lundi\n");
                  case 2:
                      printf("Mardi\n");
                      break;
                  default:
                      printf("Autre\n");
              }
              return 0;
          }
        `,
        explication: 'Il manque un break après « Lundi » : l\'exécution continue dans le case 2 et affiche aussi « Mardi ». Le compilateur avertit (-Wimplicit-fallthrough).',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int jour = 1;
              switch (jour) {
                  case 1:
                      printf("Lundi\n");
                      break;
                  case 2:
                      printf("Mardi\n");
                      break;
                  default:
                      printf("Autre\n");
                      break;
              }
              return 0;
          }
        `,
      },
      python: { py: 'match op:\n    case "+": ...\n    case _: ...', c: 'switch (op) {\n    case \'+\': ... break;\n    default: ... break;\n}', note: 'Le match de Python ne « tombe » jamais dans le cas suivant ; le switch du C, si (sans break).' },
      guide: ex({
        id: 'w4l4-guide',
        mode: 'bug',
        title: 'Le menu qui déborde',
        prompt: 'Ce menu affiche trop de lignes. Corrige-le : entrée `1` → `Nouvelle partie` seulement, `2` → `Charger`, autre → `Quitter`.',
        starter: t`
          #include <stdio.h>

          int main(void)
          {
              int choix;
              scanf("%d", &choix);
              switch (choix) {
                  case 1:
                      printf("Nouvelle partie\n");
                  case 2:
                      printf("Charger\n");
                  default:
                      printf("Quitter\n");
              }
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int choix;
              scanf("%d", &choix);
              switch (choix) {
                  case 1:
                      printf("Nouvelle partie\n");
                      break;
                  case 2:
                      printf("Charger\n");
                      break;
                  default:
                      printf("Quitter\n");
                      break;
              }
              return 0;
          }
        `,
        tests: [{ stdin: '1\n' }, { stdin: '2\n' }, { stdin: '9\n' }],
        hints: ['Que se passe-t-il après le printf du case 1 ?', 'Ajoute break; à la fin de chaque case.'],
      }),
      mission: ex({
        id: 'w4l4-mission',
        mode: 'write',
        title: 'La calculatrice',
        prompt: 'Lis une opération sous la forme `a op b` (deux réels et un caractère parmi `+ - * /`), par exemple `7.5 * 2`. Avec un **switch**, affiche le résultat avec 2 décimales. Cas d\'erreur : `Division par zero` si b vaut 0 pour `/`, et `Operateur inconnu` sinon.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              double a, b;
              char op;
              scanf("%lf %c %lf", &a, &op, &b);
              switch (op) {
                  case '+':
                      printf("%.2f\n", a + b);
                      break;
                  case '-':
                      printf("%.2f\n", a - b);
                      break;
                  case '*':
                      printf("%.2f\n", a * b);
                      break;
                  case '/':
                      if (b == 0) {
                          printf("Division par zero\n");
                      } else {
                          printf("%.2f\n", a / b);
                      }
                      break;
                  default:
                      printf("Operateur inconnu\n");
                      break;
              }
              return 0;
          }
        `,
        tests: [{ stdin: '7.5 * 2\n' }, { stdin: '10 / 4\n' }, { stdin: '3 / 0\n' }, { stdin: '1 % 2\n', hidden: true }, { stdin: '2.5 - 5\n', hidden: true }, { stdin: '0.1 + 0.2\n', hidden: true }],
        require: [{ pattern: '\\bswitch\\s*\\(', message: 'Utilise un switch sur l\'opérateur.' }],
        hints: ['scanf("%lf %c %lf", &a, &op, &b) lit les trois parties.', 'Un case par opérateur ; pour / ajoute un if sur b.', 'default pour tout le reste.'],
      }),
      quiz: [
        { q: 'Que se passe-t-il sans break à la fin d\'un case ?', choices: ['Erreur de compilation', 'Le switch s\'arrête quand même', 'L\'exécution continue dans le case suivant', 'Le default s\'exécute'], answer: 2, explain: 'C\'est le fall-through.' },
        { q: 'Peut-on faire `switch` sur un double ?', choices: ['Oui', 'Non, seulement des entiers / caractères', 'Seulement avec default', 'Seulement en C99'], answer: 1, explain: 'switch quantity not an integer.' },
        { q: '`case x:` où x est une variable…', choices: ['Fonctionne', 'Est interdit : il faut une constante', 'Fonctionne si x est un int', 'Remplace default'], answer: 1, explain: 'Les étiquettes doivent être des constantes.' },
      ],
      resume: [
        '`switch (entier) { case CONST: ... break; default: ... }`.',
        'Oublier `break` : l\'exécution tombe dans le case suivant.',
        'Plusieurs `case` peuvent partager le même code.',
        'Pas de double, pas de chaîne, pas d\'intervalle dans un case.',
      ],
    },
  ],
  challenges: [
    ex({
      id: 'w4-c1', mode: 'write', kind: 'challenge', title: 'Projet 1 : la calculatrice complète',
      prompt: 'Lis deux entiers puis un caractère d\'opération parmi `+ - * / %`, par exemple `17 5 %`. Affiche `17 % 5 = 2`. Pour `/`, affiche le quotient **réel** avec 2 décimales (`17 / 5 = 3.40`). Gère : diviseur nul (`Erreur : division par zero`) et opérateur inconnu (`Erreur : operateur inconnu`).',
      solution: t`
        #include <stdio.h>

        int main(void)
        {
            int a, b;
            char op;
            scanf("%d %d %c", &a, &b, &op);
            if ((op == '/' || op == '%') && b == 0) {
                printf("Erreur : division par zero\n");
                return 1;
            }
            switch (op) {
                case '+': printf("%d + %d = %d\n", a, b, a + b); break;
                case '-': printf("%d - %d = %d\n", a, b, a - b); break;
                case '*': printf("%d * %d = %d\n", a, b, a * b); break;
                case '/': printf("%d / %d = %.2f\n", a, b, (double) a / b); break;
                case '%': printf("%d %% %d = %d\n", a, b, a % b); break;
                default: printf("Erreur : operateur inconnu\n"); return 1;
            }
            return 0;
        }
      `,
      tests: [{ stdin: '17 5 %\n' }, { stdin: '17 5 /\n' }, { stdin: '3 0 /\n' }, { stdin: '2 3 ^\n', hidden: true }, { stdin: '-4 6 *\n', hidden: true }, { stdin: '9 0 %\n', hidden: true }],
      hints: ['Pour afficher % dans printf : %%.', 'Teste le diviseur nul avant le switch.'],
    }),
    ex({
      id: 'w4-c2', mode: 'write', kind: 'challenge', title: 'Le plus grand des trois',
      prompt: 'Lis trois entiers et affiche le plus grand, **sans utiliser de fonction toute faite**. Entrée `4 11 7` → `11`.',
      solution: t`
        #include <stdio.h>

        int main(void)
        {
            int a, b, c;
            scanf("%d %d %d", &a, &b, &c);
            int max = a;
            if (b > max) {
                max = b;
            }
            if (c > max) {
                max = c;
            }
            printf("%d\n", max);
            return 0;
        }
      `,
      tests: [{ stdin: '4 11 7\n' }, { stdin: '9 2 3\n', hidden: true }, { stdin: '-5 -1 -9\n', hidden: true }, { stdin: '6 6 6\n', hidden: true }],
      hints: ['Suppose que a est le max, puis compare avec b, puis avec c.'],
    }),
  ],
  boss: {
    id: 'boss-w4',
    name: 'Le Sphinx des Conditions',
    avatar: 'sphinx',
    taunt: 'Réponds à mes énigmes : vrai ou faux ? = ou == ? Une seule erreur de logique et tu resteras prisonnier du labyrinthe !',
    defeat: 'Tes conditions sont limpides… Le passage est ouvert.',
    timeLimit: 900,
    phases: [
      ex({
        id: 'boss-w4-p1', mode: 'predict', title: 'Énigme 1 : la logique du Sphinx',
        prompt: 'Que va afficher ce programme ?',
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int x = 7;
              printf("%d %d %d\n", x > 5 && x < 7, x == 7 || x / (x - 7) == 1, !(x % 2));
              return 0;
          }
        `,
        choices: ['0 1 0', '1 1 1', '0 1 1', 'Erreur : division par zéro'],
        hints: ['x < 7 est faux pour x = 7.', 'Le || s\'arrête dès que le premier test est vrai.'],
      }),
      ex({
        id: 'boss-w4-p2', mode: 'bug', title: 'Énigme 2 : le portail piégé',
        prompt: 'Le portail ne s\'ouvre que si le code est entre 100 et 199 **et** que la clé est `K` ou `k`. Corrige la logique : entrée `150 K` → `Ouvert`, `250 K` → `Ferme`, `150 x` → `Ferme`.',
        starter: t`
          #include <stdio.h>

          int main(void)
          {
              int code;
              char cle;
              scanf("%d %c", &code, &cle);
              if (100 <= code <= 199 && cle == 'K' || 'k') {
                  printf("Ouvert\n");
              } else {
                  printf("Ferme\n");
              }
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int code;
              char cle;
              scanf("%d %c", &code, &cle);
              if (code >= 100 && code <= 199 && (cle == 'K' || cle == 'k')) {
                  printf("Ouvert\n");
              } else {
                  printf("Ferme\n");
              }
              return 0;
          }
        `,
        tests: [{ stdin: '150 K\n' }, { stdin: '250 K\n' }, { stdin: '150 x\n' }, { stdin: '100 k\n', hidden: true }, { stdin: '99 k\n', hidden: true }],
        hints: ['Un intervalle s\'écrit avec deux comparaisons et &&.', 'Chaque côté de || doit comparer cle.', 'Des parenthèses autour du OU sont nécessaires.'],
      }),
      ex({
        id: 'boss-w4-p3', mode: 'write', title: 'Énigme 3 : les jours du mois',
        prompt: 'Lis un mois (1-12) et une année. Affiche le nombre de jours du mois. Février a 29 jours les années bissextiles (divisible par 4 et pas par 100, ou divisible par 400). Mois invalide → `Mois invalide`.\n\nExemples : `2 2024` → `29`, `4 2023` → `30`, `13 2000` → `Mois invalide`.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int mois, annee;
              scanf("%d %d", &mois, &annee);
              switch (mois) {
                  case 1: case 3: case 5: case 7: case 8: case 10: case 12:
                      printf("31\n");
                      break;
                  case 4: case 6: case 9: case 11:
                      printf("30\n");
                      break;
                  case 2:
                      if ((annee % 4 == 0 && annee % 100 != 0) || annee % 400 == 0) {
                          printf("29\n");
                      } else {
                          printf("28\n");
                      }
                      break;
                  default:
                      printf("Mois invalide\n");
                      break;
              }
              return 0;
          }
        `,
        tests: [{ stdin: '2 2024\n' }, { stdin: '4 2023\n' }, { stdin: '13 2000\n' }, { stdin: '2 1900\n', hidden: true }, { stdin: '2 2000\n', hidden: true }, { stdin: '12 2021\n', hidden: true }, { stdin: '0 2021\n', hidden: true }],
        hints: ['Regroupe les mois de 31 jours avec plusieurs case.', 'Février : un if bissextile dans le case 2.'],
      }),
    ],
  },
};
