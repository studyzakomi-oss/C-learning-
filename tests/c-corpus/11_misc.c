#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <stdbool.h>

int appliquer(int (*f)(int), int x) { return f(x); }
int triple(int x) { return 3 * x; }

int main(void)
{
    srand(42);
    for (int i = 0; i < 5; i++) printf("%d ", rand() % 100);
    printf("\n");
    srand(7);
    printf("%d\n", rand());
    printf("%.4f %.4f %.1f %.1f %.1f %.1f\n", sqrt(2.0), pow(2.0, 0.5), floor(-2.5), ceil(2.1), round(2.5), round(-2.5));
    printf("%.3f %d\n", fabs(-3.25), abs(-8));
    bool ok = true;
    printf("%d %d\n", ok, !ok);
    printf("%d\n", appliquer(triple, 14));
    int bits = 0xF0;
    printf("%d %d %d %d %d\n", bits & 0x3C, bits | 1, bits ^ 0xFF, bits >> 2, 1 << 10);
    unsigned u = 1u << 31;
    printf("%u %d\n", u, (int) u);
    int n = 4;
    int vla[n];
    for (int i = 0; i < n; i++) vla[i] = i * i;
    printf("%d %zu\n", vla[3], sizeof vla);
    long long big = 1;
    for (int i = 0; i < 62; i++) big *= 2;
    printf("%lld\n", big);
    int i = 5;
    i += 3; i -= 1; i *= 2; i /= 3; i %= 3;
    printf("%d\n", i);
    int j = 0;
    printf("%d ", j++);
    printf("%d\n", ++j);
    printf("%s\n", "con" "ca" "tene");
    printf("tab\tnl\\ \"q\" '\n");
    double d = atof("3.5") + atoi("12");
    printf("%.1f\n", d);
    printf("%d\n", (int) strtol("ff", NULL, 16));
    char c = 'a';
    c++;
    printf("%c %d\n", c, c - 'a');
    exit(3);
}
