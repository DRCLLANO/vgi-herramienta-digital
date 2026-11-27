// Prueba de la sección Vacunación del adulto mayor (desde la 2.18.0).
// Uso, desde la raíz del repositorio:
//   node verificacion/verificar-vacunacion.mjs index.html > resultado-vacunacion.json
//
// Comprueba, sin acceso a red:
//  1) los 20 casos de prueba con resultado esperado que el autor aprobó el
//     27-nov-2026 en el documento "VGI Digital: vacunación en el adulto mayor
//     (borrador de contenido)", contra el Consenso Colombiano de Vacunación en
//     el Adulto 2026 (ACMI, Partes 1 y 2) y sus decisiones clínicas;
//  2) casos de borde: puntos de corte de fragilidad (Fried 3, CFS 5 y 6),
//     dependencia (Barthel 60, 65 y 100), malnutrición (MNA-SF 7 y 8), edad
//     (59, 60, 74 y 75), la advertencia de no revacunar el VSR en cardiopatía,
//     y las reglas de precedencia;
//  3) el texto para la historia clínica (desde la 2.18.1): empieza por las
//     vacunas que el paciente tiene, sigue con las indicadas pendientes o sin
//     dato, las que pueden considerarse y las contraindicadas, sin rayas;
//  4) recorrido: el destino "Vacunas" en la barra (debajo de Resumen), la
//     búsqueda, que no quede como grupo del eje clínico, los datos tomados del
//     resumen de la VGI, el menú desplegable de vacunas indicadas, el registro
//     "La tiene / No la tiene", el bloque añadido al resumen, que no se
//     mencione el PAI, y ningún dato escrito en el almacenamiento del
//     dispositivo;
//  5) que las 48 fichas de escalas no cambian, y la carga sin errores.
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
  modulo: createHash('sha256').update(readFileSync(resolve(archivo, '..', 'vacunacion.js'))).digest('hex'),
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
await page.waitForTimeout(600);

