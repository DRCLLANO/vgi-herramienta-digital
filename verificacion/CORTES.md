# Puntos de corte contra las fuentes

Prueba añadida el 17 de octubre de 2026 sobre la versión 2.13.4, sin cambiar la
aplicación ni ninguno de los archivos que ya existían.

## Qué problema resuelve

`verificar-escalas.mjs` comprueba que todo puntaje tenga un veredicto y que los
tramos coincidan con `trazabilidad-instrumentos.csv`. Esa tabla se generó a
partir de la propia aplicación: detecta si un tramo cambia, pero no si estaba
mal desde el principio. `verificar-fuentes.mjs` y `verificar-cdr.mjs` sí
comparan con la fuente, pero solo trece escalas tenían esa comparación.

Esta prueba la extiende a las 34 restantes con transcripciones independientes:
los puntos de corte se copiaron de cada fuente antes de abrir el código de la
aplicación, de modo que la referencia no repite la lectura que hizo el código
(el modo de fallo de la sección 8.10 del registro de desarrollo).

- `fuentes-manual-2024.json`: las 23 escalas que proceden del manual de
  referencia (Editorial PUJ, 2024), con tabla y página.
- `fuentes-complementarias.json`: las 11 escalas complementarias, cada una con
  su artículo original (PAINAD, NECPAL 3.1, PaP, Walter, Lee, 4AT, Zarit, lista
  prequirúrgica ACS NSQIP/AGS, RCRI, FTS y EFT).

## Qué compara

- **Sumativas**: cada puntaje posible cae en el tramo de la fuente; la
  aplicación no parte ni une tramos de la fuente; los valores de cada ítem, el
  mínimo y el máximo coinciden. Cuando la fuente da grupos de riesgo sin nombre
  (RCRI, Walter, Lee, PaP) se exige la partición, no la redacción.
- **Algorítmicas**: CAM (16 combinaciones), criterios DSM 5-TR de delirium (32
  combinaciones), subescalas del MOS, NECPAL (sin parámetros, negativo; con
  pregunta sorpresa positiva y cualquier parámetro, positivo; umbrales del
  formulario 3.1 en el texto), grados de Ashworth, estadios de la GDS de
  Reisberg, tipos de maltrato y dominios de la lista prequirúrgica.

## Cómo leer el resultado

- **Fallos**: la aplicación contradice la fuente. La prueba termina en rojo.
- **Avisos**: la fuente no lo define (un puntaje sin tramo, una escala sin
  puntos de corte, una regla ambigua). Se informa qué hace la aplicación, sin
  juzgarlo.
- **Decisiones**: cuando el autor decide que un fallo o un aviso es
  intencional, se añade su clave a `"decisiones"` del archivo de fuentes
  correspondiente, con fecha y motivo, por ejemplo:

  ```json
  "decisiones": {
    "barthel:vacio:60-60": { "fecha": "2026-10-17", "motivo": "60 es dependencia leve, como en la versión original" }
  }
  ```

  Desde ese momento deja de marcarse y queda listado como decidido.
- **Por corregir**: cuando el autor decide que la aplicación debe cambiar, la
  clave va a `"porCorregir"` con la corrección pedida. Se lista aparte, no hace
  fallar la prueba y queda como recordatorio para la próxima versión (la
  aplicación congelada no se modifica). Al corregirla, el hallazgo cambia o
  desaparece y la entrada se revisa.

Una decisión o corrección cuya clave ya no aparece se informa en
`decisionesSinHallazgo`.

Estado al 17 de octubre de 2026: 13 decisiones del autor registradas y 2
correcciones pendientes, ambas en la lista prequirúrgica (los dominios
cardiaco y pulmonar, y su resumen acotado a 12 dominios).

Las transcripciones no se editan para que coincidan con la aplicación. Si la
fuente y la aplicación difieren, la diferencia se resuelve con una decisión
registrada o con una versión nueva de la aplicación, nunca cambiando la
referencia. La única corrección hecha a una transcripción fue de lectura y
antes de usarla: el NECPAL decía que en la 3.1 la pregunta sorpresa no
condiciona el resultado, lo que era una inferencia que el formulario no
sostiene (ver el campo `correccion`).

## Cómo se comprobó que la prueba detecta errores

Se corrió sobre 16 copias de la 2.13.4 con un error sembrado cada una: cortes
del MNA-SF, EAT-10, GAD-7, PaP, Zarit, Walter, 4AT, FTS y RCRI; CAM que acepta
los criterios 1 y 3; DSM que diagnostica con 4 de 5; un ítem del MOS en la
subescala equivocada; Ashworth sin el grado 1+; la anorexia del PaP con 1 punto
(el valor de una guía secundaria, frente al 1,5 del original); la edad de 75 a
79 años del índice de Lee con 3 puntos; y el NECPAL exigiendo dos parámetros.
La prueba detectó los dieciséis.

## Uso

Desde la raíz del repositorio:

```
node verificacion/verificar-cortes.mjs index.html verificacion/fuentes-manual-2024.json verificacion/fuentes-complementarias.json > resultado-cortes.json
```

`resultado-cortes-2.13.4.json` es la salida sobre la versión congelada: 34
escalas, ningún fallo ni aviso pendiente, 13 decisiones y 2 correcciones para
la próxima versión.

En GitHub corre en su propio flujo, "Verificar puntos de corte"
(`.github/workflows/verificar-cortes.yml`), separado de "Verificar VGI Digital".
