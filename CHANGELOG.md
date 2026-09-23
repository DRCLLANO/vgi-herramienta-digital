# Historial de versiones

Transcrito del historial que la propia aplicación muestra en su sección
"Acerca de".

## 2.10.8

Avisos de finalidad y de desarrollo, sin cambios en las escalas, sus reglas de
cálculo, puntos de corte ni interpretaciones clínicas.

- La sección "Uso previsto" de Acerca de pasa a llamarse "Finalidad y
  condiciones de uso", se ubica antes de "Derechos y permisos" y declara fines
  exclusivamente educativos y de investigación, sin finalidad comercial.
- La misma formulación sustituye a "finalidad educativa y de apoyo asistencial,
  sin ánimo de lucro" en "Derechos y permisos", y a "Uso educativo" en el pie de
  la sección, en este README y en `CITATION.cff`.
- La ficha de desarrollo declara el apoyo de herramientas de inteligencia
  artificial generativa, Claude (Anthropic) y ChatGPT (OpenAI), y las funciones
  que asumió el autor: alcance, selección de fuentes, decisiones clínicas y
  verificación.
- Se incorpora el ajuste de redacción del historial de la 2.10.7 hecho en la
  rama principal después de publicarla, sin cambio de versión.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.10.8`.
- La versión 2.10.6, analizada en el manuscrito, se conserva sin cambios en la
  etiqueta `v2.10.6` del repositorio y en el depósito de OSF.

## 2.10.7

Corrección de metadatos, sin cambios en las escalas, sus reglas de cálculo,
puntos de corte ni interpretaciones clínicas.

- El título de citación (`citation_title`, `DC.title`, `og:title`, metadatos
  estructurados y `CITATION.cff`) pasa a ser "VGI Digital: herramienta digital
  para la Valoración Geriátrica Integral", para no confundirse con el título del
  manual de 2020.
- Se corrige la filiación institucional del autor en los metadatos de citación
  y en `CITATION.cff`.
- Se unifica el título de la pestaña del navegador y del manifiesto.
- Se documentan tres ajustes introducidos en la rama principal después de la
  2.10.6 sin cambio de versión: estilo de los párrafos de la sección Acerca de,
  orden de la filiación en la ficha del autor y título en la cita sugerida.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.10.7`.
- La versión 2.10.6, analizada en el manuscrito, se conserva sin cambios en la
  etiqueta `v2.10.6` del repositorio y en el depósito de OSF.

## 2.10.6

Restitución de los archivos de derechos, sin cambios en las escalas, sus reglas
de cálculo, puntos de corte ni interpretaciones clínicas.

- `LICENSE` recupera las cuatro exclusiones numeradas (contenido de las escalas
  y alcance de la autorización de los editores, instrumentos con titular propio,
  documentación bajo CC BY 4.0 y fotografía del autor) y su versión completa en
  inglés. La reescritura de 2.10.4 las había reducido a un párrafo de remisión y
  había eliminado el texto en inglés.
- `NOTICE.md` recupera la tabla de instrumentos con su titular y su situación
  (Mini-Cog, MNA-SF, EAT-10, NECPAL CCOMS-ICO, MMSE, EuroQol-5D-5L, Clinical
  Frailty Scale, NPI y Zarit), que había quedado convertida en una lista sin
  titulares, y la sección sobre qué publicar si un titular no autoriza la
  reproducción abierta de sus ítems. Se corrige la numeración de secciones, que
  saltaba de la 3 a la 6.
- Se añade en `LICENSE` y en `NOTICE.md` la cláusula sobre el logotipo, el
  símbolo y los iconos de la identidad visual VGI Digital, no cubiertos por la
  licencia MIT. El historial de 2.10.4 daba por hecha esa aclaración en la
  licencia, donde no llegó a constar.
- Se retira la afirmación de que el Mini-Cog se reimprime con permiso de su
  autor. Constaba en `NOTICE.md` y en la ficha del instrumento dentro de la
  aplicación, y no hay constancia documentada de esa autorización. Se conserva
  la identificación del titular y la advertencia de verificar sus condiciones.
- La relación de instrumentos con titular propio deja de declarar el estado de
  las gestiones con cada titular ("resuelto", "por verificar") y se limita a
  identificar al titular, que es lo que consta.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.10.6`.

## 2.10.5

Corrección de la identidad visual introducida en 2.10.4, sin cambios en las
escalas, sus reglas de cálculo, puntos de corte ni interpretaciones clínicas.

- Se limita el tamaño del logotipo completo en la sección "Acerca de". El
  archivo `vgi-digital-logo-verde.png` mide 1580x877 px y la clase
  `.brand-showcase` no tenía ninguna regla de estilo, de modo que el navegador
  lo pintaba a tamaño natural y desbordaba la columna de texto tanto en
  escritorio como en móvil.
- Se muestra el símbolo de marca en la cabecera de las pantallas pequeñas. El
  bloque `.nav-brand` solo se despliega en la navegación lateral de escritorio
  (a partir de 960 px), así que en móvil la marca no aparecía en ningún sitio.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.10.5`, y se ponen al día `README.md` y `CITATION.cff`, que habían quedado
  declarando la versión 2.10.3.

## 2.10.4

Actualización de identidad visual, sin cambios en las escalas, sus reglas de
cálculo, puntos de corte ni interpretaciones clínicas.

- Se incorpora la identidad visual **VGI Digital** en tonos verdes.
- Se añade el logotipo completo `vgi-digital-logo-verde.png`.
- Se añade el símbolo independiente `vgi-digital-simbolo-verde.png`.
- Se regeneran los iconos de la PWA en 120, 152, 167, 180, 192 y 512 px,
  junto con el icono `maskable` de 512 px.
