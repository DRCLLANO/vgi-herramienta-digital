// Verificación contra las fuentes primarias (añadida en la 2.13.1).
// Uso: npm install playwright && node verificar-fuentes.mjs ../index.html > resultado-fuentes.json
//
// Las pruebas generales comprueban que toda combinación produzca un veredicto;
// esta comprueba que el veredicto sea el que dicta la fuente. Para cada
// instrumento hay una transcripción de las reglas escrita aparte de la lógica
// de la aplicación, y se comparan ambas en todas las combinaciones posibles:
//   VES-13     Saliba D, et al. J Am Geriatr Soc. 2001;49:1691-9.
//              12.288 combinaciones (edad, salud, 6 actividades físicas y 5
//              actividades funcionales).
//   PPI        Morita T, et al. Support Care Cancer. 1999;7:128-33.
//              72 combinaciones de los cinco factores.
//   PPS y PPI  Coherencia: el texto de cada nivel de la PPS debe citar los
//              puntos que el PPI asigna a ese nivel, y el criterio del NECPAL
//              (PPS menor del 50 %) solo debe aparecer por debajo del 50 %.
//   Conversor  Todos los pares de origen y destino (361 desde la 2.13.4; 400 antes), 12 dosis y los cuatro
//              motivos de reducción (17.328 cálculos; 19.200 antes): mismo opioide y vía
//              conservan la dosis; metadona de destino con razones 4:1, 8:1 y
//              12:1 según la morfina oral (umbrales 90 y 300 mg); el resto,
//              equivalente de morfina dividido por el factor de destino; y la
//              ida y vuelta entre dos opioides que no sean metadona, sin
//              reducción, devuelve la dosis de partida. Además se dibuja el
//              resultado de todos los pares en la pantalla real del conversor.
//   Casos      Los casos de referencia de la revisión externa de la 2.13.0:
//              Charlson y Charlson Colombia, Lawton, EQ-5D (11111, 55555,
//              11151 y EVA fuera de rango), CFS 4 y 9, PPS discordante, SPPB
//              (equilibrio y tiempos límite), Fried, pérdida de peso, entradas
//              numéricas, selección múltiple sin evaluar, vulnerabilidad social,
//              PPI (exclusión de delirium por medicamento) y G8.
//   Seguridad  Desde la 2.13.3, conversor con parche de destino: los
//   (conv.)    orígenes por los dos parches, 15 dosis y cuatro motivos. La
//              presentación sugerida es la mayor que no supera la liberación
//              calculada; por debajo del parche mínimo se avisa "Sin
//              presentación compatible" sin posología ni rescate; con
//              fentanilo transdérmico se advierte la falta de tolerancia a
//              opioides por debajo de 60 mg de morfina oral. Además, al cambiar
//              el origen en la pantalla real la dosis se vacía. Desde la
//              2.13.4: el rescate del parche se calcula sobre la presentación
//              sugerida; con metadona de destino el rescate se da con morfina
//              o hidromorfona; la meperidina ya no figura.
// Termina con código 0 si no hay discrepancias y con 1 si las hay.
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = resolve(process.argv[2] || 'index.html');
const sha256 = createHash('sha256').update(readFileSync(file)).digest('hex');
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();
const jsErrors = [];
page.on('pageerror', e => jsErrors.push(e.message));
await page.route(u => !u.toString().startsWith('file:'), r => r.abort());
await page.goto('file://' + file);
await page.waitForTimeout(1000);

