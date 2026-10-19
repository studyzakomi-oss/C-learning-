// Système de types C (modèle LP64 : int 4 octets, long et pointeurs 8 octets).

const INT_INFO = {
  _Bool: { size: 1, signed: false, rank: 0 },
  char: { size: 1, signed: true, rank: 1 },
  'signed char': { size: 1, signed: true, rank: 1 },
  'unsigned char': { size: 1, signed: false, rank: 1 },
  short: { size: 2, signed: true, rank: 2 },
  'unsigned short': { size: 2, signed: false, rank: 2 },
  int: { size: 4, signed: true, rank: 3 },
  'unsigned int': { size: 4, signed: false, rank: 3 },
  long: { size: 8, signed: true, rank: 4 },
  'unsigned long': { size: 8, signed: false, rank: 4 },
  'long long': { size: 8, signed: true, rank: 5 },
  'unsigned long long': { size: 8, signed: false, rank: 5 },
};

const cache = new Map();
export function intType(name) {
  if (!cache.has(name)) {
    const info = INT_INFO[name];
    cache.set(name, { k: 'int', name, size: info.size, align: info.size, signed: info.signed, rank: info.rank });
  }
  return cache.get(name);
}

export const T = {
  void: { k: 'void', name: 'void', size: 1, align: 1 },
  bool: intType('_Bool'),
  char: intType('char'),
  uchar: intType('unsigned char'),
  short: intType('short'),
  int: intType('int'),
  uint: intType('unsigned int'),
  long: intType('long'),
  ulong: intType('unsigned long'),
  llong: intType('long long'),
  ullong: intType('unsigned long long'),
  float: { k: 'float', name: 'float', size: 4, align: 4 },
  double: { k: 'float', name: 'double', size: 8, align: 8 },
  ldouble: { k: 'float', name: 'long double', size: 16, align: 16 },
};

export const NTYPE = { int: T.int, uint: T.uint, long: T.long, ulong: T.ulong, llong: T.llong, ullong: T.ullong, float: T.float, double: T.double };

export function ptr(to) { return { k: 'ptr', to, size: 8, align: 8 }; }
export function arrayOf(of, len) {
  return { k: 'array', of, len, size: len == null ? 0 : of.size * len, align: of.align };
}
export function funcType(ret, params, variadic, hasProto = true) {
  return { k: 'func', ret, params, variadic, hasProto, size: 1, align: 1 };
}
export function qualified(t, q) {
  if (!q.const) return t;
  if (t.const) return t;
  return { ...t, const: true };
}
export function unqual(t) {
  if (!t.const) return t;
  const c = { ...t };
  delete c.const;
  return c;
}

export const isInt = (t) => t.k === 'int' || t.k === 'enum';
export const isFloat = (t) => t.k === 'float';
export const isArith = (t) => isInt(t) || isFloat(t);
export const isPtr = (t) => t.k === 'ptr';
export const isScalar = (t) => isArith(t) || isPtr(t);
export const isStruct = (t) => t.k === 'struct';
export const is64 = (t) => (t.k === 'int' && t.size === 8);
export const isVoidPtr = (t) => t.k === 'ptr' && t.to.k === 'void';
export const isCharPtr = (t) => t.k === 'ptr' && t.to.k === 'int' && t.to.size === 1;

/** Promotions entières : tout type plus petit que int devient int. */
export function promote(t) {
  if (t.k === 'enum') return T.int;
  if (t.k === 'int' && t.rank < 3) return T.int;
  return t;
}

/** Conversions arithmétiques usuelles. */
export function usualArith(a, b) {
  if (a.k === 'float' || b.k === 'float') {
    if (a.name === 'long double' || b.name === 'long double') return T.ldouble;
    if (a.name === 'double' || b.name === 'double') return T.double;
    if (a.k === 'float' && b.k === 'float') return T.float;
    return a.k === 'float' ? unqual(a) : unqual(b);
  }
  a = promote(a); b = promote(b);
  if (a.name === b.name) return unqual(a);
  if (a.signed === b.signed) return a.rank >= b.rank ? unqual(a) : unqual(b);
  const u = a.signed ? b : a;
  const s = a.signed ? a : b;
  if (u.rank >= s.rank) return unqual(u);
  if (s.size > u.size) return unqual(s);
  return intType('unsigned ' + s.name);
}

export function typeName(t) {
  if (!t) return '?';
  const c = t.const ? 'const ' : '';
  switch (t.k) {
    case 'void': return c + 'void';
    case 'int': return c + (t.name === '_Bool' ? '_Bool' : t.name);
    case 'float': return c + t.name;
    case 'enum': return c + `enum ${t.tag || ''}`.trim();
    case 'struct': return c + `${t.union ? 'union' : 'struct'} ${t.tag || '<anonyme>'}`;
    case 'ptr':
      if (t.to.k === 'func') return `${typeName(t.to.ret)} (*)(${t.to.params.map(typeName).join(', ')})`;
      if (t.to.k === 'array') return `${typeName(t.to.of)} (*)[${t.to.len ?? ''}]`;
      return `${typeName(t.to)} *${t.const ? 'const' : ''}`.replace('* ', '*');
    case 'array': {
      let base = t;
      let dims = '';
      while (base.k === 'array') { dims += `[${base.len ?? ''}]`; base = base.of; }
      return `${typeName(base)}${dims}`;
    }
    case 'func': return `${typeName(t.ret)} (${t.params.map(typeName).join(', ')}${t.variadic ? ', ...' : ''})`;
  }
  return '?';
}

/** Compatibilité de deux types (pour les pointeurs et les prototypes). */
export function sameType(a, b) {
  if (a === b) return true;
  if (a.k !== b.k) return false;
  switch (a.k) {
    case 'void': return true;
    case 'int': case 'float': return a.name === b.name;
    case 'enum': return true;
    case 'struct': return a.id === b.id;
    case 'ptr': return sameType(a.to, b.to) && !!a.to.const === !!b.to.const;
    case 'array': return sameType(a.of, b.of) && (a.len == null || b.len == null || a.len === b.len);
    case 'func':
      if (!sameType(a.ret, b.ret)) return false;
      if (!a.hasProto || !b.hasProto) return true;
      if (a.params.length !== b.params.length || a.variadic !== b.variadic) return false;
      return a.params.every((p, i) => sameType(unqual(p), unqual(b.params[i])));
  }
  return false;
}

/** Ignore const pour comparer les types pointés. */
export function sameIgnoringConst(a, b) {
  return sameType(unqual(a), unqual(b));
}

let structId = 0;
export function newStruct(tag, union) {
  return { k: 'struct', tag, union, id: ++structId, fields: null, size: 0, align: 1, complete: false };
}

/** Calcule la disposition mémoire d'une structure. */
export function layoutStruct(st, fields) {
  let off = 0;
  let align = 1;
  let size = 0;
  for (const f of fields) {
    const a = f.type.align || 1;
    align = Math.max(align, a);
    if (st.union) { f.offset = 0; size = Math.max(size, f.type.size); }
    else {
      off = Math.ceil(off / a) * a;
      f.offset = off;
      off += f.type.size;
      size = off;
    }
  }
  st.fields = fields;
  st.align = align;
  st.size = Math.ceil(size / align) * align || 0;
  st.complete = true;
  return st;
}

export function decay(t) {
  if (t.k === 'array') return ptr(t.of);
  if (t.k === 'func') return ptr(t);
  return t;
}
