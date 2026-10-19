#include <stdio.h>

int main(void)
{
    for (int n = 1; n <= 15; n++) {
        if (n % 15 == 0) printf("FizzBuzz\n");
        else if (n % 3 == 0) printf("Fizz\n");
        else if (n % 5 == 0) printf("Buzz\n");
        else printf("%d\n", n);
    }
    int i = 0;
    while (1) {
        i++;
        if (i == 3) continue;
        if (i > 6) break;
        printf("%d ", i);
    }
    printf("\n");
    int k = 10;
    do {
        printf("k=%d ", k);
        k -= 4;
    } while (k > 0);
    printf("\n");
    for (int j = 0; j < 7; j++) {
        switch (j) {
            case 0: printf("zero "); break;
            case 1:
            case 2: printf("un-ou-deux "); break;
            case 3: printf("trois "); /* fall through */
            case 4: printf("quatre "); break;
            default: printf("autre ");
        }
    }
    printf("\n");
    char note = 'B';
    switch (note) {
        case 'A': printf("Excellent\n"); break;
        case 'B': printf("Bien\n"); break;
        default: printf("?\n"); break;
    }
    int x = 5;
    printf("%s\n", x > 3 ? "grand" : "petit");
    printf("%d %d %d\n", x > 3 && x < 10, x < 3 || x == 5, !x);
    for (int a = 1; a <= 3; a++) {
        for (int b = 1; b <= 3; b++) printf("%4d", a * b);
        printf("\n");
    }
    return 0;
}
