/*
 * VGI Digital · vacunacion.js: Promoción y prevención, vacunación del adulto
 * mayor (desde la 2.18.0).
 *
 * Destino propio en la barra de navegación ("Vacunas", debajo de Resumen).
 *
 * Fuente principal: Consenso Colombiano de Vacunación en el Adulto 2026 de la
 * Asociación Colombiana de Medicina Interna (ACMI), Parte 1 (adulto general y
 * adulto mayor) y Parte 2 (adultos con condiciones crónicas). Acta Med Colomb.
 * 2026;51(2 Supl). Cada recomendación cita la parte y la afirmación Delphi o
 * la tabla de la que sale. Lo que no viene del consenso se marca como tal:
 *  - "criterio del autor": decisiones clínicas del autor de la herramienta
 *    (puntos de corte de fragilidad, dependencia y malnutrición, y el uso de
 *    la pauta de la OMS para la COVID-19 en inmunosupresión);
 *  - CDC: definición de los factores de riesgo de la diabetes para el VSR;
 *  - OMS: pauta de COVID-19 en inmunosupresión (SAGE, marzo de 2026);
 *  - PAI: esquema nacional de Colombia, actualización de julio de 2026.
 *
 * No define ni modifica ninguna escala. Lee SCALES, VGI y state tal como los
 * declara index.html y añade una vista propia ("vac"). Como el Resumen VGI y la
 * Trayectoria, todo vive solo en memoria: nada se guarda ni se transmite.
 *
 * Reglas de precedencia (decididas por el autor el 27-nov-2026):
 *  1) si hay una condición crónica, manda lo que dice la Parte 2 para esa
 *     condición, y la fila muestra el motivo (Parte 2, af. 4);
 *  2) si dos condiciones dicen cosas distintas, se muestra la más fuerte, con
 *     todos los motivos;
 *  3) "Contraindicada" siempre gana, por seguridad.
 */
