// Génère tests/c-corpus/*.expected.json à partir de gcc (sortie + code de retour) pour les tests unitaires.
import { readdirSync, readFileSync, existsSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';

const dir = 'tests/c-corpus';
const work = mkdtempSync(join(tmpdir(), 'cqg-'));
for (const f of readdirSync(dir).filter((x) => x.endsWith('.c'))) {
  const inFile = join(dir, f.replace(/\.c$/, '.in'));
  const stdin = existsSync(inFile) ? readFileSync(inFile, 'utf8') : '';
  execFileSync('gcc', ['-std=c99', '-w', join(dir, f), '-o', join(work, 'p'), '-lm']);
  const r = spawnSync(join(work, 'p'), [], { input: stdin, cwd: work, encoding: 'utf8' });
  writeFileSync(join(dir, f.replace(/\.c$/, '.expected.json')), JSON.stringify({ stdout: r.stdout, exitCode: r.status }, null, 1));
  console.log('✓', f);
}
