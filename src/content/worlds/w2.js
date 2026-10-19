import { t, ex } from '../helpers.js';

export default {
  id: 'w2',
  num: 2,
  title: 'Variables et Types',
  subtitle: 'Ranger des valeurs en mémoire, choisir le bon type et l\'afficher correctement',
  color: '#a78bfa',
  icon: '📦',
  intro: t`
    Dans la Vallée des Boîtes, chaque valeur doit être rangée dans une boîte étiquetée : une variable.
    Le Glitch a mélangé les étiquettes… Apprends à déclarer, typer et afficher tes variables
    pour affronter l'Hydre des Types.
  `,
  lessons: [
    {
      id: 'w2l1',
      title: 'Déclarer, initialiser, affecter',
      topic: 'syntax',
      skills: ['syntax', 'memory'],
      objectif: 'Créer des variables, leur donner une valeur, la modifier, et respecter les règles de nommage.',
      explication: t`
        Une **variable** est une boîte en mémoire qui porte un **nom** et contient une **valeur** d'un certain **type**.

        - **Déclarer** : \`int age;\` crée la boîte (pour un entier). Sa valeur est encore inconnue !
        - **Initialiser** : \`int age = 17;\` crée la boîte et y range 17 tout de suite. C'est la bonne habitude.
        - **Affecter** : \`age = 18;\` remplace la valeur. Le signe \`=\` se lit « **reçoit** ».
        - **Mettre à jour** : \`age = age + 1;\` — à droite on lit l'ancienne valeur, à gauche on range la nouvelle.

        **Règles de nommage** : lettres, chiffres et \`_\` ; pas d'espace ; ne commence pas par un chiffre ;
        pas de mot-clé (\`int\`, \`return\`…). Le C distingue majuscules et minuscules : \`Score\` ≠ \`score\`.
        Choisis des noms parlants : \`nb_eleves\` plutôt que \`n2\`.

        Une variable ne se **déclare qu'une seule fois** dans un bloc : ensuite, on l'utilise sans répéter le type.
      `,
      syntaxe: {
        code: t`
          type nom;            // déclaration
          type nom = valeur;   // déclaration + initialisation
          nom = valeur;        // affectation
          nom = nom + 1;       // mise à jour
        `,
        note: 'Le type s\'écrit seulement à la déclaration.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int vies = 3;
              int score = 0;
              score = score + 50;
              vies = vies - 1;
              score = score + 25;
              printf("Score : %d\n", score);
              printf("Vies : %d\n", vies);
              return 0;
          }
        `,
        lines: {
          5: 'Déclaration + initialisation : la boîte « vies » contient 3.',
          6: '« score » commence à 0.',
          7: 'Mise à jour : score reçoit 0 + 50, donc 50.',
          8: 'vies reçoit 3 - 1, donc 2.',
          9: 'score passe à 75.',
          10: '`%d` est remplacé par la valeur de score (on verra les formats bientôt).',
        },
      },
      visualisation: { kind: 'trace', note: 'Suis les boîtes en mémoire : à chaque ligne, une seule valeur change.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int score = 10;
              int score = 20;
              printf("%d\n", score);
              return 0;
          }
        `,
        explication: 'La variable `score` est déclarée deux fois dans le même bloc. Pour changer sa valeur, il faut écrire seulement `score = 20;` (sans le type).',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int score = 10;
              score = 20;
              printf("%d\n", score);
              return 0;
          }
        `,
      },
      python: { py: 'score = 10\nscore = score + 5', c: 'int score = 10;\nscore = score + 5;', note: 'Python crée la variable à la première affectation. En C, on la déclare une fois avec son type.' },
      guide: ex({
        id: 'w2l1-guide',
        mode: 'complete',
        title: 'La tirelire',
        prompt: 'Complète pour que la tirelire contienne 15, puis reçoive 10 de plus, et que le programme affiche `Tirelire : 25`.',
        template: t`
          #include <stdio.h>

          int main(void)
          {
              ⟦⟧ tirelire = 15;
              tirelire = ⟦⟧ + 10;
              printf("Tirelire : %d\n", ⟦⟧);
              return 0;
          }
        `,
        blanks: [{ answer: 'int', width: 4 }, { answer: 'tirelire', width: 9 }, { answer: 'tirelire', width: 9 }],
        hints: ['Le type d\'un nombre entier est int.', 'Pour ajouter 10, on part de l\'ancienne valeur de la même variable.'],
      }),
      mission: ex({
        id: 'w2l1-mission',
        mode: 'write',
        title: 'Le compte en banque',
        prompt: 'Un compte contient 500. On dépose 120, puis on retire 75. Utilise **une seule variable entière** `solde` et affiche :\n```\nSolde initial : 500\nApres depot : 620\nApres retrait : 545\n```',
        starter: t`
          #include <stdio.h>

          int main(void)
          {

              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int solde = 500;
              printf("Solde initial : %d\n", solde);
              solde = solde + 120;
              printf("Apres depot : %d\n", solde);
              solde = solde - 75;
              printf("Apres retrait : %d\n", solde);
              return 0;
          }
        `,
        require: [{ pattern: '\\bint\\s+solde\\b', message: 'Déclare une variable entière nommée solde.' }, { pattern: 'solde\\s*=\\s*solde', message: 'Mets à jour solde avec « solde = solde + ... ».' }],
        hints: ['Déclare int solde = 500; puis affiche-la avec %d.', 'Pour déposer : solde = solde + 120;', 'Après chaque opération, un printf.'],
      }),
      quiz: [
        { q: 'Quel nom de variable est valide ?', choices: ['2joueurs', 'nb joueurs', 'nb_joueurs', 'int'], answer: 2, explain: 'Pas de chiffre au début, pas d\'espace, pas de mot-clé.' },
        { q: 'Après `int x = 4; x = x * 3;`, que vaut x ?', choices: ['4', '7', '12', '43'], answer: 2, explain: 'x reçoit 4 * 3.' },
        { q: 'Que signifie le `=` en C ?', choices: ['Est égal à', 'Reçoit la valeur', 'Compare', 'Additionne'], answer: 1, explain: '= est l\'affectation ; la comparaison s\'écrit ==.' },
        { q: '`int a; a = 5;` : comment appelle-t-on la 2e instruction ?', choices: ['Déclaration', 'Affectation', 'Initialisation', 'Inclusion'], answer: 1, explain: 'On range une valeur dans une variable déjà déclarée.' },
      ],
      resume: [
        'Déclarer : `int x;` — initialiser : `int x = 0;` — affecter : `x = 5;`.',
        '`=` se lit « reçoit ».',
        'Le type ne s\'écrit qu\'une fois, à la déclaration.',
        'Noms : lettres, chiffres, _ ; pas d\'espace ; pas de chiffre au début.',
      ],
    },
    {
      id: 'w2l2',
      title: 'Les types : int, float, double, char',
      topic: 'syntax',
      skills: ['syntax', 'memory'],
      objectif: 'Choisir le bon type selon la donnée, connaître leur taille avec sizeof, et éviter les pièges classiques.',
      explication: t`
        Le **type** dit au compilateur quelle sorte de valeur la boîte contient et combien de place réserver.

        - \`int\` : entier (\`-3\`, \`0\`, \`2026\`). Taille : 4 octets.
        - \`double\` : nombre à virgule, **double précision** (\`3.14\`, \`-0.5\`). 8 octets. C'est le choix par défaut pour les réels.
        - \`float\` : nombre à virgule, simple précision (environ 7 chiffres). 4 octets.
        - \`char\` : **un seul caractère** entre apostrophes (\`'A'\`, \`'7'\`, \`'?'\`). 1 octet. En réalité, c'est un petit nombre (le code ASCII : \`'A'\` vaut 65).
        - \`bool\` : vrai/faux (\`true\`/\`false\`), avec \`#include <stdbool.h>\`.

        L'opérateur \`sizeof\` donne la taille en octets d'un type ou d'une variable. On l'affiche avec \`%zu\`.

        En C, la virgule décimale est un **point** : \`2.5\` et non \`2,5\`.
      `,
      syntaxe: {
        code: t`
          int    nb = 42;
          double prix = 19.99;
          float  taux = 0.2f;
          char   lettre = 'B';
          sizeof(int)     // 4
        `,
        note: 'Le f de 0.2f indique une constante float.',
      },
      exemple: {
        code: t`
          #include <stdio.h>
          #include <stdbool.h>

          int main(void)
          {
              int eleves = 28;
              double moyenne = 13.75;
              char mention = 'B';
              bool admis = true;
              printf("%d eleves, moyenne %.2f, mention %c\n", eleves, moyenne, mention);
              printf("admis = %d\n", admis);
              printf("'A' vaut %d en ASCII\n", 'A');
              printf("int : %zu octets, double : %zu octets, char : %zu octet\n", sizeof(int), sizeof(double), sizeof(char));
              return 0;
          }
        `,
        lines: {
          6: 'Un entier.',
          7: 'Un réel : point décimal.',
          8: 'Un caractère entre apostrophes.',
          9: 'Un booléen : true vaut 1, false vaut 0.',
          12: 'Un char est un nombre : son code ASCII.',
          13: 'sizeof donne la taille en octets ; on l\'affiche avec %zu.',
        },
      },
      visualisation: { kind: 'trace', note: 'Chaque boîte a un type : regarde comment le char est affiché (\'B\') et le bool (true).' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int prix = 19.99;
              char initiale = 'AB';
              printf("%d %c\n", prix, initiale);
              return 0;
          }
        `,
        explication: 'Un `int` ne garde pas les décimales : 19.99 devient 19 (tronqué, pas arrondi). Un `char` ne contient qu\'UN caractère : \'AB\' est une erreur.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              double prix = 19.99;
              char initiale = 'A';
              printf("%.2f %c\n", prix, initiale);
              return 0;
          }
        `,
      },
      python: { py: 'n = 3\nx = 2.5\nc = "A"', c: 'int n = 3;\ndouble x = 2.5;\nchar c = \'A\';', note: 'Python devine le type. En C, tu le choisis, et il ne change plus.' },
      guide: ex({
        id: 'w2l2-guide',
        mode: 'complete',
        title: 'Le bon type pour chaque boîte',
        prompt: 'Choisis le bon type pour chaque variable (int, double ou char) afin d\'afficher `Note : 15.5 / Groupe : C / Rang : 3`.',
        template: t`
          #include <stdio.h>

          int main(void)
          {
              ⟦⟧ note = 15.5;
              ⟦⟧ groupe = 'C';
              ⟦⟧ rang = 3;
              printf("Note : %.1f / Groupe : %c / Rang : %d\n", note, groupe, rang);
              return 0;
          }
        `,
        blanks: [{ answer: 'double', width: 7 }, { answer: 'char', width: 7 }, { answer: 'int', width: 7 }],
        hints: ['15.5 a une partie décimale.', '\'C\' est un seul caractère.', '3 est un entier.'],
      }),
      mission: ex({
        id: 'w2l2-mission',
        mode: 'write',
        title: 'Fiche du personnage',
        prompt: 'Crée trois variables : `niveau` (entier 7), `vitesse` (réel 2.5) et `classe` (caractère `M`). Affiche exactement :\n```\nNiveau : 7\nVitesse : 2.50\nClasse : M\nTaille d un double : 8\n```\nLa dernière ligne doit utiliser `sizeof`.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int niveau = 7;
              double vitesse = 2.5;
              char classe = 'M';
              printf("Niveau : %d\n", niveau);
              printf("Vitesse : %.2f\n", vitesse);
              printf("Classe : %c\n", classe);
              printf("Taille d un double : %zu\n", sizeof(double));
              return 0;
          }
        `,
        require: [{ pattern: 'sizeof', message: 'Utilise sizeof pour la dernière ligne.' }, { pattern: "char\\s+classe\\s*=\\s*''", message: 'classe doit être un char initialisé avec des apostrophes.' }],
        hints: ['%d pour un int, %.2f pour un double avec 2 décimales, %c pour un char.', 'sizeof(double) s\'affiche avec %zu.'],
      }),
      quiz: [
        { q: 'Quel type pour une température comme 36.6 ?', choices: ['int', 'char', 'double', 'bool'], answer: 2, explain: 'Un réel : double.' },
        { q: 'Que contient `char c = \'7\';` ?', choices: ['Le nombre 7', 'Le caractère 7 (code 55)', 'Une chaîne', 'Une erreur'], answer: 1, explain: 'Entre apostrophes, c\'est le caractère, dont le code ASCII est 55.' },
        { q: '`int n = 9.8;` : que vaut n ?', choices: ['9.8', '10', '9', 'Erreur'], answer: 2, explain: 'Conversion en int : la partie décimale est coupée.' },
        { q: 'Combien d\'octets occupe un int sur nos machines ?', choices: ['1', '2', '4', '8'], answer: 2, explain: 'sizeof(int) vaut 4.' },
      ],
      resume: [
        '`int` entier, `double` réel (par défaut), `float` réel simple, `char` un caractère.',
        'Point décimal : `2.5`.',
        'Un `char` est un code numérique (ASCII).',
        '`sizeof(type)` donne la taille en octets (`%zu`).',
      ],
    },
    {
      id: 'w2l3',
      title: 'Afficher des valeurs : %d, %f, %c, %s',
      topic: 'syntax',
      skills: ['syntax', 'debug'],
      objectif: 'Utiliser les spécificateurs de format de printf, contrôler les décimales et la largeur.',
      explication: t`
        Dans la chaîne de \`printf\`, chaque **spécificateur** \`%...\` est remplacé, **dans l'ordre**, par les valeurs placées après la virgule.

        - \`%d\` : un \`int\`
        - \`%f\` : un \`double\` (ou \`float\`) — 6 décimales par défaut
        - \`%.2f\` : un réel avec **2 décimales** (arrondi à l'affichage)
        - \`%c\` : un \`char\`
        - \`%s\` : une chaîne de caractères (texte)
        - \`%5d\` : un entier sur 5 caractères (aligné à droite) ; \`%-5d\` aligné à gauche

        printf **fait confiance** au format : si tu affiches un \`double\` avec \`%d\`, le résultat est n'importe quoi.
        Le compilateur t'avertit (warning) : écoute-le !
      `,
      syntaxe: {
        code: t`
          printf("texte %d texte %.2f\n", entier, reel);
        `,
        note: 'Autant de valeurs que de %, dans le même ordre.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int age = 17;
              double taille = 1.756;
              char groupe = 'A';
              printf("Age : %d ans\n", age);
              printf("Taille : %f / %.2f / %.1f\n", taille, taille, taille);
              printf("Groupe %c, nom %s\n", groupe, "Syntaxe");
              printf("[%5d] [%-5d] [%8.2f]\n", age, age, taille);
              return 0;
          }
        `,
        lines: {
          8: '`%d` remplacé par 17.',
          9: '`%f` donne 6 décimales ; `%.2f` arrondit à 2 décimales ; `%.1f` à 1.',
          10: '`%c` pour un caractère, `%s` pour un texte.',
          11: 'La largeur aligne les colonnes : utile pour les tableaux.',
        },
      },
      visualisation: { kind: 'trace', note: 'Compare les valeurs en mémoire et leur affichage formaté dans la console.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              double moyenne = 14.5;
              int nb = 3;
              printf("Moyenne : %d\n", moyenne);
              printf("Nombre : %f\n", nb);
              return 0;
          }
        `,
        explication: 'Mauvais spécificateurs : `%d` pour un double et `%f` pour un int. printf lit la mémoire au mauvais format et affiche des valeurs absurdes.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              double moyenne = 14.5;
              int nb = 3;
              printf("Moyenne : %.1f\n", moyenne);
              printf("Nombre : %d\n", nb);
              return 0;
          }
        `,
      },
      python: { py: 'print(f"Age : {age}, moyenne {m:.2f}")', c: 'printf("Age : %d, moyenne %.2f\\n", age, m);', note: 'Les f-strings de Python ressemblent beaucoup aux formats de printf.' },
      guide: ex({
        id: 'w2l3-guide',
        mode: 'predict',
        title: 'Prédire l\'arrondi',
        prompt: 'Que va afficher ce programme ? Choisis la bonne réponse.',
        code: t`
          #include <stdio.h>

          int main(void)
          {
              double prix = 2.456;
              int qte = 4;
              printf("%d x %.2f = %.1f\n", qte, prix, qte * prix);
              return 0;
          }
        `,
        choices: ['4 x 2.456 = 9.824', '4 x 2.46 = 9.8', '4 x 2.45 = 9.8', '4 x 2.46 = 9.82'],
        hints: ['%.2f arrondit 2.456 à 2 décimales.', '4 * 2.456 = 9.824 ; %.1f garde une décimale.'],
      }),
      mission: ex({
        id: 'w2l3-mission',
        mode: 'write',
        title: 'Le ticket de caisse',
        prompt: 'Avec les variables `quantite = 3` (int), `prix = 4.5` (double) et `code = \'K\'` (char), affiche exactement :\n```\nArticle K\nQuantite : 3\nPrix unitaire : 4.50\nTotal : 13.50\n```\nLe total doit être **calculé** (quantite * prix), pas écrit à la main.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int quantite = 3;
              double prix = 4.5;
              char code = 'K';
              printf("Article %c\n", code);
              printf("Quantite : %d\n", quantite);
              printf("Prix unitaire : %.2f\n", prix);
              printf("Total : %.2f\n", quantite * prix);
              return 0;
          }
        `,
        require: [{ pattern: 'quantite\\s*\\*\\s*prix|prix\\s*\\*\\s*quantite', message: 'Calcule le total avec quantite * prix.' }],
        forbid: [{ pattern: '13\\.5', message: 'Ne recopie pas le total : calcule-le.' }],
        hints: ['%c pour le code, %d pour la quantité, %.2f pour les prix.', 'Le calcul peut être écrit directement dans printf : quantite * prix.'],
      }),
      quiz: [
        { q: 'Quel format pour afficher un double avec 3 décimales ?', choices: ['%d', '%.3f', '%3d', '%f3'], answer: 1, explain: '%.3f' },
        { q: '`printf("%c", 65);` affiche…', choices: ['65', 'A', 'a', 'Erreur'], answer: 1, explain: '65 est le code ASCII de A.' },
        { q: 'Que se passe-t-il avec `printf("%d", 2.5);` ?', choices: ['Affiche 2', 'Affiche 3', 'Affichage incorrect + warning', 'Affiche 2.5'], answer: 2, explain: 'Mauvais format : comportement indéfini, le compilateur avertit.' },
        { q: 'Quel format pour un texte ?', choices: ['%c', '%t', '%s', '%x'], answer: 2, explain: '%s pour string.' },
      ],
      resume: [
        '`%d` int, `%f` double, `%c` char, `%s` texte, `%zu` sizeof.',
        '`%.2f` : 2 décimales (arrondi à l\'affichage seulement).',
        'Valeurs dans le même ordre que les %.',
        'Un mauvais format donne un affichage faux : lis les warnings.',
      ],
    },
    {
      id: 'w2l4',
      title: 'Les constantes : #define et const',
      topic: 'syntax',
      skills: ['syntax'],
      objectif: 'Nommer les valeurs fixes avec #define ou const pour un code lisible et facile à modifier.',
      explication: t`
        Un **nombre magique** est une valeur écrite en dur sans explication (\`* 0.2\`). Si elle change, il faut la retrouver partout.
        On lui donne plutôt un **nom constant**.

        - \`#define TVA 0.2\` : **directive** du préprocesseur. Avant la compilation, chaque \`TVA\` est remplacé par \`0.2\`. Pas de \`=\`, pas de \`;\`. Par convention, en MAJUSCULES.
        - \`const double TVA = 0.2;\` : une **vraie variable** typée, mais **en lecture seule**. La modifier est une erreur de compilation.

        \`#define\` est très utilisé pour les tailles de tableaux (\`#define N 10\`) ; \`const\` apporte la vérification de type.
      `,
      syntaxe: {
        code: t`
          #define NOM valeur
          const type NOM = valeur;
        `,
        note: 'Jamais de ; à la fin d\'un #define.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          #define MAX_VIES 3
          #define BONUS 50

          int main(void)
          {
              const double TAUX = 0.15;
              int score = 400;
              double gain = score * TAUX;
              printf("Vies max : %d\n", MAX_VIES);
              printf("Score avec bonus : %d\n", score + BONUS);
              printf("Gain : %.2f\n", gain);
              return 0;
          }
        `,
        lines: {
          3: 'Constante du préprocesseur : MAX_VIES sera remplacé par 3.',
          8: 'Constante typée : TAUX ne pourra plus changer.',
          10: 'Le calcul utilise un nom parlant au lieu de 0.15.',
          12: 'score + BONUS devient score + 50 avant même la compilation.',
        },
      },
      visualisation: { kind: 'trace', note: 'TAUX est une vraie variable (lecture seule) ; MAX_VIES n\'existe pas en mémoire : il a été remplacé par 3 dans le texte.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              const int ANNEE = 2026;
              ANNEE = 2027;
              printf("%d\n", ANNEE);
              return 0;
          }
        `,
        explication: 'Une variable `const` est en lecture seule : la modifier provoque une erreur de compilation. C\'est voulu : la constante te protège.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              const int ANNEE = 2026;
              int annee_suivante = ANNEE + 1;
              printf("%d\n", annee_suivante);
              return 0;
          }
        `,
      },
      python: { py: 'TVA = 0.2  # convention seulement', c: '#define TVA 0.2\nconst double TVA2 = 0.2;', note: 'Python n\'a pas de vraie constante. En C, const est vérifiée par le compilateur.' },
      guide: ex({
        id: 'w2l4-guide',
        mode: 'bug',
        title: 'Le #define maudit',
        prompt: 'Ce programme ne compile pas à cause de la constante. Corrige-la pour qu\'il affiche `Prix TTC : 120.00`.',
        starter: t`
          #include <stdio.h>

          #define TVA = 0.2;

          int main(void)
          {
              double prix_ht = 100.0;
              printf("Prix TTC : %.2f\n", prix_ht * (1 + TVA));
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          #define TVA 0.2

          int main(void)
          {
              double prix_ht = 100.0;
              printf("Prix TTC : %.2f\n", prix_ht * (1 + TVA));
              return 0;
          }
        `,
        hints: ['#define remplace le nom par TOUT le texte qui suit, y compris = et ;.', 'Écris seulement : #define TVA 0.2'],
      }),
      mission: ex({
        id: 'w2l4-mission',
        mode: 'write',
        title: 'Le cercle magique',
        prompt: 'Définis une constante `PI` valant 3.14159 (avec `#define` ou `const`) et une variable `rayon = 2.0`. Affiche exactement :\n```\nPerimetre : 12.57\nAire : 12.57\n```\n(périmètre = 2 × PI × rayon, aire = PI × rayon × rayon)',
        solution: t`
          #include <stdio.h>

          #define PI 3.14159

          int main(void)
          {
              double rayon = 2.0;
              printf("Perimetre : %.2f\n", 2 * PI * rayon);
              printf("Aire : %.2f\n", PI * rayon * rayon);
              return 0;
          }
        `,
        require: [{ pattern: '#define\\s+PI\\b|const\\s+double\\s+PI\\b', message: 'Définis la constante PI avec #define ou const double.', raw: true }],
        forbid: [{ pattern: '12\\.57', message: 'Calcule les résultats au lieu de les écrire.' }],
        hints: ['#define PI 3.14159 (sans = ni ;).', 'Les deux résultats s\'affichent avec %.2f.'],
      }),
      quiz: [
        { q: 'Quelle écriture est correcte ?', choices: ['#define N = 10;', '#define N 10', '#define N 10;', 'define N 10'], answer: 1, explain: 'Pas de = ni de ;.' },
        { q: 'Que se passe-t-il si on modifie une variable const ?', choices: ['Rien', 'Erreur de compilation', 'Avertissement seulement', 'Elle est remise à zéro'], answer: 1, explain: 'assignment of read-only variable.' },
        { q: 'Pourquoi utiliser des constantes ?', choices: ['Le programme est plus rapide', 'Le code est plus lisible et facile à modifier', 'C\'est obligatoire', 'Pour afficher des nombres'], answer: 1, explain: 'On change la valeur à un seul endroit.' },
      ],
      resume: [
        '`#define NOM valeur` : remplacement de texte, sans `=` ni `;`.',
        '`const type NOM = valeur;` : variable en lecture seule.',
        'Constantes en MAJUSCULES par convention.',
        'Évite les nombres magiques.',
      ],
    },
    {
      id: 'w2l5',
      title: 'Conversions de types et cast',
      topic: 'logic',
      skills: ['logic', 'syntax'],
      objectif: 'Comprendre les conversions automatiques et forcer une conversion avec un cast pour garder les décimales.',
      explication: t`
        Quand des types différents se rencontrent, le C **convertit** :

        - \`int\` → \`double\` : sans perte (\`3\` devient \`3.0\`).
        - \`double\` → \`int\` : **perte des décimales**, tronqué (pas arrondi) : \`3.99\` → \`3\`.
        - \`int\` op \`double\` : l'int devient double. \`5 / 2.0\` → \`2.5\`.
        - \`int\` op \`int\` : reste int ! \`5 / 2\` → \`2\`.

        Le **cast** force une conversion : \`(double) somme\`. Il s'applique à **ce qui est juste après** :
        \`(double) somme / nb\` convertit somme, puis divise en double ✅. Mais \`(double)(somme / nb)\` convertit
        le résultat d'une division entière… déjà tronqué ❌.
      `,
      syntaxe: {
        code: t`
          (type) valeur
          (double) a / b    // division réelle
          (int) x           // supprime les décimales
        `,
        note: 'Place le cast AVANT la division.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int somme = 29;
              int nb = 2;
              double faux = somme / nb;
              double juste = (double) somme / nb;
              int tronque = (int) 7.89;
              printf("Faux  : %.2f\n", faux);
              printf("Juste : %.2f\n", juste);
              printf("Tronque : %d\n", tronque);
              return 0;
          }
        `,
        lines: {
          7: 'int / int → 14 (division entière), PUIS rangé dans un double : 14.0. Trop tard !',
          8: '(double) somme → 29.0, puis 29.0 / 2 → 14.5.',
          9: 'Le cast vers int coupe les décimales : 7.',
        },
      },
      visualisation: { kind: 'trace', note: 'Compare « faux » et « juste » dans la mémoire : la différence vient du moment de la conversion.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int total = 47;
              int nb = 4;
              double moyenne = (double)(total / nb);
              printf("Moyenne : %.2f\n", moyenne);
              return 0;
          }
        `,
        logic: true,
        explication: 'Le cast est appliqué APRÈS la division entière : 47 / 4 donne 11, converti en 11.00. Il faut convertir un opérande avant de diviser.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int total = 47;
              int nb = 4;
              double moyenne = (double) total / nb;
              printf("Moyenne : %.2f\n", moyenne);
              return 0;
          }
        `,
      },
      python: { py: '7 / 2   # 3.5\nint(3.9)  # 3', c: '7 / 2      // 3 !\n(int) 3.9  // 3', note: 'Piège n°1 des étudiants venant de Python : / entre deux int est une division entière en C.' },
      guide: ex({
        id: 'w2l5-guide',
        mode: 'complete',
        title: 'Sauver les décimales',
        prompt: 'Complète avec un cast pour que la moyenne de 13, 15 et 16 s\'affiche `14.67`.',
        template: t`
          #include <stdio.h>

          int main(void)
          {
              int somme = 13 + 15 + 16;
              double moyenne = ⟦⟧ somme / 3;
              printf("%.2f\n", moyenne);
              return 0;
          }
        `,
        blanks: [{ answer: '(double)', width: 9 }],
        hints: ['Il faut convertir somme en réel avant la division.', 'La syntaxe d\'un cast : (type) valeur.'],
      }),
      mission: ex({
        id: 'w2l5-mission',
        mode: 'write',
        title: 'Moyenne pondérée',
        prompt: 'Notes entières : maths 14, physique 11, info 17. Coefficients entiers : 3, 2, 4. Stocke-les dans des variables `int`, puis affiche exactement :\n```\nMoyenne : 14.67\nArrondi vers le bas : 14\n```\nmoyenne = (14×3 + 11×2 + 17×4) / (3+2+4). La deuxième ligne utilise un cast `(int)`.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int maths = 14, physique = 11, info = 17;
              int c1 = 3, c2 = 2, c3 = 4;
              int points = maths * c1 + physique * c2 + info * c3;
              int coefs = c1 + c2 + c3;
              double moyenne = (double) points / coefs;
              printf("Moyenne : %.2f\n", moyenne);
              printf("Arrondi vers le bas : %d\n", (int) moyenne);
              return 0;
          }
        `,
        require: [{ pattern: '\\(\\s*double\\s*\\)', message: 'Utilise un cast (double) pour la division.' }, { pattern: '\\(\\s*int\\s*\\)', message: 'Utilise un cast (int) pour la 2e ligne.' }],
        hints: ['Calcule d\'abord la somme des points (int) et la somme des coefficients (int).', 'Divise avec (double) points / coefs.', '(int) moyenne coupe les décimales.'],
      }),
      quiz: [
        { q: 'Que vaut `(double)(7 / 2)` ?', choices: ['3.5', '3.0', '4.0', 'Erreur'], answer: 1, explain: '7 / 2 vaut 3 (division entière) avant la conversion.' },
        { q: 'Que vaut `(double) 7 / 2` ?', choices: ['3.5', '3.0', '3', '4'], answer: 0, explain: '7.0 / 2 = 3.5.' },
        { q: '`(int) 2.99` vaut…', choices: ['3', '2', '2.99', '-2'], answer: 1, explain: 'Troncature : les décimales sont coupées.' },
        { q: 'Que vaut `5 / 2.0` ?', choices: ['2', '2.5', '3', 'Erreur'], answer: 1, explain: 'Un opérande réel suffit pour une division réelle.' },
      ],
      resume: [
        'int / int → int (décimales perdues).',
        'Un seul réel dans l\'opération → résultat réel.',
        '`(double) a / b` ✅ — `(double)(a / b)` ❌.',
        'Conversion vers int : troncature, pas arrondi.',
      ],
    },
  ],
  challenges: [
    ex({
      id: 'w2-c1', mode: 'write', kind: 'challenge', title: 'Conversion météo',
      prompt: 'La température est 31.5 °C. Affiche-la en Fahrenheit (F = C × 9 / 5 + 32) avec une décimale :\n```\n31.5 C = 88.7 F\n```',
      solution: t`
        #include <stdio.h>

        int main(void)
        {
            double celsius = 31.5;
            double fahrenheit = celsius * 9.0 / 5 + 32;
            printf("%.1f C = %.1f F\n", celsius, fahrenheit);
            return 0;
        }
      `,
      forbid: [{ pattern: '88\\.7', message: 'Calcule le résultat.' }],
      hints: ['Attention : 9 / 5 entre deux int vaut 1 !', 'Écris 9.0 / 5.'],
    }),
    ex({
      id: 'w2-c2', mode: 'write', kind: 'challenge', title: 'Échange de deux variables',
      prompt: 'Avec `int a = 8;` et `int b = 3;`, échange leurs valeurs **à l\'aide d\'une troisième variable**, puis affiche :\n```\nAvant : a=8 b=3\nApres : a=3 b=8\n```',
      solution: t`
        #include <stdio.h>

        int main(void)
        {
            int a = 8;
            int b = 3;
            printf("Avant : a=%d b=%d\n", a, b);
            int tmp = a;
            a = b;
            b = tmp;
            printf("Apres : a=%d b=%d\n", a, b);
            return 0;
        }
      `,
      require: [{ pattern: 'a\\s*=\\s*b\\s*;', message: 'Fais l\'échange avec des affectations (a = b; ...).' }],
      hints: ['Si tu écris a = b; directement, l\'ancienne valeur de a est perdue.', 'Sauvegarde a dans tmp d\'abord.'],
    }),
  ],
  boss: {
    id: 'boss-w2',
    name: 'L\'Hydre des Types',
    avatar: 'hydra',
    taunt: 'Trois têtes, trois types ! int, double, char… Mélange-les et je deviens invincible !',
    defeat: 'Mes têtes… chacune à sa place… Tu maîtrises les types, apprenti.',
    timeLimit: 720,
    phases: [
      ex({
        id: 'boss-w2-p1', mode: 'predict', title: 'Tête 1 : la division piégée',
        prompt: 'Que va afficher ce programme ?',
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int a = 9, b = 2;
              double r1 = a / b;
              double r2 = (double) a / b;
              printf("%.1f %.1f %d\n", r1, r2, a % b);
              return 0;
          }
        `,
        choices: ['4.5 4.5 1', '4.0 4.5 1', '4.0 4.0 0', '4.5 4.0 1'],
        hints: ['r1 : division entière d\'abord.'],
      }),
      ex({
        id: 'boss-w2-p2', mode: 'bug', title: 'Tête 2 : formats empoisonnés',
        prompt: 'Corrige ce programme pour qu\'il affiche :\n```\nHeros : Z\nPoints de vie : 87\nForce : 12.75\n```',
        starter: t`
          #include <stdio.h>

          int main(void)
          {
              char initiale = "Z";
              int vie = 87;
              double force = 12.75;
              printf("Heros : %c\n", initiale);
              printf("Points de vie : %f\n", vie);
              printf("Force : %d\n", force);
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              char initiale = 'Z';
              int vie = 87;
              double force = 12.75;
              printf("Heros : %c\n", initiale);
              printf("Points de vie : %d\n", vie);
              printf("Force : %.2f\n", force);
              return 0;
          }
        `,
        hints: ['Un char s\'écrit entre apostrophes.', 'Chaque % doit correspondre au type de sa valeur.'],
      }),
      ex({
        id: 'boss-w2-p3', mode: 'write', title: 'Tête 3 : le convertisseur',
        prompt: 'Coup final : une durée de `5000` secondes est stockée dans un `int`. Affiche-la en heures, minutes, secondes **et** en heures décimales :\n```\n1 h 23 min 20 s\nSoit 1.39 heures\n```',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int total = 5000;
              int h = total / 3600;
              int m = (total % 3600) / 60;
              int s = total % 60;
              printf("%d h %d min %d s\n", h, m, s);
              printf("Soit %.2f heures\n", (double) total / 3600);
              return 0;
          }
        `,
        forbid: [{ pattern: '1\\.39', message: 'Calcule les heures décimales.' }],
        hints: ['Heures : division entière par 3600. Le reste se calcule avec %.', 'Heures décimales : (double) total / 3600.'],
      }),
    ],
  },
};
