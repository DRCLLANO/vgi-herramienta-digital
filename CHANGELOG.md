# Historial de versiones

Transcrito del historial que la propia aplicación muestra en su sección
"Acerca de".

## 2.13.3

Conversor de opioides: tres correcciones de seguridad, a partir de una revisión
externa de la 2.13.2. No cambia ninguna escala ni ningún factor de conversión.

- Cambio de origen. Al cambiar el opioide o la vía de origen se vacía la dosis.
  Antes la cifra se conservaba y pasaba a leerse en la unidad del nuevo origen:
  500 mcg al día de fentanilo IV quedaban como 500 mg al día de morfina oral y
  el resultado se recalculaba con ellos.
- Presentación del parche. La sugerida es la mayor que no supera la liberación
  calculada. Antes era la más cercana aunque quedara por encima: morfina oral
  30 mg al día con la reducción estándar daba 12,3 mcg/h de buprenorfina y
  proponía el parche de 35 (unos 60 mg de morfina oral, el doble del origen); y
  por debajo del parche mínimo se proponía el mínimo (morfina oral 10 mg con
  reducción del 50 % daba 1,39 mcg/h de fentanilo y proponía 12 mcg/h, 8,6
  veces más). Ahora, si el cálculo no alcanza la menor presentación, se indica
  "Sin presentación compatible" y se retiran la posología y el rescate. Con el
  mismo parche de origen y destino la dosis se conserva sin redondear.
- Tolerancia a opioides. Con fentanilo transdérmico de destino se comprueba el
  requisito de su ficha técnica (al menos 60 mg de morfina oral al día, o su
  equivalente, durante una semana o más). Por debajo de ese umbral se advierte
  que está contraindicado por riesgo de depresión respiratoria grave o mortal;
  por encima se recuerda confirmar la semana de tratamiento.

Verificación:

- `verificar-fuentes.mjs` añade una sección de seguridad del conversor: los 20
  orígenes por los dos parches de destino, 15 dosis y cuatro motivos (2.400
  combinaciones), los dos casos de la revisión externa y el cambio de origen en
  la pantalla real. Sobre la 2.13.2 señala 5.535 discrepancias; sobre la
  2.13.3, ninguna (`resultado-fuentes-2.13.3.json`). Las pruebas del conversor
  anteriores no miraban la presentación sugerida ni el estado de la pantalla.
- El script general y la prueba del CDR pasan sin fallos, con los mismos
  recuentos.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.13.3`.
- Quedan para decisión clínica, sin cambios en esta versión, los factores que
  se usan en ambas direcciones (fentanilo transdérmico de origen, 3,6;
  metadona de origen, 5) y el factor de la meperidina IV.

## 2.13.2

Corrección del puntaje global del CDR. Solo cambia el CDR.

- Con memoria 1 o más, la regla "el CDR no puede ser 0; es 0,5 cuando la
  mayoría de las áreas secundarias están en 0" se aplicaba antes de las reglas
  generales y anulaba el reparto tres y dos, en el que prevalece la memoria.
  Memoria 1 con las demás áreas en 0, 0, 0, 2 y 2 daba 0,5 en lugar de 1;
  memoria 2 con 0, 0, 0, 3 y 3 daba 0,5 en lugar de 2. Afectaba a 50 de las
  12.500 combinaciones, siempre rebajando el estadio. Ahora la regla actúa como
  piso: solo corrige un resultado que sería 0.
- El estadio 0,5 se rotula "Demencia cuestionable o muy leve" (antes "Deterioro
  cognitivo leve"), como en Morris 1993: abarca tanto el deterioro cognitivo
  leve como la demencia muy leve. El texto del resultado lo explica y recuerda
  que la repercusión en las actividades cotidianas orienta la distinción.

Verificación:

- `verificar-cdr.mjs` transcribía la regla en el mismo orden que la aplicación,
  de modo que compartía el error y no podía señalarlo. La referencia aplica
  ahora la regla como piso y hay tres casos fijos nuevos (dos de reparto con
  tres áreas en 0 y uno de piso de 0,5). Sobre la 2.13.1 la prueba corregida
  señala 50 discrepancias y falla dos casos fijos; sobre la 2.13.2, ninguna
  (`resultado-cdr-2.13.2.json`).
- El script general (`resultado-2.13.2.json`) y la prueba contra las fuentes
  (`resultado-fuentes-2.13.2.json`) pasan sin fallos; recuentos sin cambios.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.13.2`.

