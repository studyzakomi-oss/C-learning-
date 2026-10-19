// Bibliothèque standard C implémentée en JavaScript (stdio, stdlib, string, ctype, math, time).
import { RuntimeError, ExitSignal } from './errors.js';
import { parseFormat, formatFloat, formatInt, pad } from './format.js';
import { HEAP_BASE } from './runtime.js';

const enc = new TextEncoder();
const bin = (bytes) => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return s; };
const unbin = (s) => { const a = new Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 255; return a; };
const N = (v) => (typeof v === 'bigint' ? Number(v) : v);
const isSpace = (c) => c === 32 || (c >= 9 && c <= 13);

// ---------- printf ----------
export function formatPrintf(M, fmtAddr, va) {
  const fmt = bin(M.readCString(fmtAddr));
  const parts = parseFormat(fmt);
  // émulation de l'ABI x86-64 : entiers et flottants sont lus dans deux suites séparées
  const ints = [];
  const floats = [];
  for (const a of va) (a.t.k === 'float' ? floats : ints).push(a);
  let ii = 0;
  let fi = 0;
  const nextInt = () => { const a = ints[ii++]; return a ? a.v : 0; };
  const nextFloat = () => { const a = floats[fi++]; return a ? a.v : 0; };
  let out = '';
  for (const p of parts) {
    if (typeof p === 'string') { out += p; continue; }
    const spec = { ...p };
    let width = p.width;
    if (width === '*') { width = N(nextInt()) | 0; if (width < 0) { spec.flags = { ...spec.flags, minus: true }; width = -width; } }
    let prec = p.prec;
    if (prec === '*') { prec = N(nextInt()) | 0; if (prec < 0) prec = null; }
    spec.widthValue = width || 0;
    spec.precValue = prec;
    const big = p.len === 'l' || p.len === 'll' || p.len === 'z' || p.len === 'j' || p.len === 't' || p.len === 'q';
    switch (p.conv) {
      case 'd': case 'i': {
        let v = nextInt();
        if (big) v = typeof v === 'bigint' ? BigInt.asIntN(64, v) : BigInt(Math.trunc(v));
        else {
          v = N(v) | 0;
          if (p.len === 'hh') v = (v << 24) >> 24; else if (p.len === 'h') v = (v << 16) >> 16;
        }
        out += formatInt(v, spec);
        break;
      }
      case 'u': case 'x': case 'X': case 'o': {
        let v = nextInt();
        if (big) v = BigInt.asUintN(64, typeof v === 'bigint' ? v : BigInt(Math.trunc(v)));
        else {
          v = N(v) >>> 0;
          if (p.len === 'hh') v &= 0xFF; else if (p.len === 'h') v &= 0xFFFF;
        }
        out += formatInt(v, spec);
        break;
      }
      case 'c': {
        const v = N(nextInt()) & 255;
        out += pad('', String.fromCharCode(v), spec.widthValue, spec.flags, false);
        break;
      }
      case 's': {
        const a = N(nextInt());
        let s;
        if (a === 0) s = prec != null && prec < 6 ? '' : '(null)';
        else {
          const bytes = M.readCString(a, prec != null ? prec : 1 << 20);
          s = bin(prec != null ? bytes.slice(0, prec) : bytes);
        }
        out += pad('', s, spec.widthValue, spec.flags, false);
        break;
      }
      case 'p': {
        const a = N(nextInt());
        out += pad('', a === 0 ? '(nil)' : '0x' + a.toString(16), spec.widthValue, spec.flags, false);
        break;
      }
      case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': case 'a': case 'A': {
        const v = N(nextFloat());
        const r = formatFloat(v, p.conv, prec == null ? 6 : prec, spec.flags);
        out += pad(r.sign, r.body, spec.widthValue, spec.flags, r.numeric);
        break;
      }
      case 'n':
        break;
      default:
        out += p.raw;
    }
  }
  return unbin(out);
}