const r = await page.evaluate(() => {
  const out = { version: null, ves13: {}, ppi: {}, ppsPpi: {}, conversor: {} };
  const m = document.documentElement.innerHTML.match(/"softwareVersion":\s*"([^"]+)"/);
  out.version = m ? m[1] : null;
  const cerca = (a, b) => Math.abs(a - b) < 1e-9;

  // Puntaje de una escala sumativa tal como lo calcula la aplicación:
  // valor de la opción elegida en los ítems simples y multiScore() en los de
  // selección múltiple.
  const puntajeApp = (s, resp) => s.items.reduce((n, it, i) =>
    n + (it.type === 'multi' ? multiScore(it, resp[i]) : resp[i]), 0);
  const subconjuntos = n => Array.from({ length: 1 << n }, (_, k) =>
    Array.from({ length: n }, (_, j) => j).filter(j => k & (1 << j)));

  // ---------------- VES-13 ----------------
  {
    const s = SCALES.ves13, dif = [];
    const ref = (edad, salud, fis, fun) =>
      ({ 0: 0, 1: 1, 2: 3 })[edad] + salud + Math.min(fis.length, 2) + (fun.length ? 4 : 0);
    let n = 0;
    for (let edad = 0; edad < 3; edad++) for (let salud = 0; salud < 2; salud++)
      for (const fis of subconjuntos(6)) for (const fun of subconjuntos(5)) {
        n++;
        const resp = [s.items[0].o[edad].v, s.items[1].o[salud].v, fis, fun];
        const app = puntajeApp(s, resp), esperado = ref(edad, salud, fis, fun);
        const vulnApp = s.interpret(app).t === 'Adulto mayor vulnerable';
        if (app !== esperado || vulnApp !== (esperado >= 3))
          dif.push({ edad, salud, fisicas: fis.length, funcionales: fun.length, app, esperado });
      }
    out.ves13 = { combinaciones: n, maximoDeclarado: s.max, maximoFuente: 10,
      discrepancias: dif.length, ejemplos: dif.slice(0, 10) };
  }

  // ---------------- PPI ----------------
  {
    const s = SCALES.ppi, dif = [];
    const pps = [4, 2.5, 0], ingesta = [0, 1, 2.5], edema = [0, 1], disnea = [0, 3.5], delirium = [0, 4];
    const cat = t => t > 6 ? 'menor de 3 semanas' : t > 4 ? 'menor de 6 semanas' : 'sin umbral';
    const catApp = v => /3 semanas/.test(v) ? 'menor de 3 semanas' : /6 semanas/.test(v) ? 'menor de 6 semanas' : 'sin umbral';
    let n = 0;
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 2; c++)
      for (let d = 0; d < 2; d++) for (let e = 0; e < 2; e++) {
        n++;
        const resp = [s.items[0].o[a].v, s.items[1].o[b].v, s.items[2].o[c].v, s.items[3].o[d].v, s.items[4].o[e].v];
        const app = puntajeApp(s, resp);
        const esperado = pps[a] + ingesta[b] + edema[c] + disnea[d] + delirium[e];
        if (!cerca(app, esperado) || catApp(s.interpret(app).t) !== cat(esperado))
          dif.push({ respuestas: [a, b, c, d, e].join(''), app, esperado });
      }
    out.ppi = { combinaciones: n, maximoDeclarado: s.max, maximoFuente: 15,
      discrepancias: dif.length, ejemplos: dif.slice(0, 10) };
  }

  // ---------------- Coherencia PPS y PPI ----------------
  {
    const dif = [];
    const fila = { 100: [100, 100, 100, 100, 100], 90: [100, 90, 100, 100, 100], 80: [100, 80, 100, 80, 100],
      70: [70, 70, 100, 80, 100], 60: [70, 60, 60, 80, 60], 50: [50, 50, 50, 80, 60], 40: [40, 40, 40, 80, 40],
      30: [30, 30, 30, 80, 40], 20: [30, 30, 30, 20, 40], 10: [30, 30, 30, 10, 10] };
    const ppiDe = v => SCALES.ppi.items[0].o.find(o =>
      (o.l.includes('10 a 20') && v <= 20) || (o.l.includes('30 a 50') && v >= 30 && v <= 50) || (o.l.includes('60') && v >= 60)).v;
    for (const [nivel, resp] of Object.entries(fila)) {
      const v = +nivel, res = SCALES.pps.logic(resp);
      const mm = res.d.match(/suma ([\d,]+) puntos/);
      const citado = mm ? parseFloat(mm[1].replace(',', '.')) : null;
      const necpal = /cumple el criterio de deterioro funcional del bloque oncológico del NECPAL/.test(res.d);
      if (res.display !== v + ' %') dif.push({ nivel: v, problema: 'nivel calculado ' + res.display });
      if (citado !== ppiDe(v)) dif.push({ nivel: v, problema: 'cita ' + citado + ' puntos de PPI y el PPI asigna ' + ppiDe(v) });
      if (necpal !== (v < 50)) dif.push({ nivel: v, problema: 'criterio del NECPAL ' + (necpal ? 'citado' : 'omitido') });
    }
    out.ppsPpi = { niveles: 10, discrepancias: dif.length, ejemplos: dif };
  }

  // ---------------- Conversor de opioides ----------------
  {
    const dif = [], ids = OPIOIDES.map(o => o.id);
    // Desde la 2.13.4 la lista tiene 19 opioides (se retiró la meperidina IV).
    // Se prevén un factor de origen distinto (fOrigen) y opioides solo de origen
    // (soloOrigen), aunque hoy ninguno los usa.
    const destinos = OPIOIDES.filter(o => !o.soloOrigen).map(o => o.id);
    const dosis = [1, 5, 10, 25, 37.5, 60, 89, 90, 100, 300, 301, 500];
    const calc = (from, to, dose, motivo) => {
      state.tool = { from, to, dose: String(dose), dpt: '', tomas: '', motivo };
      return opiCalc();
    };
    const ref = (o, d, dose, red) => {
      if (o.id === d.id) return dose;
      const emo = dose * (o.fOrigen || o.f);
      const bruta = d.metadona ? emo / (emo > 300 ? 12 : emo >= 90 ? 8 : 4) : emo / d.f;
      return bruta * (1 - red / 100);
    };
    let n = 0;
    for (const a of ids) for (const b of destinos) for (const dose of dosis) for (const mot of OPI_MOTIVOS) {
      n++;
      const o = opiGet(a), d = opiGet(b), res = calc(a, b, dose, mot.id);
      const esperado = ref(o, d, dose, mot.r);
      if (!res || !isFinite(res.final) || res.final <= 0 || Math.abs(res.final - esperado) > 1e-9 * Math.max(1, esperado))
        dif.push({ origen: a, destino: b, dosis: dose, motivo: mot.id, app: res && res.final, esperado });
    }
    // Ida y vuelta sin reducción entre opioides que no son metadona ni tienen
    // factor distinto según la dirección.
    let vueltas = 0;
    const asim = o => o.metadona || o.fOrigen || o.soloOrigen;
    for (const a of ids) for (const b of ids) {
      if (asim(opiGet(a)) || asim(opiGet(b))) continue;
      vueltas++;
      const ida = calc(a, b, 60, 'dolor').final, vuelta = calc(b, a, ida, 'dolor').final;
      if (Math.abs(vuelta - 60) > 1e-9) dif.push({ origen: a, destino: b, problema: 'ida y vuelta da ' + vuelta });
    }
    // Dibujo real del resultado para todos los pares.
    const prev = state;
    state = { view: 'tool', eje: 'paliativo', id: 'opioides', ans: {}, sel: {}, multi: {}, extra: {}, q: '', dom: null,
      evid: false, showResult: false, tool: { from: 'mor_vo', dose: '60', dpt: '', tomas: '', to: 'oxi_vo', motivo: 'estand' } };
    render();
    let dibujados = 0;
    for (const a of ids) for (const b of destinos) {
      Object.assign(state.tool, { from: a, to: b, dose: '60' });
      try {
        renderOpiRes();
        const txt = document.getElementById('opires').innerText;
        if (/NaN|undefined|Infinity/.test(txt)) dif.push({ origen: a, destino: b, problema: 'texto con NaN, undefined o Infinity' });
        if (a === b && !/no hay rotación/.test(txt)) dif.push({ origen: a, destino: b, problema: 'mismo opioide sin aviso' });
        dibujados++;
      } catch (e) { dif.push({ origen: a, destino: b, problema: 'error al dibujar: ' + e.message }); }
    }
    state = prev;
    out.conversor = { calculos: n, idaYVuelta: vueltas, dibujados, discrepancias: dif.length, ejemplos: dif.slice(0, 15) };
  }
  // ---------------- Casos de referencia del informe externo (2.13.1) ----------------
  {
    let nOk = 0;
    const dif = [], ok = (cond, que) => { nOk++; if (!cond) dif.push(que); };
    const sumaDe = (id, idxs) => SCALES[id].items.reduce((n, it, i) => n + it.o[idxs[i]].v, 0);
    // Charlson original: enfermedad cerebrovascular 1 punto; máximo 37.
    ok(SCALES.charlson.items.find(it => /cerebrovascular/.test(it.q)).o.map(o => o.v).join() === '0,1', 'Charlson: ECV no vale 1');
    ok(SCALES.charlson.max === 37, 'Charlson: máximo distinto de 37');
    // Charlson Colombia: ECV 2 puntos; tumor en un solo ítem excluyente; máximo 26.
    ok(SCALES.charlsonco.items.find(it => /cerebrovascular/.test(it.q)).o.map(o => o.v).join() === '0,2', 'Charlson Colombia: ECV no vale 2');
    ok(SCALES.charlsonco.items.filter(it => /[Tt]umor/.test(it.q)).length === 1, 'Charlson Colombia: más de un ítem de tumor');
    ok(SCALES.charlsonco.max === 26, 'Charlson Colombia: máximo distinto de 26');
    // Lawton: cinco opciones del cuidado de la casa. Adaptación declarada de la
    // herramienta (decisión clínica del autor): "necesita ayuda en todas las
    // labores" vale 0, como "no participa", para que no dé "independiente"; en
    // el original vale 1. Las tareas ligeras valen 1.
    const casa = SCALES.lawton.items.find(it => /casa/.test(it.q));
    ok(casa.o.length === 5 && casa.o.filter(o => /ligeras/.test(o.l)).every(o => o.v === 1), 'Lawton: opciones del cuidado de la casa');
    ok(casa.o.find(o => /ayuda en todas/.test(o.l)).v === 0 && casa.o.find(o => /No participa/.test(o.l)).v === 0, 'Lawton: adaptación declarada no aplicada');
    const lw = sumaDe('lawton', SCALES.lawton.items.map(it => it === casa ? it.o.findIndex(o => /ayuda en todas/.test(o.l)) : 0));
    ok(lw === 7 && SCALES.lawton.interpret(lw).t !== 'Independiente', 'Lawton: ayuda en todas las labores da independiente');
    ok(/Adaptación de esta herramienta/.test(SCALES.lawton.note), 'Lawton: adaptación no declarada en la nota');
    // EQ-5D-5L: perfiles 1 a 5 y sin clasificación por suma.
    state.extra = {};
    ok(SCALES.eq5d.logic([1, 1, 1, 1, 1]).display === '11111', 'EQ-5D: perfil 11111');
    ok(SCALES.eq5d.logic([5, 5, 5, 5, 5]).display === '55555', 'EQ-5D: perfil 55555');
    const dolor = SCALES.eq5d.logic([1, 1, 1, 5, 1]);
    ok(dolor.display === '11151' && dolor.tone === 'alert' && !/leve/i.test(dolor.t), 'EQ-5D: dolor extremo aislado no se informa como tal');
    state.extra = { eva: '150' };
    ok(/no es válido/.test(SCALES.eq5d.logic([1, 1, 1, 1, 1]).d), 'EQ-5D: EVA de 150 aceptada');
    state.extra = { eva: '80' };
    ok(/80 de 100/.test(SCALES.eq5d.logic([1, 1, 1, 1, 1]).d), 'EQ-5D: EVA válida no registrada');
    state.extra = {};
    // CFS 2.0: nombres de las categorías 4 y 9.
    ok(SCALES.cfs.logic([4]).t === 'Vive con fragilidad muy leve', 'CFS: categoría 4');
    ok(SCALES.cfs.logic([9]).t === 'Situación terminal', 'CFS: categoría 9');
    // PPS: perfil discordante (encamado con autocuidado parcial) muestra el intervalo.
    ok(/mejor ajuste entre 30 y 50/.test(SCALES.pps.logic([30, 30, 50, 100, 100]).display), 'PPS: discordancia sin intervalo');
    // SPPB: equilibrio jerárquico y tiempos límite en la categoría de Guralnik 1994 (comunidad).
    const sp = SCALES.sppb;
    ok(sp.items.length === 3 && sp.items[0].o.map(o => o.v).join() === '0,1,2,3,4', 'SPPB: equilibrio no es un ítem jerárquico de 0 a 4');
    const cat = (it, t) => {
      const m = it.o.filter(o => {
        const x = o.l.replace(/,/g, '.');
        let r;
        if ((r = x.match(/^De ([\d.]+) a ([\d.]+) segundos/))) return t >= +r[1] && t <= +r[2];
        if ((r = x.match(/^([\d.]+) segundos o menos/))) return t <= +r[1];
        if ((r = x.match(/^([\d.]+) segundos o más/))) return t >= +r[1];
        if ((r = x.match(/^Más de ([\d.]+) segundos/))) return t > +r[1];
        return false;
      });
      return m.length === 1 ? m[0].v : 'sin categoría única (' + m.length + ')';
    };
    const marcha = { 2.0: 4, 3.1: 4, 3.2: 3, 4.0: 3, 4.1: 2, 5.6: 2, 5.7: 1, 9.0: 1 };
    const silla = { 9.0: 4, 11.1: 4, 11.2: 3, 13.6: 3, 13.7: 2, 16.6: 2, 16.7: 1, 60: 1, 60.1: 0 };
    for (const [t, v] of Object.entries(marcha)) ok(cat(sp.items[1], +t) === v, 'SPPB: marcha ' + t + ' s da ' + cat(sp.items[1], +t) + ' y debe dar ' + v);
    for (const [t, v] of Object.entries(silla)) ok(cat(sp.items[2], +t) === v, 'SPPB: silla ' + t + ' s da ' + cat(sp.items[2], +t) + ' y debe dar ' + v);
    // Fried: distancia en metros.
    ok(/4,57 metros/.test(SCALES.fried.items.find(it => /marcha/.test(it.q)).hint), 'Fried: unidad de la marcha');
    // Pérdida de peso: 100 a 95,5 kg no se describe como 4 % o menos.
    state.extra = { wPrev: '100', wNow: '95,5' };
    const wt = weightText();
    ok(/4,5 %/.test(wt) && !/4 % o menos/.test(wt), 'Pérdida de peso: texto del 4,5 %');
    state.extra = {};
    // Entradas numéricas estrictas.
    ok(isNaN(num('60abc')) && num('60,5') === 60.5 && num(' 72 ') === 72, 'num(): validación de la cadena');
    state.extra = { peso: '-60', talla: '160' };
    ok(!/IMC calculado/.test(bmiText()), 'IMC: acepta peso negativo');
    state.extra = {};
    // Selección múltiple sin tocar: no cuenta como respondida.
    for (const id of ['vulnerabilidad', 'maltrato', 'ves13']) {
      state = { view: 'scale', eje: SCALES[id].eje, id, ans: {}, sel: {}, multi: {}, extra: {}, q: '', dom: null, evid: false, showResult: false };
      initScale();
      ok(!complete(), id + ': aparece completa sin evaluar');
    }
    // Vulnerabilidad social sin factores de ningún tipo no afirma redes adecuadas.
    ok(!/[Aa]decuadas redes/.test(SCALES.vulnerabilidad.logic([0, 0]).d), 'Vulnerabilidad: afirma redes adecuadas sin factores protectores');
    // PPI: exclusión del delirium por un solo medicamento.
    ok(/solo por un medicamento/.test(SCALES.ppi.items[4].hint), 'PPI: falta la exclusión del delirium por medicamento');
    // G8: el texto del tramo superior no excluye el 14,5.
    ok(!/15 o más/.test(SCALES.g8.interpret(14.5).d), 'G8: texto excluye 14,5');
    out.casosInforme = { comprobaciones: nOk, discrepancias: dif.length, ejemplos: dif };
  }
  // ---------------- Seguridad del conversor (2.13.3) ----------------
  // Parches: la presentación sugerida nunca supera la liberación calculada y es
  // la mayor que no la supera; por debajo del parche mínimo no hay presentación
  // compatible y no se dibujan posología ni rescate. Fentanilo transdérmico:
  // advertencia de tolerancia a opioides por debajo de 60 mg de morfina oral.
  // Cambio de origen: la dosis se vacía.
  {
    const dif = [], ids = OPIOIDES.map(o => o.id), parches = OPIOIDES.filter(o => o.parche);
    const dosis = [1, 5, 10, 20, 25, 30, 37.5, 40, 59, 60, 90, 100, 200, 300, 500];
    let n = 0;
    const prev = state;
    state = { view: 'tool', eje: 'paliativo', id: 'opioides', ans: {}, sel: {}, multi: {}, extra: {}, q: '', dom: null,
      evid: false, showResult: false, tool: { from: 'mor_vo', dose: '60', dpt: '', tomas: '', to: 'oxi_vo', motivo: 'estand' } };
    render();
    for (const a of ids) for (const d of parches) for (const dose of dosis) for (const mot of OPI_MOTIVOS) {
      n++;
      Object.assign(state.tool, { from: a, to: d.id, dose: String(dose), motivo: mot.id });
      const r = opiCalc(), mismo = a === d.id;
      const caben = d.pres.filter(p => p <= r.final + 1e-9);
      const esperado = mismo ? null : (caben.length ? Math.max(...caben) : null);
      const caso = { origen: a, destino: d.id, dosis: dose, motivo: mot.id, calculado: r.final };
      if (r.parche !== esperado) dif.push({ ...caso, app: r.parche, esperado, problema: 'presentación sugerida' });
      if (r.parche !== null && r.parche > r.final + 1e-9) dif.push({ ...caso, problema: 'parche por encima de lo calculado' });
      if (!!r.sinParche !== (!mismo && !caben.length)) dif.push({ ...caso, problema: 'aviso de sin presentación' });
      renderOpiRes();
      const txt = document.getElementById('opires').innerText;
      if (r.sinParche && (/Posología sugerida|Dosis de rescate|Presentación sugerida/.test(txt) || !/Sin presentación compatible/.test(txt)))
        dif.push({ ...caso, problema: 'sin presentación: texto incorrecto' });
      if (d.id === 'fen_td' && !mismo) {
        const contra = /Contraindicado si no hay tolerancia/.test(txt), recuerdo = /Tolerancia a opioides:/.test(txt);
        if (r.emo < 60 ? !contra : (contra || !recuerdo)) dif.push({ ...caso, emo: r.emo, problema: 'advertencia de tolerancia' });
      }
    }
    // Casos del informe externo de la 2.13.2.
    Object.assign(state.tool, { from: 'mor_vo', to: 'fen_td', dose: '10', motivo: 'fragil' });
    let r = opiCalc();
    if (!(r.sinParche && r.parche === null)) dif.push({ problema: 'morfina oral 10 mg con −50 % a fentanilo: sugiere parche ' + r.parche });
    Object.assign(state.tool, { from: 'mor_vo', to: 'bup_td', dose: '30', motivo: 'estand' });
    r = opiCalc();
    if (!(r.sinParche && r.parche === null)) dif.push({ problema: 'morfina oral 30 mg a buprenorfina: sugiere parche ' + r.parche });
    // Cambio de origen en la pantalla real: la dosis se vacía.
    Object.assign(state.tool, { from: 'fen_iv', to: 'mor_vo', dose: '500', dpt: '', tomas: '', motivo: 'estand' });
    render();
    const sel = document.querySelector('select[data-op="from"]');
    sel.value = 'mor_vo';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    const inp = document.querySelector('input[data-op="dose"]');
    if (state.tool.dose !== '' || (inp && inp.value !== '') || opiCalc() !== null)
      dif.push({ problema: 'cambio de origen: la dosis se conserva (' + state.tool.dose + ')' });
    // 2.13.4: rescate del parche sobre la presentación sugerida; rescate con
    // metadona de destino con morfina o hidromorfona y sin cifra de metadona;
    // meperidina retirada.
    for (const a of ids) for (const d of parches) for (const dose of dosis) {
      Object.assign(state.tool, { from: a, to: d.id, dose: String(dose), motivo: 'estand' });
      const r = opiCalc();
      if (r.parche !== null && !(r.rescIR && r.rescIR.parche === r.parche))
        dif.push({ origen: a, destino: d.id, dosis: dose, problema: 'rescate no calculado sobre el parche sugerido' });
    }
    for (const a of ids) for (const dose of dosis) for (const mot of OPI_MOTIVOS) {
      Object.assign(state.tool, { from: a, to: 'met_vo', dose: String(dose), motivo: mot.id });
      renderOpiRes();
      const txt = document.getElementById('opires').innerText;
      if (!/Dosis de rescate: con morfina o hidromorfona de liberación inmediata/.test(txt) || /Dosis de rescate:\s*[\d,]+\s*mg/.test(txt))
        dif.push({ origen: a, dosis: dose, motivo: mot.id, problema: 'rescate con metadona' });
    }
    Object.assign(state.tool, { from: 'mor_vo', to: 'fen_td', dose: '200', motivo: 'estand' });
    let rr = opiCalc();
    if (!(rr.parche === 25 && rr.rescIR && Math.abs(rr.rescIR.emo - 90) < 1e-9)) dif.push({ problema: 'morfina 200 a fentanilo: rescate sobre ' + (rr.rescIR && rr.rescIR.parche) });
    Object.assign(state.tool, { from: 'met_vo', to: 'met_vo', dose: '60', motivo: 'estand' });
    rr = opiCalc();
    if (!(rr.rescIR && rr.rescIR.sinCifra)) dif.push({ problema: 'metadona a metadona: cifra de rescate' });
    Object.assign(state.tool, { from: 'mor_vo', to: 'met_vo', dose: '60', motivo: 'estand' });
    rr = opiCalc();
    if (!(rr.rescIR && Math.abs(rr.rescIR.emo - 42) < 1e-9)) dif.push({ problema: 'morfina 60 a metadona: base del rescate' });
    if (opiGet('mep_iv') || /Meperidina/.test(document.getElementById('view').innerText))
      dif.push({ problema: 'la meperidina sigue en el conversor' });
    state = prev;
    out.seguridadConversor = { combinaciones: n, discrepancias: dif.length, ejemplos: dif.slice(0, 15) };
  }
  return out;
});

const total = r.ves13.discrepancias + r.ppi.discrepancias + r.ppsPpi.discrepancias + r.conversor.discrepancias + r.casosInforme.discrepancias + r.seguridadConversor.discrepancias
  + (r.ves13.maximoDeclarado !== r.ves13.maximoFuente ? 1 : 0) + (r.ppi.maximoDeclarado !== r.ppi.maximoFuente ? 1 : 0);
console.log(JSON.stringify({ archivo: file.split('/').pop(), sha256, fecha: new Date().toISOString().slice(0, 10),
  ...r, totalDiscrepancias: total, erroresJS: jsErrors }, null, 2));
await browser.close();
process.exit(total || jsErrors.length ? 1 : 0);
