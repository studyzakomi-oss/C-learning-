#include <stdio.h>

int carre(int x);
void afficher_ligne(int n);
static int compteur(void);
int fib(int n);
double moyenne(const int t[], int n);
void echanger(int *a, int *b);
int global = 100;

int main(void)
{
    printf("%d\n", carre(7));
    afficher_ligne(5);
    for (int i = 0; i < 3; i++) printf("compteur=%d\n", compteur());
    printf("fib(20)=%d\n", fib(20));
    int notes[] = {12, 15, 9, 18};
    printf("moy=%.2f\n", moyenne(notes, 4));
    int a = 1, b = 2;
    echanger(&a, &b);
    printf("a=%d b=%d\n", a, b);
    global++;
    printf("global=%d\n", global);
    return 0;
}

int carre(int x) { return x * x; }

void afficher_ligne(int n)
{
    for (int i = 0; i < n; i++) putchar('-');
    putchar('\n');
}

static int compteur(void)
{
    static int c = 0;
    c++;
    return c;
}

int fib(int n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }

double moyenne(const int t[], int n)
{
    int s = 0;
    for (int i = 0; i < n; i++) s += t[i];
    return (double) s / n;
}

void echanger(int *a, int *b)
{
    int tmp = *a;
    *a = *b;
    *b = tmp;
}