(function(){
'use strict';

/* ---------------------------- Fuentes ---------------------------- */
const FUENTES = [
  {k:'acmi1', t:'Asociación Colombiana de Medicina Interna. Consenso Colombiano de Vacunación en el Adulto 2026. Parte 1: adulto general, adulto mayor, mujeres embarazadas y escenarios de riesgo de exposición. Acta Med Colomb. 2026;51(2 Supl). DOI 10.36104/amc.2026.5120.', url:'https://doi.org/10.36104/amc.2026.5120'},
  {k:'acmi2', t:'Asociación Colombiana de Medicina Interna. Consenso Colombiano de Vacunación en el Adulto 2026. Parte 2: adultos con condiciones crónicas. Acta Med Colomb. 2026;51(2 Supl). DOI 10.36104/amc.2026.5121.', url:'https://doi.org/10.36104/amc.2026.5121'},
  {k:'pai', t:'Ministerio de Salud y Protección Social. Esquema de vacunación PAI Colombia, actualización de julio de 2026.', url:'https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/VS/PP/ET/afiche-esquema-vacunacion-col-2026.pdf'},
  {k:'oms', t:'Organización Mundial de la Salud. Recomendaciones del SAGE sobre la vacunación contra la COVID-19, marzo de 2026.', url:'https://www.who.int/teams/immunization-vaccines-and-biologicals/diseases/covid-19-(corona-virus)'},
  {k:'cdc', t:'Centers for Disease Control and Prevention. Adult Immunization Schedule Notes, VSR: condiciones de riesgo.', url:'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html'}
];
const PAI_CORTE = 'Esquema PAI Colombia, actualización de julio de 2026';
const REVISION = 'Revisión anual de esta sección: abril, con la campaña de influenza cepa sur.';

/* ---------------------------- Condiciones ---------------------------- */
/* sub: condición que solo se muestra cuando la principal está marcada. */
const CONDICIONES = [
  {g:'Condiciones crónicas', items:[
    {k:'pulmonar', l:'Enfermedad pulmonar crónica (EPOC, enfisema, asma, enfermedad intersticial)'},
    {k:'cardio', l:'Cardiopatía crónica (insuficiencia cardíaca, miocardiopatía, enfermedad coronaria; no la HTA aislada)'},
    {k:'neuro', l:'Enfermedad neurológica crónica o demencia'},
    {k:'neuroResp', sub:'neuro', l:'Con debilidad de músculos respiratorios, disfagia o dificultad para eliminar secreciones'},
    {k:'diabetes', l:'Diabetes mellitus'},
    {k:'diabetesRiesgo', sub:'diabetes', l:'Con complicaciones o en tratamiento con insulina o iSGLT2 (criterio del CDC)'},
    {k:'erc', l:'Enfermedad renal crónica'},
    {k:'ercTerminal', sub:'erc', l:'Terminal o en terapia de reemplazo renal'},
    {k:'hepatica', l:'Enfermedad hepática crónica o trastorno por consumo de alcohol'},
    {k:'cancer', l:'Cáncer'},
    {k:'cancerInmuno', sub:'cancer', l:'En quimioterapia o con inmunocompromiso moderado o grave'},
    {k:'biologico', l:'Biológico, FARME sintético dirigido o glucocorticoides en dosis altas'},
    {k:'hemato', l:'Enfermedad hematológica crónica no oncológica (falciforme, talasemia, PTI)'}
  ]},
  {g:'Situación', items:[
    {k:'hogar', l:'Vive en hogar geriátrico o centro de larga estancia'},
    {k:'obesidad', l:'Obesidad mórbida (IMC de 40 o más)'},
    {k:'riesgoHB', l:'Factores de riesgo para hepatitis B o procedimientos invasivos frecuentes'}
  ]},
  {g:'Exposición', items:[
    {k:'zonaFA', l:'Vive en una zona de alta circulación de fiebre amarilla o viaja a ella'},
    {k:'zonaDengue', l:'Vive en una zona endémica de dengue'}
  ]},
  {g:'Esquemas especiales', items:[
    {k:'vih', l:'Vive con VIH'},
    {k:'asplenia', l:'Asplenia anatómica o funcional'},
    {k:'trasplante', l:'Candidato o receptor de trasplante'}
  ]}
];
const NOMBRE_COND = {};
CONDICIONES.forEach(g=>g.items.forEach(c=>{ NOMBRE_COND[c.k] = c.l; }));

const NEUMO_PREVIA = [
  {v:'ninguna', l:'Ninguna o desconocida'},
  {v:'pcv13', l:'Solo PCV13'},
  {v:'ppsv23', l:'Solo PPSV23'},
  {v:'pcv15', l:'Solo PCV15'},
  {v:'pcv13ppsv23_lt60', l:'PCV13 y PPSV23, la PPSV23 antes de los 60 años'},
  {v:'pcv13ppsv23_60', l:'PCV13 y PPSV23, la PPSV23 a los 60 años o más'},
  {v:'secuencial', l:'Esquema secuencial completo (PCV15 o PCV13 y luego PPSV23)'},
  {v:'pcv2021', l:'PCV20 o PCV21'}
];

/* ---------------------------- Categorías ---------------------------- */
const CAT = {
  contra:   {l:'Contraindicada',     r:5, tono:'alert'},
  rec:      {l:'Se recomienda',      r:4, tono:'ok'},
  ind:      {l:'Individualizar',     r:3, tono:'warn'},
  con:      {l:'Puede considerarse', r:2, tono:'warn'},
  completo: {l:'Esquema completo',   r:1, tono:'neutro'},
  noind:    {l:'No indicada',        r:0, tono:'neutro'}
};

const ESTADOS = [
  {v:'sindato', l:'Sin dato'},
  {v:'aplicada', l:'Aplicada', x:'Año o fecha'},
  {v:'incompleto', l:'Esquema incompleto', x:'Dosis aplicadas'},
  {v:'pendiente', l:'Indicada, pendiente'},
  {v:'noindicada', l:'No indicada'},
  {v:'contraindicada', l:'Contraindicada', x:'Motivo'},
  {v:'rechazada', l:'Rechazada'}
];

/* ---------------------------- Datos de la VGI ---------------------------- */
function numDe(txt){
  const m = String(txt||'').replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? +m[0] : null;
}
function leerVGI(){
  const out = {};
  try{
    if(typeof VGI!=='object' || !VGI) return out;
    if(VGI.fried) out.fried = numDe(VGI.fried.valor);
    if(VGI.cfs) out.cfs = numDe(VGI.cfs.valor);
    if(VGI.barthel) out.barthel = numDe(VGI.barthel.valor);
    if(VGI.mna) out.mnasf = numDe(VGI.mna.valor);
  }catch(e){}
  return out;
}
const vacio = v => v===null || v===undefined || v==='';
const n = v => vacio(v) ? null : numDe(v);

/* Derivados con los puntos de corte del autor (27-nov-2026). */
function derivados(E){
  const fried = n(E.fried), cfs = n(E.cfs), barthel = n(E.barthel), mnasf = n(E.mnasf);
  const c = E.c || {};
  return {
    fragil: (fried!==null && fried>=3) || (cfs!==null && cfs>=6),
    dependencia: barthel!==null && barthel<=60,
    barthelIndiv: barthel!==null && barthel>60 && barthel<100,
    barthel, fried, cfs, mnasf,
    malnutricion: mnasf!==null && mnasf<=7,
    /* Inmunosupresión para la pauta de COVID-19: malnutrición, VIH o cáncer. */
    inmunoCovid: (mnasf!==null && mnasf<=7) || !!c.vih || !!c.cancer,
    /* Inmunocompromiso para intervalos del neumococo y del zóster. */
    inmuno: !!(c.biologico || c.cancerInmuno || c.vih || c.trasplante),
    /* Vacunas vivas contraindicadas (Parte 2, af. 5 y 100). */
    vivasContra: !!(c.biologico || c.cancerInmuno || c.trasplante)
  };
}

/* ---------------------------- Motor ---------------------------- */
function fila(id, nombre){ return {id, nombre, fuentes:[], esquema:[], notas:[], pai:''}; }
function suma(f, cat, t, ref){ f.fuentes.push({cat, t, ref}); }
function cerrar(f){
  /* Precedencia: la categoría más fuerte gana; "Contraindicada" siempre gana. */
  let top = 'noind';
  f.fuentes.forEach(x=>{ if(CAT[x.cat].r > CAT[top].r) top = x.cat; });
  f.cat = top;
  f.etiqueta = CAT[top].l;
  f.tono = CAT[top].tono;
  f.motivos = f.fuentes.slice().sort((a,b)=>CAT[b.cat].r-CAT[a.cat].r);
  return f;
}

function evaluar(E){
  const edad = n(E.edad);
  if(edad===null) return {estado:'sinedad', filas:[]};
  if(edad<60) return {estado:'menor', filas:[]};
  const c = E.c || {};
  const D = derivados(E);
  const mayor75 = edad>=75;
  const cronica = ['pulmonar','cardio','neuro','diabetes','erc','hepatica','cancer','biologico','hemato','vih','asplenia','trasplante'].some(k=>c[k]);
  const filas = [];

  /* Influenza */
  let f = fila('influenza','Influenza');
  suma(f,'rec','Adulto de 60 años o más','Parte 1, af. 38');
  f.esquema.push('Una dosis anual.');
  f.esquema.push('Preferir vacuna inactivada de alta dosis (HD-IIV3), recombinante (RIV3) o inactivada adyuvada (aIIV3); si ninguna está disponible, cualquier otra apropiada para la edad.');
  if(cronica) f.notas.push('Con enfermedad crónica, use vacuna inactivada o recombinante, nunca la intranasal viva (Parte 2, tablas 2 a 12).');
  f.pai = 'Sí: una dosis anual para 60 años o más.';
  filas.push(cerrar(f));

  /* COVID-19 */
  f = fila('covid','COVID-19');
  suma(f,'rec','Adulto de 60 años o más, independientemente de las dosis previas','Parte 1, af. 37');
  f.esquema.push('Sin vacunación previa: una dosis de vacuna ARNm actualizada o el esquema primario de la plataforma autorizada.');
  f.esquema.push('Con vacunación previa: una dosis actualizada al menos 8 semanas después de la más reciente.');
  f.esquema.push('Pueden considerarse refuerzos adicionales según el riesgo individual, las comorbilidades y los lineamientos vigentes de salud pública.');
  if(D.inmunoCovid){
    const quien = [D.malnutricion?'malnutrición (MNA-SF de 7 o menos)':'', c.vih?'VIH':'', c.cancer?'cáncer':''].filter(Boolean).join(', ');
    f.destacada = 'Inmunosupresión ('+quien+'): al menos una dosis al año, preferiblemente dos separadas seis meses.';
    f.notas.push('Pauta de la OMS (SAGE, marzo de 2026), adoptada por criterio del autor para concretar los refuerzos adicionales según riesgo que indica el consenso.');
  }
  if(c.erc && D.inmuno) f.notas.push('ERC con inmunocompromiso o trasplante renal: completar el esquema primario y una dosis adicional; puede vacunarse desde 30 días después de una infección por COVID-19 (Parte 2, af. 71).');
  f.pai = 'Sí: población priorizada de 60 años o más.';
  filas.push(cerrar(f));

  /* Neumococo */
  f = fila('neumococo','Neumococo');
  const prev = E.neumo || 'ninguna';
  const corto = D.inmuno ? ' Con inmunocompromiso, el intervalo hasta la PPSV23 puede acortarse a 8 semanas.' : '';
  if(prev==='pcv13ppsv23_60'){
    suma(f,'con','PCV13 y PPSV23 previas, la PPSV23 a los 60 años o más','Parte 1, af. 42');
    f.esquema.push('Puede considerarse una dosis de PCV20 o PCV21 al menos 5 años después de la última dosis antineumocócica, por decisión compartida.');
  } else if(prev==='pcv2021'){
    suma(f,'completo','PCV20 o PCV21 previa','Parte 1, af. 42; Parte 2, tabla 13');
    f.esquema.push('Esquema completo: PCV20 y PCV21 no requieren PPSV23 adicional, sea cual sea el estado inmunológico.');
  } else if(prev==='secuencial'){
    suma(f,'completo','Esquema secuencial completo','Parte 1, af. 42; Parte 2, af. 72');
    f.esquema.push('Esquema completo: no se indican más dosis de PPSV23 en inmunocompetentes.');
    if(D.inmuno) f.esquema.push('Con inmunocompromiso, puede considerarse un refuerzo de PPSV23 a los 5 años del esquema secuencial (Parte 2, af. 72 y 79).');
  } else {
    suma(f,'rec','Adulto de 60 años o más','Parte 1, af. 42');
    if(prev==='pcv13'){
      f.esquema.push('PCV20 o PCV21 al menos 1 año después de la PCV13.');
      f.esquema.push('Si no hay PCV20 ni PCV21, puede considerarse una dosis de PPSV23.');
    } else if(prev==='ppsv23'){
      f.esquema.push('Una dosis de vacuna conjugada (PCV20, PCV21, PCV15 o PCV13) al menos 1 año después de la última PPSV23.');
    } else if(prev==='pcv15'){
      f.esquema.push('Una dosis de PPSV23 al menos 1 año después de la PCV15.'+corto);
    } else if(prev==='pcv13ppsv23_lt60'){
      f.esquema.push('PCV20 o PCV21 al menos 5 años después de la última dosis antineumocócica.');
    } else {
      f.esquema.push('Una dosis de PCV20 o PCV21 (preferidas): no se requiere PPSV23 adicional.');
      f.esquema.push('Si no hay PCV20 ni PCV21: PCV15 o PCV13 y, al menos 1 año después, PPSV23.'+corto);
    }
    f.notas.push('Una vez completado el esquema, no se indican dosis adicionales de PPSV23 en adultos inmunocompetentes.');
  }
  if(c.neuro && (c.neuroResp || D.dependencia))
    suma(f, f.fuentes[0].cat==='completo' ? 'completo' : f.fuentes[0].cat,
      'Prioritaria: enfermedad neurológica con '+(c.neuroResp?'disfagia o dificultad para eliminar secreciones':'dependencia funcional (Barthel de 60 o menos)'),'Parte 2, af. 44');
  f.pai = 'No figura en el esquema nacional para adultos.';
  filas.push(cerrar(f));

  /* Herpes zóster */
  f = fila('zoster','Herpes zóster');
  suma(f,'rec','Adulto de 50 años o más','Parte 1, af. 41');
  f.esquema.push('Vacuna recombinante adyuvada (RZV): 2 dosis, a los 0 y 2 a 6 meses (intervalo mínimo de 4 semanas).');
  f.esquema.push('Se aplica aunque haya tenido herpes zóster o la vacuna viva atenuada; después de un episodio, iniciar 2 a 3 meses más tarde.');
  if(c.biologico || c.cancerInmuno) f.notas.push('Con inmunosupresión, la segunda dosis puede darse entre 1 y 2 meses después si hace falta completar el esquema pronto (Parte 2, af. 97).');
  f.pai = 'No figura en el esquema nacional para el adulto mayor.';
  filas.push(cerrar(f));

  /* Td/Tdap */
  f = fila('td','Td/Tdap');
  suma(f,'rec','Adulto de 60 años o más','Parte 1, tablas 3 y 7');
  f.esquema.push('Sin vacunación previa o desconocida: Tdap, luego Td o Tdap a las 4 semanas y Td o Tdap a los 6 a 12 meses.');
  f.esquema.push('Serie completa: refuerzo con Td cada 10 años.');
  f.esquema.push('Serie completa sin Tdap previa: una dosis de Tdap y luego Td o Tdap cada 10 años.');
  if(c.pulmonar) f.notas.push('Con enfermedad pulmonar crónica, asegurar al menos una dosis de Tdap en la edad adulta (Parte 2, af. 9).');
  f.pai = 'No figura en el esquema nacional para el adulto mayor.';
  filas.push(cerrar(f));

  /* VSR */
  f = fila('vsr','Virus sincitial respiratorio (VSR)');
  if(mayor75){
    suma(f,'rec','Adulto de 75 años o más no vacunado','Parte 1, af. 39');
  } else {
    const p1 = [];
    if(c.hogar) p1.push(['Vive en hogar geriátrico','Parte 1, af. 40']);
    if(D.fragil) p1.push(['Fragilidad (Fried de 3 o más, o CFS de 6 o más)','Parte 1, af. 40; punto de corte por criterio del autor']);
    if(c.obesidad) p1.push(['Obesidad mórbida (IMC de 40 o más)','Parte 1, af. 40']);
    p1.forEach(([t,r])=>suma(f,'con',t,r));
    if(c.pulmonar) suma(f,'rec','Enfermedad pulmonar crónica','Parte 2, af. 6');
    if(c.cardio) suma(f,'rec','Cardiopatía crónica','Parte 2, af. 16');
    if(c.neuro){
      if(c.neuroResp) suma(f,'rec','Enfermedad neurológica con debilidad respiratoria, disfagia o dificultad para eliminar secreciones','Parte 2, af. 42');
      else if(D.dependencia) suma(f,'rec','Enfermedad neurológica con dependencia funcional (Barthel de 60 o menos)','Parte 2, af. 42; punto de corte por criterio del autor');
      else if(D.barthelIndiv) suma(f,'ind','Enfermedad neurológica con Barthel entre 65 y 95: individualizar','Parte 2, af. 42; criterio del autor');
      else suma(f,'ind','Enfermedad neurológica sin compromiso respiratorio ni dependencia registrados: individualizar'+(D.barthel===null?' (registre el Barthel)':''),'Parte 2, af. 42; criterio del autor');
    }
    if(c.cancerInmuno) suma(f,'rec','Cáncer con inmunocompromiso moderado o grave','Parte 2, af. 75');
    if(c.biologico) suma(f,'rec','Tratamiento biológico o inmunosupresor con riesgo aumentado','Parte 2, af. 96');
    if(c.diabetes && c.diabetesRiesgo) suma(f,'con','Diabetes con complicaciones o en tratamiento con insulina o iSGLT2 (criterio del CDC), por decisión compartida','Parte 2, af. 13');
    if(c.diabetes && !c.diabetesRiesgo) f.notas.push('Diabetes sin complicaciones, insulina ni iSGLT2: no se activa la indicación por diabetes.');
    if(c.erc && c.ercTerminal) suma(f,'con','Enfermedad renal terminal o en terapia de reemplazo renal','Parte 2, af. 62');
    if(c.hepatica) suma(f,'con','Enfermedad hepática crónica o consumo de alcohol','Parte 2, af. 21');
    if(c.hemato) suma(f,'con','Enfermedad hematológica crónica, en especial con hemólisis','Parte 2, af. 47');
    /* Sin ningún motivo marcado, queda la categoría de la Parte 1 (tabla 3). */
    if(!f.fuentes.length) suma(f,'con','Adulto de 60 a 74 años sin factor de riesgo marcado: el consenso la sugiere con hogar geriátrico, fragilidad, obesidad mórbida u otra condición que aumente el riesgo respiratorio','Parte 1, af. 40');
  }
  f.esquema.push('Dosis única; no se recomiendan dosis adicionales.');
  if(c.cardio) f.advertencia = 'El consenso sugiere no revacunar contra el VSR a pacientes con cardiopatía establecida; esta directriz puede cambiar según evolucione la evidencia.';
  f.pai = 'No figura para el adulto mayor (solo gestantes).';
  filas.push(cerrar(f));

  /* Hepatitis B */
  f = fila('hepb','Hepatitis B');
  if(c.riesgoHB) suma(f,'con','Factores de riesgo para hepatitis B: completar el esquema','Parte 1, af. 44');
  else suma(f,'con','Sin factores de riesgo conocidos: decisión compartida','Parte 1, af. 45');
  if(c.neuro && (c.hogar || c.riesgoHB)) suma(f,'con','Enfermedad neurológica, institucionalizado o con procedimientos invasivos frecuentes: se sugiere, según el consenso','Parte 2, tabla 6 y af. 45');
  if(c.erc) suma(f,'rec','Enfermedad renal crónica, en todas sus etapas','Parte 2, af. 69');
  if(c.hepatica) suma(f,'rec','Enfermedad hepática crónica sin inmunidad','Parte 2, af. 23');
  if(c.cancer) suma(f,'rec','Cáncer sin inmunidad: antes de la quimioterapia o entre ciclos','Parte 2, af. 77');
  if(c.biologico) suma(f,'rec','Tratamiento biológico, tras verificar antecedente o serología','Parte 2, af. 99');
  if(c.vih) suma(f,'rec','VIH sin inmunidad','Parte 2, tabla 10');
  f.esquema.push('Vacuna recombinante adyuvada: 2 dosis con intervalo mínimo de 4 semanas; o vacuna recombinante: 3 dosis a los 0, 1 y 6 meses.');
  if(c.erc) f.esquema.push('ERC: vacuna recombinante en dosis alta, 3 dosis (0, 1 y 6 meses) o 4 dosis (0, 1, 2 y 6 meses). Medir anti-HBs a los 3 a 6 meses y, si es menor de 10 mUI/mL, revacunar una vez (Parte 2, af. 69 y 70).');
  if(c.hepatica) f.esquema.push('Hepatopatía crónica: dosis alta en 3 o 4 dosis, adyuvada CpG en 2 dosis (0 y 1 mes) o trivalente en 3 dosis (Parte 2, af. 23).');
  f.pai = 'No figura en el esquema nacional para el adulto mayor.';
  filas.push(cerrar(f));

  /* Hepatitis A */
  f = fila('hepa','Hepatitis A');
  if(c.hogar) suma(f,'con','Hogar geriátrico u otro entorno con riesgo de transmisión fecal-oral','Parte 1, af. 43');
  else suma(f,'con','Solo en entornos con riesgo de transmisión fecal-oral','Parte 1, tabla 3');
  if(c.hepatica) suma(f,'rec','Enfermedad hepática crónica sin inmunidad','Parte 2, af. 22');
  if(c.erc && c.hepatica) suma(f,'rec','Enfermedad renal crónica con hepatopatía concomitante','Parte 2, af. 64');
  if(c.vih) suma(f,'rec','VIH sin inmunidad','Parte 2, tabla 10');
  f.esquema.push('2 dosis (0 y 6 a 12 meses), o vacuna combinada contra hepatitis A y B en 3 dosis (0, 1 y 6 meses).');
  f.pai = 'No figura en el esquema nacional para el adulto mayor.';
  filas.push(cerrar(f));

  /* Fiebre amarilla (vacuna viva) */
  f = fila('fa','Fiebre amarilla');
  if(c.zonaFA) suma(f,'con','No vacunado que vive en una zona de alta circulación o viaja a ella: hacer una valoración geriátrica integral antes de decidir','Parte 1, af. 46');
  else suma(f,'noind','Solo si vive en una zona de alta circulación o viaja a ella','Parte 1, af. 46');
  if(D.vivasContra) suma(f,'contra','Vacuna viva atenuada: no se aplica con biológicos, FARME dirigidos, glucocorticoides en dosis altas, quimioterapia, inmunocompromiso moderado o grave ni trasplante','Parte 2, af. 5 y 100');
  if(c.vih) f.notas.push('Con VIH, el uso de vacunas vivas depende del recuento de CD4: consulte la Parte 2 del consenso y al especialista.');
  f.esquema.push('Dosis única de por vida; no requiere refuerzos de rutina.');
  f.pai = 'Sí, en municipios de riesgo alto o muy alto (emergencia sanitaria).';
  filas.push(cerrar(f));

  /* Dengue (vacuna viva) */
  f = fila('dengue','Dengue');
  if(c.zonaDengue) suma(f,'con','Zona endémica: decisión compartida tras valorar riesgo y beneficio; la evidencia en 60 años o más es limitada','Parte 1, af. 47');
  else suma(f,'noind','Solo en zona endémica con indicación','Parte 1, tabla 3');
  if(D.vivasContra) suma(f,'contra','Vacuna viva atenuada: no se aplica con biológicos, quimioterapia, glucocorticoides en dosis altas ni trasplante','Parte 2, af. 68, 78 y 100');
  if(c.vih) suma(f,'contra','No se recomienda en personas que viven con VIH','Parte 2, af. 94');
  f.esquema.push('2 dosis con 3 meses de intervalo.');
  f.pai = 'No figura en el esquema nacional para el adulto mayor.';
  filas.push(cerrar(f));

  const generales = ['Vacunar preferiblemente en un periodo de estabilidad clínica; la falta de compensación no es contraindicación (Parte 2, af. 1).'];
  if(c.neuro) generales.push('En enfermedad neurológica, evitar la fase aguda y el periodo inmediato después de un evento como un ACV (Parte 2, af. 40).');
  const especial = ['vih','asplenia','trasplante'].filter(k=>c[k]);

  return {estado:'ok', grupo: mayor75 ? '75 años o más' : '60 a 74 años', edad, derivados:D, filas, generales, especial};
}

/* ---------------------------- Estado ---------------------------- */
function nuevo(){ return {edad:'', c:{}, fried:'', cfs:'', barthel:'', mnasf:'', origen:{}, neumo:'ninguna', est:{}}; }
let VAC = nuevo();

function traerVGI(){
  const v = leerVGI();
  ['fried','cfs','barthel','mnasf'].forEach(k=>{
    if(v[k]!==undefined && v[k]!==null && vacio(VAC[k])){ VAC[k] = String(v[k]); VAC.origen[k] = true; }
  });
}

/* ---------------------------- Texto para la historia ---------------------------- */
function estadoTexto(id){
  const e = VAC.est[id] || {s:'sindato', x:''};
  const def = ESTADOS.find(o=>o.v===e.s) || ESTADOS[0];
  const base = def.l.charAt(0).toLowerCase()+def.l.slice(1);
  return e.x && e.x.trim() ? base+' ('+e.x.trim()+')' : base;
}
/* Se copian siempre las vacunas que se recomiendan (aunque estén sin dato, para
   que el vacío quede a la vista) y las contraindicadas; las demás, solo si se
   marcó un estado. */
function texto(E, R){
  E = E || VAC; R = R || evaluar(E);
  if(R.estado!=='ok') return '';
  const condiciones = [];
  const minus = t=>t.charAt(0).toLowerCase()+t.slice(1);
  const corto = c=>minus(c.l.replace(/ \(.*\)$/,''));
  CONDICIONES.forEach(g=>g.items.forEach(c=>{
    if(!E.c[c.k] || c.sub) return;
    const sub = g.items.find(x=>x.sub===c.k && E.c[x.k]);
    condiciones.push(corto(c)+(sub ? ' '+minus(sub.l) : ''));
  }));
  const D = R.derivados;
  if(D.fragil) condiciones.push('fragilidad');
  if(D.dependencia) condiciones.push('dependencia funcional (Barthel '+D.barthel+')');
  if(D.malnutricion) condiciones.push('malnutrición (MNA-SF '+D.mnasf+')');
  const lineas = ['VACUNACIÓN (Consenso Colombiano de Vacunación en el Adulto, ACMI 2026; '+PAI_CORTE+'). Edad: '+R.edad+' años.'];
  if(condiciones.length) lineas.push('Condiciones consideradas: '+condiciones.join('; ')+'.');
  const marcada = id => VAC.est[id] && VAC.est[id].s && VAC.est[id].s!=='sindato';
  const prin = R.filas.filter(f=>f.cat==='rec' || f.cat==='contra');
  const otras = R.filas.filter(f=>!(f.cat==='rec' || f.cat==='contra') && marcada(f.id));
  prin.forEach(f=>{
    lineas.push('- '+f.nombre+': '+(f.cat==='contra' && !marcada(f.id) ? 'contraindicada ('+(t=>t.charAt(0).toLowerCase()+t.slice(1))(f.motivos[0].t.split(':')[0])+')' : estadoTexto(f.id))+'.'+(f.destacada?' '+f.destacada:''));
  });
  if(otras.length){
    lineas.push('Según riesgo o exposición:');
    otras.forEach(f=>lineas.push('- '+f.nombre+': '+estadoTexto(f.id)+'.'));
  }
  return lineas.join('\n');
}

/* ---------------------------- Vista ---------------------------- */
function chipsHTML(){
  return CONDICIONES.map(g=>{
    const items = g.items.filter(c=>!c.sub || VAC.c[c.sub]);
    return '<div class="vac-grupo"><div class="vac-gt">'+esc(g.g)+'</div><div class="chips">'
      + items.map(c=>'<button class="chip'+(c.sub?' vac-sub':'')+'" data-vac="cond" data-k="'+c.k+'" aria-pressed="'+!!VAC.c[c.k]+'">'+esc(c.l)+'</button>').join('')
      + '</div></div>';
  }).join('');
}

function campo(k, label, opciones, ph){
  const origen = VAC.origen[k] ? '<span class="vac-origen">Tomado del resumen de la VGI</span>' : '';
  if(opciones){
    return '<div class="field"><label>'+esc(label)+'</label><select data-vac="campo" data-k="'+k+'">'
      + '<option value="">Sin dato</option>'
      + opciones.map(o=>'<option value="'+o.v+'"'+(String(VAC[k])===String(o.v)?' selected':'')+'>'+esc(o.l)+'</option>').join('')
      + '</select>'+origen+'</div>';
  }
  return '<div class="field"><label>'+esc(label)+'</label><input type="text" inputmode="numeric" autocomplete="off" data-vac="campo" data-k="'+k+'" value="'+esc(VAC[k])+'" placeholder="'+(ph||'')+'">'+origen+'</div>';
}

function derivadosHTML(){
  const D = derivados(VAC);
  const linea = (t, si, det)=>'<span class="vac-der'+(si?' si':'')+'">'+esc(t)+': <b>'+(si?'sí':'no')+'</b>'+(det?' · '+esc(det):'')+'</span>';
  return linea('Fragilidad', D.fragil, 'Fried de 3 o más, o CFS de 6 o más')
    + linea('Dependencia funcional', D.dependencia, D.barthelIndiv ? 'Barthel entre 65 y 95: individualizar' : 'Barthel de 60 o menos')
    + linea('Malnutrición', D.malnutricion, 'MNA-SF de 7 o menos');
}

function filaHTML(f){
  const e = VAC.est[f.id] || {s:'sindato', x:''};
  const def = ESTADOS.find(o=>o.v===e.s) || ESTADOS[0];
  return '<article class="vac-fila vac-'+f.cat+'" id="vac-'+f.id+'">'
    + '<div class="vac-cab"><h3>'+esc(f.nombre)+'</h3><span class="vac-cat vac-t-'+f.tono+'">'+esc(f.etiqueta)+'</span></div>'
    + (f.destacada ? '<p class="vac-dest">'+esc(f.destacada)+'</p>' : '')
    + (f.advertencia ? '<p class="vac-adv"><b>Advertencia.</b> '+esc(f.advertencia)+'</p>' : '')
    + '<ul class="vac-mot">'+f.motivos.map(m=>'<li><span class="vac-mc vac-t-'+CAT[m.cat].tono+'">'+esc(CAT[m.cat].l)+'</span> '+esc(m.t)+' <span class="vac-ref">('+esc(m.ref)+')</span></li>').join('')+'</ul>'
    + '<div class="vac-esq"><b>Esquema</b><ul>'+f.esquema.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>'
    + (f.notas.length ? '<div class="vac-esq vac-nota"><b>Notas</b><ul>'+f.notas.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>' : '')
    + '<div class="vac-pai"><b>PAI</b> '+esc(f.pai)+'</div>'
    + '<div class="vac-est"><div class="field"><label>Estado</label><select data-vac="est" data-id="'+f.id+'">'
    + ESTADOS.map(o=>'<option value="'+o.v+'"'+(o.v===e.s?' selected':'')+'>'+esc(o.l)+'</option>').join('')+'</select></div>'
    + (def.x ? '<div class="field"><label>'+esc(def.x)+'</label><input type="text" autocomplete="off" data-vac="estx" data-id="'+f.id+'" value="'+esc(e.x||'')+'" placeholder="Opcional"></div>' : '')
    + '</div></article>';
}

function resultadoHTML(){
  const R = evaluar(VAC);
  if(R.estado==='sinedad') return '<div class="vacio">Ingrese la edad para ver las vacunas que corresponden a su grupo.</div>';
  if(R.estado==='menor') return '<div class="vacio">Esta sección aplica a personas de 60 años o más, la definición colombiana de adulto mayor. Para menores de 60 años, consulte la Parte 1 del consenso.</div>';
  const rec = R.filas.filter(f=>f.cat==='rec' || f.cat==='completo');
  const otras = R.filas.filter(f=>!(f.cat==='rec' || f.cat==='completo'));
  return '<div class="vac-grupo-edad">Grupo de edad: <b>'+esc(R.grupo)+'</b></div>'
    + (R.especial.length ? '<div class="vac-esp"><b>Esquema especial.</b> '+esc(R.especial.map(k=>NOMBRE_COND[k]).join('; '))+': consulte la Parte 2 del consenso y al especialista tratante. Las filas siguientes no reemplazan ese esquema.</div>' : '')
    + '<div class="grp">Recomendadas para este paciente</div>'
    + rec.map(filaHTML).join('')
    + '<div class="grp">Según riesgo, exposición o contraindicación</div>'
    + otras.map(filaHTML).join('')
    + '<ul class="vac-generales">'+R.generales.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
}

function renderVac(){
  const enVGI = !!(typeof VGI==='object' && VGI && VGI.vacunas);
  $('#view').innerHTML =
    '<div class="scale-head">'
    + '<span class="eyebrow" style="font-family:\'IBM Plex Mono\',monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--eje)">Promoción y prevención</span>'
    + '<h2>Vacunación del adulto mayor</h2>'
    + '<p>Vacunas indicadas según la edad y las condiciones del paciente, con lista de chequeo para la historia clínica. Basada en el Consenso Colombiano de Vacunación en el Adulto 2026 (ACMI).</p></div>'
    + '<section class="item vac-form"><div class="q">Paciente</div>'
    + '<div class="calc">'+campo('edad','Edad (años)', null, 'Ej.: 78')+'</div>'
    + chipsHTML()
    + '</section>'
    + '<section class="item vac-form"><div class="q">Fragilidad, función y nutrición</div>'
    + '<p class="hint">Si el resumen de la VGI ya tiene el fenotipo de Fried, la CFS, el Barthel o el MNA-SF, se toman de allí. Si no, regístrelos aquí.</p>'
    + '<div class="calc vac-calc">'
    + campo('fried','Fenotipo de Fried (criterios)', [0,1,2,3,4,5].map(v=>({v, l:String(v)})))
    + campo('cfs','Clinical Frailty Scale', [1,2,3,4,5,6,7,8,9].map(v=>({v, l:String(v)})))
    + campo('barthel','Índice de Barthel (0 a 100)', null, '0 a 100')
    + campo('mnasf','MNA-SF (0 a 14)', null, '0 a 14')
    + '</div><div class="vac-ders" id="vacders">'+derivadosHTML()+'</div></section>'
    + '<section class="item vac-form"><div class="q">Neumococo: vacuna previa</div><div class="calc">'
    + '<div class="field"><label>Antecedente</label><select data-vac="neumo">'
    + NEUMO_PREVIA.map(o=>'<option value="'+o.v+'"'+(VAC.neumo===o.v?' selected':'')+'>'+esc(o.l)+'</option>').join('')
    + '</select></div></div></section>'
    + '<div id="vacres">'+resultadoHTML()+'</div>'
    + '<div class="vac-corte"><b>Columna PAI.</b> '+esc(PAI_CORTE)+'. '+esc(REVISION)+'</div>'
    + '<div class="actions" style="margin-top:18px">'
    + '<button class="btn" data-vac="vaciar">Vaciar</button>'
    + '<button class="btn'+(enVGI?'':' btn-primary')+'" data-vac="addvgi">'+(enVGI?'Actualizada en la VGI':'Añadir a la valoración')+'</button>'
    + '<button class="btn btn-primary" data-vac="copiar">Copiar</button></div>'
    + '<p class="toast" id="toast"></p>'
    + '<textarea class="copybox" id="copybox" style="display:none" readonly></textarea>'
    + '<details class="tr-umb vac-fuentes"><summary>Fuentes y criterios</summary>'
    + FUENTES.map(x=>'<div class="tr-umb-r"><a href="'+x.url+'" target="_blank" rel="noopener noreferrer">'+esc(x.t)+'</a></div>').join('')
    + '<div class="tr-umb-r"><strong>Criterios del autor</strong> · Fragilidad: fenotipo de Fried de 3 o más criterios, o CFS de 6 ("Vive con fragilidad moderada") o más. Dependencia funcional: Barthel de 60 o menos; de 65 a 95, individualizar. Malnutrición: MNA-SF de 7 o menos. COVID-19 en inmunosupresión (malnutrición, VIH o cáncer): pauta de la OMS. Factores de riesgo de la diabetes para el VSR: definición del CDC.</div>'
    + '<div class="tr-umb-r"><strong>Reglas de precedencia</strong> · Con una condición crónica manda lo que dice la Parte 2 para esa condición (af. 4); entre condiciones, la recomendación más fuerte; "Contraindicada" siempre gana.</div>'
    + '</details>'
    + '<div class="ref"><b>Privacidad</b>Estos datos viven únicamente en la memoria del dispositivo mientras la aplicación está abierta: se pierden al cerrarla o recargarla, y nunca se guardan ni se transmiten. No ingrese nombres, documentos ni ningún dato que identifique al paciente.</div>'
    + '<div class="ref"><b>Alcance</b>Apoyo educativo para revisar el esquema de vacunación; no reemplaza el juicio clínico, la ficha técnica de cada vacuna ni los lineamientos vigentes del Ministerio de Salud.</div>';
}

function refrescar(){
  const r = document.getElementById('vacres'); if(r) r.innerHTML = resultadoHTML();
  const d = document.getElementById('vacders'); if(d) d.innerHTML = derivadosHTML();
}

function abrir(){
  traerVGI();
  state = {view:'vac', eje:'clinico', id:null, ans:{}, sel:{}, multi:{}, extra:{}, q:'', dom:null, evid:false, showResult:false};
  try{ if(window.goatcounter && typeof window.goatcounter.count==='function') window.goatcounter.count({path:'ficha/vacunacion', title:'vacunacion', event:true}); }catch(e){}
  render();
  window.scrollTo({top:0, left:0, behavior:'instant'});
}

function agregarVGI(){
  const R = evaluar(VAC);
  if(R.estado!=='ok') return false;
  const rec = R.filas.filter(f=>f.cat==='rec');
  const pend = rec.filter(f=>{ const s=(VAC.est[f.id]||{}).s; return s!=='aplicada'; }).length;
  VGI.vacunas = {id:'vacunas', eje:'clinico', dom:'Promoción y prevención', nombre:'Vacunación',
    valor: (rec.length-pend)+' de '+rec.length+' recomendadas aplicadas',
    t: pend ? pend+' recomendada'+(pend===1?'':'s')+' sin aplicar o sin dato' : 'Recomendadas al día',
    tone: pend ? 'warn' : 'ok', ts: Date.now(), texto: texto()};
  return true;
}

/* ---------------------------- Integración ---------------------------- */
const renderBaseVac = renderBase;
renderBase = function(){
  if(state.view!=='vac') return renderBaseVac();
  setEjeColor('clinico');
  document.body.dataset.view = 'vac';
  document.body.dataset.eje = 'vac';
  renderTop(); renderTabs();
  renderVac();
  renderScorebar(); renderSpine();
  if(pantallaPrev!==pantallaClave()) window.scrollTo({top:0, left:0, behavior:'instant'});
  marcarEntrada();
};

const renderTopVac = renderTop;
renderTop = function(){
  if(state.view!=='vac') return renderTopVac();
  $('#topbar').innerHTML = '<div style="flex:1">'
    + '<span class="eyebrow" style="color:var(--ink-2)">Promoción y prevención</span>'
    + '<h1>Vacunas</h1></div>'
    + '<button class="glyph" data-act="about" aria-label="Acerca de esta aplicación">i</button>';
};

/* Destino propio en la barra de navegación (decisión del autor, 27-nov-2026).
   Ícono: jeringa dibujada con el mismo trazo de los demás íconos de la barra,
   a partir de la referencia que aportó el autor.
   Va debajo de Resumen en escritorio y como quinto botón en el celular, para
   que la función no quede escondida dentro de un eje. */
const ICO_TAB = '<svg class="tabicon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g transform="rotate(-45 12 12)"><path d="M1 12h3.8"/><path d="M4.8 12 7.6 8.3h10v7.4h-10Z"/><path d="M9.8 8.3v2.9M12.6 8.3v2.9M15.4 8.3v2.9"/><path d="M17.6 5.6v12.8"/><path d="M17.6 10.6h3.2M17.6 13.4h3.2"/><path d="M20.8 8.2v7.6"/></g></svg>';
const renderTabsVac = renderTabs;
renderTabs = function(){
  renderTabsVac();
  const res = document.querySelector('#tabs .vgi-tab');
  if(!res || document.querySelector('#tabs .vac-tab')) return;
  res.insertAdjacentHTML('afterend',
    '<button class="vac-tab v6-tab" data-vac="abrir" style="--tab:var(--clinico)"'+(state.view==='vac'?' aria-current="true"':'')+' aria-label="Vacunas: vacunación del adulto mayor">'
    + '<span class="mark"></span>'+ICO_TAB+'<span class="tabtext">Vacunas</span></button>');
};
const profundidadVac = profundidad;
profundidad = function(v, r){ return v==='vac' ? 0 : profundidadVac(v, r); };

/* La sección tiene su destino en la barra; en la biblioteca aparece solo en
   los resultados de búsqueda cuando la consulta la nombra. */
function tarjetaHTML(){
  return '<button class="card v5-card vac-card" data-vac="abrir" style="--eje:var(--clinico)">'
    + '<span class="v5-card-top"><span class="dom">Promoción y prevención</span></span>'
    + '<h2>Vacunación del adulto mayor</h2>'
    + '<p>Vacunas indicadas según la edad y las condiciones crónicas, con lista de chequeo para la VGI. Consenso Colombiano de Vacunación en el Adulto 2026.</p>'
    + '<span class="v5-card-pie"><span class="v5-meta">Lista de chequeo</span><span class="v5-meta v5-meta-ext">Herramienta complementaria</span></span></button>';
}
const listInnerVac = listInner;
listInner = function(){
  const html = listInnerVac();
  const q = norm(String(state.q||'').trim());
  if(q){
    if(!/vacun|inmuniz|prevenc|promoci|influenza|neumoco|zoster|vsr|sincitial|hepatitis|tetano|covid|fiebre amarilla|dengue/.test(q)) return html;
    const card = '<div class="grp v5-grp-res">Herramienta</div>'+tarjetaHTML();
    return /class="empty"/.test(html) ? card : html + card;
  }
  return html;
};

/* El resumen de la VGI incluye el bloque de vacunación completo. */
const vgiTextoVac = vgiTexto;
vgiTexto = function(){
  const v = VGI.vacunas;
  if(!v) return vgiTextoVac();
  delete VGI.vacunas;
  let out;
  try{ out = vgiTextoVac(); } finally { VGI.vacunas = v; }
  const bloque = '\nPROMOCIÓN Y PREVENCIÓN\n  '+v.texto.split('\n').join('\n  ')+'\n';
  const i = out.lastIndexOf('\nEscalas de tamización');
  return i>=0 ? out.slice(0,i)+bloque+out.slice(i) : out+bloque;
};

/* ---------------------------- Eventos ---------------------------- */
document.addEventListener('click', e=>{
  const b = e.target.closest && e.target.closest('[data-vac]');
  if(!b || b.tagName==='SELECT' || b.tagName==='INPUT') return;
  const a = b.dataset.vac;
  if(a==='abrir'){ abrir(); return; }
  if(a==='cond'){
    const k = b.dataset.k;
    VAC.c[k] = !VAC.c[k];
    /* Al desmarcar una condición se desmarcan también sus subcondiciones. */
    if(!VAC.c[k]) CONDICIONES.forEach(g=>g.items.forEach(c=>{ if(c.sub===k) VAC.c[c.k] = false; }));
    const y = window.scrollY;
    renderVac(); window.scrollTo({top:y, left:0, behavior:'instant'});
    return;
  }
  if(a==='vaciar'){ VAC = nuevo(); if(typeof VGI==='object' && VGI) delete VGI.vacunas; render(); return; }
  if(a==='addvgi'){ if(agregarVGI()){ const y=window.scrollY; render(); window.scrollTo({top:y, left:0, behavior:'instant'}); } return; }
  if(a==='copiar'){ const t = texto(); if(t) copiar(t, b); return; }
});
document.addEventListener('change', e=>{
  const el = e.target.closest && e.target.closest('select[data-vac]');
  if(!el) return;
  const a = el.dataset.vac;
  if(a==='campo'){ VAC[el.dataset.k] = el.value; VAC.origen[el.dataset.k] = false; refrescar(); }
  if(a==='neumo'){ VAC.neumo = el.value; refrescar(); }
  if(a==='est'){
    VAC.est[el.dataset.id] = {s: el.value, x: (VAC.est[el.dataset.id]||{}).x || ''};
    refrescar();
  }
});
document.addEventListener('input', e=>{
  const el = e.target.closest && e.target.closest('input[data-vac]');
  if(!el) return;
  if(el.dataset.vac==='campo'){ VAC[el.dataset.k] = el.value; VAC.origen[el.dataset.k] = false; refrescar(); }
  if(el.dataset.vac==='estx'){ const id = el.dataset.id; VAC.est[id] = {s:(VAC.est[id]||{}).s||'sindato', x: el.value}; }
});

/* Interfaz para las pruebas automáticas (verificacion/verificar-vacunacion.mjs). */
window.VACUNAS = {evaluar, texto, derivados, leerVGI, abrir, CONDICIONES, NEUMO_PREVIA, ESTADOS, CAT,
  get estado(){ return VAC; }, set estado(v){ VAC = v; }, nuevo};

/* ui-v5.js pinta la barra antes de que cargue este archivo: se vuelve a pintar
   para que el botón Vacunas aparezca desde la primera pantalla. */
renderTabs();
})();
