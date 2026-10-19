#include <stdio.h>
#include <stdlib.h>

typedef struct Noeud {
    int valeur;
    struct Noeud *suivant;
} Noeud;

Noeud *ajouter(Noeud *tete, int v)
{
    Noeud *n = malloc(sizeof(Noeud));
    if (n == NULL) return tete;
    n->valeur = v;
    n->suivant = tete;
    return n;
}

int cmp(const void *a, const void *b)
{
    int x = *(const int *) a, y = *(const int *) b;
    return (x > y) - (x < y);
}

int main(void)
{
    int n = 5;
    int *t = malloc(n * sizeof(int));
    if (t == NULL) return 1;
    for (int i = 0; i < n; i++) t[i] = (i * 7) % 5;
    t = realloc(t, 2 * n * sizeof(int));
    for (int i = n; i < 2 * n; i++) t[i] = i;
    qsort(t, 2 * n, sizeof(int), cmp);
    for (int i = 0; i < 2 * n; i++) printf("%d ", t[i]);
    printf("\n");
    free(t);
    int *z = calloc(4, sizeof(int));
    printf("%d %d\n", z[0], z[3]);
    free(z);
    Noeud *liste = NULL;
    for (int i = 1; i <= 4; i++) liste = ajouter(liste, i * i);
    for (Noeud *p = liste; p != NULL; p = p->suivant) printf("%d -> ", p->valeur);
    printf("NULL\n");
    while (liste != NULL) {
        Noeud *s = liste->suivant;
        free(liste);
        liste = s;
    }
    char *mot = malloc(6);
    for (int i = 0; i < 5; i++) mot[i] = (char) ('a' + i);
    mot[5] = '\0';
    printf("%s\n", mot);
    free(mot);
    return 0;
}
