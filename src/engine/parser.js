// Analyseur syntaxique C99 (sous-ensemble large) -> arbre syntaxique (AST).
import { CError } from './errors.js';

const TYPE_KW = new Set(['void', 'char', 'short', 'int', 'long', 'float', 'double', 'signed', 'unsigned', '_Bool', 'struct', 'union', 'enum', 'const', 'volatile', 'restrict', 'static', 'extern', 'typedef', 'register', 'auto', 'inline']);

const ASSIGN_OPS = new Set(['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=']);
const BIN_PREC = {
  '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5, '==': 6, '!=': 6,
  '<': 7, '>': 7, '<=': 7, '>=': 7, '<<': 8, '>>': 8, '+': 9, '-': 9, '*': 10, '/': 10, '%': 10,
};

function show(tok) {
  if (tok.t === 'eof') return 'la fin du fichier';
  if (tok.t === 'str') return `"${tok.v}"`;
  if (tok.t === 'char') return tok.raw || `'${String.fromCharCode(tok.v)}'`;
  if (tok.t === 'num') return tok.raw || String(tok.v);
  return `'${tok.v}'`;
}
function gccShow(tok) {
  if (tok.t === 'eof') return 'end of input';
  if (tok.t === 'num') return 'numeric constant';
  if (tok.t === 'str') return 'string constant';
  if (tok.t === 'char') return 'character constant';
  return `'${tok.v}'${tok.t === 'punc' ? ' token' : ''}`;
}

