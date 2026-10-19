// Professeur Syntaxe : analyse les erreurs et guide le joueur pas à pas (question -> explication -> piste).
import { normalizeOutput } from './grader.js';

/** Thème (pour la révision ciblée) associé à chaque code d'erreur. */
export const CODE_TOPIC = {
  'missing-semicolon': 'syntax', 'missing-brace': 'syntax', 'brace-after-semicolon': 'syntax', 'extra-brace': 'syntax',
  'implicit-function': 'syntax', 'undeclared-header': 'syntax', 'include-extra': 'syntax', 'include-syntax': 'syntax',
  'unterminated-string': 'syntax', 'multichar': 'syntax', 'missing-paren': 'syntax', 'expected-expression': 'syntax',
  undeclared: 'syntax', redefinition: 'syntax', 'unknown-type': 'syntax',
  'printf-format': 'debug', 'scanf-format': 'debug', 'int-conversion': 'memory', 'incompatible-pointer': 'memory',
  'assign-in-cond': 'logic', 'empty-if': 'logic', 'empty-loop': 'logic', fallthrough: 'logic', 'missing-return': 'logic',
  'int-division': 'logic', 'div-zero': 'debug', 'out-of-bounds': 'memory', 'null-deref': 'memory', 'uninit-read': 'debug',
  'uninit-pointer': 'memory', 'use-after-free': 'memory', 'double-free': 'memory', timeout: 'logic', 'stack-overflow': 'algo',
  'array-assign': 'memory', 'str-compare': 'memory', 'sign-compare': 'debug', 'too-few-args': 'syntax', 'too-many-args': 'syntax',
  'conflicting-types': 'syntax', 'undefined-reference': 'syntax', 'no-main': 'syntax', 'mod-float': 'logic',
};

const PY = {
  'missing-semicolon': 'En Python, la fin de ligne termine l\'instruction. En C, c\'est le « ; » qui la termine : le retour à la ligne ne compte pas.',
  'implicit-function': 'En Python, print existe toujours. En C, printf vient de la bibliothèque <stdio.h> qu\'il faut inclure.',
  undeclared: 'En Python, x = 5 crée la variable. En C, il faut d\'abord la déclarer avec son type : int x = 5;',
  'missing-brace': 'Python utilise l\'indentation pour les blocs ; le C utilise les accolades { }. L\'indentation n\'est que décorative en C.',
  'printf-format': 'En Python, print(x) devine le type. En C, printf a besoin du bon code : %d (int), %f (double), %c (char), %s (chaîne).',
  'int-division': 'En Python 3, 7 / 2 donne 3.5. En C, 7 / 2 donne 3 (division entière) : il faut au moins un réel, 7.0 / 2.',
  'array-assign': 'En Python, nom = "Ali" fonctionne. En C, un tableau de char se remplit avec strcpy(nom, "Ali");',
  'str-compare': 'En Python, a == "oui" compare le texte. En C, == compare des adresses : utilise strcmp(a, "oui") == 0.',
  'assign-in-cond': 'Python refuse « if x = 5: ». Le C l\'accepte… et affecte 5 à x ! Pour comparer : ==.',
  'out-of-bounds': 'Python lève IndexError. En C, rien ne t\'arrête : dépasser un tableau écrase la mémoire voisine. C Quest le détecte pour toi.',
  'unknown-type': 'Python n\'a pas de déclaration de type. En C, les types de base sont int, double, char, float… (et bool avec <stdbool.h>).',
};

