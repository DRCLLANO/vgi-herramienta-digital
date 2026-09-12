# Registro del proceso de desarrollo

**Desarrollo asistido por inteligencia artificial de una aplicación web de escalas geriátricas**

Documento de respaldo del depósito. Corresponde a la versión 2.10.2 de la
herramienta.

Autor del desarrollo: Cristian Camilo Llano Ceballos, médico geriatra.
ORCID 0000-0001-9745-3863.

---

## 1. Síntesis del proceso

La aplicación es un desarrollo original de Cristian Camilo Llano Ceballos,
médico geriatra, construido mediante trabajo conversacional con Claude
(Anthropic), un modelo de lenguaje de propósito general que actuó como
asistente de programación, extracción documental y redacción. El clínico
definió el alcance, aportó las fuentes, tomó todas las decisiones de contenido
y validó cada resultado; el modelo implementó, verificó parámetros contra
fuentes primarias y construyó las pruebas automatizadas.

El proceso no siguió una especificación cerrada. Fue **iterativo**, en dos
ciclos separados por tres semanas y en dos interfaces distintas del mismo
asistente; **reactivo**, en tanto cada incorporación surgió de una necesidad
clínica identificada durante el uso y no de un plan trazado de antemano; y con
**captación explícita de errores**, tanto de contenido, mediante verificación
bibliográfica dirigida y confrontación entre fuentes discordantes, como de
funcionamiento, mediante tres niveles de prueba automatizada y el uso real de
la herramienta por parte del clínico. Los errores detectados, su origen y su
corrección se documentan en las secciones 8 y 9, porque el modo en que
aparecieron forma parte de lo que hace verificable el resultado.

*Las solicitudes que se recogen en la tabla de la sección 5 se presentan
reformuladas en lenguaje técnico; conservan la intención y el orden reales del
trabajo.*

## 2. Antecedentes: herramientas existentes en Iberoamérica

Existen varias herramientas digitales orientadas a la difusión y el cálculo de
escalas geriátricas en el ámbito iberoamericano.

**GeriatriApp** es un software para la difusión y el cálculo de escalas de
valoración geriátrica integral, desarrollado por el Programa de Geriatría de la
Facultad de Medicina de la Universidad Nacional de Colombia. Está disponible en
Google Play desde marzo de 2018, fue construido con MIT App Inventor, ocupa
cerca de 3 MB y cubre siete dominios: cognitivo, emocional, funcional,
fragilidad, comorbilidad, farmacológico y nutricional. En sus primeros doce
meses registró 3.280 descargas. Sus autores publicaron después un estudio
descriptivo transversal sobre percepción de utilidad entre 228 usuarios.

> Bautista HA, Perafán D, Torres C, López JH. Presentación de GeriatriApp: una
> app para la evaluación geriátrica integral en español. Aten Primaria.
> 2020;52(6):436-8. doi:10.1016/j.aprim.2019.07.011
>
> Bautista-Mier HA, Rodríguez-Gutiérrez AF, Torres-Espinosa C,
> López-Ramírez JH. Uso y percepción del personal de salud sobre una aplicación
> móvil para la valoración geriátrica integral. MedUNAB. 2021;24(2):169-75.
> doi:10.29375/01237047.4041

**El autor del presente desarrollo no tiene relación alguna con GeriatriApp ni
con sus desarrolladores.** Se cita como antecedente nacional obligado.

**Geriatric Helper** es una aplicación Android desarrollada en la Universidad
de Aveiro, concebida como guía de bolsillo para la valoración geriátrica
integral, con diseño centrado en el usuario y evaluación de usabilidad.

> Silva S, Felgueiras R, Oliveira IC. Geriatric Helper: an mHealth application
> to support comprehensive geriatric assessment. Sensors (Basel).
> 2018;18(4):1285. doi:10.3390/s18041285

Se han descrito además otras herramientas de alcance más limitado: **Escalas
Geriátricas**, en portugués; **Indicadores de Dependencia**, de Grupo
Trevenque, que reúne diez instrumentos funcionales, psicoafectivos y
sociofamiliares orientados al trabajo social; y **Valoración de la Fragilidad**,
centrada en un solo dominio. En el plano internacional, la Organización Mundial
de la Salud dispone de la aplicación asociada al manual ICOPE.

### 2.1 Qué distingue a este desarrollo