const r = await page.evaluate(() => {
  const res = [];
  const ok = (nombre, obtenido, esperado) => res.push({ nombre, obtenido, esperado, ok: JSON.stringify(obtenido) === JSON.stringify(esperado) });
  const P = (edad, conds = [], extra = {}) => {
    const c = {}; conds.forEach(k => { c[k] = true; });
    return VACUNAS.evaluar({ edad: String(edad), c, fried: '', cfs: '', barthel: '', mnasf: '', neumo: 'ninguna', ...extra });
  };
  const F = (R, id) => R.filas.find(f => f.id === id);
  const refs = f => f.motivos.map(m => m.ref);
  const tiene = (lista, txt) => lista.some(x => x.includes(txt));

  // ---------- 1) Los 20 casos aprobados ----------
  ok('Caso 1: 68 años sin condiciones, VSR', F(P(68), 'vsr').cat, 'con');
  ok('Caso 2: 80 años sin condiciones, VSR', F(P(80), 'vsr').cat, 'rec');
  ok('Caso 2: 80 años, VSR por la af. 39', tiene(refs(F(P(80), 'vsr')), 'Parte 1, af. 39'), true);
  let x = F(P(68, ['pulmonar']), 'vsr');
  ok('Caso 3: 68 años con EPOC, VSR', [x.cat, tiene(refs(x), 'Parte 2, af. 6')], ['rec', true]);
  x = F(P(70, ['cardio']), 'vsr');
  ok('Caso 4: 70 años con insuficiencia cardíaca, VSR', [x.cat, tiene(refs(x), 'Parte 2, af. 16')], ['rec', true]);
  ok('Caso 5: 70 años con HTA aislada (no marca cardiopatía), VSR', F(P(70), 'vsr').cat, 'con');
  let R = P(72, ['neuro', 'neuroResp']);
  ok('Caso 6: demencia con disfagia, VSR', [F(R, 'vsr').cat, tiene(refs(F(R, 'vsr')), 'Parte 2, af. 42')], ['rec', true]);
  ok('Caso 6: demencia con disfagia, neumococo prioritario', tiene(refs(F(R, 'neumococo')), 'Parte 2, af. 44'), true);
  x = F(P(73, ['diabetes']), 'vsr');
  ok('Caso 7: diabetes sin factores del CDC, VSR', [x.cat, tiene(refs(x), 'af. 13'), tiene(x.notas, 'no se activa la indicación por diabetes')], ['con', false, true]);
  R = P(72, ['erc', 'ercTerminal']);
  ok('Caso 8: hemodiálisis, hepatitis B', [F(R, 'hepb').cat, tiene(F(R, 'hepb').esquema, 'dosis alta'), tiene(F(R, 'hepb').esquema, 'anti-HBs')], ['rec', true, true]);
  ok('Caso 8: hemodiálisis, VSR', [F(R, 'vsr').cat, tiene(refs(F(R, 'vsr')), 'Parte 2, af. 62')], ['con', true]);
  R = P(66, ['biologico']);
  ok('Caso 9: biológico, fiebre amarilla y dengue', [F(R, 'fa').cat, F(R, 'dengue').cat], ['contra', 'contra']);
  ok('Caso 9: biológico, zóster', [F(R, 'zoster').cat, tiene(F(R, 'zoster').esquema, 'intervalo mínimo de 4 semanas')], ['rec', true]);
  R = P(67, ['cancer', 'cancerInmuno'], { neumo: 'pcv15' });
  ok('Caso 10: quimioterapia con PCV15 previa, neumococo', tiene(F(R, 'neumococo').esquema, '8 semanas'), true);
  x = F(P(63, [], { neumo: 'pcv13ppsv23_60' }), 'neumococo');
  ok('Caso 11: PCV13 y PPSV23 a los 61 años, neumococo', [x.cat, tiene(x.esquema, '5 años'), tiene(x.esquema, 'decisión compartida')], ['con', true, true]);
  R = P(69, ['hogar']);
  ok('Caso 12: hogar geriátrico, VSR', [F(R, 'vsr').cat, tiene(F(R, 'vsr').motivos.map(m => m.t), 'hogar geriátrico')], ['con', true]);
  ok('Caso 12: hogar geriátrico, hepatitis A', [F(R, 'hepa').cat, tiene(refs(F(R, 'hepa')), 'Parte 1, af. 43')], ['con', true]);
  const pauta = 'al menos una dosis al año, preferiblemente dos separadas seis meses';
  ok('Caso 13: cáncer, COVID-19', (F(P(70, ['cancer']), 'covid').destacada || '').includes(pauta), true);
  ok('Caso 13: VIH, COVID-19', (F(P(70, ['vih']), 'covid').destacada || '').includes(pauta), true);
  ok('Caso 13: malnutrición (MNA-SF 6), COVID-19', (F(P(70, [], { mnasf: '6' }), 'covid').destacada || '').includes(pauta), true);
  ok('Caso 14: Parkinson con Barthel 55, VSR', F(P(72, ['neuro'], { barthel: '55' }), 'vsr').cat, 'rec');
  ok('Caso 15: Parkinson con Barthel 80, VSR', F(P(72, ['neuro'], { barthel: '80' }), 'vsr').cat, 'ind');
  ok('Caso 16: Parkinson con Barthel 60, VSR', F(P(72, ['neuro'], { barthel: '60' }), 'vsr').cat, 'rec');
  x = F(P(70, ['diabetes', 'diabetesRiesgo']), 'vsr');
  ok('Caso 17: diabetes con insulina, VSR', [x.cat, tiene(refs(x), 'Parte 2, af. 13')], ['con', true]);
  ok('Caso 18: MNA-SF 9 (riesgo de malnutrición), COVID-19 sin la pauta de dos dosis', F(P(68, [], { mnasf: '9' }), 'covid').destacada, undefined);
  x = F(P(70, ['diabetes', 'diabetesRiesgo', 'pulmonar']), 'vsr');
  ok('Caso 19: diabetes con insulina y EPOC, VSR con ambos motivos', [x.cat, tiene(refs(x), 'Parte 2, af. 6'), tiene(refs(x), 'Parte 2, af. 13')], ['rec', true, true]);
  ok('Caso 20: biológico en zona de fiebre amarilla', F(P(67, ['biologico', 'zonaFA']), 'fa').cat, 'contra');

  // ---------- 2) Bordes ----------
  ok('Edad 59: fuera del alcance', P(59).estado, 'menor');
  ok('Sin edad', VACUNAS.evaluar({ edad: '', c: {} }).estado, 'sinedad');
  ok('Edad 60 y 74: grupo de 60 a 74', [P(60).grupo, P(74).grupo], ['60 a 74 años', '60 a 74 años']);
  ok('Edad 75: grupo de 75 o más y VSR recomendada', [P(75).grupo, F(P(75), 'vsr').cat], ['75 años o más', 'rec']);
  ok('Fragilidad: Fried 2 no, Fried 3 sí', [VACUNAS.derivados({ fried: '2', c: {} }).fragil, VACUNAS.derivados({ fried: '3', c: {} }).fragil], [false, true]);
  ok('Fragilidad: CFS 5 no, CFS 6 sí', [VACUNAS.derivados({ cfs: '5', c: {} }).fragil, VACUNAS.derivados({ cfs: '6', c: {} }).fragil], [false, true]);
  ok('Fragilidad activa la indicación de VSR en 60 a 74', tiene(F(P(71, [], { fried: '3' }), 'vsr').motivos.map(m => m.t), 'Fragilidad'), true);
  ok('Dependencia: Barthel 60 sí, 65 no (individualizar), 100 no', [
    VACUNAS.derivados({ barthel: '60', c: {} }).dependencia,
    VACUNAS.derivados({ barthel: '65', c: {} }).barthelIndiv,
    VACUNAS.derivados({ barthel: '100', c: {} }).dependencia], [true, true, false]);
  ok('Malnutrición: MNA-SF 7 sí, 8 no', [VACUNAS.derivados({ mnasf: '7', c: {} }).malnutricion, VACUNAS.derivados({ mnasf: '8', c: {} }).malnutricion], [true, false]);
  ok('Cardiopatía: advertencia de revacunación del VSR', F(P(68, ['cardio']), 'vsr').advertencia,
    'El consenso sugiere no revacunar contra el VSR a pacientes con cardiopatía establecida; esta directriz puede cambiar según evolucione la evidencia.');
  ok('Sin cardiopatía no hay advertencia', F(P(68), 'vsr').advertencia, undefined);
  ok('VSR con EPOC no muestra el motivo "sin factor de riesgo"', tiene(F(P(68, ['pulmonar', 'cardio']), 'vsr').motivos.map(m => m.t), 'sin factor de riesgo'), false);
  ok('VSR sin ningún motivo conserva la categoría de la Parte 1', tiene(F(P(68), 'vsr').motivos.map(m => m.t), 'sin factor de riesgo'), true);
  ok('Recomendadas a todo mayor de 60: influenza, COVID-19, neumococo, zóster y Td/Tdap',
    ['influenza', 'covid', 'neumococo', 'zoster', 'td'].map(id => F(P(65), id).cat), ['rec', 'rec', 'rec', 'rec', 'rec']);
  ok('Sin exposición: fiebre amarilla y dengue no indicadas', [F(P(65), 'fa').cat, F(P(65), 'dengue').cat], ['noind', 'noind']);
  ok('Fiebre amarilla en zona de riesgo: VGI antes de decidir (af. 46)', tiene(F(P(65, ['zonaFA']), 'fa').motivos.map(m => m.t), 'valoración geriátrica integral'), true);
  ok('Precedencia: "Contraindicada" gana sobre la zona endémica de dengue', F(P(66, ['biologico', 'zonaDengue']), 'dengue').cat, 'contra');
  ok('Precedencia: hepatitis B sube a "Se recomienda" con hepatopatía', F(P(65, ['hepatica']), 'hepb').cat, 'rec');
  ok('Neumococo: PCV20 o PCV21 previa da esquema completo', F(P(65, [], { neumo: 'pcv2021' }), 'neumococo').cat, 'completo');
  ok('Esquema especial (VIH, asplenia, trasplante) se avisa', P(65, ['asplenia']).especial, ['asplenia']);
  ok('Sin PAI: ninguna vacuna trae datos del PAI (2.18.1)', P(65).filas.some(f => 'pai' in f || JSON.stringify(f).includes('PAI')), false);

  // ---------- 3) Texto para la historia (2.18.1) ----------
  const E0 = VACUNAS.nuevo();
  VACUNAS.estado = { ...E0, edad: '78', c: { pulmonar: true, trasplante: true }, neumo: 'pcv2021',
    tiene: { influenza: { v: 'si', x: '2026' }, neumococo: { v: 'si', x: '2024' }, covid: { v: 'no', x: '' } } };
  const t = VACUNAS.texto();
  const L = t.split('\n');
  ok('Texto: encabezado con la fuente y la edad', L[0], 'VACUNACIÓN (Consenso Colombiano de Vacunación en el Adulto, ACMI 2026). Edad: 78 años.');
  const iApl = L.findIndex(l => l.startsWith('Vacunas aplicadas: '));
  ok('Texto: las aplicadas van primero, con año y vacuna previa', L[iApl], 'Vacunas aplicadas: influenza (2026); neumococo (PCV20 o PCV21; 2024).');
  ok('Texto: las aplicadas van antes que cualquier pendiente', iApl >= 0 && iApl < L.findIndex(l => l.startsWith('Indicadas')), true);
  ok('Texto: la que no tiene queda como pendiente', L.some(l => /^Indicadas, pendientes: .*COVID-19/.test(l)), true);
  ok('Texto: las indicadas sin registro quedan a la vista', L.some(l => /^Indicadas, sin dato de aplicación: .*herpes zóster/.test(l)), true);
  ok('Texto: una aplicada no se repite como pendiente', L.filter(l => !l.startsWith('Vacunas aplicadas')).some(l => /influenza|neumococo/.test(l)), false);
  ok('Texto: contraindicadas', L.some(l => /^Contraindicadas: fiebre amarilla; dengue\.$/.test(l)), true);
  ok('Texto: sin PAI, sin rayas ni comillas tipográficas', /PAI|[—–“”«»]/.test(t), false);
  VACUNAS.estado = { ...E0, edad: '70' };
  ok('Texto: sin registro dice que no hay aplicadas', VACUNAS.texto().includes('Vacunas aplicadas: ninguna registrada.'), true);
  VACUNAS.estado = { ...E0, edad: '70', tiene: { neumococo: { v: 'no', x: '' } }, neumo: 'pcv2021' };
  ok('Neumococo: la vacuna previa solo cuenta si se marcó que la tiene', VACUNAS.texto().includes('pendientes: neumococo'), true);
  VACUNAS.estado = { ...E0, edad: '70', tiene: { neumococo: { v: 'si', x: '' } }, neumo: 'pcv13' };
  ok('Neumococo con solo PCV13: aplicada y con el paso siguiente', [VACUNAS.texto().includes('Vacunas aplicadas: neumococo (solo PCV13).'),
    VACUNAS.texto().includes('Esquema por completar: neumococo. PCV20 o PCV21 al menos 1 año después de la PCV13.')], [true, true]);
  VACUNAS.estado = VACUNAS.nuevo();

  // ---------- 5) Inventario ----------
  ok('Las fichas de escalas no cambian (48)', Object.keys(SCALES).length, 48);
  ok('Vacunación no figura entre las escalas', 'vacunas' in SCALES || ALL_IDS.includes('vacunas'), false);
  return res;
});
for (const c of r) { out.casos++; if (!c.ok) out.fallos.push(`${c.nombre}: se obtuvo ${JSON.stringify(c.obtenido)} y se esperaba ${JSON.stringify(c.esperado)}`); }

