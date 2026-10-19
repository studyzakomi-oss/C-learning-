// Préprocesseur : #include, #define (objets et fonctions), #if/#ifdef/#ifndef/#else/#endif.
import { lex } from './lexer.js';
import { CError } from './errors.js';
import { STD_HEADERS } from './headers.js';

/**
 * @param {Record<string,string>} files fichiers virtuels (nom -> contenu)
 * @param {string} mainFile fichier .c à prétraiter
 * @param {{warn:Function}} diag
 * @returns {{tokens:any[], headers:Set<string>}}
 */
export function preprocess(files, mainFile, diag) {
  const macros = new Map();
  const headers = new Set();
  const out = [];
  const onceSeen = new Set();
  macros.set('__STDC__', { body: [num(1)] });
  macros.set('__STDC_VERSION__', { body: [num(199901)] });

  processFile(mainFile, files[mainFile], 0);
  const last = out[out.length - 1];
  out.push({ t: 'eof', v: '', line: last ? last.line + 1 : 1, col: 1, end: 1, file: mainFile, bol: true });
  return { tokens: out, headers };

  function num(v) {
    return { t: 'num', v: BigInt(v), ntype: 'int', line: 0, col: 0, file: '', raw: String(v) };
  }

  function processFile(name, text, depth) {
    if (depth > 30) throw new CError(`#include imbriqués trop profondément (inclusion récursive de « ${name} » ?)`, { file: name, gcc: '#include nested depth 200 exceeds maximum', code: 'include-depth' });
    const toks = lex(text, name);
    const cond = []; // pile : {active, taken, parentActive}
    const active = () => cond.every((c) => c.active);
    let i = 0;
    const input = { toks, i: 0 };
    while (input.i < toks.length) {
      const tok = toks[input.i];
      if (tok.t === 'eof') break;
      if (tok.t === 'punc' && tok.v === '#' && tok.bol) {
        const line = [];
        input.i++;
        while (input.i < toks.length && !toks[input.i].bol && toks[input.i].t !== 'eof') line.push(toks[input.i++]);
        directive(tok, line, cond, active, name, depth);
        continue;
      }
      if (!active()) { input.i++; continue; }
      // ligne normale : collecter jusqu'à la fin des jetons ordinaires et développer les macros
      const seg = [];
      while (input.i < toks.length && toks[input.i].t !== 'eof' && !(toks[input.i].t === 'punc' && toks[input.i].v === '#' && toks[input.i].bol)) {
        seg.push(toks[input.i++]);
      }
      expandInto(seg, out);
      i++;
    }
    if (cond.length) {
      throw new CError('#if/#ifdef/#ifndef sans #endif correspondant', { file: name, line: toks[toks.length - 1].line, gcc: 'unterminated #ifndef', code: 'unterminated-if' });
    }
  }

  function directive(hash, line, cond, active, fname, depth) {
    const at = (t, msg, gcc, code = 'pp') => new CError(msg, { line: t.line, col: t.col, file: t.file, gcc, code });
    if (line.length === 0) return; // directive nulle
    const d = line[0];
    const name = d.v;
    const rest = line.slice(1);
    switch (name) {
      case 'ifdef':
      case 'ifndef': {
        const parentActive = active();
        if (!rest[0] || rest[0].t !== 'id' && rest[0].t !== 'kw') throw at(d, `#${name} doit être suivi d'un nom de macro`, `no macro name given in #${name} directive`);
        const def = macros.has(rest[0].v);
        const v = name === 'ifdef' ? def : !def;
        cond.push({ active: parentActive && v, taken: v, parentActive });
        return;
      }
      case 'if': {
        const parentActive = active();
        const v = parentActive ? evalCond(rest, d) : false;
        cond.push({ active: parentActive && v, taken: v, parentActive });
        return;
      }
      case 'elif': {
        const c = cond[cond.length - 1];
        if (!c) throw at(d, '#elif sans #if', '#elif without #if');
        if (c.taken) { c.active = false; return; }
        const v = c.parentActive ? evalCond(rest, d) : false;
        c.active = c.parentActive && v; c.taken = v;
        return;
      }
      case 'else': {
        const c = cond[cond.length - 1];
        if (!c) throw at(d, '#else sans #if', '#else without #if');
        c.active = c.parentActive && !c.taken; c.taken = true;
        return;
      }
      case 'endif':
        if (!cond.length) throw at(d, '#endif sans #if', '#endif without #if');
        cond.pop();
        return;
    }
    if (!active()) return;
    switch (name) {
      case 'include': {
        if (!rest.length) throw at(d, '#include doit être suivi de <fichier.h> ou "fichier.h"', '#include expects "FILENAME" or <FILENAME>', 'include-syntax');
        let hdr = null;
        let sys = false;
        let consumed = 0;
        if (rest[0].t === 'str') { hdr = rest[0].v; consumed = 1; }
        else if (rest[0].t === 'punc' && rest[0].v === '<') {
          let s = '';
          let k = 1;
          for (; k < rest.length && !(rest[k].t === 'punc' && rest[k].v === '>'); k++) s += (rest[k].space && s ? ' ' : '') + rest[k].v;
          if (k >= rest.length) throw at(rest[0], `#include <${s} : le chevron fermant > manque`, 'missing terminating > character', 'include-syntax');
          hdr = s; sys = true; consumed = k + 1;
        } else {
          throw at(rest[0], `#include doit être suivi de <fichier.h> ou "fichier.h" (as-tu oublié les chevrons < > ?)`, '#include expects "FILENAME" or <FILENAME>', 'include-syntax');
        }
        if (rest.length > consumed) {
          diag.warn(at(rest[consumed], `jetons en trop à la fin de la directive #include (« ${rest[consumed].v} ») : une directive ne se termine pas par ;`, 'extra tokens at end of #include directive', 'include-extra'));
        }
        if (sys && STD_HEADERS[hdr] !== undefined) {
          headers.add(hdr);
          if (onceSeen.has('<' + hdr)) return;
          onceSeen.add('<' + hdr);
          processFile(`<${hdr}>`, STD_HEADERS[hdr], depth + 1);
          return;
        }
        if (files[hdr] !== undefined && !hdr.endsWith('.c') || (!sys && files[hdr] !== undefined)) {
          processFile(hdr, files[hdr], depth + 1);
          return;
        }
        throw at(rest[0], `fichier d'en-tête ${sys ? `<${hdr}>` : `"${hdr}"`} introuvable${sys ? ' (vérifie l\'orthographe, par ex. <stdio.h>)' : ''}`, `${hdr}: No such file or directory`, 'include-missing');
      }
      case 'define': {
        const nt = rest[0];
        if (!nt || (nt.t !== 'id' && nt.t !== 'kw')) throw at(d, '#define doit être suivi d\'un nom', 'macro names must be identifiers', 'define-syntax');
        let body = rest.slice(1);
        let params = null;
        let variadic = false;
        if (body.length && body[0].t === 'punc' && body[0].v === '(' && !body[0].space) {
          params = [];
          let k = 1;
          while (k < body.length && !(body[k].t === 'punc' && body[k].v === ')')) {
            const p = body[k];
            if (p.t === 'punc' && p.v === '...') { variadic = true; params.push('__VA_ARGS__'); }
            else if (p.t === 'id') params.push(p.v);
            else if (!(p.t === 'punc' && p.v === ',')) throw at(p, 'paramètre de macro invalide', 'expected parameter name');
            k++;
          }
          body = body.slice(k + 1);
        }
        if (body.length && body[body.length - 1].t === 'punc' && body[body.length - 1].v === ';' && params === null) {
          diag.hint?.({ line: nt.line, code: 'define-semicolon', name: nt.v });
        }
        macros.set(nt.v, { params, body, variadic, line: nt.line });
        return;
      }
      case 'undef':
        if (rest[0]) macros.delete(rest[0].v);
        return;
      case 'error':
        throw at(d, `#error ${rest.map((t) => t.raw || t.v).join(' ')}`, '#error', 'pp-error');
      case 'warning':
        diag.warn(at(d, `#warning ${rest.map((t) => t.raw || t.v).join(' ')}`, '#warning', 'pp-warning'));
        return;
      case 'pragma':
        if (rest[0] && rest[0].v === 'once') onceSeen.add(fname);
        return;
      case 'line':
        return;
      default:
        throw at(d, `directive de préprocesseur inconnue #${name} (faute de frappe ? ex. #include, #define)`, `invalid preprocessing directive #${name}`, 'pp-unknown');
    }
  }

  function evalCond(toks, d) {
    const pre = [];
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      if (t.t === 'id' && t.v === 'defined') {
        let nameTok;
        if (toks[k + 1] && toks[k + 1].v === '(') { nameTok = toks[k + 2]; k += 3; }
        else { nameTok = toks[k + 1]; k += 1; }
        pre.push({ ...num(macros.has(nameTok?.v) ? 1 : 0), line: t.line });
      } else pre.push(t);
    }
    const ex = [];
    expandInto(pre, ex);
    const vals = ex.map((t) => ((t.t === 'id' || t.t === 'kw') ? { ...num(0) } : t));
    let p = 0;
    const peek = () => vals[p];
    const take = () => vals[p++];
    const isOp = (v) => peek() && peek().t === 'punc' && peek().v === v;
    const prim = () => {
      const t = take();
      if (!t) throw new CError('expression #if incomplète', { line: d.line, file: d.file, gcc: '#if with no expression' });
      if (t.t === 'num') return Number(t.v);
      if (t.t === 'char') return t.v;
      if (t.t === 'punc') {
        if (t.v === '(') { const v = ternary(); take(); return v; }
        if (t.v === '!') return prim() ? 0 : 1;
        if (t.v === '-') return -prim();
        if (t.v === '+') return prim();
        if (t.v === '~') return ~prim();
      }
      throw new CError(`jeton inattendu « ${t.v} » dans #if`, { line: d.line, file: d.file, gcc: 'token is not valid in preprocessor expressions' });
    };
    const levels = [['*', '/', '%'], ['+', '-'], ['<<', '>>'], ['<', '>', '<=', '>='], ['==', '!='], ['&'], ['^'], ['|'], ['&&'], ['||']];
    const bin = (lvl) => {
      if (lvl < 0) return prim();
      let l = bin(lvl - 1);
      while (peek() && peek().t === 'punc' && levels[lvl].includes(peek().v)) {
        const op = take().v;
        const r = bin(lvl - 1);
        switch (op) {
          case '*': l = l * r; break; case '/': l = r ? Math.trunc(l / r) : 0; break; case '%': l = r ? l % r : 0; break;
          case '+': l += r; break; case '-': l -= r; break; case '<<': l <<= r; break; case '>>': l >>= r; break;
          case '<': l = +(l < r); break; case '>': l = +(l > r); break; case '<=': l = +(l <= r); break; case '>=': l = +(l >= r); break;
          case '==': l = +(l === r); break; case '!=': l = +(l !== r); break; case '&': l &= r; break; case '^': l ^= r; break;
          case '|': l |= r; break; case '&&': l = +(l && r); break; case '||': l = +(l || r); break;
        }
      }
      return l;
    };
    const ternary = () => {
      const c = bin(levels.length - 1);
      if (isOp('?')) { take(); const a = ternary(); take(); const b = ternary(); return c ? a : b; }
      return c;
    };
    return !!ternary();
  }

  /** Développe les macros d'une suite de jetons et ajoute le résultat à dst. */
  function expandInto(seg, dst) {
    // pile de jetons à lire (dernier élément = prochain)
    const stack = seg.slice().reverse();
    while (stack.length) {
      const tok = stack.pop();
      if ((tok.t !== 'id' && tok.t !== 'kw') || !macros.has(tok.v) || (tok.hide && tok.hide.has(tok.v))) {
        if (tok.t === 'id' && tok.v === '__LINE__') { dst.push({ ...num(tok.line), line: tok.line, col: tok.col, file: tok.file }); continue; }
        if (tok.t === 'id' && tok.v === '__FILE__') { dst.push({ ...tok, t: 'str', v: tok.file, bytes: Array.from(new TextEncoder().encode(tok.file)) }); continue; }
        dst.push(tok);
        continue;
      }
      const m = macros.get(tok.v);
      const hide = new Set(tok.hide || []);
      hide.add(tok.v);
      const place = (t) => ({ ...t, line: tok.line, col: tok.col, end: tok.end, file: tok.file, bol: false, hide: new Set([...(t.hide || []), ...hide]), fromMacro: tok.v });
      if (m.params === null) {
        for (let k = m.body.length - 1; k >= 0; k--) stack.push(place(m.body[k]));
        continue;
      }
      // macro fonction : il faut une parenthèse ouvrante
      const next = stack[stack.length - 1];
      if (!next || next.t !== 'punc' || next.v !== '(') { dst.push(tok); continue; }
      stack.pop();
      const args = [[]];
      let depth = 1;
      while (true) {
        const t = stack.pop();
        if (!t) throw new CError(`appel de la macro « ${tok.v} » non terminé : il manque )`, { line: tok.line, col: tok.col, file: tok.file, gcc: `unterminated argument list invoking macro "${tok.v}"`, code: 'macro-args' });
        if (t.t === 'punc' && t.v === '(') depth++;
        else if (t.t === 'punc' && t.v === ')') { depth--; if (depth === 0) break; }
        else if (t.t === 'punc' && t.v === ',' && depth === 1 && !(m.variadic && args.length >= m.params.length)) { args.push([]); continue; }
        args[args.length - 1].push(t);
      }
      if (args.length === 1 && args[0].length === 0 && m.params.length === 0) args.length = 0;
      if (args.length !== m.params.length && !(m.variadic && args.length >= m.params.length - 1)) {
        throw new CError(`la macro « ${tok.v} » attend ${m.params.length} argument(s), ${args.length} donné(s)`, { line: tok.line, col: tok.col, file: tok.file, gcc: `macro "${tok.v}" requires ${m.params.length} arguments, but only ${args.length} given`, code: 'macro-args' });
      }
      const expanded = args.map((a) => { const r = []; expandInto(a, r); return r; });
      const body = [];
      for (let k = 0; k < m.body.length; k++) {
        const b = m.body[k];
        if (b.t === 'punc' && b.v === '#' && m.body[k + 1] && m.params.includes(m.body[k + 1].v)) {
          const idx = m.params.indexOf(m.body[k + 1].v);
          const text = (args[idx] || []).map((t, j) => (j && t.space ? ' ' : '') + (t.raw || (t.t === 'str' ? JSON.stringify(t.v) : t.v))).join('');
          body.push({ ...b, t: 'str', v: text, bytes: Array.from(new TextEncoder().encode(text)) });
          k++;
          continue;
        }
        const idx = (b.t === 'id' || b.t === 'kw') ? m.params.indexOf(b.v) : -1;
        if (idx >= 0) body.push(...(expanded[idx] || []));
        else body.push(b);
      }
      for (let k = body.length - 1; k >= 0; k--) stack.push(place(body[k]));
    }
  }
}
