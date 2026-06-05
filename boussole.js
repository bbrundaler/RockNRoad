/* ════════════════════════════════════════════════════════════════════════
   RockNRoad — LA BOUSSOLE (composant partagé unique)
   - S'auto-injecte (CSS + HTML + logique) sur toute page incluant ce script.
   - Branché sur tokens.css (aucune couleur de charte en dur ; seuls les
     dégradés métalliques du SVG sont locaux, par nature graphiques).
   - Ergonomie : SURVOL = ouverture directe et cliquable (un seul geste).
   - Ancrée en BAS-DROITE ; la rose se déploie depuis ce coin (trajet court).
   - Effet PEEK actuel = GÉNÉRIQUE LÉGER : le voile s'allège/se dore au survol
     d'une entrée (la page respire, mais ne se transforme pas).
   ───────────────────────────────────────────────────────────────────────
   CHANTIER FUTUR NOTÉ (à faire AVEC le remaniement des pages, pas avant) :
   « RICHE RÉEL » — au survol d'une entrée, la VRAIE page-cible se révèle /
   se charge derrière la rose (Carte → la carte s'illumine, Roadbook → idem).
   Demande un couplage par page (chaque page expose des zones identifiables).
   Décision Bruno (session boussole) : ne PAS le construire maintenant, car les
   pages vont être profondément remaniées ; on l'implémentera à ce moment-là.
   ────────────────────────────────────────────────────────────────────────
   Pour l'ajouter à une page : <script src="boussole.js" defer></script>
   ════════════════════════════════════════════════════════════════════════ */