## 2.13.1

Correcciones contra las fuentes originales, a partir de dos revisiones externas
de la 2.13.0. Cambian resultados en varios instrumentos.

Cambios que modifican puntajes o clasificaciones:

- VES-13 (Saliba 2001). Necesitar ayuda en una o más de las cinco actividades
  funcionales suma 4 puntos en total, no 1 por actividad; las seis actividades
  físicas suman 1 punto cada una con un máximo de 2; el máximo es 10 y no 15.
  Una persona menor de 75 años, con buena salud y que solo necesita ayuda para
  bañarse sumaba 1 (no vulnerable); ahora suma 4 (vulnerable). Los ítems siguen
  la redacción original ("mucha dificultad o no puede"; "caminar de un lado a
  otro de la habitación" en lugar de "transportarse").
- PPI (Morita 1999). Delirium 4 y no 4,5; máximo 15. Un delirium aislado cruzaba
  el umbral de supervivencia menor de 6 semanas. No se puntúa el delirium
  causado solo por un medicamento. Se corrigen la sensibilidad y especificidad
  citadas (80/85 % para mayor de 6; 80/77 % para mayor de 4).
- Charlson original. Enfermedad cerebrovascular 1 punto (valía 2, el peso de la
  versión colombiana); máximo 37.
- Charlson Colombia. Tumor sin metástasis (3) y con metástasis (4) son opciones
  excluyentes de un mismo ítem; antes podían sumarse por el mismo proceso.
  Máximo 26. El texto del tramo alto dice "5 puntos o más".
- Lawton y Brody. El cuidado de la casa separa las cinco opciones originales
  (antes se agrupaban estados distintos en una misma respuesta). Adaptación
  declarada por decisión clínica: "necesita ayuda en todas las labores" vale 0,
  como "no participar", para que no dé como resultado "independiente"; en el
  instrumento original y en el anexo de MinSalud vale 1. Las tareas ligeras,
  aun sin una limpieza adecuada, valen 1. La adaptación consta en la nota de la
  escala.
- SPPB (Guralnik 1994). El equilibrio es un solo ítem jerárquico de 0 a 4 (solo
  se avanza si se mantiene la posición anterior 10 segundos); antes podían
  puntuarse semitándem y tándem tras fallar pies juntos. Los intervalos de
  marcha y silla son contiguos (marcha: 3,1 s o menos = 4; 5,7 s o más = 1;
  silla: 11,1 s o menos = 4; 16,7 a 60 s = 1); antes tiempos como 3,1, 11,1 o
  16,7 s no tenían categoría y 5,7 s caía en 2.
- CDR. El cuidado personal no tiene la categoría 0,5.
- Conversor de opioides. El mismo opioide por la misma vía conserva la dosis y
  no aplica reducción (la metadona de 60 mg daba 37,5 mg). La razón 4:1 de la
  metadona se rotula "morfina oral menor de 90 mg".
- EQ-5D-5L. Niveles codificados de 1 a 5 (perfil 11111 a 55555, antes 00000 a
  44444) y sin clasificación leve, moderada o severa por suma de niveles, que
  EuroQol desaconseja: se informan el perfil, las dimensiones con problemas y
  el nivel más alto. La EVA solo admite enteros de 0 a 100.
- Selección múltiple. Las preguntas de selección múltiple ya no cuentan como
  respondidas al abrir la escala: se marca al menos una opción o "Ninguna".
  Antes, por ejemplo, vulnerabilidad social sin responder daba "baja
  vulnerabilidad". Afecta a todas las escalas con este tipo de pregunta.

Cambios de texto o presentación:

- PPS. Cada nivel cita los puntos que le asigna el PPI (30 % suma 2,5, no 4); el
  criterio del NECPAL solo por debajo del 50 %; en perfiles discordantes el
  resultado muestra el intervalo de mejor ajuste (por ejemplo, "30 % (mejor
  ajuste entre 30 y 50 %)").
- CFS. El resultado conserva el nombre de cada categoría de la versión 2.0 (el 4
  aparecía como "Prefragilidad" y el 9 como "Fragilidad").
- Unidades métricas: Fried (4,57 metros, antes "15 pasos (4,6 metros)"), SPPB
  (2,44 metros) y VES-13 (4,5 kg y 400 metros), sin unidades imperiales. Fried:
  límites "o más" en ambos sexos. FRAIL: pérdida de
  peso mayor del 5 %. El cálculo auxiliar de pérdida de peso informa el
  porcentaje sin clasificarlo (describía 4,5 % como "4 % o menos").
- Barthel: el criterio de dependencia severa del NECPAL es menor de 20 (decía
  25). G8: los tramos muestran el 14,5 y el texto dice "más de 14 puntos".
  PAINAD: no se presenta como equivalente individual de una EVA. Trastornos de
  memoria: "19 o más" en todos los textos. Vulnerabilidad social: sin factores
  de ningún tipo ya no afirma redes adecuadas.
- Números: solo se aceptan cifras completas ("60abc" ya no se lee como 60) y el
  IMC exige peso y talla positivos.
- Motor: puntuación con tope y "cualquiera suma" para la selección múltiple;
  opciones propias por ítem en las escalas de respuesta común; el paso entre
  puntajes se deduce de las opciones.

Verificación:

- Nueva prueba `verificacion/verificar-fuentes.mjs`, contra las fuentes y en
  todas las combinaciones de VES-13, PPI, coherencia PPS y PPI y conversor, más
  45 comprobaciones de casos de referencia de la revisión externa: 10.057 discrepancias en la
  2.13.0 y ninguna en la 2.13.1.
- `verificar-cdr.mjs` usa ahora las opciones de cada área (12.500
  combinaciones) y sigue sin discrepancias.
- `trazabilidad-instrumentos.csv`: máximos, tramos y recuentos de VES-13, PPI,
  G8, Charlson, Charlson Colombia, SPPB, Lawton y CDR.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.13.1`. El script general (`resultado-2.13.1.json`) pasa sin fallos.
- Quedan pendientes de cotejar con el manual de referencia: NPI (versión,
  dominios y corte de 9), Downton modificada, autopercepción de salud, regla de
  vulnerabilidad social, corte de trastornos de memoria, cortes del MOS,
  variante del Zarit, FTS y ajuste por edad del Charlson colombiano.

## 2.13.0

Rediseño de la PPS y pictogramas en la Clinical Frailty Scale. Ninguna otra
escala, el conversor ni los puntos de corte cambian.

- PPS por columnas. Antes había que escoger una de once filas que mezclaban las
  cinco dimensiones. Ahora cada dimensión es un ítem: deambulación, actividad y
  evidencia de enfermedad, autocuidado, ingesta y nivel de conciencia. Cada
  opción muestra el tramo de niveles en que aparece ese descriptor.
- El nivel se calcula con la instrucción de la PPSv2 (Victoria Hospice): se baja
  por la deambulación hasta el nivel elegido y, desde ahí, se sigue bajando
  columna por columna hacia la derecha. Las columnas de la izquierda prevalecen
  y ninguna columna de la derecha hace subir el resultado; si una encaja solo en
  niveles más altos, el resultado lo advierte y remite al juicio clínico, como
  en el ejemplo de la paraplejia de la guía. El valor es siempre múltiplo de 10.
- El resultado muestra el recorrido por columnas. Las interpretaciones y su
  equivalencia en el Índice Pronóstico Paliativo no cambian.
- Se retira el 0 % (muerte) como opción; la nota de la escala lo explica.
- Comprobado: las diez filas de la tabla, respondidas con sus propios
  descriptores, devuelven su nivel; los tres ejemplos de la guía dan 50 %, 30 %
  y 30 % con aviso; las 3.200 combinaciones producen un nivel válido.
- Clinical Frailty Scale: cada nivel lleva un pictograma de dibujo propio, en
  trazo de línea y en los verdes de la marca (verde bosque y lima al
  seleccionar). No reproduce las ilustraciones de la escala. La figura sentada
  corresponde al nivel 8 y la acostada al 9. La ayuda del ítem aclara que la
  puntuación depende de la descripción y no del pictograma.
- Motor: una opción puede mostrar un rótulo de tramo en lugar de su valor y
  puede llevar pictograma. Solo lo usan la PPS y la CFS.
- `trazabilidad-instrumentos.csv`: la PPS pasa a 5 ítems y 26 opciones.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.13.0`. El script general se repitió sobre esta versión
  (`verificacion/resultado-2.13.0.json`): sin fallos; los ítems pasan de 371 a
  375 y las opciones de 1.264 a 1.279. La prueba del CDR sigue sin
  discrepancias.

## 2.12.3

Corrección del puntaje global del CDR. Ninguna otra escala, el conversor ni la
presentación cambian.

- La lógica aplicaba solo las reglas generales y con un umbral equivocado
  ("más de tres" áreas por encima o por debajo de la memoria, en lugar de "tres
  o más"). Omitía además los casos especiales de las reglas de Washington
  University (Knight ADRC, "CDR Scoring Rules"): con memoria 0, el CDR es 0,5
  si dos o más áreas secundarias tienen 0,5 o más; con memoria 0,5, nunca es 0
  y es 1 si tres o más áreas tienen 1 o más; con memoria 1 o más, nunca es 0 y
  es 0,5 cuando la mayoría de las áreas secundarias están en 0.
- Consecuencia clínica principal: memoria 0,5 con las demás áreas en 0 daba
  CDR 0 ("Normal") en vez de 0,5, y memoria 0,5 con tres áreas en 1 daba 0,5 en
  vez de 1. En total, 7.149 de las 15.625 combinaciones posibles diferían de las
  reglas.
- El resultado indica ahora qué regla definió el estadio.
- Nueva prueba `verificacion/verificar-cdr.mjs`, que compara la lógica con una
  transcripción aparte de las reglas en las 15.625 combinaciones y en nueve
  casos fijos (`verificacion/resultado-cdr-2.12.3.json`: sin discrepancias). Las
  tres pruebas anteriores no podían detectar este error, porque toda combinación
  producía un veredicto.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.12.3`. El script general se repitió sobre esta versión
  (`verificacion/resultado-2.12.3.json`): recuentos idénticos y sin fallos.

## 2.12.2

Ajustes de las transiciones de la 2.12.1, a partir de una revisión externa.
Solo presentación: las 47 escalas, el conversor, sus reglas de cálculo, puntos
de corte e interpretaciones no cambian.

- El puntaje del resultado se muestra fijo desde el primer momento. Se retira
  el conteo desde 0: durante esa animación podía verse, por ejemplo, un 4AT con
  0 junto a la interpretación de posible delirium, que correspondía a 12. La
  tarjeta del resultado sigue entrando con la transición de la pantalla.
- La franja, el marcador, la banda actual y el veredicto se animan solo al
  llegar al resultado. Abrir la evidencia o añadir la escala a la VGI
  reconstruye la vista y ya no repite esas animaciones; la ficha de evidencia
  se anima solo al abrirse, y el aviso de ítems sin responder solo al pulsar
  Interpretar.
- La regla de movimiento reducido cubre también los pseudoelementos
  (`::before`, `::after`) y el contenido de los desplegables, que usan el
  indicador de la barra inferior, el punto de las opciones y Acerca de.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.12.2`. El script de verificación se repitió sobre esta versión
  (`verificacion/resultado-2.12.2.json`): recuentos idénticos y sin fallos.

## 2.12.1

Transiciones e interacción. Solo presentación: las 47 escalas, el conversor,
sus reglas de cálculo, puntos de corte e interpretaciones no cambian.

- Hoja nueva `ui-motion.css`, cargada después de `ui-v3.css`. Todas sus
  animaciones quedan anuladas con la preferencia de movimiento reducido del
  sistema y ninguna deja contenido oculto si no llega a ejecutarse.
- Cada cambio de pantalla entra con un desplazamiento breve y escalonado: hacia
  adelante al abrir una escala o su resultado, hacia atrás al volver, y hacia
  arriba al cambiar de eje. Las tarjetas del catálogo entran escalonadas,
  también al filtrar por dominio.
- La opción elegida y los criterios de selección múltiple responden al toque;
  los ítems sin responder hacen un aviso breve al señalarse.
- La barra de puntaje entra deslizándose, lleva una barra fina de progreso de
  los ítems respondidos, en el verde lima de la identidad visual, el valor da un pequeño salto al cambiar y el botón
  Interpretar late una vez al completarse el último ítem.
- En el resultado, la franja de bandas se dibuja de izquierda a derecha, el
  marcador se desplaza hasta el puntaje y el puntaje cuenta desde 0 (solo en
  puntajes enteros; termina siempre en el valor exacto).
- La cabecera gana sombra al desplazarse el contenido, el indicador del eje
  activo crece al seleccionarse, el contador del resumen VGI late al añadir una
  escala y el foco de teclado es visible con el color del eje.
- Corrección de comportamiento: al cambiar de pantalla se sube al inicio de
  inmediato y no con un desplazamiento suave largo; al abrir o cerrar la
  evidencia en el resultado (o actualizar el resumen VGI) se conserva la
  posición, en lugar de volver al inicio de la página.
- En Acerca de, las secciones Uso sin conexión, Valoración geriátrica integral,
  Privacidad, Finalidad y condiciones de uso y Derechos y permisos pasan a ser
  desplegables, como ya lo eran Organización por ejes, Conversor de opioides,
  Escalas complementarias e Historial de versiones. Su texto no cambia. Los
  desplegables se abren con altura en los navegadores que lo admiten, y el pie
  de Acerca de sigue mostrando a la vista la finalidad educativa, la
  autorización de los editores y la licencia.
- Corrección: la barra lateral de escritorio mostraba "Versión 2.11.5".
- `sw.js` precarga `ui-motion.css` y la caché pasa a `v2.12.1`. El script de
  verificación se repitió sobre esta versión
  (`verificacion/resultado-2.12.1.json`): recuentos idénticos y sin fallos.

## 2.12.0

Cambio de licencia del código. Las 47 escalas, el conversor, sus reglas de
cálculo, puntos de corte e interpretaciones no cambian.

- El código fuente pasa de la licencia MIT a la PolyForm Noncommercial License
  1.0.0: puede usarse, estudiarse, copiarse, modificarse y redistribuirse solo
  con fines no comerciales, y cualquier uso comercial requiere autorización
  escrita del autor. El cambio responde a la finalidad declarada de la
  herramienta (uso exclusivamente educativo y de investigación, sin finalidad
  comercial). No es retroactivo: las versiones 1.0 a 2.11.5 conservan la
  licencia MIT.
- `LICENSE` reproduce sin modificaciones el texto oficial de PolyForm, precedido
  de la línea "Required Notice" con el titular y el DOI, de los bloques de
  alcance en español e inglés (las cinco exclusiones se conservan) y de un
  resumen orientativo en español, no vinculante.
- `NOTICE.md`, `README.md` (insignia, sección de licencia y tabla de archivos)
  y `CITATION.cff` (`license: PolyForm-Noncommercial-1.0.0`, identificador
  SPDX) se actualizan en consecuencia.
- En `index.html`: `link rel="license"`, `DC.rights` y el JSON-LD apuntan a la
  nueva licencia, y el JSON-LD declara el titular de los derechos
  (`copyrightHolder`, `copyrightYear`). En Acerca de, la sección Derechos y
  permisos explica la nueva licencia y el pie la menciona.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.12.0`. El script de verificación se repitió sobre esta versión
  (`verificacion/resultado-2.12.0.json`).

## 2.11.5

Identidad visual renovada. Las 47 escalas, el conversor, sus reglas de
cálculo, puntos de corte e interpretaciones no cambian.

- El símbolo VGI Digital pasa a su versión en degradado (verde bosque, verde,
  lima y aguamarina). Se sustituyen, con los mismos nombres de archivo,
  `vgi-digital-simbolo-verde.png` (800x800 px), `vgi-digital-logo-verde.png`
  (logotipo horizontal con el símbolo nuevo y el texto VGI DIGITAL en verde y
  aguamarina) y los siete iconos de la aplicación instalable. Los iconos de
  Apple llevan fondo blanco para que iOS no los muestre sobre negro, y el icono
  enmascarable lleva fondo verde muy claro con el símbolo dentro de la zona
  segura.
- En `ui-v3.css` se añade una capa de identidad 2.11.5: barra lateral de
  escritorio y barra de resultado en verde bosque (#013E31), arco aguamarina
  del logotipo en la barra lateral y en el bloque de marca de Acerca de, filete
  de marca bajo la cabecera y tonos neutros (fondo, líneas, texto) con matiz
  verde. Los colores de los cinco ejes se conservan.
- `theme-color`, `msapplication-TileColor` y el `theme_color` del manifest
  pasan a #013E31; el `background_color` del manifest a #F2F7F5.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.11.5`. El script de verificación se repitió sobre esta versión
  (`verificacion/resultado-2.11.5.json`).

## 2.11.4

Sección de agradecimientos. Las 47 escalas, el conversor, sus reglas de
cálculo, puntos de corte e interpretaciones no cambian.

- Se añade en Acerca de la sección "Agradecimientos", después de "Comentarios y
  sugerencias": a los padres y a la esposa del autor, y a la Unidad de
  Geriatría del Hospital Universitario San Ignacio, en particular a los
  doctores Diego Andrés Chavarro Carvajal, Carlos Alberto Cano Gutiérrez y
  Rodrigo Alberto Heredia Ramírez.
- Se retira del final de este historial el apartado "Pendiente para versiones
  futuras".
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.11.4`. El script de verificación se repitió sobre esta versión
  (`verificacion/resultado-2.11.4.json`).

## 2.11.3

Corrección de dos avisos de la interfaz. Las 47 escalas, el conversor, sus
reglas de cálculo, puntos de corte e interpretaciones no cambian.

- Los ítems de selección múltiple y los numéricos se inicializan en 0 al abrir
  una escala. Por eso siete instrumentos mostraban desde el inicio un puntaje
  parcial o criterios completos en lugar de "Sin iniciar": Downton, VES-13,
  FRAIL, MOS (0 / 95), EQ-5D, vulnerabilidad social y maltrato. Ahora la barra
  muestra "Sin iniciar" hasta que se marca una opción o se escribe un valor; en
  las escalas de puntaje, un dato numérico que no suma (la red cercana del MOS)
  no cuenta como inicio. La barra también se actualiza al escribir en un campo
  numérico. El cálculo no cambia.
- En la ficha de evidencia del MOS, la regla decía que el resultado se obtiene
  por algoritmo y no por suma de puntos. Ahora indica que procede de la suma de
  los ítems, en un índice global y por componentes, y remite a los puntos de
  corte de la interpretación.
- Ambos detalles los señaló una revisión externa de la 2.11.2; al comprobar las
  47 escalas, el primero resultó afectar a siete instrumentos y no a cuatro.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.11.3`. El script de verificación se repitió sobre esta versión
  (`verificacion/resultado-2.11.3.json`).

## 2.11.2

Corrección del rango general en la ficha de evidencia. Las 47 escalas, el
conversor, sus reglas de cálculo, puntos de corte e interpretaciones no
cambian.

- En "Ver evidencia y referencia", la línea "Rango" partía siempre de 0, aunque
  los tramos de la misma ficha ya partían del mínimo posible desde la 2.11.1.
  Ahora usa ese mismo mínimo: Norton, 5 a 20; Short FES-I, 7 a 28; Zarit, 22 a
  110. El detalle lo señaló una revisión externa de la 2.11.1.
- Al revisar todas las escalas sumativas apareció un cuarto caso: el MOS, sin
  tramos, mostraba "0 a 95" y ahora muestra "19 a 95". El cálculo del mínimo
  ya no se detiene ante el ítem de la red cercana, que se registra aparte y no
  suma al total; los ítems de selección múltiple aportan 0. En las otras 31
  escalas sumativas el mínimo es 0 y no cambian.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.11.2`. El script de verificación se repitió sobre esta versión
  (`verificacion/resultado-2.11.2.json`).

## 2.11.1

Corrección de los rangos mostrados y ajustes de interfaz. Las 47 escalas, el
conversor, sus reglas de cálculo, puntos de corte e interpretaciones no
cambian.

- En las escalas cuyo puntaje mínimo no es cero, la franja del resultado y la
  ficha de evidencia rotulaban el primer tramo desde 0. Ahora parten del mínimo
  posible, calculado como la suma del valor más bajo de cada ítem: Norton, 5 a
  14; Short FES-I, 7 a 10; Zarit, 22 a 46. La marca del resultado se sitúa en
  proporción a ese rango. Se actualizan esos tres tramos en
  `trazabilidad-instrumentos.csv`. El error lo señaló una revisión externa.
- Al abrir una escala, la ficha comienza siempre en el encabezado; antes
  conservaba el desplazamiento de la lista y en móvil podía mostrarse a partir
  del segundo ítem.
- En móvil, la tarjeta de cada eje es más compacta y conserva su descripción;
  las etiquetas de la barra inferior pasan de 9,5 a 10,5 px (10 px en
  pantallas muy angostas).
- En pantallas de 1240 px o más, las fichas fluyen en tres columnas continuas;
  cada ficha conserva su dominio.
- En "Cómo citar" (aplicación y README) el nombre queda como "VGI Digital". Se
  unifican las fechas de publicación de los metadatos en el 10 de septiembre
  de 2026, fecha del DOI.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.11.1`. El script de verificación se repitió sobre esta versión
  (`verificacion/resultado-2.11.1.json`).

## 2.11.0

Valoración prequirúrgica y futilidad en TAVI. Las 43 escalas anteriores, sus
reglas de cálculo, puntos de corte e interpretaciones no cambian.

- Se añaden al eje clínico dos secciones con cuatro instrumentos
  complementarios, que no proceden del manual de referencia y conservan su
  referencia primaria:
  - Valoración prequirúrgica: lista de verificación prequirúrgica del adulto
    mayor (Chow et al., ACS NSQIP y AGS, J Am Coll Surg 2012), de resultado
    algorítmico, que señala los dominios por intervenir y remite a las escalas
    de la herramienta; e índice de riesgo cardíaco revisado (RCRI; Lee et al.,
    Circulation 1999), con las cifras originales y las de la recalibración de
    la Sociedad Cardiovascular Canadiense (Duceppe et al., 2017).
  - Futilidad en TAVI: Futile TAVI Simple score (FTS; Lantelme et al., Am J
    Cardiol 2020) y Essential Frailty Toolset (EFT; Afilalo et al., FRAILTY-AVR,
    J Am Coll Cardiol 2017).
- En el FTS la edad puntúa por cuartiles (1 punto por encima de 80 años, 2 por
  encima de 84 y 3 por encima de 87), según la nota de la tabla 3 y la figura 4
  del artículo; la tabla 3 le asigna un solo punto. El máximo queda en 19. El
  sexo masculino, citado en el resumen del artículo, no puntúa por no haber
  sido significativo.
- Se elige el EFT como complemento del FTS tras revisar la literatura: ningún
  puntaje dedicado de futilidad supera con claridad al FTS, y el EFT fue la
  escala de fragilidad con mejor desempeño en el estudio prospectivo
  FRAILTY-AVR.
- "Acerca de" incorpora las cuatro referencias, la explicación de su ubicación
  y la entrada del historial. Se actualizan los recuentos (47 escalas), los
  metadatos de versión y la caché del service worker a `v2.11.0`. El script
  de verificación se repitió sobre esta versión
  (`verificacion/resultado-2.11.0.json`).

## 2.10.11

Estadísticas anónimas de uso, sin cambios en las escalas, sus reglas de
cálculo, puntos de corte ni interpretaciones clínicas.

- Se incorpora GoatCounter (vgidigitalco.goatcounter.com), un servicio de
  analítica de código abierto que no usa cookies ni guarda datos personales,
  para conocer cuántas visitas recibe la herramienta, desde qué países y
  dispositivos, y qué fichas se abren.
- De cada ficha solo se registra su identificador (por ejemplo
  `ficha/barthel`). Nunca se envían respuestas, puntajes ni resultados. Si el
  servicio no está disponible, la aplicación funciona igual y no registra nada.
- El uso sin conexión no se contabiliza.
- La sección Privacidad de "Acerca de" se reescribe para declararlo, y se
  actualizan en el mismo sentido `README.md` y `registro-desarrollo.md`.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.10.11`. El script de verificación se repitió sobre esta versión
  (`verificacion/resultado-2.10.11.json`).

## 2.10.10

Corrección de la franja del resultado, sin cambios en las escalas, sus reglas
de cálculo, puntos de corte ni interpretaciones clínicas.

- Los rótulos de las bandas se repartían en columnas del mismo ancho que cada
  banda. Cuando una banda era estrecha (Barthel 100, Charlson 2, NPI 0, 4AT 0,
  Lawton 8, Walter 2 a 3, PPI 4,5 a 6, entre otras) el texto no cabía y se
  montaba sobre el de la banda vecina. En la prueba a 360 px, los 14 casos
  revisados tenían rótulos superpuestos o desbordados, y 3 de ellos también a
  1440 px; tras el cambio, ninguno en ningún ancho.
- La leyenda se lista ahora debajo de la franja, una banda por línea (color,
  rango y rótulo), y resalta la banda del resultado obtenido. Los lectores de
  pantalla la anuncian como "resultado actual".
- El marcador del puntaje se desplaza dentro de la franja en los extremos del
  rango (por ejemplo Barthel 100) y su punta sigue señalando la posición exacta.
- Las bandas contiguas quedan separadas por un espacio, de modo que dos bandas
  del mismo color (por ejemplo dependencia total y grave en el Barthel) se
  distinguen.
- En la ficha "Evidencia y referencia" la franja se muestra sin leyenda, porque
  los puntos de corte ya se listan debajo.
- `VERSION.txt` declaraba 2.10.8 desde la versión anterior; se corrige.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.10.10`.
- Ajuste posterior, sin cambio de versión (28 de septiembre de 2026): en el
  conversor de opioides, cuando el destino es un parche transdérmico (fentanilo
  o buprenorfina), la dosis de rescate dejaba de tener sentido clínico porque
  se expresaba en mcg/h (por ejemplo, "2,5 mcg/h" para un parche de 25 mcg/h).
  Ahora se indica que el rescate se da con un opioide de liberación inmediata,
  por lo general morfina o hidromorfona, por vía oral, subcutánea o intravenosa
  según el contexto, y se calcula el 10 % del equivalente diario de morfina oral
  de la liberación calculada en cada una de esas cuatro opciones, con los
  factores que ya usa el conversor. Se añade que los rescates cobran especial
  importancia en las primeras 12 a 24 horas. Ningún factor de conversión ni
  ninguna escala cambia. El script de verificación se repitió sobre el archivo
  ajustado (`verificacion/resultado-2.10.10.json`).
- Ajuste posterior, sin cambio de versión (28 de septiembre de 2026): se añade
  en "Acerca de" la sección Comentarios y sugerencias, con el contacto del
  autor en X (@CLlanoC).

## 2.10.9

Ajustes de coherencia y de interfaz, sin cambios en las escalas, sus reglas de
cálculo, puntos de corte ni interpretaciones clínicas.

- La descripción del Charlson aclara que sus diecinueve condiciones se agrupan
  en dieciséis preguntas, más la edad, y así explica sus 17 ítems.
- En "Organización por ejes" se corrige la frase que situaba los instrumentos de
  cuidados paliativos en el eje clínico: permanecen allí los de oncogeriatría
  (G8 y VES-13) y los paliativos se reúnen en su propia pestaña.
- La barra de puntaje muestra "Sin iniciar" mientras no haya respuestas y rotula
  como parcial el puntaje de una escala incompleta.
- La pestaña VGI pasa a llamarse "Resumen VGI" ("Resumen" en móvil).
- En Acerca de, las secciones "Organización por ejes", "Conversor de opioides",
  "Escalas complementarias" e "Historial de versiones" se vuelven desplegables.
  Finalidad, derechos, desarrollo y cita siguen siempre visibles.
- En escritorio se reduce la altura del encabezado de cada eje, se retira el
  rótulo "VGI DIGITAL" de la cabecera (redundante con la barra lateral), el
  símbolo de la barra lateral se muestra sobre fondo blanco para ganar contraste
  y las etiquetas pequeñas ganan tamaño y contraste. Las tarjetas de la
  biblioteca alinean su contenido arriba.
- Los iconos de la navegación declaran su tamaño en el propio `index.html`
  (atributos y una base mínima de estilos), de modo que conservan la proporción
  aunque `ui-v3.css` no cargue, por ejemplo al abrir el archivo suelto o con una
  copia antigua en caché. Sin esa base, los iconos se dibujaban a más de 100 px.
- El service worker pide primero a la red los archivos propios (página,
  estilos e iconos) y deja la caché como respaldo sin conexión. Antes servía
  los estilos desde caché, de modo que una visita podía recibir la página nueva
  con la apariencia anterior si no se cambiaba el nombre de la caché.
- Se actualizan los metadatos de versión y la caché del service worker a
  `v2.10.9`. El script de verificación se ejecutó sobre esta versión con los
  mismos recuentos y sin fallos (`verificacion/resultado-2.10.9.json`).
- La versión 2.10.6, analizada en el manuscrito, se conserva sin cambios en la
  etiqueta `v2.10.6` del repositorio y en el depósito de OSF.

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
