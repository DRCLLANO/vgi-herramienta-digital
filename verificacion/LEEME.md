# Verificación reproducible de VGI Digital

Este script repite, fuera de la sesión de desarrollo, las pruebas automatizadas
descritas en el manuscrito y en `registro-desarrollo.md` (sección 8.7).

## Requisitos

- Node.js 18 o posterior
- Playwright con Chromium: `npm install playwright` y `npx playwright install chromium`

## Uso

Desde la raíz del repositorio:

```
node verificacion/verificar-escalas.mjs index.html trazabilidad-instrumentos.csv > resultado.json
```

El segundo argumento es opcional. El script abre `index.html` en un navegador
sin acceso a red y comprueba:

1. **Estructura.** Cada instrumento está clasificado en un eje y, si es
   sumativo, su puntaje máximo coincide con la suma de los máximos de sus ítems.
2. **Interpretación.** Todo puntaje posible del rango produce un veredicto.
3. **Recorrido.** Cada instrumento se abre, se responde, muestra su resultado y
   se incorpora al resumen por esferas, y el resumen se dibuja sin errores.
4. **Tramos** (si se indica la tabla). Los tramos derivados de cada escala
   coinciden con los registrados en `trazabilidad-instrumentos.csv`.

La salida incluye la suma SHA-256 del archivo evaluado, la versión declarada,
los recuentos (escalas, ítems, opciones y umbrales) y la lista de fallos. El
proceso termina con código 0 si todo se supera y con 1 si hay algún fallo.

`resultado-2.10.6.json` a `resultado-2.10.11.json` son la salida de este script
sobre esas seis versiones;
los recuentos y la lista de fallos (vacía) son idénticos en todas.
`resultado-2.11.0.json` corresponde a la 2.11.0, que añade cuatro instrumentos
complementarios al eje clínico: los recuentos suben a 48 fichas y 47 escalas, y
la lista de fallos sigue vacía. `resultado-2.11.1.json` corresponde a la 2.11.1,
que corrige el inicio de los tramos de Norton, Short FES-I y Zarit; la tabla de
trazabilidad se actualizó en consecuencia y la lista de fallos sigue vacía.
`resultado-2.11.2.json` corresponde a la 2.11.2, que corrige la línea "Rango" de
la ficha de evidencia (Norton, Short FES-I, Zarit y MOS); los recuentos no cambian y la lista de fallos sigue vacía.
`resultado-2.11.3.json` corresponde a la 2.11.3, que corrige el aviso "Sin iniciar"
y la regla del MOS en la ficha de evidencia; los recuentos no cambian y la lista
de fallos sigue vacía.
`resultado-2.11.4.json` y `resultado-2.11.5.json` corresponden a la 2.11.4
(sección de agradecimientos) y a la 2.11.5 (identidad visual); los recuentos no
cambian y la lista de fallos sigue vacía.
`resultado-2.12.0.json` corresponde a la 2.12.0 (cambio de licencia del código a
PolyForm Noncommercial 1.0.0); los recuentos no cambian y la lista de fallos
sigue vacía. `resultado-2.12.1.json` corresponde a la 2.12.1 (transiciones e
interacción, solo presentación); los recuentos no cambian y la lista de fallos
sigue vacía. `resultado-2.12.2.json` corresponde a la 2.12.2 (ajustes de esas
transiciones); los recuentos no cambian y la lista de fallos sigue vacía.
`resultado-2.12.3.json` corresponde a la 2.12.3 (corrección del puntaje global
del CDR); los recuentos no cambian y la lista de fallos sigue vacía.
`resultado-2.13.0.json` corresponde a la 2.13.0, en la que la PPS pasa de un ítem
con 11 opciones a cinco ítems con 26 opciones: los ítems suben de 371 a 375 y las
opciones de 1.264 a 1.279; escalas y umbrales no cambian y la lista de fallos
sigue vacía.
`resultado-2.13.1.json` corresponde a la 2.13.1 (correcciones contra las fuentes);
los ítems pasan de 375 a 372 y las opciones de 1.279 a 1.277 (SPPB, Charlson
Colombia, Lawton y CDR), y la lista de fallos sigue vacía. En esta versión el script incorpora dos formas de puntuar
las preguntas de selección múltiple (con tope y "cualquiera suma", que usa el
VES-13) y deduce el paso entre puntajes de los valores de las opciones y no de
si el máximo es entero; así los tramos del PPI y del G8 recorren los medios puntos.
`resultado-2.13.2.json` corresponde a la 2.13.2 (corrección del CDR); los
recuentos no cambian y la lista de fallos sigue vacía.
`resultado-2.13.3.json` corresponde a la 2.13.3 (seguridad del conversor); los
recuentos no cambian y la lista de fallos sigue vacía.
`resultado-2.13.4.json` corresponde a la 2.13.4 (meperidina retirada y rescates
del conversor); los recuentos no cambian y la lista de fallos sigue vacía.

## Prueba del puntaje global del CDR

