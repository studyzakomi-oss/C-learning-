// Machine virtuelle : mémoire vérifiée (à la manière d'AddressSanitizer), pile, tas, E/S.
import { RuntimeError } from './errors.js';

export const MEM_SIZE = 8 * 1024 * 1024;
export const STATIC_BASE = 0x10000;
export const STATIC_END = 0x200000;
export const HEAP_BASE = 0x200000;
export const HEAP_END = 0x600000;
export const STACK_BASE = 0x600000;
export const STACK_END = MEM_SIZE;
export const FUNC_BASE = 0x1000;
export const FILE_BASE = 0x8000;
export const POISON_PTR = 0xBEBEBEBE;

// états de l'ombre mémoire
export const SH_INVALID = 0;
export const SH_OK = 1;
export const SH_FREED = 2;
export const SH_DEAD = 3;
export const SH_UNINIT = 4;
export const SH_RODATA = 5;

const decoder = new TextDecoder('utf-8');
const encoder = new TextEncoder();

export class Machine {
  constructor(opts = {}) {
    this.buf = new ArrayBuffer(MEM_SIZE);
    this.dv = new DataView(this.buf);
    this.u8 = new Uint8Array(this.buf);
    this.sh = new Uint8Array(MEM_SIZE);
    this.staticTop = STATIC_BASE;
    this.heapTop = HEAP_BASE;
    this.sp = STACK_BASE;
    this.fp = STACK_BASE;
    this.heap = new Map();
    this.freed = new Map();
    this.globals = []; // {name, addr, size, type}
    this.frames = []; // {fn, fp}
    this.maxDepth = opts.maxDepth || 2500;
    this.steps = 0;
    this.maxSteps = opts.maxSteps || 30_000_000;
    this.deadline = Date.now() + (opts.timeoutMs || 5000);
    this.line = 0;
    this.out = [];
    this.outLen = 0;
    this.maxOut = opts.maxOutput || 200_000;
    this.transcript = [];
    this.warnings = [];
    this.warnedLines = new Set();
    this.retVal = undefined;
    this.funcs = []; // table des fonctions (pointeurs de fonction)
    // entrée standard
    this.stdin = encoder.encode(opts.stdin || '');
    this.files = new Map(Object.entries(opts.files || {}).map(([k, v]) => [k, encoder.encode(v)]));
    this.handles = new Map();
    this.nextHandle = 0;
    this.stdinH = this.makeHandle({ kind: 'stdin', name: 'stdin', data: this.stdin, pos: 0, mode: 'r' });
    this.stdoutH = this.makeHandle({ kind: 'stdout', name: 'stdout', mode: 'w' });
    this.stderrH = this.makeHandle({ kind: 'stderr', name: 'stderr', mode: 'w' });
    this.echoPos = 0;
    this.randState = null;
    this.srand(1);
  }

  makeHandle(h) {
    const addr = FILE_BASE + 16 * this.nextHandle++;
    h.addr = addr;
    h.eof = false;
    h.err = false;
    h.open = true;
    this.handles.set(addr, h);
    return addr;
  }

  // ---------- exécution ----------
  tick() {
    if (this.tracer) this.tracer();
    if (++this.steps > this.maxSteps) this.tooLong();
    if ((this.steps & 0xFFFF) === 0 && Date.now() > this.deadline) this.tooLong();
  }
  tooLong() {
    throw new RuntimeError('Temps d\'exécution dépassé : ton programme tourne trop longtemps. Il y a probablement une boucle infinie (la condition ne devient jamais fausse ?).', { code: 'timeout', line: this.line });
  }

  // ---------- allocation ----------
  allocStatic(size, align = 8, state = SH_OK) {
    let a = Math.ceil((this.staticTop + 16) / Math.max(align, 8)) * Math.max(align, 8);
    if (a + size > STATIC_END) throw new RuntimeError('Mémoire statique épuisée (tableaux globaux trop grands)', { code: 'oom' });
    this.staticTop = a + size;
    this.sh.fill(state, a, a + size);
    return a;
  }

  malloc(size, line, zero = false) {
    size = Number(size);
    if (!(size >= 0) || size > HEAP_END - HEAP_BASE) return 0;
    const a = Math.ceil((this.heapTop + 16) / 16) * 16;
    if (a + size > HEAP_END) return 0;
    this.heapTop = a + size;
    this.u8.fill(0, a, a + size);
    this.sh.fill(zero ? SH_OK : SH_UNINIT, a, a + size);
    this.heap.set(a, { size, line });
    return a;
  }

