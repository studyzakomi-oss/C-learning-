// Analyse sémantique + génération de code (closures JavaScript) pour le C.
import { CError, RuntimeError } from './errors.js';
import {
  T, NTYPE, intType, ptr, arrayOf, funcType, unqual, isInt, isFloat, isArith, isPtr, isScalar, isStruct,
  is64, isVoidPtr, promote, usualArith, typeName, sameType, sameIgnoringConst, newStruct, layoutStruct, decay,
} from './types.js';
import { BUILTINS } from './builtins.js';
import { FUNC_HEADER } from './headers.js';
import { parseFormat } from './format.js';
import { SH_OK, SH_UNINIT, SH_DEAD, SH_RODATA, STACK_END, FUNC_BASE, POISON_PTR } from './runtime.js';

const BREAK = 1;
const CONT = 2;
const RET = 3;
const TWO32 = 4294967296;

const bin = (bytes) => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return s; };

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[m][n];
}
function closest(name, candidates) {
  let best = null;
  let bd = Infinity;
  for (const c of candidates) {
    if (c.startsWith('__')) continue;
    const dist = c.toLowerCase() === name.toLowerCase() ? 0.5 : levenshtein(name, c);
    if (dist < bd) { bd = dist; best = c; }
  }
  return bd <= Math.max(1, Math.floor(name.length / 3)) ? best : null;
}

/**
 * Compile une ou plusieurs unités de traduction pour la machine M.
 * @returns {{run: () => number}}
 */
