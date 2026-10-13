// Prueba de integridad y de regresiones de VGI Digital (desde la 2.13.4).
// Uso, desde la raíz del repositorio:
//   node verificacion/verificar-integridad.mjs > resultado-integridad.json
//
// Las otras tres pruebas (escalas, CDR y fuentes) miran si la aplicación
// calcula bien. Esta mira lo que ninguna de ellas podía ver, y que causó
// incidentes reales en el desarrollo:
//  1) versión: el número de versión coincide en todos los archivos que lo
//     declaran (README y CITATION.cff se quedaron atrás en la 2.10.4);
//  2) archivos: todo lo que la página, el service worker y el manifest
//     piden existe (en la 2.10 el manifest y los iconos daban 404), y las
//     sumas de SHA256SUMS.txt coinciden con los archivos;
//  3) protegidos: LICENSE y NOTICE.md coinciden con su huella aprobada en
//     huellas-protegidas.json (la 2.10.4, "solo visual", los degradó);
//  4) inventario: las fichas de SCALES, las que muestra la lista (ALL_IDS) y
//     las de trazabilidad-instrumentos.csv son exactamente las mismas (en la
//     2.9 el 4AT desapareció de la versión publicada sin que nada fallara);
//  5) referencias: cada escala lleva su referencia bibliográfica;
//  6) regresiones: comprobaciones concretas de incidentes y decisiones ya
//     tomadas (clave de la GDS-15, versión 3.1 del NECPAL, 4AT completo,
//     factores del conversor sin cambios y sin meperidina, historial).
//
// Si un cambio intencional altera LICENSE, NOTICE.md o un factor del
// conversor, la huella se actualiza en el mismo cambio y se explica en el
// CHANGELOG. Así el cambio queda como decisión explícita y no como accidente.
// El proceso termina con código 0 si todo se supera y con 1 si hay fallos.
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const raiz = resolve(process.argv[2] || '.');
const leer = f => readFileSync(join(raiz, f), 'utf8');
const sha = f => createHash('sha256').update(readFileSync(join(raiz, f))).digest('hex');
const fallos = { version: [], archivos: [], protegidos: [], inventario: [], referencias: [], regresiones: [] };
const out = { raiz: 'repositorio', fecha: new Date().toISOString(), version: null, versiones: {}, fichas: null, fallos };

// ---------- 1) Versión coherente en todos los archivos ----------
const html = leer('index.html');
const buscar = (txt, re) => { const m = txt.match(re); return m ? m[1] : null; };
const v = out.versiones = {
  'index.html (softwareVersion)': buscar(html, /"softwareVersion":\s*"([^"]+)"/),
  'index.html (historial de Acerca de)': buscar(html, /class="cite"><strong>([\d.]+)<\/strong>/),
  'VERSION.txt': buscar(leer('VERSION.txt'), /VGI Digital\s+([\d.]+)/),
  'sw.js (CACHE)': buscar(leer('sw.js'), /CACHE\s*=\s*'[^']*?v([\d.]+)'/),
  'CITATION.cff': buscar(leer('CITATION.cff'), /^version:\s*"?([\d.]+)"?/m),
  'CHANGELOG.md': buscar(leer('CHANGELOG.md'), /^##\s+([\d.]+)/m),
  'README.md': buscar(leer('README.md'), /\*\*Versión\s+([\d.]+)\*\*/)
};
out.version = v['index.html (softwareVersion)'];
for (const [donde, ver] of Object.entries(v))
  if (ver !== out.version) fallos.version.push(`${donde}: declara ${ver ?? 'nada'} y index.html declara ${out.version}`);
const fechas = {
  'index.html (dateModified)': buscar(html, /"dateModified":\s*"([^"]+)"/),
  'CITATION.cff (date-released)': buscar(leer('CITATION.cff'), /^date-released:\s*"?([\d-]+)"?/m),
  'VERSION.txt': buscar(leer('VERSION.txt'), /(\d{4}-\d{2}-\d{2})/)
};
out.fechas = fechas;
const f0 = fechas['index.html (dateModified)'];
for (const [donde, f] of Object.entries(fechas))
  if (f !== f0) fallos.version.push(`${donde}: fecha ${f ?? 'ausente'} y index.html dice ${f0}`);