  free(a, line) {
    a = Number(a);
    if (a === 0) return;
    const blk = this.heap.get(a);
    if (!blk) {
      if (this.freed.has(a)) {
        throw new RuntimeError(`free() appelé deux fois sur le même bloc (double libération). Le bloc alloué ligne ${this.freed.get(a).line} a déjà été libéré.`, { code: 'double-free', line, signal: 'SIGABRT' });
      }
      throw new RuntimeError('free() appelé sur une adresse qui ne provient pas de malloc/calloc/realloc (ou qui ne pointe pas au début du bloc).', { code: 'bad-free', line, signal: 'SIGABRT' });
    }
    this.heap.delete(a);
    this.freed.set(a, blk);
    this.sh.fill(SH_FREED, a, a + blk.size);
  }

  realloc(a, size, line) {
    a = Number(a);
    if (a === 0) return this.malloc(size, line);
    const blk = this.heap.get(a);
    if (!blk) {
      if (this.freed.has(a)) throw new RuntimeError('realloc() sur un bloc déjà libéré.', { code: 'use-after-free', line, signal: 'SIGABRT' });
      throw new RuntimeError('realloc() sur une adresse qui ne provient pas de malloc.', { code: 'bad-free', line, signal: 'SIGABRT' });
    }
    const n = this.malloc(size, line);
    if (n === 0) return 0;
    const m = Math.min(blk.size, Number(size));
    this.u8.copyWithin(n, a, a + m);
    this.sh.copyWithin(n, a, a + m);
    this.free(a, line);
    return n;
  }

  // ---------- vérification des accès ----------
  checkSlow(a, size, write) {
    if (!(a >= 0 && a + size <= MEM_SIZE) || !Number.isInteger(a)) this.badAccess(a, size, write, SH_INVALID);
    for (let k = 0; k < size; k++) {
      const s = this.sh[a + k];
      if (s === SH_OK) continue;
      if (s === SH_UNINIT) {
        if (write) { this.sh.fill(SH_OK, a + k, a + k + 1); continue; }
        this.uninitRead(a);
        continue;
      }
      if (s === SH_RODATA) {
        if (write) throw new RuntimeError('Tentative de modifier une chaîne littérale (texte entre guillemets), qui est en lecture seule. Utilise un tableau : char s[] = "..." au lieu de char *s = "...".', { code: 'write-rodata', line: this.line, signal: 'SIGSEGV' });
        continue;
      }
      this.badAccess(a + k, size, write, s);
    }
  }

  uninitRead(a) {
    if (this.warnedLines.has(this.line)) return;
    this.warnedLines.add(this.line);
    const who = this.describe(a);
    this.warnings.push({
      line: this.line,
      code: 'uninit-read',
      message: `lecture d'une valeur non initialisée${who.name ? ` (${who.name})` : ''} : la variable n'a jamais reçu de valeur, son contenu est imprévisible.`,
    });
  }

  /** Décrit l'objet mémoire le plus proche d'une adresse (pour les messages). */
  describe(a) {
    if (a >= STACK_BASE) {
      for (let i = this.frames.length - 1; i >= 0; i--) {
        const fr = this.frames[i];
        if (a >= fr.fp && a < fr.fp + fr.fn.frameSize + 64) {
          let best = null;
          for (const l of fr.fn.locals) {
            const st = fr.fp + l.offset;
            if (st <= a + 16 && (!best || st > fr.fp + best.offset)) {
              if (st <= a || a >= st - 16) best = l;
            }
          }
          let bestBefore = null;
          for (const l of fr.fn.locals) {
            const st = fr.fp + l.offset;
            if (st <= a && (!bestBefore || st > fr.fp + bestBefore.offset)) bestBefore = l;
          }
          const l = bestBefore || best;
          if (l) return { kind: 'stack', name: `« ${l.name} »`, start: fr.fp + l.offset, size: l.size, type: l.type, fn: fr.fn.name };
        }
      }
      return { kind: 'stack' };
    }
    if (a >= HEAP_BASE && a < HEAP_END) {
      let best = null;
      for (const [st, b] of [...this.heap, ...this.freed]) {
        if (st <= a && (!best || st > best.start)) best = { start: st, ...b };
      }
      if (best) return { kind: 'heap', name: `bloc alloué ligne ${best.line}`, start: best.start, size: best.size };
      return { kind: 'heap' };
    }
    if (a >= STATIC_BASE && a < STATIC_END) {
      let best = null;
      for (const g of this.globals) if (g.addr <= a && (!best || g.addr > best.addr)) best = g;
      if (best) return { kind: 'static', name: `« ${best.name} »`, start: best.addr, size: best.size, type: best.type };
    }
    return { kind: 'unknown' };
  }

