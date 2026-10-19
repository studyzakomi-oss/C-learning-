#include <stdio.h>
#include <limits.h>

int main(void)
{
    int a = INT_MAX;
    unsigned int u = 0;
    char c = 'A';
    short s = 32767;
    long l = 1234567890123L;
    long long ll = LLONG_MAX;
    float f = 1.1f;
    double d = 1.0 / 3.0;
    a = a + 1;
    u = u - 1;
    c = c + 2;
    s = s + 1;
    printf("%d %u %c %d %ld %lld\n", a, u, c, s, l, ll);
    printf("%f %.10f %.15f\n", f, f, d);
    printf("%zu %zu %zu %zu %zu\n", sizeof(char), sizeof(int), sizeof(long), sizeof(double), sizeof(int *));
    printf("%d %d %d\n", 7 / 2, -7 / 2, -7 % 2);
    printf("%.2f %.2f\n", 7 / 2.0, (double) 7 / 2);
    int x = 3.99;
    printf("%d %d\n", x, (int) -3.99);
    unsigned char uc = 300;
    signed char sc = 200;
    printf("%d %d\n", uc, sc);
    printf("%u\n", (unsigned) -1);
    printf("%lu\n", (unsigned long) -1);
    printf("%d\n", 'a' + 1);
    printf("%c%c%c\n", 72, 105, 33);
    return 0;
}
