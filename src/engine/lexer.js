// Analyseur lexical C : transforme le texte source en jetons.
import { CError } from './errors.js';

export const KEYWORDS = new Set([
  'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
  'extern', 'float', 'for', 'goto', 'if', 'inline', 'int', 'long', 'register', 'restrict', 'return',
  'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned', 'void',
  'volatile', 'while', '_Bool',
]);

const PUNCTS = [
  '...', '<<=', '>>=',
  '->', '++', '--', '<<', '>>', '<=', '>=', '==', '!=', '&&', '||', '*=', '/=', '%=', '+=', '-=',
  '&=', '^=', '|=', '##',
  '[', ']', '(', ')', '{', '}', '.', '&', '*', '+', '-', '~', '!', '/', '%', '<', '>', '^', '|',
  '?', ':', ';', '=', ',', '#',
];

const ESCAPES = { n: 10, t: 9, r: 13, '0': 0, '\\': 92, "'": 39, '"': 34, a: 7, b: 8, f: 12, v: 11, '?': 63, e: 27 };

const utf8 = new TextEncoder();

/**
 * @param {string} src
 * @param {string} file
 * @returns {Array<{t:string,v:any,line:number,col:number,file:string,bol:boolean,space:boolean,end:number,ntype?:string,bytes?:number[]}>}
 */