  badAccess(a, size, write, state) {
    const verb = write ? 'Écriture' : 'Lecture';
    const line = this.line;
    if (a === POISON_PTR || (a >= POISON_PTR - 64 && a <= POISON_PTR + 4096)) {
      throw new RuntimeError(`${verb} via un pointeur non initialisé : le pointeur n'a jamais reçu d'adresse valide (initialise-le avec l'adresse d'une variable, malloc, ou NULL).`, { code: 'uninit-pointer', line, signal: 'SIGSEGV' });
    }
    if (a < 0x1000) {
      throw new RuntimeError(`${verb} à travers un pointeur NULL (adresse ${a}). Vérifie que le pointeur reçoit une vraie adresse avant de l'utiliser (par ex. résultat de malloc ou fopen non testé).`, { code: 'null-deref', line, signal: 'SIGSEGV' });
    }
    if (state === SH_FREED) {
      throw new RuntimeError(`${verb} dans une zone mémoire déjà libérée par free() (utilisation après libération).`, { code: 'use-after-free', line, signal: 'SIGSEGV' });
    }
    if (state === SH_DEAD) {
      throw new RuntimeError(`${verb} dans une variable locale d'une fonction déjà terminée (adresse d'une variable locale renvoyée ?).`, { code: 'dangling-stack', line, signal: 'SIGSEGV' });
    }
    if (a >= FUNC_BASE && a < FILE_BASE) {
      throw new RuntimeError(`${verb} à l'adresse d'une fonction : ce n'est pas une donnée.`, { code: 'bad-access', line, signal: 'SIGSEGV' });
    }
    if (a >= FILE_BASE && a < STATIC_BASE) {
      throw new RuntimeError(`${verb} directe dans un FILE* : utilise les fonctions fgets, fprintf, fscanf...`, { code: 'bad-access', line, signal: 'SIGSEGV' });
    }
    const d = this.describe(a);
    if (d.start !== undefined && d.size !== undefined) {
      const elem = d.type && d.type.k === 'array' ? d.type.of.size : 0;
      if (a >= d.start + d.size) {
        let extra = '';
        if (elem && d.type.len) extra = ` Le tableau a ${d.type.len} cases (indices 0 à ${d.type.len - 1}) ; l'indice utilisé correspond à ${Math.floor((a - d.start) / elem)}.`;
        throw new RuntimeError(`${verb} hors limites : après la fin de ${d.name}.${extra}`, { code: 'out-of-bounds', line, signal: 'SIGSEGV' });
      }
      if (a < d.start) {
        throw new RuntimeError(`${verb} hors limites : avant le début de ${d.name} (indice négatif ?).`, { code: 'out-of-bounds', line, signal: 'SIGSEGV' });
      }
    }
    if (a >= HEAP_BASE && a < HEAP_END) {
      throw new RuntimeError(`${verb} hors d'un bloc alloué dynamiquement (dépassement du bloc malloc ?).`, { code: 'out-of-bounds', line, signal: 'SIGSEGV' });
    }
    throw new RuntimeError(`${verb} à une adresse mémoire invalide (0x${a.toString(16)}). Erreur de segmentation : pointeur invalide ou indice de tableau hors limites.`, { code: 'segfault', line, signal: 'SIGSEGV' });
  }

  // ---------- lectures / écritures typées ----------
  chk(a, size, write) {
    const s1 = this.sh[a];
    const s2 = this.sh[a + size - 1];
    if (write) {
      if (s1 === SH_OK && s2 === SH_OK) return;
    } else if ((s1 === SH_OK || s1 === SH_RODATA) && (s2 === SH_OK || s2 === SH_RODATA)) return;
    this.checkSlow(a, size, write);
  }

