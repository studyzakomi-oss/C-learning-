// Formatage des nombres identique à la glibc (arrondi exact, au plus proche pair).

const f64 = new Float64Array(1);
const u64 = new BigUint64Array(f64.buffer);

/** Décompose un double fini positif en mantisse * 2^exp (entiers BigInt). */
function decompose(x) {
  f64[0] = x;
  const bits = u64[0];
  const expBits = Number((bits >> 52n) & 0x7FFn);
  let mant = bits & 0xFFFFFFFFFFFFFn;
  let exp;
  if (expBits === 0) exp = -1074;
  else { mant |= 1n << 52n; exp = expBits - 1075; }
  return { mant, exp };
}

/** Arrondit x * 10^p à l'entier le plus proche (égalité -> pair). x >= 0 fini. */
function scaledRound(x, p) {
  const { mant, exp } = decompose(x);
  let num = mant;
  let den = 1n;
  if (exp >= 0) num <<= BigInt(exp); else den <<= BigInt(-exp);
  if (p >= 0) num *= 10n ** BigInt(p); else den *= 10n ** BigInt(-p);
  const q = num / den;
  const r = num % den;
  const twice = r * 2n;
  if (twice > den || (twice === den && (q & 1n) === 1n)) return q + 1n;
  return q;
}

function special(x, upper) {
  let s;
  if (Number.isNaN(x)) s = 'nan';
  else s = 'inf';
  return upper ? s.toUpperCase() : s;
}

/** %f : renvoie les chiffres sans signe. */
export function fixedDigits(x, prec, alt) {
  const q = scaledRound(x, prec).toString();
  if (prec === 0) return q + (alt ? '.' : '');
  const padded = q.padStart(prec + 1, '0');
  return padded.slice(0, padded.length - prec) + '.' + padded.slice(padded.length - prec);
}

/** %e : renvoie {digits, exp} avec prec+1 chiffres significatifs. */
function sciParts(x, prec) {
  if (x === 0) return { digits: '0'.repeat(prec + 1), exp: 0 };
  let e = Math.floor(Math.log10(x));
  let q = scaledRound(x, prec - e);
  const lim = 10n ** BigInt(prec + 1);
  if (q >= lim) { e += 1; q = scaledRound(x, prec - e); }
  else if (q < lim / 10n) { e -= 1; q = scaledRound(x, prec - e); }
  if (q >= lim) { e += 1; q = scaledRound(x, prec - e); }
  return { digits: q.toString(), exp: e };
}

export function sciDigits(x, prec, upper, alt) {
  const { digits, exp } = sciParts(x, prec);
  let s = digits[0];
  if (prec > 0 || alt) s += '.';
  s += digits.slice(1);
  const es = Math.abs(exp).toString().padStart(2, '0');
  return s + (upper ? 'E' : 'e') + (exp < 0 ? '-' : '+') + es;
}

export function generalDigits(x, prec, upper, alt) {
  const P = prec === 0 ? 1 : prec;
  const X = x === 0 ? 0 : sciParts(x, P - 1).exp;
  let s;
  if (P > X && X >= -4) s = fixedDigits(x, P - 1 - X, alt);
  else s = sciDigits(x, P - 1, upper, alt);
  if (!alt) {
    // supprime les zéros inutiles
    const ePos = s.search(/[eE]/);
    let mant = ePos >= 0 ? s.slice(0, ePos) : s;
    const tail = ePos >= 0 ? s.slice(ePos) : '';
    if (mant.includes('.')) mant = mant.replace(/0+$/, '').replace(/\.$/, '');
    s = mant + tail;
  }
  return s;
}

