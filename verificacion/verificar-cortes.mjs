// Verificación de puntos de corte contra las fuentes (desde el 17-oct-2026).
// Uso, desde la raíz del repositorio:
//   node verificacion/verificar-cortes.mjs index.html verificacion/fuentes-manual-2024.json verificacion/fuentes-complementarias.json > resultado-cortes.json
// Sin argumentos de fuente usa esos dos archivos.
//
// Las otras pruebas comprueban que todo puntaje tenga un veredicto y que los
// tramos no cambien respecto de trazabilidad-instrumentos.csv. Esa tabla salió
// de la propia aplicación, así que detecta cambios pero no errores de origen.
// Esta prueba compara la aplicación con transcripciones hechas aparte, leyendo
// cada fuente y antes de abrir el código: el manual de referencia
// (fuentes-manual-2024.json) y el artículo original de cada escala
// complementaria (fuentes-complementarias.json).
//
// Para cada escala que no tenía prueba contra la fuente:
//  - sumativas: recorre todos los puntajes posibles y comprueba que cada uno
//    caiga en el tramo que dicta la fuente, que la aplicación no parta ni una
//    dos tramos de la fuente, y que los valores de cada ítem y el rango coincidan;
//  - algorítmicas: comprueba la regla publicada en todas las combinaciones
//    (CAM, criterios DSM 5-TR, subescalas del MOS, NECPAL 3.1) o las opciones
//    (Ashworth, GDS de Reisberg, tipos de maltrato, lista prequirúrgica).
//
// Resultado:
//  - fallos: la aplicación contradice la fuente. Hacen fallar la prueba.
//  - avisos: la fuente no lo define (huecos, cortes que la fuente no tiene,
//    reglas ambiguas). Se informa qué hace la aplicación, sin juzgarlo.
//  - por corregir: hallazgos que el autor decidió corregir en una versión
//    futura ("porCorregir" del archivo de fuentes). Se listan aparte.
// Cuando el autor decide que un fallo o un aviso es intencional, se registra en
// "decisiones" del archivo de fuentes que corresponda, con su clave, fecha y motivo, y
// deja de marcarse. La prueba no modifica la aplicación ni ningún otro archivo.
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = resolve(process.argv[2] || 'index.html');
const rutas = process.argv.length > 3 ? process.argv.slice(3)
  : ['verificacion/fuentes-manual-2024.json', 'verificacion/fuentes-complementarias.json'];
const archivos = rutas.map(f => ({ ruta: f, ...JSON.parse(readFileSync(resolve(f), 'utf8')) }));
// Cada escala lleva la cita de su fuente; las del manual, la tabla y la página.
const fuente = { sumativas: {}, algoritmicas: {}, decisiones: {}, porCorregir: {}, pendientes: [] };
for (const a of archivos) {
  for (const tipo of ['sumativas', 'algoritmicas'])
    for (const [id, T] of Object.entries(a[tipo] || {}))
      fuente[tipo][id] = { ...T, cita: T.fuente || `${a.fuente.split('.')[0]} (${T.tabla}, p. ${T.pagina})` };
  Object.assign(fuente.decisiones, a.decisiones || {});
  for (const [k, v] of Object.entries(a.porCorregir || {})) if (!k.startsWith('_')) fuente.porCorregir[k] = v;
  fuente.pendientes.push(...((a.complementariasPendientes || {}).ids || []));
}
fuente.pendientes = fuente.pendientes.filter(id => !fuente.sumativas[id] && !fuente.algoritmicas[id]);
const sha256 = createHash('sha256').update(readFileSync(file)).digest('hex');

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();
const jsErrors = [];
page.on('pageerror', e => jsErrors.push(e.message));
await page.route(u => !u.toString().startsWith('file:'), r => r.abort()); // sin red
await page.goto('file://' + file);
await page.waitForTimeout(1000);

