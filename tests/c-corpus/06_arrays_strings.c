#include <stdio.h>
#include <string.h>
#include <ctype.h>

#define N 6

int main(void)
{
    int t[N] = {5, 3, 9, 1, 7, 2};
    int min = t[0], max = t[0];
    for (int i = 1; i < N; i++) {
        if (t[i] < min) min = t[i];
        if (t[i] > max) max = t[i];
    }
    printf("min=%d max=%d\n", min, max);
    for (int i = 0; i < N - 1; i++)
        for (int j = 0; j < N - 1 - i; j++)
            if (t[j] > t[j + 1]) { int tmp = t[j]; t[j] = t[j + 1]; t[j + 1] = tmp; }
    for (int i = 0; i < N; i++) printf("%d ", t[i]);
    printf("\n");
    int m[3][4];
    for (int i = 0; i < 3; i++)
        for (int j = 0; j < 4; j++) m[i][j] = i * 10 + j;
    printf("%d %d %zu %zu\n", m[2][3], m[1][0], sizeof m, sizeof m[0]);
    char s[50] = "Bonjour";
    char d[50];
    strcpy(d, s);
    strcat(d, " le monde");
    printf("%s (%zu) %d %d\n", d, strlen(d), strcmp("abc", "abd") < 0, strcmp(s, "Bonjour"));
    char nom[] = "zakomi";
    nom[0] = (char) toupper(nom[0]);
    printf("%s %zu\n", nom, sizeof nom);
    int voyelles = 0;
    for (size_t i = 0; i < strlen(d); i++) {
        char c = (char) tolower(d[i]);
        if (strchr("aeiouy", c) != NULL) voyelles++;
    }
    printf("voyelles=%d\n", voyelles);
    char inv[50];
    size_t len = strlen(s);
    for (size_t i = 0; i < len; i++) inv[i] = s[len - 1 - i];
    inv[len] = '\0';
    printf("%s\n", inv);
    char *p = strstr(d, "le");
    printf("%s\n", p);
    char buf[64];
    sprintf(buf, "%d-%s-%.1f", 42, "x", 2.25);
    printf("%s\n", buf);
    int a, b;
    sscanf("17 25", "%d %d", &a, &b);
    printf("%d\n", a + b);
    printf("%d %d %d\n", isdigit('7') != 0, isalpha('7') != 0, isspace(' ') != 0);
    const char *mots[] = {"un", "deux", "trois"};
    for (int i = 0; i < 3; i++) printf("%s:%zu ", mots[i], strlen(mots[i]));
    printf("\n");
    return 0;
}