/** Fiches d'aide par code de diagnostic : question guide, pourquoi, piste. */
const RULES = {
  'missing-semicolon': {
    title: 'Point-virgule manquant',
    question: (d) => `Regarde la fin de la ligne ${d.line}. Par quel caractère se termine chaque instruction en C ?`,
    why: 'Le compilateur lit le programme comme une longue suite de mots. Sans « ; », il ne sait pas où l\'instruction s\'arrête et découvre le problème au mot suivant.',
    fix: (d) => `Ajoute « ; » à la fin de l'instruction de la ligne ${d.line}.`,
  },
  'implicit-function': {
    title: 'Fonction inconnue',
    question: (d) => (d.data?.header ? `D'où vient la fonction « ${d.data.name} » ? Quelle ligne doit apparaître tout en haut du programme ?` : `Compare lettre par lettre « ${d.data?.name} » avec le nom de la fonction que tu voulais appeler. Majuscules comprises !`),
    why: 'Le compilateur ne connaît une fonction que si elle a été déclarée avant : soit par un #include, soit par ton propre prototype.',
    fix: (d) => (d.data?.header ? `Ajoute « #include <${d.data.header}> » en première ligne.` : d.data?.suggestion ? `Remplace « ${d.data.name} » par « ${d.data.suggestion} ».` : 'Déclare la fonction (prototype) avant main.'),
  },
  'undeclared-header': {
    title: 'Nom inconnu',
    question: (d) => `« ${d.data?.name} » est défini dans une bibliothèque standard. Laquelle as-tu oublié d'inclure ?`,
    why: 'Les noms comme NULL, EOF, bool, INT_MAX sont définis dans des fichiers d\'en-tête.',
    fix: (d) => `Ajoute « #include <${d.data?.header}> ».`,
  },
  undeclared: {
    title: 'Variable non déclarée',
    question: (d) => (d.data?.suggestion ? `As-tu bien écrit « ${d.data.name} » ? Compare avec « ${d.data.suggestion} ».` : `Où as-tu déclaré « ${d.data?.name} » (avec son type) ? Est-ce avant cette ligne, et dans le même bloc { } ?`),
    why: 'En C, chaque variable doit être déclarée avec son type avant d\'être utilisée, et elle n\'existe que dans le bloc { } où elle est déclarée.',
    fix: (d) => (d.data?.suggestion ? `Corrige l'orthographe : « ${d.data.suggestion} ».` : `Déclare-la avant : par ex. « int ${d.data?.name} = 0; ».`),
  },
  'missing-brace': {
    title: 'Accolade fermante manquante',
    question: () => 'Compte les { et les } : y en a-t-il autant ? Quel bloc n\'est jamais fermé ?',
    why: 'Chaque bloc ouvert par { doit être refermé par }. Le compilateur atteint la fin du fichier en attendant encore une }.',
    fix: () => 'Ajoute la } manquante (souvent celle de main, tout à la fin). Indente ton code pour voir les blocs.',
  },
  'brace-after-semicolon': {
    title: '« ; » en trop avant {',
    question: () => 'Regarde la ligne de l\'en-tête de la fonction juste au-dessus. Se termine-t-elle par un « ; » ?',
    why: '« int main(void); » est une simple déclaration. L\'accolade qui suit n\'appartient alors à rien.',
    fix: () => 'Supprime le « ; » après « int main(void) ».',
  },
  'extra-brace': {
    title: 'Accolade en trop',
    question: () => 'Quelle accolade fermante n\'a pas d\'accolade ouvrante correspondante ?',
    why: 'Une } de trop ferme main trop tôt : la suite du code se retrouve hors de toute fonction.',
    fix: () => 'Supprime l\'accolade fermante en trop, ou ajoute l\'ouvrante oubliée.',
  },
  'include-extra': {
    title: 'Directive #include mal terminée',
    question: () => 'Les lignes qui commencent par # sont-elles des instructions comme les autres ?',
    why: '#include est une directive du préprocesseur : elle ne se termine jamais par « ; ».',
    fix: () => 'Supprime le « ; » après #include <...>.',
  },
  'include-syntax': {
    title: '#include mal écrit',
    question: () => 'Comment écrit-on le nom d\'un fichier d\'en-tête standard après #include ?',
    why: 'Le nom doit être entre chevrons <...> (bibliothèque standard) ou entre guillemets "..." (ton fichier).',
    fix: () => 'Écris par exemple « #include <stdio.h> ».',
  },
  'include-missing': {
    title: 'En-tête introuvable',
    question: () => 'Vérifie l\'orthographe du fichier : stdio.h, stdlib.h, string.h, math.h…',
    why: 'Le compilateur ne trouve aucun fichier portant ce nom.',
    fix: () => 'Corrige le nom (par exemple <stdio.h>, pas <studio.h>).',
  },
  'unterminated-string': {
    title: 'Chaîne non fermée',
    question: () => 'Chaque guillemet " ouvrant a-t-il son guillemet fermant sur la même ligne ?',
    why: 'Une chaîne de caractères commence et finit par " sur la même ligne.',
    fix: () => 'Ajoute le " fermant avant la parenthèse.',
  },
  multichar: {
    title: 'Apostrophes au lieu de guillemets',
    question: () => 'Quelle est la différence entre \'A\' et "Bonjour" en C ?',
    why: 'Les apostrophes \' \' entourent UN seul caractère (type char). Le texte s\'écrit entre guillemets doubles " ".',
    fix: () => 'Remplace les apostrophes par des guillemets doubles : "Bonjour".',
  },
  'int-conversion': {
    title: 'Nombre et adresse mélangés',
    question: (d) => (d.data?.charLit ? 'Ce que tu passes est entre apostrophes : est-ce un texte ou un seul caractère ?' : 'La fonction attend-elle une valeur ou l\'adresse d\'une variable ? Que fait l\'opérateur & ?'),
    why: 'Un pointeur contient une adresse mémoire, pas une valeur ordinaire. Les deux ne sont pas interchangeables.',
    fix: (d) => (d.data?.charLit ? 'Utilise des guillemets doubles pour du texte.' : d.data?.strLit ? 'Pour un seul caractère, utilise des apostrophes : \'a\'.' : 'Ajoute & pour donner l\'adresse, ou * pour lire la valeur pointée.'),
  },
  'printf-format': {
    title: 'Mauvais code de format',
    question: (d) => `Quel est le type de la valeur affichée avec « ${d.data?.spec} » ? Quel code correspond à ce type ?`,
    why: 'printf ne connaît pas le type des valeurs : il fait confiance au format. Un mauvais code affiche n\'importe quoi.',
    fix: (d) => (d.data?.got?.includes('double') || d.data?.got === 'float' ? 'Pour un réel : %f (ou %.2f).' : d.data?.got?.includes('*') ? 'Pour une chaîne : %s.' : d.data?.got === 'long' || d.data?.got === 'unsigned long' ? 'Pour un long : %ld ; pour sizeof : %zu.' : 'Pour un entier : %d.'),
  },
  'scanf-format': {
    title: 'scanf mal utilisé',
    question: (d) => (d.data?.got && !d.data.got.includes('*') ? 'scanf doit RANGER la valeur dans ta variable : que faut-il lui donner, la valeur de la variable ou son adresse ?' : 'Le code de format correspond-il exactement au type de la variable (int → %d, double → %lf, chaîne → %s) ?'),
    why: 'scanf reçoit l\'adresse où écrire la valeur lue (&variable). Pour un double il faut %lf ; pour un tableau de char, le nom suffit (pas de &).',
    fix: (d) => (d.data?.got && !d.data.got.includes('*') ? 'Ajoute & devant la variable : scanf("%d", &n);' : d.data?.expected === 'float *' ? 'Utilise %lf pour lire un double.' : 'Retire le & devant le tableau de char.'),
  },
  'assign-in-cond': {
    title: '= au lieu de ==',
    question: () => 'Dans ta condition, veux-tu MODIFIER la variable ou la COMPARER ?',
    why: '« = » range une valeur (affectation). « == » compare. if (x = 5) met 5 dans x et est toujours vrai.',
    fix: () => 'Remplace = par == dans la condition.',
  },
  'empty-if': {
    title: '« ; » après if',
    question: () => 'Que se passe-t-il quand le if est immédiatement suivi d\'un « ; » ?',
    why: 'Le « ; » est une instruction vide : c\'est elle que le if contrôle. Le bloc suivant s\'exécute toujours.',
    fix: () => 'Supprime le « ; » juste après la parenthèse du if.',
  },
  'empty-loop': {
    title: '« ; » après la boucle',
    question: () => 'Quelle instruction est répétée quand la boucle se termine par « ; » ?',
    why: 'Le « ; » forme un corps de boucle vide : le bloc { } suivant n\'est pas répété.',
    fix: () => 'Supprime le « ; » après for(...) ou while(...).',
  },
  fallthrough: {
    title: 'break oublié dans switch',
    question: () => 'Après avoir exécuté un case, comment le switch sait-il qu\'il doit s\'arrêter ?',
    why: 'Sans break, l\'exécution continue dans le case suivant.',
    fix: () => 'Ajoute « break; » à la fin du case.',
  },
  'missing-return': {
    title: 'return manquant',
    question: () => 'Si aucune condition n\'est vraie, que renvoie ta fonction ?',
    why: 'Une fonction non void doit renvoyer une valeur sur TOUS les chemins.',
    fix: () => 'Ajoute un return final (ou un else).',
  },
  'int-division': {
    title: 'Division entière',
    question: () => 'Quel est le type de chaque côté de « / » ? Que donne 7 / 2 entre deux int ?',
    why: 'Entre deux entiers, / donne un entier (les décimales sont coupées) AVANT l\'affectation.',
    fix: () => 'Convertis un opérande : (double) a / b, ou écris 2.0 au lieu de 2.',
  },
  'array-assign': {
    title: 'Affectation de tableau',
    question: () => 'Peut-on copier un tableau entier avec = en C ?',
    why: 'Le nom d\'un tableau désigne un bloc de mémoire fixe ; on ne peut pas le remplacer avec =.',
    fix: () => 'Pour une chaîne : strcpy(dest, "texte"); (#include <string.h>).',
  },
  'str-compare': {
    title: 'Comparaison de chaînes avec ==',
    question: () => 'Que compare == entre deux chaînes : le texte ou les adresses ?',
    why: 'Une chaîne est une adresse. == compare les adresses, presque toujours différentes.',
    fix: () => 'Utilise strcmp(a, b) == 0.',
  },
  redefinition: {
    title: 'Déclarée deux fois',
    question: () => 'Combien de fois as-tu écrit le TYPE devant ce nom ?',
    why: 'Une variable se déclare une seule fois ; ensuite on l\'utilise sans répéter le type.',
    fix: () => 'Supprime le type à la deuxième occurrence : x = 5; au lieu de int x = 5;',
  },
  'unknown-type': {
    title: 'Type inconnu',
    question: () => 'Ce mot est-il un type du C (int, double, char, float) ? Est-il bien orthographié ?',
    why: 'Le C ne connaît que ses types de base, ceux des en-têtes inclus et ceux que tu définis (struct, typedef).',
    fix: () => 'Corrige le type, ou ajoute l\'en-tête nécessaire (bool → <stdbool.h>).',
  },
  'too-few-args': {
    title: 'Arguments manquants',
    question: (d) => `Combien de paramètres la fonction attend-elle ? Combien lui en donnes-tu ? (${d.data?.expected} attendu(s))`,
    why: 'Un appel doit fournir exactement un argument par paramètre du prototype.',
    fix: () => 'Ajoute les arguments manquants, dans le bon ordre.',
  },
  'too-many-args': {
    title: 'Trop d\'arguments',
    question: (d) => `La fonction attend ${d.data?.expected} argument(s). Lequel est en trop ?`,
    why: 'Un appel doit fournir exactement un argument par paramètre.',
    fix: () => 'Retire l\'argument en trop ou modifie le prototype.',
  },
  'conflicting-types': {
    title: 'Prototype et définition différents',
    question: () => 'Compare le prototype en haut et la définition en bas : même type de retour, mêmes paramètres ?',
    why: 'Le prototype annonce la fonction ; la définition doit correspondre exactement.',
    fix: () => 'Rends les deux en-têtes identiques.',
  },
  'undefined-reference': {
    title: 'Fonction jamais écrite',
    question: () => 'Tu as annoncé la fonction (prototype). Où est son corps { ... } ?',
    why: 'Le prototype promet que la fonction existe. L\'éditeur de liens ne trouve pas sa définition.',
    fix: () => 'Écris la définition complète de la fonction.',
  },
  'no-main': {
    title: 'Pas de main',
    question: () => 'Par quelle fonction commence tout programme C ?',
    why: 'Le système lance toujours la fonction main.',
    fix: () => 'Ajoute « int main(void) { ... return 0; } ».',
  },
  'expected-expression': {
    title: 'Expression attendue',
    question: (d) => `Regarde la ligne ${d.line} : manque-t-il une valeur, ou y a-t-il un symbole de trop ?`,
    why: 'Le compilateur attendait une valeur (nombre, variable, calcul) à cet endroit.',
    fix: () => 'Complète l\'expression ou retire le symbole en trop.',
  },
  'missing-paren': {
    title: 'Parenthèse non fermée',
    question: () => 'Compte les ( et les ) sur cette ligne. Sont-elles appariées ?',
    why: 'Chaque parenthèse ouvrante doit être fermée avant le « ; ».',
    fix: () => 'Ajoute la ) manquante.',
  },
  'mod-float': {
    title: '% avec des réels',
    question: () => 'L\'opérateur % (reste) a-t-il un sens avec des nombres à virgule en C ?',
    why: '% ne fonctionne qu\'avec des entiers.',
    fix: () => 'Utilise des int, ou fmod() de <math.h> pour des réels.',
  },
  'sign-compare': {
    title: 'Signé contre non signé',
    question: () => 'De quel type est la valeur renvoyée par strlen ou sizeof ? Et ta variable de boucle ?',
    why: 'strlen et sizeof renvoient un size_t (non signé). Le comparer à un int peut donner des résultats faux si l\'int est négatif.',
    fix: () => 'Déclare la variable en size_t, ou convertis : i < (int) strlen(s).',
  },
};