Las herramientas anteriores fueron concebidas como instrumentos de difusión de
escalas y de apoyo al cálculo en la práctica asistencial. Ninguna fue diseñada
como intervención educativa ni ha sido evaluada mediante desenlaces de
aprendizaje: la única evaluación publicada en el contexto colombiano midió
percepción de utilidad entre usuarios en ejercicio.

**La intersección entre el desarrollo de software mediante inteligencia
artificial, la enseñanza de la geriatría y la optimización de los resultados de
aprendizaje constituye la contribución original de este trabajo.** La
herramienta no se construyó como un repositorio de calculadoras sino como el
soporte de una actividad de aprendizaje, y tres decisiones de diseño responden
a ese propósito: la atribución de cada escala a sus autores originales, con la
referencia primaria y las validaciones locales visibles en la propia
herramienta, que permite al aprendiz auditar el umbral que se le aplica; la
representación gráfica de la posición del puntaje entre los puntos de corte,
que hace visible la distancia al umbral siguiente; y la distinción explícita
entre los instrumentos que provienen del manual de referencia y los
complementarios.

Se añaden dos diferencias de orden técnico. La primera es de plataforma: al ser
una aplicación web, funciona en cualquier dispositivo con navegador, con
independencia de la marca y del sistema operativo, mientras que las
herramientas citadas se distribuyen para Android. La segunda es de método de
construcción: no hemos identificado en la literatura el reporte de una
aplicación completa de valoración geriátrica integral desarrollada mediante
trabajo conversacional con un modelo de lenguaje, con documentación del proceso
y de sus procedimientos de verificación. Esta afirmación requiere confirmación
mediante una búsqueda de alcance formal antes de la publicación, y así se
declara.

## 3. Roles y responsabilidad

**El clínico**, autor único del desarrollo, definió el alcance, aportó las
fuentes, tomó todas las decisiones de contenido, resolvió las discordancias
entre referencias, identificó los vacíos del manual y validó cada resultado.

**El modelo de lenguaje** realizó la extracción estructurada de las fuentes, la
implementación en código, la redacción preliminar de los textos de
interpretación, la construcción de las pruebas automatizadas y la verificación
de parámetros contra fuentes primarias mediante búsqueda bibliográfica.

La división operativa fue: el modelo no incorporó ningún instrumento ni umbral
sin fuente identificable, y el clínico no aceptó ninguna implementación sin
revisar su procedencia.

Los coautores del manuscrito que describe este trabajo no participaron en la
construcción de la herramienta. La autoría del software corresponde
exclusivamente a Cristian Camilo Llano Ceballos.

## 4. Cronología

### Iteración 1 · 14 de agosto de 2026 · aplicación móvil

Realizada íntegramente desde la aplicación móvil del asistente. Fuente:

> Chavarro-Carvajal DA, Heredia Ramírez RA, Cano-Gutiérrez CA, editores.
> *Escalas de uso frecuente en Geriatría*. 2.ª edición. Bogotá: Pontificia
> Universidad Javeriana, Facultad de Medicina, Instituto de Envejecimiento,
> Unidad de Geriatría, Centro de Memoria y Cognición Intellectus; Hospital
> Universitario San Ignacio; 2020. ISBN 978-958-781-310-4.

Producto: aplicación web de archivo único con nueve escalas distribuidas en los
cuatro ejes, cada una con puntaje, interpretación, conducta sugerida, desglose
por ítem y referencia primaria. Ya en esta iteración se marcaron como
complementarios los instrumentos que no provenían del manual.

### Iteración 2 · 5 a 8 de septiembre de 2026 · interfaz web

Fuente:

> Chavarro-Carvajal DA, Heredia Ramírez RA, Cano-Gutiérrez CA, editores.
> *Abordaje geriátrico integral: escalas de uso frecuente en geriatría*.
> 1.ª edición. Bogotá: Editorial Pontificia Universidad Javeriana, Facultad de
> Medicina; 2024. ISBN 978-958-781-931-1.
> doi:10.11144/Javeriana.9789587819304.

Producto: expansión a 43 escalas y una calculadora de conversión de opioides,
más las funciones de trazabilidad de evidencia y de valoración integral.

El historial completo de versiones, con el cambio introducido en cada una, está
en [`CHANGELOG.md`](CHANGELOG.md) y se reproduce dentro de la propia
herramienta, en su sección "Acerca de".

## 5. Secuencia de la segunda iteración

