// Ejecuta las cuatro pruebas de VGI Digital y resume el resultado.
// Uso, desde la raíz del repositorio:  npm test
// (equivale a: node verificacion/verificar-todo.mjs [carpeta-de-resultados])
//
// Cada prueba escribe su salida completa en la carpeta de resultados
// (por defecto, resultados/). El resumen se imprime en la consola y, cuando
// corre en GitHub Actions, también en la página del resultado. Termina con
// código 1 si alguna prueba falla, lo que impide fusionar el cambio cuando
// la rama main está protegida.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(process.argv[2] || 'resultados');
mkdirSync(dir, { recursive: true });

const pruebas = [
  { nombre: 'Escalas (estructura, interpretación, recorrido y tramos)', script: 'verificar-escalas.mjs',
    args: ['index.html', 'trazabilidad-instrumentos.csv'], salida: 'resultado-escalas.json' },
  { nombre: 'CDR contra las reglas de Washington University', script: 'verificar-cdr.mjs',
    args: ['index.html'], salida: 'resultado-cdr.json' },
  { nombre: 'Fuentes primarias (VES-13, PPI, PPS y conversor)', script: 'verificar-fuentes.mjs',
    args: ['index.html'], salida: 'resultado-fuentes.json' },
  { nombre: 'Integridad y regresiones', script: 'verificar-integridad.mjs',
    args: ['.'], salida: 'resultado-integridad.json' }
];

const filas = [];
for (const p of pruebas) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [join('verificacion', p.script), ...p.args], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  writeFileSync(join(dir, p.salida), r.stdout || '');
  let detalle = '';
  try {
    const j = JSON.parse(r.stdout);
    if (j.fallos && !Array.isArray(j.fallos))
      detalle = Object.entries(j.fallos).flatMap(([k, l]) => l.map(x => `[${k}] ${x}`)).slice(0, 15).join('\n');
    else if (typeof j.totalDiscrepancias === 'number') detalle = j.totalDiscrepancias ? `${j.totalDiscrepancias} discrepancias` : '';
    else if (typeof j.numDiscrepancias === 'number') detalle = j.numDiscrepancias ? `${j.numDiscrepancias} discrepancias` : '';
    if (Array.isArray(j.erroresJS) && j.erroresJS.length) detalle += `\nErrores de JavaScript: ${j.erroresJS.slice(0, 5).join(' | ')}`;
  } catch { detalle = (r.stderr || 'La prueba no produjo un resultado legible').trim().split('\n').slice(-8).join('\n'); }
  filas.push({ ...p, ok: r.status === 0, segundos: ((Date.now() - t0) / 1000).toFixed(1), detalle: detalle.trim() });
}

let version = '?';
try { version = (readFileSync('index.html', 'utf8').match(/"softwareVersion":\s*"([^"]+)"/) || [])[1]; } catch {}
const todas = filas.every(f => f.ok);
const lineas = [`VGI Digital ${version}: ${todas ? 'TODAS LAS PRUEBAS SUPERADAS' : 'HAY PRUEBAS QUE FALLAN'}`, ''];
for (const f of filas) {
  lineas.push(`${f.ok ? 'SUPERADA' : 'FALLA   '}  ${f.nombre} (${f.segundos} s)`);
  if (!f.ok && f.detalle) lineas.push(...f.detalle.split('\n').map(l => '            ' + l));
}
lineas.push('', `Resultados completos en ${dir}`);
console.log(lineas.join('\n'));

if (process.env.GITHUB_STEP_SUMMARY) {
  const md = [`## VGI Digital ${version}: ${todas ? 'todas las pruebas superadas' : 'hay pruebas que fallan'}`, '',
    '| Prueba | Resultado | Tiempo |', '|---|---|---|',
    ...filas.map(f => `| ${f.nombre} | ${f.ok ? 'Superada' : '**Falla**'} | ${f.segundos} s |`), ''];
  for (const f of filas.filter(f => !f.ok && f.detalle)) md.push(`### ${f.nombre}`, '', '```', f.detalle, '```', '');
  md.push('Las salidas completas están en el archivo "resultados-verificacion" de esta ejecución.');
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, md.join('\n') + '\n');
}
process.exit(todas ? 0 : 1);
