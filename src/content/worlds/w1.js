import { t, ex } from '../helpers.js';

export default {
  id: 'w1',
  num: 1,
  title: 'Les Fondations',
  subtitle: 'Le squelette d\'un programme C, printf et les premiers messages du compilateur',
  color: '#22d3ee',
  icon: '🏛️',
  intro: t`
    Bienvenue dans l'Académie, jeune codeur. Le Glitch a brisé les fondations du Royaume du Code :
    plus aucun programme ne compile ! Ta première quête : apprendre la structure d'un programme C
    et faire parler la console. Chaque monde se termine par un gardien… prépare-toi.
  `,
  lessons: [
    // ------------------------------------------------------------------
    {
      id: 'w1l1',
      title: 'Qu\'est-ce que le langage C ?',
      topic: 'syntax',
      skills: ['syntax'],
      objectif: 'Comprendre ce qu\'est le C, comment un programme devient exécutable, et écrire le squelette minimal d\'un programme.',
      explication: t`
        Le **C** est un langage de programmation créé en 1972 pour écrire le système Unix. Il est encore partout :
        Linux, Windows, les microcontrôleurs, les moteurs de jeux, Python lui-même est écrit en C !

        Un ordinateur ne comprend pas le C directement. Il faut un **compilateur** (comme \`gcc\`) qui traduit
        ton texte (le **code source**, un fichier \`.c\`) en langage machine (un **exécutable**).

        Le cycle de travail est toujours le même : **écrire → compiler → exécuter → corriger**.

        Tout programme C possède un **squelette obligatoire** : une ligne \`#include\` pour emprunter des outils,
        et une fonction \`main\`, la porte d'entrée du programme. L'exécution commence **toujours** au début de \`main\`.
      `,
      syntaxe: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              // tes instructions ici
              return 0;
          }
        `,
        note: 'Ce squelette se tape « les yeux fermés ». Dans C Quest, le bouton ▶ Exécuter joue le rôle de gcc puis lance le programme.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              printf("Je programme en C.\n");
              return 0;
          }
        `,
        lines: {
          1: '`#include <stdio.h>` : « j\'emprunte la boîte à outils d\'affichage » (standard input/output). Pas de `;` : c\'est une directive.',
          3: '`int main(void)` : la fonction principale. `int` = elle renvoie un entier ; `(void)` = elle ne reçoit rien.',
          4: '`{` ouvre le bloc de main.',
          5: '`printf(...)` affiche le texte entre guillemets ; `\\n` passe à la ligne ; `;` termine l\'instruction.',
          6: '`return 0;` : « tout s\'est bien passé » (0 = succès).',
          7: '`}` ferme le bloc de main.',
        },
      },
      visualisation: { kind: 'trace', note: 'Observe : l\'exécution commence à la première ligne de main, exécute printf, puis return termine le programme.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void);
          {
              printf("Bonjour\n");
              return 0;
          }
        `,
        explication: 'Le « ; » après `int main(void)` transforme le début de la fonction en simple annonce (déclaration). L\'accolade `{` qui suit n\'appartient alors à rien : le compilateur refuse.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              printf("Bonjour\n");
              return 0;
          }
        `,
      },
      python: { py: 'print("Bonjour")', c: '#include <stdio.h>\n\nint main(void)\n{\n    printf("Bonjour\\n");\n    return 0;\n}', note: 'En Python, une seule ligne suffit. En C, le squelette est obligatoire : c\'est le prix de la rapidité et du contrôle.' },
      guide: ex({
        id: 'w1l1-guide',
        mode: 'complete',
        title: 'Complète le squelette',
        prompt: 'Complète les trous pour obtenir un programme qui affiche `Bienvenue a l\'Academie`.',
        template: t`
          #include <⟦⟧>

          int ⟦⟧(void)
          {
              printf("Bienvenue a l'Academie\n");
              return ⟦⟧;
          }
        `,
        blanks: [{ answer: 'stdio.h', width: 8 }, { answer: 'main', width: 5 }, { answer: '0', width: 2 }],
        hints: [
          'Le fichier d\'en-tête qui contient printf s\'appelle « standard input output » en abrégé, avec l\'extension .h.',
          'La fonction principale porte toujours le même nom : celui par lequel le programme commence.',
          'La valeur renvoyée pour dire « succès » est le plus petit entier positif ou nul.',
        ],
      }),
      mission: ex({
        id: 'w1l1-mission',
        mode: 'write',
        title: 'Ton premier programme',
        prompt: 'Écris un programme complet qui affiche exactement :\n```\nBonjour\nC est strict\n```\nÉcris tout toi-même : #include, main, accolades, return.',
        starter: '',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              printf("Bonjour\n");
              printf("C est strict\n");
              return 0;
          }
        `,
        require: [{ pattern: '\\bmain\\s*\\(', message: 'Le programme doit contenir la fonction main.' }],
        hints: [
          'Le squelette a 4 éléments : #include <stdio.h>, int main(void), les accolades { }, return 0;',
          'Deux lignes à afficher : deux printf, chacun avec \\n à la fin du texte.',
          'Vérifie chaque fin d\'instruction : printf(...) et return 0 se terminent par ;',
        ],
      }),
      quiz: [
        { q: 'Par quelle fonction commence l\'exécution de tout programme C ?', choices: ['start', 'main', 'printf', 'begin'], answer: 1, explain: 'Le système lance toujours la fonction main.' },
        { q: 'À quoi sert `#include <stdio.h>` ?', choices: ['À démarrer le programme', 'À donner accès à printf et scanf', 'À déclarer une variable', 'À terminer le programme'], answer: 1, explain: 'stdio.h contient les fonctions d\'entrée/sortie standard comme printf.' },
        { q: 'Que signifie `return 0;` à la fin de main ?', choices: ['Le programme a échoué', 'Afficher 0', 'Le programme s\'est bien terminé', 'Recommencer main'], answer: 2, explain: '0 signifie succès.' },
        { q: 'Que fait un compilateur ?', choices: ['Il exécute le code ligne par ligne', 'Il traduit le code source en programme exécutable', 'Il corrige automatiquement les fautes', 'Il dessine l\'interface'], answer: 1, explain: 'gcc traduit le fichier .c en langage machine.' },
      ],
      resume: [
        'Le C se compile : code source .c → compilateur (gcc) → exécutable.',
        'Squelette : `#include <stdio.h>`, `int main(void) { ... return 0; }`.',
        'Pas de `;` après `#include` ni après `int main(void)`.',
        'L\'exécution commence toujours au début de main.',
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'w1l2',
      title: 'Afficher un message avec printf()',
      topic: 'syntax',
      skills: ['syntax'],
      objectif: 'Afficher du texte avec printf, maîtriser le retour à la ligne \\n et quelques caractères spéciaux.',
      explication: t`
        \`printf()\` permet d'afficher du texte ou des valeurs dans la console. Le texte à afficher s'écrit entre
        **guillemets doubles** \`"..."\` : on appelle cela une **chaîne de caractères**.

        Attention : \`printf\` **ne va pas à la ligne tout seul**. Pour passer à la ligne, on écrit \`\n\`
        à l'endroit voulu dans la chaîne. Plusieurs \`printf\` sans \`\n\` se collent sur la même ligne.

        Quelques **séquences d'échappement** utiles : \`\n\` (nouvelle ligne), \`\t\` (tabulation),
        \`\\\` (un antislash), \`\"\` (un guillemet dans le texte), \`%%\` (le symbole %).
      `,
      syntaxe: {
        code: t`
          printf("texte a afficher\n");
        `,
        note: 'printf + parenthèses + guillemets doubles + \\n éventuel + point-virgule.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              printf("Hello, World!\n");
              printf("Ligne 1 ");
              printf("suite de la ligne 1\n");
              printf("Prix :\t100%%\n");
              printf("Il a dit \"Salut\"\n");
              return 0;
          }
        `,
        lines: {
          5: 'Le grand classique : chaque programmeur commence par lui. `\\n` termine la ligne.',
          6: 'Pas de `\\n` : la console reste sur la même ligne…',
          7: '… donc ce texte se colle au précédent, puis `\\n` passe à la ligne.',
          8: '`\\t` insère une tabulation, `%%` affiche le symbole %.',
          9: '`\\"` affiche un guillemet sans fermer la chaîne.',
        },
      },
      visualisation: { kind: 'trace', note: 'Regarde la console se remplir : sans \\n, le curseur reste sur la même ligne.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              printf('Bonjour');
              return 0;
          }
        `,
        explication: 'Les apostrophes `\' \'` servent pour UN seul caractère (comme `\'A\'`). Un texte s\'écrit toujours entre guillemets doubles. Ici le compilateur voit un « caractère » de 7 lettres, puis un entier là où printf attend un texte.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              printf("Bonjour\n");
              return 0;
          }
        `,
      },
      python: { py: 'print("Bonjour")\nprint("A", end="")', c: 'printf("Bonjour\\n");\nprintf("A");', note: 'print de Python va à la ligne automatiquement ; printf jamais : c\'est toi qui décides avec \\n.' },
      guide: ex({
        id: 'w1l2-guide',
        mode: 'predict',
        title: 'Le \\n invisible',
        prompt: 'Que va afficher ce programme ? Écris la sortie exacte **avant** de l\'exécuter.',
        code: t`
          #include <stdio.h>

          int main(void)
          {
              printf("Mot");
              printf("de");
              printf("passe\n");
              printf("OK\n");
              return 0;
          }
        `,
        hints: ['Seuls les printf qui contiennent \\n terminent une ligne.', 'Les trois premiers printf forment une seule ligne.'],
      }),
      mission: ex({
        id: 'w1l2-mission',
        mode: 'write',
        title: 'Présente-toi',
        prompt: 'Modifie le programme pour afficher **ton prénom** sur la première ligne et `J\'apprends le langage C` sur la deuxième ligne.',
        starter: t`
          #include <stdio.h>

          int main(void)
          {
              printf("Bonjour !");
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              printf("Zakomi\n");
              printf("J'apprends le langage C\n");
              return 0;
          }
        `,
        tests: [{ name: 'Deux lignes : prénom puis phrase', match: "^[^\\n]*\\S[^\\n]*\\nJ'apprends le langage C$", matchLabel: "Ton prénom\nJ'apprends le langage C" }],
        hints: [
          'Il faut deux lignes : pense au \\n à la fin de la première.',
          'Remplace « Bonjour ! » par ton prénom, puis ajoute un deuxième printf.',
          'L\'apostrophe de J\'apprends s\'écrit normalement dans des guillemets doubles : "J\'apprends le langage C\\n".',
        ],
      }),
      quiz: [
        { q: 'Que fait `\\n` dans une chaîne de printf ?', choices: ['Affiche la lettre n', 'Passe à la ligne suivante', 'Termine le programme', 'Efface l\'écran'], answer: 1, explain: '\\n est le caractère « nouvelle ligne ».' },
        { q: 'Quel code affiche `Salut` correctement ?', choices: ["printf('Salut');", 'printf("Salut");', 'printf(Salut);', 'Printf("Salut");'], answer: 1, explain: 'Guillemets doubles, printf en minuscules, et ; final.' },
        { q: 'Comment afficher le symbole % avec printf ?', choices: ['%', '\\%', '%%', '"%"'], answer: 2, explain: 'Dans printf, % introduit un format : on le double pour l\'afficher.' },
        { q: 'Que produit `printf("A"); printf("B\\n");` ?', choices: ['A puis B sur deux lignes', 'AB sur une ligne', 'A B', 'Une erreur'], answer: 1, explain: 'Pas de \\n après A : B se colle à A.' },
      ],
      resume: [
        '`printf("...");` affiche le texte entre guillemets doubles.',
        'printf ne va jamais à la ligne seul : ajoute `\\n`.',
        '`\\t` tabulation, `\\"` guillemet, `%%` pourcentage.',
        'Apostrophes = un seul caractère, guillemets = texte.',
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'w1l3',
      title: 'Instructions, point-virgule et accolades',
      topic: 'syntax',
      skills: ['syntax', 'debug'],
      objectif: 'Savoir où mettre (et ne pas mettre) le point-virgule, et organiser le code en blocs avec les accolades et l\'indentation.',
      explication: t`
        Une **instruction** est un ordre donné au programme : afficher, calculer, renvoyer… En C,
        **chaque instruction se termine par un point-virgule** \`;\`. Le retour à la ligne ne compte pas :
        pour le compilateur, \`printf("a"); printf("b");\` sur une seule ligne est parfaitement valide.

        Les **accolades** \`{ }\` regroupent plusieurs instructions en un **bloc**. Le corps de \`main\` est un bloc.
        Chaque \`{\` doit avoir sa \`}\`.

        Pas de \`;\` après : une directive \`#include\`, l'en-tête \`int main(void)\`, une accolade \`}\` de fonction.

        L'**indentation** (les 4 espaces au début des lignes) n'est pas obligatoire pour le compilateur,
        mais indispensable pour **toi** : elle montre visuellement à quel bloc appartient chaque ligne.
      `,
      syntaxe: {
        code: t`
          int main(void)        // pas de ;
          {                     // début du bloc
              instruction1;     // ; obligatoire
              instruction2;
          }                     // fin du bloc
        `,
        note: 'Règle d\'or : une instruction = un « ; ». Un bloc = une paire { }.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              printf("Instruction 1\n");
              printf("Instruction 2\n"); printf("Instruction 3\n");
              {
                  printf("Dans un bloc interne\n");
              }
              return 0;
          }
        `,
        lines: {
          5: 'Une instruction, terminée par `;`.',
          6: 'Deux instructions sur la même ligne : autorisé (mais moins lisible).',
          7: 'Un bloc interne : les accolades regroupent des instructions.',
          9: 'Chaque `{` a sa `}`. L\'indentation montre l\'imbrication.',
        },
      },
      visualisation: { kind: 'trace', note: 'Les instructions s\'exécutent dans l\'ordre, de haut en bas, une par une.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              printf("Bonjour\n")
              return 0;
          }
        `,
        explication: 'Le « ; » manque après le printf de la ligne 5. Le compilateur ne s\'en rend compte qu\'en lisant le mot suivant (`return`) : c\'est pourquoi il faut toujours regarder **la ligne indiquée ET celle d\'avant**.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              printf("Bonjour\n");
              return 0;
          }
        `,
      },
      python: { py: 'if True:\n    print("bloc")', c: 'if (1)\n{\n    printf("bloc\\n");\n}', note: 'Python délimite les blocs par l\'indentation. Le C utilise { } : l\'indentation est seulement pour les humains.' },
      guide: ex({
        id: 'w1l3-guide',
        mode: 'bug',
        title: 'Les points-virgules perdus',
        prompt: 'Ce programme ne compile pas : il manque des points-virgules et il y en a un en trop. Corrige-le pour qu\'il affiche le menu.',
        starter: t`
          #include <stdio.h>

          int main(void)
          {
              printf("=== MENU ===\n")
              printf("1. Jouer\n");
              printf("2. Quitter\n")
              return 0;
          };
        `,
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              printf("=== MENU ===\n");
              printf("1. Jouer\n");
              printf("2. Quitter\n");
              return 0;
          }
        `,
        hints: [
          'Lis la première erreur : quelle ligne le compilateur indique-t-il ? Regarde aussi celle d\'avant.',
          'Deux printf n\'ont pas de ; final.',
          'Le ; après la dernière } est inutile (le compilateur peut le tolérer, mais retire-le).',
        ],
      }),
      mission: ex({
        id: 'w1l3-mission',
        mode: 'order',
        title: 'Remets le programme en ordre',
        prompt: 'Les lignes de ce programme ont été mélangées par le Glitch. Remets-les dans l\'ordre pour qu\'il affiche :\n```\nNiveau 1\nNiveau 2\n```',
        lines: [
          '#include <stdio.h>',
          'int main(void)',
          '{',
          '    printf("Niveau 1\\n");',
          '    printf("Niveau 2\\n");',
          '    return 0;',
          '}',
        ],
        hints: ['La directive #include est toujours tout en haut.', 'L\'en-tête de main vient avant l\'accolade ouvrante.', 'return 0; est la dernière instruction avant la }.'],
      }),
      quiz: [
        { q: 'Laquelle de ces lignes est correcte ?', choices: ['#include <stdio.h>;', 'int main(void);', 'printf("ok\\n");', 'return 0'], answer: 2, explain: 'Une instruction se termine par ; mais pas une directive ni l\'en-tête de main.' },
        { q: 'GCC signale « expected \';\' before \'return\' » à la ligne 6. Où est probablement l\'erreur ?', choices: ['Ligne 6 uniquement', 'Fin de la ligne 5', 'Ligne 1', 'Dans return'], answer: 1, explain: 'Le ; oublié est souvent sur la ligne précédente.' },
        { q: 'L\'indentation est-elle obligatoire en C ?', choices: ['Oui, sinon erreur', 'Non, mais elle rend le code lisible', 'Seulement dans main', 'Seulement avec printf'], answer: 1, explain: 'Le compilateur l\'ignore ; les humains en ont besoin.' },
      ],
      resume: [
        'Chaque instruction se termine par `;`.',
        'Pas de `;` après `#include`, `int main(void)` ou la `}` d\'une fonction.',
        'Les `{ }` forment des blocs ; chaque `{` a sa `}`.',
        'Un `;` oublié est souvent signalé à la ligne suivante.',
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'w1l4',
      title: 'Les commentaires',
      topic: 'syntax',
      skills: ['syntax'],
      objectif: 'Écrire des commentaires sur une ligne (//) et sur plusieurs lignes (/* ... */) pour expliquer son code.',
      explication: t`
        Un **commentaire** est un texte ignoré par le compilateur. Il sert à expliquer le code aux humains
        (à toi dans trois semaines, ou à tes camarades).

        - \`//\` commente **jusqu'à la fin de la ligne**.
        - \`/* ... */\` commente **tout ce qui est entre** \`/*\` et \`*/\`, même sur plusieurs lignes.

        Un bon commentaire explique **pourquoi**, pas ce qui est évident. \`x = x + 1; // ajoute 1\` est inutile ;
        \`// on compte la case de départ\` est utile.

        Astuce de débogage : on peut « désactiver » une ligne en la mettant en commentaire.
      `,
      syntaxe: {
        code: t`
          // commentaire sur une ligne

          /* commentaire
             sur plusieurs lignes */
        `,
        note: 'Un commentaire /* ... */ ne peut pas en contenir un autre : le premier */ le ferme.',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          /* Programme : carte de visite
             Auteur : un apprenti de l'Academie */
          int main(void)
          {
              // En-tete de la carte
              printf("*** Carte ***\n");
              printf("Nom : Syntaxe\n"); // le mentor
              // printf("Ligne desactivee\n");
              return 0;
          }
        `,
        lines: {
          3: '`/*` ouvre un commentaire de plusieurs lignes…',
          4: '… fermé par `*/`. Tout est ignoré par le compilateur.',
          7: '`//` : le reste de la ligne est un commentaire.',
          9: 'Un commentaire peut suivre une instruction sur la même ligne.',
          10: 'Ligne « désactivée » : elle ne s\'exécute pas.',
        },
      },
      visualisation: { kind: 'trace', note: 'Remarque : les lignes de commentaires ne sont jamais « exécutées » — le surlignage les saute.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              /* Affiche le score
              printf("Score : 10\n");
              return 0;
          }
        `,
        explication: 'Le commentaire `/*` n\'est jamais fermé par `*/` : tout le reste du fichier devient un commentaire, y compris l\'accolade finale et return.',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              /* Affiche le score */
              printf("Score : 10\n");
              return 0;
          }
        `,
      },
      python: { py: '# commentaire\n"""\nplusieurs lignes\n"""', c: '// commentaire\n/*\nplusieurs lignes\n*/', note: 'Le # de Python devient // en C.' },
      guide: ex({
        id: 'w1l4-guide',
        mode: 'complete',
        title: 'Commente correctement',
        prompt: 'Complète les symboles de commentaires pour que le programme compile et affiche seulement `Visible`.',
        template: t`
          #include <stdio.h>

          int main(void)
          {
              ⟦⟧ ce texte est un commentaire sur une ligne
              ⟦⟧ celui-ci tient
                 sur deux lignes ⟦⟧
              printf("Visible\n");
              return 0;
          }
        `,
        blanks: [{ answer: '//', width: 3 }, { answer: '/*', width: 3 }, { answer: '*/', width: 3 }],
        hints: ['Le commentaire d\'une ligne commence par deux barres obliques.', 'Le commentaire multi-lignes s\'ouvre avec /* et se ferme avec l\'inverse.'],
      }),
      mission: ex({
        id: 'w1l4-mission',
        mode: 'write',
        title: 'Ticket documenté',
        prompt: 'Écris un programme qui affiche exactement :\n```\n+--------------+\n| CINEMA ATLAS |\n+--------------+\n```\nAjoute un commentaire multi-lignes `/* ... */` en haut (nom du programme) et au moins un commentaire `//`.',
        starter: '',
        solution: t`
          #include <stdio.h>

          /* Programme : ticket de cinema
             Auteur : moi */
          int main(void)
          {
              // bordure du haut
              printf("+--------------+\n");
              printf("| CINEMA ATLAS |\n");
              // bordure du bas
              printf("+--------------+\n");
              return 0;
          }
        `,
        require: [
          { pattern: '/\\*[\\s\\S]*?\\*/', message: 'Ajoute un commentaire multi-lignes /* ... */.', raw: true },
          { pattern: '//', message: 'Ajoute au moins un commentaire //.', raw: true },
        ],
        hints: ['Commence par le squelette, puis trois printf.', 'Les espaces à l\'intérieur des guillemets sont affichés tels quels : compte-les.', 'Place /* Programme : ... */ avant int main(void).'],
      }),
      quiz: [
        { q: 'Que fait le compilateur avec un commentaire ?', choices: ['Il l\'affiche', 'Il l\'ignore', 'Il l\'exécute', 'Il le corrige'], answer: 1, explain: 'Les commentaires sont pour les humains.' },
        { q: 'Quelle forme commente plusieurs lignes ?', choices: ['// ... //', '/* ... */', '# ... #', '<!-- -->'], answer: 1, explain: '/* ouvre, */ ferme.' },
        { q: 'Quel est le meilleur commentaire pour `total = total + note;` ?', choices: ['// total = total + note', '// ajoute', '// on cumule les notes pour calculer la moyenne', '/* */'], answer: 2, explain: 'Un bon commentaire explique l\'intention.' },
      ],
      resume: [
        '`//` commente jusqu\'à la fin de la ligne.',
        '`/* ... */` commente un bloc, il faut fermer avec `*/`.',
        'Le compilateur ignore les commentaires.',
        'Commente le « pourquoi », pas l\'évident.',
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'w1l5',
      title: 'Lire les erreurs du compilateur',
      topic: 'debug',
      skills: ['debug'],
      objectif: 'Distinguer erreurs de compilation, d\'exécution et de logique, et corriger méthodiquement à partir des messages.',
      explication: t`
        Savoir **lire une erreur** est la compétence qui fait gagner le plus de temps. Il existe trois familles :

        - **Erreur de compilation** : le code ne respecte pas les règles du C (\`;\` oublié, mot mal écrit). Aucun programme n'est créé.
        - **Erreur d'exécution** : le programme compile, mais plante pendant qu'il tourne (division par zéro…).
        - **Erreur de logique** : tout fonctionne… mais le résultat est faux (\`*\` au lieu de \`+\`). Le compilateur ne peut pas deviner ton intention !

        Il y a aussi les **avertissements** (warnings) : le code compile, mais quelque chose est suspect. **Traite chaque warning comme une erreur.**

        Un message de gcc ressemble à \`hello.c:5:24: error: expected ';' before 'return'\` :
        fichier, **ligne**, colonne, type, explication. Dans C Quest, Bug Hunter le traduit pour toi.

        **Méthode** : 1) lis la **première** erreur seulement, 2) va à sa ligne **et** à celle d'avant, 3) corrige, 4) recompile.
      `,
      syntaxe: {
        code: t`
          fichier.c:ligne:colonne: error: explication
          fichier.c:ligne:colonne: warning: explication
        `,
        note: 'error = bloquant ; warning = avertissement (à corriger aussi).',
      },
      exemple: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              printf("2 + 3 = %d\n", 2 * 3);
              return 0;
          }
        `,
        lines: {
          5: 'Ce programme compile et s\'exécute… mais affiche 6 : c\'est une **erreur de logique**. Le compilateur ne peut pas savoir que tu voulais une addition.',
        },
      },
      visualisation: { kind: 'trace', note: 'Le programme tourne sans erreur… et donne un résultat faux. Seul un test le révèle.' },
      erreur: {
        code: t`
          #include <stdio.h>

          int main(void)
          {
              Printf("Salut\n");
              return 0;
          }
        `,
        explication: 'Le C distingue majuscules et minuscules : `Printf` n\'est pas `printf`. Le compilateur ne connaît aucune fonction « Printf ».',
        correction: t`
          #include <stdio.h>

          int main(void)
          {
              printf("Salut\n");
              return 0;
          }
        `,
      },
      python: { py: 'print("a")\nNameError à l\'exécution', c: 'printf("a");\nerreur détectée à la compilation', note: 'Beaucoup d\'erreurs que Python découvre en cours d\'exécution sont détectées par le compilateur C AVANT de lancer le programme. C\'est une chance !' },
      guide: ex({
        id: 'w1l5-guide',
        mode: 'bug',
        title: 'Trois erreurs, une méthode',
        prompt: 'Trouve et corrige les **3 erreurs** de ce programme. Corrige la première, exécute, lis le message suivant… Il doit afficher `Salut` puis `Encore`.',
        starter: t`
          #include <stdio.h>

          int main(void)
          {
              Printf("Salut\n");
              printf("Encore\n")
              return 0;
        `,
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              printf("Salut\n");
              printf("Encore\n");
              return 0;
          }
        `,
        hints: ['Une erreur de majuscule.', 'Un point-virgule manquant.', 'Une accolade fermante oubliée tout à la fin.'],
      }),
      mission: ex({
        id: 'w1l5-mission',
        mode: 'bug',
        title: 'Chasse aux erreurs : le restaurant',
        prompt: 'Ce programme contient des erreurs de compilation **et** une erreur de logique. Corrige-le pour qu\'il affiche exactement :\n```\nMenu du restaurant\n1. Pizza\n2. Burger\n3. Salade\n```',
        starter: t`
          #include <stdio.h>;

          int main(void)
          {
              printf("Menu du restaurant\n");
              printf('1. Pizza\n');
              printf("2. Burger\n")
              printf("3. Salade");
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              printf("Menu du restaurant\n");
              printf("1. Pizza\n");
              printf("2. Burger\n");
              printf("3. Salade\n");
              return 0;
          }
        `,
        hints: [
          'Commence par l\'avertissement de la ligne 1 : une directive se termine-t-elle par ; ?',
          'Ligne 6 : quelle sorte de guillemets faut-il pour un texte ?',
          'Une fois que tout compile, compare ta sortie à l\'attendue : il manque peut-être un \\n.',
        ],
      }),
      quiz: [
        { q: 'Le programme affiche une moyenne de 17 au lieu de 12. Quel type d\'erreur ?', choices: ['Compilation', 'Exécution', 'Logique', 'Warning'], answer: 2, explain: 'Il fonctionne mais le résultat est faux.' },
        { q: 'GCC affiche `\'note\' undeclared`. Quel type d\'erreur ?', choices: ['Compilation', 'Exécution', 'Logique', 'Aucune'], answer: 0, explain: 'Détectée avant l\'exécution.' },
        { q: 'Le programme s\'arrête avec « Floating point exception ». Quel type ?', choices: ['Compilation', 'Exécution', 'Logique', 'Commentaire'], answer: 1, explain: 'Il plante pendant qu\'il tourne (division entière par zéro).' },
        { q: 'Plusieurs erreurs s\'affichent. Laquelle corriger d\'abord ?', choices: ['La dernière', 'La plus longue', 'La première', 'Aucune, recommencer'], answer: 2, explain: 'Les suivantes sont souvent des conséquences de la première.' },
      ],
      resume: [
        'Trois familles : compilation, exécution, logique (+ warnings).',
        'Format : `fichier:ligne:colonne: error/warning: message`.',
        'Corrige la première erreur d\'abord, regarde aussi la ligne précédente.',
        'Un programme qui compile n\'est pas forcément juste : teste-le.',
      ],
    },
  ],
  challenges: [
    ex({
      id: 'w1-c1', mode: 'write', kind: 'challenge', title: 'Annonce d\'aéroport',
      prompt: 'Affiche exactement :\n```\nVol AF 512\nDestination : Paris\nPorte : B12\n```',
      solution: t`
        #include <stdio.h>

        int main(void)
        {
            printf("Vol AF 512\n");
            printf("Destination : Paris\n");
            printf("Porte : B12\n");
            return 0;
        }
      `,
      hints: ['3 lignes → 3 printf, ou 1 seul avec 3 \\n.'],
    }),
    ex({
      id: 'w1-c2', mode: 'write', kind: 'challenge', title: 'Un seul printf',
      prompt: 'Affiche ce dessin avec **un seul** `printf` :\n```\n*\n**\n***\n```',
      solution: t`
        #include <stdio.h>

        int main(void)
        {
            printf("*\n**\n***\n");
            return 0;
        }
      `,
      require: [{ pattern: '^(?![\\s\\S]*printf[\\s\\S]*printf)[\\s\\S]*printf', message: 'Utilise un seul printf.' }],
      hints: ['Un \\n peut apparaître plusieurs fois dans la même chaîne.'],
    }),
  ],
  boss: {
    id: 'boss-w1',
    name: 'Le Point-Virgule Fantôme',
    avatar: 'semicolon',
    taunt: 'Hé hé… J\'ai volé tous les points-virgules du royaume. Sans moi, plus rien ne compile !',
    defeat: 'Nooon… mes points-virgules… Tu sais maintenant les remettre à leur place.',
    timeLimit: 600,
    phases: [
      ex({
        id: 'boss-w1-p1', mode: 'predict', title: 'Phase 1 : la prédiction du fantôme',
        prompt: 'Le fantôme te défie : que va afficher ce programme ?',
        code: t`
          #include <stdio.h>

          int main(void)
          {
              printf("Bou");
              printf("h !\n");
              printf("\tFantome\n");
              return 0;
          }
        `,
        choices: ['Bou\nh !\n\tFantome', 'Bouh !\n\tFantome', 'Bouh !\nFantome', 'Bou h !\tFantome'],
        hints: ['Le premier printf n\'a pas de \\n.'],
      }),
      ex({
        id: 'boss-w1-p2', mode: 'bug', title: 'Phase 2 : le programme hanté',
        prompt: 'Le fantôme a saboté ce programme. Répare-le pour qu\'il affiche :\n```\nJe suis libre !\nMerci, heros.\n```',
        starter: t`
          #include <stdio.h>

          int main(void);
          {
              printf("Je suis libre !\n")
              Printf("Merci, heros.\n");
              return 0;
          }
        `,
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              printf("Je suis libre !\n");
              printf("Merci, heros.\n");
              return 0;
          }
        `,
        hints: ['Trois erreurs : un ; en trop, un ; manquant, une majuscule.'],
      }),
      ex({
        id: 'boss-w1-p3', mode: 'write', title: 'Phase 3 : le sapin final',
        prompt: 'Coup final : affiche ce sapin **exactement** (les espaces comptent) :\n```\n    *\n   ***\n  *****\n *******\n    |\n```',
        solution: t`
          #include <stdio.h>

          int main(void)
          {
              printf("    *\n");
              printf("   ***\n");
              printf("  *****\n");
              printf(" *******\n");
              printf("    |\n");
              return 0;
          }
        `,
        hints: ['Compte les espaces avant les étoiles : 4, 3, 2, 1, puis 4 pour le tronc.'],
      }),
    ],
  },
};