// ---------- 4) Recorrido en la interfaz ----------
const antes = await page.evaluate(() => { try { return Object.keys(localStorage).filter(k => !/^eg_(favs|recientes|tsize)$/.test(k)); } catch (e) { return []; } });
await page.evaluate(() => {
  VGI.barthel = { id: 'barthel', eje: 'funcional', dom: 'ABVD', nombre: 'Índice de Barthel', valor: '55 / 100', t: 'Dependencia moderada', tone: 'warn', ts: 1 };
  VGI.cfs = { id: 'cfs', eje: 'funcional', dom: 'Fragilidad', nombre: 'Clinical Frailty Scale', valor: 'CFS 6', t: 'Vive con fragilidad moderada', tone: 'alert', ts: 2 };
  VGI.mna = { id: 'mna', eje: 'clinico', dom: 'Nutrición', nombre: 'MNA-SF', valor: '6 / 14', t: 'Malnutrición', tone: 'alert', ts: 3 };
  state = { ...state, view: 'list', eje: 'clinico', id: null, q: '', dom: null, showResult: false }; render();
});
out.casos++;
if (await page.$('#list [data-vac="abrir"]')) out.fallos.push('Recorrido: la vacunación aparece como grupo del eje clínico; debe estar en la barra');
const orden = await page.evaluate(() => [...document.querySelectorAll('#tabs > button')].map(b => b.classList.contains('vac-tab') ? 'vacunas' : b.classList.contains('vgi-tab') ? 'resumen' : b.classList.contains('tray-tab') ? 'trayectoria' : 'otro'));
out.casos++;
if (orden.indexOf('vacunas') !== orden.indexOf('resumen') + 1) out.fallos.push('Recorrido: el botón Vacunas no está justo debajo de Resumen: ' + JSON.stringify(orden));
const visible = await page.evaluate(() => { const b = document.querySelector('#tabs .vac-tab'); if (!b) return false; const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.right <= innerWidth + 1; });
out.casos++;
if (!visible) out.fallos.push('Recorrido: el botón Vacunas no se ve en la barra del celular');
await page.click('#tabs .vac-tab');
out.casos++;
const vista = await page.evaluate(() => state.view);
const actual = await page.evaluate(() => (document.querySelector('#tabs .vac-tab') || {}).getAttribute?.('aria-current'));
out.casos++;
if (actual !== 'true') out.fallos.push('Recorrido: el botón Vacunas no queda marcado como destino actual');
if (vista !== 'vac') out.fallos.push(`Recorrido: la entrada abre la vista ${vista} y no la de Vacunación`);
const pre = await page.evaluate(() => ['barthel', 'cfs', 'mnasf'].map(k => (document.querySelector(`[data-vac="campo"][data-k="${k}"]`) || {}).value));
out.casos++;
if (JSON.stringify(pre) !== JSON.stringify(['55', '6', '6'])) out.fallos.push(`Recorrido: los datos tomados de la VGI son ${JSON.stringify(pre)}`);
out.casos++;
if (!(await page.$('.vac-origen'))) out.fallos.push('Recorrido: no se indica que el dato viene del resumen de la VGI');
await page.fill('[data-vac="campo"][data-k="edad"]', '72');
await page.click('[data-vac="cond"][data-k="neuro"]');
const vsr = await page.textContent('#vac-vsr .vac-cat').catch(() => null);
out.casos++;
if (vsr !== 'Se recomienda') out.fallos.push(`Recorrido: con demencia y Barthel 55 el VSR muestra ${JSON.stringify(vsr)}`);
out.casos++;
if (!(await page.$('[data-vac="cond"][data-k="neuroResp"]'))) out.fallos.push('Recorrido: al marcar la enfermedad neurológica no aparece su subcondición');
const covid = await page.textContent('#vac-covid .vac-dest').catch(() => '');
out.casos++;
if (!/al menos una dosis al año, preferiblemente dos separadas seis meses/.test(covid || '')) out.fallos.push('Recorrido: con MNA-SF 6 no aparece la pauta de COVID-19 en inmunosupresión');
// Menú desplegable: cerrado de entrada, se abre al tocar la vacuna.
const menu = await page.evaluate(() => ({
  grupos: [...document.querySelectorAll('#vacres .vac-bloque .grp')].map(g => g.textContent),
  abiertos: document.querySelectorAll('#vacres details.vac-item[open]').length,
  items: document.querySelectorAll('#vacres details.vac-item').length }));
