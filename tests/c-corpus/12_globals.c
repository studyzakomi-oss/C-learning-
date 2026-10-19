#include <stdio.h>

int compteur;
double taux = 0.2;
const char *message = "Salut";
int tableau[5] = {1, 2};
char nom[10] = "abc";

void inc(void) { compteur++; }

int main(void)
{
    for (int i = 0; i < 4; i++) inc();
    printf("%d %.1f %s %d %d %s\n", compteur, taux, message, tableau[1], tableau[4], nom);
    int x = 10;
    {
        int x = 20;
        printf("interne %d\n", x);
    }
    printf("externe %d\n", x);
    return 0;
}
