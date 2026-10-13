# Instrucciones para asistentes de IA que trabajen en VGI Digital

Este archivo lo leen al empezar Codex, Claude Code y otros asistentes de
programación. Resume cómo está hecho el repositorio, qué decisiones ya están
tomadas y cómo se publica un cambio. Si algo de lo que se pide contradice este
archivo, el asistente lo señala y pregunta antes de actuar.

## Qué es y en qué estado está

VGI Digital es una herramienta web para calcular e interpretar escalas de la
Valoración Geriátrica Integral, basada en el manual "Abordaje geriátrico
integral: escalas de uso frecuente en geriatría" (Editorial PUJ, 2024), con
autorización de sus editores. Autor único del software: Cristian Camilo Llano
Ceballos. Uso educativo y de investigación, sin fines comerciales. DOI del
proyecto: 10.17605/OSF.IO/KMX8H.

**La aplicación está congelada en la 2.13.4 (8-oct-2026).** Solo se cambia por
petición de los revisores de una revista o por un reporte crítico. No se
proponen rediseños, escalas nuevas ni mejoras que nadie pidió.

## Mapa del repositorio

| Archivo | Qué contiene |
|---|---|
| `index.html` | Toda la aplicación: metadatos, estilos base, datos de las escalas y lógica |
| `ui-v3.css`, `ui-motion.css` | Capa visual adaptable y transiciones |
| `sw.js` | Service worker: funcionamiento sin conexión; su `CACHE` lleva la versión |
| `manifest.json`, `icon-*.png`, `vgi-digital-*.png` | Instalación como app e identidad visual |
| `trazabilidad-instrumentos.csv` | Una fila por ficha: ítems, máximo, tramos y referencias |
| `LICENSE`, `NOTICE.md` | Licencia del código y titulares de derechos de los instrumentos (protegidos) |
| `README.md`, `CITATION.cff`, `VERSION.txt`, `CHANGELOG.md` | Documentación, citación y versión |
| `registro-desarrollo.md` | Registro del desarrollo con IA, incluidos los incidentes |
| `verificacion/` | Pruebas automáticas y sus resultados por versión |
| `.github/workflows/verificar.yml` | Corre las pruebas en GitHub en cada cambio |

Dentro de `index.html`, se busca por nombre (los números de línea cambian):

- En `<head>`: el JSON-LD con `softwareVersion` y `dateModified`, y las
  etiquetas `citation_*` y `DC.*`.
- `const SCALES`: las 48 fichas, agrupadas por eje (clínico, valoración
  prequirúrgica y TAVI, funcional, mental, social, paliativos). Cada ficha
  tiene `eje`, `dom`, `name`, `full`, `blurb`, `max`, `ref`, `items` (cada
  ítem con `q` y opciones `o: [{l, v}]`), `interpret(s)` para las sumativas o
  `logic` para las algorítmicas, `external: true` si es complementaria y `note`.
- `const ORDER` y `ALL_IDS`: qué fichas aparecen en la lista y en qué grupo.
  Una ficha que está en `SCALES` pero no en `ORDER` no se ve.
- `const OPIOIDES` y las funciones `opi*`: el conversor de opioides.
- `cortes()`, `total()`, `franjaHTML()`: cálculo y presentación de tramos.
- `renderAbout()`: la sección Acerca de, con el historial de versiones.

## Decisiones clínicas vigentes

Son decisiones del autor. No se cambian sin que él lo pida expresamente.

- No se modifican escalas, puntajes, puntos de corte ni el conversor salvo
  petición explícita.
- Cada escala muestra su referencia bibliográfica. Las complementarias
  declaran que no forman parte del manual.
- Distancias y pesos en unidades métricas.
- Lawton: necesitar ayuda en todas las labores de la casa no da
  "independiente" (adaptación propia frente al original).
- CDR: la regla de memoria 1 o más es un piso que se aplica después de las
  reglas generales; el estadio 0,5 se rotula "Demencia cuestionable o muy leve".
- GDS-15: puntúa "No" en las preguntas 1, 5, 7, 11 y 13, y "Sí" en las demás.
- NECPAL: versión 3.1.
- Conversor: factores del nomograma de Hernández-Ortiz y del taller, sin
  sustituirlos por los de otras fuentes; sin meperidina; con metadona de
  destino, el rescate se indica con morfina o hidromorfona. No se añaden
  advertencias nuevas: la aplicación ya tiene muchas.
- Restituir texto de una versión anterior no equivale a verificarlo: se revisa
  como si se escribiera por primera vez, sobre todo si afirma hechos sobre
  terceros (por ejemplo, un permiso de un titular de derechos).

## Archivos protegidos

`LICENSE` y `NOTICE.md` no se tocan en un cambio que no sea de derechos. El
código está bajo PolyForm Noncommercial 1.0.0 desde la 2.12.0 (MIT hasta la
2.11.5); el contenido de las escalas no está cubierto por esa licencia, y el
logotipo, el símbolo y los iconos están reservados. Sus huellas, y los factores
del conversor, están en `verificacion/huellas-protegidas.json`: si cambian sin
que ese archivo cambie, la verificación falla.

## Textos

- Español de Colombia.
- Sin rayas (guiones largos): se usan paréntesis, comas o dos puntos.
- Comillas rectas ("").
- El crédito del autor va solo en Acerca de. Filiación: Facultad de Medicina,
  Pontificia Universidad Javeriana; Unidad de Geriatría, Hospital
  Universitario San Ignacio.

## Cómo se publica un cambio

1. Cada corrección es una versión nueva. Una versión publicada no se modifica.
2. Si se corrige un error, primero se añade a `verificacion/` una prueba que
   lo detecte y se comprueba que falla; después se corrige.
3. La versión nueva se declara en todos estos sitios (la verificación lo
   comprueba): `softwareVersion` y `dateModified` de `index.html`, primera
   entrada del historial de Acerca de, `VERSION.txt`, `CACHE` de `sw.js`,
   `version` y `date-released` de `CITATION.cff`, `CHANGELOG.md` y la línea
   "**Versión**" del `README.md`.
4. Si cambian tramos, se actualiza `trazabilidad-instrumentos.csv`.
5. `npm test` debe terminar en "TODAS LAS PRUEBAS SUPERADAS". Las salidas de
   `resultados/` se copian a `verificacion/` con el número de versión, como
   las anteriores, y se anotan en `verificacion/LEEME.md`. La prueba de integridad se describe en `verificacion/INTEGRIDAD.md`.
6. `npm run sumas` regenera `SHA256SUMS.txt`.
7. El cambio entra por una rama y una solicitud de cambios (pull request); se
   fusiona en `main` solo con la verificación de GitHub en verde.
8. Después: release en GitHub, carga en OSF y registration de la versión.
   Para confirmar que OSF quedó igual que GitHub, se descarga y se corre
   `sha256sum -c SHA256SUMS.txt`.
9. Se actualizan `registro-desarrollo.md` y el expediente de reproducibilidad.

## Lo que el asistente no hace

- No declara un cambio terminado sin haber corrido `npm test` y mostrado el
  resultado.
- No sube archivos a GitHub ni pide credenciales: entrega los archivos y el
  autor los sube.
- No borra archivos sin preguntar (por ejemplo, `MD5SUMS.txt` o las capturas
  de pantalla).
- No toca la analítica (GoatCounter) ni los metadatos de citación sin que se
  lo pidan.
