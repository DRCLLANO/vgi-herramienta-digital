# Escalas de uso frecuente en Geriatría

Herramienta digital para el cálculo y la interpretación de las escalas de la
Valoración Geriátrica Integral (VGI), organizadas según los cuatro ejes de la
evaluación (clínico, funcional, mental y social) más una sección de paliativos
y pronóstico.

**Versión 2.9** · 43 escalas y un conversor de dosis equianalgésicas de opioides.

## Abrir la herramienta

https://DRCLLANO.github.io/vgi-herramienta-digital/


## Qué es

Un único archivo HTML que se ejecuta por completo en el navegador. No hay
servidor, no hay base de datos y no se transmite ningún dato fuera del
dispositivo. El cálculo de puntajes, la aplicación de puntos de corte y el
resumen de la valoración ocurren localmente.

Lo único que se conserva entre sesiones son las preferencias de uso del propio
dispositivo (escalas favoritas, escalas recientes y tamaño de texto). Las
respuestas de cada escala y la valoración en curso se pierden al cerrar la
aplicación.

**No ingrese nombres, números de documento ni ningún dato que identifique a un
paciente.**

## Uso previsto

Herramienta de apoyo educativo para el cálculo y la interpretación de escalas
de tamización. **No reemplaza la valoración clínica, el juicio profesional ni
los criterios diagnósticos vigentes.** El conversor de opioides es material
educativo y no constituye una guía de prescripción.

## Fuente del contenido

Los ítems, puntajes, puntos de corte y la organización por ejes provienen de:

> Chavarro-Carvajal DA, Heredia Ramírez RA, Cano-Gutiérrez CA, editores.
> *Abordaje geriátrico integral: escalas de uso frecuente en geriatría.*
> Primera edición. Bogotá: Editorial Pontificia Universidad Javeriana,
> Facultad de Medicina; 2024. ISBN 978-958-781-931-1 (impreso),
> 978-958-781-930-4 (digital). DOI 10.11144/Javeriana.9789587819304

Los derechos sobre el manual pertenecen a sus autores y a la Pontificia
Universidad Javeriana. El papel de quien firma este repositorio fue el
desarrollo y la compilación de la aplicación, no la autoría del contenido del
manual. Cada escala conserva además su referencia primaria y, cuando existe, la
de su validación en población colombiana o latinoamericana; ambas se muestran
dentro de la ficha de cada instrumento.

## Autoría y desarrollo asistido por inteligencia artificial

Desarrollo original de **Cristian Camilo Llano Ceballos** (ORCID
[0000-0001-9745-3863](https://orcid.org/0000-0001-9745-3863)), construido
mediante trabajo conversacional con un modelo de lenguaje (Claude, Anthropic)
que actuó como asistente de programación, extracción documental y redacción. El
clínico definió el alcance, aportó las fuentes, tomó todas las decisiones de
contenido y validó cada resultado. Conforme a las recomendaciones del ICMJE y
del COPE, la herramienta de inteligencia artificial no cumple los criterios de
autoría y no figura como autora.

El registro del proceso, los ciclos de verificación y los incidentes críticos
detectados están documentados en
[`registro-desarrollo.md`](registro-desarrollo.md).

## Cómo citar

Véase [`CITATION.cff`](CITATION.cff). Formato sugerido:

> Llano Ceballos CC. Escalas de uso frecuente en Geriatría: herramienta digital
> para la Valoración Geriátrica Integral (versión 2.9) [software]. Zenodo;
> 2026. https://doi.org/10.5281/zenodo.XXXXXXX

## Licencia y derechos

El **código fuente** se publica bajo licencia MIT (archivo `LICENSE`).

El **contenido de las escalas** no está cubierto por esa licencia. Antes de
reutilizar, redistribuir o traducir esta herramienta, lea
[`NOTICE.md`](NOTICE.md): varios instrumentos incluidos tienen titular de
derechos propio y condiciones de uso específicas.

## Contenido del repositorio

| Archivo | Contenido |
|---|---|
| `index.html` | La herramienta completa, en un solo archivo |
| `README.md` | Este documento |
| `LICENSE` | Licencia MIT del código fuente |
| `NOTICE.md` | Alcance de la licencia y derechos sobre el contenido de las escalas |
| `CITATION.cff` | Metadatos de citación |
| `CHANGELOG.md` | Historial de versiones (1.0 a 2.9) |
| `registro-desarrollo.md` | Registro del proceso de desarrollo asistido por IA |
| `.zenodo.json` | Metadatos para el depósito automático en Zenodo |
