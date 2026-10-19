// Compare le moteur C de C Quest avec gcc sur un corpus de programmes.
// Usage : node scripts/diff-gcc.mjs [dossier]
import { readdirSync, readFileSync, existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { runC } from '../src/engine/index.js';

const dir = process.argv[2] || 'tests/c-corpus';
const work = mkdtempSync(join(tmpdir(), 'cq-'));
let fail = 0;
for (const f of readdirSync(dir).filter((x) => x.endsWith('.c')).sort()) {
  const src = readFileSync(join(dir, f), 'utf8');
  const inFile = join(dir, f.replace(/\.c$/, '.in'));
  const stdin = existsSync(inFile) ? readFileSync(inFile, 'utf8') : '';
  const exe = join(work, f + '.out');
  writeFileSync(join(work, f), src);
  execFileSync('gcc', ['-std=c99', '-O0', '-w', join(work, f), '-o', exe, '-lm']);
  const g = spawnSync(exe, [], { input: stdin, cwd: work, encoding: 'utf8' });
  const r = runC(src, { stdin, debug: true });
  const ok = r.compiled && r.stdout === g.stdout && r.exitCode === g.status;
  if (!ok) {
    fail++;
    console.log(`✗ ${f}  (exit gcc=${g.status} cq=${r.exitCode})`);
    if (!r.compiled) console.log(r.diagnostics.filter((d) => d.severity === 'error'));
    if (r.runtimeError) console.log(r.runtimeError);
    const a = g.stdout.split('\n'), b = r.stdout.split('\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) { console.log(`   ligne ${i + 1}\n   gcc: ${JSON.stringify(a[i])}\n   cq : ${JSON.stringify(b[i])}`); break; }
    }
  } else console.log(`✓ ${f}  (${r.steps} pas, ${r.timeMs} ms)`);
}
console.log(fail ? `${fail} échec(s)` : 'Tout est identique à gcc.');
process.exit(fail ? 1 : 0);
