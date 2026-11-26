/*
 * VGI Digital · ui-v5.js: capa de interfaz del rediseño 2.16.0, con la
 * navegación simplificada de la 2.17.0 (barra de cuatro destinos, Inicio
 * compacto y biblioteca con un solo encabezado)
 *
 * Solo presentación. No define ni modifica escalas, ítems, opciones,
 * puntajes, puntos de corte, interpretaciones ni el conversor: lee SCALES,
 * ORDER, EJES, EJE_INTRO y VGI tal como los declara index.html y sustituye
 * únicamente las funciones que pintan el Inicio, la biblioteca de cada eje,
 * las tarjetas y la barra de navegación. Todas las cifras que muestra
 * (escalas, ítems, grupos, tipos) se calculan en vivo a partir de esos datos.
 */
(function(){
'use strict';

const V5 = { tipo:'todas', ejePrev:null, abiertos:{} };

/* ---------- Datos derivados (nunca escritos a mano) ---------- */
const esEscala = id => SCALES[id] && !SCALES[id].tool;
const idsEje = eje => ORDER[eje].flatMap(g=>g.ids);
const escalasEje = eje => idsEje(eje).filter(esEscala);
const tipoDe = s => s.tool ? 'herramienta' : (s.max ? 'sumativa' : 'algoritmica');
const VERSION = (function(){
  try{
    const j = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
    return j.softwareVersion || '';
  }catch(e){ return ''; }
})();
const ejeInfo = id => EJES.find(e=>e.id===id);
const ejeNombre = e => e.largo || e.label;

/* ---------- Rueda de la VGI: arcos proporcionales a los instrumentos ---------- */
function ruedaHTML(){
  const datos = EJES.map(e=>({id:e.id, nombre:ejeNombre(e), n:idsEje(e.id).length}));
  const tot = datos.reduce((a,d)=>a+d.n,0);
  const R = 92, C = 2*Math.PI*R, hueco = 5;
  let acum = 0;
  const arcos = datos.map((d,k)=>{
    const largo = C*d.n/tot - hueco;
    const off = -acum;
    acum += C*d.n/tot;
    return '<circle class="v5-arco" data-tab="'+d.id+'" data-nombre="'+esc(d.nombre)+'" data-n="'+d.n+'" tabindex="0" role="button" aria-label="Eje '+esc(d.nombre)+': '+d.n+' instrumentos"'
      + ' cx="120" cy="120" r="'+R+'" style="--eje:var(--'+d.id+');--k:'+k+';--largo:'+largo.toFixed(2)+'"'
      + ' stroke-dasharray="'+largo.toFixed(2)+' '+(C-largo).toFixed(2)+'" stroke-dashoffset="'+off.toFixed(2)+'"/>';
  }).join('');
  const nEsc = ALL_IDS.filter(esEscala).length;
  return '<div class="v5-rueda" style="--c:'+C.toFixed(2)+'">'
    + '<svg viewBox="0 0 240 240" aria-hidden="false" role="group" aria-label="Instrumentos por eje">'
    + '<circle class="v5-pista" cx="120" cy="120" r="'+R+'"/>'
    + '<g transform="rotate(-90 120 120)">'+arcos+'</g>'
    + '<circle class="v5-orbita" cx="120" cy="120" r="112"/>'
    + '</svg>'
    + '<div class="v5-rueda-centro">'+escenaMarca()+'</div>'
    + '<p class="v5-rueda-cap" id="v5cap" aria-live="polite"><b>'+nEsc+' escalas</b> en '+EJES.length+' ejes</p>'
    + '</div>';
}

/* ---------- Inicio ---------- */
const ICO = {
  buscar:'<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  flecha:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h11M11 5.5 15.5 10 11 14.5"/></svg>',
  chev:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 8 4 4 4-4"/></svg>',
  conv:'<svg class="tabicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h13M17 8l-3.5-3.5M20 16H7M7 16l3.5 3.5"/></svg>',
  estrella:'<svg viewBox="0 0 20 19" fill="currentColor" aria-hidden="true"><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z"/></svg>',
  candado:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="9" width="11" height="8" rx="2"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/></svg>'
};

function fichaEje(e, k){
  const ids = idsEje(e.id);
  return '<button class="v6-eje" data-tab="'+e.id+'" style="--eje:var(--'+e.id+');--k:'+k+'">'
    + '<span class="v6-eje-ico">'+tabIcon(e.id)+'</span>'
    + '<span class="v6-eje-txt"><span class="v6-eje-nom">'+esc(ejeNombre(e))+'</span>'
    + '<span class="v6-eje-dom">'+esc(ORDER[e.id].map(g=>g.g).join(' · '))+'</span></span>'
    + '<span class="v6-eje-n" aria-label="'+ids.length+' instrumentos"><b>'+ids.length+'</b></span>'
    + '</button>';
}

function rapidasHTML(){
  const fila = (titulo, ids)=>{
    ids = ids.filter(id=>SCALES[id]);
    if(!ids.length) return '';
    return '<div class="v5-rapidas"><span class="v5-rap-tit">'+titulo+'</span><div class="v5-rap-fila">'
      + ids.map(id=>{ const s=SCALES[id];
          return '<button class="v5-rap" data-open="'+id+'" style="--eje:var(--'+s.eje+')"><i></i>'+esc(s.name)+'</button>';
        }).join('')+'</div></div>';
  };
  return fila('Favoritas', FAVS) + fila('Recientes', RECIENT.filter(id=>!esFav(id)).slice(0,6));
}

renderHome = function(){
  const nEsc = ALL_IDS.filter(esEscala).length;
  const dibuja = !renderHome.hecho && !MOV_REDUCIDO;
  renderHome.hecho = true;
  const rap = rapidasHTML();
  $('#view').innerHTML =
    '<section class="v5-hero v6-hero'+(dibuja?' anima':'')+'">'
    + '<div class="v5-hero-txt">'
    + '<span class="v5-eyebrow">VGI Digital: Valoración Geriátrica Integral</span>'
    + '<h2>Cinco ejes,<br><em>una sola valoración.</em></h2>'
    + '</div>'
    + '<div class="v5-hero-viz">'+ruedaHTML()+'</div>'
    + '<label class="v6-buscar">'+ICO.buscar
    + '<input id="v6q" type="search" placeholder="Buscar entre las '+nEsc+' escalas" autocomplete="off" enterkeyhint="search" aria-label="Buscar una escala">'
    + '<kbd>/</kbd></label>'
    + '</section>'
    + (rap ? '<section class="v6-sec v6-sec-rap">'+rap+'</section>' : '')
    + '<section class="v6-sec">'
    + '<h2 class="v6-tit">Escalas por eje</h2>'
    + '<div class="v6-ejes">'+EJES.map(fichaEje).join('')+'</div>'
    + '</section>'
    + '<section class="v6-sec">'
    + '<h2 class="v6-tit">Herramienta</h2>'
    + '<button class="v6-conv" data-open="opioides" style="--eje:var(--paliativo)">'
    + '<span class="v6-conv-viz" aria-hidden="true"><svg viewBox="0 0 120 64"><path d="M14 22h80M94 22l-12-10M94 22l-12 10"/><path d="M106 44H26M26 44l12-10M26 44l12 10"/></svg></span>'
    + '<span class="v6-conv-txt"><b>Conversor de opioides</b><span>Dosis equianalgésicas, tolerancia cruzada incompleta y rescates</span></span>'
    + '<span class="v6-conv-ir">'+ICO.flecha+'</span></button>'
    + '</section>'
    + '<footer class="v5-pie">'
    + '<span>'+ICO.candado+'Datos procesados localmente en este dispositivo</span>'
    + '<span>Basada en "Abordaje geriátrico integral: escalas de uso frecuente en geriatría" (Editorial PUJ, 2024)</span>'
    + '<button data-act="about">Acerca de VGI Digital</button>'
    + '</footer>';
};

/* El buscador del Inicio lleva directo a los resultados de toda la biblioteca. */
document.addEventListener('input', e=>{
  if(!e.target || e.target.id!=='v6q') return;
  const v = e.target.value;
  state = {...state, view:'list', id:null, dom:null, q:v, showResult:false};
  render();
  const q = document.getElementById('q');
  if(q){ q.focus(); try{ q.setSelectionRange(v.length, v.length); }catch(_){} }
});

/* La rueda responde al puntero y al teclado: el rótulo central nombra el eje. */
function rotulo(arco){
  const cap = document.getElementById('v5cap');
  if(!cap) return;
  if(!arco){ cap.innerHTML = '<b>'+ALL_IDS.filter(esEscala).length+' escalas</b> en '+EJES.length+' ejes'; cap.style.removeProperty('--eje'); return; }
  cap.innerHTML = '<b>'+esc(arco.dataset.nombre)+'</b> '+arco.dataset.n+' instrumentos';
  cap.style.setProperty('--eje', 'var(--'+arco.dataset.tab+')');
}
document.addEventListener('pointerover', e=>{
  const a = e.target.closest && e.target.closest('.v5-arco');
  if(a) rotulo(a); else if(e.target.closest && e.target.closest('.v5-rueda')===null) rotulo(null);
});
document.addEventListener('focusin', e=>{ const a = e.target.closest && e.target.closest('.v5-arco'); if(a) rotulo(a); });
document.addEventListener('keydown', e=>{
  const a = e.target.closest && e.target.closest('.v5-arco');
  if(a && (e.key==='Enter' || e.key===' ')){ e.preventDefault(); a.dispatchEvent(new MouseEvent('click',{bubbles:true})); return; }
  /* Atajo "/" para buscar desde cualquier vista sin campo activo. */
  if(e.key==='/' && !/input|textarea|select/i.test((e.target.tagName||'')) && state.view!=='scale'){
    e.preventDefault();
    const qi = document.getElementById('q') || document.getElementById('v6q');
    if(qi){ qi.focus(); return; }
    state = {...state, view:'list', id:null, dom:null, q:'', showResult:false}; render();
    const q2 = document.getElementById('q'); if(q2) q2.focus();
  }
});

/* ---------- Biblioteca de cada eje ---------- */
cardHTML = function(id, showEje){
  const s = SCALES[id];
  const tipo = tipoDe(s);
  const chips = [];
  if(s.tool) chips.push('<span class="v5-meta">Calculadora · resultado en dosis</span>');
  else {
    chips.push('<span class="v5-meta">'+s.items.length+' ítem'+(s.items.length===1?'':'s')+'</span>');
    chips.push(s.max ? '<span class="v5-meta">Máximo '+fmt(s.max)+'</span>' : '<span class="v5-meta v5-meta-alg">Algorítmica</span>');
  }
  if(s.external) chips.push('<span class="v5-meta v5-meta-ext">Complementaria</span>');
  const tag = showEje ? '<span class="v5-card-eje">'+esc(ejeInfo(s.eje).label)+'</span>' : '';
  return '<button class="card v5-card" data-open="'+id+'" data-tipo="'+tipo+'" style="--eje:var(--'+s.eje+')">'
    + '<span class="v5-card-top"><span class="dom">'+esc(s.dom)+'</span>'+tag
    + (esFav(id)?'<span class="v5-card-fav" title="Favorita">'+ICO.estrella+'</span>':'')+'</span>'
    + '<h2>'+esc(s.name)+'</h2>'
    + '<p>'+esc(s.blurb)+'</p>'
    + '<span class="v5-card-pie">'+chips.join('')+'</span></button>';
};

function pasaFiltro(id){
  const s = SCALES[id];
  if(V5.tipo==='todas') return true;
  if(V5.tipo==='complementaria') return !!s.external;
  return tipoDe(s)===V5.tipo;
}

listInner = function(){
  const q = norm(state.q.trim());
  if(q){
    const hits = ALL_IDS.filter(id=>{
      const s=SCALES[id];
      return norm(s.name+' '+s.full+' '+s.dom+' '+s.blurb).includes(q);
    });
    if(!hits.length) return '<p class="empty">Ninguna escala coincide con la búsqueda.</p>';
    return '<div class="grp v5-grp-res">'+hits.length+' resultado'+(hits.length===1?'':'s')+' en toda la biblioteca</div>'
      + hits.map(id=>cardHTML(id,true)).join('');
  }
  let html = '', k = 0;
  ORDER[state.eje].forEach((g,i)=>{
    const ids = g.ids.filter(pasaFiltro);
    if(!ids.length) return;
    k++;
    html += '<div class="grp v5-grp" id="v5g'+i+'"><span class="v5-grp-n">'+(i+1)+'</span><span class="v5-grp-t">'+esc(g.g)+'</span><span class="n">'+ids.length+'</span></div>'
      + ids.map(id=>cardHTML(id,false)).join('');
  });
  return k ? html : '<p class="empty">Este eje no tiene instrumentos de ese tipo.</p>';
};

function filtrosHTML(){
  const ids = idsEje(state.eje);
  const c = {
    todas: ids.length,
    sumativa: ids.filter(id=>tipoDe(SCALES[id])==='sumativa').length,
    algoritmica: ids.filter(id=>tipoDe(SCALES[id])==='algoritmica').length,
    complementaria: ids.filter(id=>SCALES[id].external).length
  };
  const ops = [['todas','Todas'],['sumativa','Sumativas'],['algoritmica','Algorítmicas'],['complementaria','Complementarias']]
    .filter(([k])=>k==='todas' || c[k]>0);
  return '<div class="v5-filtros" role="group" aria-label="Filtrar por tipo de instrumento">'
    + ops.map(([k,l])=>'<button data-v5="tipo" data-tipo="'+k+'" aria-pressed="'+(V5.tipo===k)+'">'+l+'<span>'+c[k]+'</span></button>').join('')
    + '</div>';
}

const TIPO_NOMBRE = {sumativa:'Sumativas', algoritmica:'Algorítmicas', complementaria:'Complementarias'};
function filtroPlegado(){
  const activo = V5.tipo!=='todas';
  return '<details class="v6-filtro"'+(V5.filtroAbierto||activo?' open':'')+'>'
    + '<summary><span>Filtrar por tipo</span><b class="v6-filtro-act">'+(activo?TIPO_NOMBRE[V5.tipo]:'')+'</b>'+ICO.chev+'</summary>'
    + filtrosHTML()
    + '</details>';
}

renderList = function(){
  if(V5.ejePrev!==state.eje){ V5.tipo='todas'; V5.ejePrev=state.eje; V5.filtroAbierto=false; }
  const e = ejeInfo(state.eje);
  const ids = idsEje(state.eje);
  $('#view').innerHTML =
    '<nav class="v6-chips" aria-label="Cambiar de eje">'
    + EJES.map(x=>'<button data-tab="'+x.id+'" style="--eje:var(--'+x.id+')" aria-current="'+(x.id===e.id)+'">'
        + tabIcon(x.id)+'<span>'+esc(x.label)+'</span></button>').join('')
    + '</nav>'
    + '<section class="v6-banda" style="--eje:var(--'+e.id+')">'
    + '<span class="v6-banda-ico" aria-hidden="true">'+tabIcon(e.id)+'</span>'
    + '<p>'+esc(EJE_INTRO[e.id])+'</p>'
    + '<span class="v6-banda-n">'+ids.length+' instrumentos · '+ORDER[e.id].length+' grupos</span>'
    + '</section>'
    + '<div class="v5-barra v6-barra">'
    + '<div class="search">'+ICO.buscar
    + '<input id="q" type="search" placeholder="Buscar en las '+ALL_IDS.filter(esEscala).length+' escalas" value="'+esc(state.q)+'" autocomplete="off" enterkeyhint="search">'
    + (state.q?'<button class="clr" data-act="clearq" aria-label="Limpiar">&times;</button>':'')
    + '</div>'
    + (state.q ? '' : filtroPlegado())
    + '</div>'
    + '<div id="list">'+listInner()+'</div>';
};

const ICO_ESCALAS = '<svg class="tabicon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="4.5" height="16" rx="1"/><rect x="10" y="4" width="4.5" height="16" rx="1"/><path d="m16.2 5.3 3.4-.9 3 14.9-3.4.8z"/></svg>';

/* ---------- Navegación: cuatro destinos (2.17.0) ----------
 * Inicio, Escalas, Resumen y Trayectoria. Escalas abre el último eje usado;
 * en escritorio la barra lateral muestra los cinco ejes con su nombre. */
renderTabs = function(){
  const n = Object.keys(VGI).length;
  const nPrev = renderTabs.n; renderTabs.n = n;
  const enEscalas = ['list','scale','tool'].indexOf(state.view)>=0;
  const cur = c => c ? ' aria-current="true"' : '';
  const nEsc = ALL_IDS.filter(esEscala).length;
  $('#tabs').innerHTML =
    '<div class="nav-brand"><img class="brand-logo-mark" src="icon-192.png" width="42" height="42" alt="" aria-hidden="true"><div><strong>VGI Digital</strong><small>'+(VERSION?'Versión '+VERSION:'')+'</small></div></div>'
    + '<button class="tab-inicio v6-tab" data-tab="inicio" style="--tab:var(--marca-agua)"'+cur(state.view==='home')+'>'
    + '<span class="mark"></span>'+tabIcon('inicio')+'<span class="tabtext">Inicio</span></button>'
    + '<button class="v6-tab v6-escalas" data-tab="'+state.eje+'" style="--tab:var(--'+state.eje+')"'+cur(enEscalas)+' aria-label="Escalas">'
    + '<span class="mark"></span>'+ICO_ESCALAS+'<span class="tabtext">Escalas</span></button>'
    + '<div class="nav-label v6-sub-tit">Escalas por eje</div>'
    + EJES.map(e=>'<button class="v6-tab v6-sub" data-tab="'+e.id+'" style="--tab:var(--'+e.id+')"'+cur(enEscalas && state.eje===e.id)+' aria-label="Eje '+esc(ejeNombre(e))+'">'
        + '<span class="mark"></span>'+tabIcon(e.id)+'<span class="tabtext">'+esc(e.label)+'</span><span class="v5-tab-n">'+idsEje(e.id).length+'</span></button>').join('')
    + '<div class="nav-divider"></div>'
    + '<button class="vgi-tab v6-tab" data-tab="vgi" style="--tab:var(--ink)"'+cur(state.view==='vgi')+' aria-label="Resumen de la valoración">'
    + '<span class="mark"></span>'+tabIcon('vgi')+'<span class="tabtext">Resumen</span>'+(n?'<span class="nav-count">'+n+'</span>':'')+'</button>'
    + '<button class="tray-tab v6-tab" data-tab="tray" style="--tab:var(--marca-verde)"'+cur(state.view==='tray')+' aria-label="Trayectoria: comparar mediciones en el tiempo">'
    + '<span class="mark"></span>'+tabIcon('tray')+'<span class="tabtext">Trayectoria</span></button>'
    + '<div class="nav-foot">'+nEsc+' escalas · 1 conversor · 1 comparador<br><span>Datos procesados localmente</span></div>';
  if(nPrev!==undefined && n>nPrev && !MOV_REDUCIDO){
    const c = document.querySelector('#tabs .nav-count'); if(c) c.classList.add('bump');
  }
};

/* ---------- Ficha: rótulos de tipo y mapa de ítems ---------- */
const renderScaleBase = renderScale;
renderScale = function(){
  renderScaleBase();
  if(state.view!=='scale' || state.showResult) return;
  const s = SCALES[state.id];
  const head = document.querySelector('.scale-head');
  if(head && !head.querySelector('.v5-ficha-meta')){
    const m = document.createElement('div');
    m.className = 'v5-ficha-meta';
    m.innerHTML = '<span class="v5-meta">'+esc(ejeNombre(ejeInfo(s.eje)))+'</span>'
      + '<span class="v5-meta">'+s.items.length+' ítem'+(s.items.length===1?'':'s')+'</span>'
      + (s.max ? '<span class="v5-meta">Máximo '+fmt(s.max)+'</span>' : '<span class="v5-meta v5-meta-alg">Algorítmica</span>')
      + (s.external ? '<span class="v5-meta v5-meta-ext">Complementaria</span>' : '');
    head.appendChild(m);
  }
};

function riel(){
  let r = document.getElementById('v5-riel');
  if(state.view!=='scale' || state.showResult){ if(r) r.remove(); return; }
  const s = SCALES[state.id];
  if(s.items.length<3){ if(r) r.remove(); return; }
  if(!r || r.dataset.id!==state.id){
    if(r) r.remove();
    r = document.createElement('nav');
    r.id = 'v5-riel'; r.dataset.id = state.id;
    r.setAttribute('aria-label','Mapa de ítems');
    r.innerHTML = '<span class="v5-riel-t">Ítems</span><div class="v5-riel-l">'
      + s.items.map((it,i)=>'<button data-v5="item" data-i="'+i+'" title="'+esc(String(it.q||('Ítem '+(i+1))).slice(0,90))+'">'+(i+1)+'</button>').join('')
      + '</div>';
    document.body.appendChild(r);
  }
  r.style.setProperty('--eje', 'var(--'+s.eje+')');
  r.querySelectorAll('button').forEach(b=>{
    b.classList.toggle('ok', state.ans[+b.dataset.i]!==undefined && tocados()>0);
  });
}
const renderScorebarBase = renderScorebar;
renderScorebar = function(){ renderScorebarBase(); riel(); };

/* El riel marca el ítem visible en pantalla. */
let rielPend = false;
window.addEventListener('scroll', ()=>{
  if(rielPend) return; rielPend = true;
  requestAnimationFrame(()=>{
    rielPend = false;
    const r = document.getElementById('v5-riel'); if(!r) return;
    let act = 0;
    r.querySelectorAll('button').forEach(b=>{
      const el = document.getElementById('it'+b.dataset.i);
      if(el && el.getBoundingClientRect().top < window.innerHeight*0.45) act = +b.dataset.i;
    });
    r.querySelectorAll('button').forEach(b=>b.classList.toggle('act', +b.dataset.i===act));
  });
}, {passive:true});

/* ---------- Trayectoria: entrada propia con la gráfica de las piezas ----------
   Misma gráfica de la campaña de Trayectoria: fondo verde bosque, línea basal
   punteada, caída en coral y recuperación en lima, nodos con aro blanco.
   Es ilustrativa: no lleva valores ni representa a ningún paciente. */
function trayGrafica(modo){
  if(modo==='hosp'){
    return '<svg class="v5-tg" viewBox="0 0 888 300" role="img" aria-label="Esquema de una trayectoria hospitalaria: basal, ingreso y alta">'
      + '<line class="v5-tg-base" x1="40" y1="60" x2="848" y2="60"/>'
      + '<line class="v5-tg-cae" pathLength="1" x1="60" y1="60" x2="444" y2="220"/>'
      + '<line class="v5-tg-sube" pathLength="1" x1="444" y1="220" x2="828" y2="110"/>'
      + '<circle class="v5-tg-n" style="--d:0" cx="60" cy="60" r="18"/>'
      + '<circle class="v5-tg-n" style="--d:1" cx="444" cy="220" r="18"/>'
      + '<circle class="v5-tg-n" style="--d:2" cx="828" cy="110" r="18"/>'
      + TRAY_MOM.map((m,k)=>'<text class="v5-tg-t" x="'+[60,444,828][k]+'" y="284" text-anchor="middle">'+esc(m.l)+'</text>').join('')
      + '</svg>';
  }
  return '<svg class="v5-tg" viewBox="0 0 888 300" role="img" aria-label="Esquema de una comparación ambulatoria entre dos mediciones">'
    + '<line class="v5-tg-base" x1="40" y1="140" x2="848" y2="140"/>'
    + '<line class="v5-tg-sube v5-tg-tenue" pathLength="1" x1="120" y1="140" x2="768" y2="60"/>'
    + '<line class="v5-tg-cae" pathLength="1" x1="120" y1="140" x2="768" y2="220"/>'
    + '<circle class="v5-tg-n" style="--d:0" cx="120" cy="140" r="18"/>'
    + '<circle class="v5-tg-n v5-tg-tenue" style="--d:1" cx="768" cy="60" r="16"/>'
    + '<circle class="v5-tg-n" style="--d:2" cx="768" cy="220" r="18"/>'
    + '<text class="v5-tg-t" x="120" y="284" text-anchor="middle">Medición previa</text>'
    + '<text class="v5-tg-t" x="768" y="284" text-anchor="middle">Medición actual</text>'
    + '</svg>';
}

function trayBandaHTML(anima){
  const hospIds = ['barthel','cfs','sppb','at4'].filter(id=>SCALES[id]);
  const nombres = ids => ids.map(id=>esc(SCALES[id].name)).join(', ');
  const modo = TRAY.modo;
  const tarjeta = (m, tit, sub, ids) =>
    '<button class="v5-tm" data-act="traymodo" data-m="'+m+'" aria-pressed="'+(modo===m)+'">'
    + '<span class="v5-tm-tit">'+tit+'</span>'
    + '<span class="v5-tm-sub">'+sub+'</span>'
    + '<span class="v5-tm-esc">'+nombres(ids)+'</span></button>';
  return '<section class="v5-tray'+(anima?' anima':'')+'">'
    + '<div class="v5-tray-txt">'
    + '<span class="v5-tray-cab"><img src="icon-192.png" alt="" width="44" height="44"><span>Herramienta de seguimiento</span></span>'
    + '<h2>Trayectoria</h2>'
    + '<p>Compare mediciones de una misma persona en el tiempo: la pérdida y la recuperación durante una hospitalización, o la declinación y la ganancia en la consulta.</p>'
    + '</div>'
    + '<div class="v5-tray-viz">'+trayGrafica(modo)+'</div>'
    + '<div class="v5-tray-modos" role="group" aria-label="Modo de comparación">'
    + tarjeta('hosp','Hospitalario', TRAY_MOM.map((x,k)=>k?x.l.toLowerCase():x.l).join(', ').replace(/, ([^,]*)$/,' y $1'), hospIds)
    + tarjeta('amb','Ambulatorio','Entre dos consultas · '+TRAY_AMB.length+' escalas', TRAY_AMB)
    + '</div></section>';
}

const renderTrayBase = renderTray;
renderTray = function(){
  renderTrayBase();
  const lede = document.querySelector('#view > .lede');
  if(!lede) return;
  const anima = !MOV_REDUCIDO && V5.trayVisto !== TRAY.modo;
  V5.trayVisto = TRAY.modo;
  lede.outerHTML = trayBandaHTML(anima);
};

const renderBaseV5 = render;
/* ---------- Encabezado: un solo título; Inicio ya está en la barra ---------- */
const renderTopV5 = renderTop;
renderTop = function(){
  renderTopV5();
  const t = $('#topbar');
  t.querySelectorAll('[data-act="home"]').forEach(b=>b.remove());
  const ceja = t.querySelector('.eyebrow'), h1 = t.querySelector('h1');
  if(state.view==='list' && h1){
    if(ceja) ceja.textContent = 'Escalas';
    h1.textContent = ejeNombre(ejeInfo(state.eje));
  }
  if(state.view==='vgi' && ceja) ceja.textContent = 'Esta valoración';
};

/* El buscador del Inicio lleva directo a los resultados de toda la biblioteca. */
document.addEventListener('input', e=>{
  if(!e.target || e.target.id!=='v6q') return;
  const v = e.target.value;
  state = {...state, view:'list', id:null, dom:null, q:v, showResult:false};
  render();
  const q = document.getElementById('q');
  if(q){ q.focus(); try{ q.setSelectionRange(v.length, v.length); }catch(_){} }
});

/* Alturas reales del encabezado y de los chips, para que los grupos queden
   pegados justo debajo al desplazarse. */
function medirPegajosos(){
  const raiz = document.documentElement.style;
  const t = document.getElementById('topbar');
  const ch = document.querySelector('.v6-chips');
  const alto = el => el && getComputedStyle(el).display!=='none' ? el.getBoundingClientRect().height : 0;
  raiz.setProperty('--v6-top', alto(t)+'px');
  raiz.setProperty('--v6-chips', alto(ch)+'px');
}
render = function(){
  if(state.view!=='tray') V5.trayVisto = null;
  renderBaseV5();
  medirPegajosos();
};
window.addEventListener('resize', medirPegajosos, {passive:true});

/* ---------- Acciones propias de la capa ---------- */
document.addEventListener('click', e=>{
  /* El filtro por tipo recuerda si quedó abierto al cambiar la lista. */
  const sum = e.target.closest && e.target.closest('.v6-filtro summary');
  if(sum){ V5.filtroAbierto = !sum.parentElement.open; return; }
  const b = e.target.closest('[data-v5]');
  if(!b) return;
  const a = b.dataset.v5;
  if(a==='tipo'){
    V5.tipo = b.dataset.tipo;
    document.querySelectorAll('.v5-filtros button').forEach(x=>x.setAttribute('aria-pressed', x===b));
    const act = document.querySelector('.v6-filtro-act');
    if(act) act.textContent = V5.tipo==='todas' ? '' : TIPO_NOMBRE[V5.tipo];
    const box = document.getElementById('list');
    if(box){ box.innerHTML = listInner(); animarLista(); }
  }
  if(a==='item'){
    const it = document.getElementById('it'+b.dataset.i);
    if(it){
      const y = it.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({top:y, behavior: MOV_REDUCIDO ? 'instant' : 'smooth'});
    }
  }
});

document.documentElement.classList.add('v5','v6');
render();
})();