const RUNTIME = {
  'div-zero': { title: 'Division par zéro', question: 'Quelle valeur a le diviseur au moment de la division ?', why: 'Diviser un entier par 0 est impossible : le processeur arrête le programme (Floating point exception).', fix: 'Teste le diviseur avant : if (b != 0) ...' },
  'out-of-bounds': { title: 'Sortie du tableau', question: 'Un tableau de N cases a des indices de 0 à… ? Quelle est la dernière valeur prise par ton indice ?', why: 'Lire ou écrire en dehors d\'un tableau corrompt la mémoire. En vrai C, cela peut planter ou donner des résultats aléatoires.', fix: 'Utilise i < N (et non i <= N) dans la condition de la boucle.' },
  'null-deref': { title: 'Pointeur NULL', question: 'Ce pointeur a-t-il reçu une vraie adresse avant d\'être utilisé ? As-tu testé le résultat de malloc / fopen ?', why: 'NULL signifie « aucune adresse ». Utiliser *p quand p vaut NULL provoque une erreur de segmentation.', fix: 'Teste : if (p == NULL) { ... } avant d\'utiliser p.' },
  'uninit-pointer': { title: 'Pointeur non initialisé', question: 'Vers quelle variable pointe ton pointeur ? Lui as-tu donné une adresse (p = &x;) ?', why: 'Un pointeur déclaré sans valeur contient une adresse au hasard.', fix: 'Initialise-le : int *p = &x; ou p = malloc(...);' },
  timeout: { title: 'Boucle infinie probable', question: 'Dans ta boucle, quelle variable doit changer pour que la condition devienne fausse ? Change-t-elle vraiment ?', why: 'Si la condition reste vraie pour toujours, le programme ne s\'arrête jamais. (Ou bien scanf attend une entrée que le test ne fournit pas.)', fix: 'Vérifie l\'incrément (i++) et la condition de sortie.' },
  'stack-overflow': { title: 'Récursion sans fin', question: 'Quel est le cas d\'arrêt de ta fonction récursive ? Est-il toujours atteint ?', why: 'Chaque appel occupe de la mémoire sur la pile. Sans cas d\'arrêt, la pile déborde.', fix: 'Ajoute un cas de base (par ex. if (n <= 1) return 1;) et vérifie que n se rapproche de ce cas.' },
  'use-after-free': { title: 'Utilisation après free', question: 'Ce bloc a-t-il déjà été libéré avant cette ligne ?', why: 'Après free(p), la mémoire ne t\'appartient plus.', fix: 'N\'utilise plus p après free(p) ; mets p = NULL juste après.' },
  'double-free': { title: 'Double libération', question: 'Combien de fois appelles-tu free sur ce pointeur ?', why: 'Un bloc ne se libère qu\'une fois.', fix: 'Mets le pointeur à NULL après free (free(NULL) ne fait rien).' },
  'dangling-stack': { title: 'Variable locale disparue', question: 'Que devient une variable locale quand sa fonction se termine ?', why: 'Les variables locales sont détruites à la fin de la fonction : leur adresse n\'est plus valide.', fix: 'Renvoie la valeur (pas son adresse), ou utilise malloc.' },
  'write-rodata': { title: 'Chaîne littérale modifiée', question: 'Une chaîne écrite entre guillemets peut-elle être modifiée ?', why: 'char *s = "abc" pointe vers une zone en lecture seule.', fix: 'Utilise un tableau : char s[] = "abc";' },
  'no-terminator': { title: 'Caractère \\0 manquant', question: 'Ta chaîne se termine-t-elle bien par \'\\0\' ? As-tu prévu une case pour lui ?', why: 'Les fonctions de chaîne lisent jusqu\'au \'\\0\'. Sans lui, elles débordent.', fix: 'Ajoute s[n] = \'\\0\'; et réserve n+1 cases.' },
  'null-file': { title: 'Fichier non ouvert', question: 'As-tu vérifié que fopen n\'a pas renvoyé NULL ?', why: 'fopen renvoie NULL si le fichier n\'existe pas (en lecture) ou ne peut pas être créé.', fix: 'if (f == NULL) { printf("Erreur\\n"); return 1; }' },
};

