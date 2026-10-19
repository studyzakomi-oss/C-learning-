#include <stdio.h>

void doubler(int *p) { *p = *p * 2; }
int *plus_grand(int *a, int *b) { return *a > *b ? a : b; }
int somme(const int *t, int n)
{
    int s = 0;
    for (const int *p = t; p < t + n; p++) s += *p;
    return s;
}

int main(void)
{
    int x = 21;
    int *p = &x;
    doubler(p);
    printf("%d %d\n", x, *p);
    int t[] = {4, 8, 15, 16, 23, 42};
    int *q = t;
    printf("%d %d %d\n", *(q + 2), q[3], *q + 1);
    q += 4;
    printf("%d %td\n", *q, q - t);
    int a = 3, b = 9;
    *plus_grand(&a, &b) = 0;
    printf("%d %d\n", a, b);
    printf("%d\n", somme(t, 6));
    int *nul = NULL;
    printf("%d\n", nul == NULL);
    char s[] = "pointeur";
    char *c = s;
    int n = 0;
    while (*c != '\0') { n++; c++; }
    printf("%d\n", n);
    int **pp = &p;
    **pp = 7;
    printf("%d\n", x);
    void *v = &x;
    printf("%d\n", *(int *) v);
    return 0;
}