// ---------- lecteurs pour scanf ----------
function streamReader(M, h) {
  const hd = M.handles.get(h);
  return {
    peek() {
      if (hd.pos >= hd.data.length) return -1;
      return hd.data[hd.pos];
    },
    get() {
      if (hd.pos >= hd.data.length) { hd.eof = true; return -1; }
      if (hd.kind === 'stdin') M.echoInput(hd.pos);
      return hd.data[hd.pos++];
    },
    unget() { hd.pos--; },
  };
}
function stringReader(bytes) {
  let pos = 0;
  return {
    peek: () => (pos < bytes.length ? bytes[pos] : -1),
    get: () => (pos < bytes.length ? bytes[pos++] : -1),
    unget: () => { pos--; },
  };
}

function storeInt(M, addr, v, len) {
  addr = N(addr);
  if (len === 'hh') { M.chk(addr, 1, true); M.dv.setInt8(addr, Number(BigInt.asIntN(8, v))); }
  else if (len === 'h') { M.chk(addr, 2, true); M.dv.setInt16(addr, Number(BigInt.asIntN(16, v)), true); }
  else if (len === 'l' || len === 'll' || len === 'z' || len === 'j') { M.chk(addr, 8, true); M.dv.setBigInt64(addr, BigInt.asIntN(64, v), true); }
  else { M.chk(addr, 4, true); M.dv.setInt32(addr, Number(BigInt.asIntN(32, v)), true); }
}