| Fase | Solicitud, en formulación técnica | Producto |
|---|---|---|
| 1 | Ampliar la cobertura al manual de 2024, conservando los instrumentos ya implementados y organizándolos según los cuatro ejes descritos en la fuente | 38 instrumentos, agrupados por dominio dentro de cada eje, con buscador |
| 2 | Incorporar un instrumento de evaluación del dolor aplicable a la persona con demencia que no puede autorreportarlo | PAINAD, con su validación en español |
| 3 | Incorporar herramientas de estimación pronóstica en cuidados paliativos y de mortalidad | PaP Score, índice de Walter e índice de Lee |
| 4 | Incorporar una calculadora de dosis equianalgésicas a partir de dos fuentes de referencia locales | Conversor de 20 opioides y vías, con declaración de la fuente de cada factor |
| 5 | Corregir el ingreso de dosis decimales | Aceptación de coma y punto; precisión adaptada a la magnitud |
| 6 | Someter la herramienta a revisión externa y priorizar las recomendaciones recibidas | Priorización argumentada, con recomendaciones aceptadas y rechazadas |
| 7 | Implementar trazabilidad de la evidencia y un modo de valoración integral | Ficha de evidencia con puntos de corte derivados del código; modo de valoración con resumen |
| 8 | Separar los instrumentos de identificación de necesidades paliativas de los de estimación pronóstica | Reorganización taxonómica y sección propia de paliativos y pronóstico |
| 9 | Explicitar los criterios que operativizan la definición de enfermedad crónica avanzada | Reconstrucción del NECPAL sobre la versión 3.1 del instrumento |
| 10 | Incorporar un instrumento de cribado de delirium aplicable al paciente somnoliento o que no colabora, en quien el CAM no puede completarse | 4AT, junto al CAM en el eje mental |

## 6. Arquitectura

Aplicación web progresiva sin servidor de aplicación ni base de datos. El
núcleo funcional está contenido en `index.html`; la presentación adaptable se
mantiene en `ui-v3.css`, y el paquete instalable se completa con
`manifest.json`, el trabajador de servicio (`sw.js`) y los iconos.
Todo el cálculo ocurre en el dispositivo y no se transmiten respuestas ni
resultados clínicos a ningún servidor.

La versión 2.10.2 tiene un núcleo HTML de aproximadamente 242 KB y una hoja de
estilos local de aproximadamente 14 KB; no depende de bibliotecas de código
externas. Google Fonts puede generar una solicitud de red
para las tipografías, pero la aplicación declara alternativas del sistema y
mantiene su funcionamiento si esa solicitud falla. Tras una primera carga
correcta desde la URL, el trabajador de servicio almacena los recursos de la
aplicación en caché y permite el uso posterior sin conexión; los navegadores
compatibles también pueden ofrecer su instalación como aplicación web
progresiva. La disponibilidad exacta de la instalación y de la caché depende
del navegador y de que el registro inicial del trabajador de servicio se haya
completado correctamente.

Las únicas preferencias que persisten en el dispositivo son escalas favoritas,
escalas recientes y tamaño de texto; las respuestas de cada escala y la
valoración en curso se pierden al cerrar la aplicación. El acceso al
almacenamiento local está protegido frente a fallos (modo privado, visor
incrustado, permisos restringidos): la aplicación funciona igual si no está
disponible.

Cada instrumento se representa como una estructura de datos con eje, dominio,
denominación, ítems con sus opciones y valores, puntaje máximo, función de
interpretación y referencia bibliográfica. Esta uniformidad permitió construir
verificaciones automáticas aplicables a todos los instrumentos por igual.

Una decisión de diseño merece mención por sus consecuencias sobre la validez
del contenido: **los puntos de corte que la aplicación muestra al usuario no
están escritos aparte, sino que se derivan recorriendo el rango completo de
puntajes y detectando los cambios de veredicto**. Lo que la ficha de evidencia
documenta es exactamente lo que el programa calcula, y no puede desincronizarse
con el tiempo.

### 6.1 Contenido de la versión 2.10.2

La actualización 2.10.1 modificó exclusivamente la presentación adaptable y la
accesibilidad de la interfaz. La 2.10.2 amplía los descargos de la aplicación:
añade una sección propia de derechos y permisos que hace constar la
autorización de los editores del manual, la existencia de instrumentos con
titular de derechos propio y la finalidad educativa del uso. Ninguna de las dos
modifica el bloque clínico de la versión 2.10: instrumentos, ítems, opciones,
reglas de cálculo, puntos de corte, interpretaciones y referencias se conservan
sin cambios.

