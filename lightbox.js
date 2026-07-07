// ═══════════════════════════════════════════════════════════════════════════
// LIGHTBOX PHOTOS — carrousel partagé Carnet + Horizon (un seul endroit).
// Sujet (05/07, retour Bruno) : "le beau défiler de photos du Carnet" doit
// être disponible partout où une fiche riche s'affiche, sans reconstruire un
// second carrousel à côté. Construit son propre DOM au premier usage — aucune
// balise à poser dans la page hôte, juste charger ce script.
// Usage : RNR_LIGHTBOX.open(photos /* array d'URLs */, startIdx /* optionnel */)
(function(){
  let photos=[], idx=0, built=false;

  function injectStyle(){
    if(document.getElementById('rnr-lightbox-style')) return;
    const css=`
#rnr-lb{position:fixed;inset:0;background:rgba(15,13,9,.82);z-index:5000;display:none;align-items:center;justify-content:center;padding:20px;}
#rnr-lb.open{display:flex;}
#rnr-lb-inner{background:#1a1710;border-radius:14px;overflow:hidden;max-width:640px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,.6);}
#rnr-lb-main{width:100%;height:420px;background-size:cover;background-position:center;position:relative;}
#rnr-lb-counter{position:absolute;top:10px;right:12px;background:rgba(0,0,0,.5);color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:12px;}
#rnr-lb-close{position:absolute;top:10px;left:12px;background:rgba(0,0,0,.5);color:#fff;border:none;width:32px;height:32px;border-radius:50%;font-size:16px;cursor:pointer;z-index:2;}
#rnr-lb-close:hover{background:rgba(200,50,0,.6);}
.rnr-lb-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.45);color:#fff;border:none;width:38px;height:38px;border-radius:50%;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;}
.rnr-lb-nav:hover{background:rgba(0,0,0,.7);}
#rnr-lb-prev{left:12px;} #rnr-lb-next{right:12px;}
#rnr-lb-thumbs{display:flex;gap:6px;padding:10px 12px;overflow-x:auto;background:#141210;scrollbar-width:thin;}
.rnr-lb-thumb{width:56px;height:42px;flex-shrink:0;background-size:cover;background-position:center;border-radius:6px;cursor:pointer;opacity:.55;border:2px solid transparent;}
.rnr-lb-thumb.active{opacity:1;border-color:var(--gold,#c8a84b);}
`;
    const s=document.createElement('style');
    s.id='rnr-lightbox-style'; s.textContent=css;
    document.head.appendChild(s);
  }

  function ensureDom(){
    if(built) return;
    injectStyle();
    const wrap=document.createElement('div');
    wrap.id='rnr-lb';
    wrap.setAttribute('onclick','if(event.target===this)RNR_LIGHTBOX.close()');
    wrap.innerHTML=`
      <div id="rnr-lb-inner">
        <div id="rnr-lb-main">
          <button id="rnr-lb-close" onclick="RNR_LIGHTBOX.close()">✕</button>
          <span id="rnr-lb-counter"></span>
          <button class="rnr-lb-nav" id="rnr-lb-prev" onclick="RNR_LIGHTBOX.nav(-1)">‹</button>
          <button class="rnr-lb-nav" id="rnr-lb-next" onclick="RNR_LIGHTBOX.nav(1)">›</button>
        </div>
        <div id="rnr-lb-thumbs"></div>
      </div>`;
    document.body.appendChild(wrap);
    document.addEventListener('keydown', e=>{
      if(!document.getElementById('rnr-lb').classList.contains('open')) return;
      if(e.key==='ArrowLeft') nav(-1);
      else if(e.key==='ArrowRight') nav(1);
      else if(e.key==='Escape') close();
    });
    built=true;
  }

  function render(){
    document.getElementById('rnr-lb-main').style.backgroundImage=`url('${photos[idx]}')`;
    document.getElementById('rnr-lb-counter').textContent=(idx+1)+' / '+photos.length;
    document.getElementById('rnr-lb-thumbs').innerHTML=photos.map((u,i)=>
      `<div class="rnr-lb-thumb${i===idx?' active':''}" style="background-image:url('${u}');" onclick="RNR_LIGHTBOX.goTo(${i})"></div>`
    ).join('');
    document.getElementById('rnr-lb-prev').style.display=photos.length>1?'flex':'none';
    document.getElementById('rnr-lb-next').style.display=photos.length>1?'flex':'none';
    document.getElementById('rnr-lb-thumbs').style.display=photos.length>1?'flex':'none';
  }
  function open(list, startIdx){
    if(!list||!list.length) return;
    ensureDom();
    photos=list; idx=startIdx||0;
    document.getElementById('rnr-lb').classList.add('open');
    document.body.style.overflow='hidden';
    render();
  }
  function close(){
    const el=document.getElementById('rnr-lb'); if(!el) return;
    el.classList.remove('open');
    document.body.style.overflow='';
    // Retour Bruno (07/07) : quand le carrousel s'ouvre PAR-DESSUS une grande
    // fiche encore affichée, son propre calque (z-index plus haut) cache le
    // bouton ✕ de la fiche — le seul ✕ cliquable est celui du carrousel. Un
    // seul clic doit donc tout refermer d'un coup. Détection générique (pas
    // de dépendance à Horizon ou au Carnet en particulier) : on ne referme la
    // fiche que si elle existe sur cette page ET qu'elle est réellement
    // ouverte — jamais l'inverse (le carrousel s'ouvre aussi seul, depuis les
    // vignettes des listes, sans fiche à refermer derrière).
    const hzOv=document.getElementById('hz-gf-overlay');
    if(hzOv && hzOv.style.display==='flex' && typeof window.hzFermeGrandeFiche==='function') window.hzFermeGrandeFiche();
    const cnOv=document.getElementById('gf-overlay');
    if(cnOv && cnOv.style.display==='flex' && typeof window.closeGrandeFiche==='function') window.closeGrandeFiche();
  }
  function nav(dir){ idx=(idx+dir+photos.length)%photos.length; render(); }
  function goTo(i){ idx=i; render(); }

  window.RNR_LIGHTBOX = { open, close, nav, goTo };
})();
