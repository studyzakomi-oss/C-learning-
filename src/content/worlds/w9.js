import { t, ex } from '../helpers.js';

const NOTES_TXT = 'Ali 14\nMariem 17\nSidi 9\nAicha 12\n';

export default {
  id: 'w9',
  num: 9,
  title: 'Structures et Fichiers',
  subtitle: 'Regrouper des données avec struct, les sauvegarder dans des fichiers, organiser le code en modules',
  color: '#38bdf8',
  icon: '🗂️',
  intro: t`
    La Grande Bibliothèque conserve les fiches de tous les habitants du royaume. Chaque fiche regroupe
    plusieurs informations : un nom, un âge, une moyenne… c'est une structure. Et pour qu'elles survivent
    à la nuit, il faut les écrire dans des fichiers. L'Archiviste Corrompu efface tout ce qui n'est pas fermé proprement.
  `,
  lessons: [
    {
      id: 'w9l1',
      title: 'struct et typedef',
      topic: 'syntax',
      skills: ['syntax', 'memory'],
      objectif: 'Créer un type composé avec struct, accéder à ses champs, et le simplifier avec typedef.',
      explication: t`
        Une **structure** regroupe plusieurs variables de types différents sous un seul nom :
        un étudiant = un nom (\`char[30]\`) + un âge (\`int\`) + une moyenne (\`double\`).

        On définit le modèle avec \`struct\`, puis on crée des variables de ce type.
        On accède à un champ avec le **point** : \`e.age\`.

        \`typedef\` donne un nom plus court au type : \`typedef struct { ... } Etudiant;\` permet d'écrire \`Etudiant e;\`.

        Une structure **se copie** entière avec \`=\` (contrairement à un tableau) et peut être passée à une fonction ou renvoyée.
        Via un **pointeur** de structure, on utilise la flèche : \`p->age\` (équivaut à \`(*p).age\`).
      `,
      syntaxe: {
        code: t`
          typedef struct {
              char nom[30];
              int age;
              double moyenne;
          } Etudiant;

          Etudiant e = {"Ali", 19, 14.5};
          e.age = 20;
          Etudiant *p = &e;
          p->moyenne = 15.0;
        `,
        note: 'Point pour une variable, flèche -> pour un pointeur.',
      },
      exemple: {
        code: t`
          #include <stdio.h>
          #include <string.h>

          typedef struct {
              char nom[30];
              int age;
              double moyenne;
          } Etudiant;

          void anniversaire(Etudiant *e)
          {
              e->age++;
          }

          void afficher(Etudiant e)
          {
              printf("%s, %d ans, moyenne %.2f\n", e.nom, e.age, e.moyenne);
          }

          int main(void)
          {
              Etudiant a = {"Mariem", 19, 16.25};
              Etudiant b = a;
              strcpy(b.nom, "Copie");
              anniversaire(&a);
              afficher(a);
              afficher(b);
              printf("Taille d'un Etudiant : %zu octets\n", sizeof(Etudiant));
              return 0;
          }
        `,
        lines: {
          4: 'Le modèle : trois champs. typedef lui donne le nom Etudiant.',
          12: 'Pointeur de structure : flèche ->.',
          22: 'Initialisation dans l\'ordre des champs.',
          23: 'Copie complète de la structure (champ par champ).',
          25: 'On passe l\'adresse pour modifier a.',
        },
      },
      visualisation: { kind: 'trace', note: 'Chaque structure apparaît avec ses champs : .nom, .age, .moyenne.' },
      erreur: {
        code: t`
          #include <stdio.h>

          typedef struct {
              int x;
              int y;
          } Point;

          void deplacer(Point *p)
          {
              p.x = p.x + 1;
          }

          int main(void)
          {
              Point a = {0, 0};
              deplacer(&a);
              printf("%d\n", a.x);
              return 0;
          }
        `,
        explication: 'p est un pointeur vers une structure : on accède aux champs avec -> et non avec le point. Le compilateur le dit : « p is a pointer; did you mean to use -> ? ».',
        correction: t`
          #include <stdio.h>

          typedef struct {
              int x;
              int y;
          } Point;

          void deplacer(Point *p)
          {
              p->x = p->x + 1;
          }

          int main(void)
          {
              Point a = {0, 0};
              deplacer(&a);
              printf("%d\n", a.x);
              return 0;
          }
        `,
      },
      python: { py: '@dataclass\nclass Point:\n    x: int\n    y: int', c: 'typedef struct {\n    int x;\n    int y;\n} Point;', note: 'Une struct ressemble à une dataclass sans méthodes.' },
      guide: ex({
        id: 'w9l1-guide',
        mode: 'complete',
        title: 'La fiche du livre',
        prompt: 'Complète pour afficher `Le Petit Prince (1943) - 96 pages`.',
        template: t`
          #include <stdio.h>

          typedef ⟦⟧ {
              char titre[50];
              int annee;
              int pages;
          } Livre;

          int main(void)
          {
              Livre l = {"Le Petit Prince", 1943, 96};
              printf("%s (%d) - %d pages\n", l⟦⟧titre, l.annee, l.pages);
              return 0;
          }
        `,
        blanks: [{ answer: 'struct', width: 7 }, { answer: '.', width: 2 }],
        hints: ['Le mot-clé qui définit un type composé.', 'On accède à un champ d\'une variable avec…'],
      }),
      mission: ex({
        id: 'w9l1-mission',
        mode: 'write',
        title: 'Distance entre deux points',
        prompt: 'Définis `typedef struct { double x; double y; } Point;`. Écris `double distance(Point a, Point b)` (utilise `sqrt` de `<math.h>`) et `Point milieu(Point a, Point b)`. Lis 4 réels x1 y1 x2 y2 et affiche :\n```\nDistance : <2 decimales>\nMilieu : (<x 2 decimales>, <y 2 decimales>)\n```\nEntrée `0 0 3 4` → `Distance : 5.00`, `Milieu : (1.50, 2.00)`.',
        solution: t`
          #include <stdio.h>
          #include <math.h>

          typedef struct {
              double x;
              double y;
          } Point;

          double distance(Point a, Point b)
          {
              double dx = b.x - a.x;
              double dy = b.y - a.y;
              return sqrt(dx * dx + dy * dy);
          }

          Point milieu(Point a, Point b)
          {
              Point m = {(a.x + b.x) / 2, (a.y + b.y) / 2};
              return m;
          }

          int main(void)
          {
              Point a, b;
              scanf("%lf %lf %lf %lf", &a.x, &a.y, &b.x, &b.y);
              Point m = milieu(a, b);
              printf("Distance : %.2f\n", distance(a, b));
              printf("Milieu : (%.2f, %.2f)\n", m.x, m.y);
              return 0;
          }
        `,
        tests: [{ stdin: '0 0 3 4\n' }, { stdin: '-1 2 5 -6\n', hidden: true }, { stdin: '1.5 1.5 1.5 1.5\n', hidden: true }],
        require: [{ pattern: 'typedef\\s+struct', message: 'Définis le type Point avec typedef struct.' }, { pattern: 'Point\\s+milieu\\s*\\(', message: 'Écris Point milieu(Point a, Point b).' }],
        hints: ['scanf peut écrire dans un champ : &a.x.', 'distance = sqrt(dx² + dy²).', 'milieu renvoie une structure Point.'],
      }),
      quiz: [
        { q: 'Comment accéder au champ age de la variable e ?', choices: ['e->age', 'e.age', 'e[age]', 'age.e'], answer: 1, explain: 'Le point pour une variable structure.' },
        { q: 'Et si p est un pointeur vers cette structure ?', choices: ['p.age', 'p->age', '*p.age', '&p.age'], answer: 1, explain: 'p->age, équivalent à (*p).age.' },
        { q: 'Peut-on copier une structure avec `=` ?', choices: ['Oui, tous les champs sont copiés', 'Non, comme les tableaux', 'Seulement avec typedef', 'Seulement les int'], answer: 0, explain: 'Contrairement aux tableaux, oui.' },
        { q: 'À quoi sert typedef ?', choices: ['À créer une variable', 'À donner un nouveau nom à un type', 'À allouer de la mémoire', 'À inclure un fichier'], answer: 1, explain: 'Etudiant au lieu de struct etudiant.' },
      ],
      resume: [
        '`typedef struct { champs } Nom;`',
        'Accès : `v.champ` ; via pointeur : `p->champ`.',
        'Une structure se copie avec `=` et se passe aux fonctions.',
        'Passe un pointeur pour modifier la structure de l\'appelant.',
      ],
    },
    {
      id: 'w9l2',
      title: 'Tableaux de structures',
      topic: 'algo',
      skills: ['algo', 'memory'],
      objectif: 'Gérer une collection d\'enregistrements : remplir, parcourir, chercher, trier un tableau de structures.',
      explication: t`
        Un **tableau de structures** est la base de toute petite « base de données » : \`Etudiant classe[30];\`.
        \`classe[i]\` est une structure, \`classe[i].nom\` un de ses champs.

        On garde souvent un **compteur** \`n\` du nombre de cases réellement utilisées (le tableau a une capacité maximale).

        Algorithmes habituels :
        - parcourir et afficher ;
        - chercher selon un champ (\`strcmp\` pour un nom) ;
        - trouver le meilleur (max sur un champ) ;
        - trier selon un champ : on échange des structures entières (\`=\` fonctionne !).
      `,
      syntaxe: {
        code: t`
          #define MAX 30
          Etudiant classe[MAX];
          int n = 0;
          classe[n] = nouvel_etudiant;
          n++;
          for (int i = 0; i < n; i++) {
              printf("%s\n", classe[i].nom);
          }
        `,
        note: 'Capacité MAX, nombre réel n.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          typedef struct {
              char nom[20];
              int score;
          } Joueur;

          int main(void)
          {
              Joueur j[4] = {{"Ali", 120}, {"Mariem", 340}, {"Sidi", 90}, {"Aicha", 210}};
              int n = 4;
              for (int i = 0; i < n - 1; i++) {
                  for (int k = 0; k < n - 1 - i; k++) {
                      if (j[k].score < j[k + 1].score) {
                          Joueur tmp = j[k];
                          j[k] = j[k + 1];
                          j[k + 1] = tmp;
                      }
                  }
              }
              for (int i = 0; i < n; i++) {
                  printf("%d. %-8s %4d\n", i + 1, j[i].nom, j[i].score);
              }
              return 0;
          }
        `,
        lines: {
          10: 'Initialisation d\'un tableau de 4 structures.',
          14: 'Tri décroissant selon le champ score.',
          15: 'On échange des structures complètes.',
          22: '%-8s aligne les noms à gauche sur 8 caractères.',
        },
      },
      visualisation: { kind: 'trace', note: 'Le tableau j contient 4 structures ; observe-les changer de place pendant le tri.' },
      erreur: {
        code: t`
          #include <stdio.h>
          #include <string.h>

          typedef struct {
              char nom[20];
              int age;
          } Personne;

          int main(void)
          {
              Personne p[2] = {{"Ali", 20}, {"Lina", 22}};
              for (int i = 0; i < 2; i++) {
                  if (p[i].nom == "Lina") {
                      printf("Lina a %d ans\n", p[i].age);
                  }
              }
              return 0;
          }
        `,
        explication: 'On compare un champ chaîne avec == : cela compare des adresses, jamais le texte. Résultat : rien ne s\'affiche. Il faut strcmp(p[i].nom, "Lina") == 0.',
        correction: t`
          #include <stdio.h>
          #include <string.h>

          typedef struct {
              char nom[20];
              int age;
          } Personne;

          int main(void)
          {
              Personne p[2] = {{"Ali", 20}, {"Lina", 22}};
              for (int i = 0; i < 2; i++) {
                  if (strcmp(p[i].nom, "Lina") == 0) {
                      printf("Lina a %d ans\n", p[i].age);
                  }
              }
              return 0;
          }
        `,
      },
      python: { py: 'joueurs.sort(key=lambda j: j.score, reverse=True)', c: '/* tri à bulles sur j[k].score */', note: 'En C, on écrit le tri soi-même (ou on utilise qsort, Monde 10).' },
      guide: ex({
        id: 'w9l2-guide',
        mode: 'order',
        title: 'Le meilleur élève',
        prompt: 'Remets dans l\'ordre la boucle qui trouve l\'indice du meilleur élève et l\'affiche. Le résultat attendu est `Meilleur : Mariem (17)`.',
        prefix: '#include <stdio.h>\n\ntypedef struct {\n    char nom[20];\n    int note;\n} Eleve;\n\nint main(void)\n{\n    Eleve e[3] = {{"Ali", 14}, {"Mariem", 17}, {"Sidi", 9}};',
        suffix: '    return 0;\n}',
        lines: [
          '    int best = 0;',
          '    for (int i = 1; i < 3; i++) {',
          '        if (e[i].note > e[best].note) {',
          '            best = i;',
          '        }',
          '    }',
          '    printf("Meilleur : %s (%d)\\n", e[best].nom, e[best].note);',
        ],
        hints: ['On initialise l\'indice du meilleur avant la boucle.', 'L\'affichage vient après la boucle.'],
      }),
      mission: ex({
        id: 'w9l2-mission',
        mode: 'write',
        title: 'Le carnet de contacts',
        prompt: 'Lis n (≤ 20) puis n contacts sous la forme `nom age` (nom sans espace). Stocke-les dans un tableau de `typedef struct { char nom[30]; int age; } Contact;`. Lis ensuite un nom à rechercher. Affiche :\n- la liste triée par âge croissant, une ligne `nom (age)` par contact ;\n- puis `Trouve : <nom>, <age> ans` ou `<nom> introuvable`.\n\nEntrée `3` / `Sidi 30` / `Ali 19` / `Lina 25` / `Lina`.',
        solution: t`
          #include <stdio.h>
          #include <string.h>

          typedef struct {
              char nom[30];
              int age;
          } Contact;

          int main(void)
          {
              Contact c[20];
              int n;
              scanf("%d", &n);
              for (int i = 0; i < n; i++) {
                  scanf("%29s %d", c[i].nom, &c[i].age);
              }
              for (int i = 0; i < n - 1; i++) {
                  for (int k = 0; k < n - 1 - i; k++) {
                      if (c[k].age > c[k + 1].age) {
                          Contact tmp = c[k];
                          c[k] = c[k + 1];
                          c[k + 1] = tmp;
                      }
                  }
              }
              for (int i = 0; i < n; i++) {
                  printf("%s (%d)\n", c[i].nom, c[i].age);
              }
              char cherche[30];
              scanf("%29s", cherche);
              for (int i = 0; i < n; i++) {
                  if (strcmp(c[i].nom, cherche) == 0) {
                      printf("Trouve : %s, %d ans\n", c[i].nom, c[i].age);
                      return 0;
                  }
              }
              printf("%s introuvable\n", cherche);
              return 0;
          }
        `,
        tests: [{ stdin: '3\nSidi 30\nAli 19\nLina 25\nLina\n' }, { stdin: '2\nZara 40\nOmar 12\nPaul\n' }, { stdin: '1\nSolo 50\nSolo\n', hidden: true }],
        require: [{ pattern: 'typedef\\s+struct', message: 'Utilise une structure Contact.' }, { pattern: 'strcmp', message: 'Compare les noms avec strcmp.' }],
        hints: ['scanf("%29s %d", c[i].nom, &c[i].age) : pas de & devant le tableau nom.', 'Tri à bulles sur le champ age, en échangeant des Contact entiers.', 'Recherche avec strcmp.'],
      }),
      quiz: [
        { q: 'Comment accéder au nom du 3e joueur du tableau j ?', choices: ['j.nom[2]', 'j[2].nom', 'j[3].nom', 'j->nom[2]'], answer: 1, explain: 'Indice 2, puis le champ.' },
        { q: 'Pour échanger deux structures, on peut…', choices: ['Utiliser strcpy', 'Utiliser une structure temporaire et =', 'C\'est impossible', 'Utiliser memcmp'], answer: 1, explain: 'Les structures se copient avec =.' },
        { q: 'Pourquoi garder une variable n à côté de `Contact c[20]` ?', choices: ['Pour la décoration', 'Pour savoir combien de cases sont réellement remplies', 'C\'est obligatoire en C', 'Pour trier'], answer: 1, explain: 'Capacité ≠ nombre d\'éléments.' },
      ],
      resume: [
        '`Type t[MAX];` + compteur `n` d\'éléments utilisés.',
        'Accès : `t[i].champ`.',
        'Comparer des noms : `strcmp`.',
        'Trier : échanger des structures entières.',
      ],
    },
    {
      id: 'w9l3',
      title: 'Lire et écrire des fichiers',
      topic: 'memory',
      skills: ['memory', 'debug'],
      objectif: 'Ouvrir un fichier avec fopen, écrire avec fprintf, lire avec fgets/fscanf, fermer avec fclose, et gérer les erreurs.',
      explication: t`
        Les variables disparaissent à la fin du programme. Pour **conserver** des données, on les écrit dans un **fichier**.

        1. **Ouvrir** : \`FILE *f = fopen("notes.txt", "r");\` — modes : \`"r"\` lire, \`"w"\` écrire (écrase !), \`"a"\` ajouter à la fin.
        2. **Tester** : fopen renvoie **NULL** si l'ouverture échoue (fichier absent en lecture…). Toujours tester !
        3. **Lire / écrire** : \`fprintf(f, ...)\` (comme printf), \`fscanf(f, ...)\` (comme scanf), \`fgets(ligne, taille, f)\` (une ligne).
        4. **Fermer** : \`fclose(f);\` — sinon les dernières données peuvent ne jamais être écrites.

        Lire tout un fichier : \`while (fgets(ligne, sizeof ligne, f) != NULL)\` ou \`while (fscanf(f, "%s %d", nom, &note) == 2)\`.

        Dans C Quest, les fichiers vivent dans un petit disque virtuel : les fichiers créés apparaissent sous la console.
      `,
      syntaxe: {
        code: t`
          FILE *f = fopen("fichier.txt", "w");
          if (f == NULL) {
              printf("Erreur d'ouverture\n");
              return 1;
          }
          fprintf(f, "%d\n", valeur);
          fclose(f);
        `,
        note: 'fopen → test NULL → lire/écrire → fclose.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              FILE *f = fopen("scores.txt", "w");
              if (f == NULL) {
                  printf("Impossible de creer le fichier\n");
                  return 1;
              }
              fprintf(f, "Ali 120\n");
              fprintf(f, "Mariem 340\n");
              fclose(f);

              f = fopen("scores.txt", "r");
              if (f == NULL) {
                  return 1;
              }
              char nom[30];
              int score, total = 0;
              while (fscanf(f, "%29s %d", nom, &score) == 2) {
                  printf("%s : %d\n", nom, score);
                  total += score;
              }
              fclose(f);
              printf("Total : %d\n", total);
              return 0;
          }
        `,
        lines: {
          5: '"w" crée le fichier (ou l\'écrase s\'il existe).',
          6: 'On teste TOUJOURS le résultat de fopen.',
          10: 'fprintf écrit dans le fichier comme printf écrit à l\'écran.',
          12: 'fclose enregistre et libère le fichier.',
          20: 'On lit tant que fscanf parvient à lire 2 valeurs.',
        },
      },
      visualisation: { kind: 'trace', note: 'Le pointeur f désigne un fichier ouvert ; regarde total s\'accumuler pendant la lecture.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              FILE *f = fopen("inexistant.txt", "r");
              char ligne[100];
              fgets(ligne, sizeof ligne, f);
              printf("%s", ligne);
              fclose(f);
              return 0;
          }
        `,
        explication: 'Le fichier n\'existe pas : fopen renvoie NULL. Sans test, fgets utilise un FILE* NULL et le programme plante. Il faut toujours vérifier f == NULL juste après fopen.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              FILE *f = fopen("inexistant.txt", "r");
              if (f == NULL) {
                  printf("Fichier introuvable\n");
                  return 1;
              }
              char ligne[100];
              if (fgets(ligne, sizeof ligne, f) != NULL) {
                  printf("%s", ligne);
              }
              fclose(f);
              return 0;
          }
        `,
      },
      python: { py: 'with open("f.txt") as f:\n    for ligne in f: ...', c: 'FILE *f = fopen("f.txt", "r");\nif (f == NULL) { ... }\nwhile (fgets(l, sizeof l, f)) { ... }\nfclose(f);', note: 'Pas de « with » en C : n\'oublie jamais fclose, et teste NULL au lieu d\'attraper une exception.' },
      guide: ex({
        id: 'w9l3-guide',
        mode: 'complete',
        title: 'Compter les lignes',
        prompt: 'Complète pour compter les lignes du fichier `notes.txt` (fourni). Résultat attendu : `4 lignes`.',
        template: t`
          #include <stdio.h>

          int main(void)
          {
              FILE *f = fopen("notes.txt", ⟦⟧);
              if (f == ⟦⟧) {
                  printf("Erreur\n");
                  return 1;
              }
              char ligne[100];
              int n = 0;
              while (fgets(ligne, sizeof ligne, f) != NULL) {
                  n++;
              }
              ⟦⟧(f);
              printf("%d lignes\n", n);
              return 0;
          }
        `,
        blanks: [{ answer: '"r"', width: 4 }, { answer: 'NULL', width: 5 }, { answer: 'fclose', width: 7 }],
        tests: [{ files: { 'notes.txt': NOTES_TXT } }, { files: { 'notes.txt': 'a\nb\n' }, hidden: true }],
        hints: ['Mode lecture.', 'Valeur renvoyée par fopen en cas d\'échec.', 'On ferme toujours le fichier.'],
      }),
      mission: ex({
        id: 'w9l3-mission',
        mode: 'write',
        title: 'Le relevé de notes',
        prompt: 'Le fichier `notes.txt` contient des lignes `nom note`. Lis-le avec fscanf, puis :\n1. affiche `Moyenne : <2 decimales>` ;\n2. écris dans un nouveau fichier `admis.txt` le nom de chaque élève ayant au moins 10, un par ligne ;\n3. affiche `<k> admis ecrits dans admis.txt`.\n\nSi `notes.txt` est introuvable, affiche `Fichier introuvable`.',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              FILE *in = fopen("notes.txt", "r");
              if (in == NULL) {
                  printf("Fichier introuvable\n");
                  return 1;
              }
              FILE *out = fopen("admis.txt", "w");
              if (out == NULL) {
                  fclose(in);
                  return 1;
              }
              char nom[30];
              int note, n = 0, somme = 0, admis = 0;
              while (fscanf(in, "%29s %d", nom, &note) == 2) {
                  somme += note;
                  n++;
                  if (note >= 10) {
                      fprintf(out, "%s\n", nom);
                      admis++;
                  }
              }
              fclose(in);
              fclose(out);
              if (n > 0) {
                  printf("Moyenne : %.2f\n", (double) somme / n);
              }
              printf("%d admis ecrits dans admis.txt\n", admis);
              return 0;
          }
        `,
        tests: [
          { name: 'Fichier fourni', files: { 'notes.txt': NOTES_TXT }, expectFiles: true },
          { name: 'Fichier absent', files: {} },
          { name: 'Autre classe', files: { 'notes.txt': 'Zed 10\nYan 9\n' }, expectFiles: true, hidden: true },
        ],
        hints: ['Ouvre notes.txt en "r" et admis.txt en "w" ; teste les deux.', 'while (fscanf(in, "%29s %d", nom, &note) == 2).', 'Ferme les deux fichiers.'],
      }),
      quiz: [
        { q: 'Que renvoie fopen si le fichier à lire n\'existe pas ?', choices: ['0', 'NULL', '-1', 'Un fichier vide'], answer: 1, explain: 'Toujours tester f == NULL.' },
        { q: 'Que fait le mode "w" sur un fichier existant ?', choices: ['Ajoute à la fin', 'Efface son contenu', 'Erreur', 'Le lit'], answer: 1, explain: '"w" tronque le fichier ; "a" ajoute.' },
        { q: 'Quelle boucle lit un fichier ligne par ligne ?', choices: ['while (fgets(l, sizeof l, f) != NULL)', 'while (!f)', 'for (;;) fprintf(f)', 'while (fclose(f))'], answer: 0, explain: 'fgets renvoie NULL à la fin du fichier.' },
        { q: 'Pourquoi appeler fclose ?', choices: ['Ce n\'est pas utile', 'Pour vider les tampons et libérer le fichier', 'Pour effacer le fichier', 'Pour le relire'], answer: 1, explain: 'Sans fclose, des données peuvent être perdues.' },
      ],
      resume: [
        '`fopen` → tester `NULL` → `fprintf` / `fscanf` / `fgets` → `fclose`.',
        'Modes : "r" lire, "w" écrire (écrase), "a" ajouter.',
        'Boucle de lecture : tant que la lecture réussit.',
        'Un fichier ouvert doit toujours être fermé.',
      ],
    },
    {
      id: 'w9l4',
      title: 'Programmes en plusieurs fichiers et en-têtes',
      topic: 'syntax',
      skills: ['syntax', 'algo'],
      objectif: 'Organiser un programme en modules : un fichier .h pour les déclarations, un .c pour les définitions.',
      explication: t`
        Quand un programme grandit, on le **découpe en modules** :
        - \`outils.h\` (**en-tête**) : les **déclarations** — prototypes, types (\`typedef struct\`), constantes.
        - \`outils.c\` : les **définitions** des fonctions, qui \`#include "outils.h"\`.
        - \`main.c\` : utilise le module grâce à \`#include "outils.h"\`.

        \`#include "outils.h"\` (avec des **guillemets**) cherche le fichier dans le projet ;
        \`#include <stdio.h>\` (chevrons) cherche dans la bibliothèque standard.

        Un en-tête est protégé contre la double inclusion par une **garde** :
        \`#ifndef OUTILS_H\` / \`#define OUTILS_H\` / … / \`#endif\`.

        On compile tous les .c ensemble : \`gcc main.c outils.c -o programme\`. C Quest le fait pour toi.
        Ne mets jamais de **définition** de fonction dans un .h : seulement des déclarations.
      `,
      syntaxe: {
        code: t`
          /* outils.h */
          #ifndef OUTILS_H
          #define OUTILS_H
          int carre(int x);
          #endif

          /* outils.c */
          #include "outils.h"
          int carre(int x) { return x * x; }

          /* main.c */
          #include "outils.h"
        `,
        note: 'Déclarations dans le .h, définitions dans le .c.',
      },
      exemple: {
        code: t`
          #include <stdio.h>
          #include "geometrie.h"

          int main(void)
          {
              Rectangle r = {4.0, 2.5};
              printf("Aire : %.2f\n", aire(r));
              printf("Perimetre : %.2f\n", perimetre(r));
              return 0;
          }
        `,
        sources: {
          'geometrie.h': t`
            #ifndef GEOMETRIE_H
            #define GEOMETRIE_H

            typedef struct {
                double largeur;
                double hauteur;
            } Rectangle;

            double aire(Rectangle r);
            double perimetre(Rectangle r);

            #endif
          `,
          'geometrie.c': t`
            #include "geometrie.h"

            double aire(Rectangle r)
            {
                return r.largeur * r.hauteur;
            }

            double perimetre(Rectangle r)
            {
                return 2 * (r.largeur + r.hauteur);
            }
          `,
        },
        lines: {
          2: 'Guillemets : un en-tête du projet. Il apporte le type Rectangle et les prototypes.',
          6: 'Rectangle est défini dans geometrie.h.',
          7: 'aire est définie dans geometrie.c : l\'éditeur de liens relie les deux fichiers.',
        },
      },
      visualisation: {
        kind: 'trace',
        note: 'Version en un seul fichier pour la visualisation : le comportement est identique, seule l\'organisation change.',
        code: t`
          #include <stdio.h>

          typedef struct {
              double largeur;
              double hauteur;
          } Rectangle;

          double aire(Rectangle r)
          {
              return r.largeur * r.hauteur;
          }

          int main(void)
          {
              Rectangle r = {4.0, 2.5};
              double a = aire(r);
              printf("Aire : %.2f\n", a);
              return 0;
          }
        `,
      },
      erreur: {
        code: t`
          #include <stdio.h>
          #include "maths.h"

          int main(void)
          {
              printf("%d\n", cube(3));
              return 0;
          }
        `,
        explication: 'Le fichier d\'en-tête « maths.h » n\'existe pas dans le projet : le préprocesseur s\'arrête avec « No such file or directory ». Vérifie le nom du fichier et les guillemets.',
        correction: t`
          #include <stdio.h>

          int cube(int x);

          int main(void)
          {
              printf("%d\n", cube(3));
              return 0;
          }

          int cube(int x)
          {
              return x * x * x;
          }
        `,
      },
      python: { py: '# outils.py\ndef carre(x): ...\n\n# main.py\nfrom outils import carre', c: '/* outils.h */ int carre(int x);\n/* main.c */ #include "outils.h"', note: 'import de Python ≈ #include d\'un en-tête + compilation de son .c.' },
      guide: ex({
        id: 'w9l4-guide',
        mode: 'complete',
        title: 'Utiliser le module',
        prompt: 'Le projet contient `compteur.h` et `compteur.c` (ouvre-les ci-dessous). Complète main.c pour utiliser le module : le programme affiche `3`.',
        template: t`
          #include <stdio.h>
          #include ⟦⟧

          int main(void)
          {
              Compteur c = {0};
              incrementer(&c);
              incrementer(&c);
              ⟦⟧(&c);
              printf("%d\n", c.valeur);
              return 0;
          }
        `,
        blanks: [{ answer: '"compteur.h"', width: 12 }, { answer: 'incrementer', width: 12 }],
        files: {
          'compteur.h': t`
            #ifndef COMPTEUR_H
            #define COMPTEUR_H

            typedef struct {
                int valeur;
            } Compteur;

            void incrementer(Compteur *c);

            #endif
          `,
          'compteur.c': t`
            #include "compteur.h"

            void incrementer(Compteur *c)
            {
                c->valeur++;
            }
          `,
        },
        hints: ['Un en-tête du projet s\'inclut avec des guillemets.', 'Il faut un troisième incrément.'],
      }),
      mission: ex({
        id: 'w9l4-mission',
        mode: 'write',
        title: 'Le module de températures',
        prompt: 'Le projet contient `temperature.h` (ouvre-le) qui déclare `double celsius_vers_fahrenheit(double c);` et `double moyenne(const double t[], int n);`, **et** le fichier `temperature.c`, qui est vide de fonctions. Tu ne peux modifier que main.c : écris-y donc les **définitions** des deux fonctions après main, en incluant l\'en-tête. main lit n (≤ 31) puis n températures en °C, et affiche `Moyenne : <x.x> C / <y.y> F`.\n\nEntrée `3` puis `20 25 30` → `Moyenne : 25.0 C / 77.0 F`.',
        files: {
          'temperature.h': t`
            #ifndef TEMPERATURE_H
            #define TEMPERATURE_H

            #define MAX_JOURS 31

            double celsius_vers_fahrenheit(double c);
            double moyenne(const double t[], int n);

            #endif
          `,
          'temperature.c': t`
            #include "temperature.h"

            /* Les définitions sont à écrire dans main.c pour cet exercice. */
          `,
        },
        solution: t`
          #include <stdio.h>
          #include "temperature.h"

          int main(void)
          {
              int n;
              double t[MAX_JOURS];
              scanf("%d", &n);
              for (int i = 0; i < n; i++) {
                  scanf("%lf", &t[i]);
              }
              double m = moyenne(t, n);
              printf("Moyenne : %.1f C / %.1f F\n", m, celsius_vers_fahrenheit(m));
              return 0;
          }

          double celsius_vers_fahrenheit(double c)
          {
              return c * 9.0 / 5 + 32;
          }

          double moyenne(const double t[], int n)
          {
              double s = 0;
              for (int i = 0; i < n; i++) {
                  s += t[i];
              }
              return s / n;
          }
        `,
        tests: [{ stdin: '3\n20 25 30\n' }, { stdin: '2\n-5 5\n', hidden: true }, { stdin: '1\n36.6\n', hidden: true }],
        require: [{ pattern: '#\\s*include\\s*"temperature\\.h"', message: 'Inclue l\'en-tête du module : #include "temperature.h".', raw: true }],
        hints: ['#include "temperature.h" donne les prototypes et MAX_JOURS.', 'Les signatures des définitions doivent correspondre exactement aux prototypes.'],
      }),
      quiz: [
        { q: 'Que met-on dans un fichier .h ?', choices: ['Les définitions de fonctions', 'Les déclarations (prototypes, types, constantes)', 'La fonction main', 'Rien'], answer: 1, explain: 'Les définitions vont dans le .c.' },
        { q: 'Quelle forme pour inclure un en-tête du projet ?', choices: ['#include <outils.h>', '#include "outils.h"', 'import outils', '#use outils'], answer: 1, explain: 'Guillemets pour les fichiers du projet.' },
        { q: 'À quoi sert `#ifndef OUTILS_H / #define OUTILS_H / #endif` ?', choices: ['À optimiser le code', 'À éviter qu\'un en-tête soit inclus deux fois', 'À définir main', 'À compiler plus vite'], answer: 1, explain: 'C\'est une garde d\'inclusion.' },
      ],
      resume: [
        '.h = déclarations ; .c = définitions.',
        '`#include "projet.h"` vs `#include <standard.h>`.',
        'Garde d\'inclusion : #ifndef / #define / #endif.',
        'Compiler tous les .c ensemble.',
      ],
    },
  ],
  challenges: [
    ex({
      id: 'w9-c1', mode: 'write', kind: 'challenge', title: 'Projet 5-6 : gestionnaire d\'étudiants',
      prompt: 'Le fichier `etudiants.txt` contient des lignes `nom note1 note2 note3`. Charge-les dans un tableau de structures (nom, moyenne). Affiche le classement par moyenne décroissante au format `1. Nom 15.33` (2 décimales), puis écris dans `bulletin.txt` une ligne `Nom : moyenne` pour chaque étudiant, dans l\'ordre du classement.',
      solution: t`
        #include <stdio.h>

        typedef struct {
            char nom[30];
            double moyenne;
        } Etudiant;

        int main(void)
        {
            FILE *f = fopen("etudiants.txt", "r");
            if (f == NULL) {
                printf("Fichier introuvable\n");
                return 1;
            }
            Etudiant e[50];
            int n = 0;
            int a, b, c;
            while (n < 50 && fscanf(f, "%29s %d %d %d", e[n].nom, &a, &b, &c) == 4) {
                e[n].moyenne = (a + b + c) / 3.0;
                n++;
            }
            fclose(f);
            for (int i = 0; i < n - 1; i++) {
                for (int k = 0; k < n - 1 - i; k++) {
                    if (e[k].moyenne < e[k + 1].moyenne) {
                        Etudiant tmp = e[k];
                        e[k] = e[k + 1];
                        e[k + 1] = tmp;
                    }
                }
            }
            FILE *out = fopen("bulletin.txt", "w");
            if (out == NULL) {
                return 1;
            }
            for (int i = 0; i < n; i++) {
                printf("%d. %s %.2f\n", i + 1, e[i].nom, e[i].moyenne);
                fprintf(out, "%s : %.2f\n", e[i].nom, e[i].moyenne);
            }
            fclose(out);
            return 0;
        }
      `,
      tests: [
        { files: { 'etudiants.txt': 'Ali 12 14 13\nMariem 18 16 17\nSidi 9 11 10\n' }, expectFiles: true },
        { files: { 'etudiants.txt': 'Solo 20 20 19\n' }, expectFiles: true, hidden: true },
      ],
      hints: ['fscanf avec 4 valeurs : %29s %d %d %d.', 'Trie le tableau de structures, puis écris l\'affichage et le fichier dans la même boucle.'],
    }),
  ],
  boss: {
    id: 'boss-w9',
    name: 'L\'Archiviste Corrompu',
    avatar: 'archiviste',
    taunt: 'Tu as oublié fclose ? Tu n\'as pas testé NULL ? Alors tes archives m\'appartiennent !',
    defeat: 'Fichiers ouverts, testés, fermés… La Bibliothèque est de nouveau en ordre.',
    timeLimit: 1140,
    phases: [
      ex({
        id: 'boss-w9-p1', mode: 'predict', title: 'Phase 1 : la fiche copiée',
        prompt: 'Que va afficher ce programme ?',
        code: t`
          #include <stdio.h>

          typedef struct {
              int pv;
              int force;
          } Heros;

          void soigner(Heros h)
          {
              h.pv = 100;
              printf("[%d] ", h.pv);
          }

          void entrainer(Heros *h)
          {
              h->force += 5;
          }

          int main(void)
          {
              Heros a = {40, 10};
              Heros b = a;
              soigner(a);
              entrainer(&b);
              printf("%d %d %d %d\n", a.pv, a.force, b.pv, b.force);
              return 0;
          }
        `,
        choices: ['[100] 40 10 40 15', '[100] 100 10 40 15', '[100] 40 15 40 15', '[40] 40 10 40 15'],
        hints: ['soigner reçoit une copie.', 'b est une copie indépendante de a.'],
      }),
      ex({
        id: 'boss-w9-p2', mode: 'bug', title: 'Phase 2 : le journal effacé',
        prompt: 'Ce programme doit **ajouter** une ligne au journal `journal.txt` sans effacer l\'existant, puis afficher le nombre de lignes. Avec le fichier fourni (2 lignes), il doit afficher `3 lignes`. Corrige-le.',
        starter: t`
          #include <stdio.h>

          int main(void)
          {
              FILE *f = fopen("journal.txt", "w");
              fprintf(f, "Nouvelle entree\n");

              FILE *g = fopen("journal.txt", "r");
              char ligne[100];
              int n = 0;
              while (fgets(ligne, sizeof ligne, g) != NULL) {
                  n++;
              }
              fclose(g);
              printf("%d lignes\n", n);
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              FILE *f = fopen("journal.txt", "a");
              if (f == NULL) {
                  return 1;
              }
              fprintf(f, "Nouvelle entree\n");
              fclose(f);

              FILE *g = fopen("journal.txt", "r");
              if (g == NULL) {
                  return 1;
              }
              char ligne[100];
              int n = 0;
              while (fgets(ligne, sizeof ligne, g) != NULL) {
                  n++;
              }
              fclose(g);
              printf("%d lignes\n", n);
              return 0;
          }
        `,
        tests: [{ files: { 'journal.txt': 'lundi\nmardi\n' } }, { files: { 'journal.txt': '' }, hidden: true }],
        hints: ['Quel mode ajoute à la fin au lieu d\'écraser ?', 'Il faut fermer le fichier après l\'écriture, avant de le relire.', 'Teste les fopen.'],
      }),
      ex({
        id: 'boss-w9-p3', mode: 'write', title: 'Phase 3 : l\'inventaire',
        prompt: 'Le fichier `stock.txt` contient des lignes `article quantite prix` (prix réel). Lis-le dans un tableau de structures. Affiche la valeur totale du stock (`Valeur totale : <2 decimales>`), puis les articles dont la quantité est < 5 au format `A commander : <article> (<quantite>)`. Si le fichier manque : `Stock introuvable`.',
        solution: t`
          #include <stdio.h>

          typedef struct {
              char nom[30];
              int quantite;
              double prix;
          } Article;

          int main(void)
          {
              FILE *f = fopen("stock.txt", "r");
              if (f == NULL) {
                  printf("Stock introuvable\n");
                  return 1;
              }
              Article a[100];
              int n = 0;
              while (n < 100 && fscanf(f, "%29s %d %lf", a[n].nom, &a[n].quantite, &a[n].prix) == 3) {
                  n++;
              }
              fclose(f);
              double total = 0;
              for (int i = 0; i < n; i++) {
                  total += a[i].quantite * a[i].prix;
              }
              printf("Valeur totale : %.2f\n", total);
              for (int i = 0; i < n; i++) {
                  if (a[i].quantite < 5) {
                      printf("A commander : %s (%d)\n", a[i].nom, a[i].quantite);
                  }
              }
              return 0;
          }
        `,
        tests: [{ files: { 'stock.txt': 'clavier 12 15.5\nsouris 3 9.99\necran 2 149.0\n' } }, { files: {} }, { files: { 'stock.txt': 'cable 50 2.5\n' }, hidden: true }],
        hints: ['fscanf(f, "%29s %d %lf", ...) == 3.', 'Valeur totale : somme des quantite × prix.'],
      }),
    ],
  },
};
