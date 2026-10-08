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

## Prueba del puntaje global del CDR

Desde la 2.12.3, `verificar-cdr.mjs` compara la lógica del CDR de la
aplicación con una transcripción aparte de las reglas de Washington University
(Knight ADRC, "CDR Scoring Rules") en las 15.625 combinaciones posibles de las
seis áreas, y comprueba nueve casos fijos tomados de esas reglas:

```
node verificacion/verificar-cdr.mjs index.html > resultado-cdr.json
```

Las tres pruebas anteriores no podían detectar el error que corrigió la 2.12.3:
toda combinación producía un veredicto, solo que no el correcto. Sobre la
2.12.2 esta prueba señala 7.149 discrepancias y falla cinco de los nueve casos
fijos; sobre la 2.12.3 no hay discrepancias (`resultado-cdr-2.12.3.json`).

## Alcance

El script se escribió con asistencia de un modelo de lenguaje. Reproduce las
pruebas, pero no comprueba que los ítems y umbrales coincidan con las
publicaciones originales ni sustituye una auditoría independiente. Se probó
introduciendo errores deliberados (un máximo alterado, un tramo desplazado y un
fallo en el resumen por esferas), y los tres se señalaron.
