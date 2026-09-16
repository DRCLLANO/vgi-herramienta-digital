// Verificación reproducible del contenido de VGI Digital.
// Uso: npm install playwright && node verificar-escalas.mjs ../index.html [../trazabilidad-instrumentos.csv] > resultado.json
// Si se indica la tabla de trazabilidad, se comprueba además que los tramos
// derivados de cada escala coinciden con los registrados (control de versiones).
// Ejecuta las tres pruebas descritas en el manuscrito sobre el archivo indicado:
//  1) estructural: cada instrumento tiene eje y, si es sumativo, su máximo
//     declarado coincide con la suma de los máximos de sus ítems;
//  2) interpretación: todo puntaje posible del rango produce un veredicto;
//  3) recorrido: cada instrumento se abre, se responde, muestra su resultado,
//     se incorpora al resumen por esferas y el resumen se dibuja sin errores.
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

function leerCSV(txt) {
  const filas = []; let f = [], c = '', q = false;
  txt = txt.replace(/^\uFEFF/, '');
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) { if (ch === '"') { if (txt[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { f.push(c); c = ''; }
    else if (ch === '\n') { f.push(c.replace(/\r$/, '')); filas.push(f); f = []; c = ''; }
    else c += ch;
  }
  if (c || f.length) { f.push(c); filas.push(f); }
  const [cab, ...resto] = filas;
  return resto.filter(r => r.length === cab.length).map(r => Object.fromEntries(cab.map((k, i) => [k, r[i]])));
}
import { resolve } from 'node:path';

const file = resolve(process.argv[2] || 'index.html');
const sha256 = createHash('sha256').update(readFileSync(file)).digest('hex');
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();
const jsErrors = [];
page.on('pageerror', e => jsErrors.push(e.message));
await page.route(u => !u.toString().startsWith('file:'), r => r.abort()); // sin red: todo se calcula localmente
await page.goto('file://' + file);
await page.waitForTimeout(1000);

const referencia = process.argv[3] ? leerCSV(readFileSync(resolve(process.argv[3]), 'utf8')) : null;
const r = await page.evaluate((referencia) => {
  const EJES = ['clinico', 'funcional', 'mental', 'social', 'paliativo'];
  const out = { version: null, fichas: 0, escalas: 0, conversor: [], porEje: {}, sumativas: [], algoritmicas: [],
    complementarios: [], items: 0, opciones: 0, umbrales: 0,
    fallos: { estructural: [], interpretacion: [], recorrido: [], tramos: [] } };
  const ref = referencia ? Object.fromEntries(referencia.map(x => [x.id, x.bandas])) : null;
  const m = document.documentElement.innerHTML.match(/"softwareVersion":\s*"([^"]+)"/);
  out.version = m ? m[1] : null;
  const maxItem = it => {
    if (it.type === 'multi') return it.score === 'threshold' ? 1 : (it.chips || []).length;
    const vs = (it.o || []).map(x => x.v).filter(v => typeof v === 'number');
    return vs.length ? Math.max(...vs) : 0;
  };
  for (const [id, s] of Object.entries(SCALES)) {
    out.fichas++;
    if (s.tool) out.conversor.push(id); else out.escalas++;
    out.porEje[s.eje] = (out.porEje[s.eje] || 0) + 1;
    if (!EJES.includes(s.eje)) out.fallos.estructural.push(id + ': sin eje válido');
    if (s.external) out.complementarios.push(id);
    const items = s.items || [];
    out.items += items.length;
    for (const it of items) out.opciones += (it.o || []).length + (it.chips || []).length;
    if (s.logic || !s.interpret) { if (!s.tool) out.algoritmicas.push(id); }
    else {
      out.sumativas.push(id);
      const esperado = items.every(it => ['multi', undefined].includes(it.type) || (it.o && it.o.length))
        ? items.reduce((a, it) => a + maxItem(it), 0) : null;
      if (esperado !== null && Math.abs(esperado - s.max) > 1e-9)
        out.fallos.estructural.push(`${id}: máximo declarado ${s.max}, suma de ítems ${esperado}`);
      const c = cortes(s);
      out.umbrales += c ? c.length - 1 : 0;
      if (ref) {
        const actual = c ? c.map(x => x.rango + ': ' + x.t).join(' | ') : '';
        if (!(id in ref)) out.fallos.tramos.push(`${id}: no figura en la tabla de trazabilidad`);
        else if (ref[id] !== actual) out.fallos.tramos.push(`${id}: tramos distintos de los registrados`);
      }
      const paso = Number.isInteger(s.max) ? 1 : 0.5;
      for (let v = 0; v <= s.max + 1e-9; v += paso) {
        const x = s.interpret(Math.round(v * 100) / 100);
        if (!x || !x.t) out.fallos.interpretacion.push(`${id}: sin veredicto para ${v}`);
      }
    }
  }
  // Recorrido completo
  for (const id of ALL_IDS) {
    const s = SCALES[id];
    try {
      openScale(id);
      if (!s.tool) {
        s.items.forEach((it, i) => { if (it.o && it.o.length) state.ans[i] = it.o[0].v; else if (state.ans[i] === undefined) state.ans[i] = 0; });
        state.showResult = true; render();
        vgiAdd();
      }
    } catch (e) { out.fallos.recorrido.push(`${id}: ${e.message}`); }
  }
  try { state = { ...state, view: 'vgi', id: null, q: '', dom: null, showResult: false }; render(); }
  catch (e) { out.fallos.recorrido.push('resumen por esferas: ' + e.message); }
  out.enResumen = Object.keys(VGI).length;
  out.comparadoConTrazabilidad = !!ref;
  return out;
}, referencia);
await browser.close();
const res = { archivo: file.split('/').pop(), sha256, fecha: new Date().toISOString(), ...r, erroresJS: jsErrors,
  aprobado: !jsErrors.length && !Object.values(r.fallos).some(f => f.length) };
console.log(JSON.stringify(res, null, 2));
process.exit(res.aprobado ? 0 : 1);