out.casos++;
if (menu.grupos[0] !== 'Indicadas' || menu.abiertos !== 0 || menu.items < 8) out.fallos.push('Recorrido: el menú de vacunas no es el esperado: ' + JSON.stringify(menu));
await page.click('#vac-zoster > summary', { timeout: 3000 }).catch(() => {});
out.casos++;
if (!(await page.isVisible('#vac-zoster .vac-esq').catch(() => false))) out.fallos.push('Recorrido: al tocar una vacuna no se despliega su esquema');
// Registro: La tiene, con año; el menú desplegado se conserva.
await page.click('[data-vac="tiene"][data-id="influenza"][data-v="si"]', { timeout: 3000 }).catch(() => {});
await page.fill('input[data-vac="tienex"][data-id="influenza"]', '2026', { timeout: 3000 }).catch(() => {});
await page.click('[data-vac="tiene"][data-id="vsr"][data-v="no"]', { timeout: 3000 }).catch(() => {});
out.casos++;
if (!(await page.$eval('#vac-zoster', d => d.open).catch(() => false))) out.fallos.push('Recorrido: al registrar una vacuna se cierra la que estaba desplegada');
out.casos++;
if (!(await page.$('#vac-influenza .vac-ya'))) out.fallos.push('Recorrido: el menú no marca la vacuna que el paciente tiene');
await page.click('[data-vac="tiene"][data-id="neumococo"][data-v="si"]', { timeout: 3000 }).catch(() => {});
out.casos++;
if (!(await page.$('select[data-vac="neumo"]'))) out.fallos.push('Recorrido: al marcar el neumococo no se pregunta cuál recibió');
await page.click('[data-vac="tiene"][data-id="neumococo"][data-v="si"]', { timeout: 3000 }).catch(() => {});
out.casos++;
if (await page.$('select[data-vac="neumo"]')) out.fallos.push('Recorrido: un segundo toque no desmarca "La tiene"');
await page.click('[data-vac="addvgi"]', { timeout: 3000 }).catch(() => {});
const resumen = await page.evaluate(() => vgiTexto());
out.casos++;
if (!/PROMOCIÓN Y PREVENCIÓN/.test(resumen) || !/Vacunas aplicadas: influenza \(2026\)\./.test(resumen) || !/Indicadas, pendientes: VSR\./.test(resumen))
  out.fallos.push('Recorrido: el resumen de la VGI no trae el bloque de vacunación completo: ' + resumen.slice(0, 300));