export function doScanf(M, rd, fmtAddr, va) {
  const fmt = M.readCString(fmtAddr);
  let ai = 0;
  let assigned = 0;
  let consumed = 0;
  let anyConversion = false;
  const get = () => { const c = rd.get(); if (c >= 0) consumed++; return c; };
  const unget = () => { rd.unget(); consumed--; };
  const skipWs = () => { let c; while ((c = rd.peek()) >= 0 && isSpace(c)) get(); };
  let i = 0;
  const nextArg = () => {
    const a = va[ai++];
    if (!a) throw new RuntimeError('scanf : il manque une variable (avec &) pour un des % du format.', { code: 'scanf-args', line: M.line });
    return a.v;
  };
  while (i < fmt.length) {
    const fc = fmt[i];
    if (isSpace(fc)) { skipWs(); i++; continue; }
    if (fc !== 37) {
      const c = rd.peek();
      if (c < 0) return anyConversion || assigned ? assigned : -1;
      if (c !== fc) return assigned;
      get(); i++; continue;
    }
    i++;
    if (fmt[i] === 37) { skipWs(); const c = rd.peek(); if (c !== 37) return assigned; get(); i++; continue; }
    let suppress = false;
    if (fmt[i] === 42) { suppress = true; i++; }
    let width = 0;
    while (fmt[i] >= 48 && fmt[i] <= 57) width = width * 10 + (fmt[i++] - 48);
    let len = '';
    while ('hlLqjzt'.includes(String.fromCharCode(fmt[i]))) len += String.fromCharCode(fmt[i++]);
    const conv = String.fromCharCode(fmt[i++]);
    const maxw = width || Infinity;
    if (conv !== 'c' && conv !== '[' && conv !== 'n') {
      skipWs();
      if (rd.peek() < 0) return assigned || anyConversion ? assigned : -1;
    }
    anyConversion = true;
    switch (conv) {
      case 'd': case 'i': case 'u': case 'x': case 'X': case 'o': {
        let s = '';
        let c = rd.peek();
        if ((c === 43 || c === 45) && s.length < maxw) { s += String.fromCharCode(get()); c = rd.peek(); }
        let base = conv === 'x' || conv === 'X' ? 16 : conv === 'o' ? 8 : 10;
        if (conv === 'i' && c === 48) {
          base = 8; s += String.fromCharCode(get()); c = rd.peek();
          if (c === 120 || c === 88) { base = 16; get(); c = rd.peek(); s = s.slice(0, -1); }
        }
        const ok = (ch) => (base === 16 ? /[0-9a-fA-F]/ : base === 8 ? /[0-7]/ : /[0-9]/).test(String.fromCharCode(ch));
        let digits = 0;
        while (c >= 0 && ok(c) && s.length < maxw) { s += String.fromCharCode(get()); c = rd.peek(); digits++; }
        if (!digits && !(conv === 'i' && s.endsWith('0'))) return assigned;
        if (!suppress) {
          const neg = s.startsWith('-');
          const body = s.replace(/^[+-]/, '') || '0';
          let v = BigInt(base === 16 ? '0x' + body : base === 8 ? '0o' + body : body);
          if (neg) v = -v;
          storeInt(M, nextArg(), v, len);
          assigned++;
        }
        break;
      }
      case 'f': case 'e': case 'g': case 'E': case 'G': case 'a': {
        let s = '';
        let c = rd.peek();
        const take = () => { s += String.fromCharCode(get()); c = rd.peek(); };
        if ((c === 43 || c === 45) && s.length < maxw) take();
        let digits = 0;
        while (c >= 48 && c <= 57 && s.length < maxw) { take(); digits++; }
        if (c === 46 && s.length < maxw) { take(); while (c >= 48 && c <= 57 && s.length < maxw) { take(); digits++; } }
        if (digits && (c === 101 || c === 69) && s.length < maxw) {
          take();
          if (c === 43 || c === 45) take();
          while (c >= 48 && c <= 57 && s.length < maxw) take();
        }
        if (!digits) {
          // inf / nan
          const rest = [];
          while (c >= 0 && /[a-zA-Z]/.test(String.fromCharCode(c)) && rest.length < 8) { rest.push(get()); c = rd.peek(); }
          const w = bin(rest).toLowerCase();
          if (w === 'inf' || w === 'infinity' || w === 'nan') s += w;
          else { for (let k = 0; k < rest.length; k++) unget(); return assigned; }
        }
        if (!suppress) {
          const v = parseFloat(s.replace(/^\+/, '').replace(/^(-?)inf(inity)?$/, '$1Infinity').replace(/^-?nan$/, 'NaN'));
          const addr = N(nextArg());
          if (len === 'l' || len === 'L') { M.chk(addr, 8, true); M.dv.setFloat64(addr, v, true); }
          else { M.chk(addr, 4, true); M.dv.setFloat32(addr, v, true); }
          assigned++;
        }
        break;
      }
      case 'c': {
        const n = width || 1;
        const bytes = [];
        for (let k = 0; k < n; k++) {
          const c = get();
          if (c < 0) break;
          bytes.push(c);
        }
        if (!bytes.length) return assigned || -1;
        if (!suppress) { M.writeBytes(N(nextArg()), bytes); assigned++; }
        break;
      }
      case 's': {
        const bytes = [];
        let c = rd.peek();
        while (c >= 0 && !isSpace(c) && bytes.length < maxw) { bytes.push(get()); c = rd.peek(); }
        if (!suppress) { M.writeCString(N(nextArg()), bytes); assigned++; }
        break;
      }
      case '[': {
        let neg = false;
        if (fmt[i] === 94) { neg = true; i++; }
        const set = new Set();
        let first = true;
        while (i < fmt.length && (fmt[i] !== 93 || first)) {
          if (fmt[i + 1] === 45 && fmt[i + 2] !== 93 && i + 2 < fmt.length) {
            for (let ch = fmt[i]; ch <= fmt[i + 2]; ch++) set.add(ch);
            i += 3;
          } else set.add(fmt[i++]);
          first = false;
        }
        i++;
        const bytes = [];
        let c = rd.peek();
        while (c >= 0 && (neg ? !set.has(c) : set.has(c)) && bytes.length < maxw) { bytes.push(get()); c = rd.peek(); }
        if (!bytes.length) return c < 0 && !assigned ? -1 : assigned;
        if (!suppress) { M.writeCString(N(nextArg()), bytes); assigned++; }
        break;
      }
      case 'n':
        if (!suppress) storeInt(M, nextArg(), BigInt(consumed), len);
        break;
      default:
        return assigned;
    }
  }
  return assigned;
}

