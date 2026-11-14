// Prueba de la función Trayectoria (desde la 2.15.0).
// Uso, desde la raíz del repositorio:
//   node verificacion/verificar-trayectoria.mjs index.html > resultado-trayectoria.json
//
// Comprueba, sin acceso a red:
//  1) clasificación hospitalaria del Barthel actividad por actividad (basal
//     premórbido, ingreso y alta) en los casos límite: sin pérdida, recuperación
//     completa, recuperación parcial por actividad y por puntos (3 en la escala
//     de 0 a 20), sin recuperación con 10 puntos, pérdida durante la estancia,
//     pérdida adicional sobre una dependencia previa, y caso incompleto;
//  2) umbrales de cambio por escala, en el borde exacto de cada uno, incluido
//     el criterio del Barthel ambulatorio (5 puntos de relevancia mínima y 10
//     o más significativo) y el Zarit sin umbral validado;
//  3) aviso de cruce de los puntos de corte, leído de la propia interpretación;
//  4) recorrido: una escala llevada desde su resultado a la Trayectoria, los
//     dos modos dibujados, el texto para la historia clínica, y ningún dato
//     escrito en el almacenamiento del dispositivo;
//  5) carga sin errores de JavaScript.
// Termina con código 0 si todo se supera y con 1 si hay fallos.
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const archivo = resolve(process.argv[2] || 'index.html');
const html = readFileSync(archivo, 'utf8');
const out = {
  archivo: 'index.html',
  sha256: createHash('sha256').update(html).digest('hex'),
  version: (html.match(/"softwareVersion":\s*"([^"]+)"/) || [])[1] || null,
  fecha: new Date().toISOString(),
  casos: 0, fallos: [], erroresJS: []
};

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await (await browser.newContext({ viewport: { width: 390, height: 900 } })).newPage();
page.on('pageerror', e => out.erroresJS.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/net::|Failed to load resource/.test(m.text())) out.erroresJS.push(m.text()); });
await page.route(u => !u.toString().startsWith('file:'), r => r.abort());
await page.goto('file://' + archivo);

const r = await page.evaluate(() => {
  const res = [];
  const ok = (nombre, obtenido, esperado) => res.push({ nombre, obtenido, esperado, ok: JSON.stringify(obtenido) === JSON.stringify(esperado) });
  const max = SCALES.barthel.items.map((_, i) => barMax(i));
  const cp = a => a.slice();
  const H = (bas, ing, alt) => ({ bar: { bas, ing, alt } });
  const cat = h => { const x = trayClasificar(h); return x ? x.cat : null; };

  ok('Barthel: diez actividades en el orden esperado', SCALES.barthel.items.map(i => i.q),
     ['Alimentación','Lavado (baño)','Vestido','Aseo personal','Deposición','Micción','Uso del sanitario','Traslado sillón - cama','Deambulación','Escalones']);
  ok('Barthel: máximos por actividad', max, [10,5,10,5,10,10,10,15,15,10]);

  ok('Sin pérdida', cat(H(cp(max), cp(max), cp(max))), 'Sin pérdida');
  const ing = cp(max); ing[1] = 0; ing[9] = 0;
  ok('Recuperación completa', cat(H(cp(max), ing, cp(max))), 'Pérdida con recuperación completa');
  const altP = cp(max); altP[9] = 0;
  ok('Recuperación parcial por actividad', cat(H(cp(max), ing, altP)), 'Pérdida con recuperación parcial');
  ok('Sin recuperación (alta igual al ingreso)', cat(H(cp(max), ing, cp(ing))), 'Pérdida sin recuperación');
  const ing5 = cp(max); ing5[7] = 0; ing5[8] = 0;
  const alt15 = cp(max); alt15[7] = 10; alt15[8] = 5;
  ok('Recuperación parcial por puntos (sube 15, es decir 3 en 0-20)', cat(H(cp(max), ing5, alt15)), 'Pérdida con recuperación parcial');
  const alt10 = cp(max); alt10[7] = 5; alt10[8] = 5;
  ok('Sin recuperación cuando sube solo 10 (2 en 0-20)', cat(H(cp(max), ing5, alt10)), 'Pérdida sin recuperación');
  const altE = cp(max); altE[2] = 5;
  ok('Pérdida durante la estancia', cat(H(cp(max), cp(max), altE)), 'Pérdida durante la estancia');
  const bas9 = cp(max); bas9[8] = 10; const ing9 = cp(bas9); ing9[8] = 5;
  ok('Pérdida adicional sobre dependencia previa', cat(H(bas9, ing9, cp(ing9))), 'Pérdida sin recuperación');
  const altM = cp(max); altM[9] = 0; altM[3] = 0;
  const m = trayClasificar(H(cp(max), ing, altM));
  ok('Caso mixto: parcial con actividad nueva perdida', [m.cat, m.nuevas], ['Pérdida con recuperación parcial', ['Aseo personal']]);
  ok('Caso incompleto no se clasifica', trayClasificar(H(cp(max), [], cp(max))), null);

  const v = (id, a, b, ctx) => trayVeredicto(id, a, b, ctx).t;
  ok('Barthel hospitalario: 15 puntos es relevante', v('barthel', 60, 75), 'Cambio relevante: mejora');
  ok('Barthel hospitalario: 10 puntos no alcanza', v('barthel', 60, 70), 'Cambio menor que el umbral; puede ser error de medida');
  ok('Barthel ambulatorio: 5 puntos, relevancia mínima', v('barthel', 95, 90, 'amb'), 'Cambio de relevancia mínima: empeora');
  ok('Barthel ambulatorio: 10 puntos, significativo', v('barthel', 90, 80, 'amb'), 'Cambio significativo: empeora');
  ok('Barthel ambulatorio: sin cambio', v('barthel', 90, 90, 'amb'), 'Sin cambio');
  ok('CFS: 1 nivel es relevante', v('cfs', 4, 5), 'Cambio relevante: empeora');
  ok('SPPB: 1 punto es relevante', v('sppb', 8, 9), 'Cambio relevante: mejora');
  ok('Lawton: 1 punto es relevante', v('lawton', 7, 6), 'Cambio relevante: empeora');
  ok('MNA-SF: 1 punto no alcanza', v('mna', 12, 11), 'Cambio menor que el umbral; puede ser error de medida');
  ok('MNA-SF: 2 puntos es relevante', v('mna', 12, 10), 'Cambio relevante: empeora');
  ok('GDS-15: 3 puntos no alcanza', v('yesavage', 3, 6), 'Cambio menor que el umbral; puede ser error de medida');
  ok('GDS-15: 4 puntos es relevante', v('yesavage', 3, 7), 'Cambio relevante: empeora');
  ok('MMSE: 2 puntos no alcanza', v('mmse', 26, 24), 'Cambio menor que el umbral; puede ser error de medida');
  ok('MMSE: 3 puntos es relevante', v('mmse', 26, 23), 'Cambio relevante: empeora');
  ok('Zarit: sin umbral validado', v('zarit', 40, 50), 'Empeora sin umbral validado de cambio');

  TRAY.amb.v.barthel = { a: '65', b: '55' };
  const c = trayAmbUna('barthel');
  ok('Cruce de punto de corte del Barthel', [c.ca, c.cb, c.corte], ['Dependencia leve', 'Dependencia moderada', 'corte en 60']);
  TRAY.amb.v.barthel = { a: '95', b: '90' };
  ok('Sin cruce dentro del mismo tramo', trayAmbUna('barthel').corte, '');
  TRAY = trayNuevo();
  return res;
});
for (const c of r) { out.casos++; if (!c.ok) out.fallos.push(`${c.nombre}: se obtuvo ${JSON.stringify(c.obtenido)} y se esperaba ${JSON.stringify(c.esperado)}`); }