export function compileProgram(units, M, diag) {
  const { dv, u8, sh } = M;

  // ---------- diagnostics ----------
  const userFile = (f) => !f || !f.startsWith('<');
  function error(node, message, gcc, code = 'error', data) {
    throw new CError(message, { line: node?.line, col: node?.col, file: node?.file || curFile, gcc, code, data });
  }
  function warn(node, message, gcc, code = 'warning', data) {
    if (!userFile(curFile)) return;
    diag.add({ severity: 'warning', line: node?.line || 0, col: node?.col || 0, file: curFile, message, gcc, code, data });
  }
  function info(node, message, code, data) {
    if (!userFile(curFile)) return;
    diag.add({ severity: 'info', line: node?.line || 0, col: node?.col || 0, file: curFile, message, gcc: '', code, data });
  }
  let curFile = 'main.c';

  // ---------- portées ----------
  const scopes = [{ vars: new Map(), tags: new Map() }];
  const globalScope = scopes[0];
  const pushScope = () => scopes.push({ vars: new Map(), tags: new Map() });
  const popScope = () => { const s = scopes.pop(); if (fn) for (const sym of s.vars.values()) fn.scopeSyms.push(sym); };
  const lookup = (name) => { for (let i = scopes.length - 1; i >= 0; i--) { const s = scopes[i].vars.get(name); if (s) return s; } return null; };
  const lookupTag = (name) => { for (let i = scopes.length - 1; i >= 0; i--) { const s = scopes[i].tags.get(name); if (s) return s; } return null; };
  const visibleNames = () => { const out = new Set(); for (const s of scopes) for (const k of s.vars.keys()) out.add(k); return out; };

  let fn = null; // fonction en cours de compilation
  const loopDepth = { loop: 0, sw: 0 };
  const globalInits = [];
  const funcTable = [];
  const strCache = new Map();
  const allFuncs = [];

  // ---------- mémoire : lectures/écritures ----------
  function loader(t) {
    if (t.k === 'enum') return (a) => { M.chk(a, 4, false); return dv.getInt32(a, true); };
    if (t.k === 'int') {
      switch (t.size) {
        case 1: return t.signed ? (a) => { M.chk(a, 1, false); return dv.getInt8(a); } : (a) => { M.chk(a, 1, false); return dv.getUint8(a); };
        case 2: return t.signed ? (a) => { M.chk(a, 2, false); return dv.getInt16(a, true); } : (a) => { M.chk(a, 2, false); return dv.getUint16(a, true); };
        case 4: return t.signed ? (a) => { M.chk(a, 4, false); return dv.getInt32(a, true); } : (a) => { M.chk(a, 4, false); return dv.getUint32(a, true); };
        default: return t.signed ? (a) => { M.chk(a, 8, false); return dv.getBigInt64(a, true); } : (a) => { M.chk(a, 8, false); return dv.getBigUint64(a, true); };
      }
    }
    if (t.k === 'float') {
      if (t.size === 4) return (a) => { M.chk(a, 4, false); return dv.getFloat32(a, true); };
      return (a) => { M.chk(a, 8, false); return dv.getFloat64(a, true); };
    }
    if (t.k === 'ptr') {
      return (a) => {
        if (sh[a] === SH_UNINIT) { M.uninitRead(a); return POISON_PTR; }
        M.chk(a, 8, false);
        return dv.getUint32(a, true) + dv.getUint32(a + 4, true) * TWO32;
      };
    }
    if (t.k === 'struct') { const n = t.size; return (a) => M.readBytes(a, n); }
    return () => undefined;
  }
  function storer(t) {
    if (t.k === 'enum') return (a, v) => { M.chk(a, 4, true); dv.setInt32(a, v, true); };
    if (t.k === 'int') {
      switch (t.size) {
        case 1: return (a, v) => { M.chk(a, 1, true); dv.setInt8(a, v); };
        case 2: return (a, v) => { M.chk(a, 2, true); dv.setInt16(a, v, true); };
        case 4: return (a, v) => { M.chk(a, 4, true); dv.setInt32(a, v, true); };
        default: return t.signed ? (a, v) => { M.chk(a, 8, true); dv.setBigInt64(a, v, true); } : (a, v) => { M.chk(a, 8, true); dv.setBigUint64(a, v, true); };
      }
    }
    if (t.k === 'float') {
      if (t.size === 4) return (a, v) => { M.chk(a, 4, true); dv.setFloat32(a, v, true); };
      return (a, v) => { M.chk(a, 8, true); dv.setFloat64(a, v, true); };
    }
    if (t.k === 'ptr') return (a, v) => { M.chk(a, 8, true); dv.setUint32(a, v >>> 0, true); dv.setUint32(a + 4, Math.floor(v / TWO32) >>> 0, true); };
    if (t.k === 'struct') return (a, v) => M.writeBytes(a, v);
    return () => {};
  }

  // ---------- conversions ----------
  const narrowFn = (t) => {
    if (t.k === 'enum') return (v) => v | 0;
    if (t.name === '_Bool') return (v) => (v !== 0 ? 1 : 0);
    switch (t.size) {
      case 1: return t.signed ? (v) => (v << 24) >> 24 : (v) => v & 255;
      case 2: return t.signed ? (v) => (v << 16) >> 16 : (v) => v & 65535;
      default: return t.signed ? (v) => v | 0 : (v) => v >>> 0;
    }
  };
  const isBoolT = (t) => t.k === 'int' && t.name === '_Bool';
  const f2i = (v) => { const x = Math.trunc(v); return Number.isFinite(x) && x >= -2147483648 && x <= 2147483647 ? x : -2147483648; };
  const f2u = (v) => { const x = Math.trunc(v); if (x >= 0 && x < TWO32) return x; if (Number.isFinite(x) && Math.abs(x) < 9.2e18) return Number(BigInt.asUintN(32, BigInt(x))); return 0; };
  const f2l = (v) => { const x = Math.trunc(v); return Number.isFinite(x) && Math.abs(x) < 9.223372036854775e18 ? BigInt(x) : -(2n ** 63n); };

  /** Renvoie une fonction de conversion de valeur (ou null si inutile). */
  function convFn(from, to) {
    from = decay(from);
    if (to.k === 'void') return () => undefined;
    if (from.k === 'enum') from = T.int;
    if (to.k === 'enum') to = T.int;
    if (to.k === 'struct' || from.k === 'struct') return null;
    if (to.k === 'int') {
      if (isBoolT(to)) {
        if (isBoolT(from)) return null;
        if (from.k === 'int' && from.size === 8) return (v) => (v !== 0n ? 1 : 0);
        return (v) => (v !== 0 ? 1 : 0);
      }
      if (to.size === 8) {
        if (from.k === 'int' && from.size === 8) {
          if (from.signed === to.signed) return null;
          return to.signed ? (v) => BigInt.asIntN(64, v) : (v) => BigInt.asUintN(64, v);
        }
        if (from.k === 'int') return (!to.signed && from.signed) ? (v) => BigInt.asUintN(64, BigInt(v)) : (v) => BigInt(v);
        if (from.k === 'float') return to.signed ? f2l : (v) => BigInt.asUintN(64, f2l(v));
        if (from.k === 'ptr') return (v) => BigInt(v);
      }
      const nar = narrowFn(to);
      if (from.k === 'int') {
        if (from.size === 8) return (v) => nar(Number(BigInt.asIntN(32, v)));
        if (from.signed === to.signed && to.size >= from.size) return null;
        if (!from.signed && to.size > from.size) return null;
        return nar;
      }
      if (from.k === 'float') {
        if (!to.signed && to.size === 4) return f2u;
        return (v) => nar(f2i(v));
      }
      if (from.k === 'ptr') return (v) => nar(v % TWO32);
    }
    if (to.k === 'float') {
      const single = to.size === 4;
      if (from.k === 'float') return single && from.size !== 4 ? Math.fround : null;
      if (from.k === 'int' && from.size === 8) return single ? (v) => Math.fround(Number(v)) : (v) => Number(v);
      if (from.k === 'int') return single ? Math.fround : null;
      return (v) => v;
    }
    if (to.k === 'ptr') {
      if (from.k === 'ptr') return null;
      if (from.k === 'int' && from.size === 8) return (v) => Number(BigInt.asUintN(64, v));
      if (from.k === 'int') return (v) => (v < 0 ? v + TWO32 : v);
      return null;
    }
    return null;
  }
  function conv(get, from, to) {
    const f = convFn(from, to);
    if (!f) return get;
    return () => f(get());
  }
  function truthy(E) {
    const t = E.vt;
    const g = E.get;
    if (t.k === 'int' && t.size === 8) return () => g() !== 0n;
    if (!isScalar(t)) error(E.node, `une condition doit être un nombre ou un pointeur, pas ${typeName(t)}`, `used ${typeName(t)} where scalar is required`, 'not-scalar');
    return () => g() !== 0;
  }

  // ---------- types depuis la syntaxe ----------
  function baseType(spec) {
    if (spec.struct) return structType(spec.struct);
    if (spec.enumSpec) return enumType(spec.enumSpec);
    if (spec.typedefName) {
      const s = lookup(spec.typedefName);
      return spec.const ? { ...s.type, const: true } : s.type;
    }
    const w = spec.words;
    if (!w.length) error(spec, 'type manquant dans la déclaration (en C99 il faut toujours écrire le type, par ex. int)', "type defaults to 'int' in declaration", 'missing-type');
    const count = (k) => w.filter((x) => x === k).length;
    const has = (k) => w.includes(k);
    let t;
    const uns = has('unsigned');
    if (has('signed') && uns) error(spec, 'signed et unsigned en même temps', "both 'signed' and 'unsigned' in declaration specifiers");
    if (has('void')) t = T.void;
    else if (has('_Bool')) t = T.bool;
    else if (has('float')) t = T.float;
    else if (has('double')) t = has('long') ? T.ldouble : T.double;
    else if (has('char')) t = uns ? T.uchar : T.char;
    else if (has('short')) t = intType(uns ? 'unsigned short' : 'short');
    else if (count('long') >= 2) t = uns ? T.ullong : T.llong;
    else if (has('long')) t = uns ? T.ulong : T.long;
    else t = uns ? T.uint : T.int;
    const kinds = ['void', '_Bool', 'float', 'double', 'char'].filter(has);
    if (kinds.length > 1 || (kinds.length && has('int') && !['char'].includes(kinds[0]) && kinds[0] !== 'double') || (has('char') && has('int'))) {
      error(spec, `deux types dans la même déclaration (${w.join(' ')})`, 'two or more data types in declaration specifiers', 'two-types');
    }
    return spec.const ? { ...t, const: true } : t;
  }

  function structType(s) {
    const union = s.kind === 'union';
    let st = null;
    if (s.tag) {
      const found = s.fields ? scopes[scopes.length - 1].tags.get(s.tag) : lookupTag(s.tag);
      if (found) {
        if (found.k !== 'struct' || !!found.union !== union) error(s, `« ${s.tag} » déclaré avec un autre genre (struct/union/enum)`, `'${s.tag}' defined as wrong kind of tag`);
        st = found;
      }
    }
    if (!st) {
      st = newStruct(s.tag, union);
      if (s.tag) scopes[scopes.length - 1].tags.set(s.tag, st);
    }
    if (s.fields) {
      if (st.complete) error(s, `redéfinition de « struct ${s.tag} »`, `redefinition of 'struct ${s.tag}'`, 'redefinition');
      const fields = [];
      const names = new Set();
      for (const f of s.fields) {
        const bt = baseType(f.spec);
        if (!f.decl) {
          if (bt.k === 'struct' && !bt.tag) { for (const sub of bt.fields) fields.push({ ...sub }); }
          continue;
        }
        const ft = applyOps(bt, f.decl.ops, f.decl);
        if (ft.k === 'func') error(f.decl, 'un champ de structure ne peut pas être une fonction', `field '${f.decl.name}' declared as a function`);
        if ((ft.k === 'struct' && !ft.complete) || (ft.k === 'array' && ft.len == null)) error(f.decl, `le champ « ${f.decl.name} » a un type incomplet`, `field '${f.decl.name}' has incomplete type`);
        if (ft.k === 'void') error(f.decl, `le champ « ${f.decl.name} » ne peut pas être de type void`, `field '${f.decl.name}' declared void`);
        if (names.has(f.decl.name)) error(f.decl, `champ « ${f.decl.name} » déclaré deux fois`, `duplicate member '${f.decl.name}'`);
        names.add(f.decl.name);
        fields.push({ name: f.decl.name, type: ft });
      }
      layoutStruct(st, fields);
    }
    return st;
  }

  function enumType(e) {
    const t = { k: 'enum', tag: e.tag, size: 4, align: 4, signed: true, rank: 3, name: 'int' };
    if (e.items) {
      let v = 0;
      for (const it of e.items) {
        if (it.value) v = constInt(it.value, 'la valeur d\'une constante enum');
        const prev = scopes[scopes.length - 1].vars.get(it.name);
        if (prev) error(it, `redéclaration de « ${it.name} »`, `redeclaration of enumerator '${it.name}'`, 'redefinition');
        scopes[scopes.length - 1].vars.set(it.name, { kind: 'enumconst', name: it.name, value: v, type: T.int });
        v++;
      }
    }
    return t;
  }

  function constInt(node, what) {
    const E = expr(node);
    if (E.cval === undefined || !isInt(E.vt)) error(node, `${what} doit être une constante entière`, 'expression must be an integer constant', 'not-constant');
    return Number(E.cval);
  }

  function applyOps(t, ops, where, allowVla = false) {
    for (const op of ops) {
      if (op.k === 'ptr') {
        t = ptr(t);
        if (op.const) t = { ...t, const: true };
      } else if (op.k === 'array') {
        if (t.k === 'func') error(where, 'tableau de fonctions interdit', 'declaration as array of functions');
        if (t.k === 'void') error(where, `tableau de void impossible${where.name ? ` (« ${where.name} »)` : ''}`, 'declaration of array of voids');
        if (op.size === null) { t = arrayOf(t, null); continue; }
        const E = expr(op.size);
        if (!isInt(E.vt)) error(op, 'la taille d\'un tableau doit être un entier', `size of array has non-integer type`, 'array-size');
        if (E.cval === undefined) {
          if (!allowVla) error(op, 'la taille d\'un tableau global ou d\'un champ doit être une constante (utilise #define N 10)', 'variably modified at file scope', 'vla-global');
          const g = conv(E.get, E.vt, T.long);
          t = { k: 'array', of: t, len: null, size: 0, align: t.align, vla: g };
          continue;
        }
        const n = Number(E.cval);
        if (n < 0) error(op, `taille de tableau négative (${n})`, 'size of array is negative', 'array-size');
        if (n === 0) warn(op, 'tableau de taille 0', 'ISO C forbids zero-size array', 'zero-array');
        t = arrayOf(t, n);
      } else if (op.k === 'func') {
        if (t.k === 'array') error(where, 'une fonction ne peut pas renvoyer un tableau (renvoie un pointeur)', 'function returns an array');
        if (t.k === 'func') error(where, 'une fonction ne peut pas renvoyer une fonction', 'function returns a function');
        const params = op.params.map((p) => {
          let pt = applyOps(baseType(p.spec), p.decl.ops, p.decl);
          if (pt.k === 'array') pt = { ...ptr(pt.of), fromArray: true };
          if (pt.k === 'func') pt = ptr(pt);
          return pt;
        });
        for (const [i, p] of op.params.entries()) {
          if (params[i].k === 'void') error(p, 'paramètre de type void (pour « aucun paramètre », écris (void) seul)', "'void' must be the only parameter", 'void-param');
        }
        t = funcType(t, params, op.variadic, op.hasProto);
      }
    }
    return t;
  }

  function typeFromName(tn) { return applyOps(baseType(tn.spec), tn.decl.ops, tn.decl); }

  // ---------- fonctions et symboles ----------
  function funcAddr(sym) {
    if (sym.funcAddr === undefined) {
      sym.funcAddr = FUNC_BASE + 16 * funcTable.length;
      funcTable.push(sym);
    }
    return sym.funcAddr;
  }

  function allocLocal(t, name) {
    const agg = t.k === 'array' || t.k === 'struct';
    if (agg) fn.offset += 16;
    const al = Math.max(t.align || 1, 1);
    fn.offset = Math.ceil(fn.offset / al) * al;
    const off = fn.offset;
    fn.offset += Math.max(t.size, 1);
    if (agg) fn.offset += 16;
    fn.info.locals.push({ name, offset: off, size: Math.max(t.size, 1), type: t });
    return off;
  }

  function strLiteral(bytes) {
    const key = bin(bytes);
    let a = strCache.get(key);
    if (a === undefined) {
      a = M.allocStatic(bytes.length + 1, 1, SH_RODATA);
      u8.set(bytes, a);
      u8[a + bytes.length] = 0;
      strCache.set(key, a);
    }
    return a;
  }

  // ---------- expressions ----------
  function mk(node, t, get, extra = {}) {
    const vt = unqual(decay(t));
    return { node, t, vt, get, lv: false, ...extra };
  }

  function lvalue(node, t, addr, extra = {}) {
    let get;
    if (t.k === 'array') get = addr;
    else if (t.k === 'func') get = addr;
    else if (t.k === 'void') get = () => undefined;
    else { const ld = loader(t); get = () => ld(addr()); }
    return { node, t, vt: unqual(decay(t)), get, lv: true, addr, ...extra };
  }

  const isNullConst = (E) => (E.cval !== undefined && isInt(E.vt) && Number(E.cval) === 0) || (E.nullPtr === true);
  const nameOf = (E) => (E.node && E.node.kind === 'id' ? `« ${E.node.name} »` : 'cette expression');

  function fold(E) {
    // évalue à la compilation les expressions constantes
    try {
      const v = E.get();
      E.cval = v;
      const c = v;
      E.get = () => c;
    } catch (e) {
      if (e instanceof RuntimeError) { warn(E.node, 'division par zéro dans une expression constante', 'division by zero', 'div-zero'); return E; }
      throw e;
    }
    return E;
  }

  function expr(node, ctx = {}) {
    const E = exprInner(node, ctx);
    E.node = E.node || node;
    return E;
  }

  function exprInner(node, ctx) {
    switch (node.kind) {
      case 'num': {
        const t = NTYPE[node.ntype];
        let v;
        if (t.k === 'float') v = t.size === 4 ? Math.fround(node.value) : node.value;
        else if (t.size === 8) v = BigInt.asUintN(64, node.value);
        else v = Number(node.value);
        if (t.size === 8 && t.signed) v = BigInt.asIntN(64, v);
        return mk(node, t, () => v, { cval: v });
      }
      case 'char': {
        if (node.multi) warn(node, 'constante caractère contenant plusieurs caractères : un char ne contient qu\'UN caractère. Pour du texte, utilise des guillemets doubles "..."', 'multi-character character constant', 'multichar');
        const v = node.value;
        return mk(node, T.int, () => v, { cval: v, charLit: true });
      }
      case 'str': {
        const a = strLiteral(node.bytes);
        return lvalue(node, arrayOf(T.char, node.bytes.length + 1), () => a, { strLit: node.bytes, addrConst: true });
      }
      case 'id': return identifier(node, ctx);
      case 'binary': return binary(node);
      case 'assign': return assign(node);
      case 'unary': return unary(node);
      case 'postfix': return incdec(node, node.op, false);
      case 'cond': return conditional(node);
      case 'comma': {
        const parts = node.exprs.map((e) => expr(e));
        const gets = parts.map((p) => p.get);
        const last = parts[parts.length - 1];
        return mk(node, last.vt, () => { let v; for (const g of gets) v = g(); return v; });
      }
      case 'call': return call(node);
      case 'index': return index(node);
      case 'member': return member(node);
      case 'cast': return cast(node);
      case 'sizeof': return sizeofExpr(node);
      case 'compound': {
        if (!fn) error(node, 'littéral composé hors fonction non pris en charge', 'compound literal at file scope');
        let t = typeFromName(node.typeName);
        const { ops, len } = initOps(t, node.init, node);
        if (t.k === 'array' && t.len == null) t = arrayOf(t.of, len);
        const off = allocLocal(t, '<littéral>');
        const run = makeInitRunner(t, ops);
        return lvalue(node, t, () => { const a = M.fp + off; run(a); return a; });
      }
      case 'initlist':
        error(node, 'liste entre accolades { } utilisable seulement pour initialiser une déclaration (par ex. int t[3] = {1, 2, 3};)', 'expected expression before \'{\' token', 'initlist-expr');
    }
    error(node, `expression non prise en charge (${node.kind})`, 'unsupported expression');
  }

  function identifier(node, ctx) {
    const sym = lookup(node.name);
    if (!sym) {
      const hdr = FUNC_HEADER[node.name];
      if (hdr) error(node, `« ${node.name} » n'est pas déclaré : il faut #include <${hdr}> au début du fichier`, `'${node.name}' undeclared (first use in this function)`, 'undeclared-header', { name: node.name, header: hdr });
      const sugg = closest(node.name, visibleNames());
      error(node, `« ${node.name} » n'est pas déclaré${sugg ? ` (voulais-tu dire « ${sugg} » ?)` : ' : déclare la variable avant de l\'utiliser (par ex. int ' + node.name + ' = 0;)'}`, `'${node.name}' undeclared (first use in this function)${sugg ? `; did you mean '${sugg}'?` : ''}`, 'undeclared', { name: node.name, suggestion: sugg });
    }
    if (sym.kind === 'typedef') error(node, `« ${node.name} » est un nom de type, pas une variable`, `expected expression before '${node.name}'`, 'type-as-value');
    if (sym.kind === 'enumconst') { const v = sym.value; return mk(node, T.int, () => v, { cval: v }); }
    if (sym.kind === 'func') {
      sym.used = true;
      const a = funcAddr(sym);
      return { node, t: sym.type, vt: ptr(sym.type), get: () => a, lv: false, funcSym: sym, addrConst: true };
    }
    sym.refs = (sym.refs || 0) + 1;
    if (!ctx.noRead) sym.reads = (sym.reads || 0) + 1;
    const t = sym.type;
    if (sym.storage === 'local') {
      const off = sym.offset;
      if (t.vla) {
        const ldp = loader(T.ulong);
        return lvalue(node, t, () => Number(ldp(M.fp + off)), { sym });
      }
      return lvalue(node, t, () => M.fp + off, { sym });
    }
    const a = sym.addr;
    return lvalue(node, t, () => a, { sym, addrConst: t.k === 'array' });
  }

  function requireArith(E, opName) {
    if (!isArith(E.vt)) {
      error(E.node, `l'opérateur ${opName} attend des nombres, pas ${typeName(E.vt)}`, `invalid operands to binary ${opName}`, 'bad-operand', { type: typeName(E.vt) });
    }
  }

  /** Construit l'opération arithmétique pour le type résultat R. */
  function arithOp(op, R, ga, gb, node) {
    const line = node.line;
    const divZero = () => { throw new RuntimeError(`Division entière par zéro (ligne ${line}) : le diviseur vaut 0. Vérifie le diviseur avant de diviser (if (b != 0) ...).`, { code: 'div-zero', line, signal: 'SIGFPE' }); };
    if (R.k === 'float') {
      const single = R.size === 4;
      const f = single ? Math.fround : (x) => x;
      switch (op) {
        case '+': return single ? () => f(ga() + gb()) : () => ga() + gb();
        case '-': return single ? () => f(ga() - gb()) : () => ga() - gb();
        case '*': return single ? () => f(ga() * gb()) : () => ga() * gb();
        case '/': return single ? () => f(ga() / gb()) : () => ga() / gb();
      }
    }
    if (R.size === 8) {
      const w = R.signed ? (v) => BigInt.asIntN(64, v) : (v) => BigInt.asUintN(64, v);
      switch (op) {
        case '+': return () => w(ga() + gb());
        case '-': return () => w(ga() - gb());
        case '*': return () => w(ga() * gb());
        case '/': return () => { const a = ga(), b = gb(); if (b === 0n) divZero(); return w(a / b); };
        case '%': return () => { const a = ga(), b = gb(); if (b === 0n) divZero(); return w(a % b); };
        case '&': return () => w(ga() & gb());
        case '|': return () => w(ga() | gb());
        case '^': return () => w(ga() ^ gb());
      }
    }
    if (R.signed) {
      switch (op) {
        case '+': return () => (ga() + gb()) | 0;
        case '-': return () => (ga() - gb()) | 0;
        case '*': return () => Math.imul(ga(), gb());
        case '/': return () => { const a = ga(), b = gb(); if (b === 0) divZero(); return (a / b) | 0; };
        case '%': return () => { const a = ga(), b = gb(); if (b === 0) divZero(); return (a % b) | 0; };
        case '&': return () => ga() & gb();
        case '|': return () => ga() | gb();
        case '^': return () => ga() ^ gb();
      }
    }
    switch (op) {
      case '+': return () => (ga() + gb()) >>> 0;
      case '-': return () => (ga() - gb()) >>> 0;
      case '*': return () => Math.imul(ga(), gb()) >>> 0;
      case '/': return () => { const a = ga(), b = gb(); if (b === 0) divZero(); return Math.floor(a / b) >>> 0; };
      case '%': return () => { const a = ga(), b = gb(); if (b === 0) divZero(); return (a % b) >>> 0; };
      case '&': return () => (ga() & gb()) >>> 0;
      case '|': return () => (ga() | gb()) >>> 0;
      case '^': return () => (ga() ^ gb()) >>> 0;
    }
    error(node, `opérateur ${op} non pris en charge`, 'unsupported operator');
  }

  function shiftOp(op, R, ga, gb) {
    if (R.size === 8) {
      const w = R.signed ? (v) => BigInt.asIntN(64, v) : (v) => BigInt.asUintN(64, v);
      return op === '<<' ? () => w(ga() << (BigInt(gb()) & 63n)) : () => w(ga() >> (BigInt(gb()) & 63n));
    }
    const nb = (v) => Number(typeof v === 'bigint' ? v & 31n : v & 31);
    if (op === '<<') return R.signed ? () => ga() << nb(gb()) : () => (ga() << nb(gb())) >>> 0;
    return R.signed ? () => ga() >> nb(gb()) : () => ga() >>> nb(gb());
  }

  function compareOp(op, R, ga, gb) {
    switch (op) {
      case '<': return () => (ga() < gb() ? 1 : 0);
      case '>': return () => (ga() > gb() ? 1 : 0);
      case '<=': return () => (ga() <= gb() ? 1 : 0);
      case '>=': return () => (ga() >= gb() ? 1 : 0);
      case '==': return () => (ga() === gb() ? 1 : 0);
      case '!=': return () => (ga() !== gb() ? 1 : 0);
    }
    return null;
  }

  function ptrArith(node, P, I, op, pFirst = true) {
    const pt = P.vt;
    const elem = pt.to;
    if (elem.k === 'struct' && !elem.complete) error(node, 'arithmétique sur un pointeur vers une structure incomplète', 'invalid use of undefined type');
    const size = elem.k === 'void' || elem.k === 'func' ? 1 : elem.size;
    const gp = P.get;
    const gi = I.get;
    const big = is64(I.vt);
    const sign = op === '-' ? -1 : 1;
    void pFirst;
    const get = big ? () => gp() + sign * Number(gi()) * size : () => gp() + sign * gi() * size;
    return mk(node, pt, get, { addrConst: P.addrConst && I.cval !== undefined });
  }

  function binary(node) {
    const op = node.op;
    if (op === '&&' || op === '||') {
      const A = expr(node.left), B = expr(node.right);
      const ta = truthy(A), tb = truthy(B);
      const E = mk(node, T.int, op === '&&' ? () => (ta() && tb() ? 1 : 0) : () => (ta() || tb() ? 1 : 0));
      if (A.cval !== undefined && B.cval !== undefined) fold(E);
      if (op === '||' && B.cval !== undefined && !B.charLit && node.right.kind === 'num' && Number(B.cval) !== 0) {
        info(node, `« || ${B.cval} » est toujours vrai : chaque côté de || doit être une comparaison complète (par ex. x == 1 || x == 2).`, 'or-constant');
      }
      return E;
    }
    const A = expr(node.left), B = expr(node.right);
    const ta = A.vt, tb = B.vt;
    let E;
    if (op === '+' || op === '-') {
      if (isPtr(ta) && isInt(tb)) return ptrArith(node, A, B, op);
      if (op === '+' && isInt(ta) && isPtr(tb)) return ptrArith(node, B, A, op);
      if (op === '-' && isPtr(ta) && isPtr(tb)) {
        if (!sameIgnoringConst(ta.to, tb.to)) error(node, 'soustraction de pointeurs de types différents', 'invalid operands to binary - (have ' + typeName(ta) + ' and ' + typeName(tb) + ')');
        const size = ta.to.size || 1;
        const ga = A.get, gb = B.get;
        return mk(node, T.long, () => BigInt(Math.trunc((ga() - gb()) / size)));
      }
    }
    if (['+', '-', '*', '/', '%'].includes(op)) {
      if (!isArith(ta) || !isArith(tb)) {
        const bad = !isArith(ta) ? A : B;
        let hint = '';
        if (isPtr(bad.vt) && bad.strLit) hint = ' (en C on ne peut pas additionner des chaînes : utilise strcat ou printf)';
        error(node, `opérandes invalides pour ${op} : ${typeName(ta)} et ${typeName(tb)}${hint}`, `invalid operands to binary ${op} (have '${typeName(ta)}' and '${typeName(tb)}')`, 'bad-operands', { left: typeName(ta), right: typeName(tb) });
      }
      if (op === '%' && (!isInt(ta) || !isInt(tb))) {
        error(node, "l'opérateur % (modulo) ne fonctionne qu'avec des entiers (int, long...). Pour des réels, utilise fmod() de <math.h>.", `invalid operands to binary % (have '${typeName(ta)}' and '${typeName(tb)}')`, 'mod-float');
      }
      const R = usualArith(ta, tb);
      if ((op === '/' || op === '%') && isInt(R) && B.cval !== undefined && Number(B.cval) === 0) {
        warn(node, 'division par zéro', 'division by zero [-Wdiv-by-zero]', 'div-zero');
      }
      E = mk(node, R, arithOp(op, R, conv(A.get, ta, R), conv(B.get, tb, R), node));
      if (op === '/' && isInt(ta) && isInt(tb)) E.intDiv = true;
    } else if (op === '&' || op === '|' || op === '^') {
      if (!isInt(ta) || !isInt(tb)) error(node, `l'opérateur ${op} (opération sur les bits) attend des entiers`, `invalid operands to binary ${op}`, 'bad-operands');
      const R = usualArith(ta, tb);
      E = mk(node, R, arithOp(op, R, conv(A.get, ta, R), conv(B.get, tb, R), node));
    } else if (op === '<<' || op === '>>') {
      if (!isInt(ta) || !isInt(tb)) error(node, `l'opérateur ${op} attend des entiers`, `invalid operands to binary ${op}`, 'bad-operands');
      const R = promote(ta);
      E = mk(node, R, shiftOp(op, R, conv(A.get, ta, R), B.get));
    } else {
      // comparaisons
      let ga, gb;
      if (isArith(ta) && isArith(tb)) {
        const R = usualArith(ta, tb);
        if (isInt(R) && !R.signed) {
          const sa = isInt(ta) && promote(ta).signed && !(A.cval !== undefined && Number(A.cval) >= 0);
          const sb = isInt(tb) && promote(tb).signed && !(B.cval !== undefined && Number(B.cval) >= 0);
          if ((sa && !promote(tb).signed) || (sb && !promote(ta).signed)) {
            warn(node, `comparaison entre un entier signé et un entier non signé (${typeName(ta)} et ${typeName(tb)}) : un nombre négatif deviendrait énorme. Utilise le même type des deux côtés (par ex. size_t, ou un cast (int)).`, 'comparison of integer expressions of different signedness [-Wsign-compare]', 'sign-compare');
          }
        }
        ga = conv(A.get, ta, R); gb = conv(B.get, tb, R);
      } else if (isPtr(ta) && isPtr(tb)) {
        if (!sameIgnoringConst(ta.to, tb.to) && !isVoidPtr(ta) && !isVoidPtr(tb)) warn(node, `comparaison de pointeurs de types différents (${typeName(ta)} et ${typeName(tb)})`, 'comparison of distinct pointer types lacks a cast', 'ptr-compare');
        if ((A.strLit || B.strLit) && (op === '==' || op === '!=')) {
          warn(node, 'comparaison avec une chaîne littérale : == compare les adresses, pas le texte ! Utilise strcmp(a, b) == 0 de <string.h>.', 'comparison with string literal results in unspecified behavior [-Waddress]', 'str-compare');
        }
        ga = A.get; gb = B.get;
      } else if (isPtr(ta) && isInt(tb) || isInt(ta) && isPtr(tb)) {
        const intSide = isInt(ta) ? A : B;
        const ptrSide = isPtr(ta) ? A : B;
        if (!isNullConst(intSide)) {
          let hint = '';
          if (ptrSide.strLit && intSide.vt.k === 'int') hint = ' Pour comparer un caractère, utilise des apostrophes : \'a\' et non "a".';
          warn(node, `comparaison entre un pointeur et un entier.${hint}`, 'comparison between pointer and integer', 'ptr-int-compare');
        }
        ga = conv(A.get, ta, T.ulong); gb = conv(B.get, tb, T.ulong);
        if (isPtr(ta)) ga = A.get; else ga = conv(A.get, ta, ptr(T.void));
        if (isPtr(tb)) gb = B.get; else gb = conv(B.get, tb, ptr(T.void));
      } else {
        error(node, `comparaison impossible entre ${typeName(ta)} et ${typeName(tb)}${isStruct(ta) ? ' (on ne compare pas deux structures avec ==, compare leurs champs)' : ''}`, `invalid operands to binary ${op} (have '${typeName(ta)}' and '${typeName(tb)}')`, 'bad-operands');
      }
      E = mk(node, T.int, compareOp(op, null, ga, gb));
    }
    if (A.cval !== undefined && B.cval !== undefined) fold(E);
    return E;
  }

  function checkModifiable(E, what = 'affecter') {
    if (!E.lv) {
      error(E.node, `impossible d'${what} : la partie gauche doit être une variable (une « lvalue »), pas une valeur calculée${E.cval !== undefined ? ' ou un nombre' : ''}`, 'lvalue required as left operand of assignment', 'not-lvalue');
    }
    if (E.t.k === 'array') {
      error(E.node, `impossible d'${what} un tableau entier avec = ${isInt(E.t.of) && E.t.of.size === 1 ? '(pour copier une chaîne, utilise strcpy(dest, source) de <string.h>)' : '(copie les cases une par une avec une boucle)'}`, `assignment to expression with array type`, 'array-assign');
    }
    if (E.t.k === 'func') error(E.node, 'impossible d\'affecter une fonction', 'lvalue required as left operand of assignment', 'not-lvalue');
    if (E.t.const) {
      const nm = E.node.kind === 'id' ? `la variable en lecture seule « ${E.node.name} » (déclarée const)` : 'un emplacement en lecture seule (const)';
      error(E.node, `impossible de modifier ${nm}`, E.node.kind === 'id' ? `assignment of read-only variable '${E.node.name}'` : 'assignment of read-only location', 'const-assign');
    }
  }

  /** Vérifie et convertit une valeur pour une affectation / un passage d'argument. */
  function assignConv(target, E, node, what) {
    const s = E.vt;
    const tt = unqual(target);
    if (tt.k === 'struct') {
      if (s.k !== 'struct' || s.id !== tt.id) error(node, `types incompatibles ${what} : ${typeName(s)} au lieu de ${typeName(tt)}`, `incompatible types when assigning to type '${typeName(tt)}' from type '${typeName(s)}'`, 'incompatible');
      return E.get;
    }
    if (s.k === 'void') error(node, `une valeur void (fonction qui ne renvoie rien) ne peut pas être utilisée ${what}`, 'void value not ignored as it ought to be', 'void-value');
    if (s.k === 'struct') error(node, `types incompatibles ${what} : ${typeName(s)} au lieu de ${typeName(tt)}`, `incompatible types when assigning to type '${typeName(tt)}' from type '${typeName(s)}'`, 'incompatible');
    if (isArith(tt) && isArith(s)) {
      if (isFloat(tt) && E.intDiv) {
        info(node, `Division entière : les deux opérandes de / sont des entiers, donc le résultat est déjà tronqué AVANT d'être rangé dans le ${typeName(tt)}. Écris par ex. (double) a / b ou 7.0 / 2.`, 'int-division');
      }
      if (isInt(tt) && isFloat(s) && E.cval !== undefined && Number.isFinite(E.cval) && Math.trunc(E.cval) !== E.cval) {
        info(node, `La valeur ${E.cval} est tronquée en ${Math.trunc(E.cval)} : un ${typeName(tt)} ne garde pas les décimales.`, 'float-to-int');
      }
      if (isInt(tt) && E.cval !== undefined && isInt(s) && tt.size < 8) {
        const v = Number(E.cval);
        const min = tt.signed ? -(2 ** (tt.size * 8 - 1)) : 0;
        const max = tt.signed ? 2 ** (tt.size * 8 - 1) - 1 : 2 ** (tt.size * 8) - 1;
        if ((v < min || v > max) && !(tt.name === '_Bool') && !(tt.size === 1 && E.charLit)) {
          warn(node, `débordement : ${v} ne tient pas dans un ${typeName(tt)} (valeurs de ${min} à ${max})`, `overflow in conversion from '${typeName(s)}' to '${typeName(tt)}' changes value [-Woverflow]`, 'overflow');
        }
      }
      return conv(E.get, s, tt);
    }
    if (isBoolT(tt) && isPtr(s)) return conv(E.get, s, tt);
    if (isPtr(tt)) {
      if (isPtr(s)) {
        const a = tt.to, b = s.to;
        if (!isVoidPtr(tt) && !isVoidPtr(s) && !sameIgnoringConst(a, b)) {
          error(node, `types de pointeurs incompatibles ${what} : ${typeName(s)} au lieu de ${typeName(tt)}`, `incompatible pointer types (expected '${typeName(tt)}' but argument is of type '${typeName(s)}') [-Wincompatible-pointer-types]`, 'incompatible-pointer', { expected: typeName(tt), got: typeName(s) });
        }
        if (b.const && !a.const && !E.strLit) warn(node, `${what} : l'attribut const est perdu (${typeName(s)} vers ${typeName(tt)})`, "discards 'const' qualifier from pointer target type [-Wdiscarded-qualifiers]", 'discard-const');
        return E.get;
      }
      if (isInt(s)) {
        if (isNullConst(E)) return () => 0;
        error(node, `un entier (${typeName(s)}) est utilisé là où une adresse (${typeName(tt)}) est attendue${E.charLit ? ' : pour du texte, utilise des guillemets doubles "..."' : ' : as-tu oublié le & ?'}`, `makes pointer from integer without a cast [-Wint-conversion]`, 'int-conversion', { expected: typeName(tt), got: typeName(s), charLit: !!E.charLit });
      }
    }
    if (isInt(tt) && isPtr(s)) {
      error(node, `une adresse (${typeName(s)}) est utilisée là où un entier (${typeName(tt)}) est attendu${E.strLit ? ' : une chaîne "..." n\'est pas un nombre. Pour un caractère, utilise des apostrophes \'a\'' : ' (as-tu oublié le * pour lire la valeur pointée ?)'}`, `makes integer from pointer without a cast [-Wint-conversion]`, 'int-conversion', { expected: typeName(tt), got: typeName(s), strLit: !!E.strLit });
    }
    error(node, `types incompatibles ${what} : ${typeName(s)} au lieu de ${typeName(tt)}`, `incompatible types when assigning to type '${typeName(tt)}' from type '${typeName(s)}'`, 'incompatible');
  }

  function assign(node) {
    const simple = node.op === '=';
    const L = expr(node.left, { noRead: node.left.kind === 'id' });
    checkModifiable(L);
    const R = expr(node.right);
    const t = unqual(L.t);
    const st = storer(t);
    const addr = L.addr;
    if (simple) {
      const g = assignConv(t, R, node, 'dans l\'affectation');
      return mk(node, t, () => { const v = g(); st(addr(), v); return v; }, { assignNode: true });
    }
    const op = node.op.slice(0, -1);
    const ld = loader(t);
    if (isPtr(t) && (op === '+' || op === '-')) {
      if (!isInt(R.vt)) error(node, `${node.op} sur un pointeur attend un entier`, 'invalid operands');
      const size = t.to.k === 'void' ? 1 : t.to.size;
      const gi = conv(R.get, R.vt, T.long);
      const sign = op === '-' ? -1 : 1;
      return mk(node, t, () => { const a = addr(); const v = ld(a) + sign * Number(gi()) * size; st(a, v); return v; });
    }
    if (!isArith(t) || !isArith(R.vt)) error(node, `opérandes invalides pour ${node.op} : ${typeName(t)} et ${typeName(R.vt)}`, `invalid operands to binary ${op}`, 'bad-operands');
    if (op === '%' && (!isInt(t) || !isInt(R.vt))) error(node, "%= ne fonctionne qu'avec des entiers", 'invalid operands to binary %', 'mod-float');
    let cell = 0;
    const getL = () => ld(cell);
    let opFn;
    let resT;
    if (op === '<<' || op === '>>') {
      resT = promote(t);
      opFn = shiftOp(op, resT, conv(getL, t, resT), R.get);
    } else {
      if (['&', '|', '^'].includes(op) && (!isInt(t) || !isInt(R.vt))) error(node, `${node.op} attend des entiers`, 'invalid operands', 'bad-operands');
      resT = usualArith(t, R.vt);
      if ((op === '/' || op === '%') && isInt(resT) && R.cval !== undefined && Number(R.cval) === 0) warn(node, 'division par zéro', 'division by zero [-Wdiv-by-zero]', 'div-zero');
      opFn = arithOp(op, resT, conv(getL, t, resT), conv(R.get, R.vt, resT), node);
    }
    const back = conv(opFn, resT, t);
    return mk(node, t, () => { cell = addr(); const v = back(); st(cell, v); return v; });
  }

  function incdec(node, op, prefix) {
    const L = expr(node.arg, { noRead: node.arg.kind === 'id' });
    checkModifiable(L, op === '++' ? 'incrémenter' : 'décrémenter');
    const t = unqual(L.t);
    if (!isScalar(t)) error(node, `${op} impossible sur ${typeName(t)}`, `wrong type argument to ${op === '++' ? 'increment' : 'decrement'}`, 'bad-operand');
    const ld = loader(t);
    const st = storer(t);
    const addr = L.addr;
    let step;
    if (isPtr(t)) {
      const size = t.to.k === 'void' ? 1 : t.to.size;
      step = op === '++' ? (v) => v + size : (v) => v - size;
    } else if (isFloat(t)) {
      const f = t.size === 4 ? Math.fround : (x) => x;
      step = op === '++' ? (v) => f(v + 1) : (v) => f(v - 1);
    } else if (t.size === 8) {
      const w = t.signed ? (v) => BigInt.asIntN(64, v) : (v) => BigInt.asUintN(64, v);
      step = op === '++' ? (v) => w(v + 1n) : (v) => w(v - 1n);
    } else {
      const nar = narrowFn(t);
      step = op === '++' ? (v) => nar(v + 1) : (v) => nar(v - 1);
    }
    if (prefix) return mk(node, t, () => { const a = addr(); const v = step(ld(a)); st(a, v); return v; }, { sideEffect: true });
    return mk(node, t, () => { const a = addr(); const old = ld(a); st(a, step(old)); return old; }, { sideEffect: true });
  }

  function unary(node) {
    const op = node.op;
    if (op === 'pre++' || op === 'pre--') return incdec(node, op.slice(3), true);
    if (op === '&') {
      if (node.arg.kind === 'id') {
        const s = lookup(node.arg.name);
        if (s && s.kind === 'var') s.reads = (s.reads || 0) + 1;
      }
      const A = expr(node.arg, { noRead: true });
      if (A.funcSym) return mk(node, ptr(A.t), A.get, { addrConst: true });
      if (!A.lv) error(node, `& (adresse de) s'applique à une variable, pas à ${A.cval !== undefined ? 'un nombre' : 'une valeur calculée'}`, "lvalue required as unary '&' operand", 'addr-of-rvalue');
      return mk(node, ptr(A.t), A.addr, { addrConst: A.addrConst || (A.sym && A.sym.storage === 'global') });
    }
    const A = expr(node.arg);
    const t = A.vt;
    if (op === '*') {
      if (!isPtr(t)) {
        error(node, `* (contenu de) s'applique à un pointeur, mais ${nameOf(A)} est de type ${typeName(t)}`, `invalid type argument of unary '*' (have '${typeName(t)}')`, 'deref-non-pointer', { type: typeName(t) });
      }
      if (t.to.k === 'void') error(node, 'impossible de lire *p quand p est un void* : convertis-le d\'abord, par ex. *(int *)p', "dereferencing 'void *' pointer", 'deref-void');
      if (t.to.k === 'func') return { ...A, t: t.to, vt: t, lv: false };
      if (t.to.k === 'struct' && !t.to.complete) error(node, 'déréférencement d\'un pointeur vers une structure incomplète', 'dereferencing pointer to incomplete type');
      return lvalue(node, t.to, A.get);
    }
    if (op === '!') {
      const tr = truthy(A);
      const E = mk(node, T.int, () => (tr() ? 0 : 1));
      return A.cval !== undefined ? fold(E) : E;
    }
    if (op === '-' || op === '+') {
      requireArith(A, op);
      const R = promote(t);
      const g = conv(A.get, t, R);
      let get;
      if (op === '+') get = g;
      else if (R.k === 'float') get = () => -g();
      else if (R.size === 8) get = R.signed ? () => BigInt.asIntN(64, -g()) : () => BigInt.asUintN(64, -g());
      else get = R.signed ? () => (-g()) | 0 : () => (-g()) >>> 0;
      const E = mk(node, R, get);
      return A.cval !== undefined ? fold(E) : E;
    }
    if (op === '~') {
      if (!isInt(t)) error(node, '~ attend un entier', "wrong type argument to bit-complement", 'bad-operand');
      const R = promote(t);
      const g = conv(A.get, t, R);
      let get;
      if (R.size === 8) get = R.signed ? () => BigInt.asIntN(64, ~g()) : () => BigInt.asUintN(64, ~g());
      else get = R.signed ? () => ~g() : () => (~g()) >>> 0;
      const E = mk(node, R, get);
      return A.cval !== undefined ? fold(E) : E;
    }
    error(node, `opérateur ${op} inconnu`, 'unknown operator');
  }

  function conditional(node) {
    const C = expr(node.test);
    const tc = truthy(C);
    const A = expr(node.then), B = expr(node.else);
    let R;
    let ga = A.get, gb = B.get;
    if (isArith(A.vt) && isArith(B.vt)) {
      R = usualArith(A.vt, B.vt);
      ga = conv(ga, A.vt, R); gb = conv(gb, B.vt, R);
    } else if (isPtr(A.vt) && isPtr(B.vt)) R = isVoidPtr(A.vt) ? B.vt : A.vt;
    else if (isPtr(A.vt) && isNullConst(B)) { R = A.vt; gb = () => 0; }
    else if (isPtr(B.vt) && isNullConst(A)) { R = B.vt; ga = () => 0; }
    else if (A.vt.k === 'void' && B.vt.k === 'void') R = T.void;
    else if (isStruct(A.vt) && isStruct(B.vt) && A.vt.id === B.vt.id) R = A.vt;
    else error(node, `les deux branches de ? : ont des types incompatibles (${typeName(A.vt)} et ${typeName(B.vt)})`, 'type mismatch in conditional expression', 'ternary-types');
    const E = mk(node, R, () => (tc() ? ga() : gb()));
    if (C.cval !== undefined && A.cval !== undefined && B.cval !== undefined) fold(E);
    return E;
  }

  function cast(node) {
    const t = typeFromName(node.typeName);
    const A = expr(node.arg);
    if (t.k === 'void') { const g = A.get; return mk(node, T.void, () => { g(); }); }
    if (!isScalar(t)) error(node, `conversion (cast) vers ${typeName(t)} impossible : on ne peut convertir que vers un type nombre ou pointeur`, 'conversion to non-scalar type requested', 'bad-cast');
    if (!isScalar(A.vt)) error(node, `impossible de convertir ${typeName(A.vt)} en ${typeName(t)}`, 'aggregate value used where a scalar was expected', 'bad-cast');
    if (isFloat(t) && isPtr(A.vt) || isPtr(t) && isFloat(A.vt)) error(node, 'conversion entre pointeur et nombre réel impossible', 'pointer value used where a floating-point was expected', 'bad-cast');
    if (isPtr(t) && isInt(A.vt) && A.vt.size < 8 && !isNullConst(A)) warn(node, 'conversion d\'un entier de taille différente en pointeur', 'cast to pointer from integer of different size [-Wint-to-pointer-cast]', 'int-to-ptr');
    const E = mk(node, unqual(t), conv(A.get, A.vt, unqual(t)), { addrConst: A.addrConst && isPtr(t) });
    if (A.cval !== undefined && !isPtr(t)) fold(E);
    if (A.cval !== undefined && isPtr(t) && Number(A.cval) === 0) E.nullPtr = true;
    return E;
  }

  function sizeofExpr(node) {
    let t;
    if (node.typeName) t = typeFromName(node.typeName);
    else {
      const A = expr(node.arg, { noRead: true });
      t = A.t;
      if (A.sym && A.sym.fromArrayParam) {
        warn(node, `sizeof sur le paramètre tableau « ${A.node.name} » donne la taille d'un POINTEUR (8 octets), pas celle du tableau : passe la taille en paramètre.`, `'sizeof' on array function parameter '${A.node.name}' will return size of '${typeName(A.t)}' [-Wsizeof-array-argument]`, 'sizeof-array-param');
      }
      if (t.vla) {
        const g = A.sym ? (() => { const off = A.sym.offset; const ld = loader(T.ulong); return () => ld(M.fp + off + 8); })() : () => 0n;
        return mk(node, T.ulong, g);
      }
    }
    if (t.k === 'func') error(node, 'sizeof sur une fonction est interdit', "invalid application of 'sizeof' to a function type");
    if ((t.k === 'struct' && !t.complete) || (t.k === 'array' && t.len == null && !t.vla) || t.k === 'void') {
      if (t.k !== 'void') error(node, `sizeof sur un type incomplet (${typeName(t)})`, "invalid application of 'sizeof' to incomplete type", 'sizeof-incomplete');
    }
    const v = BigInt(t.size);
    return mk(node, T.ulong, () => v, { cval: v });
  }

  function index(node) {
    let A = expr(node.arr), B = expr(node.index);
    if (isInt(A.vt) && isPtr(B.vt)) [A, B] = [B, A];
    if (!isPtr(A.vt)) {
      error(node, `[ ] s'utilise sur un tableau ou un pointeur, mais ${nameOf(A)} est de type ${typeName(A.vt)}`, 'subscripted value is neither array nor pointer nor vector', 'subscript-non-array');
    }
    if (!isInt(B.vt)) error(node, `l'indice d'un tableau doit être un entier, pas ${typeName(B.vt)}`, 'array subscript is not an integer', 'bad-subscript');
    if (B.vt.k === 'int' && B.vt.size === 1 && B.vt.signed && !B.charLit) {
      warn(node, 'indice de tableau de type char', 'array subscript has type \'char\' [-Wchar-subscripts]', 'char-subscript');
    }
    const elem = A.vt.to;
    if (elem.k === 'void') error(node, 'indice sur un pointeur void* impossible', "dereferencing 'void *' pointer", 'deref-void');
    if (A.t.k === 'array' && A.t.len != null && B.cval !== undefined) {
      const k = Number(B.cval);
      if (k < 0 || k >= A.t.len) {
        warn(node, `indice ${k} hors du tableau ${nameOf(A)} qui a ${A.t.len} cases (indices valides : 0 à ${A.t.len - 1})`, `array subscript ${k} is ${k < 0 ? 'below' : 'above'} array bounds of '${typeName(A.t)}' [-Warray-bounds]`, 'array-bounds');
      }
    }
    const size = elem.size;
    const gp = A.get;
    const gi = B.get;
    const addr = is64(B.vt) ? () => gp() + Number(gi()) * size : () => gp() + gi() * size;
    const cst = A.t.const || elem.const;
    const t = cst && !elem.const ? { ...elem, const: true } : elem;
    return lvalue(node, t, addr, { addrConst: A.addrConst && B.cval !== undefined });
  }

  function member(node) {
    const O = expr(node.obj);
    let st;
    let base;
    let isConst = false;
    if (node.arrow) {
      if (!isPtr(O.vt)) {
        error(node, `-> s'utilise avec un pointeur vers une structure, mais ${nameOf(O)} est de type ${typeName(O.vt)}${isStruct(O.vt) ? ' : utilise le point « . » à la place' : ''}`, `invalid type argument of '->' (have '${typeName(O.vt)}')`, 'arrow-non-pointer');
      }
      st = O.vt.to;
      isConst = !!st.const;
      base = O.get;
    } else {
      if (isPtr(O.vt) && isStruct(O.vt.to)) {
        error(node, `${nameOf(O)} est un pointeur : utilise -> au lieu de « . » (ou (*p).${node.name})`, `'${O.node.name || 'p'}' is a pointer; did you mean to use '->'?`, 'dot-on-pointer');
      }
      st = O.t;
      isConst = !!O.t.const;
      if (O.lv) base = O.addr;
      else {
        if (!fn) error(node, 'accès à un champ hors fonction', 'unsupported');
        if (!isStruct(st)) base = null;
        else {
          const off = allocLocal(st, '<temp>');
          const g = O.get;
          const size = st.size;
          base = () => { const a = M.fp + off; u8.set(g(), a); sh.fill(SH_OK, a, a + size); return a; };
        }
      }
    }
    if (!isStruct(st)) error(node, `« .${node.name} » : ${nameOf(O)} n'est pas une structure (type ${typeName(st)})`, `request for member '${node.name}' in something not a structure or union`, 'member-non-struct');
    if (!st.complete) error(node, `structure « ${st.tag} » incomplète (définition manquante ?)`, `invalid use of undefined type '${typeName(st)}'`, 'incomplete-struct');
    const f = st.fields.find((x) => x.name === node.name);
    if (!f) {
      const sugg = closest(node.name, st.fields.map((x) => x.name));
      error(node, `la structure ${typeName(st)} n'a pas de champ « ${node.name} »${sugg ? ` (voulais-tu dire « ${sugg} » ?)` : ''}`, `'${typeName(st)}' has no member named '${node.name}'`, 'no-member', { suggestion: sugg });
    }
    const off = f.offset;
    const ft = isConst && !f.type.const ? { ...f.type, const: true } : f.type;
    const E = lvalue(node, ft, () => base() + off, { addrConst: O.addrConst });
    if (!node.arrow && !O.lv) E.lv = false;
    return E;
  }

  // ---------- appels ----------
  function checkFormat(name, fmtE, args, firstArg, node) {
    if (!fmtE.strLit) return;
    const isScan = name.endsWith('scanf');
    const parts = parseFormat(bin(fmtE.strLit));
    let ai = firstArg;
    const argNo = (k) => k + 1;
    for (const p of parts) {
      if (typeof p === 'string') continue;
      if (p.width === '*' && !isScan) ai++;
      if (p.prec === '*') ai++;
      if (isScan && p.raw.startsWith('%*')) continue;
      const c = p.conv;
      if (!'diouxXcsfFeEgGaApn['.includes(c) || c === '') {
        warn(node, `conversion inconnue « %${c} » dans le format`, `unknown conversion type character '${c}' in format [-Wformat=]`, 'format-unknown');
        continue;
      }
      const A = args[ai];
      if (!A) {
        warn(node, `le format contient « ${p.raw} » mais il manque la valeur correspondante après la virgule`, `format '${p.raw}' expects a matching argument [-Wformat=]`, 'format-missing-arg', { spec: p.raw });
        ai++;
        continue;
      }
      const at = A.vt;
      const longLen = ['l', 'll', 'z', 'j', 't'].includes(p.len);
      let ok = true;
      let expected = '';
      if (!isScan) {
        if ('diouxX'.includes(c)) {
          expected = longLen ? (c === 'd' || c === 'i' ? 'long' : 'unsigned long') : (c === 'd' || c === 'i' ? 'int' : 'unsigned int');
          ok = isInt(at) && (longLen ? at.size === 8 : promote(at).size === 4);
        } else if (c === 'c') { expected = 'int'; ok = isInt(at) && promote(at).size === 4; }
        else if (c === 's') { expected = 'char *'; ok = isPtr(at) && isInt(at.to) && at.to.size === 1; }
        else if ('fFeEgGaA'.includes(c)) { expected = p.len === 'L' ? 'long double' : 'double'; ok = isFloat(at) && (p.len === 'L' ? at.size === 16 : at.size !== 16); }
        else if (c === 'p') { expected = 'void *'; ok = isPtr(at); }
        else if (c === 'n') { ok = isPtr(at); }
      } else {
        if (!isPtr(at)) ok = false;
        const to = isPtr(at) ? at.to : null;
        if ('diouxXn'.includes(c)) {
          const base = c === 'd' || c === 'i' || c === 'n' ? 'int' : 'unsigned int';
          expected = (p.len === 'l' ? (c === 'd' || c === 'i' ? 'long *' : 'unsigned long *') : p.len === 'll' ? 'long long *' : p.len === 'h' ? 'short *' : p.len === 'hh' ? 'char *' : p.len === 'z' ? 'size_t *' : base + ' *');
          const size = p.len === 'l' || p.len === 'll' || p.len === 'z' ? 8 : p.len === 'h' ? 2 : p.len === 'hh' ? 1 : 4;
          if (to) ok = isInt(to) && to.size === size;
        } else if ('fFeEgGaA'.includes(c)) {
          expected = p.len === 'l' ? 'double *' : p.len === 'L' ? 'long double *' : 'float *';
          if (to) ok = isFloat(to) && to.size === (p.len === 'l' ? 8 : p.len === 'L' ? 16 : 4);
        } else if ('cs['.includes(c)) {
          expected = 'char *';
          if (to) ok = isInt(to) && to.size === 1;
        }
      }
      if (!ok) {
        let fr = `« ${p.raw} » attend un ${expected}, mais l'argument ${argNo(ai)} est de type ${typeName(at)}`;
        if (isScan && !isPtr(at) && (A.node.kind === 'id' || A.node.kind === 'member' || A.node.kind === 'index')) fr += ` : as-tu oublié le & devant la variable (par ex. &${A.node.name || 'x'}) ?`;
        else if (isScan && isPtr(at) && at.to.k === 'array') fr += ' : pas de & devant un tableau de char, son nom est déjà une adresse.';
        else if (isScan && ['f', 'e', 'g'].includes(c) && isPtr(at) && isFloat(at.to) && at.to.size === 8) fr += ' : pour lire un double avec scanf, utilise %lf.';
        else if (!isScan && 'fFeEgG'.includes(c) && isInt(at)) fr += ' : pour afficher un entier utilise %d, ou convertis la valeur en double.';
        else if (!isScan && 'di'.includes(c) && isFloat(at)) fr += ' : pour afficher un réel utilise %f (ou %.2f).';
        else if (!isScan && c === 's' && isInt(at)) fr += ' : pour afficher un seul caractère, utilise %c.';
        else if (!isScan && 'di'.includes(c) && isInt(at) && at.size === 8) fr += ` : pour un ${typeName(at)} utilise %ld (ou %zu pour size_t).`;
        warn(A.node, fr, `format '${p.raw}' expects argument of type '${expected}', but argument ${argNo(ai)} has type '${typeName(at)}' [-Wformat=]`, isScan ? 'scanf-format' : 'printf-format', { spec: p.raw, expected, got: typeName(at), scan: isScan });
      }
      ai++;
    }
    if (ai < args.length) {
      warn(args[ai].node, `trop d'arguments pour le format : il y a plus de valeurs que de % dans la chaîne`, 'too many arguments for format [-Wformat-extra-args]', 'format-extra-args');
    }
  }

  function defaultPromote(E) {
    const t = E.vt;
    if (t.k === 'float' && t.size === 4) return { get: conv(E.get, t, T.double), t: T.double };
    if (isInt(t) && promote(t) !== t) return { get: conv(E.get, t, T.int), t: T.int };
    if (t.k === 'enum') return { get: E.get, t: T.int };
    return { get: E.get, t };
  }

  function callUser(fi, vals) {
    if (!fi.body) throw new RuntimeError(`La fonction « ${fi.name} » est appelée mais n'a pas de corps.`, { code: 'undefined-function', line: M.line });
    if (M.frames.length >= M.maxDepth) {
      throw new RuntimeError(`Débordement de pile : trop d'appels imbriqués de « ${fi.name} ». Une fonction récursive doit avoir un cas d'arrêt qui est toujours atteint.`, { code: 'stack-overflow', line: M.line, signal: 'SIGSEGV' });
    }
    const oldFp = M.fp, oldSp = M.sp;
    const fp = Math.ceil(oldSp / 16) * 16 + 16;
    const end = fp + fi.frameSize;
    if (end + 4096 > STACK_END) throw new RuntimeError('Débordement de pile : trop de mémoire locale (tableau local trop grand ou récursion trop profonde).', { code: 'stack-overflow', line: M.line, signal: 'SIGSEGV' });
    u8.fill(0, fp, end);
    sh.fill(0, fp, end);
    const lr = fi.ranges;
    for (let k = 0; k < lr.length; k += 2) sh.fill(SH_UNINIT, fp + lr[k], fp + lr[k] + lr[k + 1]);
    M.fp = fp; M.sp = end;
    M.frames.push({ fn: fi, fp });
    const ps = fi.paramStores;
    for (let k = 0; k < ps.length; k++) ps[k](fp, vals[k]);
    const line = M.line;
    M.retVal = undefined;
    try {
      fi.body();
    } catch (e) {
      if (e instanceof RangeError) throw new RuntimeError(`Débordement de pile : récursion trop profonde dans « ${fi.name} » (cas d'arrêt manquant ?).`, { code: 'stack-overflow', line: M.line, signal: 'SIGSEGV' });
      throw e;
    }
    const rv = M.retVal;
    M.frames.pop();
    sh.fill(SH_DEAD, fp, M.sp);
    M.fp = oldFp; M.sp = oldSp;
    M.line = line;
    return rv;
  }

  function callPtr(addr, vals) {
    const k = (Number(addr) - FUNC_BASE) / 16;
    const sym = funcTable[k];
    if (!Number.isInteger(k) || !sym) {
      throw new RuntimeError(Number(addr) === 0 ? 'Appel d\'un pointeur de fonction NULL.' : 'Appel d\'un pointeur de fonction invalide.', { code: 'bad-call', line: M.line, signal: 'SIGSEGV' });
    }
    if (sym.fi && sym.fi.body) return callUser(sym.fi, vals);
    const b = BUILTINS[sym.name];
    if (!b) throw new RuntimeError(`fonction « ${sym.name} » non définie`, { code: 'undefined-function', line: M.line });
    return b(M, vals, [], { line: M.line, callPtr, fnName: fn ? fn.name : 'main' });
  }

  function call(node) {
    const cal = node.callee;
    let sym = null;
    if (cal.kind === 'id') {
      sym = lookup(cal.name);
      if (!sym) {
        const hdr = FUNC_HEADER[cal.name];
        if (hdr) {
          error(cal, `la fonction « ${cal.name} » est utilisée sans être déclarée : ajoute #include <${hdr}> en haut du programme`, `implicit declaration of function '${cal.name}' [-Wimplicit-function-declaration]; include '<${hdr}>' or provide a declaration of '${cal.name}'`, 'implicit-function', { name: cal.name, header: hdr });
        }
        const cands = [...visibleNames(), ...Object.keys(FUNC_HEADER)];
        const sugg = closest(cal.name, cands);
        error(cal, `la fonction « ${cal.name} » n'existe pas ou n'est pas encore déclarée${sugg ? ` (voulais-tu dire « ${sugg} » ? Le C distingue majuscules et minuscules)` : ' : déclare-la (prototype) avant main, ou définis-la au-dessus'}`, `implicit declaration of function '${cal.name}'${sugg ? `; did you mean '${sugg}'?` : ''} [-Wimplicit-function-declaration]`, 'implicit-function', { name: cal.name, suggestion: sugg });
      }
    }
    const C = expr(cal);
    let ft;
    if (C.t.k === 'func') ft = C.t;
    else if (isPtr(C.vt) && C.vt.to.k === 'func') ft = C.vt.to;
    else error(node, `${nameOf(C)} n'est pas une fonction : on ne peut pas l'appeler avec ( )`, 'called object is not a function or function pointer', 'not-function');
    const name = C.funcSym ? C.funcSym.name : null;
    const args = node.args.map((a) => expr(a));
    const np = ft.params.length;
    if (ft.hasProto) {
      if (args.length < np) error(node, `pas assez d'arguments pour ${name ? `« ${name} »` : 'la fonction'} : ${np} attendu(s), ${args.length} donné(s)`, `too few arguments to function '${name || ''}'`, 'too-few-args', { expected: np, got: args.length });
      if (args.length > np && !ft.variadic) error(node, `trop d'arguments pour ${name ? `« ${name} »` : 'la fonction'} : ${np} attendu(s), ${args.length} donné(s)`, `too many arguments to function '${name || ''}'`, 'too-many-args', { expected: np, got: args.length });
    }
    const gets = [];
    const va = [];
    args.forEach((A, i) => {
      if (A.vt.k === 'void') error(A.node, 'une valeur void (fonction qui ne renvoie rien) ne peut pas servir d\'argument', 'invalid use of void expression', 'void-value');
      if (ft.hasProto && i < np) gets.push(assignConv(ft.params[i], A, A.node, `pour l'argument ${i + 1}${name ? ` de « ${name} »` : ''}`));
      else {
        const pr = defaultPromote(A);
        if (ft.hasProto) va.push(pr); else gets.push(pr.get);
      }
    });
    if (name && ['printf', 'fprintf', 'sprintf', 'snprintf', 'scanf', 'fscanf', 'sscanf'].includes(name) && C.funcSym.builtin) {
      const fi = { printf: 0, scanf: 0, fprintf: 1, fscanf: 1, sprintf: 1, sscanf: 1, snprintf: 2 }[name];
      if (args[fi]) checkFormat(name, args[fi], args, fi + 1, node);
    }
    const ret = ft.ret;
    const line = node.line;
    const ctx = { line, callPtr, fnName: fn ? fn.name : '' };
    const n = gets.length;
    const vaGets = va.map((v) => v.get);
    const vaTypes = va.map((v) => v.t);
    let run;
    if (C.funcSym) {
      const s = C.funcSym;
      s.called = true;
      if (!s.fi) s.fi = { name: s.name, body: null, locals: [], frameSize: 0, ranges: [], paramStores: [] };
      const fi = s.fi;
      const b = s.builtin;
      run = () => {
        const vals = new Array(n);
        for (let k = 0; k < n; k++) vals[k] = gets[k]();
        M.line = line;
        if (fi.body || !b) return callUser(fi, vals);
        const vv = new Array(vaGets.length);
        for (let k = 0; k < vaGets.length; k++) vv[k] = { v: vaGets[k](), t: vaTypes[k] };
        return b(M, vals, vv, ctx);
      };
    } else {
      const gp = C.get;
      run = () => {
        const a = gp();
        const vals = new Array(n);
        for (let k = 0; k < n; k++) vals[k] = gets[k]();
        M.line = line;
        return callPtr(a, vals);
      };
    }
    return mk(node, ret, run, { sideEffect: true, call: name });
  }

  // ---------- initialisation ----------
  /** Calcule les opérations d'initialisation pour un objet de type t. */
  function initOps(t, init, where) {
    const ops = [];
    let maxLen = 0;
    const scalarOp = (type, off, node) => {
      const E = expr(node);
      const g = assignConv(type, E, node, 'dans l\'initialisation');
      ops.push({ off, type, get: g, E });
    };
    const isStrInit = (type, node) => type.k === 'array' && isInt(type.of) && type.of.size === 1 && node.kind === 'str';
    const strOp = (type, off, node) => {
      const bytes = node.bytes;
      if (type.len != null && bytes.length > type.len) {
        warn(node, `chaîne trop longue pour le tableau : ${bytes.length} caractères + '\\0' pour ${type.len} cases`, `initializer-string for array of 'char' is too long`, 'string-too-long');
      }
      const len = type.len == null ? bytes.length + 1 : type.len;
      const data = new Uint8Array(len);
      data.set(bytes.slice(0, len));
      ops.push({ off, str: data });
      return len;
    };
    function object(type, off, node, top) {
      if (node.kind === 'initlist') {
        if (type.k === 'array' || type.k === 'struct') {
          const cur = { i: 0 };
          const n = list(type, off, node.items, cur, true);
          if (cur.i < node.items.length) warn(node.items[cur.i].value, `trop de valeurs dans l'initialisation${type.k === 'array' && type.len != null ? ` (le tableau n'a que ${type.len} cases)` : ''}`, `excess elements in ${type.k === 'array' ? 'array' : 'struct'} initializer`, 'excess-init');
          return n;
        }
        if (!node.items.length) { ops.push({ off, type, get: () => (is64(type) ? 0n : 0) }); return 1; }
        if (node.items.length > 1) warn(node.items[1].value, 'trop de valeurs pour initialiser une variable simple', 'excess elements in scalar initializer', 'excess-init');
        object(type, off, node.items[0].value, false);
        return 1;
      }
      if (isStrInit(type, node)) return strOp(type, off, node);
      if (type.k === 'array') {
        error(node, `un tableau s'initialise avec des accolades { ... }${isInt(type.of) && type.of.size === 1 ? ' ou une chaîne "..."' : ''}`, 'invalid initializer', 'array-init');
      }
      if (type.k === 'struct') {
        const E = expr(node);
        if (!isStruct(E.vt) || E.vt.id !== type.id) error(node, `une structure s'initialise avec des accolades { ... }`, 'invalid initializer', 'struct-init');
        ops.push({ off, type, get: E.get, E });
        return 1;
      }
      scalarOp(type, off, node);
      void top;
      return 1;
    }
    function element(type, off, items, cur) {
      const it = items[cur.i];
      if (it.value.kind === 'initlist' || type.k !== 'array' && type.k !== 'struct' || isStrInit(type, it.value)) {
        cur.i++;
        object(type, off, it.value, false);
        return;
      }
      if (type.k === 'struct') {
        // une expression de même type struct ?
        const probe = it.value.kind !== 'initlist' ? tryType(it.value) : null;
        if (probe && isStruct(probe) && probe.id === type.id) { cur.i++; object(type, off, it.value, false); return; }
      }
      list(type, off, items, cur, false);
    }
    function list(type, off, items, cur, braced) {
      if (type.k === 'array') {
        let k = 0;
        let count = 0;
        const es = type.of.size;
        while (cur.i < items.length) {
          const it = items[cur.i];
          if (it.desig.length) {
            if (!braced) break;
            const d = it.desig[0];
            if (d.index === undefined) error(it.value, `désignateur .${d.field} dans un tableau`, 'field name not in record or union initializer');
            k = constInt(d.index, 'l\'indice du désignateur');
            if (type.len != null && (k < 0 || k >= type.len)) error(it.value, `indice ${k} hors du tableau dans l'initialisation`, 'array index in initializer exceeds array bounds');
            it.desig = it.desig.slice(1);
            if (it.desig.length) { cur.i++; object(type.of, off + k * es, { kind: 'initlist', items: [{ desig: it.desig, value: it.value }] }, false); k++; count = Math.max(count, k); continue; }
          }
          if (type.len != null && k >= type.len) break;
          element(type.of, off + k * es, items, cur);
          k++;
          count = Math.max(count, k);
        }
        return count;
      }
      // structure
      let fi = 0;
      const fields = type.fields;
      while (cur.i < items.length) {
        const it = items[cur.i];
        if (it.desig.length) {
          if (!braced) break;
          const d = it.desig[0];
          if (d.field === undefined) error(it.value, 'désignateur [ ] dans une structure', 'array index in non-array initializer');
          fi = fields.findIndex((f) => f.name === d.field);
          if (fi < 0) error(it.value, `la structure n'a pas de champ « ${d.field} »`, `unknown field '${d.field}' specified in initializer`, 'no-member');
          it.desig = it.desig.slice(1);
          if (it.desig.length) { cur.i++; object(fields[fi].type, off + fields[fi].offset, { kind: 'initlist', items: [{ desig: it.desig, value: it.value }] }, false); fi++; continue; }
        }
        if (fi >= fields.length) break;
        element(fields[fi].type, off + fields[fi].offset, items, cur);
        fi++;
        if (type.union) break;
      }
      return 1;
    }
    maxLen = object(t, 0, init, true);
    void where;
    return { ops, len: maxLen };
  }

  function tryType(node) {
    try { return expr(node).vt; } catch { return null; }
  }

  function makeInitRunner(t, ops) {
    const size = t.size;
    const prepared = ops.map((o) => {
      if (o.str) { const data = o.str; const off = o.off; return (base) => { u8.set(data, base + off); }; }
      const st = storer(unqual(o.type));
      const g = o.get;
      const off = o.off;
      return (base) => st(base + off, g());
    });
    return (base) => {
      u8.fill(0, base, base + size);
      sh.fill(SH_OK, base, base + size);
      for (let k = 0; k < prepared.length; k++) prepared[k](base);
    };
  }

  function isConstInit(E) {
    return E.cval !== undefined || E.addrConst || E.nullPtr || (E.strLit && true);
  }

  // ---------- déclarations ----------
  function declareFunction(name, t, node, spec, isDef) {
    let sym = globalScope.vars.get(name);
    if (sym && sym.kind !== 'func') error(node, `« ${name} » est déjà déclaré comme une variable`, `'${name}' redeclared as different kind of symbol`, 'redefinition');
    if (sym) {
      if (!sameType(sym.type, t) && !(sym.builtin && sym.fromHeader)) {
        error(node, `types contradictoires pour « ${name} » : la déclaration (prototype) et la définition ne correspondent pas (${typeName(sym.type)} contre ${typeName(t)})`, `conflicting types for '${name}'`, 'conflicting-types', { name });
      }
      if (isDef && sym.defined) error(node, `la fonction « ${name} » est définie deux fois`, `redefinition of '${name}'`, 'redefinition');
      if (t.hasProto) sym.type = t;
    } else {
      sym = { kind: 'func', name, type: t, defined: false, fromHeader: !userFile(curFile), builtin: BUILTINS[name] || null, line: node.line };
      globalScope.vars.set(name, sym);
    }
    if (fn && !isDef) {
      // déclaration locale : visible dans la portée courante
      scopes[scopes.length - 1].vars.set(name, sym);
    }
    void spec;
    return sym;
  }

  function declareVar(d, spec, isGlobal, bt) {
    let t = applyOps(bt, d.ops, d, !isGlobal && spec.storage !== 'static');
    const name = d.name;
    curLine(d);
    if (spec.storage === 'typedef') {
      if (scopes[scopes.length - 1].vars.has(name) && scopes[scopes.length - 1].vars.get(name).kind !== 'typedef') error(d, `« ${name} » déjà déclaré`, `'${name}' redeclared as different kind of symbol`, 'redefinition');
      scopes[scopes.length - 1].vars.set(name, { kind: 'typedef', name, type: t });
      return null;
    }
    if (t.k === 'func') {
      declareFunction(name, t, d, spec, false);
      return null;
    }
    if (t.k === 'void') error(d, `la variable « ${name} » ne peut pas être de type void (void = « rien »)`, `variable or field '${name}' declared void`, 'void-var');
    const scope = scopes[scopes.length - 1];
    const prev = scope.vars.get(name);
    if (prev) {
      const sameGlobal = isGlobal && prev.kind === 'var' && sameType(prev.type, t) && (spec.storage === 'extern' || prev.storage === 'global' && (prev.isExtern || !d.init));
      if (!sameGlobal) {
        if (prev.kind === 'var' && sameType(prev.type, t) || prev.kind !== 'var') {
          error(d, `« ${name} » est déjà déclaré${prev.line ? ` (ligne ${prev.line})` : ''} dans ce bloc : une variable ne se déclare qu'une seule fois, ensuite on écrit seulement ${name} = ...;`, `redefinition of '${name}'`, 'redefinition', { name, prevLine: prev.line });
        }
        error(d, `« ${name} » est redéclaré avec un autre type (${typeName(prev.type)} puis ${typeName(t)})`, `conflicting types for '${name}'`, 'conflicting-types', { name });
      }
    }
    if (d.init && d.init.kind !== 'initlist' && t.k === 'array' && t.len == null && d.init.kind === 'str') {
      t = arrayOf(t.of, d.init.bytes.length + 1);
    }
    let ops = null;
    if (d.init) {
      if (spec.storage === 'extern' && !isGlobal) error(d, 'une variable extern ne peut pas être initialisée ici', "'" + name + "' has both 'extern' and initializer");
      if (t.vla) error(d, 'un tableau de taille variable (VLA) ne peut pas être initialisé avec = { ... } : remplis-le avec une boucle', 'variable-sized object may not be initialized', 'vla-init');
      const r = initOps(t, d.init, d);
      ops = r.ops;
      if (t.k === 'array' && t.len == null) t = arrayOf(t.of, r.len);
    }
    if ((t.k === 'array' && t.len == null && !t.vla && spec.storage !== 'extern')) {
      error(d, `taille du tableau « ${name} » inconnue : écris la taille entre crochets (par ex. int ${name}[10];) ou initialise-le`, `array size missing in '${name}'`, 'array-size-missing');
    }
    if (t.k === 'struct' && !t.complete && spec.storage !== 'extern') error(d, `la structure « ${t.tag} » n'est pas définie (as-tu écrit sa définition struct ${t.tag} { ... }; avant ?)`, `storage size of '${name}' isn't known`, 'incomplete-struct');
    const isStatic = isGlobal || spec.storage === 'static' || spec.storage === 'extern';
    const sym = { kind: 'var', name, type: t, line: d.line, col: d.col, storage: isStatic ? 'global' : 'local', isExtern: spec.storage === 'extern', refs: 0, reads: 0, isLocalStatic: !isGlobal && spec.storage === 'static' };
    if (prev && prev.kind === 'var' && isGlobal) {
      // redéclaration compatible (extern + définition) : réutiliser l'adresse
      sym.addr = prev.addr;
      scope.vars.set(name, prev);
      if (ops) {
        const run = makeInitRunner(t, ops);
        const a = prev.addr;
        globalInits.push(() => run(a));
      }
      return null;
    }
    scope.vars.set(name, sym);
    if (isStatic) {
      if (sym.isExtern && SPECIAL_EXTERNS[name]) {
        sym.addr = M.allocStatic(8, 8);
        const v = SPECIAL_EXTERNS[name](M);
        storer(t)(sym.addr, v);
        sym.builtinGlobal = true;
        return null;
      }
      sym.addr = M.allocStatic(Math.max(t.size, 1), t.align);
      M.globals.push({ name, addr: sym.addr, size: t.size, type: t });
      if (ops) {
        for (const o of ops) {
          if (o.E && !isConstInit(o.E)) error(o.E.node, `l'initialisation d'une variable ${isGlobal ? 'globale' : 'static'} doit être une constante (pas un appel de fonction ni une autre variable)`, 'initializer element is not constant', 'global-init-not-constant');
        }
        const run = makeInitRunner(t, ops);
        const a = sym.addr;
        globalInits.push(() => run(a));
      }
      return null;
    }
    // variable locale
    if (t.vla) {
      sym.offset = allocLocal({ ...T.ulong, size: 16, align: 8 }, name);
      const gsize = t.vla;
      const es = t.of.size;
      const off = sym.offset;
      const line = d.line;
      fn.info.locals[fn.info.locals.length - 1].vlaOf = t;
      return () => {
        const n = Number(gsize());
        if (n <= 0) throw new RuntimeError(`Taille de tableau invalide (${n}) pour « ${name} » : la taille doit être strictement positive.`, { code: 'vla-size', line, signal: 'SIGSEGV' });
        const a = Math.ceil((M.sp + 16) / 16) * 16;
        const bytes = n * es;
        if (a + bytes + 4096 > STACK_END) throw new RuntimeError(`Tableau « ${name} » trop grand pour la pile (${bytes} octets).`, { code: 'stack-overflow', line, signal: 'SIGSEGV' });
        M.sp = a + bytes + 16;
        u8.fill(0, a, a + bytes);
        sh.fill(SH_UNINIT, a, a + bytes);
        sh.fill(0, a + bytes, a + bytes + 16);
        const base = M.fp + off;
        dv.setBigUint64(base, BigInt(a), true);
        dv.setBigUint64(base + 8, BigInt(bytes), true);
        sh.fill(SH_OK, base, base + 16);
        M.frames[M.frames.length - 1].vla = true;
      };
    }
    sym.offset = allocLocal(t, name);
    if (!ops) return null;
    const off = sym.offset;
    if (t.k !== 'array' && t.k !== 'struct' && ops.length === 1 && ops[0].off === 0 && ops[0].get) {
      const st = storer(unqual(t));
      const g = ops[0].get;
      return () => st(M.fp + off, g());
    }
    const run = makeInitRunner(t, ops);
    return () => run(M.fp + off);
  }

  const SPECIAL_EXTERNS = {
    stdin: (M2) => M2.stdinH,
    stdout: (M2) => M2.stdoutH,
    stderr: (M2) => M2.stderrH,
  };

  function curLine(node) { void node; }

  function declaration(item, isGlobal) {
    const spec = item.spec;
    if (!item.declarators.length) {
      // struct/enum seul
      baseType(spec);
      return [];
    }
    const runs = [];
    const bt = baseType(spec);
    for (const d of item.declarators) {
      if (!d.name) error(d, 'nom de variable manquant', 'declaration does not declare anything');
      const r = declareVar(d, spec, isGlobal, bt);
      if (r) runs.push(r);
    }
    return runs;
  }

  // ---------- instructions ----------
  function assignInCondition(node) {
    if (node && node.kind === 'assign' && node.op === '=' && !node.paren) {
      warn(node, 'affectation « = » utilisée comme condition : pour comparer, il faut « == ». (Si c\'est voulu, ajoute des parenthèses.)', 'suggest parentheses around assignment used as truth value [-Wparentheses]', 'assign-in-cond');
    }
  }

  function stmt(node) {
    const line = node.line;
    switch (node.kind) {
      case 'block': {
        pushScope();
        const fns = blockItems(node.items);
        popScope();
        return seq(fns);
      }
      case 'empty': return () => 0;
      case 'expr': {
        const E = expr(node.expr);
        checkNoEffect(node.expr, E);
        const g = E.get;
        return () => { M.line = line; M.tick(); g(); return 0; };
      }
      case 'decl': {
        const runs = declaration(node, false);
        if (!runs.length) return () => 0;
        return () => { M.line = line; M.tick(); for (let k = 0; k < runs.length; k++) runs[k](); return 0; };
      }
      case 'if': {
        assignInCondition(node.cond);
        const C = expr(node.cond);
        const c = truthy(C);
        if (node.emptyBody && !node.else) {
          warn(node.semiTok || node, 'le « ; » juste après if (...) termine le if : l\'instruction suivante sera TOUJOURS exécutée. Supprime ce point-virgule.', "suggest braces around empty body in an 'if' statement [-Wempty-body]", 'empty-if');
        }
        const th = stmt(node.then);
        const el = node.else ? stmt(node.else) : null;
        if (el) return () => { M.line = line; M.tick(); return c() ? th() : el(); };
        return () => { M.line = line; M.tick(); return c() ? th() : 0; };
      }
      case 'while': {
        assignInCondition(node.cond);
        const c = truthy(expr(node.cond));
        if (node.emptyBody) warn(node, 'le « ; » juste après while (...) crée une boucle vide : le bloc qui suit n\'en fait pas partie (risque de boucle infinie).', 'this \'while\' clause does not guard... [-Wmisleading-indentation]', 'empty-loop');
        loopDepth.loop++;
        const body = stmt(node.body);
        loopDepth.loop--;
        return () => {
          for (;;) {
            M.tick();
            M.line = line;
            if (!c()) return 0;
            const s = body();
            if (s === BREAK) return 0;
            if (s === RET) return RET;
          }
        };
      }
      case 'do': {
        loopDepth.loop++;
        const body = stmt(node.body);
        loopDepth.loop--;
        assignInCondition(node.cond);
        const c = truthy(expr(node.cond));
        return () => {
          for (;;) {
            M.tick();
            const s = body();
            if (s === BREAK) return 0;
            if (s === RET) return RET;
            M.line = line;
            if (!c()) return 0;
          }
        };
      }
      case 'for': {
        pushScope();
        let init = null;
        if (node.init) {
          if (node.init.kind === 'decl') { const runs = declaration(node.init, false); init = () => { for (const r of runs) r(); }; }
          else { const g = expr(node.init.expr).get; init = g; }
        }
        if (node.cond) assignInCondition(node.cond);
        const c = node.cond ? truthy(expr(node.cond)) : null;
        const step = node.step ? expr(node.step).get : null;
        if (node.emptyBody) warn(node, 'le « ; » juste après for (...) crée une boucle vide : le bloc qui suit sera exécuté une seule fois, après la boucle.', "this 'for' clause does not guard... [-Wmisleading-indentation]", 'empty-loop');
        loopDepth.loop++;
        const body = stmt(node.body);
        loopDepth.loop--;
        popScope();
        return () => {
          M.line = line;
          if (init) init();
          for (;;) {
            M.tick();
            M.line = line;
            if (c && !c()) return 0;
            const s = body();
            if (s === BREAK) return 0;
            if (s === RET) return RET;
            M.line = line;
            if (step) step();
          }
        };
      }
      case 'switch': return switchStmt(node);
      case 'case':
      case 'default':
        error(node, `« ${node.kind} » en dehors d'un switch`, `case label not within a switch statement`, 'case-outside');
        break;
      case 'break':
        if (!loopDepth.loop && !loopDepth.sw) error(node, '« break » en dehors d\'une boucle ou d\'un switch', 'break statement not within loop or switch', 'break-outside');
        return () => BREAK;
      case 'continue':
        if (!loopDepth.loop) error(node, '« continue » en dehors d\'une boucle', 'continue statement not within a loop', 'continue-outside');
        return () => CONT;
      case 'return': {
        const rt = fn.ret;
        if (!node.expr) {
          if (rt.k !== 'void' && fn.name !== 'main') warn(node, `« return; » sans valeur dans la fonction « ${fn.name} » qui doit renvoyer un ${typeName(rt)}`, "'return' with no value, in function returning non-void [-Wreturn-type]", 'return-no-value');
          return () => { M.line = line; M.retVal = undefined; return RET; };
        }
        const E = expr(node.expr);
        if (rt.k === 'void') {
          if (E.vt.k !== 'void') error(node, `la fonction « ${fn.name} » est void : elle ne renvoie rien, donc « return valeur; » est interdit (écris seulement return;)`, "'return' with a value, in function returning void", 'return-value-void');
          const g = E.get;
          return () => { M.line = line; g(); M.retVal = undefined; return RET; };
        }
        if (rt.k === 'ptr' && E.lv && E.sym && E.sym.storage === 'local' && E.t.k === 'array') {
          warn(node, `la fonction renvoie l'adresse du tableau local « ${E.sym.name} », qui disparaît à la fin de la fonction`, 'function returns address of local variable [-Wreturn-local-addr]', 'return-local-addr');
        }
        if (node.expr.kind === 'unary' && node.expr.op === '&' && node.expr.arg.kind === 'id') {
          const s = lookup(node.expr.arg.name);
          if (s && s.storage === 'local') warn(node, `la fonction renvoie l'adresse de la variable locale « ${s.name} », qui disparaît à la fin de la fonction`, 'function returns address of local variable [-Wreturn-local-addr]', 'return-local-addr');
        }
        const g = assignConv(rt, E, node.expr, 'dans le return');
        return () => { M.line = line; M.retVal = g(); return RET; };
      }
    }
    error(node, `instruction non prise en charge (${node.kind})`, 'unsupported statement');
  }

  function checkNoEffect(n, E) {
    if (E.sideEffect || E.assignNode || n.kind === 'call' || n.kind === 'assign' || n.kind === 'comma' || n.kind === 'postfix' || (n.kind === 'unary' && n.op.startsWith('pre')) || n.kind === 'cast') return;
    if (n.kind === 'binary' && (n.op === '==' || n.op === '!=') && n.left.kind === 'id') {
      warn(n, `l'instruction « ${n.left.name} ${n.op} ... ; » ne fait rien : pour affecter une valeur, utilise un seul « = »`, 'statement with no effect [-Wunused-value]', 'no-effect-compare');
      return;
    }
    if (n.kind === 'binary' && (n.op === '&&' || n.op === '||')) return;
    if (n.kind === 'binary' || n.kind === 'id' || n.kind === 'num' || n.kind === 'unary' && n.op !== '*') {
      warn(n, 'cette instruction ne fait rien (son résultat n\'est ni affiché ni rangé dans une variable)', 'statement with no effect [-Wunused-value]', 'no-effect');
    }
  }

  function seq(fns) {
    const n = fns.length;
    if (n === 0) return () => 0;
    if (n === 1) return fns[0];
    if (n === 2) { const [a, b] = fns; return () => a() || b(); }
    return () => {
      for (let k = 0; k < n; k++) { const s = fns[k](); if (s) return s; }
      return 0;
    };
  }

  function blockItems(items) {
    const fns = [];
    for (const it of items) {
      try {
        fns.push(stmt(it));
      } catch (e) {
        if (e instanceof CError) { diag.addError(e, curFile); continue; }
        throw e;
      }
    }
    return fns;
  }

  function switchStmt(node) {
    const E = expr(node.expr);
    if (!isInt(E.vt)) error(node.expr, `switch fonctionne seulement avec des entiers ou des caractères, pas ${typeName(E.vt)}${isPtr(E.vt) ? ' (pour comparer des chaînes, utilise if et strcmp)' : ''}`, 'switch quantity not an integer', 'switch-type');
    const R = promote(E.vt);
    const g = conv(E.get, E.vt, R);
    const items = node.body.kind === 'block' ? node.body.items : [node.body];
    const fns = [];
    const labels = new Map();
    let defaultIdx = -1;
    loopDepth.sw++;
    pushScope();
    // aplatir les étiquettes imbriquées « case 1: case 2: »
    const flat = [];
    for (const it of items) {
      let cur = it;
      while (cur.kind === 'case' || cur.kind === 'default') {
        flat.push({ label: cur });
        cur = cur.stmt;
      }
      flat.push({ stmt: cur });
    }
    let lastWasLabel = false;
    let fallFrom = null;
    for (let k = 0; k < flat.length; k++) {
      const f = flat[k];
      if (f.label) {
        if (fallFrom && !lastWasLabel) {
          warn(fallFrom, 'cette instruction continue dans le « case » suivant (break oublié ?)', 'this statement may fall through [-Wimplicit-fallthrough=]', 'fallthrough');
        }
        fallFrom = null;
        lastWasLabel = true;
        if (f.label.kind === 'default') {
          if (defaultIdx >= 0) error(f.label, 'plusieurs « default » dans le même switch', 'multiple default labels in one switch', 'dup-default');
          defaultIdx = fns.length;
        } else {
          let v;
          try {
            const L = expr(f.label.expr);
            if (L.cval === undefined || !isInt(L.vt)) error(f.label, 'la valeur d\'un case doit être une constante entière (un nombre ou un caractère comme \'a\'), pas une variable', 'case label does not reduce to an integer constant', 'case-not-constant');
            v = convFn(L.vt, R) ? convFn(L.vt, R)(L.cval) : L.cval;
          } catch (e) {
            if (e instanceof CError) { diag.addError(e, curFile); continue; }
            throw e;
          }
          const key = String(v);
          if (labels.has(key)) diag.addError(new CError(`la valeur ${key} apparaît dans deux « case »`, { line: f.label.line, col: f.label.col, file: curFile, gcc: 'duplicate case value', code: 'dup-case' }), curFile);
          labels.set(key, fns.length);
        }
        continue;
      }
      lastWasLabel = false;
      const s = f.stmt;
      if (s.kind === 'empty') continue;
      try { fns.push(stmt(s)); } catch (e) { if (e instanceof CError) { diag.addError(e, curFile); continue; } throw e; }
      fallFrom = (s.kind === 'break' || s.kind === 'return' || s.kind === 'continue' || (s.kind === 'expr' && s.expr.kind === 'call' && s.expr.callee.name === 'exit') || (s.kind === 'block' && endsWithJump(s))) ? null : s;
    }
    popScope();
    loopDepth.sw--;
    const n = fns.length;
    return () => {
      M.line = node.line;
      M.tick();
      const v = g();
      let start = labels.get(String(v));
      if (start === undefined) start = defaultIdx;
      if (start < 0) return 0;
      for (let k = start; k < n; k++) {
        const s = fns[k]();
        if (s === BREAK) return 0;
        if (s) return s;
      }
      return 0;
    };
  }

  function endsWithJump(b) {
    const last = b.items[b.items.length - 1];
    return last && (last.kind === 'break' || last.kind === 'return' || last.kind === 'continue');
  }

  function alwaysReturns(s) {
    if (!s) return false;
    switch (s.kind) {
      case 'return': return true;
      case 'block': return s.items.some((it) => alwaysReturns(it));
      case 'if': return !!s.else && alwaysReturns(s.then) && alwaysReturns(s.else);
      case 'expr': return s.expr.kind === 'call' && s.expr.callee.kind === 'id' && (s.expr.callee.name === 'exit' || s.expr.callee.name === 'abort');
      case 'while': case 'for': {
        const infinite = s.kind === 'for' ? !s.cond || (s.cond.kind === 'num' && Number(s.cond.value) !== 0) : (s.cond.kind === 'num' && Number(s.cond.value) !== 0);
        return infinite && !containsBreak(s.body);
      }
      case 'do': return alwaysReturns(s.body);
      case 'switch': {
        const items = s.body.kind === 'block' ? s.body.items : [];
        const hasDefault = items.some((it) => it.kind === 'default');
        if (!hasDefault || containsBreak(s.body, true)) return false;
        const last = items[items.length - 1];
        return !!last && alwaysReturns(last.kind === 'case' || last.kind === 'default' ? last.stmt : last);
      }
      case 'case': case 'default': return alwaysReturns(s.stmt);
    }
    return false;
  }
  function containsBreak(s, inSwitch = false) {
    if (!s) return false;
    switch (s.kind) {
      case 'break': return true;
      case 'block': return s.items.some((x) => containsBreak(x, inSwitch));
      case 'if': return containsBreak(s.then, inSwitch) || containsBreak(s.else, inSwitch);
      case 'case': case 'default': return containsBreak(s.stmt, inSwitch);
      case 'switch': return false;
      case 'while': case 'for': case 'do': return false;
    }
    return false;
  }

  // ---------- fonctions ----------
  function functionDef(item) {
    const d = item.decl;
    const t = applyOps(baseType(item.spec), d.ops, d);
    const name = d.name;
    if (t.k !== 'func') error(d, 'définition de fonction invalide', 'invalid function definition');
    if (t.ret.k === 'struct' && !t.ret.complete) error(d, 'type de retour incomplet', 'return type is an incomplete type');
    if (name === 'main') {
      if (!(t.ret.k === 'int' && t.ret.name === 'int')) {
        warn(d, `main doit renvoyer un int : écris « int main(void) »`, `return type of 'main' is not 'int' [-Wmain]`, 'main-return');
      }
    }
    const sym = declareFunction(name, t, d, item.spec, true);
    sym.defined = true;
    sym.type = t;
    if (!sym.fi) sym.fi = { name, body: null, locals: [], frameSize: 0, ranges: [], paramStores: [] };
    const fi = sym.fi;
    fi.locals = [];
    fn = { name, ret: t.ret, offset: 0, info: fi, scopeSyms: [], paramSyms: [] };
    pushScope();
    const paramOps = d.params;
    const paramStores = [];
    paramOps.params.forEach((p, i) => {
      const pt = t.params[i];
      const pname = p.decl.name;
      if (!pname) { error(p, `le paramètre ${i + 1} de « ${name} » n'a pas de nom`, 'parameter name omitted', 'param-no-name'); }
      if (scopes[scopes.length - 1].vars.has(pname)) error(p, `deux paramètres s'appellent « ${pname} »`, `redefinition of parameter '${pname}'`, 'redefinition');
      const off = allocLocal(pt, pname);
      const psym = { kind: 'var', name: pname, type: pt, storage: 'local', offset: off, line: p.line, refs: 0, reads: 0, isParam: true, fromArrayParam: !!pt.fromArray };
      scopes[scopes.length - 1].vars.set(pname, psym);
      fn.paramSyms.push(psym);
      const st = storer(unqual(pt));
      paramStores.push((fp, v) => st(fp + off, v));
    });
    const savedLoop = { ...loopDepth };
    loopDepth.loop = 0; loopDepth.sw = 0;
    const fns = blockItems(item.body.items);
    Object.assign(loopDepth, savedLoop);
    let body = seq(fns);
    if (!alwaysReturns(item.body) && t.ret.k !== 'void') {
      if (name === 'main') {
        const b = body;
        const zero = 0;
        body = () => { const s = b(); if (s !== RET) M.retVal = zero; return s; };
      } else {
        warn({ line: item.body.endLine || d.line, col: 1 }, `la fonction « ${name} » peut se terminer sans « return » alors qu'elle doit renvoyer un ${typeName(t.ret)} : ajoute un return dans tous les cas`, 'control reaches end of non-void function [-Wreturn-type]', 'missing-return');
      }
    }
    popScope();
    // variables inutilisées
    for (const s of fn.scopeSyms) {
      if (s.kind !== 'var' || s.isParam || s.name.startsWith('<') || s.storage !== 'local' && !s.isLocalStatic) continue;
      if (!s.refs) warn({ line: s.line, col: s.col }, `variable « ${s.name} » déclarée mais jamais utilisée`, `unused variable '${s.name}' [-Wunused-variable]`, 'unused-variable');
      else if (!s.reads && s.type.k !== 'array' && s.type.k !== 'struct') warn({ line: s.line, col: s.col }, `la variable « ${s.name} » reçoit une valeur qui n'est jamais utilisée`, `variable '${s.name}' set but not used [-Wunused-but-set-variable]`, 'unused-set');
    }
    for (const s of fn.paramSyms) {
      if (!s.refs && name !== 'main') warn({ line: s.line, col: 1 }, `le paramètre « ${s.name} » de « ${name} » n'est jamais utilisé`, `unused parameter '${s.name}' [-Wunused-parameter]`, 'unused-parameter');
    }
    fi.frameSize = Math.ceil((fn.offset + 16) / 16) * 16;
    const ranges = [];
    for (const l of fi.locals) ranges.push(l.offset, l.size);
    fi.ranges = ranges;
    fi.paramStores = paramStores;
    fi.body = body;
    fi.type = t;
    fn = null;
  }

  // ---------- unité de traduction ----------
  for (const unit of units) {
    curFile = unit.file;
    for (const item of unit.ast.items) {
      curFile = item.file || unit.file;
      try {
        if (item.kind === 'funcdef') functionDef(item);
        else {
          const runs = declaration(item, true);
          void runs;
        }
      } catch (e) {
        if (e instanceof CError) { diag.addError(e, curFile); fn = null; while (scopes.length > 1) scopes.pop(); continue; }
        throw e;
      }
    }
  }

  // ---------- édition de liens ----------
  const mainSym = globalScope.vars.get('main');
  if (!mainSym || mainSym.kind !== 'func' || !mainSym.defined) {
    diag.addError(new CError('il n\'y a pas de fonction main : tout programme C doit contenir « int main(void) { ... } »', { line: 0, file: 'main.c', gcc: "undefined reference to `main'", code: 'no-main' }), 'main.c');
  }
  for (const s of globalScope.vars.values()) {
    if (s.kind === 'func' && (s.called || s.used) && !s.defined && !s.builtin) {
      diag.addError(new CError(`la fonction « ${s.name} » est déclarée (prototype) mais jamais définie : écris son corps { ... }`, { line: s.line, file: 'main.c', gcc: `undefined reference to \`${s.name}'`, code: 'undefined-reference', data: { name: s.name } }), 'main.c');
    }
  }

  return {
    run() {
      for (const g of globalInits) g();
      const mt = mainSym.type;
      const args = [];
      if (mt.params.length >= 1) {
        const prog = strLiteral([...new TextEncoder().encode('./programme')]);
        const argv = M.allocStatic(16, 8);
        dv.setBigUint64(argv, BigInt(prog), true);
        dv.setBigUint64(argv + 8, 0n, true);
        args.push(1, argv);
      }
      const r = callUser(mainSym.fi, args.slice(0, mt.params.length));
      return r === undefined ? 0 : Number(r);
    },
  };
}