(function(){
  if(window.__rnrBoussole) return;      // anti-double-injection
  window.__rnrBoussole = true;

  /* ── liens réels (verrouillés session 05/06) ── */
  // actif:true => cliquable ; false => "à venir" (grisé)
  var ENTRIES = {
    hub:      {href:'home.html',          active:true},
    rever:    {href:'#',                  active:false},  // page Carte de France à construire
    creation: {href:'voyage.html',        active:true},
    roadbook: {href:'carnet.html#fiche',  active:true},
    souvenir: {href:'#',                  active:false},  // univers souvenir à construire
    creer:    {href:'admin.html',         active:true},
    fiches:   {href:'#',                  active:false},  // onglet "toutes fiches" à créer
    cockpit:  {href:'#',                  active:false},  // chat / échanges à construire
    carte:    {href:'carnet.html#carte',  active:true}
  };

  /* ── CSS ── */
  var css = `
  .bsl-btn{position:fixed;bottom:22px;right:22px;width:60px;height:70px;
    background:none;border:none;padding:0;cursor:pointer;z-index:1000;
    filter:drop-shadow(0 4px 10px rgba(0,0,0,.5));
    transform:rotate(-12deg);transform-origin:50% 70%;
    transition:transform .4s cubic-bezier(.2,.8,.2,1),filter .3s;}
  .bsl-btn:hover,.bsl-btn.open{transform:rotate(0deg) scale(1.05);
    filter:drop-shadow(0 6px 16px rgba(200,168,75,.35));}
  .bsl-btn svg{width:100%;height:100%;display:block;}

  /* voile LÉGER : on garde la vraie page visible derrière (pas de flou opaque).
     Teinte douce + assombrissement modéré, pour que la rose reste lisible. */
  .bsl-veil{position:fixed;inset:0;
    background:radial-gradient(120% 120% at 100% 100%, rgba(15,13,9,.30), rgba(15,13,9,.52));
    opacity:0;pointer-events:none;transition:opacity .28s, background .3s;z-index:999;}
  .bsl-veil.show{opacity:1;pointer-events:auto;}
  /* survol d'une entrée → la page se révèle davantage (le voile s'allège et se dore) */
  .bsl-veil.peek{
    background:radial-gradient(120% 120% at 100% 100%, rgba(200,168,75,.06), rgba(15,13,9,.30));}

  /* la rose est ANCRÉE en bas-droite, près de la petite boussole — taille moyenne */
  .bsl-rose{position:fixed;right:42px;bottom:50px;width:400px;height:400px;
    max-width:84vw;max-height:72vh;
    transform:scale(.6);transform-origin:bottom right;opacity:0;
    transition:transform .4s cubic-bezier(.2,.8,.2,1),opacity .3s;pointer-events:none;}
  .bsl-veil.show .bsl-rose{transform:scale(1);opacity:1;pointer-events:auto;}

  .bsl-dial{position:absolute;inset:0;pointer-events:none;}
  .bsl-dial svg{width:100%;height:100%;display:block;}

  .bsl-u{position:absolute;left:50%;top:50%;
    display:flex;flex-direction:column;align-items:center;text-align:center;
    text-decoration:none;color:var(--creme,#F5EFE0);cursor:pointer;
    transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y)));}
  .bsl-u .ic{display:grid;place-items:center;border-radius:50%;
    border:1px solid rgba(200,168,75,.22);background:rgba(22,20,16,.62);
    transition:border-color .25s,box-shadow .25s,transform .25s;}
  .bsl-u .ic svg{stroke:var(--gold-light,#E8C86B);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;}
  .bsl-u:hover .ic{border-color:var(--gold,#C8A84B);box-shadow:0 0 0 5px rgba(200,168,75,.14),0 6px 18px rgba(0,0,0,.4);transform:scale(1.1);}
  .bsl-diag:hover .nm{color:var(--gold-light,#E8C86B);}
  .bsl-u .nm{font-family:var(--font-title,'Playfair Display',serif);font-weight:600;margin-top:8px;white-space:nowrap;}

  .bsl-hub{--x:0px;--y:0px;}
  .bsl-hub .ic{width:76px;height:76px;border-color:rgba(200,168,75,.4);
    background:radial-gradient(circle at 50% 35%,rgba(200,168,75,.22),transparent 70%),var(--dark-3,#1E1B14);}
  .bsl-hub .ic svg{width:28px;height:28px;}
  .bsl-hub .nm{font-size:14px;color:var(--gold-light,#E8C86B);margin-top:7px;}

  .bsl-card .ic{display:none;}
  .bsl-card .nm{position:relative;font-size:15px;color:var(--gold-light,#E8C86B);margin-top:0;
    text-shadow:0 1px 6px rgba(15,13,9,.9),0 0 14px rgba(15,13,9,.7);
    max-width:160px;line-height:1.25;padding:8px 14px;border-radius:12px;
    border:1px solid transparent;background:transparent;
    transition:color .2s,background .25s,border-color .25s,transform .25s,box-shadow .25s,letter-spacing .25s;}
  .bsl-card .nm::after{content:"→";display:inline-block;max-width:0;opacity:0;overflow:hidden;
    color:var(--gold-light,#E8C86B);transition:max-width .25s,opacity .25s,margin-left .25s;}
  .bsl-card:hover .nm{color:#fff;background:rgba(200,168,75,.14);border-color:var(--gold,#C8A84B);
    box-shadow:0 0 0 4px rgba(200,168,75,.12),0 6px 22px rgba(0,0,0,.4);transform:scale(1.07);letter-spacing:.02em;}
  .bsl-card:hover .nm::after{max-width:1.4em;opacity:1;margin-left:6px;}

  .bsl-diag .ic{width:54px;height:54px;border-color:rgba(200,168,75,.22);background:rgba(22,20,16,.7);}
  .bsl-diag .ic svg{width:23px;height:23px;stroke:rgba(232,200,107,.78);}
  .bsl-diag .nm{font-size:12px;color:var(--creme,#F5EFE0);font-weight:600;}

  .bsl-u.soon{pointer-events:none;opacity:.34;filter:grayscale(.6);}
  .bsl-u.soon .nm::after{display:none;}
  .bsl-u.soon .ic{border-color:rgba(200,168,75,.12);}
  .bsl-u .tag{display:none;}
  .bsl-u.soon .tag{display:block;font-size:9px;letter-spacing:.06em;text-transform:uppercase;
    color:var(--cream-dim,rgba(245,239,224,.55));margin-top:3px;font-family:var(--font-body,'Inter',sans-serif);font-weight:600;}

  /* positions (cercle, centre 0,0) */
  .bsl-rever{--x:0px;--y:-127px;} .bsl-creation{--x:117px;--y:0px;}
  .bsl-roadbook{--x:0px;--y:127px;} .bsl-souvenir{--x:-117px;--y:0px;}
  .bsl-fiches{--x:70px;--y:-70px;} .bsl-creer{--x:-70px;--y:-70px;}
  .bsl-cockpit{--x:-70px;--y:70px;} .bsl-carte{--x:70px;--y:70px;}
  @media(max-width:600px){
    .bsl-rose{right:40px;bottom:48px;width:88vw;height:88vw;}
    .bsl-hub .ic{width:84px;height:84px;}
    .bsl-rever{--y:-150px;} .bsl-roadbook{--y:150px;}
    .bsl-creation{--x:140px;} .bsl-souvenir{--x:-140px;}
    .bsl-fiches{--x:82px;--y:-82px;} .bsl-creer{--x:-82px;--y:-82px;}
    .bsl-cockpit{--x:-82px;--y:82px;} .bsl-carte{--x:82px;--y:82px;}
  }`;

  /* ── labels ── */
  var LABELS = {
    rever:'Alors,<br>on part où ?', creation:'On finalise<br>le voyage',
    roadbook:'Roadbook', souvenir:'Souvenir',
    creer:'Création fiche', fiches:'Liste fiches', cockpit:'Cockpit', carte:'Carte'
  };
  var ICONS = {
    hub:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9h14v-9"/><path d="M10 19v-5h4v5"/>',
    creer:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    fiches:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    cockpit:'<path d="M3 13h4l2 5 4-12 2 7h6"/>',
    carte:'<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>'
  };

  function entry(key, kind){
    var e = ENTRIES[key], soon = e.active ? '' : ' soon';
    var cls = 'bsl-u bsl-'+kind+' bsl-'+key+soon;
    var href = e.active ? e.href : '#';
    var dis = e.active ? '' : ' aria-disabled="true"';
    var tag = e.active ? '' : '<span class="tag">à venir</span>';
    var inner;
    if(kind==='card'){ inner = '<span class="nm">'+LABELS[key]+tag+'</span>'; }
    else if(kind==='hub'){ inner = '<span class="ic"><svg viewBox="0 0 24 24">'+ICONS.hub+'</svg></span>'; }
    else { inner = '<span class="ic"><svg viewBox="0 0 24 24">'+ICONS[key]+'</svg></span><span class="nm">'+LABELS[key]+tag+'</span>'; }
    return '<a class="'+cls+'" href="'+href+'"'+dis+'>'+inner+'</a>';
  }

  /* ── petite boussole + cadran (SVG) ── */
  var btnSVG = '<svg viewBox="0 0 100 116" xmlns="http://www.w3.org/2000/svg">'
    +'<defs>'
    +'<radialGradient id="bslBrassBody" cx="38%" cy="30%" r="80%"><stop offset="0%" stop-color="#F5DD96"/><stop offset="35%" stop-color="#D4B458"/><stop offset="70%" stop-color="#9c7b2e"/><stop offset="100%" stop-color="#5c4716"/></radialGradient>'
    +'<radialGradient id="bslBrassRim" cx="42%" cy="32%" r="75%"><stop offset="0%" stop-color="#FCEBB0"/><stop offset="55%" stop-color="#C8A84B"/><stop offset="100%" stop-color="#6e561d"/></radialGradient>'
    +'<radialGradient id="bslFaceBg" cx="44%" cy="38%" r="68%"><stop offset="0%" stop-color="#3a3322"/><stop offset="55%" stop-color="#241f15"/><stop offset="100%" stop-color="#0e0b06"/></radialGradient>'
    +'<linearGradient id="bslRingGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F5DD96"/><stop offset="100%" stop-color="#6e561d"/></linearGradient>'
    +'<radialGradient id="bslGlass" cx="35%" cy="28%" r="60%"><stop offset="0%" stop-color="rgba(245,239,224,.28)"/><stop offset="40%" stop-color="rgba(245,239,224,.06)"/><stop offset="100%" stop-color="rgba(245,239,224,0)"/></radialGradient>'
    +'</defs>'
    +'<ellipse cx="50" cy="10" rx="8.5" ry="9.5" fill="none" stroke="url(#bslRingGrad)" stroke-width="4"/>'
    +'<ellipse cx="50" cy="10" rx="8.5" ry="9.5" fill="none" stroke="#4a3912" stroke-width="1" opacity=".5"/>'
    +'<path d="M44 18 Q50 24 56 18 L54 26 Q50 29 46 26 Z" fill="url(#bslRingGrad)" stroke="#4a3912" stroke-width=".6"/>'
    +'<circle cx="50" cy="66" r="40" fill="url(#bslBrassBody)"/>'
    +'<circle cx="50" cy="66" r="40" fill="none" stroke="#4a3912" stroke-width="1.2"/>'
    +'<path d="M22 46 A40 40 0 0 1 64 30" fill="none" stroke="rgba(255,248,220,.5)" stroke-width="3" stroke-linecap="round"/>'
    +'<circle cx="50" cy="66" r="34" fill="url(#bslBrassRim)"/>'
    +'<circle cx="50" cy="66" r="34" fill="none" stroke="#4a3912" stroke-width=".8"/>'
    +'<circle cx="50" cy="66" r="31" fill="#1a1610"/>'
    +'<circle cx="50" cy="66" r="29.5" fill="url(#bslFaceBg)"/>'
    +'<g id="bslMgrad"></g><g id="bslMrose"></g>'
    +'<circle cx="50" cy="66" r="3.4" fill="url(#bslBrassRim)" stroke="#4a3912" stroke-width=".6"/>'
    +'<circle cx="50" cy="66" r="1.3" fill="#1a1610"/>'
    +'<circle cx="50" cy="66" r="29.5" fill="url(#bslGlass)"/>'
    +'<ellipse cx="40" cy="52" rx="13" ry="8" fill="rgba(245,239,224,.10)" transform="rotate(-25 40 52)"/>'
    +'</svg>';

  var dialSVG = '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
    +'<defs>'
    +'<radialGradient id="bslFace" cx="50%" cy="42%" r="62%"><stop offset="0%" stop-color="#211d14"/><stop offset="62%" stop-color="#161410"/><stop offset="100%" stop-color="#0c0a07"/></radialGradient>'
    +'<linearGradient id="bslBrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E8C86B"/><stop offset="50%" stop-color="#C8A84B"/><stop offset="100%" stop-color="#7a5f24"/></linearGradient>'
    +'</defs>'
    +'<circle cx="200" cy="200" r="196" fill="none" stroke="url(#bslBrass)" stroke-width="7"/>'
    +'<circle cx="200" cy="200" r="186" fill="none" stroke="rgba(200,168,75,.35)" stroke-width="1.5"/>'
    +'<circle cx="200" cy="200" r="182" fill="url(#bslFace)"/>'
    +'<g id="bslTicks"></g>'
    +'<g opacity="0.28">'
    +'<polygon points="200,40 210,200 200,200 190,200" fill="rgba(232,200,107,.30)"/>'
    +'<polygon points="360,200 200,210 200,200 200,190" fill="rgba(232,200,107,.18)"/>'
    +'<polygon points="200,360 190,200 200,200 210,200" fill="rgba(232,200,107,.18)"/>'
    +'<polygon points="40,200 200,190 200,200 200,210" fill="rgba(232,200,107,.18)"/>'
    +'</g>'
    +'<polygon points="200,70 208,200 200,210 192,200" fill="#E8C86B"/>'
    +'<polygon points="200,330 192,200 200,190 208,200" fill="rgba(120,95,40,.8)"/>'
    +'<circle cx="200" cy="200" r="7" fill="url(#bslBrass)" stroke="#7a5f24" stroke-width="1"/>'
    +'<circle cx="200" cy="200" r="2.5" fill="#211d14"/>'
    +'</svg>';

  /* ── injection DOM ── */
  function init(){
    var style = document.createElement('style'); style.id='bsl-style'; style.textContent=css;
    document.head.appendChild(style);

    var btn = document.createElement('button');
    btn.className='bsl-btn'; btn.id='bslBtn';
    btn.setAttribute('aria-label','Ouvrir la boussole'); btn.setAttribute('aria-expanded','false');
    btn.innerHTML = btnSVG;

    var veil = document.createElement('div'); veil.className='bsl-veil'; veil.id='bslVeil';
    veil.innerHTML = '<div class="bsl-rose">'
      + '<div class="bsl-dial">'+dialSVG+'</div>'
      + entry('hub','hub')
      + entry('rever','card') + entry('creation','card') + entry('roadbook','card') + entry('souvenir','card')
      + entry('creer','diag') + entry('fiches','diag') + entry('cockpit','diag') + entry('carte','diag')
      + '</div>';

    document.body.appendChild(btn);
    document.body.appendChild(veil);

    drawTicks(); drawMini();

    /* ── ergonomie : SURVOL ouvre directement et reste ; sortie = ferme (délai de grâce) ── */
    var open=false, closeTimer=null;
    function setOpen(o){
      open=o; veil.classList.toggle('show',o); btn.classList.toggle('open',o);
      btn.setAttribute('aria-expanded',o);
      btn.setAttribute('aria-label',o?'Fermer la boussole':'Ouvrir la boussole');
    }
    function cancelClose(){ if(closeTimer){clearTimeout(closeTimer);closeTimer=null;} }
    function scheduleClose(){ cancelClose(); closeTimer=setTimeout(function(){setOpen(false);},260); }

    btn.addEventListener('mouseenter',function(){cancelClose();setOpen(true);});
    btn.addEventListener('mouseleave',scheduleClose);
    btn.addEventListener('click',function(){setOpen(!open);});   // clic = bascule (tactile/repli)
    var rose = veil.querySelector('.bsl-rose');
    rose.addEventListener('mouseenter',cancelClose);
    rose.addEventListener('mouseleave',scheduleClose);
    veil.addEventListener('click',function(e){if(e.target===veil)setOpen(false);});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')setOpen(false);});

    /* ── effet PEEK : survol d'une entrée (active) → la page se révèle derrière ── */
    veil.querySelectorAll('.bsl-u:not(.soon)').forEach(function(u){
      u.addEventListener('mouseenter',function(){veil.classList.add('peek');});
      u.addEventListener('mouseleave',function(){veil.classList.remove('peek');});
    });
  }

  function drawTicks(){
    var g=document.getElementById('bslTicks'); if(!g)return;
    var cx=200,cy=200,r=178,ns='http://www.w3.org/2000/svg';
    for(var i=0;i<72;i++){
      var a=i*5*Math.PI/180, maj=(i%9===0), len=maj?13:6, w=maj?2:1, op=maj?0.6:0.3;
      var l=document.createElementNS(ns,'line');
      l.setAttribute('x1',(cx+Math.sin(a)*r).toFixed(1));l.setAttribute('y1',(cy-Math.cos(a)*r).toFixed(1));
      l.setAttribute('x2',(cx+Math.sin(a)*(r-len)).toFixed(1));l.setAttribute('y2',(cy-Math.cos(a)*(r-len)).toFixed(1));
      l.setAttribute('stroke','rgba(200,168,75,'+op+')');l.setAttribute('stroke-width',w);
      g.appendChild(l);
    }
  }
  function drawMini(){
    var ns='http://www.w3.org/2000/svg', cx=50, cy=66;
    var gg=document.getElementById('bslMgrad'), gr=document.getElementById('bslMrose');
    if(!gg||!gr)return;
    for(var i=0;i<72;i++){
      var a=i*5*Math.PI/180, maj=(i%9===0), r=28.5, len=maj?3.4:1.6;
      var l=document.createElementNS(ns,'line');
      l.setAttribute('x1',(cx+Math.sin(a)*r).toFixed(2));l.setAttribute('y1',(cy-Math.cos(a)*r).toFixed(2));
      l.setAttribute('x2',(cx+Math.sin(a)*(r-len)).toFixed(2));l.setAttribute('y2',(cy-Math.cos(a)*(r-len)).toFixed(2));
      l.setAttribute('stroke','rgba(200,168,75,'+(maj?.7:.32)+')');l.setAttribute('stroke-width',maj?'.9':'.5');
      gg.appendChild(l);
    }
    [['N',0],['E',90],['S',180],['O',270]].forEach(function(p){
      var a=p[1]*Math.PI/180, r=22.5, t=document.createElementNS(ns,'text');
      t.setAttribute('x',(cx+Math.sin(a)*r).toFixed(2));t.setAttribute('y',(cy-Math.cos(a)*r+2.6).toFixed(2));
      t.setAttribute('text-anchor','middle');t.setAttribute('fill','rgba(232,200,107,.72)');
      t.setAttribute('font-family',"'Playfair Display',serif");t.setAttribute('font-style','italic');t.setAttribute('font-size','6');
      t.textContent=p[0];gg.appendChild(t);
    });
    var R_long=19,R_short=11,w=2.6;
    for(var k=0;k<8;k++){
      var deg=k*45,a=deg*Math.PI/180,r2=(k%2===0)?R_long:R_short;
      var tipx=cx+Math.sin(a)*r2,tipy=cy-Math.cos(a)*r2,px=Math.cos(a)*w,py=Math.sin(a)*w;
      var h1=document.createElementNS(ns,'polygon');
      h1.setAttribute('points',tipx.toFixed(2)+','+tipy.toFixed(2)+' '+(cx+px).toFixed(2)+','+(cy+py).toFixed(2)+' '+cx+','+cy);
      h1.setAttribute('fill',(k%2===0)?'#EBCB72':'#caa746');gr.appendChild(h1);
      var h2=document.createElementNS(ns,'polygon');
      h2.setAttribute('points',tipx.toFixed(2)+','+tipy.toFixed(2)+' '+(cx-px).toFixed(2)+','+(cy-py).toFixed(2)+' '+cx+','+cy);
      h2.setAttribute('fill',(k%2===0)?'#8a6a2b':'#6e561d');gr.appendChild(h2);
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
