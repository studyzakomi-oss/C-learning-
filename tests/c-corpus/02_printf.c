#include <stdio.h>

int main(void)
{
    double v[] = {0.0, 0.5, 1.5, 2.5, 0.125, 1e-5, 123456789.0, 1e20, 3.14159265358979, -2.675, 0.1, 100.0, 1e6, 1e-4, 1234567.0};
    int n = sizeof(v) / sizeof(v[0]);
    for (int i = 0; i < n; i++) {
        printf("[%f] [%.0f] [%.1f] [%.2f] [%e] [%g] [%.3g] [%10.3f] [%-10.2f] [%+.1f] [%G]\n",
               v[i], v[i], v[i], v[i], v[i], v[i], v[i], v[i], v[i], v[i], v[i]);
    }
    printf("[%5s] [%-5s] [%.2s] [%c] [%5c]\n", "ab", "ab", "abcdef", 'z', 'y');
    printf("[%05d] [%-5d] [%+d] [% d] [%x] [%X] [%#x] [%o] [%#o] [%5.3d]\n", 42, 42, 42, 42, 255, 255, 255, 8, 8, 7);
    printf("[%*d] [%-*d] [%.*f]\n", 6, 12, 6, 12, 2, 3.14159);
    printf("100%%\n");
    printf("%ld %lld %hd %hhd\n", -5L, 123456789012345LL, (short) 70000, (char) 300);
    printf("%s\n", "fin");
    return 0;
}
