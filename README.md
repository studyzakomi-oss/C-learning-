# C Quest — L'Académie du Code

Jeu éducatif (RPG) **en français** pour apprendre le langage C, du premier `printf()` jusqu'à la mémoire
dynamique et aux programmes en plusieurs fichiers. Il fonctionne sur téléphone et tablette Android,
**hors-ligne**, sans compte et sans serveur.

- **10 mondes, 43 leçons** au format imposé en 10 étapes (objectif, explication, syntaxe, exemple commenté,
  visualisation, erreur fréquente, exercice guidé, mission autonome, quiz, résumé).
- **134 exercices** répartis en 5 modes (A complète le code, B trouve le bug, C prédiction,
  D écris le programme, E remets les lignes en ordre), **10 combats de boss** (mode F, 30 phases),
  **18 défis** (dont les projets de la feuille de route : calculatrice, devine le nombre, gestionnaire de
  notes, gestionnaire d'étudiants, bibliothèque) et un **centre de révision** à répétition espacée (mode G).
- **Vraie compilation et exécution du C** sur l'appareil, par un interpréteur C99 écrit pour le jeu
  (voir plus bas), avec des messages d'erreur expliqués en français par le Professeur Syntaxe.

## Lancer le jeu

Prérequis : Node.js 20 ou plus.

```bash
npm install
npm run dev        # serveur de développement (http://localhost:5173)
npm run build      # version de production dans dist/
npm run preview    # sert dist/ (http://localhost:4173)
```

## Installer sur Android

### Option 1 — Application web installable (PWA), recommandé

1. Héberger le dossier `dist/` sur n'importe quel hébergement statique en HTTPS
   (GitHub Pages, Netlify, Cloudflare Pages… tous ont une offre gratuite suffisante).
2. Ouvrir l'adresse dans Chrome sur Android → menu ⋮ → **Installer l'application** (ou « Ajouter à l'écran d'accueil »).
3. Après le premier chargement, tout fonctionne hors-ligne (service worker qui met en cache le jeu entier).

Pour un test local sur le même Wi-Fi : `npm run build && npm run preview`, puis ouvrir
`http://<ip-du-pc>:4173` sur le téléphone (l'installation PWA exige HTTPS ; le jeu reste jouable en HTTP).

### Option 2 — APK natif avec Capacitor

Le projet Android est déjà généré dans `android/` (Capacitor 8, minSdk 24 = Android 7.0).

```bash
npm run android:sync        # construit dist/ puis le copie dans android/
npm run android:open        # ouvre le projet dans Android Studio → Run ▶ ou Build → Build APK
# ou en ligne de commande (avec le SDK Android installé) :
cd android && ./gradlew assembleDebug
# APK : android/app/build/outputs/apk/debug/app-debug.apk
```

Pour une version Play Store : `./gradlew bundleRelease` puis signer l'AAB avec ta clé
(Android Studio → Build → Generate Signed Bundle).

Compromis PWA / Capacitor : la PWA se met à jour toute seule et ne demande aucune installation de
SDK ; l'APK s'installe sans navigateur ni hébergement et peut être publié sur le Play Store. Les deux
utilisent exactement le même code et fonctionnent hors-ligne.

## Exécution du C : comment ça marche

Le jeu n'envoie jamais de code à un serveur. `src/engine/` contient un compilateur/interpréteur C99 :

- préprocesseur (`#include`, `#define` avec paramètres, `#if/#ifdef/#ifndef`, gardes d'inclusion),
  en-têtes standard virtuels (`stdio.h`, `stdlib.h`, `string.h`, `ctype.h`, `math.h`, `stdbool.h`,
  `limits.h`, `stdint.h`, `time.h`, `assert.h`…) ;
- analyse syntaxique et sémantique complètes (types, conversions, prototypes, `struct`/`union`/`enum`,
  `typedef`, pointeurs, pointeurs de fonction, tableaux à plusieurs dimensions, VLA, initialisations
  désignées, programmes en plusieurs fichiers `.c` + `.h`) ;
- avertissements équivalents à `gcc -Wall -Wextra` (formats `printf`/`scanf`, `=` dans une condition,
  `;` après `if`, `break` oublié, `return` manquant, variables inutilisées, comparaison signé/non signé…),
  avec en plus des conseils pédagogiques (division entière, `#define` terminé par `;`…) ;
- exécution sur une mémoire simulée et **vérifiée** (à la manière d'AddressSanitizer) : sortie de tableau,
  pointeur NULL ou non initialisé, utilisation après `free`, double `free`, modification d'une chaîne
  littérale, lecture d'une variable non initialisée, fuite mémoire, division par zéro, récursion infinie ;
- bibliothèque standard réimplémentée : `printf` avec arrondis **identiques à la glibc**, `scanf`,
  fichiers (disque virtuel), `malloc/calloc/realloc/free`, `qsort`, `rand/srand` **identiques à la glibc**…
- isolation : le programme tourne dans un **Web Worker**, avec limite de pas (30 millions), délai
  (5 s, puis arrêt forcé du worker à 9 s), taille de sortie et taille mémoire (8 Mo) limitées.

Fidélité : `npm run verify:gcc` compare le moteur à gcc sur le corpus `tests/c-corpus/`, et
`npm run verify:content` compile **tous** les programmes du jeu (exemples, corrections, solutions,
boss) avec le moteur **et** avec `gcc -std=c99 -Wall -Wextra -pedantic`, exécute chaque test et exige des
sorties identiques et zéro avertissement (469 programmes vérifiés).

Limites connues du moteur : pas de `goto` ni d'étiquettes, pas de champs de bits, pas de fonctions
variadiques écrites par l'utilisateur (`stdarg.h`), `long double` traité comme `double`, adresses
affichées par `%p` différentes de celles d'un vrai système, pas de threads ni de signaux. Ces notions ne
font pas partie du programme du jeu.

## Pédagogie et correction

- Chaque exercice est corrigé **en exécutant le programme** sur plusieurs entrées (dont des tests
  cachés) et en comparant sa sortie à celle de la solution de référence. Des mots-clés présents ne
  suffisent jamais ; des consignes (`require`/`forbid`) s'ajoutent aux tests quand l'énoncé l'exige
  (« utilise une boucle for », « n'utilise pas pow »…).
- Le tuteur distingue erreurs de compilation, d'exécution et de logique ; il désigne la ligne, pose
  d'abord une question, puis explique, puis donne une piste (une étape à la fois), avec une comparaison
  Python quand c'est utile.
- Progression par maîtrise : une leçon est validée par la mission autonome réussie + quiz ≥ 60 % ; le boss
  s'ouvre quand toutes les leçons du monde sont validées ; le monde suivant après la victoire.
  Le test de placement peut ouvrir directement jusqu'au Monde 6, les leçons précédentes restant accessibles.
- Adaptation : la maîtrise tient compte des essais, des indices, de la solution consultée, des révisions ;
  la vitesse ne compte presque pas. Les erreurs alimentent les « points faibles » et l'entraînement ciblé ;
  le chronomètre des boss est allongé quand la maîtrise du monde est encore fragile (et désactivable).
- Le premier indice de chaque exercice est gratuit, les suivants coûtent 5 pièces ; les explications des
  leçons et du tuteur sont toujours gratuites, et la solution expliquée se débloque après 3 essais.

## Sauvegarde

Locale (localStorage), automatique, sans compte. Tout est conservé : étape exacte de chaque leçon,
code en cours de chaque exercice, XP, niveau, pièces, maîtrise, cartes de révision, succès, inventaire,
réglages. Au redémarrage, le jeu rouvre la dernière leçon à la bonne étape. Réglages → Exporter / Importer
permet de transférer la progression vers un autre appareil.

## Tests

```bash
npm test                 # 205 tests Vitest : moteur vs gcc, diagnostics, erreurs d'exécution,
                         # progression, sauvegarde/reprise, correcteur, tuteur, et chaque exercice du jeu
npm run verify:content   # tout le contenu, moteur + gcc (nécessite gcc)
npm run verify:gcc       # corpus du moteur comparé à gcc (nécessite gcc)
npm run e2e              # Playwright : téléphone 390×844 et tablette 1280×800 — accueil, test de
                         # placement, leçon complète, tuteur, reprise après fermeture, tous les écrans
                         # sans débordement, labo, boucle infinie, hors-ligne, combat de boss, révision
```

## Organisation du code

```
src/engine/    interpréteur C (lexer, préprocesseur, parseur, compilateur, mémoire, stdlib, worker)
src/game/      règles du jeu (progression, store + sauvegarde, correcteur, tuteur) — sans interface
src/content/   contenu pédagogique (un fichier par monde), test de placement, boutique
src/ui/        interface Preact : écrans, éditeur CodeMirror, visualiseur mémoire, personnages SVG
scripts/       vérifications (gcc, contenu), tests e2e, génération des icônes et ressources Android
android/       projet Android natif (Capacitor)
```

## Coûts

Aucun. Pas de serveur, pas de service de compilation distant, pas d'API payante, pas de compte :
la compilation et l'exécution se font sur l'appareil. Seul un hébergement statique est nécessaire pour la
version PWA (gratuit chez GitHub Pages, Netlify ou Cloudflare Pages). Une publication sur le Play Store
coûte 25 USD une fois (frais d'inscription Google).

## Héberger sur un serveur Debian (Docker / CasaOS)

```bash
git clone <ce-depot> c-quest && cd c-quest
docker compose up -d --build      # le jeu est servi sur http://<ip-du-serveur>:8090
```

Mise à jour : `git pull && docker compose up -d --build`. Le jeu fonctionne dès le premier chargement ;
pour l'**installer** comme application et l'utiliser hors-ligne, le navigateur exige du HTTPS (voir
ci-dessous : Tailscale ou un nom de domaine avec Caddy / Nginx Proxy Manager).