export function parse(tokens) {
  let p = 0;
  // portées de noms de type (typedef) : pile d'ensembles
  const typedefScopes = [new Set()];
  const shadowScopes = [new Set()];

  const peek = (o = 0) => tokens[Math.min(p + o, tokens.length - 1)];
  const next = () => tokens[p++];
  const prev = () => tokens[p - 1] || tokens[0];
  const is = (v, o = 0) => { const t = peek(o); return (t.t === 'punc' || t.t === 'kw') && t.v === v; };
  const accept = (v) => { if (is(v)) { p++; return true; } return false; };

  function fail(msg, gcc, tok = peek(), code = 'syntax') {
    throw new CError(msg, { line: tok.line, col: tok.col, file: tok.file, gcc, code });
  }
  function failAfterPrev(msg, gcc, code) {
    const t = prev();
    throw new CError(msg, { line: t.line, col: t.end, file: t.file, gcc, code });
  }
  function expect(v, ctx) {
    if (is(v)) return next();
    const t = peek();
    if (v === ';') {
      failAfterPrev(`';' attendu avant ${show(t)}${ctx ? ` (${ctx})` : ''} : as-tu oublié le point-virgule à la fin de l'instruction ?`, `expected ';' before ${gccShow(t)}`, 'missing-semicolon');
    }
    if (v === ')') fail(`')' attendu avant ${show(t)} : une parenthèse n'est pas fermée`, `expected ')' before ${gccShow(t)}`, t, 'missing-paren');
    if (v === ']') fail(`']' attendu avant ${show(t)}`, `expected ']' before ${gccShow(t)}`, t, 'missing-bracket');
    if (v === '}' && t.t === 'eof') fail(`fin du fichier atteinte : il manque une accolade fermante '}'`, 'expected declaration or statement at end of input', t, 'missing-brace');
    if (v === '(') fail(`'(' attendu ${ctx ? ctx + ' ' : ''}avant ${show(t)}`, `expected '(' before ${gccShow(t)}`, t, 'missing-paren');
    fail(`'${v}' attendu avant ${show(t)}`, `expected '${v}' before ${gccShow(t)}`, t, 'expected');
  }

  const isTypedefName = (name) => {
    for (let i = typedefScopes.length - 1; i >= 0; i--) {
      if (shadowScopes[i].has(name)) return false;
      if (typedefScopes[i].has(name)) return true;
    }
    return false;
  };
  const pushScope = () => { typedefScopes.push(new Set()); shadowScopes.push(new Set()); };
  const popScope = () => { typedefScopes.pop(); shadowScopes.pop(); };
  const declareName = (name, isTypedef) => {
    const top = typedefScopes.length - 1;
    if (isTypedef) { typedefScopes[top].add(name); shadowScopes[top].delete(name); }
    else { shadowScopes[top].add(name); typedefScopes[top].delete(name); }
  };

  function startsType(o = 0) {
    const t = peek(o);
    if (t.t === 'kw' && TYPE_KW.has(t.v)) return true;
    if (t.t === 'id' && isTypedefName(t.v)) return true;
    return false;
  }

  // ---------- déclarations ----------
  function parseSpecifiers() {
    const start = peek();
    const spec = { kind: 'spec', words: [], storage: null, const: false, struct: null, enumSpec: null, typedefName: null, inline: false, line: start.line, col: start.col };
    let any = false;
    while (true) {
      const t = peek();
      if (t.t === 'kw') {
        if (['static', 'extern', 'typedef', 'register', 'auto'].includes(t.v)) {
          if (spec.storage && spec.storage !== t.v) fail(`plusieurs classes de stockage (${spec.storage} et ${t.v})`, 'multiple storage classes in declaration specifiers');
          spec.storage = t.v; next(); any = true; continue;
        }
        if (t.v === 'const') { spec.const = true; next(); any = true; continue; }
        if (t.v === 'volatile' || t.v === 'restrict') { next(); any = true; continue; }
        if (t.v === 'inline') { spec.inline = true; next(); any = true; continue; }
        if (['void', 'char', 'short', 'int', 'long', 'float', 'double', 'signed', 'unsigned', '_Bool'].includes(t.v)) {
          if (spec.typedefName || spec.struct || spec.enumSpec) fail(`deux types dans la même déclaration (${spec.typedefName || 'struct'} et ${t.v})`, 'two or more data types in declaration specifiers');
          spec.words.push(t.v); next(); any = true; continue;
        }
        if (t.v === 'struct' || t.v === 'union') {
          if (spec.words.length || spec.typedefName) fail('deux types dans la même déclaration', 'two or more data types in declaration specifiers');
          spec.struct = parseStructSpec(); any = true; continue;
        }
        if (t.v === 'enum') { spec.enumSpec = parseEnumSpec(); any = true; continue; }
      }
      if (t.t === 'id' && !spec.words.length && !spec.struct && !spec.enumSpec && !spec.typedefName && isTypedefName(t.v)) {
        spec.typedefName = t.v; next(); any = true; continue;
      }
      break;
    }
    return any ? spec : null;
  }

  function parseStructSpec() {
    const kw = next();
    const node = { kind: kw.v, tag: null, fields: null, line: kw.line, col: kw.col };
    if (peek().t === 'id') node.tag = next().v;
    if (accept('{')) {
      node.fields = [];
      while (!is('}')) {
        if (peek().t === 'eof') expect('}');
        const fs = parseSpecifiers();
        if (!fs) fail(`déclaration de champ attendue dans la structure, trouvé ${show(peek())}`, `expected specifier-qualifier-list before ${gccShow(peek())}`);
        if (accept(';')) { node.fields.push({ spec: fs, decl: null, line: fs.line }); continue; }
        do {
          const d = parseDeclarator(false);
          node.fields.push({ spec: fs, decl: d, line: d.line });
        } while (accept(','));
        if (!is(';')) {
          if (is('}')) failAfterPrev(`';' attendu à la fin du champ, avant '}'`, "expected ';' at end of declaration list", 'missing-semicolon');
          expect(';');
        }
        next();
      }
      next();
    } else if (!node.tag) fail(`nom ou '{' attendu après « ${kw.v} »`, `expected '{' before ${gccShow(peek())}`);
    return node;
  }

  function parseEnumSpec() {
    const kw = next();
    const node = { kind: 'enum', tag: null, items: null, line: kw.line };
    if (peek().t === 'id') node.tag = next().v;
    if (accept('{')) {
      node.items = [];
      while (!is('}')) {
        const nt = next();
        if (nt.t !== 'id') fail(`nom de constante attendu dans l'enum, trouvé ${show(nt)}`, 'expected identifier before ' + gccShow(nt), nt);
        let value = null;
        if (accept('=')) value = parseConditional();
        node.items.push({ name: nt.v, value, line: nt.line });
        declareName(nt.v, false);
        if (!accept(',')) break;
      }
      expect('}');
    }
    return node;
  }

  /**
   * Déclarateur : renvoie {name, ops, line, col} où ops est la liste des dérivations
   * appliquées au type de base, de l'intérieur vers l'extérieur.
   */
  function parseDeclarator(abstract) {
    const ptrs = [];
    while (is('*')) {
      next();
      const q = { k: 'ptr', const: false };
      while (is('const') || is('volatile') || is('restrict')) { if (next().v === 'const') q.const = true; }
      ptrs.push(q);
    }
    let name = null;
    let inner = null;
    const t = peek();
    let line = t.line, col = t.col;
    if (t.t === 'id' && !abstract) { name = next().v; }
    else if (t.t === 'id' && abstract && !isTypedefName(t.v)) { name = next().v; }
    else if (is('(') && (is('*', 1) || (is('(', 1)) || (peek(1).t === 'id' && !isTypedefName(peek(1).v) && !abstract))) {
      next();
      inner = parseDeclarator(abstract);
      expect(')');
      name = inner.name; line = inner.line; col = inner.col;
    } else if (!abstract) {
      if (t.t === 'kw') fail(`nom attendu mais trouvé le mot-clé « ${t.v} » (un mot réservé du C ne peut pas servir de nom)`, `expected identifier or '(' before '${t.v}'`, t, 'keyword-as-name');
      if (t.t === 'num') fail(`nom de variable attendu, trouvé le nombre ${show(t)} (un nom ne peut pas commencer par un chiffre)`, `expected identifier or '(' before numeric constant`, t, 'bad-name');
      fail(`nom attendu avant ${show(t)}`, `expected identifier or '(' before ${gccShow(t)}`, t, 'expected-identifier');
    }
    const suffixes = [];
    while (true) {
      if (is('[')) {
        const lb = next();
        let size = null;
        if (!is(']')) size = parseAssign();
        expect(']');
        suffixes.push({ k: 'array', size, line: lb.line });
      } else if (is('(')) {
        next();
        suffixes.push(parseParams());
      } else break;
    }
    // ordre d'application : pointeurs, puis suffixes de droite à gauche, puis l'intérieur
    const ops = [...ptrs, ...suffixes.reverse(), ...(inner ? inner.ops : [])];
    return { name, ops, line, col, params: findParams(ops, inner) };
  }

  function findParams(ops) {
    // paramètres nommés de la fonction déclarée (pour les définitions)
    const last = ops[ops.length - 1];
    return last && last.k === 'func' ? last : null;
  }

  function parseParams() {
    const fn = { k: 'func', params: [], variadic: false, hasProto: true };
    if (accept(')')) { fn.hasProto = false; return fn; }
    if (is('void') && is(')', 1)) { next(); next(); return fn; }
    pushScope();
    do {
      if (accept('...')) { fn.variadic = true; break; }
      const spec = parseSpecifiers();
      if (!spec) {
        const t = peek();
        if (t.t === 'id') fail(`type inconnu « ${t.v} » pour le paramètre (as-tu oublié le type, par ex. int ${t.v} ?)`, `unknown type name '${t.v}'`, t, 'unknown-type');
        fail(`déclaration de paramètre attendue avant ${show(t)}`, `expected declaration specifiers or '...' before ${gccShow(t)}`, t, 'expected-param');
      }
      const d = parseDeclarator(true);
      fn.params.push({ spec, decl: d, line: spec.line });
    } while (accept(','));
    popScope();
    expect(')');
    return fn;
  }

  function parseInitializer() {
    if (is('{')) {
      const lb = next();
      const items = [];
      while (!is('}')) {
        const desig = [];
        while (is('.') || is('[')) {
          if (accept('.')) { const nt = next(); desig.push({ field: nt.v }); }
          else { next(); desig.push({ index: parseConditional() }); expect(']'); }
        }
        if (desig.length) expect('=');
        items.push({ desig, value: parseInitializer() });
        if (!accept(',')) break;
      }
      expect('}');
      return { kind: 'initlist', items, line: lb.line, col: lb.col };
    }
    return parseAssign();
  }

  function parseDeclaration(spec, isGlobal) {
    // spec déjà lu
    const decls = [];
    const line = spec.line;
    if (is(';')) {
      next();
      return { kind: 'decl', spec, declarators: [], line };
    }
    do {
      const d = parseDeclarator(false);
      const isTypedef = spec.storage === 'typedef';
      if (d.name) declareName(d.name, isTypedef);
      let init = null;
      if (accept('=')) {
        if (isTypedef) fail('un typedef ne peut pas avoir de valeur initiale', "typedef is initialized (use __typeof__ instead)");
        init = parseInitializer();
      }
      // définition de fonction ?
      if (isGlobal && decls.length === 0 && d.params && !init) {
        if (is('{')) {
          const body = parseFunctionBody(d);
          return { kind: 'funcdef', spec, decl: d, body, line: d.line, col: d.col };
        }
      }
      decls.push({ ...d, init });
    } while (accept(','));
    if (!is(';')) {
      const t = peek();
      if (is('{') && decls.length && decls[decls.length - 1].ops.some((o) => o.k === 'func') && !isGlobal) {
        fail('définition de fonction interdite à l\'intérieur d\'une autre fonction (as-tu oublié une accolade } avant ?)', "invalid nested function definition", t, 'nested-function');
      }
      if (t.t === 'id' || t.t === 'num' || t.t === 'str') {
        if (decls.length && t.t === 'id' && !decls[decls.length - 1].init) {
          failAfterPrev(`';', ',' ou '=' attendu avant ${show(t)} (un nom de variable ne peut pas contenir d'espace ; utilise _ ou une majuscule)`, `expected '=', ',', ';', 'asm' or '__attribute__' before ${gccShow(t)}`, 'expected-declarator-end');
        }
      }
      expect(';', 'fin de la déclaration');
    }
    next();
    return { kind: 'decl', spec, declarators: decls, line };
  }

  function parseFunctionBody(d) {
    pushScope();
    const fn = d.params;
    for (const prm of fn.params) if (prm.decl.name) declareName(prm.decl.name, false);
    const body = parseCompound(true);
    popScope();
    return body;
  }

  // ---------- instructions ----------
  function parseCompound(noScope) {
    const lb = expect('{');
    if (!noScope) pushScope();
    const items = [];
    while (!is('}')) {
      if (peek().t === 'eof') {
        fail(`fin du fichier atteinte : il manque une accolade fermante '}' (l'accolade ouverte ligne ${lb.line} n'est jamais fermée)`, 'expected declaration or statement at end of input', peek(), 'missing-brace');
      }
      items.push(parseBlockItem());
    }
    const rb = next();
    if (!noScope) popScope();
    return { kind: 'block', items, line: lb.line, col: lb.col, endLine: rb.line };
  }

  function parseBlockItem() {
    if (startsType() && !(peek().t === 'id' && is(':', 1))) {
      const spec = parseSpecifiers();
      return parseDeclaration(spec, false);
    }
    return parseStatement();
  }

  function parseStatement() {
    const t = peek();
    const line = t.line, col = t.col;
    if (t.t === 'punc' && t.v === '{') return parseCompound(false);
    if (t.t === 'punc' && t.v === ';') { next(); return { kind: 'empty', line, col }; }
    if (t.t === 'kw') {
      switch (t.v) {
        case 'if': {
          next();
          expect('(', "après 'if'");
          const cond = parseExpr();
          expect(')');
          const semi = is(';') ? peek() : null;
          const then = parseStatement();
          let els = null;
          if (accept('else')) els = parseStatement();
          return { kind: 'if', cond, then, else: els, line, col, emptyBody: !!semi && then.kind === 'empty', semiTok: semi };
        }
        case 'else':
          fail("'else' sans 'if' correspondant (as-tu mis un ';' juste après le if, ou oublié les accolades { } ?)", "'else' without a previous 'if'", t, 'else-without-if');
          break;
        case 'while': {
          next();
          expect('(', "après 'while'");
          const cond = parseExpr();
          expect(')');
          const semi = is(';');
          const body = parseStatement();
          return { kind: 'while', cond, body, line, col, emptyBody: semi && body.kind === 'empty' };
        }
        case 'do': {
          next();
          const body = parseStatement();
          if (!is('while')) fail("'while' attendu après le corps de 'do'", "expected 'while' before " + gccShow(peek()));
          next();
          expect('(');
          const cond = parseExpr();
          expect(')');
          if (!is(';')) failAfterPrev("';' attendu après « do { ... } while (...) » : cette forme se termine toujours par ;", `expected ';' before ${gccShow(peek())}`, 'missing-semicolon');
          next();
          return { kind: 'do', body, cond, line, col };
        }
        case 'for': {
          next();
          expect('(', "après 'for'");
          pushScope();
          let init = null;
          if (startsType()) init = parseDeclaration(parseSpecifiers(), false);
          else if (!accept(';')) {
            init = { kind: 'expr', expr: parseExpr(), line };
            if (is(',')) next();
            if (!is(';')) failAfterPrev(`';' attendu dans for (...) : la forme est for (début ; condition ; pas)`, `expected ';' before ${gccShow(peek())}`, 'for-semicolon');
            next();
          }
          let cond = null;
          if (!is(';')) cond = parseExpr();
          if (!is(';')) failAfterPrev(`';' attendu dans for (...) : la forme est for (début ; condition ; pas)`, `expected ';' before ${gccShow(peek())}`, 'for-semicolon');
          next();
          let step = null;
          if (!is(')')) step = parseExpr();
          expect(')');
          const semi = is(';');
          const body = parseStatement();
          popScope();
          return { kind: 'for', init, cond, step, body, line, col, emptyBody: semi && body.kind === 'empty' };
        }
        case 'switch': {
          next();
          expect('(', "après 'switch'");
          const expr = parseExpr();
          expect(')');
          const body = parseStatement();
          return { kind: 'switch', expr, body, line, col };
        }
        case 'case': {
          next();
          const expr = parseConditional();
          if (!is(':')) failAfterPrev(`':' attendu après « case ${show(prev())} »`, `expected ':' before ${gccShow(peek())}`, 'case-colon');
          next();
          const stmt = is('}') ? { kind: 'empty', line } : parseStatement();
          return { kind: 'case', expr, stmt, line, col };
        }
        case 'default': {
          next();
          if (!is(':')) failAfterPrev("':' attendu après « default »", `expected ':' before ${gccShow(peek())}`, 'case-colon');
          next();
          const stmt = is('}') ? { kind: 'empty', line } : parseStatement();
          return { kind: 'default', stmt, line, col };
        }
        case 'break': next(); expect(';'); return { kind: 'break', line, col };
        case 'continue': next(); expect(';'); return { kind: 'continue', line, col };
        case 'return': {
          next();
          let expr = null;
          if (!is(';')) expr = parseExpr();
          expect(';');
          return { kind: 'return', expr, line, col };
        }
        case 'goto':
          fail("'goto' n'est pas pris en charge dans C Quest (et il vaut mieux l'éviter : utilise des boucles et des fonctions)", 'goto not supported', t, 'goto');
          break;
      }
    }
    if (t.t === 'id' && is(':', 1)) {
      fail(`étiquette « ${t.v}: » non prise en charge (goto n'est pas utilisé dans ce cours)`, 'labels not supported', t, 'label');
    }
    if (t.t === 'id' && peek(1).t === 'id' && !isTypedefName(t.v)) {
      const n1 = peek(1);
      if (is('=', 2) || is(';', 2) || is(',', 2) || is('[', 2)) {
        fail(`type inconnu « ${t.v} » (as-tu fait une faute de frappe ? par ex. int, double, char${t.v === 'bool' ? ' — pour bool il faut #include <stdbool.h>' : ''}${t.v === 'string' ? ' — en C, une chaîne est un tableau de char : char nom[50]' : ''})`, `unknown type name '${t.v}'`, t, 'unknown-type');
      }
      void n1;
    }
    const expr = parseExpr();
    if (!is(';')) {
      const nt = peek();
      failAfterPrev(`';' attendu avant ${show(nt)} : as-tu oublié le point-virgule à la fin de la ligne ${prev().line} ?`, `expected ';' before ${gccShow(nt)}`, 'missing-semicolon');
    }
    next();
    return { kind: 'expr', expr, line, col };
  }

  // ---------- expressions ----------
  function parseExpr() {
    const first = parseAssign();
    if (!is(',')) return first;
    const exprs = [first];
    while (accept(',')) exprs.push(parseAssign());
    return { kind: 'comma', exprs, line: first.line, col: first.col };
  }

  function parseAssign() {
    const left = parseConditional();
    const t = peek();
    if (t.t === 'punc' && ASSIGN_OPS.has(t.v)) {
      next();
      const right = parseAssign();
      return { kind: 'assign', op: t.v, left, right, line: t.line, col: t.col };
    }
    return left;
  }

  function parseConditional() {
    const test = parseBinary(1);
    if (is('?')) {
      const q = next();
      const then = parseExpr();
      if (!is(':')) fail(`':' attendu dans l'opérateur ternaire « condition ? a : b »`, `expected ':' before ${gccShow(peek())}`);
      next();
      const els = parseConditional();
      return { kind: 'cond', test, then, else: els, line: q.line, col: q.col };
    }
    return test;
  }

  function parseBinary(minPrec) {
    let left = parseCast();
    while (true) {
      const t = peek();
      if (t.t !== 'punc') break;
      const prec = BIN_PREC[t.v];
      if (!prec || prec < minPrec) break;
      next();
      const right = parseBinary(prec + 1);
      left = { kind: 'binary', op: t.v, left, right, line: t.line, col: t.col };
    }
    return left;
  }

  function parseTypeName() {
    const spec = parseSpecifiers();
    if (!spec) fail(`nom de type attendu avant ${show(peek())}`, `expected type-name before ${gccShow(peek())}`);
    const d = parseDeclarator(true);
    return { spec, decl: d };
  }

  function parseCast() {
    if (is('(') && startsType(1)) {
      const lp = next();
      const tn = parseTypeName();
      expect(')');
      if (is('{')) {
        const init = parseInitializer();
        return parsePostfixOps({ kind: 'compound', typeName: tn, init, line: lp.line, col: lp.col });
      }
      const arg = parseCast();
      return { kind: 'cast', typeName: tn, arg, line: lp.line, col: lp.col };
    }
    return parseUnary();
  }

  function parseUnary() {
    const t = peek();
    if (t.t === 'punc') {
      if (t.v === '++' || t.v === '--') {
        next();
        const arg = parseUnary();
        return { kind: 'unary', op: 'pre' + t.v, arg, line: t.line, col: t.col };
      }
      if (['-', '+', '!', '~', '*', '&'].includes(t.v)) {
        next();
        const arg = parseCast();
        return { kind: 'unary', op: t.v, arg, line: t.line, col: t.col };
      }
    }
    if (t.t === 'kw' && t.v === 'sizeof') {
      next();
      if (is('(') && startsType(1)) {
        next();
        const tn = parseTypeName();
        expect(')');
        return { kind: 'sizeof', typeName: tn, line: t.line, col: t.col };
      }
      const arg = parseUnary();
      return { kind: 'sizeof', arg, line: t.line, col: t.col };
    }
    return parsePostfixOps(parsePrimary());
  }

  function parsePostfixOps(e) {
    while (true) {
      const t = peek();
      if (t.t !== 'punc') break;
      if (t.v === '[') {
        next();
        const index = parseExpr();
        expect(']');
        e = { kind: 'index', arr: e, index, line: t.line, col: t.col };
      } else if (t.v === '(') {
        next();
        const args = [];
        if (!is(')')) {
          do { args.push(parseAssign()); } while (accept(','));
        }
        if (!is(')')) {
          const nt = peek();
          if (nt.t === 'punc' && nt.v === ';') fail(`')' attendu avant ';' : la parenthèse de l'appel n'est pas fermée`, `expected ')' before ';' token`, nt, 'missing-paren');
          if (nt.t === 'str' || nt.t === 'id' || nt.t === 'num') failAfterPrev(`')' ou ',' attendu avant ${show(nt)} : il manque une virgule entre les arguments ?`, `expected ')' before ${gccShow(nt)}`, 'missing-comma');
          expect(')');
        }
        const rp = next();
        e = { kind: 'call', callee: e, args, line: e.line, col: e.col, endCol: rp.end };
      } else if (t.v === '.' || t.v === '->') {
        next();
        const nt = next();
        if (nt.t !== 'id') fail(`nom de champ attendu après « ${t.v} »`, `expected identifier before ${gccShow(nt)}`, nt);
        e = { kind: 'member', obj: e, name: nt.v, arrow: t.v === '->', line: t.line, col: t.col };
      } else if (t.v === '++' || t.v === '--') {
        next();
        e = { kind: 'postfix', op: t.v, arg: e, line: t.line, col: t.col };
      } else break;
    }
    return e;
  }

  function parsePrimary() {
    const t = next();
    switch (t.t) {
      case 'num': return { kind: 'num', value: t.v, ntype: t.ntype, line: t.line, col: t.col, raw: t.raw };
      case 'char': return { kind: 'char', value: t.v, multi: t.multi, line: t.line, col: t.col };
      case 'str': {
        const bytes = [...t.bytes];
        let text = t.v;
        while (peek().t === 'str') { const s = next(); bytes.push(...s.bytes); text += s.v; }
        return { kind: 'str', bytes, text, line: t.line, col: t.col };
      }
      case 'id': return { kind: 'id', name: t.v, line: t.line, col: t.col, end: t.end, fromMacro: t.fromMacro };
      case 'punc':
        if (t.v === '(') {
          const e = parseExpr();
          expect(')');
          return { ...e, paren: true };
        }
        break;
      case 'kw':
        if (TYPE_KW.has(t.v)) fail(`expression attendue avant le mot-clé « ${t.v} » (une déclaration doit être au début d'une instruction)`, `expected expression before '${t.v}'`, t, 'expected-expression');
        break;
    }
    if (t.t === 'eof') fail('fin du fichier inattendue : le programme est incomplet (accolade ou parenthèse non fermée ?)', 'expected expression at end of input', t, 'unexpected-eof');
    fail(`expression attendue avant ${show(t)}`, `expected expression before ${gccShow(t)}`, t, 'expected-expression');
  }

  // ---------- unité de traduction ----------
  const items = [];
  while (peek().t !== 'eof') {
    if (is(';')) { next(); continue; }
    if (is('{')) {
      fail("'{' inattendu ici : y a-t-il un ';' en trop après l'en-tête de la fonction (par ex. « int main(void); ») ?", "expected identifier or '(' before '{' token", peek(), 'brace-after-semicolon');
    }
    if (is('}')) fail("'}' en trop : cette accolade fermante ne correspond à aucune accolade ouvrante", "expected identifier or '(' before '}' token", peek(), 'extra-brace');
    const startTok = peek();
    const spec = parseSpecifiers();
    if (!spec) {
      const t = peek();
      if (t.t === 'id' && is('(', 1)) {
        // ex. « main(void) { » sans type de retour, ou appel hors fonction
        fail(`type attendu avant « ${t.v} » : en C99, une fonction doit avoir un type de retour (par ex. int ${t.v}(...)). Si c'est une instruction, elle doit être dans une fonction.`, `return type defaults to 'int' / expected declaration`, t, 'missing-type');
      }
      if (t.t === 'id' && peek(1).t === 'id') fail(`type inconnu « ${t.v} »`, `unknown type name '${t.v}'`, t, 'unknown-type');
      fail(`déclaration attendue avant ${show(t)} (le code doit être placé dans une fonction, par ex. dans main)`, `expected identifier or '(' before ${gccShow(t)}`, t, 'expected-declaration');
    }
    const it = parseDeclaration(spec, true);
    it.file = startTok.file;
    items.push(it);
  }
  return { kind: 'unit', items };
}