| Elemento | Cantidad |
|---|---|
| Escalas | 43 |
| Conversor de dosis equianalgésicas de opioides | 1 |
| Ítems | 337 |
| Opciones de respuesta | 1 193 |
| Puntos de corte | 60 |
| Escalas sumativas | 31 |
| Escalas algorítmicas | 12 |
| Instrumentos marcados como complementarios | 8 |

Distribución por eje: clínico 10, funcional 11, mental 11, social 5,
paliativos y pronóstico 7 (el conversor de opioides se contabiliza en este
último).

## 7. Atribución bibliográfica de los instrumentos

**Todas las escalas incorporadas se referencian según sus autores originales.**
El manual de la Pontificia Universidad Javeriana fue la fuente de organización
y de los umbrales adoptados, no el origen de los instrumentos: cada escala
pertenece a quienes la desarrollaron, y así se declara en la aplicación.

Cada ficha contiene la referencia primaria completa; cuando existe, la de la
adaptación o traducción al español; y cuando existe, la de la validación en
población colombiana o latinoamericana. Doce de los instrumentos incorporados
citan una validación local. Algunos ejemplos:

| Instrumento | Referencia primaria | Adaptación o validación citada |
|---|---|---|
| MNA-SF | Rubenstein LZ, et al. J Gerontol. 2001 | Kaiser MJ, et al. 2009; Deossa-Restrepo GC, et al. Rev Univ Salud. 2016 (Colombia) |
| Charlson | Charlson M, et al. J Clin Epidemiol. 1994 | Oliveros H, Buitrago G. BMJ Open. 2022 (Colombia) |
| SARC-F | Malmstrom TK, Morley JE. JAMDA. 2013 | Parra-Rodríguez L, et al. JAMDA. 2016 (Latinoamérica) |
| SPPB | Guralnik JM, et al. J Gerontol. 1994 | Ramírez-Vélez R, et al. Front Med. 2020 (valores normativos colombianos) |
| MOS | Sherbourne CD, Stewart AL. Soc Sci Med. 1991 | Londoño Arredondo NH, et al. Int J Psychol Res. 2012 (Colombia) |
| Zarit | Zarit SH, et al. Gerontologist. 1980 | Martín M, et al. 1996; Barreto-Osorio RV, et al. Aquichan. 2015 (Colombia) |
| PAINAD | Warden V, et al. JAMDA. 2003 | García-Soler Á, et al. Rev Esp Geriatr Gerontol. 2014 (versión española) |
| 4AT | Bellelli G, et al. Age Ageing. 2014 | Delgado-Parada E, et al. Eur J Psychiatry. 2022 (versión española validada) |

La aplicación muestra esa referencia en la ficha de evidencia de cada
instrumento, junto con el tipo de instrumento, el rango de puntuación, los
puntos de corte aplicados y la procedencia, y permite copiar la cita en formato
citable. Ocho de las cuarenta y cuatro fichas están marcadas como
complementarias por no provenir del manual de referencia: PAINAD, 4AT, NECPAL,
PaP Score, índice de Walter, índice de Lee, escala de Zarit y el conversor de
opioides.

Esta trazabilidad no es solo una exigencia de integridad académica: es un
componente del diseño educativo, porque permite al aprendiz auditar de dónde
procede el umbral que la herramienta está aplicando y advertir cuándo un
instrumento carece de calibración en población local.

**Consideración pendiente sobre condiciones de uso.** Algunos instrumentos
tienen restricciones propias de reproducción. Las condiciones conocidas y las
que quedan por verificar antes de una distribución amplia se detallan en el
archivo [`NOTICE.md`](NOTICE.md) de este depósito.

## 8. Captación de errores

Los hallazgos se registraron siguiendo la técnica de incidentes críticos de
Flanagan. El registro fue **retrospectivo**: los incidentes se reconstruyeron a
partir del historial de trabajo, no se documentaron en el momento en que
ocurrieron. Denominador de referencia: 337 ítems, 1 193 opciones de respuesta y
60 puntos de corte.

### 8.1 Errores de contenido

Cada parámetro numérico se contrastó con la fuente primaria antes de
implementarse. Cuando la fuente aportada no contenía el dato con suficiente
precisión, se realizó búsqueda bibliográfica dirigida y se verificó contra la
publicación original. Tres casos ilustran el procedimiento.

