#include <stdio.h>

int main(void)
{
    int a, b;
    double x;
    char c;
    char mot[32];
    int r = scanf("%d %d", &a, &b);
    printf("r=%d a=%d b=%d\n", r, a, b);
    r = scanf("%lf", &x);
    printf("r=%d x=%.3f\n", r, x);
    r = scanf(" %c", &c);
    printf("r=%d c=%c\n", r, c);
    r = scanf("%31s", mot);
    printf("r=%d mot=%s\n", r, mot);
    r = scanf("%d", &a);
    printf("r=%d\n", r);
    char ligne[64];
    getchar();
    if (fgets(ligne, sizeof ligne, stdin) != NULL) printf("ligne=[%s]\n", ligne);
    int somme = 0, v;
    while (scanf("%d", &v) == 1) somme += v;
    printf("somme=%d\n", somme);
    r = scanf("%d", &v);
    printf("fin r=%d\n", r);
    return 0;
}