- El símbolo se integra en la navegación de escritorio y el logotipo completo
  se muestra en la sección "Acerca de".
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.10.4`.
- Se aclara en la licencia que el logotipo, símbolo e iconos de identidad visual
  no están cubiertos por la licencia MIT del código.
- La identidad visual fue desarrollada mediante un proceso asistido por IA
  generativa y posteriormente seleccionada, adaptada e integrada técnicamente
  en la aplicación.

## 2.10.3

Metadatos de autoría y de citación, sin cambios en las escalas, sus reglas de
cálculo, puntos de corte ni interpretaciones.

- La página declara ahora su autoría en forma legible por máquina: `author`,
  etiquetas de citación del esquema Highwire (`citation_*`), Dublin Core y un
  bloque JSON-LD de tipo `SoftwareApplication` que vincula la herramienta con
  el ORCID de su autor y con el DOI del depósito. Hasta esta versión el vínculo
  solo era visible para quien abriera el panel "Acerca de".
- Sección "Cómo citar" dentro de "Acerca de", con el formato sugerido, el DOI
  10.17605/OSF.IO/KMX8H y los enlaces al depósito y al código fuente.
- El ORCID de la ficha de autor pasa a ser un enlace al registro.
- `link rel="canonical"` y `link rel="license"`, y metadatos Open Graph para
  que el enlace compartido muestre título, descripción e icono.

## 2.10.2

Ampliación de los descargos, sin cambios en las escalas, sus reglas de cálculo,
puntos de corte ni interpretaciones.

- Sección propia de derechos y permisos en "Acerca de": consta la autorización
  de los editores del manual para usar su contenido en la herramienta, que esa
  autorización no se extiende a quien reutilice o redistribuya la aplicación, y
  que varios instrumentos incluidos tienen titular de derechos propio con
  condiciones que dependen de ese titular, remitiendo a `NOTICE.md`.
- Se declara la finalidad educativa y de apoyo asistencial, sin ánimo de lucro,
  y se recuerda que la licencia MIT cubre el código y no el contenido de las
  escalas.
- El pie de la aplicación recoge las mismas tres constancias en forma breve.

## 2.10.1

Actualización menor de interfaz, sin cambios en las escalas, sus reglas de
cálculo, puntos de corte ni interpretaciones.

- Navegación lateral y cuadrícula de tarjetas en pantallas amplias.
- Barra inferior móvil estable, con seis columnas fijas, rótulos abreviados y
  compatibilidad con el área segura del dispositivo; se optimiza también la
  orientación horizontal y Microsoft Edge para móviles.
- Mejora de accesibilidad: zoom del navegador habilitado, foco visible, enlace
  para saltar al contenido y objetivos táctiles de al menos 44 px.
- Jerarquía visual más clara para encabezados, progreso, resultados y acciones.

## 2.10

Uso sin conexión: la aplicación se instala en la pantalla de inicio y funciona
sin señal tras la primera visita (manifest, iconos y service worker).

Se restituye el 4AT. Dos copias de la versión 2.9 habían divergido: la
depositada conservaba el 4AT y el conversor anterior, mientras que la publicada
incorporaba el conversor reescrito pero había perdido la escala. Esta versión
reúne ambas ramas sin descartar trabajo de ninguna.

## 2.9

Conversor de opioides: el resultado encabeza con la dosis del opioide de
destino y no con el equivalente de morfina, que pasa al desglose. Se avisa
cuando el opioide de origen y el de destino coinciden, porque entonces el
cálculo es un ajuste de dosis y no una rotación.

4AT, prueba rápida de cribado de delirium, junto al CAM en el eje mental.
Aplicable al paciente somnoliento o que no colabora, en quien el CAM no puede
completarse.

## 2.8

NECPAL reconstruido sobre la versión 3.1 del instrumento: trece parámetros con
sus umbrales explícitos, y los criterios de enfermedad crónica avanzada de las
once condiciones del bloque específico, desplegables dentro del ítem.

## 2.7

Pestaña propia de Paliativos y pronóstico, que reúne el NECPAL, el PPS, el PPI,
el PaP, los índices de Walter y de Lee y el conversor de opioides. Retrato en
la ficha de autor.

## 2.6

Franja de bandas en el resultado, que sitúa el puntaje entre los puntos de
corte. Encabezado de eje con jerarquía. Los instrumentos de pronóstico quedan
separados de los de necesidades paliativas.

## 2.5.1

Corrección: la vista de valoración geriátrica integral fallaba al abrirse.

## 2.5

Funcionamiento sin conexión e instalación como aplicación. Ficha de evidencia
con los puntos de corte aplicados. Modo de valoración geriátrica integral con
resumen. Escalas favoritas y recientes. Control de tamaño de texto.

## 2.4

Conversor de opioides: separador decimal con coma o punto y cálculo de la dosis
diaria desde la dosis por toma.

## 2.3

Conversor de dosis equianalgésicas y rotación de opioides.

## 2.2

PaP Score, índice de Walter e índice de Lee.

## 2.1

PAINAD. Copiar resumen del resultado. Señalización de ítems sin responder.

## 2.0

Contenido derivado del manual de 2024: de 9 a 38 escalas, agrupadas por dominio
dentro de cada eje, con buscador.

## 1.0

Nueve escalas basadas en el manual de 2020.

---

## Pendiente para versiones futuras

- Timed Up and Go (TUG), del conjunto mínimo señalado en el editorial de
  Abizanda y Sánchez Jurado (Rev Esp Geriatr Gerontol. 2026;61:101831).