/** Formate un nombre flottant selon une conversion printf. */
export function formatFloat(x, conv, prec, flags) {
  const upper = conv === conv.toUpperCase();
  const neg = x < 0 || Object.is(x, -0);
  const ax = Math.abs(x);
  let body;
  if (!Number.isFinite(x)) body = special(x, upper);
  else {
    const lc = conv.toLowerCase();
    if (lc === 'f') body = fixedDigits(ax, prec, flags.alt);
    else if (lc === 'e') body = sciDigits(ax, prec, upper, flags.alt);
    else if (lc === 'g') body = generalDigits(ax, prec, upper, flags.alt);
    else if (lc === 'a') body = ax.toString(16);
  }
  let sign = '';
  if (neg && !Number.isNaN(x)) sign = '-';
  else if (flags.plus) sign = '+';
  else if (flags.space) sign = ' ';
  return { sign, body, numeric: Number.isFinite(x) };
}

/** Applique la largeur et l'alignement. */
export function pad(sign, body, width, flags, numeric) {
  const len = sign.length + body.length;
  if (width <= len) return sign + body;
  if (flags.minus) return sign + body + ' '.repeat(width - len);
  if (flags.zero && numeric) return sign + '0'.repeat(width - len) + body;
  return ' '.repeat(width - len) + sign + body;
}

/**
 * Analyse une chaîne de format printf.
 * @returns {Array<string|{flags:any,width:number|'*'|null,prec:number|'*'|null,len:string,conv:string,raw:string}>}
 */
export function parseFormat(fmt) {
  const parts = [];
  let lit = '';
  let i = 0;
  while (i < fmt.length) {
    const c = fmt[i];
    if (c !== '%') { lit += c; i++; continue; }
    const start = i;
    i++;
    if (fmt[i] === '%') { lit += '%'; i++; continue; }
    if (lit) { parts.push(lit); lit = ''; }
    const flags = { minus: false, plus: false, space: false, zero: false, alt: false };
    while ('-+ 0#'.includes(fmt[i]) && i < fmt.length) {
      const f = fmt[i++];
      if (f === '-') flags.minus = true; else if (f === '+') flags.plus = true; else if (f === ' ') flags.space = true; else if (f === '0') flags.zero = true; else flags.alt = true;
    }
    let width = null;
    if (fmt[i] === '*') { width = '*'; i++; }
    else { let w = ''; while (/[0-9]/.test(fmt[i] || '')) w += fmt[i++]; if (w) width = parseInt(w, 10); }
    let prec = null;
    if (fmt[i] === '.') {
      i++;
      if (fmt[i] === '*') { prec = '*'; i++; }
      else { let w = ''; while (/[0-9]/.test(fmt[i] || '')) w += fmt[i++]; prec = w ? parseInt(w, 10) : 0; }
    }
    let len = '';
    while ('hlLqjzt'.includes(fmt[i]) && i < fmt.length) len += fmt[i++];
    const conv = fmt[i] || '';
    i++;
    parts.push({ flags, width, prec, len, conv, raw: fmt.slice(start, i) });
  }
  if (lit) parts.push(lit);
  return parts;
}

/** Formate un entier (number ou BigInt) selon une conversion. */
export function formatInt(v, spec) {
  const { conv, flags } = spec;
  let big = typeof v === 'bigint' ? v : BigInt(v);
  const neg = big < 0n;
  if (neg) big = -big;
  let digits;
  if (conv === 'x') digits = big.toString(16);
  else if (conv === 'X') digits = big.toString(16).toUpperCase();
  else if (conv === 'o') digits = big.toString(8);
  else digits = big.toString(10);
  const prec = spec.precValue;
  if (prec != null) {
    if (prec === 0 && big === 0n) digits = '';
    digits = digits.padStart(prec, '0');
  }
  let prefix = '';
  if (flags.alt && big !== 0n && (conv === 'x' || conv === 'X')) prefix = conv === 'x' ? '0x' : '0X';
  if (flags.alt && conv === 'o' && !digits.startsWith('0')) digits = '0' + digits;
  let sign = '';
  if (neg) sign = '-';
  else if ((conv === 'd' || conv === 'i') && flags.plus) sign = '+';
  else if ((conv === 'd' || conv === 'i') && flags.space) sign = ' ';
  const f = prec != null ? { ...flags, zero: false } : flags;
  return pad(sign + prefix, digits, spec.widthValue || 0, f, true);
}
