// Verificación del puntaje global del CDR (añadida en la 2.12.3).
// Uso: npm install playwright && node verificar-cdr.mjs ../index.html > resultado-cdr.json
// Compara la lógica de la aplicación con una transcripción independiente de
// las reglas de Washington University (Knight ADRC, "CDR Scoring Rules") en
// todas las combinaciones posibles de las seis áreas, con las opciones que
// ofrece la aplicación en cada una (desde la 2.13.1 el cuidado personal no
// tiene 0,5: 5^5 x 4 = 12.500 combinaciones), y comprueba además unos casos
// fijos tomados de esas reglas.
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
  // Transcripción de las reglas, escrita aparte de la lógica de la aplicación.
  function referencia(a) {
    const M = a[0], sec = a.slice(1);
    // Regla especial: memoria 0.
    if (M === 0) return sec.filter(x => x >= 0.5).length >= 2 ? 0.5 : 0;
    // Regla especial: memoria 0,5 (nunca 0).
    if (M === 0.5) return sec.filter(x => x >= 1).length >= 3 ? 1 : 0.5;
    // Memoria 1 o más: 0,5 si la mayoría de las secundarias están en 0.
    if (sec.filter(x => x === 0).length >= 3) return 0.5;
    const eq = sec.filter(x => x === M).length;
    const up = sec.filter(x => x > M), dn = sec.filter(x => x < M);
    const mayoria = arr => {
      const c = {}; arr.forEach(x => { c[x] = (c[x] || 0) + 1; });
      const mx = Math.max(...Object.values(c));
      return Number(Object.keys(c).filter(k => c[k] === mx)
        .sort((x, y) => Math.abs(x - M) - Math.abs(y - M))[0]);
    };
    let cdr = M;
    if (eq >= 3) cdr = M;
    else if ((up.length >= 3 && dn.length >= 2) || (dn.length >= 3 && up.length >= 2)) cdr = M;
    else if (up.length >= 3) cdr = mayoria(up);
    else if (dn.length >= 3) cdr = mayoria(dn);
    if (cdr === 0) cdr = 0.5; // con memoria 1 o más el CDR no puede ser 0
    return cdr;
  }
  const s = SCALES.cdr;
  const valor = res => parseFloat(String(res.display).replace(',', '.'));
  const opciones = s.items.map(it => it.o.map(o => o.v));
  const out = { version: null, combinaciones: 0, discrepancias: [], casos: [] };
  const m = document.documentElement.innerHTML.match(/"softwareVersion":\s*"([^"]+)"/);
  out.version = m ? m[1] : null;
  out.cuidadoPersonalSinCeroCinco = !opciones[5].includes(0.5);
  const recorrer = (i, a) => {
    if (i === 6) {
      out.combinaciones++;
      const app = valor(s.logic(a)), ref = referencia(a);
      if (app !== ref) out.discrepancias.push({ areas: a.join(' '), app, ref });
      return;
    }
    for (const v of opciones[i]) recorrer(i + 1, [...a, v]);
  };
  recorrer(0, []);
  // Casos fijos (memoria primero, luego orientación, juicio, comunidad, hogar y cuidado personal).
  const fijos = [
    { areas: [3, 3, 2, 2, 1, 1], esperado: 2, regla: 'empate en un lado: el puntaje más cercano a la memoria' },
    { areas: [0.5, 0, 0, 0, 0, 0], esperado: 0.5, regla: 'memoria 0,5: nunca 0' },
    { areas: [0.5, 1, 1, 1, 0.5, 0], esperado: 1, regla: 'memoria 0,5 con tres áreas en 1 o más' },
    { areas: [0, 0.5, 0.5, 0, 0, 0], esperado: 0.5, regla: 'memoria 0 con dos áreas alteradas' },
    { areas: [0, 0.5, 0, 0, 0, 0], esperado: 0, regla: 'memoria 0 con una sola área alterada' },
    { areas: [1, 0, 0, 0, 0.5, 0], esperado: 0.5, regla: 'memoria 1 o más: nunca 0' },
    { areas: [1, 2, 2, 2, 0.5, 0], esperado: 1, regla: 'reparto tres y dos a cada lado' },
    { areas: [1, 2, 2, 2, 1, 0], esperado: 2, regla: 'tres o más por encima de la memoria' },
    { areas: [2, 2, 1, 3, 1, 3], esperado: 2, regla: 'una o dos iguales y no más de dos a cada lado' }
  ];
  for (const c of fijos) {
    const app = valor(s.logic(c.areas));
    out.casos.push({ ...c, areas: c.areas.join(' '), app, ok: app === c.esperado });
  }
  return out;
});

const salida = {
  archivo: file.split('/').pop(), sha256, fecha: new Date().toISOString().slice(0, 10),
  ...r, numDiscrepancias: r.discrepancias.length, erroresJS: jsErrors
};
salida.discrepancias = salida.discrepancias.slice(0, 50);
console.log(JSON.stringify(salida, null, 2));
await browser.close();
process.exit(r.discrepancias.length || r.casos.some(c => !c.ok) || !r.cuidadoPersonalSinCeroCinco || jsErrors.length ? 1 : 0);