// ---------- 2) Archivos pedidos existen y las sumas coinciden ----------
const pedidos = new Set();
for (const m of html.matchAll(/(?:href|src)="([^"#:?']+\.(?:css|js|png|json|svg|ico|webp))"/g)) pedidos.add(m[1]);
const sw = leer('sw.js');
const precarga = buscar(sw, /PRECARGA\s*=\s*\[([\s\S]*?)\]/) || '';
for (const m of precarga.matchAll(/'\.\/([^']*)'/g)) if (m[1]) pedidos.add(m[1]);
for (const ic of JSON.parse(leer('manifest.json')).icons || []) pedidos.add(ic.src);
out.archivosPedidos = [...pedidos].sort();
for (const f of pedidos) if (!existsSync(join(raiz, f))) fallos.archivos.push(`${f}: lo pide la aplicación y no existe`);
if (existsSync(join(raiz, 'SHA256SUMS.txt'))) {
  const lineas = leer('SHA256SUMS.txt').split('\n').map(l => l.trim()).filter(Boolean);
  out.sumasRevisadas = lineas.length;
  for (const l of lineas) {
    const [suma, ...resto] = l.split(/\s+/); const f = resto.join(' ').replace(/^\*/, '');
    if (!existsSync(join(raiz, f))) fallos.archivos.push(`SHA256SUMS.txt: ${f} no existe`);
    else if (sha(f) !== suma) fallos.archivos.push(`SHA256SUMS.txt: ${f} no coincide con su suma (¿se olvidó regenerar las sumas?)`);
  }
} else fallos.archivos.push('SHA256SUMS.txt no existe');

// ---------- 3) Archivos protegidos ----------
const huellas = JSON.parse(leer('verificacion/huellas-protegidas.json'));
for (const [f, suma] of Object.entries(huellas.archivos)) {
  if (!existsSync(join(raiz, f))) fallos.protegidos.push(`${f}: no existe`);
  else if (sha(f) !== suma) fallos.protegidos.push(`${f}: cambió respecto de la huella aprobada. Si el cambio es intencional, actualice verificacion/huellas-protegidas.json en el mismo cambio y explíquelo en el CHANGELOG`);
}

// ---------- 4 a 6) Lo que requiere abrir la aplicación ----------
const csv = leer('trazabilidad-instrumentos.csv').replace(/^﻿/, '');
const idsCSV = csv.split('\n').slice(1).map(l => (l.match(/^\d+,([a-z0-9_]+),/) || [])[1]).filter(Boolean);

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();
const jsErrors = [];
page.on('pageerror', e => jsErrors.push(e.message));
await page.route(u => !u.toString().startsWith('file:'), r => r.abort()); // sin red
await page.goto('file://' + join(raiz, 'index.html'));
await page.waitForTimeout(1000);
const app = await page.evaluate(() => ({
  ids: Object.keys(SCALES),
  lista: ALL_IDS,
  sinRef: Object.entries(SCALES).filter(([, s]) => !s.tool && !(typeof s.ref === 'string' && s.ref.trim().length > 20)).map(([id]) => id),
  yesavage: SCALES.yesavage ? SCALES.yesavage.items.map(it => (it.o.find(o => o.v === 1) || {}).l) : null,
  necpal: SCALES.necpal ? SCALES.necpal.full : null,
  at4: SCALES.at4 ? { items: SCALES.at4.items.length, max: SCALES.at4.max, ref: SCALES.at4.ref || '' } : null,
  opioides: OPIOIDES.map(o => ({ id: o.id, n: o.n, f: o.f }))
}));
await browser.close();
out.fichas = app.ids.length;

// 4) Inventario
const dif = (a, b) => a.filter(x => !b.includes(x));
for (const id of dif(app.ids, app.lista)) fallos.inventario.push(`${id}: está en SCALES pero no aparece en la lista de la aplicación`);
for (const id of dif(app.lista, app.ids)) fallos.inventario.push(`${id}: aparece en la lista pero no está definida en SCALES`);
for (const id of dif(app.ids, idsCSV)) fallos.inventario.push(`${id}: está en la aplicación pero no en trazabilidad-instrumentos.csv`);
for (const id of dif(idsCSV, app.ids)) fallos.inventario.push(`${id}: está en trazabilidad-instrumentos.csv pero falta en la aplicación`);
if (huellas.fichasEsperadas && app.ids.length !== huellas.fichasEsperadas)
  fallos.inventario.push(`la aplicación tiene ${app.ids.length} fichas y la huella espera ${huellas.fichasEsperadas}`);

// 5) Referencias
for (const id of app.sinRef) fallos.referencias.push(`${id}: sin referencia bibliográfica`);

// 6) Regresiones
const reg = out.regresiones = [];
const caso = (nombre, ok, detalle) => { reg.push({ nombre, ok }); if (!ok) fallos.regresiones.push(`${nombre}: ${detalle}`); };
// Incidente 1: al extraer la GDS-15 se perdió la negrita que marca la respuesta
// que puntúa. Clave publicada (Sheikh y Yesavage, 1986): puntúa "No" en las
// preguntas 1, 5, 7, 11 y 13, y "Sí" en las demás.
const claveNo = [1, 5, 7, 11, 13];
caso('GDS-15: clave de respuestas',
  !!app.yesavage && app.yesavage.length === 15 && app.yesavage.every((l, i) => l === (claveNo.includes(i + 1) ? 'No' : 'Sí')),
  `la clave de la aplicación es ${JSON.stringify(app.yesavage)}`);
// Incidente 3: el NECPAL se implementó sobre la descripción de 2013.
caso('NECPAL: versión 3.1', !!app.necpal && /3\.1/.test(app.necpal), `el nombre completo dice "${app.necpal}"`);
// Incidente 5: el 4AT se perdió al divergir dos ramas.
caso('4AT: presente y completo', !!app.at4 && app.at4.items === 4 && app.at4.max === 12 && /Bellelli/.test(app.at4.ref),
  `4AT = ${JSON.stringify(app.at4)}`);
// Decisión del 8-oct-2026: factores del nomograma y del taller, sin meperidina.
const actuales = Object.fromEntries(app.opioides.map(o => [o.id, o.f]));
const cambios = [...new Set([...Object.keys(actuales), ...Object.keys(huellas.conversor)])]
  .filter(id => actuales[id] !== huellas.conversor[id]).map(id => `${id}: ${huellas.conversor[id] ?? 'ausente'} a ${actuales[id] ?? 'ausente'}`);
caso('Conversor: factores aprobados', cambios.length === 0, cambios.join('; '));
caso('Conversor: sin meperidina', !app.opioides.some(o => /meperid|petid/i.test(o.id + ' ' + o.n)), 'la meperidina volvió al conversor');
// Incidente 4 y recorrido: sin errores de JavaScript al cargar.
caso('Carga sin errores de JavaScript', jsErrors.length === 0, jsErrors.join(' | '));

out.totalFallos = Object.values(fallos).reduce((a, l) => a + l.length, 0);
out.aprobado = out.totalFallos === 0;
console.log(JSON.stringify(out, null, 2));
process.exit(out.aprobado ? 0 : 1);