Desde la 2.12.3, `verificar-cdr.mjs` compara la lógica del CDR de la
aplicación con una transcripción aparte de las reglas de Washington University
(Knight ADRC, "CDR Scoring Rules") en todas las combinaciones de las seis
áreas con las opciones que ofrece la aplicación (15.625 hasta la 2.13.0; 12.500
desde la 2.13.1, en que el cuidado personal deja de tener 0,5), y comprueba
casos fijos tomados de esas reglas (nueve hasta la 2.13.1, doce desde la 2.13.2):

```
node verificacion/verificar-cdr.mjs index.html > resultado-cdr.json
```

Las tres pruebas anteriores no podían detectar el error que corrigió la 2.12.3:
toda combinación producía un veredicto, solo que no el correcto. Sobre la
2.12.2 esta prueba señala 7.149 discrepancias y falla cinco de los nueve casos
fijos; sobre la 2.12.3 no hay discrepancias (`resultado-cdr-2.12.3.json`).

Hasta la 2.13.1 la referencia aplicaba la regla de memoria 1 o más ("el CDR no
puede ser 0; es 0,5 cuando la mayoría de las secundarias están en 0") antes de
las reglas generales, en el mismo orden que la aplicación. Compartía así el
error y no podía señalarlo: con tres áreas en 0 y dos por encima de la memoria
ambas daban 0,5, cuando el reparto tres y dos da el puntaje de la memoria. En
la 2.13.2 la regla pasa a ser un piso en las dos. Con la referencia corregida,
la 2.13.1 tiene 50 discrepancias y falla dos de los doce casos fijos; la 2.13.2
no tiene ninguna (`resultado-cdr-2.13.2.json`). Una referencia escrita con la
misma lectura de la regla que el código no es independiente, aunque se escriba
aparte.

## Alcance

El script se escribió con asistencia de un modelo de lenguaje. Reproduce las
pruebas, pero no comprueba que los ítems y umbrales coincidan con las
publicaciones originales ni sustituye una auditoría independiente. Se probó
introduciendo errores deliberados (un máximo alterado, un tramo desplazado y un
fallo en el resumen por esferas), y los tres se señalaron.

## Prueba contra las fuentes primarias

Desde la 2.13.1, `verificar-fuentes.mjs` compara la aplicación con una
transcripción aparte de las reglas publicadas, en todas las combinaciones:

- VES-13 (Saliba 2001): 12.288 combinaciones de edad, salud, actividades
  físicas y actividades funcionales.
- PPI (Morita 1999): las 72 combinaciones de sus cinco factores.
- Coherencia PPS y PPI: cada nivel de la PPS debe citar los puntos que el PPI le
  asigna, y el criterio del NECPAL solo por debajo del 50 %.
- Conversor de opioides: 400 pares de origen y destino, 12 dosis y 4 motivos
  (19.200 cálculos), la ida y vuelta entre opioides que no son metadona y el
  dibujo del resultado de los 400 pares.
- 45 comprobaciones de casos de referencia de la revisión externa de la 2.13.0 (Charlson,
  Charlson Colombia, Lawton, EQ-5D, CFS, PPS, SPPB, Fried, pérdida de peso,
  entradas numéricas, selección múltiple sin evaluar, vulnerabilidad social,
  PPI y G8).

```
node verificacion/verificar-fuentes.mjs index.html > resultado-fuentes.json
```

Sobre la 2.13.0 señala 10.057 discrepancias (9.216 en el VES-13, 36 en el PPI,
14 en la coherencia PPS y PPI, 752 en el conversor y 37 en los casos de
referencia); sobre la 2.13.1, ninguna
(`resultado-fuentes-2.13.1.json`). Las transcripciones de referencia se
escribieron también con asistencia de un modelo de lenguaje y deben cotejarse
con las publicaciones citadas.

Desde la 2.13.3 la misma prueba incluye una sección de seguridad del conversor
(`seguridadConversor`): con parche de destino, la presentación sugerida no
supera la liberación calculada y es la mayor que no la supera; por debajo del
parche mínimo se avisa "Sin presentación compatible" sin posología ni rescate;
con fentanilo transdérmico se advierte la falta de tolerancia a opioides por
debajo de 60 mg de morfina oral; y al cambiar el origen en la pantalla real la
dosis se vacía. Son 2.400 combinaciones más tres casos. Sobre la 2.13.2 señala
5.535 discrepancias; sobre la 2.13.3, ninguna (`resultado-fuentes-2.13.3.json`).
Las comprobaciones anteriores del conversor validaban la cifra calculada, pero
no lo que la pantalla proponía a partir de ella.

En la 2.13.4 se retiró la meperidina, de modo que el conversor tiene 361 pares
(17.328 cálculos) y la sección de seguridad 2.280 combinaciones. Esa sección
comprueba además que el rescate con parche se calcule sobre la presentación
sugerida y que, con metadona de destino, el rescate se indique con morfina o
hidromorfona. Sobre la 2.13.3 señala 1.444 discrepancias; sobre la 2.13.4,
ninguna (`resultado-fuentes-2.13.4.json`). Estas comprobaciones parten de los
factores que fija la aplicación: verifican que se apliquen como se decidió, no
que sean farmacológicamente correctos.