/** Analyse logique : la sortie diffère de l'attendu. */
function analyzeOutput(test, source) {
  const exp = normalizeOutput(test.expected);
  const got = normalizeOutput(test.got);
  if (!got) {
    return { title: 'Rien ne s\'affiche', question: 'Ton programme appelle-t-il printf ? La ligne qui affiche est-elle bien exécutée (dans le bon if, dans main) ?', why: 'Le programme se termine sans rien afficher.', fix: 'Vérifie que printf est appelé et que son bloc est atteint.' };
  }
  if (got.replace(/\s+/g, '') === exp.replace(/\s+/g, '')) {
    if (got.replace(/\n/g, '') === exp.replace(/\n/g, '')) return { title: 'Retours à la ligne', question: 'Compare les lignes : où faut-il un \\n de plus ou de moins ?', why: 'Le texte est bon mais il n\'est pas découpé en lignes comme demandé.', fix: 'Ajoute ou retire des \\n dans tes printf.' };
    return { title: 'Espaces', question: 'Le texte est presque identique : compare les espaces, un par un.', why: 'La sortie doit correspondre exactement, espaces compris.', fix: 'Ajuste les espaces dans tes chaînes.' };
  }
  if (got.toLowerCase() === exp.toLowerCase()) return { title: 'Majuscules / minuscules', question: 'Compare les majuscules : sont-elles au même endroit ?', why: 'La comparaison distingue majuscules et minuscules.', fix: 'Respecte exactement la casse demandée.' };
  const el = exp.split('\n'), gl = got.split('\n');
  if (Math.abs(el.length - gl.length) === 1 && el.slice(0, Math.min(el.length, gl.length)).every((l, i) => l === gl[i] || i >= Math.min(el.length, gl.length) - 1)) {
    return { title: gl.length > el.length ? 'Une ligne de trop' : 'Une ligne manquante', question: 'Ta boucle tourne-t-elle une fois de trop ou de moins ? Regarde la condition (< ou <=) et la valeur de départ.', why: 'Erreur classique « off-by-one » : décalage de 1 dans les bornes.', fix: 'Vérifie le début (0 ou 1 ?) et la fin (< ou <= ?) de la boucle.' };
  }
  const nE = exp.match(/-?\d+\.\d+/g), nG = got.match(/-?\d+(\.\d+)?/g);
  if (nE && nG && nG.some((x) => /^-?\d+\.0+$/.test(x) || !x.includes('.'))) {
    return { title: 'Décimales perdues ?', question: 'Le résultat attendu a des décimales. Ton calcul est-il fait avec des int ?', why: 'Une division entre deux int perd la partie décimale.', fix: 'Utilise double et (double) a / b, puis %.2f à l\'affichage.' };
  }
  if (/\b(scanf)\b/.test(source) && test.stdin && got.split('\n')[0] !== el[0] && /[:?]\s*$/.test(gl[0] || '')) {
    return { title: 'Message en trop', question: 'L\'énoncé demande-t-il d\'afficher un message avant la saisie ?', why: 'Les tests comparent la sortie exacte : un message d\'invite en plus change la sortie.', fix: 'Affiche uniquement ce que demande l\'énoncé.' };
  }
  return { title: 'Résultat différent', question: `Fais tourner ton programme « à la main » avec l'entrée du test${test.stdin ? ` (${JSON.stringify(test.stdin.trim())})` : ''}. Quelle valeur obtiens-tu à chaque étape ?`, why: 'Le programme compile et s\'exécute, mais sa logique ne produit pas le bon résultat : c\'est une erreur de logique.', fix: 'Compare ta sortie et la sortie attendue ligne par ligne, puis vérifie le calcul correspondant.' };
}