// ---------- fichiers ----------
function handle(M, h, fn) {
  h = N(h);
  if (h === 0) throw new RuntimeError(`${fn}(NULL) : le fichier n'est pas ouvert. fopen a sans doute renvoyé NULL : teste toujours « if (f == NULL) » après fopen.`, { code: 'null-file', line: M.line, signal: 'SIGSEGV' });
  const hd = M.handles.get(h);
  if (!hd) throw new RuntimeError(`${fn} : ce pointeur n'est pas un FILE* valide.`, { code: 'bad-file', line: M.line, signal: 'SIGSEGV' });
  if (!hd.open) throw new RuntimeError(`${fn} : ce fichier a déjà été fermé avec fclose.`, { code: 'closed-file', line: M.line, signal: 'SIGABRT' });
  return hd;
}
function putBytes(M, h, bytes, fn) {
  const hd = handle(M, h, fn);
  if (hd.kind === 'stdout' || hd.kind === 'stderr') { M.write(h, bytes); return; }
  if (!hd.canWrite) { hd.err = true; return -1; }
  if (hd.append) hd.pos = hd.data.length;
  for (const b of bytes) { if (hd.pos < hd.data.length) hd.data[hd.pos] = b; else hd.data.push(b); hd.pos++; }
  hd.dirty = true;
  return bytes.length;
}
export function commitFiles(M) {
  for (const hd of M.handles.values()) {
    if (hd.kind === 'file' && hd.open && hd.dirty) M.files.set(hd.name, Uint8Array.from(hd.data));
  }
}
const readable = (M, h, fn) => {
  const hd = handle(M, h, fn);
  if (hd.kind === 'stdout' || hd.kind === 'stderr' || (hd.kind === 'file' && !hd.canRead)) {
    hd.err = true; return null;
  }
  return hd;
};
function getByte(M, hd) {
  if (hd.pos >= hd.data.length) { hd.eof = true; return -1; }
  if (hd.kind === 'stdin') M.echoInput(hd.pos);
  return hd.data[hd.pos++];
}

// ---------- divers ----------
function parseIntPrefix(bytes, base) {
  let i = 0;
  while (i < bytes.length && isSpace(bytes[i])) i++;
  let neg = false;
  if (bytes[i] === 43 || bytes[i] === 45) { neg = bytes[i] === 45; i++; }
  if ((base === 0 || base === 16) && bytes[i] === 48 && (bytes[i + 1] === 120 || bytes[i + 1] === 88)) { i += 2; base = 16; }
  else if (base === 0 && bytes[i] === 48) base = 8;
  else if (base === 0) base = 10;
  let v = 0n;
  const start = i;
  while (i < bytes.length) {
    const c = bytes[i];
    let d = -1;
    if (c >= 48 && c <= 57) d = c - 48; else if (c >= 97 && c <= 122) d = c - 87; else if (c >= 65 && c <= 90) d = c - 55;
    if (d < 0 || d >= base) break;
    v = v * BigInt(base) + BigInt(d);
    i++;
  }
  return { v: neg ? -v : v, end: i === start ? 0 : i };
}
function parseFloatPrefix(bytes) {
  const s = bin(bytes);
  const m = /^\s*([+-]?(?:\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?|inf(?:inity)?|nan))/i.exec(s);
  if (!m) return { v: 0, end: 0 };
  let t = m[1].toLowerCase();
  let v;
  if (t.includes('inf')) v = t.startsWith('-') ? -Infinity : Infinity;
  else if (t.includes('nan')) v = NaN;
  else v = parseFloat(t);
  return { v, end: m[0].length };
}

