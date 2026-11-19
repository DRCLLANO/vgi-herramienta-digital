# Prueba de integridad y verificación automática de VGI Digital

Complementa a `LEEME.md`, que se conserva sin cambios porque forma parte de
las sumas depositadas de la 2.13.4.

Desde el 12-oct-2026 (sobre la 2.13.4, sin cambiar la aplicación),
`verificar-integridad.mjs` comprueba lo que las tres pruebas anteriores no
miran porque no es cálculo:

1. **Versión.** El número de versión coincide en `index.html` (metadatos e
   historial de Acerca de), `VERSION.txt`, `sw.js`, `CITATION.cff`,
   `CHANGELOG.md` y `README.md`, y la fecha coincide en los tres sitios que la
   declaran.
2. **Archivos.** Existe todo lo que piden la página, el service worker y el
   manifest, y cada archivo listado en `SHA256SUMS.txt` coincide con su suma.
3. **Protegidos.** `LICENSE` y `NOTICE.md` coinciden con su huella aprobada en
   `huellas-protegidas.json`.
4. **Inventario.** Las fichas de `SCALES`, las de la lista de la aplicación y
   las de `trazabilidad-instrumentos.csv` son exactamente las mismas.
5. **Referencias.** Cada escala lleva su referencia bibliográfica.
6. **Regresiones.** Clave de la GDS-15, versión 3.1 del NECPAL, 4AT completo,
   factores del conversor iguales a los aprobados, sin meperidina, y carga sin
   errores de JavaScript. Desde la 2.15.2, además, el origen de la visita: con
   `?utm_source=` y una etiqueta válida se registra un solo evento
   "origen/<etiqueta>" (en minúsculas), y con una etiqueta inválida o sin
   etiqueta no se registra ninguno. GoatCounter se sustituye por un registro
   local, porque la prueba corre sin red.

```
node verificacion/verificar-integridad.mjs > resultado-integridad.json
```

`verificar-todo.mjs` corre las cinco pruebas y resume el resultado
(`npm test`). El archivo `.github/workflows/verificar.yml` lo ejecuta en
GitHub Actions con cada cambio a `main` y con cada solicitud de cambios, y
guarda las salidas durante 90 días. `generar-sumas.mjs` regenera
`SHA256SUMS.txt` al cerrar una versión (`npm run sumas`).

Se comprobó introduciendo siete errores deliberados sobre una copia de la
2.13.4, cada uno modelado sobre un incidente real o una decisión vigente:
`LICENSE` recortado a 1.462 bytes (sexto incidente), el 4AT retirado de la
lista (quinto), la pregunta 5 de la GDS-15 con la clave invertida (primero),
la versión cambiada solo en `index.html`, el factor de la hidrocodona alterado
(segundo), la referencia de la GDS-15 borrada y un icono del manifest
eliminado. La prueba de integridad señaló los siete. En los siete, las tres
pruebas anteriores terminaron sin fallos: ninguno de esos errores altera un
cálculo que ellas revisen.

Como las demás, esta prueba se escribió con asistencia de un modelo de
lenguaje. Las huellas fijan el estado aprobado de la 2.13.4; no demuestran que
ese estado sea correcto frente a las fuentes.

## Prueba de la Trayectoria (desde la 2.15.0)

`verificar-trayectoria.mjs` comprueba la función Trayectoria sin acceso a red:
la clasificación hospitalaria del Barthel actividad por actividad en sus casos
límite (incluidos los 3 puntos de la escala de 0 a 20 que separan la
recuperación parcial de la ausencia de recuperación), cada umbral de cambio en
su borde exacto, el criterio ambulatorio del Barthel (5 y 10 puntos), el Zarit
sin umbral, el aviso de cruce de los puntos de corte, el recorrido desde el
resultado de una escala hasta la Trayectoria en los dos modos, el texto para la
historia clínica y que nada se escriba en el almacenamiento del dispositivo.

```
node verificacion/verificar-trayectoria.mjs index.html > resultado-trayectoria.json
```

Comprueba que la aplicación aplica los umbrales que se decidieron; no demuestra
que esos umbrales sean los correctos para cada paciente. Sus fuentes están en
la propia vista y en el CHANGELOG.