/**
 * @param {object} res résultat de gradeExercise
 * @returns {{kind:'ok'|'syntax'|'warning'|'runtime'|'logic'|'rules', title:string, line?:number, steps:string[], python?:string, topic?:string, codes:string[]}}
 */
export function analyze(res) {
  if (res.passed) {
    const warnings = (res.diagnostics || []).filter((d) => d.severity === 'warning');
    return { kind: 'ok', title: warnings.length ? 'Réussi… mais le compilateur a des remarques' : 'Bravo, programme correct !', steps: warnings.length ? ['Les tests passent, mais lis les avertissements : un vrai programmeur les corrige tous.'] : [], codes: warnings.map((w) => w.code) };
  }
  if (res.stage === 'compile') {
    const err = res.diagnostics.find((d) => d.severity === 'error');
    const rule = RULES[err.code];
    const steps = rule
      ? [rule.question(err), rule.why, rule.fix(err)]
      : [`Lis le message : « ${err.message} ». Que te dit-il exactement ?`, 'Le compilateur indique la ligne où il a remarqué le problème ; la cause est souvent sur cette ligne ou juste avant.', 'Corrige la première erreur, puis relance : les suivantes disparaissent souvent.'];
    return { kind: 'syntax', title: `Erreur de compilation${rule ? ` : ${rule.title}` : ''}`, line: err.line, steps, python: PY[err.code], topic: CODE_TOPIC[err.code] || 'syntax', codes: [err.code] };
  }
  const rtTest = res.tests.find((t) => t.runtimeError);
  if (rtTest) {
    const e = rtTest.runtimeError;
    const r = RUNTIME[e.code];
    return {
      kind: 'runtime', title: `Erreur d'exécution${r ? ` : ${r.title}` : ''}`, line: e.line,
      steps: r ? [r.question, r.why, r.fix] : [e.message, 'Le programme compile, mais plante pendant son exécution.', 'Repère la ligne indiquée et vérifie les valeurs utilisées.'],
      python: PY[e.code], topic: CODE_TOPIC[e.code] || 'debug', codes: [e.code],
    };
  }
  const bad = res.tests.find((t) => !t.passed);
  if (bad) {
    const a = analyzeOutput(bad, res.source);
    const codes = (res.diagnostics || []).filter((d) => d.severity !== 'error').map((d) => d.code);
    const hintFromWarning = (res.diagnostics || []).find((d) => d.severity !== 'error' && RULES[d.code]);
    const steps = [a.question, a.why, a.fix];
    if (hintFromWarning) steps.unshift(`Indice : le compilateur a signalé ligne ${hintFromWarning.line} — « ${hintFromWarning.message} »`);
    return { kind: 'logic', title: `Erreur de logique : ${a.title}`, line: hintFromWarning?.line, steps, python: hintFromWarning ? PY[hintFromWarning.code] : undefined, topic: hintFromWarning ? CODE_TOPIC[hintFromWarning.code] : 'logic', codes: codes.length ? codes : ['logic'] };
  }
  if (res.ruleFailures?.length) {
    return { kind: 'rules', title: 'Presque ! Une consigne n\'est pas respectée', steps: res.ruleFailures, codes: ['rules'] };
  }
  return { kind: 'logic', title: 'Pas encore', steps: ['Relis l\'énoncé et compare avec ta sortie.'], codes: ['logic'] };
}

/** Explication d'un diagnostic isolé (affichée dans la console). */
export function explainDiagnostic(d) {
  const rule = RULES[d.code];
  if (!rule) return null;
  return { title: rule.title, question: rule.question(d), why: rule.why, fix: rule.fix(d), python: PY[d.code] };
}
export function explainRuntime(e) {
  const r = RUNTIME[e.code];
  return r ? { ...r, python: PY[e.code] } : null;
}

export { RULES, RUNTIME, PY };