const r = await page.evaluate((F) => {
  const out = { version: null, escalas: {}, hallazgos: [] };
  const m = document.documentElement.innerHTML.match(/"softwareVersion":\s*"([^"]+)"/);
  out.version = m ? m[1] : null;
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const tiene = (txt, claves) => (claves || []).every(c => new RegExp(norm(c)).test(norm(txt)));
  const algunoDe = (txt, palabras) => (palabras || []).some(c => new RegExp(norm(c)).test(norm(txt)));
  const hallazgo = (id, tipo, clave, texto) => out.hallazgos.push({ id, tipo, clave: id + ':' + clave, texto });
  const fallo = (id, clave, texto) => hallazgo(id, 'fallo', clave, texto);
  const aviso = (id, clave, texto) => hallazgo(id, 'aviso', clave, texto);
  const rango = (a, b) => a === b ? String(a) : a + ' a ' + b;
  // Valores posibles de un ítem: los de sus opciones o, si es de selección
  // múltiple, los que da multiScore() al marcar de 0 a todas las casillas.
  const valores = it => {
    const vs = it.type === 'multi'
      ? Array.from({ length: (it.chips || []).length + 1 }, (_, k) => multiScore(it, (it.chips || []).slice(0, k)))
      : (it.o || []).map(o => o.v);
    return [...new Set(vs.filter(v => typeof v === 'number'))].sort((a, b) => a - b);
  };

  // ---------------- Sumativas ----------------
  for (const [id, T] of Object.entries(F.sumativas)) {
    const s = SCALES[id];
    const res = out.escalas[id] = { tipo: 'sumativa', fuente: T.cita };
    if (!s) { fallo(id, 'existe', 'la escala no está en la aplicación'); continue; }
    if (typeof s.interpret !== 'function') {
      if (T.sinCortes) { res.estado = 'sin cortes en la fuente ni en la aplicación'; continue; }
      fallo(id, 'interpret', 'la aplicación no tiene interpretación por puntaje'); continue;
    }

    // Ítems y rango
    const items = s.items || [];
    if (Array.isArray(T.items)) {
      if (items.length !== T.items.length) fallo(id, 'items:numero', `la aplicación tiene ${items.length} ítems y la fuente ${T.items.length}`);
      else T.items.forEach((esperado, i) => {
        if (esperado === null) return;
        const app = valores(items[i]);
        const ref = [...new Set(esperado)].sort((a, b) => a - b);
        if (JSON.stringify(app) !== JSON.stringify(ref))
          fallo(id, 'item' + (i + 1), `ítem ${i + 1}: valores ${JSON.stringify(app)} en la aplicación y ${JSON.stringify(ref)} en la fuente`);
      });
    }
    // Valores por ítem sin importar el orden (la aplicación puede ordenar los
    // ítems de otra forma que la fuente)
    const multiconjunto = l => l.map(v => JSON.stringify([...new Set(v)].sort((a, b) => a - b))).sort();
    if (T.valoresPorItem) {
      const app = multiconjunto(items.map(valores)), ref = multiconjunto(T.valoresPorItem);
      if (JSON.stringify(app) !== JSON.stringify(ref))
        fallo(id, 'items:valores', `valores de los ítems ${app.join(' ')} en la aplicación y ${ref.join(' ')} en la fuente`);
    }
    if (T.valoresItem) {
      if (items.length !== T.numeroItems) fallo(id, 'items:numero', `la aplicación tiene ${items.length} ítems y la fuente ${T.numeroItems}`);
      items.forEach((it, i) => {
        if (JSON.stringify(valores(it)) !== JSON.stringify(T.valoresItem))
          fallo(id, 'item' + (i + 1), `ítem ${i + 1}: valores ${JSON.stringify(valores(it))} y la fuente ${JSON.stringify(T.valoresItem)}`);
      });
    }
    for (const mu of T.multi || []) {
      const it = items[mu.item - 1];
      if (!it || it.type !== 'multi') { fallo(id, 'multi' + mu.item, `el ítem ${mu.item} no es de selección múltiple`); continue; }
      const n = (it.chips || []).length;
      if (n !== mu.opciones) fallo(id, 'multi' + mu.item + ':opciones', `el ítem ${mu.item} tiene ${n} opciones y la fuente ${mu.opciones}`);
      const bajo = multiScore(it, (it.chips || []).slice(0, mu.umbral - 1)), alto = multiScore(it, (it.chips || []).slice(0, mu.umbral));
      if (!(bajo === 0 && alto === 1)) fallo(id, 'multi' + mu.item + ':umbral', `el ítem ${mu.item} debe puntuar 1 desde ${mu.umbral} opciones; con ${mu.umbral - 1} da ${bajo} y con ${mu.umbral} da ${alto}`);
    }
    if (typeof T.max === 'number' && s.max !== T.max) fallo(id, 'max', `máximo ${s.max} en la aplicación y ${T.max} en la fuente`);
    if (typeof T.min === 'number' && items.length && items.every(it => it.o && it.o.length)) {
      const minApp = items.reduce((n, it) => n + Math.min(...valores(it)), 0);
      if (minApp !== T.min) fallo(id, 'min', `mínimo ${minApp} en la aplicación y ${T.min} en la fuente`);
    }

    // Veredicto de cada puntaje posible
    // Sin rango en el manual (autopercepción): se recorre el de la aplicación
    const vMin = typeof T.min === 'number' ? T.min : 0, vMax = typeof T.max === 'number' ? T.max : s.max;
    const paso = T.paso || 1, veredicto = {};
    for (let v = vMin; v <= vMax + 1e-9; v += paso) {
      const x = Math.round(v * 100) / 100;
      let t; try { t = (s.interpret(x) || {}).t; } catch (e) { t = 'ERROR: ' + e.message; }
      veredicto[x] = t;
    }
    // Tramos que la aplicación produce, para el informe
    const tramosApp = [];
    for (const [k, t] of Object.entries(veredicto).sort((a, b) => a[0] - b[0])) {
      const v = Number(k), ult = tramosApp[tramosApp.length - 1];
      if (ult && ult.t === t) ult.hasta = v; else tramosApp.push({ desde: v, hasta: v, t });
    }
    res.tramosAplicacion = tramosApp.map(x => `${rango(x.desde, x.hasta)}: ${x.t}`);

    if (T.sinCortes) {
      res.tramosManual = 'sin puntos de corte';
      if (tramosApp.length > 1)
        aviso(id, 'cortes-propios', `la fuente no da puntos de corte; la aplicación muestra ${tramosApp.length} tramos: ${res.tramosAplicacion.join(' | ')}`);
      continue;
    }
    res.tramosManual = T.tramos.map(b => `${rango(b.desde, b.hasta)}: ${b.manual}`);
    const textoDe = [];
    T.tramos.forEach((b, i) => {
      const enTramo = Object.entries(veredicto).filter(([k]) => Number(k) >= b.desde - 1e-9 && Number(k) <= b.hasta + 1e-9);
      const malos = enTramo.filter(([, t]) => !tiene(t, b.clave) || algunoDe(t, b.excluye));
      if (malos.length)
        fallo(id, `tramo:${b.desde}-${b.hasta}`, `${rango(b.desde, b.hasta)} debe ser "${b.manual}"; la aplicación da ${[...new Set(malos.map(([k, t]) => t))].map(t => '"' + t + '"').join(', ')} en ${rango(Number(malos[0][0]), Number(malos[malos.length - 1][0]))}`);
      const distintos = [...new Set(enTramo.map(([, t]) => t))];
      if (distintos.length > 1)
        fallo(id, `parte:${b.desde}-${b.hasta}`, `la aplicación parte el tramo ${rango(b.desde, b.hasta)} de la fuente en ${distintos.length}: ${distintos.join(' / ')}`);
      textoDe[i] = distintos[0];
    });
    for (let i = 1; i < T.tramos.length; i++)
      if (textoDe[i] && textoDe[i] === textoDe[i - 1])
        fallo(id, `une:${T.tramos[i - 1].desde}-${T.tramos[i].hasta}`, `la aplicación une dos tramos de la fuente (${rango(T.tramos[i - 1].desde, T.tramos[i - 1].hasta)} y ${rango(T.tramos[i].desde, T.tramos[i].hasta)}) bajo "${textoDe[i]}"`);
    for (const h of T.vacios || []) {
      const ts = Object.entries(veredicto).filter(([k]) => Number(k) >= h.desde && Number(k) <= h.hasta).map(([k, t]) => `${k}: "${t}"`);
      aviso(id, `vacio:${h.desde}-${h.hasta}`, `${h.nota} La aplicación muestra ${ts.join(', ')}`);
    }
  }

  // ---------------- Algorítmicas ----------------
  const A = F.algoritmicas;
  const combinaciones = n => Array.from({ length: 1 << n }, (_, k) => Array.from({ length: n }, (_, j) => (k >> j) & 1));
  const t = (id, a) => { try { return (SCALES[id].logic(a) || {}).t; } catch (e) { return 'ERROR: ' + e.message; } };

  // Ashworth: seis grados en el orden del manual
  {
    const id = 'ashworth', s = SCALES[id], res = out.escalas[id] = { tipo: 'algoritmica', fuente: A[id].cita };
    const op = s.items[0].o, grados = op.map(o => (o.l.match(/^\s*([0-4]\+?)/) || [])[1]);
    res.gradosAplicacion = grados;
    if (JSON.stringify(grados) !== JSON.stringify(A[id].grados)) fallo(id, 'grados', `grados ${JSON.stringify(grados)} en la aplicación y ${JSON.stringify(A[id].grados)} en la fuente`);
    const ver = op.map(o => `${(o.l.match(/^\s*([0-4]\+?)/) || [])[1]}: ${t(id, [o.v])}`);
    res.veredictos = ver;
    aviso(id, 'cortes-propios', `el manual no da tramos; la aplicación interpreta cada grado así: ${ver.join(' | ')}`);
  }

  // CAM: todas las combinaciones de los cuatro criterios
  {
    const id = 'cam', res = out.escalas[id] = { tipo: 'algoritmica', fuente: A[id].cita, combinaciones: 16 };
    const ambiguos = {};
    for (const a of combinaciones(4)) {
      const v = t(id, a), dx = a[0] && a[1] && (a[2] || a[3]), n = a.reduce((x, y) => x + y, 0);
      const nombre = a.map((x, i) => x ? i + 1 : null).filter(Boolean).join('+') || 'ninguno';
      if (dx && !/^delirium$/i.test(norm(v).trim())) fallo(id, 'delirium:' + nombre, `criterios ${nombre}: la fuente da delirium y la aplicación "${v}"`);
      if (!dx && norm(v).trim() === 'delirium') fallo(id, 'falso:' + nombre, `criterios ${nombre}: la aplicación da delirium sin cumplir 1 y 2 más 3 o 4`);
      if (n === 0 && !/sin delirium/.test(norm(v))) fallo(id, 'ninguno', `sin criterios la aplicación da "${v}"`);
      if (!dx && n > 0) (ambiguos[v] = ambiguos[v] || []).push(nombre);
    }
    aviso(id, 'subsindromico', `el manual rotula "1 o 2" como delirium subsindrómico sin precisar; la aplicación da ${Object.entries(ambiguos).map(([v, l]) => `"${v}" con ${l.join(', ')}`).join('; ')}`);
  }

  // DSM 5-TR delirium: los cinco criterios
  {
    const id = 'dsmdelirium', res = out.escalas[id] = { tipo: 'algoritmica', fuente: A[id].cita, combinaciones: 32 };
    for (const a of combinaciones(5)) {
      const v = t(id, a), todos = a.every(x => x === 1), cumple = /cumple criterios/.test(norm(v)) && !/no cumple/.test(norm(v));
      if (todos !== cumple) fallo(id, 'regla:' + a.join(''), `criterios ${a.join('')}: la aplicación da "${v}"`);
    }
  }

  // GDS de Reisberg: siete estadios con la severidad del manual
  {
    const id = 'gdsreisberg', s = SCALES[id], res = out.escalas[id] = { tipo: 'algoritmica', fuente: A[id].cita };
    const op = s.items[0].o;
    if (op.length !== 7) fallo(id, 'estadios', `la aplicación tiene ${op.length} estadios`);
    op.forEach((o, i) => {
      const sev = (norm(o.l).match(/gds\s*\d\s*·\s*([a-z ]+?)\./) || [])[1];
      if (o.v !== i + 1) fallo(id, 'valor' + (i + 1), `el estadio ${i + 1} vale ${o.v}`);
      if (sev !== A[id].estadios[i]) fallo(id, 'severidad' + (i + 1), `estadio ${i + 1}: la opción dice "${sev}" y la fuente "${A[id].estadios[i]}"`);
    });
    res.veredictos = op.map((o, i) => `GDS ${i + 1} (${A[id].estadios[i]}): ${t(id, [o.v])}`);
    aviso(id, 'agrupacion', `el manual nombra cada estadio por separado; la aplicación agrupa el resultado así: ${res.veredictos.join(' | ')}`);
  }

  // MOS: composición de las subescalas e índice global
  {
    const id = 'mos', s = SCALES[id], M = A[id], res = out.escalas[id] = { tipo: 'algoritmica', fuente: M.cita };
    const puntuables = (s.items || []).filter(it => it.o && it.o.length);
    const n = puntuables.length;
    if (n !== M.itemsPuntuables) fallo(id, 'items', `la aplicación puntúa ${n} ítems y la fuente ${M.itemsPuntuables}`);
    puntuables.forEach((it, i) => {
      if (JSON.stringify(valores(it)) !== JSON.stringify(M.valores)) fallo(id, 'valores' + (i + 2), `ítem ${i + 2}: valores ${JSON.stringify(valores(it))}`);
    });
    if (s.max !== M.global.max) fallo(id, 'max', `máximo ${s.max} en la aplicación y ${M.global.max} en la fuente (corregida su errata)`);
    // Cada ítem de la fuente (2 a 20) debe sumar en su subescala y solo en ella
    const sub = r => Object.fromEntries(['emocional', 'material', 'ocio', 'afectivo'].map(k => {
      const re = { emocional: /apoyo emocional[^:]*:\s*(\d+)/, material: /ayuda material[^:]*:\s*(\d+)/, ocio: /relaciones sociales de ocio[^:]*:\s*(\d+)/, afectivo: /apoyo afectivo[^:]*:\s*(\d+)/ }[k];
      return [k, Number((norm(r.d).match(re) || [])[1])];
    }));
    const global = r => Number((norm(r.d).match(/indice global[^:]*:\s*(\d+)/) || [])[1]);
    const base = Array(n).fill(1), r0 = s.logic(base), s0 = sub(r0);
    if (global(r0) !== M.global.min) fallo(id, 'global-min', `con todas las respuestas en 1 el índice global es ${global(r0)} y debe ser ${M.global.min}`);
    for (let i = 0; i < n; i++) {
      const a = base.slice(); a[i] = 5;
      const ri = s.logic(a), si = sub(ri), item = i + 2;
      const esperada = Object.entries(M.subescalas).find(([, x]) => x.items.includes(item));
      for (const [k, x] of Object.entries(si)) {
        const sube = x - s0[k], debe = esperada && esperada[0] === k ? 4 : 0;
        if (sube !== debe) fallo(id, `subescala:${item}:${k}`, `subir el ítem ${item} de 1 a 5 cambia ${k} en ${sube} y debería cambiarlo en ${debe}`);
      }
      if (global(ri) - global(r0) !== 4) fallo(id, `global:${item}`, `el ítem ${item} no suma al índice global`);
    }
    const r5 = s.logic(Array(n).fill(5)), s5 = sub(r5);
    for (const [k, x] of Object.entries(M.subescalas)) {
      if (s0[k] !== x.min) fallo(id, `${k}:min`, `mínimo de ${k}: ${s0[k]} y debe ser ${x.min}`);
      if (s5[k] !== x.max) fallo(id, `${k}:max`, `máximo de ${k}: ${s5[k]} y debe ser ${x.max}`);
    }
    // Tramos del índice global: el manual no los define
    const tr = [];
    for (let g = 19; g <= 95; g++) {
      const a = Array(n).fill(1); let resto = g - 19;
      for (let i = 0; i < n && resto > 0; i++) { const d = Math.min(4, resto); a[i] += d; resto -= d; }
      const v = s.logic(a).t, ult = tr[tr.length - 1];
      if (ult && ult.t === v) ult.hasta = g; else tr.push({ desde: g, hasta: g, t: v });
    }
    res.tramosAplicacion = tr.map(x => `${rango(x.desde, x.hasta)}: ${x.t}`);
    aviso(id, 'cortes-propios', `el manual da solo máximo, medio (57) y mínimo; la aplicación clasifica el índice global así: ${res.tramosAplicacion.join(' | ')}`);
  }

  // Maltrato: cinco tipos y cualquier signo es alarma
  {
    const id = 'maltrato', s = SCALES[id], M = A[id], res = out.escalas[id] = { tipo: 'algoritmica', fuente: M.cita };
    const tipos = s.items.map(it => norm(it.q));
    M.tipos.forEach((tp, i) => { if (!tipos[i] || !tipos[i].includes(norm(tp))) fallo(id, 'tipo' + (i + 1), `el tipo ${i + 1} es "${s.items[i] && s.items[i].q}" y la fuente dice "${tp}"`); });
    if (tipos.length !== M.tipos.length) fallo(id, 'tipos', `la aplicación tiene ${tipos.length} tipos`);
    const cero = t(id, Array(tipos.length).fill(0));
    if (/presente/.test(norm(cero))) fallo(id, 'cero', `sin signos la aplicación da "${cero}"`);
    tipos.forEach((_, i) => {
      const a = Array(tipos.length).fill(0); a[i] = 1;
      const v = t(id, a);
      if (!/presente/.test(norm(v))) fallo(id, 'alarma' + (i + 1), `un signo de ${M.tipos[i]} no da alarma: "${v}"`);
    });
  }
  // NECPAL 3.1: positivo con 1 o más de 13 parámetros; la pregunta sorpresa aparte
  if (A.necpal) {
    const id = 'necpal', s = SCALES[id], M = A[id], res = out.escalas[id] = { tipo: 'algoritmica', fuente: M.cita };
    const its = s.items || [], iPS = its.findIndex(it => /sorpresa/.test(norm(it.q)));
    const params = its.map((_, i) => i).filter(i => i !== iPS);
    if (iPS < 0) fallo(id, 'ps', 'no hay ítem de pregunta sorpresa');
    if (params.length !== M.parametros) fallo(id, 'parametros', `la aplicación tiene ${params.length} parámetros y la fuente ${M.parametros}`);
    const si = it => (it.o.find(o => /^\s*s[ií]\b|presente|no me sorprender|^no\b/i.test(o.l) && o.v === 1) || it.o.find(o => o.v === 1)).v;
    const ver = a => { try { return s.logic(a) || {}; } catch (e) { return { t: 'ERROR: ' + e.message }; } };
    const positivo = r => /positiv/.test(norm(r.t)) && !/negativ/.test(norm(r.t));
    const cero = its.map(() => 0);
    const r0 = ver(cero);
    if (positivo(r0)) fallo(id, 'cero', `sin parámetros la aplicación da "${r0.t}"`);
    const sinPS = {};
    if (iPS >= 0) {
      const a = cero.slice(); a[iPS] = si(its[iPS]);
      const r = ver(a);
      if (positivo(r)) fallo(id, 'solo-ps', `solo con la pregunta sorpresa positiva y ningún parámetro la aplicación da "${r.t}"`);
      res.soloPreguntaSorpresa = r.t;
    }
    for (const i of params) {
      // Con PS+ y un solo parámetro: positivo en cualquier lectura de la fuente
      const a = cero.slice(); a[i] = si(its[i]); if (iPS >= 0) a[iPS] = si(its[iPS]);
      const r = ver(a);
      if (!positivo(r)) fallo(id, 'param' + (i + 1), `con pregunta sorpresa positiva y "${its[i].q}" la aplicación da "${r.t}" y debería ser NECPAL positivo`);
      // Sin PS+: la fuente no lo resuelve; se informa
      const b = cero.slice(); b[i] = si(its[i]);
      const rb = ver(b); (sinPS[rb.t] = sinPS[rb.t] || []).push(i + 1);
    }
    aviso(id, 'sin-ps', `el formulario 3.1 registra la pregunta sorpresa y los parámetros por separado sin decir si la primera es condición; con parámetros pero sin pregunta sorpresa positiva la aplicación da ${Object.entries(sinPS).map(([t, l]) => `"${t}" (ítems ${l.join(', ')})`).join('; ')}, como en la versión 3.0 y en los estudios que aplican el instrumento`);
    const todos = cero.map((_, i) => si(its[i])), rt = ver(todos);
    if (!positivo(rt)) fallo(id, 'todos', `con todos los parámetros la aplicación da "${rt.t}"`);
    res.veredictos = { ninguno: r0.t, todos: rt.t };
    // Umbrales del formulario 3.1 en el texto de cada ítem
    const textos = its.map(it => norm(it.q + ' ' + (it.hint || '') + ' ' + it.o.map(o => o.l).join(' ')));
    const buscar = [['nutricional', /10\s*%/], ['funcional', /30\s*%/], ['funcional', /2 abvd|dos abvd|2 actividades|mas de 2/], ['cognitivo', /5 puntos|5 o mas/],
      ['cognitivo', /pfeif+er/], ['dependencia', /karnofsky[^.]*50|50[^.]*karnofsky/], ['dependencia', /barthel[^.]*20|20[^.]*barthel/],
      ['sindromes', /2 o mas|dos o mas/], ['sintomas', /2 o mas|dos o mas/], ['distres|emocional', /dme|9/], ['multimorbilidad', /2|dos/], ['recursos', /2|dos/]];
    const faltan = [];
    for (const [donde, re] of buscar) {
      const i = textos.findIndex(t => new RegExp(donde).test(t.slice(0, 60)));
      if (i < 0 || !re.test(textos[i])) faltan.push(`${donde} (${re.source})`);
    }
    if (faltan.length) aviso(id, 'umbrales', `no encontré en el texto de la aplicación estos umbrales del formulario 3.1: ${faltan.join('; ')}`);
  }

  // Lista prequirúrgica ACS NSQIP/AGS: dominios de la guía y regla de la aplicación
  if (A.preopger) {
    const id = 'preopger', s = SCALES[id], M = A[id], res = out.escalas[id] = { tipo: 'algoritmica', fuente: M.cita };
    const its = s.items || [], textos = its.map(it => norm(it.q + ' ' + (it.hint || '') + ' ' + (it.o || []).map(o => o.l).join(' ')));
    const todo = textos.join(' | ');
    const ausentes = M.dominios.filter(d => !new RegExp(d).test(todo));
    if (ausentes.length) aviso(id, 'dominios', `la guía incluye dominios que no encontré en la lista de la aplicación: ${ausentes.join(', ')}`);
    const nutri = textos.find(t => /nutrici/.test(t.slice(0, 40))) || '';
    const umbr = [['IMC 18,5', /18[,.]5/], ['albúmina 3,0', /3[,.]0/], ['pérdida de peso 10 a 15 %', /10[^%]*15\s*%|10\s*%/]].filter(([, re]) => !re.test(nutri)).map(([n]) => n);
    if (umbr.length) aviso(id, 'nutricion', `en el ítem de estado nutricional no aparecen los umbrales de la guía: ${umbr.join(', ')}`);
    const ver = a => { try { return (s.logic(a) || {}).t; } catch (e) { return 'ERROR: ' + e.message; } };
    // Resumen de la aplicación: cada ítem solo, y todos menos cada uno
    const iCap = its.findIndex(it => /capacidad/.test(norm(it.q)));
    const solos = {};
    its.forEach((_, i) => { const t = ver(its.map((_, j) => j === i ? 1 : 0)); (solos[t] = solos[t] || []).push(i + 1); });
    const sinCap = its.map((_, i) => i === iCap ? 0 : 1);
    res.veredictos = [`ninguno: ${ver(its.map(() => 0))}`, ...Object.entries(solos).map(([t, l]) => `solo el ítem ${l.join(', ')}: ${t}`),
      `todos menos capacidad: ${ver(sinCap)}`, `todos: ${ver(its.map(() => 1))}`];
    aviso(id, 'regla', `la guía es una lista de verificación sin puntaje ni clasificación global; la aplicación resume así: ${res.veredictos.join(' | ')}`);
  }
  return out;
}, fuente);
await browser.close();