**Incidente 1. Pérdida de información en la extracción documental.** La
extracción automática de texto de la escala de depresión geriátrica de Yesavage
sugería que dos ítems puntuaban en sentido contrario al esperado. Se resolvió
inspeccionando visualmente la página del manual, donde la respuesta que puntúa
está en negrita: la extracción de texto había perdido esa marca tipográfica. El
resultado coincidió con el estándar internacional.

**Incidente 2. Discordancia entre fuentes.** El conversor de opioides se
construyó sobre dos referencias que no coinciden en varios factores. Para la
hidrocodona, una fuente la considera prácticamente equipotente con la morfina
oral y la otra la agrupa con la codeína en una razón de diez a uno; aplicar la
segunda al rotar hacia ese fármaco produciría una dosis diez veces mayor a la
debida. La herramienta no oculta la discrepancia: adopta un valor, lo justifica
y muestra el alternativo en la ficha de cada conversión.

**Incidente 3. Versión desactualizada del instrumento.** El NECPAL estaba
implementado sobre la descripción publicada en 2013. Al revisar el instrumento
oficial en su versión 3.1 se comprobó que los umbrales operativos habían
cambiado y eran más precisos. Se reconstruyó el instrumento completo
(versión 2.8 de la aplicación).

### 8.2 Errores de funcionamiento

Tres niveles de prueba automatizada, ejecutados tras cada cambio.

**Pruebas estructurales.** Verifican que todo instrumento esté clasificado en
un eje, que el puntaje máximo declarado coincida con la suma de los máximos de
sus ítems, y que todo instrumento tenga función de interpretación o algoritmo.

**Pruebas de interpretación.** Recorren el rango completo de puntajes de cada
escala y verifican que toda puntuación posible produzca un veredicto definido,
sin zonas ciegas entre bandas.

**Pruebas de interacción.** Ejecutan la aplicación en un navegador simulado y
reproducen la secuencia completa de uso: abrir cada instrumento, responderlo,
obtener el resultado e incorporarlo a la valoración.

### 8.3 El límite de la verificación automatizada

**Incidente 4.** Los dos primeros niveles de prueba verificaban funciones
aisladas y no la interacción real. Cuando se añadió el modo de valoración
integral, la función que dibuja el encabezado no contemplaba la vista nueva e
intentaba leer datos de un instrumento inexistente, lo que detenía el dibujado
completo de esa pantalla. Las pruebas existentes no lo detectaron porque nunca
simulaban un clic.

**El error lo detectó el clínico usando la aplicación**, y solo entonces se
construyó el tercer nivel de pruebas, que lo reprodujo y permitió corregirlo
(versión 2.5.1 de la aplicación).

La consecuencia metodológica es que la verificación automatizada de una
herramienta desarrollada con asistencia de inteligencia artificial no sustituye
el uso real por parte del experto, y que el ciclo de desarrollo debe preverlo
de manera explícita.

### 8.4 Corrección bibliográfica registrada

Durante la revisión del manuscrito se detectó que el primer autor de la
referencia del interRAI Acute Care es Devriendt E, no Wellens NIH
(BMC Geriatr. 2013;13:90). Corregido.

### 8.5 Divergencia entre la copia depositada y la publicada

**Incidente 5.** Al comparar el archivo depositado con el publicado se
encontró que ambos se denominaban "versión 2.9" y que ninguno contenía todo el
trabajo: la copia depositada conservaba el 4AT y la versión anterior del
conversor de opioides, mientras que la copia publicada incorporaba el conversor
reescrito y el funcionamiento sin conexión, pero había perdido el 4AT por
completo (su estructura de datos, su agrupamiento en el eje mental, su cita
bibliográfica y su mención en el texto de instrumentos complementarios). La
aplicación en uso ofrecía 42 escalas y no 43, y faltaba justamente el
instrumento incorporado por criterio experto para el paciente en quien el CAM
no puede completarse.

Ninguno de los tres niveles de prueba automatizada podía detectarlo: cada copia
era internamente coherente y pasaba la totalidad de las verificaciones. El
hallazgo solo fue posible al comparar archivo contra archivo entre el
repositorio y el depósito.

La corrección consistió en fusionar ambas ramas sin descartar trabajo de
ninguna (versión 2.10) y en verificar después, mediante suma de comprobación,
que el archivo publicado y el depositado fueran idénticos.

La consecuencia metodológica es que la verificación de contenido y de
funcionamiento no cubre la integridad de la distribución. Cuando un desarrollo
asistido por inteligencia artificial avanza en sesiones sucesivas y sobre más de
una copia del archivo, hace falta un control explícito de identidad entre lo
que se publica y lo que se deposita, ejecutado en cada versión.