// Recorrido: desde el resultado del Barthel hasta la Trayectoria
const antes = await page.evaluate(() => { try { return Object.keys(localStorage).filter(k => !/^eg_(favs|recientes|tsize)$/.test(k)); } catch (e) { return []; } });
await page.evaluate(() => openScale('barthel'));
for (const [i, val] of [10,5,10,5,10,10,10,15,15,10].entries()) await page.click(`[data-ans="${i}"][data-v="${val}"]`);
await page.click('[data-act="result"]');
await page.click('[data-act="trayllevar"]');
out.casos++;
if (!(await page.$('[data-slot="h-bas"]'))) out.fallos.push('Recorrido: no aparece la opción de ubicar el resultado como basal');
else {
  await page.click('[data-slot="h-bas"]');
  const tot = await page.evaluate(() => barTotal(TRAY.hosp.bar.bas));
  if (tot !== 100) out.fallos.push(`Recorrido: el basal llevado desde la ficha suma ${tot} y debía sumar 100`);
}
const ing = [5,0,5,5,10,10,5,5,10,0], alt = [10,5,10,5,10,10,10,10,10,0];
for (const [i, val] of ing.entries()) await page.selectOption(`select[data-tr="bar"][data-mom="ing"][data-i="${i}"]`, String(val));
for (const [i, val] of alt.entries()) await page.selectOption(`select[data-tr="bar"][data-mom="alt"][data-i="${i}"]`, String(val));
out.casos++;
const veredicto = await page.textContent('#trayres .verdict').catch(() => null);
if (veredicto !== 'Pérdida con recuperación parcial') out.fallos.push(`Recorrido hospitalario: el veredicto mostrado es ${JSON.stringify(veredicto)}`);
out.casos++;
if (!(await page.$('#trayres svg.tr-graf'))) out.fallos.push('Recorrido hospitalario: no se dibuja el gráfico de la trayectoria');
const texto = await page.evaluate(() => trayTexto());
out.casos++;
if (!/Trayectoria: Pérdida con recuperación parcial\./.test(texto) || !/basal 100, ingreso 55, alta 80/.test(texto))
  out.fallos.push('Texto hospitalario incompleto: ' + texto.slice(0, 200));
await page.click('[data-act="traymodo"][data-m="amb"]');
await page.fill('input[data-tr="amb"][data-id="lawton"][data-k="a"]', '7');
await page.fill('input[data-tr="amb"][data-id="lawton"][data-k="b"]', '5');
out.casos++;
const amb = await page.textContent('#tra-lawton').catch(() => '');
if (!/Cambio relevante: empeora/.test(amb) || !/Cruza un punto de corte/.test(amb)) out.fallos.push('Recorrido ambulatorio: el Lawton 7 a 5 no muestra el veredicto ni el cruce de corte');
const despues = await page.evaluate(() => { try { return Object.keys(localStorage).filter(k => !/^eg_(favs|recientes|tsize)$/.test(k)); } catch (e) { return []; } });
out.casos++;
if (despues.length > antes.length) out.fallos.push('Privacidad: la Trayectoria escribió en el almacenamiento del dispositivo: ' + despues.join(', '));

out.casos++;
if (out.erroresJS.length) out.fallos.push('Errores de JavaScript: ' + out.erroresJS.slice(0, 5).join(' | '));
await browser.close();
out.aprobado = out.fallos.length === 0;
console.log(JSON.stringify(out, null, 2));
process.exit(out.aprobado ? 0 : 1);
