// Tests du moteur C : fidélité à gcc, diagnostics en français, erreurs d'exécution détectées.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runC } from '../src/engine/index.js';
import { formatFloat } from '../src/engine/format.js';

const dir = join(import.meta.dirname, 'c-corpus');

describe('corpus comparé à gcc', () => {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.c'))) {
    it(`${f} donne exactement la sortie de gcc`, () => {
      const src = readFileSync(join(dir, f), 'utf8');
      const inFile = join(dir, f.replace(/\.c$/, '.in'));
      const stdin = existsSync(inFile) ? readFileSync(inFile, 'utf8') : '';
      const exp = JSON.parse(readFileSync(join(dir, f.replace(/\.c$/, '.expected.json')), 'utf8'));
      const r = runC(src, { stdin });
      expect(r.compiled).toBe(true);
      expect(r.runtimeError).toBeNull();
      expect(r.stdout).toBe(exp.stdout);
      expect(r.exitCode).toBe(exp.exitCode);
    });
  }
});

const prog = (body, head = '#include <stdio.h>\n') => `${head}int main(void)\n{\n${body}\n    return 0;\n}\n`;
const codes = (r) => r.diagnostics.map((d) => d.code);

describe('diagnostics de compilation', () => {
  it('point-virgule manquant signalé sur la bonne ligne', () => {
    const r = runC('#include <stdio.h>\nint main(void)\n{\n    printf("a\\n")\n    return 0;\n}\n');
    expect(r.compiled).toBe(false);
    const d = r.diagnostics[0];
    expect(d.code).toBe('missing-semicolon');
    expect(d.line).toBe(4);
    expect(d.gcc).toBe("expected ';' before 'return'");
  });
  it('#include oublié', () => {
    const r = runC('int main(void)\n{\n    printf("x");\n    return 0;\n}\n');
    expect(codes(r)).toContain('implicit-function');
    expect(r.diagnostics[0].data.header).toBe('stdio.h');
  });
  it('faute de majuscule avec suggestion', () => {
    const r = runC(prog('    Printf("x");'));
    expect(r.diagnostics[0].data.suggestion).toBe('printf');
  });
  it('variable non déclarée avec suggestion', () => {
    const r = runC(prog('    int total = 1;\n    printf("%d", totl);'));
    expect(r.diagnostics.find((d) => d.code === 'undeclared').data.suggestion).toBe('total');
  });
  it('accolade fermante manquante', () => {
    expect(codes(runC('int main(void)\n{\n    return 0;\n'))).toContain('missing-brace');
  });
  it('point-virgule après int main(void)', () => {
    expect(codes(runC('int main(void);\n{\n    return 0;\n}\n'))).toContain('brace-after-semicolon');
  });
  it('avertissements scanf sans & et format printf incorrect', () => {
    const r = runC(prog('    int n = 0;\n    scanf("%d", n);\n    printf("%f\\n", n);'));
    expect(r.compiled).toBe(true);
    expect(codes(r)).toEqual(expect.arrayContaining(['scanf-format', 'printf-format']));
  });
  it('= dans une condition et ; après if', () => {
    const r = runC(prog('    int x = 1;\n    if (x = 2);\n    printf("%d", x);'));
    expect(codes(r)).toEqual(expect.arrayContaining(['assign-in-cond', 'empty-if']));
  });
  it('conseil sur la division entière', () => {
    expect(codes(runC(prog('    int a = 7, b = 2;\n    double m = a / b;\n    printf("%.1f", m);')))).toContain('int-division');
  });
  it('affectation de tableau et modification de const', () => {
    expect(codes(runC(prog('    char s[5];\n    s = "ab";', '#include <stdio.h>\n')))).toContain('array-assign');
    expect(codes(runC(prog('    const int A = 1;\n    A = 2;')))).toContain('const-assign');
  });
  it('return manquant et break oublié dans switch', () => {
    const r = runC('#include <stdio.h>\nint f(int x)\n{\n    if (x) return 1;\n}\nint main(void)\n{\n    switch (f(1)) {\n    case 1:\n        printf("a");\n    case 2:\n        printf("b");\n        break;\n    }\n    return 0;\n}\n');
    expect(codes(r)).toEqual(expect.arrayContaining(['missing-return', 'fallthrough']));
  });
  it('prototype et définition incompatibles', () => {
    expect(codes(runC('int f(int a, int b);\nint main(void) { return f(1, 2); }\nint f(int a) { return a; }\n'))).toContain('conflicting-types');
  });
});

