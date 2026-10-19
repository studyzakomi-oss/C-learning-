#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    FILE *f = fopen("notes.txt", "w");
    if (f == NULL) { printf("erreur\n"); return 1; }
    for (int i = 1; i <= 3; i++) fprintf(f, "eleve%d %d\n", i, 10 + i * 2);
    fclose(f);
    f = fopen("notes.txt", "r");
    if (f == NULL) return 1;
    char nom[20];
    int note, total = 0;
    while (fscanf(f, "%19s %d", nom, &note) == 2) {
        printf("%s a %d\n", nom, note);
        total += note;
    }
    fclose(f);
    printf("total=%d\n", total);
    f = fopen("notes.txt", "a");
    fputs("fin\n", f);
    fclose(f);
    f = fopen("notes.txt", "r");
    char ligne[50];
    int n = 0;
    while (fgets(ligne, sizeof ligne, f) != NULL) n++;
    fclose(f);
    printf("lignes=%d\n", n);
    FILE *g = fopen("absent.txt", "r");
    if (g == NULL) printf("absent introuvable\n");
    f = fopen("notes.txt", "r");
    int c, compte = 0;
    while ((c = fgetc(f)) != EOF) if (c == 'e') compte++;
    fclose(f);
    printf("e=%d\n", compte);
    remove("notes.txt");
    return 0;
}