## 9. Decisiones de contenido tomadas por el clínico

**Ubicación de fragilidad y sarcopenia en el eje funcional**, siguiendo la
organización del manual de 2024, aunque la versión de la primera iteración las
clasificaba en el eje clínico.

**Separación entre necesidades paliativas y pronóstico.** Identificar a quien
se beneficia de un abordaje paliativo y estimar cuánto tiempo de vida le queda
son preguntas distintas. El NECPAL lo advierte de manera explícita: identifica
necesidades, no pronostica. Mantenerlos juntos invitaba a la confusión, de modo
que se separaron en secciones distintas.

**Identificación de vacíos en la fuente.** El manual no incluye ningún
instrumento de evaluación del dolor para la persona que no puede
autorreportarlo, pese a que el capítulo de ortogeriatría insiste en evaluar la
intensidad del dolor antes de iniciar analgesia. Ese vacío motivó la
incorporación del PAINAD. De manera análoga, la imposibilidad de completar el
CAM en el paciente somnoliento o que no colabora motivó la incorporación del
4AT.

**Distinción de procedencia.** Los instrumentos que no provienen del manual
están marcados como complementarios en la interfaz, para que el usuario no
atribuya a todo el contenido la misma fuente.

## 10. Limitaciones del proceso

El modelo redactó los textos de interpretación de todos los instrumentos.
Aunque cada punto de corte fue verificado contra su fuente, la redacción de la
conducta clínica derivada requiere revisión sistemática por el responsable
clínico antes de un uso ampliado, y esa revisión está pendiente.

Los criterios por patología del bloque específico del NECPAL provienen del
anexo del instrumento oficial, que no fue posible obtener textualmente. Se
operativizaron con los criterios de enfermedad avanzada de la National Hospice
and Palliative Care Organization, que es la fuente de la que deriva ese anexo y
la de uso más difundido, y así se declara dentro de la aplicación.

Varios instrumentos pronósticos incorporados provienen de cohortes
estadounidenses cuya calibración en población colombiana no ha sido estudiada.
La herramienta lo advierte en cada caso, pero la advertencia no sustituye la
validación local.

El funcionamiento sin conexión depende de una primera carga satisfactoria y
del registro del trabajador de servicio. La instalación y la persistencia de
la caché pueden variar según el navegador, las políticas del dispositivo y la
eliminación posterior de datos del sitio; por ello no deben asumirse sin una
prueba específica en el entorno de uso.

El registro de incidentes es retrospectivo, no concurrente.

La afirmación de novedad respecto del método de desarrollo no proviene de una
búsqueda sistemática y debe confirmarse mediante una revisión de alcance formal
antes de la publicación.

La herramienta operativiza el contenido de un manual del que el autor es
coautor de un capítulo, no de la obra completa. Los editores del manual
autorizaron el uso de su contenido en esta herramienta; esa autorización cubre
la aplicación y no se extiende a quien la reutilice o la redistribuya. Los
derechos sobre el manual siguen perteneciendo a sus autores y a la Pontificia
Universidad Javeriana.

Varios de los instrumentos incluidos tienen titular de derechos propio,
distinto del manual. Se reproducen con finalidad educativa y de apoyo
asistencial, sin ánimo de lucro, citando en cada caso su fuente primaria. El
estado de cada titular consta en el archivo `NOTICE.md` del depósito, con los
instrumentos ya resueltos y los que quedan por verificar antes de cualquier
redistribución, traducción o incorporación a otro producto. Esa tabla es
orientativa y no constituye asesoría legal.

## 11. Autoría y transparencia

El desarrollo es original del autor. Conforme a las recomendaciones del ICMJE y
del COPE, la herramienta de inteligencia artificial no cumple los criterios de
autoría, dado que no puede asumir responsabilidad por el contenido ni aprobar
la versión final; su uso se declara en la sección de métodos del manuscrito y
se detalla en este documento.

La responsabilidad sobre cada instrumento, umbral, factor de conversión y texto
interpretativo contenidos en la aplicación es enteramente del autor humano.

## 12. Datos y privacidad

La herramienta no recoge, transmite ni almacena datos de pacientes. Todo el
cálculo ocurre en el dispositivo del usuario. No se utilizaron datos de
pacientes en el desarrollo ni en la verificación.
