#include <stdio.h>
#include <string.h>

typedef struct {
    char nom[30];
    int age;
    double moyenne;
} Etudiant;

struct point { int x, y; };

struct point milieu(struct point a, struct point b)
{
    struct point m = {(a.x + b.x) / 2, (a.y + b.y) / 2};
    return m;
}

void vieillir(Etudiant *e) { e->age++; }

enum couleur { ROUGE, VERT = 5, BLEU };

int main(void)
{
    Etudiant classe[3] = {
        {"Ali", 19, 14.5},
        {"Mariem", 20, 16.25},
        {"Sidi", 18, 11.0},
    };
    vieillir(&classe[2]);
    double total = 0;
    for (int i = 0; i < 3; i++) {
        printf("%-8s %2d %6.2f\n", classe[i].nom, classe[i].age, classe[i].moyenne);
        total += classe[i].moyenne;
    }
    printf("moy=%.3f\n", total / 3);
    struct point a = {0, 0}, b = {10, 4};
    struct point m = milieu(a, b);
    printf("(%d,%d) %d\n", m.x, m.y, milieu(a, b).x);
    Etudiant copie = classe[1];
    strcpy(copie.nom, "Copie");
    printf("%s %s\n", classe[1].nom, copie.nom);
    printf("%d %d %d\n", ROUGE, VERT, BLEU);
    struct point pts[2] = {[1] = {.y = 3, .x = 2}};
    printf("%d %d %d %d\n", pts[0].x, pts[0].y, pts[1].x, pts[1].y);
    printf("%zu %zu\n", sizeof(struct point), sizeof(Etudiant));
    Etudiant *pe = &classe[0];
    printf("%s %c\n", pe->nom, (*pe).nom[1]);
    return 0;
}
