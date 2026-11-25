/*
 * VGI Digital · ui-v5.js: capa de interfaz del rediseño 2.16.0
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
const nItems = ids => ids.filter(esEscala).reduce((n,id)=>n+SCALES[id].items.length,0);
const tipoDe = s => s.tool ? 'herramienta' : (s.max ? 'sumativa' : 'algoritmica');
const VERSION = (function(){
  try{
    const j = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
    return j.softwareVersion || '';
  }catch(e){ return ''; }
})();
const NUM = ['01','02','03','04','05'];
const ejeInfo = id => EJES.find(e=>e.id===id);
const ejeNombre = e => e.largo || e.label;

/* Cuenta animada para las cifras del Inicio (sin animación si el sistema
   pide movimiento reducido). */
function contar(root){
  root.querySelectorAll('[data-cuenta]').forEach(el=>{
    const fin = +el.dataset.cuenta;
    if(MOV_REDUCIDO || !fin){ el.textContent = fin.toLocaleString('es-CO'); return; }
    const t0 = performance.now(), dur = 900;
    const paso = t=>{
      const p = Math.min(1,(t-t0)/dur), e = 1-Math.pow(1-p,3);
      el.textContent = Math.round(fin*e).toLocaleString('es-CO');
      if(p<1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  });
}

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

function moduloHTML(e, k){
  const grupos = ORDER[e.id];
  const ids = idsEje(e.id);
  const sum = ids.filter(id=>tipoDe(SCALES[id])==='sumativa').length;
  const alg = ids.filter(id=>tipoDe(SCALES[id])==='algoritmica').length;
  const abierto = V5.abiertos[e.id];
  const pasos = grupos.map((g,i)=>{
    const ab = abierto===i;
    return '<li class="v5-paso'+(ab?' abierto':'')+'">'
      + '<button class="v5-paso-btn" data-v5="paso" data-eje="'+e.id+'" data-i="'+i+'" aria-expanded="'+ab+'">'
      + '<span class="v5-paso-n">'+(i+1)+'</span>'
      + '<span class="v5-paso-g">'+esc(g.g)+'</span>'
      + '<span class="v5-paso-c">'+g.ids.length+'</span>'
      + '<span class="v5-paso-chev">'+ICO.chev+'</span></button>'
      + '<div class="v5-paso-cuerpo"><div class="v5-paso-chips">'
      + g.ids.map(id=>'<button class="v5-chip" data-open="'+id+'">'+esc(SCALES[id].name)+'</button>').join('')
      + '</div></div></li>';
  }).join('');
  return '<article class="v5-mod" style="--eje:var(--'+e.id+');--k:'+k+'">'
    + '<header class="v5-mod-cab">'
    + '<span class="v5-mod-ico">'+tabIcon(e.id)+'</span>'
    + '<span class="v5-mod-num">Eje '+NUM[k]+'</span>'
    + '<span class="v5-mod-cnt"><b>'+ids.length+'</b> instrumento'+(ids.length===1?'':'s')+'</span>'
    + '</header>'
    + '<h3>'+esc(ejeNombre(e))+'</h3>'
    + '<p class="v5-mod-intro">'+esc(EJE_INTRO[e.id])+'</p>'
    + '<div class="v5-mod-mix" aria-label="'+sum+' sumativas y '+alg+' algorítmicas">'
    + '<span class="v5-mix-bar"><i style="flex:'+sum+'"></i><i style="flex:'+Math.max(alg,0)+'"></i>'+(ids.length-sum-alg>0?'<i style="flex:'+(ids.length-sum-alg)+'"></i>':'')+'</span>'
    + '<span class="v5-mix-txt">'+sum+' sumativa'+(sum===1?'':'s')+' · '+alg+' algorítmica'+(alg===1?'':'s')+(ids.length-sum-alg>0?' · '+(ids.length-sum-alg)+' calculadora':'')+'</span></div>'
    + '<ol class="v5-pasos">'+pasos+'</ol>'
    + '<button class="v5-mod-ir" data-tab="'+e.id+'">Abrir el eje '+ICO.flecha+'</button>'
    + '</article>';
}

function resumenVivo(){
  const vals = Object.values(VGI);
  if(!vals.length) return '<span class="v5-vivo-vacio">Aún no hay resultados en esta valoración.</span>';
  return '<span class="v5-vivo">'+EJES.map(e=>{
    const n = vals.filter(v=>v.eje===e.id).length;
    return '<span class="v5-vivo-eje'+(n?' con':'')+'" style="--eje:var(--'+e.id+')" title="'+esc(e.label)+': '+n+'"><i></i>'+n+'</span>';
  }).join('')+'</span>';
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
  const nIt = nItems(ALL_IDS);
  const nVGI = Object.keys(VGI).length;
  const dibuja = !renderHome.hecho && !MOV_REDUCIDO;
  renderHome.hecho = true;
  const rap = rapidasHTML();

  $('#view').innerHTML =
    '<section class="v5-hero'+(dibuja?' anima':'')+'">'
    + '<div class="v5-hero-txt">'
    + '<span class="v5-eyebrow">VGI Digital: Valoración Geriátrica Integral</span>'
    + '<h2>Cinco ejes,<br><em>una sola valoración.</em></h2>'
    + '<p>Busca una escala concreta, recorre los dominios de la valoración o retoma los instrumentos que ya usas.</p>'
    + '<button class="v5-buscar" data-act="gosearch">'+ICO.buscar+'<span>Buscar entre las '+nEsc+' escalas</span><kbd>/</kbd></button>'
    + '<dl class="v5-cifras">'
    + '<div><dt>Escalas</dt><dd data-cuenta="'+nEsc+'">'+nEsc+'</dd></div>'
    + '<div><dt>Ítems</dt><dd data-cuenta="'+nIt+'">'+nIt+'</dd></div>'
    + '<div><dt>Ejes</dt><dd data-cuenta="'+EJES.length+'">'+EJES.length+'</dd></div>'
    + '<div><dt>Herramientas</dt><dd data-cuenta="3">3</dd></div>'
    + '</dl></div>'
    + '<div class="v5-hero-viz">'+ruedaHTML()+'</div>'
    + '</section>'
    + (rap ? '<section class="v5-sec v5-sec-rap">'+rap+'</section>' : '')
    + '<section class="v5-sec">'
    + '<div class="v5-sec-cab"><span class="v5-eyebrow">Recorrido por ejes</span><h2>Módulos de la valoración</h2>'
    + '<p>Cada eje se recorre por grupos, en el orden de la biblioteca. Despliega un grupo para ver sus instrumentos y abrir uno directamente.</p></div>'
    + '<div class="v5-mods">'+EJES.map(moduloHTML).join('')+'</div>'
    + '</section>'
    + '<section class="v5-sec">'
    + '<div class="v5-sec-cab"><span class="v5-eyebrow">Durante la valoración</span><h2>Herramientas</h2></div>'
    + '<div class="v5-herr">'
    + '<button class="v5-h v5-h-vgi" data-tab="vgi">'
    + '<span class="v5-h-viz" aria-hidden="true"><svg viewBox="0 0 120 64"><rect x="6" y="8" width="30" height="20" rx="5"/><rect x="45" y="8" width="30" height="20" rx="5"/><rect x="84" y="8" width="30" height="20" rx="5"/><rect x="6" y="36" width="30" height="20" rx="5"/><rect x="45" y="36" width="30" height="20" rx="5"/></svg></span>'
    + '<span class="v5-h-tit">Resumen VGI'+(nVGI?'<span class="v5-badge">'+nVGI+'</span>':'')+'</span>'
    + '<span class="v5-h-txt">Reúne los resultados de esta valoración y cópialos a la historia clínica.</span>'
    + resumenVivo()
    + '<span class="v5-h-ir">'+ICO.flecha+'</span></button>'
    + '<button class="v5-h v5-h-opi" data-open="opioides">'
    + '<span class="v5-h-viz" aria-hidden="true"><svg viewBox="0 0 120 64"><path d="M14 22h80M94 22l-12-10M94 22l-12 10"/><path d="M106 44H26M26 44l12-10M26 44l12 10"/></svg></span>'
    + '<span class="v5-h-tit">Conversor de opioides</span>'
    + '<span class="v5-h-txt">Dosis equianalgésicas, reducción por tolerancia cruzada incompleta y rescates.</span>'
    + '<span class="v5-h-ir">'+ICO.flecha+'</span></button>'
    + '<button class="v5-h v5-h-tray" data-tab="tray">'
    + '<span class="v5-h-viz" aria-hidden="true"><svg viewBox="0 0 120 64"><line class="v5-h-base" x1="4" y1="14" x2="116" y2="14"/><line class="v5-h-cae" pathLength="1" x1="10" y1="14" x2="60" y2="50"/><line class="v5-h-sube" pathLength="1" x1="60" y1="50" x2="110" y2="24"/><circle cx="10" cy="14" r="4.5"/><circle cx="60" cy="50" r="4.5"/><circle cx="110" cy="24" r="4.5"/></svg></span>'
    + '<span class="v5-h-tit">Trayectoria</span>'
    + '<span class="v5-h-txt">Compare mediciones en el tiempo: pérdida y recuperación en el hospital, declinación o ganancia en la consulta.</span>'
    + '<span class="v5-h-ir">'+ICO.flecha+'</span></button>'
    + '</div></section>'
    + '<footer class="v5-pie">'
    + '<span>'+ICO.candado+'Datos procesados localmente en este dispositivo</span>'
    + '<span>Basada en "Abordaje geriátrico integral: escalas de uso frecuente en geriatría" (Editorial PUJ, 2024)</span>'
    + '<button data-act="about">Acerca de VGI Digital</button>'
    + '</footer>';

  contar($('#view'));
};

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
    const qi = document.getElementById('q');
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

function indiceHTML(){
  return '<nav class="v5-indice" aria-label="Grupos del eje">'
    + ORDER[state.eje].map((g,i)=>'<button data-v5="ir" data-i="'+i+'"><span>'+(i+1)+'</span>'+esc(g.g)+'</button>').join('')
    + '</nav>';
}

renderList = function(){
  if(V5.ejePrev!==state.eje){ V5.tipo='todas'; V5.ejePrev=state.eje; }
  const e = ejeInfo(state.eje);
  const k = EJES.indexOf(e);
  const ids = idsEje(state.eje);
  $('#view').innerHTML =
    '<section class="v5-banda" style="--eje:var(--'+e.id+')">'
    + '<span class="v5-banda-ico" aria-hidden="true">'+tabIcon(e.id)+'</span>'
    + '<span class="v5-eyebrow">Eje '+NUM[k]+' de '+NUM[EJES.length-1]+'</span>'
    + '<h2>'+esc(ejeNombre(e))+'</h2>'
    + '<p>'+esc(EJE_INTRO[e.id])+'</p>'
    + '<div class="v5-banda-cifras">'
    + '<span><b>'+ids.length+'</b> instrumentos</span>'
    + '<span><b>'+ORDER[e.id].length+'</b> grupos</span>'
    + '<span><b>'+nItems(ids)+'</b> ítems</span>'
    + '</div>'
    + '<div class="v5-banda-ejes" aria-label="Cambiar de eje">'
    + EJES.map((x,j)=>'<button data-tab="'+x.id+'" style="--eje:var(--'+x.id+')" aria-current="'+(x.id===e.id)+'" title="'+esc(ejeNombre(x))+'">'+NUM[j]+'</button>').join('')
    + '</div></section>'
    + '<div class="v5-barra">'
    + '<div class="search">'+ICO.buscar
    + '<input id="q" type="search" placeholder="Buscar en las '+ALL_IDS.filter(esEscala).length+' escalas" value="'+esc(state.q)+'" autocomplete="off">'
    + (state.q?'<button class="clr" data-act="clearq" aria-label="Limpiar">&times;</button>':'')
    + '</div>'
    + (state.q ? '' : filtrosHTML())
    + '</div>'
    + (state.q ? '' : rapidasHTML() + indiceHTML())
    + '<div id="list">'+listInner()+'</div>';
};

/* ---------- Navegación: misma estructura, con cifras por eje ---------- */
const renderTabsBase = renderTabs;
renderTabs = function(){
  renderTabsBase();
  const tabs = $('#tabs');
  const marca = tabs.querySelector('.nav-brand small');
  if(marca && VERSION) marca.textContent = 'Versión '+VERSION;
  EJES.forEach((e,k)=>{
    const b = tabs.querySelector('button[data-tab="'+e.id+'"]');
    if(b && !b.querySelector('.v5-tab-n')){
      const s = document.createElement('span');
      s.className = 'v5-tab-n'; s.textContent = idsEje(e.id).length;
      b.appendChild(s);
    }
  });
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
render = function(){
  if(state.view!=='tray') V5.trayVisto = null;
  renderBaseV5();
};

/* ---------- Acciones propias de la capa ---------- */
document.addEventListener('click', e=>{
  const b = e.target.closest('[data-v5]');
  if(!b) return;
  const a = b.dataset.v5;
  if(a==='paso'){
    const eje = b.dataset.eje, i = +b.dataset.i;
    V5.abiertos[eje] = V5.abiertos[eje]===i ? undefined : i;
    const mod = b.closest('.v5-mod');
    mod.querySelectorAll('.v5-paso').forEach((li,j)=>{
      const ab = V5.abiertos[eje]===j;
      li.classList.toggle('abierto', ab);
      li.querySelector('.v5-paso-btn').setAttribute('aria-expanded', ab);
    });
  }
  if(a==='tipo'){
    V5.tipo = b.dataset.tipo;
    document.querySelectorAll('.v5-filtros button').forEach(x=>x.setAttribute('aria-pressed', x===b));
    const box = document.getElementById('list');
    if(box){ box.innerHTML = listInner(); animarLista(); }
  }
  if(a==='ir'){
    const g = document.getElementById('v5g'+b.dataset.i);
    if(g){
      const y = g.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({top:y, behavior: MOV_REDUCIDO ? 'instant' : 'smooth'});
    } else if(V5.tipo!=='todas'){
      V5.tipo='todas'; render();
      const g2 = document.getElementById('v5g'+b.dataset.i);
      if(g2) window.scrollTo({top:g2.getBoundingClientRect().top + window.scrollY - 110});
    }
  }
  if(a==='item'){
    const it = document.getElementById('it'+b.dataset.i);
    if(it){
      const y = it.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({top:y, behavior: MOV_REDUCIDO ? 'instant' : 'smooth'});
    }
  }
});

document.documentElement.classList.add('v5');
render();
})();
