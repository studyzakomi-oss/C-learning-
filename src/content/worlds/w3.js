import { t, ex } from '../helpers.js';

export default {
  id: 'w3',
  num: 3,
  title: 'Entrées et Calculs',
  subtitle: 'Lire au clavier avec scanf, calculer juste et valider les saisies',
  color: '#60a5fa',
  icon: '🧮',
  intro: t`
    La Forge des Nombres ne fonctionne qu'avec les valeurs données par les voyageurs. Apprends à les lire
    avec scanf, à calculer sans perdre de décimales… et à te méfier des saisies farfelues.
    Le Diviseur Fou t'attend au fond de la forge.
  `,
  lessons: [
    {
      id: 'w3l1',
      title: 'Lire une valeur avec scanf()',
      topic: 'syntax',
      skills: ['syntax', 'memory'],
      objectif: 'Lire des nombres, des caractères et des mots au clavier avec scanf et le bon format.',
      explication: t`
        \`scanf()\` lit ce que l'utilisateur tape et le **range dans une variable**. Comme scanf doit
        **écrire** dans ta variable, on lui donne son **adresse** avec \`&\` : \`scanf("%d", &age);\`.

        Formats de scanf :
        - \`%d\` → \`int\`
        - \`%lf\` → \`double\` (attention : **%lf** en lecture, alors que printf utilise %f)
        - \`%f\` → \`float\`
        - \`" %c"\` → \`char\` (l'espace avant %c saute les espaces et retours à la ligne restés en attente)
        - \`%s\` → un mot dans un tableau de char, **sans &** (le nom du tableau est déjà une adresse)

        Plusieurs valeurs peuvent être lues d'un coup : \`scanf("%d %d", &a, &b);\`.

        Dans C Quest, ce que « tape » l'utilisateur se prépare dans la zone **Entrée (stdin)** de la console,
        et les tests fournissent automatiquement leurs propres entrées.
      `,
      syntaxe: {
        code: t`
          scanf("%d", &entier);
          scanf("%lf", &reel);
          scanf(" %c", &caractere);
          scanf("%49s", mot);     // tableau : pas de &
        `,
        note: '& = « adresse de ». Sans &, scanf ne sait pas où écrire.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int age;
              double taille;
              char initiale;
              printf("Age ? ");
              scanf("%d", &age);
              printf("Taille ? ");
              scanf("%lf", &taille);
              printf("Initiale ? ");
              scanf(" %c", &initiale);
              printf("\n%c, %d ans, %.2f m\n", initiale, age, taille);
              return 0;
          }
        `,
        stdin: '17\n1.78\nZ\n',
        lines: {
          9: 'scanf lit un entier et le range à l\'adresse de age.',
          11: '%lf pour un double.',
          13: 'L\'espace avant %c ignore le retour à la ligne laissé par la saisie précédente.',
          14: 'Les valeurs lues s\'utilisent comme d\'habitude.',
        },
      },
      visualisation: { kind: 'trace', note: 'Avant scanf, la boîte contient « ? ». Après, elle contient la valeur tapée (entrée : 17, 1.78, Z).' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int nombre = 0;
              scanf("%d", nombre);
              printf("Double : %d\n", nombre * 2);
              return 0;
          }
        `,
        stdin: '21\n',
        explication: 'Il manque le `&` : scanf reçoit la VALEUR de nombre (0) au lieu de son adresse, et essaie d\'écrire à l\'adresse 0 → plantage. Le compilateur avertit : « expects argument of type int * ».',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int nombre = 0;
              scanf("%d", &nombre);
              printf("Double : %d\n", nombre * 2);
              return 0;
          }
        `,
      },
      python: { py: 'age = int(input())', c: 'int age;\nscanf("%d", &age);', note: 'input() renvoie toujours un texte à convertir. scanf convertit directement selon le format.' },
      guide: ex({
        id: 'w3l1-guide',
        mode: 'complete',
        title: 'Le & oublié',
        prompt: 'Complète pour lire deux entiers et afficher leur somme (sans message d\'invite). Exemple : entrée `4 9` → `13`.',
        template: t`
          #include <stdio.h>

          int main(void)
          {
              int a, b;
              scanf("⟦⟧ %d", ⟦⟧a, &b);
              printf("%d\n", a + b);
              return 0;
          }
        `,
        blanks: [{ answer: '%d', width: 3 }, { answer: '&', width: 2 }],
        tests: [{ stdin: '4 9\n' }, { stdin: '-3 10\n', hidden: true }, { stdin: '100\n250\n', hidden: true }],
        hints: ['Le format d\'un int est %d.', 'scanf a besoin de l\'adresse de a.'],
      }),
      mission: ex({
        id: 'w3l1-mission',
        mode: 'write',
        title: 'Carte d\'identité',
        prompt: 'Lis un prénom (un mot), un âge (int) et une taille en mètres (double). Affiche exactement (sans message d\'invite) :\n```\nNom : <prenom>\nAge : <age> ans\nTaille : <taille avec 2 decimales> m\n```\nExemple : entrée `Mariem 19 1.654` → `Nom : Mariem`, `Age : 19 ans`, `Taille : 1.65 m`.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              char prenom[50];
              int age;
              double taille;
              scanf("%49s", prenom);
              scanf("%d", &age);
              scanf("%lf", &taille);
              printf("Nom : %s\n", prenom);
              printf("Age : %d ans\n", age);
              printf("Taille : %.2f m\n", taille);
              return 0;
          }
        `,
        starter: t`
          #include <stdio.h>

          int main(void)
          {
              char prenom[50];

              return 0;
          }
        `,
        tests: [{ stdin: 'Mariem 19 1.654\n' }, { stdin: 'Sidi\n23\n1.8\n', hidden: true }, { stdin: 'Zakomi 17 1.755\n', hidden: true }],
        hints: ['Trois scanf (ou un seul avec trois formats) : %s, %d, %lf.', 'Pas de & devant prenom : c\'est un tableau.', '%.2f pour afficher 2 décimales.'],
      }),
      quiz: [
        { q: 'Quel appel lit correctement un int n ?', choices: ['scanf("%d", n);', 'scanf("%d", &n);', 'scanf(%d, &n);', 'scanf("&d", n);'], answer: 1, explain: 'Format entre guillemets, adresse avec &.' },
        { q: 'Quel format pour lire un double avec scanf ?', choices: ['%f', '%d', '%lf', '%df'], answer: 2, explain: 'scanf : %lf pour un double.' },
        { q: 'Pourquoi pas de & devant un tableau de char dans scanf("%s", nom) ?', choices: ['C\'est une erreur', 'Le nom d\'un tableau est déjà une adresse', 'scanf n\'en a pas besoin pour les textes courts', 'Pour aller plus vite'], answer: 1, explain: 'Un tableau « se transforme » en adresse de son premier élément.' },
        { q: 'À quoi sert l\'espace dans `scanf(" %c", &c)` ?', choices: ['À rien', 'À lire un espace', 'À sauter les blancs (espaces, \\n) avant le caractère', 'À afficher un espace'], answer: 2, explain: 'Sinon %c lirait le \\n de la saisie précédente.' },
      ],
      resume: [
        '`scanf("%d", &x);` : format + adresse.',
        'int `%d`, double `%lf`, char `" %c"`, mot `%s` (sans &).',
        'Sans &, scanf écrit n\'importe où : plantage.',
        'Plusieurs valeurs : `scanf("%d %d", &a, &b);`.',
      ],
    },
    {
      id: 'w3l2',
      title: 'Les opérateurs arithmétiques',
      topic: 'logic',
      skills: ['logic'],
      objectif: 'Calculer avec + - * / % et les opérateurs raccourcis (+=, ++).',
      explication: t`
        Les opérateurs de base : \`+\` addition, \`-\` soustraction, \`*\` multiplication, \`/\` division,
        \`%\` **modulo** (reste de la division entière, seulement pour les entiers).

        Le modulo est très utile : \`n % 2 == 0\` → n est pair ; \`n % 10\` → dernier chiffre ;
        \`minutes % 60\` → minutes restantes.

        Raccourcis : \`x += 5;\` ⇔ \`x = x + 5;\` (aussi \`-=\`, \`*=\`, \`/=\`, \`%=\`).
        \`x++;\` ajoute 1, \`x--;\` retire 1.
      `,
      syntaxe: {
        code: t`
          a + b    a - b    a * b    a / b    a % b
          x += 3;  x -= 2;  x *= 4;  x++;  x--;
        `,
        note: '% ne s\'utilise qu\'avec des entiers.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int a = 17, b = 5;
              printf("%d + %d = %d\n", a, b, a + b);
              printf("%d - %d = %d\n", a, b, a - b);
              printf("%d * %d = %d\n", a, b, a * b);
              printf("%d / %d = %d\n", a, b, a / b);
              printf("%d %% %d = %d\n", a, b, a % b);
              int pieces = 10;
              pieces += 5;
              pieces--;
              printf("pieces = %d\n", pieces);
              return 0;
          }
        `,
        lines: {
          9: 'Division entière : 17 / 5 = 3 (le reste est ignoré).',
          10: 'Modulo : le reste de 17 / 5 est 2. `%%` affiche le symbole %.',
          12: 'pieces = pieces + 5 → 15.',
          13: 'pieces = pieces - 1 → 14.',
        },
      },
      visualisation: { kind: 'trace', note: 'Observe : 17 / 5 donne 3 et 17 % 5 donne 2. Ensemble : 17 = 3 × 5 + 2.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              double prix = 17.5;
              double reste = prix % 5;
              printf("%.1f\n", reste);
              return 0;
          }
        `,
        explication: 'L\'opérateur % n\'existe que pour les entiers. Pour des réels, il faut la fonction fmod() de <math.h>, ou travailler en entiers (par exemple en centimes).',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int centimes = 1750;
              int reste = centimes % 500;
              printf("%d\n", reste);
              return 0;
          }
        `,
      },
      python: { py: '17 // 5   # 3\n17 % 5    # 2', c: '17 / 5   // 3 (int)\n17 % 5   // 2', note: 'Le // de Python correspond au / entre entiers du C.' },
      guide: ex({
        id: 'w3l2-guide',
        mode: 'predict',
        title: 'Calcul mental',
        prompt: 'Que va afficher ce programme ?',
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int x = 20;
              x += 3;
              x *= 2;
              x--;
              printf("%d %d %d\n", x, x / 10, x % 10);
              return 0;
          }
        `,
        choices: ['45 4 5', '46 4 6', '45 4.5 5', '44 4 4'],
        hints: ['Suis x ligne par ligne : 20, puis 23, puis…', '(23 × 2) − 1.'],
      }),
      mission: ex({
        id: 'w3l2-mission',
        mode: 'write',
        title: 'Distributeur de billets',
        prompt: 'Lis un montant entier (en ouguiyas). Affiche le nombre de billets de 1000, de 200 et le reste, exactement ainsi :\n```\nBillets de 1000 : 3\nBillets de 200 : 2\nReste : 50\n```\n(exemple pour l\'entrée `3450`). Utilise `/` et `%`.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int montant;
              scanf("%d", &montant);
              int b1000 = montant / 1000;
              montant = montant % 1000;
              int b200 = montant / 200;
              int reste = montant % 200;
              printf("Billets de 1000 : %d\n", b1000);
              printf("Billets de 200 : %d\n", b200);
              printf("Reste : %d\n", reste);
              return 0;
          }
        `,
        tests: [{ stdin: '3450\n' }, { stdin: '999\n', hidden: true }, { stdin: '2000\n', hidden: true }, { stdin: '0\n', hidden: true }],
        require: [{ pattern: '%', message: 'Utilise l\'opérateur modulo %.' }],
        hints: ['montant / 1000 donne le nombre de billets de 1000.', 'montant % 1000 donne ce qu\'il reste à rendre.', 'Recommence avec 200 sur ce reste.'],
      }),
      quiz: [
        { q: 'Que vaut `23 % 4` ?', choices: ['5', '3', '5.75', '0'], answer: 1, explain: '23 = 5 × 4 + 3.' },
        { q: 'Comment tester qu\'un entier n est pair ?', choices: ['n / 2 == 0', 'n % 2 == 0', 'n % 2 == 1', 'n == 2'], answer: 1, explain: 'Reste 0 dans la division par 2.' },
        { q: 'Après `int x = 7; x %= 3;`, x vaut…', choices: ['1', '2', '21', '0'], answer: 0, explain: '7 % 3 = 1.' },
        { q: 'Que vaut `n % 10` pour n = 2026 ?', choices: ['202', '2', '6', '20'], answer: 2, explain: 'Le dernier chiffre.' },
      ],
      resume: [
        '`+ - * /` et `%` (reste, entiers seulement).',
        'Pair : `n % 2 == 0` ; dernier chiffre : `n % 10`.',
        '`x += 5;` ⇔ `x = x + 5;` ; `x++` ajoute 1.',
      ],
    },
    {
      id: 'w3l3',
      title: 'Division entière, division réelle et priorités',
      topic: 'logic',
      skills: ['logic', 'debug'],
      objectif: 'Prévoir le résultat d\'une expression : type de la division et ordre des opérations.',
      explication: t`
        **Priorité des opérateurs** (comme en maths) : d'abord \`* / %\`, ensuite \`+ -\`, de gauche à droite.
        \`2 + 3 * 4\` vaut 14. Les **parenthèses** imposent l'ordre : \`(2 + 3) * 4\` vaut 20.

        **Le piège de la division** : le type du résultat dépend des opérandes, pas de la variable qui le reçoit.
        - \`7 / 2\` → 3 (deux int)
        - \`7.0 / 2\` → 3.5
        - \`double m = (a + b) / 2;\` avec a, b int → division entière ! Il faut \`(a + b) / 2.0\`.

        Dans une moyenne \`(a + b + c) / 3\`, n'oublie pas les parenthèses : sinon seule \`c\` est divisée par 3.
      `,
      syntaxe: {
        code: t`
          resultat = (a + b) * c;     // parenthèses d'abord
          moyenne  = (a + b) / 2.0;   // division réelle
        `,
        note: 'En cas de doute, ajoute des parenthèses : elles ne coûtent rien.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int a = 12, b = 15, c = 14;
              printf("%d\n", 2 + 3 * 4);
              printf("%d\n", (2 + 3) * 4);
              printf("%d\n", a + b + c / 3);
              printf("%d\n", (a + b + c) / 3);
              printf("%.2f\n", (a + b + c) / 3.0);
              return 0;
          }
        `,
        lines: {
          6: '* avant + : 2 + 12 = 14.',
          7: 'Parenthèses d\'abord : 5 × 4 = 20.',
          8: 'Erreur fréquente : seul c est divisé par 3 → 12 + 15 + 4 = 31.',
          9: 'Bonne moyenne… mais entière : 41 / 3 = 13.',
          10: 'Moyenne exacte : 13.67.',
        },
      },
      visualisation: { kind: 'trace', note: 'Même nombres, résultats différents : tout dépend des parenthèses et des types.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int note1 = 12, note2 = 15;
              double moyenne = (note1 + note2) / 2;
              printf("%.2f\n", moyenne);
              return 0;
          }
        `,
        explication: 'Les deux opérandes de / sont des int : 27 / 2 = 13, puis 13 est rangé dans moyenne (13.00). Le professeur te prévient avec un conseil « division entière ».',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int note1 = 12, note2 = 15;
              double moyenne = (note1 + note2) / 2.0;
              printf("%.2f\n", moyenne);
              return 0;
          }
        `,
      },
      python: { py: '(12 + 15) / 2   # 13.5', c: '(12 + 15) / 2     // 13\n(12 + 15) / 2.0   // 13.5', note: 'Même formule, résultat différent selon le langage !' },
      guide: ex({
        id: 'w3l3-guide',
        mode: 'bug',
        title: 'La moyenne cassée',
        prompt: 'Ce programme lit trois notes entières et devrait afficher leur moyenne exacte avec 2 décimales (entrée `10 13 14` → `12.33`). Il compile mais le résultat est faux : corrige la logique.',
        starter: t`
          #include <stdio.h>

          int main(void)
          {
              int n1, n2, n3;
              scanf("%d %d %d", &n1, &n2, &n3);
              double moyenne = n1 + n2 + n3 / 3;
              printf("%.2f\n", moyenne);
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int n1, n2, n3;
              scanf("%d %d %d", &n1, &n2, &n3);
              double moyenne = (n1 + n2 + n3) / 3.0;
              printf("%.2f\n", moyenne);
              return 0;
          }
        `,
        tests: [{ stdin: '10 13 14\n' }, { stdin: '20 20 19\n', hidden: true }, { stdin: '0 0 1\n', hidden: true }],
        hints: ['Quelle partie est divisée par 3 dans l\'expression actuelle ?', 'Ajoute des parenthèses autour de la somme.', 'Puis évite la division entière : 3.0.'],
      }),
      mission: ex({
        id: 'w3l3-mission',
        mode: 'write',
        title: 'Température moyenne',
        prompt: 'Lis deux températures **entières** (matin, soir). Affiche (sans invite) :\n```\nEcart : <soir - matin>\nMoyenne : <moyenne avec 1 decimale>\n```\nExemple : entrée `18 25` → `Ecart : 7` et `Moyenne : 21.5`.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int matin, soir;
              scanf("%d %d", &matin, &soir);
              printf("Ecart : %d\n", soir - matin);
              printf("Moyenne : %.1f\n", (matin + soir) / 2.0);
              return 0;
          }
        `,
        tests: [{ stdin: '18 25\n' }, { stdin: '-3 4\n', hidden: true }, { stdin: '30 30\n', hidden: true }],
        hints: ['Lis les deux valeurs avec un seul scanf("%d %d", ...).', 'La moyenne doit être réelle : divise par 2.0.'],
      }),
      quiz: [
        { q: 'Que vaut `10 - 4 / 2` ?', choices: ['3', '8', '6', '2'], answer: 1, explain: '4 / 2 d\'abord : 10 - 2.' },
        { q: 'Que vaut `(10 - 4) / 4` en C (int) ?', choices: ['1.5', '1', '2', '0'], answer: 1, explain: '6 / 4 = 1 en division entière.' },
        { q: 'Quelle expression donne la moyenne exacte de deux int a et b ?', choices: ['a + b / 2', '(a + b) / 2', '(a + b) / 2.0', 'a / 2 + b / 2'], answer: 2, explain: 'Parenthèses + un réel.' },
        { q: '`double d = 1 / 4;` contient…', choices: ['0.25', '0.0', '1.0', '4.0'], answer: 1, explain: '1 / 4 vaut 0 entre deux int.' },
      ],
      resume: [
        '`* / %` avant `+ -` ; les parenthèses passent en premier.',
        'Le type d\'une division dépend de ses opérandes.',
        'Moyenne exacte : `(a + b + c) / 3.0`.',
      ],
    },
    {
      id: 'w3l4',
      title: 'Calculs pratiques : somme, moyenne, aire',
      topic: 'algo',
      skills: ['algo', 'logic'],
      objectif: 'Transformer un problème concret en formule C : lire les données, calculer, présenter le résultat.',
      explication: t`
        Un programme de calcul suit presque toujours **3 étapes** :

        1. **Entrée** : lire les données (\`scanf\`).
        2. **Traitement** : appliquer la formule dans des variables bien nommées.
        3. **Sortie** : afficher le résultat proprement (\`printf\` avec le bon format).

        Avant de coder, écris la formule en français : « aire du rectangle = longueur × largeur ».
        Choisis le type : des mesures avec virgule → \`double\` ; des quantités → \`int\`.

        Formules utiles : aire du rectangle \`L * l\`, périmètre \`2 * (L + l)\`, aire du disque \`PI * r * r\`,
        prix TTC \`ht * (1 + taux)\`, pourcentage \`part * 100.0 / total\`.
      `,
      syntaxe: {
        code: t`
          // 1. entrée
          scanf("%lf %lf", &longueur, &largeur);
          // 2. traitement
          double aire = longueur * largeur;
          // 3. sortie
          printf("Aire : %.2f\n", aire);
        `,
        note: 'Entrée → traitement → sortie.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              double longueur, largeur;
              scanf("%lf %lf", &longueur, &largeur);
              double aire = longueur * largeur;
              double perimetre = 2 * (longueur + largeur);
              printf("Aire : %.2f m2\n", aire);
              printf("Perimetre : %.2f m\n", perimetre);
              return 0;
          }
        `,
        stdin: '4.5 3\n',
        lines: {
          6: 'Entrée : deux réels (ici 4.5 et 3).',
          7: 'Traitement : une variable par résultat, au nom clair.',
          8: 'Parenthèses : on additionne avant de doubler.',
          9: 'Sortie formatée avec unités.',
        },
      },
      visualisation: { kind: 'trace', note: 'Entrée 4.5 et 3 : regarde aire puis perimetre se remplir.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int bonnes = 0, total = 0;
              scanf("%d %d", &bonnes, &total);
              printf("Reussite : %d %%\n", bonnes / total * 100);
              return 0;
          }
        `,
        stdin: '7 8\n',
        logic: true,
        explication: 'bonnes / total entre deux int donne 0 (7 / 8 = 0), puis 0 × 100 = 0 %. Il faut multiplier d\'abord ou passer en réel : bonnes * 100.0 / total.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int bonnes = 0, total = 0;
              scanf("%d %d", &bonnes, &total);
              printf("Reussite : %.1f %%\n", bonnes * 100.0 / total);
              return 0;
          }
        `,
      },
      python: { py: 'l, L = map(float, input().split())', c: 'scanf("%lf %lf", &l, &L);', note: 'Une ligne de lecture dans les deux langages.' },
      guide: ex({
        id: 'w3l4-guide',
        mode: 'order',
        title: 'Le programme de la pizza',
        prompt: 'Remets les lignes dans l\'ordre : le programme lit le prix d\'une pizza (réel) et le nombre d\'amis (entier), puis affiche la part de chacun. Entrée `12.5 4` → `Chacun paie 3.12`.',
        prefix: '#include <stdio.h>\n\nint main(void)\n{',
        suffix: '    return 0;\n}',
        lines: [
          '    double prix;',
          '    int amis;',
          '    scanf("%lf %d", &prix, &amis);',
          '    double part = prix / amis;',
          '    printf("Chacun paie %.2f\\n", part);',
        ],
        tests: [{ stdin: '12.5 4\n' }, { stdin: '30 3\n', hidden: true }],
        hints: ['On déclare les variables avant de les lire.', 'On calcule avant d\'afficher.'],
      }),
      mission: ex({
        id: 'w3l4-mission',
        mode: 'write',
        title: 'Le jardin rond',
        prompt: 'Lis le rayon (réel) d\'un jardin circulaire et le prix du grillage par mètre (réel). Avec `PI = 3.14159`, affiche :\n```\nSurface : <surface avec 2 decimales>\nGrillage : <perimetre avec 2 decimales> m\nCout : <perimetre * prix avec 2 decimales>\n```\nExemple : entrée `5 12.5` → `Surface : 78.54`, `Grillage : 31.42 m`, `Cout : 392.70`.',
        solution: t`
          #include <stdio.h>

          #define PI 3.14159

          int main(void)
          {
              double rayon, prix;
              scanf("%lf %lf", &rayon, &prix);
              double surface = PI * rayon * rayon;
              double perimetre = 2 * PI * rayon;
              printf("Surface : %.2f\n", surface);
              printf("Grillage : %.2f m\n", perimetre);
              printf("Cout : %.2f\n", perimetre * prix);
              return 0;
          }
        `,
        tests: [{ stdin: '5 12.5\n' }, { stdin: '1 1\n', hidden: true }, { stdin: '2.5 8\n', hidden: true }],
        hints: ['Deux réels à lire : %lf %lf.', 'Surface = PI × r × r ; périmètre = 2 × PI × r.'],
      }),
      quiz: [
        { q: 'Dans quel ordre un programme de calcul s\'organise-t-il ?', choices: ['Sortie, entrée, calcul', 'Entrée, traitement, sortie', 'Calcul, entrée, sortie', 'Peu importe'], answer: 1, explain: 'On lit, on calcule, on affiche.' },
        { q: 'Quel type pour un nombre de billets vendus ?', choices: ['double', 'int', 'char', 'float'], answer: 1, explain: 'Une quantité entière.' },
        { q: 'Pourcentage de réussite exact avec deux int ok et n ?', choices: ['ok / n * 100', 'ok * 100.0 / n', '(ok / n) * 100', 'ok % n'], answer: 1, explain: 'Multiplier par 100.0 avant la division évite la division entière.' },
      ],
      resume: [
        'Entrée → traitement → sortie.',
        'Écris la formule en français avant de coder.',
        'Une variable par résultat intermédiaire, avec un nom clair.',
        'Attention à la division entière dans les pourcentages et moyennes.',
      ],
    },
    {
      id: 'w3l5',
      title: 'Saisie sûre et validation',
      topic: 'debug',
      skills: ['debug', 'logic'],
      objectif: 'Vérifier que scanf a réussi grâce à sa valeur de retour et refuser les valeurs absurdes.',
      explication: t`
        Un utilisateur peut taper n'importe quoi : \`abc\` au lieu d'un nombre, une note de 45/20…
        Un programme robuste **vérifie** ses entrées.

        **scanf renvoie le nombre de valeurs lues avec succès** : \`scanf("%d", &n)\` renvoie 1 si un entier a été lu,
        0 si l'utilisateur a tapé du texte, et \`EOF\` (-1) s'il n'y a plus rien à lire. Si scanf échoue,
        la variable **n'est pas modifiée** !

        On teste donc : \`if (scanf("%d", &n) != 1) { ... erreur ... }\`.

        Ensuite, on vérifie que la valeur est **plausible** : une note entre 0 et 20, un âge positif…
        En cas d'erreur, on affiche un message et on termine avec \`return 1;\` (code d'échec).

        (Les \`if\` sont étudiés en détail au Monde 4 ; ici on les utilise simplement pour vérifier.)
      `,
      syntaxe: {
        code: t`
          if (scanf("%d", &n) != 1) {
              printf("Saisie invalide\n");
              return 1;
          }
        `,
        note: 'Un return dans main termine le programme ; 1 signale une erreur.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int note = -1;
              int lu = scanf("%d", &note);
              printf("scanf a lu %d valeur(s)\n", lu);
              if (lu != 1) {
                  printf("Erreur : ce n'est pas un nombre\n");
                  return 1;
              }
              if (note < 0 || note > 20) {
                  printf("Erreur : note hors limites\n");
                  return 1;
              }
              printf("Note valide : %d/20\n", note);
              return 0;
          }
        `,
        stdin: 'abc\n',
        lines: {
          6: 'On garde le résultat de scanf : ici 0, car « abc » n\'est pas un entier.',
          8: 'Première vérification : la lecture a-t-elle réussi ?',
          12: 'Deuxième vérification : la valeur est-elle plausible ? (|| signifie « ou »).',
          16: 'On n\'arrive ici que si tout est correct.',
        },
      },
      visualisation: { kind: 'trace', note: 'Entrée « abc » : scanf renvoie 0 et note garde sa valeur -1. Le programme s\'arrête proprement.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int age;
              scanf("%d", &age);
              printf("Dans 10 ans : %d\n", age + 10);
              return 0;
          }
        `,
        stdin: 'dix\n',
        explication: 'Avec l\'entrée « dix », scanf échoue et age n\'est jamais rempli : le programme calcule avec une valeur indéterminée. C Quest signale la lecture d\'une variable non initialisée.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              int age;
              if (scanf("%d", &age) != 1) {
                  printf("Age invalide\n");
                  return 1;
              }
              printf("Dans 10 ans : %d\n", age + 10);
              return 0;
          }
        `,
      },
      python: { py: 'try:\n    n = int(input())\nexcept ValueError:\n    print("invalide")', c: 'if (scanf("%d", &n) != 1)\n    printf("invalide\\n");', note: 'Python lève une exception ; en C, on teste la valeur renvoyée par scanf.' },
      guide: ex({
        id: 'w3l5-guide',
        mode: 'complete',
        title: 'Le gardien de la saisie',
        prompt: 'Complète : si la lecture échoue, affiche `Invalide` ; sinon affiche le carré du nombre. Entrée `7` → `49`, entrée `x` → `Invalide`.',
        template: t`
          #include <stdio.h>

          int main(void)
          {
              int n;
              if (scanf("%d", &n) != ⟦⟧) {
                  printf("Invalide\n");
                  return ⟦⟧;
              }
              printf("%d\n", n * n);
              return 0;
          }
        `,
        blanks: [{ answer: '1', width: 2 }, { answer: '1', width: 2 }],
        tests: [{ stdin: '7\n' }, { stdin: 'x\n' }, { stdin: '-4\n', hidden: true }],
        hints: ['scanf renvoie le nombre de valeurs lues : on en attend une seule.', 'Un programme qui échoue renvoie un code différent de 0.'],
      }),
      mission: ex({
        id: 'w3l5-mission',
        mode: 'write',
        title: 'Convertisseur sécurisé',
        prompt: 'Lis une note sur 20 (un entier). Affiche :\n- `Saisie invalide` si ce n\'est pas un nombre ;\n- `Hors limites` si la note n\'est pas entre 0 et 20 ;\n- sinon `Sur 100 : <note * 5>`.\n\nUtilise la valeur de retour de scanf et `||`.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int note;
              if (scanf("%d", &note) != 1) {
                  printf("Saisie invalide\n");
                  return 1;
              }
              if (note < 0 || note > 20) {
                  printf("Hors limites\n");
                  return 1;
              }
              printf("Sur 100 : %d\n", note * 5);
              return 0;
          }
        `,
        tests: [{ stdin: '14\n' }, { stdin: 'quinze\n' }, { stdin: '25\n' }, { stdin: '-1\n', hidden: true }, { stdin: '0\n', hidden: true }, { stdin: '20\n', hidden: true }],
        hints: ['Premier test : scanf(...) != 1.', 'Deuxième test : note < 0 || note > 20.', 'N\'oublie pas les return 1; pour arrêter le programme en cas d\'erreur.'],
      }),
      quiz: [
        { q: 'Que renvoie `scanf("%d %d", &a, &b)` si l\'utilisateur tape `5 x` ?', choices: ['2', '1', '0', '-1'], answer: 1, explain: 'Un seul entier lu avec succès.' },
        { q: 'Si scanf("%d", &n) échoue, que contient n ?', choices: ['0', 'Toujours -1', 'Sa valeur d\'avant (inchangée)', 'Le texte tapé'], answer: 2, explain: 'scanf ne modifie pas la variable en cas d\'échec.' },
        { q: 'Que signifie `return 1;` dans main ?', choices: ['Succès', 'Le programme se termine en signalant une erreur', 'Recommencer', 'Afficher 1'], answer: 1, explain: '0 = succès, autre valeur = erreur.' },
      ],
      resume: [
        'scanf renvoie le nombre de valeurs lues.',
        'Teste `if (scanf(...) != 1)` avant d\'utiliser la valeur.',
        'Vérifie la plausibilité (bornes) après la lecture.',
        '`return 1;` termine en signalant une erreur.',
      ],
    },
  ],
  challenges: [
    ex({
      id: 'w3-c1', mode: 'write', kind: 'challenge', title: 'Le chronomètre',
      prompt: 'Lis un nombre de secondes (int). Affiche-le au format `HH:MM:SS` avec deux chiffres partout (indice : `%02d`). Entrée `3725` → `01:02:05`.',
      solution: t`
        #include <stdio.h>

        int main(void)
        {
            int total;
            scanf("%d", &total);
            int h = total / 3600;
            int m = total % 3600 / 60;
            int s = total % 60;
            printf("%02d:%02d:%02d\n", h, m, s);
            return 0;
        }
      `,
      tests: [{ stdin: '3725\n' }, { stdin: '59\n' }, { stdin: '86399\n', hidden: true }],
      hints: ['%02d affiche un entier sur 2 chiffres, complété par des zéros.'],
    }),
    ex({
      id: 'w3-c2', mode: 'write', kind: 'challenge', title: 'Somme des chiffres',
      prompt: 'Lis un entier de **3 chiffres** et affiche la somme de ses chiffres. Entrée `472` → `13`. Utilise `/` et `%`.',
      solution: t`
        #include <stdio.h>

        int main(void)
        {
            int n;
            scanf("%d", &n);
            int c = n / 100;
            int d = n / 10 % 10;
            int u = n % 10;
            printf("%d\n", c + d + u);
            return 0;
        }
      `,
      tests: [{ stdin: '472\n' }, { stdin: '999\n', hidden: true }, { stdin: '100\n', hidden: true }],
      hints: ['Unités : n % 10. Dizaines : (n / 10) % 10. Centaines : n / 100.'],
    }),
  ],
  boss: {
    id: 'boss-w3',
    name: 'Le Diviseur Fou',
    avatar: 'divider',
    taunt: 'Sept divisé par deux ? TROIS ! Ha ha ! Et si je divise par zéro… tout s\'effondre !',
    defeat: 'Tes divisions sont justes… et tu vérifies tes diviseurs. Je suis… vaincu.',
    timeLimit: 840,
    phases: [
      ex({
        id: 'boss-w3-p1', mode: 'predict', title: 'Phase 1 : le calcul tordu',
        prompt: 'Que va afficher ce programme ?',
        code: t`
          #include <stdio.h>

          int main(void)
          {
              int a = 7, b = 2;
              printf("%d %d %.1f %.1f\n", a / b, a % b, a / b * 1.0, a * 1.0 / b);
              return 0;
          }
        `,
        choices: ['3 1 3.5 3.5', '3 1 3.0 3.5', '3.5 1 3.5 3.5', '3 1 3.0 3.0'],
        hints: ['Les opérations se font de gauche à droite : a / b d\'abord dans la 3e expression.'],
      }),
      ex({
        id: 'boss-w3-p2', mode: 'bug', title: 'Phase 2 : le partage piégé',
        prompt: 'Ce programme partage un butin entre des joueurs. Il plante si le nombre de joueurs est 0 et calcule mal la part. Corrige-le : entrée `100 3` → `Part : 33.33`, entrée `50 0` → `Aucun joueur`.',
        starter: t`
          #include <stdio.h>

          int main(void)
          {
              int butin, joueurs;
              scanf("%d %d", &butin, &joueurs);
              double part = butin / joueurs;
              printf("Part : %.2f\n", part);
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              int butin, joueurs;
              scanf("%d %d", &butin, &joueurs);
              if (joueurs == 0) {
                  printf("Aucun joueur\n");
                  return 1;
              }
              double part = (double) butin / joueurs;
              printf("Part : %.2f\n", part);
              return 0;
          }
        `,
        tests: [{ stdin: '100 3\n' }, { stdin: '50 0\n' }, { stdin: '7 2\n', hidden: true }],
        hints: ['Teste joueurs == 0 AVANT de diviser.', 'Utilise un cast (double) pour la part.'],
      }),
      ex({
        id: 'boss-w3-p3', mode: 'write', title: 'Phase 3 : la facture finale',
        prompt: 'Lis une quantité (int) et un prix unitaire (double). Si la lecture échoue, affiche `Erreur`. Sinon affiche :\n```\nHT : <quantite * prix, 2 decimales>\nTVA : <20 % du HT, 2 decimales>\nTTC : <HT + TVA, 2 decimales>\n```\nEntrée `3 9.99` → `HT : 29.97`, `TVA : 5.99`, `TTC : 35.96`.',
        solution: t`
          #include <stdio.h>

          #define TVA 0.20

          int main(void)
          {
              int quantite;
              double prix;
              if (scanf("%d %lf", &quantite, &prix) != 2) {
                  printf("Erreur\n");
                  return 1;
              }
              double ht = quantite * prix;
              double tva = ht * TVA;
              printf("HT : %.2f\n", ht);
              printf("TVA : %.2f\n", tva);
              printf("TTC : %.2f\n", ht + tva);
              return 0;
          }
        `,
        tests: [{ stdin: '3 9.99\n' }, { stdin: 'trois 2\n' }, { stdin: '10 0.5\n', hidden: true }],
        hints: ['scanf avec deux formats renvoie 2 en cas de succès.', 'TVA = HT × 0.20.'],
      }),
    ],
  },
};
