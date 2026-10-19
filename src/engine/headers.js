// En-têtes standard virtuels : du vrai texte C, analysé par le moteur lui-même.
// Les fonctions déclarées ici sont implémentées dans builtins.js.

const SIZE_T = `#ifndef __CQ_SIZE_T
#define __CQ_SIZE_T
typedef unsigned long size_t;
#endif
#ifndef NULL
#define NULL ((void*)0)
#endif
`;

export const STD_HEADERS = {
  'stdio.h': `${SIZE_T}
typedef struct _IO_FILE FILE;
extern FILE *stdin;
extern FILE *stdout;
extern FILE *stderr;
#define EOF (-1)
#define SEEK_SET 0
#define SEEK_CUR 1
#define SEEK_END 2
#define BUFSIZ 8192
int printf(const char *format, ...);
int scanf(const char *format, ...);
int puts(const char *s);
int putchar(int c);
int getchar(void);
char *fgets(char *s, int n, FILE *stream);
int fputs(const char *s, FILE *stream);
int fputc(int c, FILE *stream);
int putc(int c, FILE *stream);
int fgetc(FILE *stream);
int getc(FILE *stream);
int ungetc(int c, FILE *stream);
int fprintf(FILE *stream, const char *format, ...);
int fscanf(FILE *stream, const char *format, ...);
int sprintf(char *s, const char *format, ...);
int snprintf(char *s, size_t n, const char *format, ...);
int sscanf(const char *s, const char *format, ...);
FILE *fopen(const char *filename, const char *mode);
int fclose(FILE *stream);
int feof(FILE *stream);
int ferror(FILE *stream);
int fflush(FILE *stream);
void perror(const char *s);
int remove(const char *filename);
int rename(const char *oldname, const char *newname);
void rewind(FILE *stream);
int fseek(FILE *stream, long offset, int whence);
long ftell(FILE *stream);
size_t fread(void *ptr, size_t size, size_t n, FILE *stream);
size_t fwrite(const void *ptr, size_t size, size_t n, FILE *stream);
`,
  'stdlib.h': `${SIZE_T}
#define EXIT_SUCCESS 0
#define EXIT_FAILURE 1
#define RAND_MAX 2147483647
void *malloc(size_t size);
void *calloc(size_t n, size_t size);
void *realloc(void *ptr, size_t size);
void free(void *ptr);
void exit(int status);
void abort(void);
int abs(int n);
long labs(long n);
long long llabs(long long n);
int atoi(const char *s);
long atol(const char *s);
double atof(const char *s);
long strtol(const char *s, char **end, int base);
double strtod(const char *s, char **end);
int rand(void);
void srand(unsigned int seed);
void qsort(void *base, size_t n, size_t size, int (*cmp)(const void *, const void *));
`,
  'string.h': `${SIZE_T}
size_t strlen(const char *s);
char *strcpy(char *dest, const char *src);
char *strncpy(char *dest, const char *src, size_t n);
char *strcat(char *dest, const char *src);
char *strncat(char *dest, const char *src, size_t n);
int strcmp(const char *a, const char *b);
int strncmp(const char *a, const char *b, size_t n);
char *strchr(const char *s, int c);
char *strrchr(const char *s, int c);
char *strstr(const char *s, const char *sub);
void *memset(void *s, int c, size_t n);
void *memcpy(void *dest, const void *src, size_t n);
void *memmove(void *dest, const void *src, size_t n);
int memcmp(const void *a, const void *b, size_t n);
`,
  'ctype.h': `int isalpha(int c);
int isdigit(int c);
int isalnum(int c);
int isspace(int c);
int isupper(int c);
int islower(int c);
int ispunct(int c);
int isprint(int c);
int isxdigit(int c);
int toupper(int c);
int tolower(int c);
`,
  'math.h': `#define HUGE_VAL (1.0/0.0)
#define INFINITY (1.0f/0.0f)
#define NAN (0.0f/0.0f)
double sqrt(double x);
double pow(double x, double y);
double fabs(double x);
double floor(double x);
double ceil(double x);
double round(double x);
double trunc(double x);
double fmod(double x, double y);
double sin(double x);
double cos(double x);
double tan(double x);
double atan(double x);
double atan2(double y, double x);
double exp(double x);
double log(double x);
double log10(double x);
double log2(double x);
double hypot(double x, double y);
double fmax(double a, double b);
double fmin(double a, double b);
`,
  'stdbool.h': `#define bool _Bool
#define true 1
#define false 0
`,
  'limits.h': `#define CHAR_BIT 8
#define SCHAR_MIN (-128)
#define SCHAR_MAX 127
#define UCHAR_MAX 255
#define CHAR_MIN (-128)
#define CHAR_MAX 127
#define SHRT_MIN (-32768)
#define SHRT_MAX 32767
#define USHRT_MAX 65535
#define INT_MIN (-2147483647-1)
#define INT_MAX 2147483647
#define UINT_MAX 4294967295U
#define LONG_MIN (-9223372036854775807L-1)
#define LONG_MAX 9223372036854775807L
#define ULONG_MAX 18446744073709551615UL
#define LLONG_MIN (-9223372036854775807LL-1)
#define LLONG_MAX 9223372036854775807LL
#define ULLONG_MAX 18446744073709551615ULL
`,
  'float.h': `#define FLT_MAX 3.40282347e+38F
#define FLT_MIN 1.17549435e-38F
#define FLT_EPSILON 1.19209290e-7F
#define DBL_MAX 1.7976931348623157e+308
#define DBL_MIN 2.2250738585072014e-308
#define DBL_EPSILON 2.2204460492503131e-16
#define FLT_DIG 6
#define DBL_DIG 15
`,
  'stddef.h': `${SIZE_T}
typedef long ptrdiff_t;
`,
  'stdint.h': `typedef signed char int8_t;
typedef short int16_t;
typedef int int32_t;
typedef long int64_t;
typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef unsigned int uint32_t;
typedef unsigned long uint64_t;
#define INT32_MAX 2147483647
#define INT32_MIN (-2147483647-1)
#define UINT32_MAX 4294967295U
`,
  'time.h': `typedef long time_t;
typedef long clock_t;
#define CLOCKS_PER_SEC 1000000L
time_t time(time_t *t);
clock_t clock(void);
`,
  'assert.h': `void __cq_assert(int ok, const char *expr, int line);
#define assert(e) __cq_assert((e) != 0, #e, __LINE__)
`,
};