// Separar lo pendiente de lo ya decidido por el autor
// Lo que el autor decidió mantener deja de marcarse; lo que decidió corregir
// en una versión futura se informa aparte y no hace fallar la prueba.
const decisiones = fuente.decisiones || {}, porCorregir = fuente.porCorregir || {};
const pendientes = r.hallazgos.filter(h => !decisiones[h.clave] && !porCorregir[h.clave]);
const decididos = r.hallazgos.filter(h => decisiones[h.clave]).map(h => ({ ...h, decision: decisiones[h.clave] }));
const aCorregir = r.hallazgos.filter(h => porCorregir[h.clave]).map(h => ({ ...h, correccion: porCorregir[h.clave] }));
const sobrantes = [...Object.keys(decisiones), ...Object.keys(porCorregir)].filter(k => !r.hallazgos.some(h => h.clave === k));
const fallos = pendientes.filter(h => h.tipo === 'fallo');
const avisos = pendientes.filter(h => h.tipo === 'aviso');

const res = {
  archivo: file.split('/').pop(), sha256, version: r.version, fecha: new Date().toISOString(),
  escalasRevisadas: Object.keys(r.escalas).length,
  fuentes: rutas, escalasPendientes: fuente.pendientes,
  totalFallos: fallos.length, totalAvisos: avisos.length, totalDecididos: decididos.length, totalPorCorregir: aCorregir.length,
  fallos, avisos, porCorregir: aCorregir, decididos,
  decisionesSinHallazgo: sobrantes,
  escalas: r.escalas, erroresJS: jsErrors,
  aprobado: fallos.length === 0 && jsErrors.length === 0
};
console.log(JSON.stringify(res, null, 2));
process.exit(res.aprobado ? 0 : 1);