export function lex(src, file = 'main.c') {
  const toks = [];
  let i = 0;
  let line = 1;
  let lineStart = 0;
  let bol = true;
  let space = false;
  const n = src.length;
  const err = (msg, gcc, l = line, c = i - lineStart + 1, code = 'lex') => {
    throw new CError(msg, { line: l, col: c, file, gcc, code });
  };

  while (i < n) {
    const ch = src[i];
    if (ch === '\n') { line++; i++; lineStart = i; bol = true; space = false; continue; }
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\f' || ch === '\v') { i++; space = true; continue; }
    if (ch === '\\' && (src[i + 1] === '\n' || (src[i + 1] === '\r' && src[i + 2] === '\n'))) {
      i += src[i + 1] === '\r' ? 3 : 2; line++; lineStart = i; continue;
    }
    if (ch === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++;
      space = true;
      continue;
    }
    if (ch === '/' && src[i + 1] === '*') {
      const sl = line, sc = i - lineStart + 1;
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n') { line++; lineStart = i + 1; }
        i++;
      }
      if (i >= n) err('commentaire /* ... */ jamais fermé : il manque */', 'unterminated comment', sl, sc, 'unterminated-comment');
      i += 2;
      space = true;
      continue;
    }
    const col = i - lineStart + 1;
    const start = i;
    const push = (t, v, extra) => {
      const tok = { t, v, line, col, file, bol, space, end: i - lineStart + 1, ...extra };
      toks.push(tok);
      bol = false; space = false;
      return tok;
    };
    // identifiants
    if (/[A-Za-z_]/.test(ch)) {
      while (i < n && /[A-Za-z0-9_]/.test(src[i])) i++;
      const word = src.slice(start, i);
      push(KEYWORDS.has(word) ? 'kw' : 'id', word);
      continue;
    }
    // nombres
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      const m = /^(0[xX][0-9a-fA-F]+|(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][+-]?[0-9]+)?)([a-zA-Z_0-9]*)/.exec(src.slice(i));
      const body = m[1];
      const suffix = m[2];
      i += m[0].length;
      const isFloat = !/^0[xX]/.test(body) && /[.eE]/.test(body);
      if (isFloat) {
        const s = suffix.toLowerCase();
        if (s !== '' && s !== 'f' && s !== 'l') err(`suffixe « ${suffix} » invalide sur la constante ${body}`, `invalid suffix "${suffix}" on floating constant`, line, col, 'bad-number');
        push('num', parseFloat(body), { ntype: s === 'f' ? 'float' : 'double', raw: m[0] });
      } else {
        const s = suffix.toLowerCase();
        if (!/^(u|l|ul|lu|ll|ull|llu)?$/.test(s)) err(`suffixe « ${suffix} » invalide sur la constante entière ${body}`, `invalid suffix "${suffix}" on integer constant`, line, col, 'bad-number');
        let big;
        if (/^0[xX]/.test(body)) big = BigInt(body);
        else if (/^0[0-7]+$/.test(body)) big = BigInt('0o' + body.slice(1));
        else if (/^0[0-9]+$/.test(body)) err(`chiffre invalide dans la constante octale ${body} (un nombre qui commence par 0 est en base 8)`, `invalid digit in octal constant`, line, col, 'bad-number');
        else big = BigInt(body);
        const unsigned = s.includes('u');
        const longs = (s.match(/l/g) || []).length;
        const decimal = !/^0/.test(body) || body === '0';
        let ntype;
        if (longs === 0 && big <= (unsigned ? 0xFFFFFFFFn : 0x7FFFFFFFn)) ntype = unsigned ? 'uint' : 'int';
        else if (longs === 0 && !unsigned && !decimal && big <= 0xFFFFFFFFn) ntype = 'uint';
        else if (big <= 0x7FFFFFFFFFFFFFFFn && !unsigned) ntype = longs === 2 ? 'llong' : 'long';
        else ntype = longs === 2 ? 'ullong' : 'ulong';
        push('num', big, { ntype, raw: m[0] });
      }
      continue;
    }
    // caractères
    if (ch === "'") {
      i++;
      const vals = [];
      while (i < n && src[i] !== "'") {
        if (src[i] === '\n') err("caractère non terminé : il manque l'apostrophe fermante '", 'missing terminating \' character', line, col, 'unterminated-char');
        vals.push(...readChar());
      }
      if (i >= n) err("caractère non terminé : il manque l'apostrophe fermante '", 'missing terminating \' character', line, col, 'unterminated-char');
      i++;
      if (vals.length === 0) err("caractère vide '' : un char doit contenir exactement un caractère", 'empty character constant', line, col, 'empty-char');
      let v;
      if (vals.length === 1) v = (vals[0] << 24) >> 24;
      else {
        v = 0;
        for (const b of vals) v = ((v << 8) | b) | 0;
      }
      push('char', v, { multi: vals.length > 1, raw: src.slice(start, i) });
      continue;
    }
    // chaînes
    if (ch === '"') {
      i++;
      const bytes = [];
      while (i < n && src[i] !== '"') {
        if (src[i] === '\n') err('chaîne non terminée : il manque le guillemet fermant "', 'missing terminating " character', line, col, 'unterminated-string');
        bytes.push(...readChar());
      }
      if (i >= n) err('chaîne non terminée : il manque le guillemet fermant "', 'missing terminating " character', line, col, 'unterminated-string');
      i++;
      push('str', src.slice(start + 1, i - 1), { bytes });
      continue;
    }
    // ponctuation
    let p = null;
    for (const cand of PUNCTS) {
      if (src.startsWith(cand, i)) { p = cand; break; }
    }
    if (p) {
      i += p.length;
      push('punc', p);
      continue;
    }
    err(`caractère inattendu « ${ch} » dans le programme`, `stray '${ch}' in program`, line, col, 'stray');
  }
  toks.push({ t: 'eof', v: '', line, col: i - lineStart + 1, file, bol: true, space: false, end: i - lineStart + 1 });
  return toks;

  // lit un caractère (éventuellement échappé) et renvoie ses octets UTF-8
  function readChar() {
    const c = src[i];
    if (c === '\\') {
      const e = src[i + 1];
      if (e === 'x') {
        const m = /^[0-9a-fA-F]+/.exec(src.slice(i + 2));
        if (!m) err('séquence \\x sans chiffre hexadécimal', '\\x used with no following hex digits');
        i += 2 + m[0].length;
        return [parseInt(m[0], 16) & 255];
      }
      if (/[0-7]/.test(e)) {
        const m = /^[0-7]{1,3}/.exec(src.slice(i + 1));
        i += 1 + m[0].length;
        return [parseInt(m[0], 8) & 255];
      }
      if (e in ESCAPES) { i += 2; return [ESCAPES[e]]; }
      i += 2;
      return [e.charCodeAt(0) & 255];
    }
    const cp = src.codePointAt(i);
    const s = String.fromCodePoint(cp);
    i += s.length;
    return Array.from(utf8.encode(s));
  }
}