describe('erreurs d\'exécution détectées', () => {
  const rt = (src, stdin = '') => runC(src, { stdin }).runtimeError;
  it('division entière par zéro', () => expect(rt(prog('    int a = 1, b = 0;\n    printf("%d", a / b);')).code).toBe('div-zero'));
  it('sortie de tableau', () => expect(rt(prog('    int t[3];\n    for (int i = 0; i <= 3; i++) t[i] = i;')).code).toBe('out-of-bounds'));
  it('pointeur NULL', () => expect(rt(prog('    int *p = NULL;\n    *p = 1;')).code).toBe('null-deref'));
  it('pointeur non initialisé', () => expect(rt(prog('    int *p;\n    *p = 1;')).code).toBe('uninit-pointer'));
  it('boucle infinie', () => expect(rt(prog('    int i = 0;\n    while (i < 3) { }')).code).toBe('timeout'), 15000);
  it('récursion infinie', () => expect(rt('int f(int n) { return f(n + 1); }\nint main(void) { return f(0); }\n').code).toBe('stack-overflow'));
  it('utilisation après free et double free', () => {
    expect(rt(prog('    int *p = malloc(8);\n    free(p);\n    p[0] = 1;', '#include <stdlib.h>\n')).code).toBe('use-after-free');
    expect(rt(prog('    int *p = malloc(8);\n    free(p);\n    free(p);', '#include <stdlib.h>\n')).code).toBe('double-free');
  });
  it('modification d\'une chaîne littérale', () => expect(rt(prog('    char *s = "abc";\n    s[0] = \'x\';')).code).toBe('write-rodata'));
  it('fuite mémoire signalée', () => {
    const r = runC(prog('    int *p = malloc(40);\n    p[0] = 1;', '#include <stdlib.h>\n'));
    expect(r.leaks).toHaveLength(1);
    expect(r.leaks[0].size).toBe(40);
  });
  it('lecture d\'une variable non initialisée signalée', () => {
    const r = runC(prog('    int s;\n    s += 1;\n    printf("%d", s);'));
    expect(r.runtimeWarnings[0].code).toBe('uninit-read');
  });
  it('exit() renvoie le bon code', () => expect(runC(prog('    exit(4);', '#include <stdlib.h>\n')).exitCode).toBe(4));
});

describe('formatage des réels identique à la glibc', () => {
  const f = (x, conv, p) => { const r = formatFloat(x, conv, p, {}); return r.sign + r.body; };
  it('arrondi au plus proche pair sur les égalités exactes', () => {
    expect(f(0.5, 'f', 0)).toBe('0');
    expect(f(1.5, 'f', 0)).toBe('2');
    expect(f(2.5, 'f', 0)).toBe('2');
    expect(f(0.125, 'f', 2)).toBe('0.12');
  });
  it('%e et %g', () => {
    expect(f(12345.678, 'e', 6)).toBe('1.234568e+04');
    expect(f(0.0001, 'g', 6)).toBe('0.0001');
    expect(f(1e6, 'g', 6)).toBe('1e+06');
    expect(f(100, 'g', 6)).toBe('100');
  });
});

describe('entrées/sorties et fichiers', () => {
  it('scanf renvoie EOF et le nombre de valeurs lues', () => {
    const r = runC(prog('    int a, b;\n    int r1 = scanf("%d %d", &a, &b);\n    int r2 = scanf("%d", &a);\n    printf("%d %d", r1, r2);'), { stdin: '4 x' });
    expect(r.stdout).toBe('1 0');
  });
  it('les fichiers écrits sont visibles après exécution', () => {
    const r = runC(prog('    FILE *f = fopen("o.txt", "w");\n    if (f == NULL) return 1;\n    fprintf(f, "%d\\n", 42);\n    fclose(f);'));
    expect(r.files['o.txt']).toBe('42\n');
  });
  it('fichier de données fourni en lecture', () => {
    const r = runC(prog('    FILE *f = fopen("d.txt", "r");\n    int x;\n    if (f == NULL) return 1;\n    fscanf(f, "%d", &x);\n    fclose(f);\n    printf("%d", x * 2);'), { dataFiles: { 'd.txt': '21' } });
    expect(r.stdout).toBe('42');
  });
  it('programme en plusieurs fichiers avec en-tête', () => {
    const r = runC({
      'main.c': '#include <stdio.h>\n#include "m.h"\nint main(void) { P p = {2, 3}; printf("%d\\n", somme(p)); return 0; }\n',
      'm.h': '#ifndef M_H\n#define M_H\ntypedef struct { int a; int b; } P;\nint somme(P p);\n#endif\n',
      'm.c': '#include "m.h"\nint somme(P p) { return p.a + p.b; }\n',
    });
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
    expect(r.stdout).toBe('5\n');
  });
  it('trace pas à pas avec valeurs et cibles de pointeurs', () => {
    const r = runC(prog('    int x = 5;\n    int *p = &x;\n    *p = 9;\n    printf("%d", x);'), { trace: true });
    const last = r.trace[r.trace.length - 1];
    expect(last.vars.find((v) => v.name === 'x').text).toBe('9');
    expect(last.vars.find((v) => v.name === 'p').target).toBe('x');
  });
});