/** Fonction standard -> en-tête qui la déclare (pour les messages du tuteur). */
export const FUNC_HEADER = {};
for (const [h, text] of Object.entries(STD_HEADERS)) {
  for (const m of text.matchAll(/\b([a-z_][a-z0-9_]*)\s*\(/g)) {
    if (!['defined', 'sizeof', 'int', 'void', 'char', 'long', 'double', 'e'].includes(m[1]) && !m[1].startsWith('__')) FUNC_HEADER[m[1]] ??= h;
  }
}
FUNC_HEADER.assert = 'assert.h';
for (const id of ['NULL', 'size_t']) FUNC_HEADER[id] = 'stdio.h';
FUNC_HEADER.EOF = 'stdio.h';
FUNC_HEADER.FILE = 'stdio.h';
FUNC_HEADER.stdin = FUNC_HEADER.stdout = FUNC_HEADER.stderr = 'stdio.h';
FUNC_HEADER.bool = FUNC_HEADER.true = FUNC_HEADER.false = 'stdbool.h';
FUNC_HEADER.INT_MAX = FUNC_HEADER.INT_MIN = 'limits.h';
FUNC_HEADER.EXIT_SUCCESS = FUNC_HEADER.EXIT_FAILURE = FUNC_HEADER.RAND_MAX = 'stdlib.h';