out.casos++;
if (/[—–]/.test(resumen.split('PROMOCIÓN Y PREVENCIÓN')[1] || '')) out.fallos.push('Recorrido: el bloque de vacunación del resumen tiene rayas');
await page.evaluate(() => { state = { ...state, view: 'vgi', id: null }; render(); });
out.casos++;
if (!(await page.$('.vgi-item button[data-quitar="vacunas"]'))) out.fallos.push('Recorrido: la vacunación no aparece como elemento del Resumen');
await page.evaluate(() => { state = { ...state, view: 'list', eje: 'funcional', id: null, q: 'vacuna' }; render(); });
out.casos++;
if (!(await page.$('#list [data-vac="abrir"]'))) out.fallos.push('Recorrido: la búsqueda "vacuna" no encuentra la sección');
await page.evaluate(() => VACUNAS.abrir());
const textoVista = await page.evaluate(() => document.getElementById('view').innerText);
out.casos++;
if (/[—–“”]/.test(textoVista)) out.fallos.push('Recorrido: la vista de Vacunación tiene rayas o comillas tipográficas');
out.casos++;
if (/\bPAI\b/.test(textoVista)) out.fallos.push('Recorrido: la vista de Vacunación menciona el PAI');
const despues = await page.evaluate(() => { try { return Object.keys(localStorage).filter(k => !/^eg_(favs|recientes|tsize)$/.test(k)); } catch (e) { return []; } });
out.casos++;
if (despues.length > antes.length) out.fallos.push('Privacidad: la sección escribió en el almacenamiento del dispositivo: ' + despues.join(', '));

out.casos++;
if (out.erroresJS.length) out.fallos.push('Errores de JavaScript: ' + out.erroresJS.slice(0, 5).join(' | '));
await browser.close();
out.aprobado = out.fallos.length === 0;
console.log(JSON.stringify(out, null, 2));
process.exit(out.aprobado ? 0 : 1);