const ERRNO_MSG = { 2: 'No such file or directory', 13: 'Permission denied', 22: 'Invalid argument', 12: 'Cannot allocate memory' };

/** Table des fonctions : nom -> (M, args, va, ctx) => valeur */
export const BUILTINS = {
  printf: (M, [fmt], va) => { const b = formatPrintf(M, fmt, va); M.write(M.stdoutH, b); return b.length; },
  fprintf: (M, [h, fmt], va) => { const b = formatPrintf(M, fmt, va); putBytes(M, h, b, 'fprintf'); return b.length; },
  sprintf: (M, [dst, fmt], va) => { const b = formatPrintf(M, fmt, va); M.writeCString(N(dst), b); return b.length; },
  snprintf: (M, [dst, n, fmt], va) => {
    const b = formatPrintf(M, fmt, va);
    const lim = N(n);
    if (lim > 0) M.writeCString(N(dst), b.slice(0, lim - 1));
    return b.length;
  },
  puts: (M, [s]) => { const b = M.readCString(s); M.write(M.stdoutH, [...b, 10]); return 1; },
  putchar: (M, [c]) => { M.write(M.stdoutH, [c & 255]); return c & 255; },
  fputs: (M, [s, h]) => { putBytes(M, h, M.readCString(s), 'fputs'); return 1; },
  fputc: (M, [c, h]) => { putBytes(M, h, [c & 255], 'fputc'); return c & 255; },
  putc: (M, [c, h]) => { putBytes(M, h, [c & 255], 'putc'); return c & 255; },
  getchar: (M) => getByte(M, M.handles.get(M.stdinH)),
  fgetc: (M, [h]) => { const hd = readable(M, h, 'fgetc'); return hd ? getByte(M, hd) : -1; },
  getc: (M, [h]) => { const hd = readable(M, h, 'getc'); return hd ? getByte(M, hd) : -1; },
  ungetc: (M, [c, h]) => { const hd = handle(M, h, 'ungetc'); if (c === -1) return -1; if (hd.pos > 0) hd.pos--; hd.eof = false; return c; },
  fgets: (M, [s, n, h]) => {
    const hd = readable(M, h, 'fgets');
    if (!hd) return 0;
    const lim = n | 0;
    if (lim <= 0) return 0;
    const bytes = [];
    while (bytes.length < lim - 1) {
      const c = getByte(M, hd);
      if (c < 0) break;
      bytes.push(c);
      if (c === 10) break;
    }
    if (!bytes.length) return 0;
    M.writeCString(N(s), bytes);
    return N(s);
  },
  scanf: (M, [fmt], va) => doScanf(M, streamReader(M, M.stdinH), fmt, va),
  fscanf: (M, [h, fmt], va) => { const hd = readable(M, h, 'fscanf'); if (!hd) return -1; return doScanf(M, streamReader(M, N(h)), fmt, va); },
  sscanf: (M, [s, fmt], va) => doScanf(M, stringReader(M.readCString(s)), fmt, va),
  fopen: (M, [name, mode]) => {
    const fname = new TextDecoder().decode(new Uint8Array(M.readCString(name)));
    const m = bin(M.readCString(mode)).replace('b', '');
    if (!/^(r|w|a)\+?$/.test(m)) { M.errno = 22; return 0; }
    const exists = M.files.has(fname);
    if (m[0] === 'r' && !exists) { M.errno = 2; return 0; }
    const openCount = [...M.handles.values()].filter((x) => x.kind === 'file' && x.open).length;
    if (openCount > 20) { M.errno = 24; return 0; }
    let data = m[0] === 'w' ? [] : Array.from(M.files.get(fname) || []);
    const hd = { kind: 'file', name: fname, data, pos: m[0] === 'a' ? data.length : 0, canRead: m[0] === 'r' || m.includes('+'), canWrite: m[0] !== 'r' || m.includes('+'), append: m[0] === 'a', dirty: m[0] !== 'r' };
    if (m[0] === 'w') M.files.set(fname, new Uint8Array(0));
    return M.makeHandle(hd);
  },
  fclose: (M, [h]) => {
    const hd = handle(M, h, 'fclose');
    if (hd.kind === 'file' && hd.dirty) M.files.set(hd.name, Uint8Array.from(hd.data));
    hd.open = false;
    return 0;
  },
  feof: (M, [h]) => (handle(M, h, 'feof').eof ? 1 : 0),
  ferror: (M, [h]) => (handle(M, h, 'ferror').err ? 1 : 0),
  fflush: (M, [h]) => { if (N(h) !== 0) { const hd = handle(M, h, 'fflush'); if (hd.kind === 'file' && hd.dirty) M.files.set(hd.name, Uint8Array.from(hd.data)); } return 0; },
  rewind: (M, [h]) => { const hd = handle(M, h, 'rewind'); hd.pos = 0; hd.eof = false; },
  fseek: (M, [h, off, whence]) => {
    const hd = handle(M, h, 'fseek');
    const o = N(off);
    const base = whence === 0 ? 0 : whence === 1 ? hd.pos : hd.data.length;
    if (base + o < 0) return -1;
    hd.pos = base + o; hd.eof = false;
    return 0;
  },
  ftell: (M, [h]) => BigInt(handle(M, h, 'ftell').pos),
  fread: (M, [ptr, size, n, h]) => {
    const hd = readable(M, h, 'fread');
    if (!hd) return 0n;
    const sz = N(size), cnt = N(n);
    let k = 0;
    for (; k < cnt; k++) {
      if (hd.pos + sz > hd.data.length) { hd.eof = true; break; }
      M.writeBytes(N(ptr) + k * sz, hd.data.slice(hd.pos, hd.pos + sz));
      hd.pos += sz;
    }
    return BigInt(k);
  },
  fwrite: (M, [ptr, size, n, h]) => {
    const total = N(size) * N(n);
    putBytes(M, h, Array.from(M.readBytes(N(ptr), total)), 'fwrite');
    return BigInt(n);
  },
  remove: (M, [name]) => { const f = new TextDecoder().decode(new Uint8Array(M.readCString(name))); if (!M.files.has(f)) { M.errno = 2; return -1; } M.files.delete(f); return 0; },
  rename: (M, [a, b]) => {
    const fa = new TextDecoder().decode(new Uint8Array(M.readCString(a)));
    const fb = new TextDecoder().decode(new Uint8Array(M.readCString(b)));
    if (!M.files.has(fa)) { M.errno = 2; return -1; }
    M.files.set(fb, M.files.get(fa)); M.files.delete(fa); return 0;
  },
  perror: (M, [s]) => {
    const msg = ERRNO_MSG[M.errno || 0] || 'Success';
    const pre = N(s) ? bin(M.readCString(s)) : '';
    M.write(M.stderrH, unbin((pre ? pre + ': ' : '') + msg + '\n'));
  },

  // stdlib
  malloc: (M, [n], va, ctx) => M.malloc(n, ctx.line),
  calloc: (M, [n, s], va, ctx) => M.malloc(N(n) * N(s), ctx.line, true),
  realloc: (M, [p, n], va, ctx) => M.realloc(p, n, ctx.line),
  free: (M, [p], va, ctx) => { M.free(p, ctx.line); },
  exit: (M, [s]) => { throw new ExitSignal(s | 0); },
  abort: (M) => { throw new RuntimeError('abort() appelé : le programme s\'est arrêté volontairement.', { code: 'abort', line: M.line, signal: 'SIGABRT' }); },
  abs: (M, [n]) => (n < 0 ? (-n) | 0 : n),
  labs: (M, [n]) => (n < 0n ? -n : n),
  llabs: (M, [n]) => (n < 0n ? -n : n),
  atoi: (M, [s]) => Number(BigInt.asIntN(32, parseIntPrefix(M.readCString(s), 10).v)),
  atol: (M, [s]) => BigInt.asIntN(64, parseIntPrefix(M.readCString(s), 10).v),
  atof: (M, [s]) => parseFloatPrefix(M.readCString(s)).v,
  strtol: (M, [s, end, base]) => {
    const r = parseIntPrefix(M.readCString(s), base);
    if (N(end)) { M.chk(N(end), 8, true); M.dv.setBigUint64(N(end), BigInt(N(s) + r.end), true); }
    return BigInt.asIntN(64, r.v);
  },
  strtod: (M, [s, end]) => {
    const r = parseFloatPrefix(M.readCString(s));
    if (N(end)) { M.chk(N(end), 8, true); M.dv.setBigUint64(N(end), BigInt(N(s) + r.end), true); }
    return r.v;
  },
  rand: (M) => M.rand(),
  srand: (M, [s]) => { M.srand(s); },
  qsort: (M, [base, n, size, cmp], va, ctx) => {
    const cnt = N(n), sz = N(size), b = N(base);
    if (cnt <= 1) return;
    const items = [];
    for (let k = 0; k < cnt; k++) items.push(M.readBytes(b + k * sz, sz, true));
    if (!M.qsortTmp || M.qsortTmpSize < sz) { M.qsortTmp = M.allocStatic(sz * 2, 16); M.qsortTmpSize = sz; }
    const ta = M.qsortTmp, tb = M.qsortTmp + sz;
    items.sort((x, y) => {
      M.u8.set(x, ta); M.u8.set(y, tb);
      return ctx.callPtr(cmp, [ta, tb]);
    });
    items.forEach((it, k) => M.writeBytes(b + k * sz, it));
  },

  // string
  strlen: (M, [s]) => BigInt(M.readCString(s).length),
  strcpy: (M, [d, s]) => { M.writeCString(N(d), M.readCString(s)); return d; },
  strncpy: (M, [d, s, n]) => {
    const src = M.readCString(s);
    const lim = N(n);
    const out = new Array(lim).fill(0);
    for (let k = 0; k < lim && k < src.length; k++) out[k] = src[k];
    M.writeBytes(N(d), out);
    return d;
  },
  strcat: (M, [d, s]) => { const a = M.readCString(d); M.writeCString(N(d) + a.length, M.readCString(s)); return d; },
  strncat: (M, [d, s, n]) => { const a = M.readCString(d); M.writeCString(N(d) + a.length, M.readCString(s).slice(0, N(n))); return d; },
  strcmp: (M, [a, b]) => cmpBytes(M.readCString(a), M.readCString(b), Infinity),
  strncmp: (M, [a, b, n]) => cmpBytes(M.readCString(a), M.readCString(b), N(n)),
  strchr: (M, [s, c]) => {
    const bytes = M.readCString(s);
    const ch = c & 255;
    if (ch === 0) return N(s) + bytes.length;
    const k = bytes.indexOf(ch);
    return k < 0 ? 0 : N(s) + k;
  },
  strrchr: (M, [s, c]) => {
    const bytes = M.readCString(s);
    const ch = c & 255;
    if (ch === 0) return N(s) + bytes.length;
    const k = bytes.lastIndexOf(ch);
    return k < 0 ? 0 : N(s) + k;
  },
  strstr: (M, [s, sub]) => {
    const a = bin(M.readCString(s));
    const k = a.indexOf(bin(M.readCString(sub)));
    return k < 0 ? 0 : N(s) + k;
  },
  memset: (M, [s, c, n]) => { M.writeBytes(N(s), new Array(N(n)).fill(c & 255)); return s; },
  memcpy: (M, [d, s, n]) => { M.writeBytes(N(d), M.readBytes(N(s), N(n), true)); return d; },
  memmove: (M, [d, s, n]) => { M.writeBytes(N(d), M.readBytes(N(s), N(n), true)); return d; },
  memcmp: (M, [a, b, n]) => {
    const x = M.readBytes(N(a), N(n)), y = M.readBytes(N(b), N(n));
    for (let k = 0; k < x.length; k++) if (x[k] !== y[k]) return x[k] - y[k];
    return 0;
  },

  // ctype
  isalpha: (M, [c]) => (/[A-Za-z]/.test(String.fromCharCode(c)) && c < 128 ? 1024 : 0),
  isdigit: (M, [c]) => (c >= 48 && c <= 57 ? 2048 : 0),
  isalnum: (M, [c]) => (c < 128 && /[A-Za-z0-9]/.test(String.fromCharCode(c)) ? 8 : 0),
  isspace: (M, [c]) => (isSpace(c) ? 8192 : 0),
  isupper: (M, [c]) => (c >= 65 && c <= 90 ? 256 : 0),
  islower: (M, [c]) => (c >= 97 && c <= 122 ? 512 : 0),
  ispunct: (M, [c]) => (c > 32 && c < 127 && !/[A-Za-z0-9]/.test(String.fromCharCode(c)) ? 4 : 0),
  isprint: (M, [c]) => (c >= 32 && c < 127 ? 16384 : 0),
  isxdigit: (M, [c]) => (c < 128 && /[0-9a-fA-F]/.test(String.fromCharCode(c)) ? 4096 : 0),
  toupper: (M, [c]) => (c >= 97 && c <= 122 ? c - 32 : c),
  tolower: (M, [c]) => (c >= 65 && c <= 90 ? c + 32 : c),

  // math
  sqrt: (M, [x]) => Math.sqrt(x),
  pow: (M, [x, y]) => Math.pow(x, y),
  fabs: (M, [x]) => Math.abs(x),
  floor: (M, [x]) => Math.floor(x),
  ceil: (M, [x]) => Math.ceil(x),
  round: (M, [x]) => (x < 0 ? -Math.round(-x) : Math.round(x)),
  trunc: (M, [x]) => Math.trunc(x),
  fmod: (M, [x, y]) => x % y,
  sin: (M, [x]) => Math.sin(x),
  cos: (M, [x]) => Math.cos(x),
  tan: (M, [x]) => Math.tan(x),
  atan: (M, [x]) => Math.atan(x),
  atan2: (M, [y, x]) => Math.atan2(y, x),
  exp: (M, [x]) => Math.exp(x),
  log: (M, [x]) => Math.log(x),
  log10: (M, [x]) => Math.log10(x),
  log2: (M, [x]) => Math.log2(x),
  hypot: (M, [x, y]) => Math.hypot(x, y),
  fmax: (M, [a, b]) => Math.max(a, b),
  fmin: (M, [a, b]) => Math.min(a, b),

  // time
  time: (M, [p]) => {
    const t = BigInt(Math.floor(Date.now() / 1000));
    if (N(p)) { M.chk(N(p), 8, true); M.dv.setBigInt64(N(p), t, true); }
    return t;
  },
  clock: (M) => BigInt(Math.floor((Date.now() - M.startTime) * 1000)),

  // assert
  __cq_assert: (M, [ok, expr, line], va, ctx) => {
    if (ok) return;
    const e = bin(M.readCString(expr));
    M.write(M.stderrH, unbin(`programme: main.c:${line}: ${ctx.fnName}: Assertion \`${e}' failed.\n`));
    throw new RuntimeError(`Assertion échouée : assert(${e}) ligne ${line}. La condition attendue était fausse.`, { code: 'assert', line, signal: 'SIGABRT' });
  },
};

function cmpBytes(a, b, n) {
  const len = Math.min(n, Math.max(a.length, b.length) + 1);
  for (let k = 0; k < len; k++) {
    const x = k < a.length ? a[k] : 0;
    const y = k < b.length ? b[k] : 0;
    if (x !== y) return x - y;
    if (x === 0) return 0;
  }
  return 0;
}

export { enc, HEAP_BASE };