  readBytes(a, n) {
    if (n === 0) return new Uint8Array(0);
    this.chk(a, n, false);
    if (n > 2) this.checkSlow(a, n, false);
    return this.u8.slice(a, a + n);
  }
  writeBytes(a, bytes) {
    if (bytes.length === 0) return;
    this.checkSlow(a, bytes.length, true);
    this.u8.set(bytes, a);
  }
  /** Rend une zone valide et initialisée (initialisation à zéro). */
  zeroInit(a, n) {
    this.u8.fill(0, a, a + n);
    this.sh.fill(SH_OK, a, a + n);
  }

  readCString(a, max = 1 << 20) {
    a = Number(a);
    const out = [];
    for (let k = 0; k < max; k++) {
      const s = this.sh[a + k];
      if (s !== SH_OK && s !== SH_RODATA) {
        if (s === SH_UNINIT) { this.uninitRead(a + k); }
        else if (k > 0 && s === SH_INVALID) {
          throw new RuntimeError('Chaîne sans caractère de fin \'\\0\' : la lecture dépasse la fin du tableau. Pense à réserver une case pour \'\\0\'.', { code: 'no-terminator', line: this.line, signal: 'SIGSEGV' });
        } else this.checkSlow(a + k, 1, false);
      }
      const b = this.u8[a + k];
      if (b === 0) return out;
      out.push(b);
    }
    return out;
  }
  writeCString(a, bytes) {
    a = Number(a);
    this.checkSlow(a, bytes.length + 1, true);
    this.u8.set(bytes, a);
    this.u8[a + bytes.length] = 0;
  }

  // ---------- sortie ----------
  write(h, bytes) {
    if (h === this.stdoutH || h === this.stderrH) {
      this.outLen += bytes.length;
      if (this.outLen > this.maxOut) {
        throw new RuntimeError('Sortie trop longue : ton programme affiche énormément de texte (boucle infinie avec printf ?).', { code: 'output-limit', line: this.line });
      }
      const kind = h === this.stdoutH ? 'out' : 'err';
      if (kind === 'out') for (const b of bytes) this.out.push(b);
      const last = this.transcript[this.transcript.length - 1];
      if (last && last.kind === kind) last.bytes.push(...bytes);
      else this.transcript.push({ kind, bytes: [...bytes] });
      return;
    }
    const hd = this.handles.get(h);
    hd.data.push(...bytes);
  }

  stdoutText() { return decoder.decode(new Uint8Array(this.out)); }
  transcriptText() {
    return this.transcript.map((s) => ({ kind: s.kind, text: decoder.decode(new Uint8Array(s.bytes)) }));
  }

  /** Appelé quand le programme lit stdin : recopie la ligne lue dans la console. */
  echoInput(pos) {
    const data = this.stdin;
    if (pos < this.echoPos) return;
    let end = data.indexOf(10, pos);
    end = end < 0 ? data.length : end + 1;
    if (end <= this.echoPos) return;
    const bytes = Array.from(data.slice(Math.max(this.echoPos, pos), end));
    this.echoPos = end;
    if (!bytes.length) return;
    const last = this.transcript[this.transcript.length - 1];
    if (last && last.kind === 'in') last.bytes.push(...bytes);
    else this.transcript.push({ kind: 'in', bytes });
  }

  // ---------- générateur aléatoire identique à la glibc (TYPE_3) ----------
  srand(seed) {
    seed = seed >>> 0;
    if (seed === 0) seed = 1;
    const r = new Int32Array(344);
    r[0] = seed | 0;
    for (let i = 1; i < 31; i++) {
      const hi = Math.trunc(r[i - 1] / 127773);
      const lo = r[i - 1] % 127773;
      let word = 16807 * lo - 2836 * hi;
      if (word < 0) word += 2147483647;
      r[i] = word;
    }
    for (let i = 31; i < 34; i++) r[i] = r[i - 31];
    const st = Array.from(r.slice(0, 34));
    for (let i = 34; i < 344; i++) st.push((st[i - 31] + st[i - 3]) | 0);
    this.randState = st.slice(st.length - 34);
  }
  rand() {
    const st = this.randState;
    const n = st.length;
    const v = (st[n - 31] + st[n - 3]) | 0;
    st.push(v);
    if (st.length > 1000) st.splice(0, st.length - 34);
    return (v >>> 1) & 0x7FFFFFFF;
  }
}

export { decoder, encoder };
