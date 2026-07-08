/* ════════════════════════════════════════════════════════════════════════
   RockNRoad — LE CHROME (composant partagé, Charte Design v1)
   La « couverture en cuir » : barre de navigation classique (haut) +
   barre d'onglets mobile (bas) + bascule de thème clair/sombre.

   - S'auto-injecte (CSS + HTML + logique) sur toute page incluant ce script,
     sur le modèle éprouvé de boussole.js. Préfixe de classes : rnrc-.
   - Branché sur tokens.css v2 (rôles + invariants chrome) : zéro couleur
     de charte en dur.
   - POSE data-theme sur <html> : c'est l'interrupteur qui « convertit »
     la page (active [data-theme] body de app.css v2). Thème mémorisé
     en localStorage ('rnr-theme'), défaut : 'clair' (carnet ouvert).
   - Quitter : appelle la fonction globale logout() de la page si elle
     existe (déconnexion Supabase), sinon repli vers index.html.
   - Nom du groupe : 'Mon groupe' par défaut ; la page peut le préciser
     via  rnrChrome.setGroupe('Famille Brundaler').
   - Console plateforme (niveau A) : masquée par défaut, révélée uniquement
     si la page appelle  rnrChrome.setSuperAdmin(true)  après vérification
     Supabase de is_superadmin. Jamais visible côté client seul.
   - Phase en cours (pastille d'or sous l'univers actif de la phase) :
     constante PHASE ci-dessous. Branchement futur : config_plateforme
     (Console Admin) — ne pas inventer d'autre mécanisme d'ici là.
   - Mobile (<700px) : la barre du haut se réduit (logo + thème + quitter),
     la navigation passe en tabbar basse ; la Boussole remonte au-dessus.

   INCLUSION : <script src="chrome.js"></script> dans le <head>, SANS defer
   (le thème doit se poser avant le premier rendu pour éviter le flash).
   ════════════════════════════════════════════════════════════════════════ */
(function(){
  if(window.__rnrChrome) return;          /* anti-double-injection */
  window.__rnrChrome = true;

  /* ── Réglages ── */
  var PHASE = 'carnet';                   /* univers de la phase EN COURS (→ config_plateforme plus tard) */
  var LINKS = [
    {id:'hub',      label:'Accueil',  href:'home.html'},
    {id:'horizon',  label:'Horizon',  href:'horizon.html'},
    {id:'carnet',   label:'Carnet',   href:'carnet.html'},
    /* Cockpit retiré (02/07, B18-Inc.D) : fusionné dans Horizon — le débat,
       le vote et la main du leader vivent désormais sur la carte d'Horizon. */
    {id:'voyage',   label:'Roadbook', href:'voyage.html'},
    {id:'souvenir', label:'Souvenir', href:'souvenir.html'}
  ];
  var ICONS = {hub:'🏠', horizon:'🌅', carnet:'📖', voyage:'🗺️', souvenir:'📸'};

  /* ── 1 · THÈME : posé IMMÉDIATEMENT (avant le rendu) ── */
  var theme = 'clair';
  try { theme = localStorage.getItem('rnr-theme') || 'clair'; } catch(e){}
  if(theme !== 'clair' && theme !== 'sombre') theme = 'clair';
  document.documentElement.setAttribute('data-theme', theme);

  /* ── 2 · CSS du chrome ── */
  var css = ''
  +'.rnrc-nav{height:56px;display:flex;align-items:center;gap:26px;padding:0 24px;'
  +'background:var(--chrome-bg);border-bottom:1px solid var(--gold-a20);'
  +'position:sticky;top:0;z-index:900;}'
  +'.rnrc-logo{font-family:var(--font-title);font-size:19px;color:var(--chrome-ink);'
  +'text-decoration:none;white-space:nowrap;}'
  +'.rnrc-logo em{color:var(--gold);font-style:italic;}'
  +'.rnrc-links{display:flex;gap:2px;flex:1;}'
  +'.rnrc-links a{font-size:14.5px;font-weight:500;color:var(--chrome-ink-dim);'
  +'text-decoration:none;padding:7px 13px;border-radius:var(--r-pill);'
  +'transition:color .15s,background .15s;position:relative;font-family:var(--font-body);}'
  +'.rnrc-links a:hover{color:var(--chrome-ink);background:var(--gold-a10);}'
  +'.rnrc-links a.rnrc-on{color:var(--gold-light);background:var(--gold-a10);}'
  +'.rnrc-links a.rnrc-phase::after{content:"";position:absolute;left:50%;bottom:1px;'
  +'transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:var(--gold);}'
  +'.rnrc-right{display:flex;align-items:center;gap:12px;}'
+'.rnrc-add{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;'
+'letter-spacing:.5px;color:var(--gold);background:var(--gold-a10);'
+'border:1px solid var(--gold-a35);border-radius:var(--r-pill);'
+'padding:6px 13px;text-decoration:none;white-space:nowrap;'
+'transition:background .15s,color .15s;font-family:var(--font-body);}'
+'.rnrc-add:hover{background:var(--gold);color:var(--chrome-bg);}'
+'@media(max-width:700px){.rnrc-add span.rnrc-add-label{display:none;}}'
  +'.rnrc-voyage-wrap{position:relative;display:flex;align-items:center;margin-right:6px;}'
  +'.rnrc-voyage{font-family:var(--font-title);font-size:16px;font-weight:600;color:var(--gold-light);'
  +'background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:8px;}'
  +'.rnrc-voyage:hover{background:var(--gold-a10);}'
  +'.rnrc-voyage .rnrc-vy-caret{font-size:10px;opacity:.7;}'
  +'.rnrc-vy-menu{position:absolute;top:100%;left:0;margin-top:4px;background:var(--chrome-bg);'
  +'border:1px solid var(--gold-a35);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.4);'
  +'min-width:210px;padding:5px;z-index:1000;display:none;}'
  +'.rnrc-vy-menu.open{display:block;}'
  +'.rnrc-vy-item{display:block;width:100%;text-align:left;font-size:13.5px;color:var(--chrome-ink);'
  +'background:none;border:none;cursor:pointer;padding:8px 10px;border-radius:7px;font-family:var(--font-body);}'
  +'.rnrc-vy-item:hover{background:var(--gold-a10);}'
  +'.rnrc-vy-item.actif{color:var(--gold-light);font-weight:600;}'
  +'.rnrc-vy-sep{height:1px;background:var(--gold-a20);margin:5px 0;}'
  +'.rnrc-vy-new{color:var(--gold-light);font-weight:600;}'
  +'.rnrc-vy-modifier{text-decoration:none;}'
  +'@media(max-width:700px){.rnrc-voyage{font-size:14px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}}'
  +'.rnrc-groupe{font-size:13.5px;color:var(--chrome-ink-dim);text-decoration:none;'
  +'white-space:nowrap;font-family:var(--font-body);}'
  +'.rnrc-groupe:hover{color:var(--gold-light);}'
  +'.rnrc-console{width:30px;height:30px;border-radius:50%;cursor:pointer;display:none;'
  +'background:var(--gold-a10);border:1px solid var(--gold-a35);font-size:14px;'
  +'display:none;align-items:center;justify-content:center;text-decoration:none;'
  +'transition:background .15s;color:var(--chrome-ink-dim);}'
  +'.rnrc-console:hover{background:var(--gold-a20);color:var(--gold-light);}'
  +'.rnrc-console.rnrc-sa-visible{display:flex;}'
  +'.rnrc-theme{width:34px;height:34px;border-radius:50%;cursor:pointer;'
  +'background:var(--gold-a10);border:1px solid var(--gold-a35);font-size:15px;'
  +'display:flex;align-items:center;justify-content:center;transition:background .15s;padding:0;}'
  +'.rnrc-theme:hover{background:var(--gold-a20);}'
  +'.rnrc-quit{font-family:var(--font-body);font-size:13px;font-weight:600;'
  +'padding:6px 13px;border-radius:var(--r-pill);cursor:pointer;'
  +'background:transparent;color:var(--chrome-ink-dim);border:1px solid rgba(245,239,224,.18);'
  +'transition:all .15s;}'
  +'.rnrc-quit:hover{color:var(--chrome-ink);border-color:rgba(245,239,224,.35);}'
  +'.rnrc-tabbar{display:none;}'
  +'.rnrc-footer{text-align:center;padding:8px 16px calc(8px + env(safe-area-inset-bottom));'
  +'border-top:1px solid var(--gold-a20);margin-top:10px;}'
  +'.rnrc-footer a{font-size:12px;color:var(--ink-dim);text-decoration:none;'
  +'font-family:var(--font-body);}'
  +'.rnrc-footer a:hover{color:var(--gold-light);text-decoration:underline;}'
  +'@media(max-width:700px){.rnrc-footer{margin-bottom:70px;}}'  /* au-dessus de la tabbar */
  +'@media(max-width:700px){'
  +'.rnrc-links,.rnrc-groupe{display:none;}'
  +'.rnrc-nav{gap:12px;justify-content:space-between;}'
  +'.rnrc-tabbar{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:950;'
  +'background:var(--chrome-bg);border-top:1px solid var(--gold-a20);'
  +'padding:6px 4px calc(6px + env(safe-area-inset-bottom));}'
  +'.rnrc-tabbar a{flex:1;text-align:center;font-size:10px;color:var(--chrome-ink-dim);'
  +'text-decoration:none;padding:4px 0;font-family:var(--font-body);}'
  +'.rnrc-tabbar a span{display:block;font-size:18px;margin-bottom:1px;}'
  +'.rnrc-tabbar a.rnrc-on{color:var(--gold-light);}'
  +'body{padding-bottom:70px;}'
  +'.bsl-btn{bottom:84px !important;}'   /* la Boussole remonte au-dessus de la tabbar */
  +'}'
  /* ── Barre d'avatars + présence (08/07) — un coin en haut à droite,
     partout, posé par ce seul fichier. ── */
  +'.rnrc-avs{display:flex;align-items:center;margin-right:4px;}'
  +'.rnrc-av{position:relative;width:32px;height:32px;border-radius:50%;margin-left:-8px;'
  +'border:2px solid var(--chrome-bg);cursor:pointer;display:flex;align-items:center;justify-content:center;'
  +'font-size:14px;font-weight:800;color:#fff;overflow:hidden;background-size:cover;background-position:center;'
  +'transition:transform .15s;}'
  +'.rnrc-av:hover{transform:translateY(-2px);z-index:5;}'
  +'.rnrc-av:first-child{margin-left:0;}'
  +'.rnrc-av-dot{position:absolute;bottom:-1px;right:-1px;width:9px;height:9px;border-radius:50%;'
  +'background:#5cb85c;border:2px solid var(--chrome-bg);display:none;}'
  +'.rnrc-av-dot.on{display:block;}'
  +'.rnrc-av-plus{background:var(--gold-a10);color:var(--gold-light);border:2px solid var(--chrome-bg);font-size:11px;}'
  +'.rnrc-av-tip{position:absolute;top:calc(100% + 8px);right:0;background:var(--chrome-bg);color:var(--chrome-ink);'
  +'border:1px solid var(--gold-a35);border-radius:8px;padding:5px 10px;font-size:11.5px;white-space:nowrap;'
  +'box-shadow:0 6px 18px rgba(0,0,0,.3);display:none;z-index:1500;font-family:var(--font-body);}'
  +'.rnrc-av:hover .rnrc-av-tip{display:block;}'
  +'@media(max-width:700px){.rnrc-avs{display:none;}}'  /* mobile : place limitée, tabbar prioritaire (v1) */
  /* Modale profil membre */
  +'#rnrc-profil-overlay{position:fixed;inset:0;background:rgba(15,13,9,.72);z-index:9500;display:none;'
  +'align-items:flex-start;justify-content:center;padding:70px 16px;overflow-y:auto;}'
  +'#rnrc-profil-overlay.open{display:flex;}'
  +'#rnrc-profil-modal{background:var(--paper,#FFFDF8);border-radius:16px;width:100%;max-width:420px;'
  +'font-family:var(--font-body,\'Inter\',sans-serif);color:var(--ink,#211a10);}'
  +'.rnrc-pf-tete{padding:20px 22px 14px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--surface-line);}'
  +'.rnrc-pf-av{width:52px;height:52px;border-radius:50%;background-size:cover;background-position:center;'
  +'display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;flex-shrink:0;}'
  +'.rnrc-pf-tete h3{font-family:var(--font-title,\'Playfair Display\',serif);font-size:17px;margin:0;flex:1;}'
  +'.rnrc-pf-tete p{margin:2px 0 0;font-size:11.5px;color:var(--ink-dim);}'
  +'.rnrc-pf-close{background:none;border:none;font-size:18px;cursor:pointer;color:var(--ink-dim);}'
  +'.rnrc-pf-corps{padding:16px 22px;display:flex;flex-direction:column;gap:12px;max-height:60vh;overflow-y:auto;}'
  +'.rnrc-pf-lbl{font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-dim);margin-bottom:4px;display:block;}'
  +'.rnrc-pf-corps input,.rnrc-pf-corps select,.rnrc-pf-corps textarea{width:100%;padding:8px 10px;'
  +'border:1.5px solid var(--surface-line);border-radius:8px;font-family:inherit;font-size:13px;color:var(--ink);'
  +'background:var(--paper);box-sizing:border-box;}'
  +'.rnrc-pf-corps textarea{resize:vertical;min-height:60px;}'
  +'.rnrc-pf-chips{display:flex;flex-wrap:wrap;gap:6px;}'
  +'.rnrc-pf-chip{padding:5px 11px;border-radius:16px;border:1.5px solid var(--surface-line);background:var(--paper);'
  +'font-size:11.5px;cursor:pointer;color:var(--ink-dim);}'
  +'.rnrc-pf-chip.on{background:var(--gold-a20);border-color:var(--gold);color:var(--ink);font-weight:700;}'
  +'.rnrc-pf-lecture{font-size:13px;line-height:1.6;color:var(--ink);}'
  +'.rnrc-pf-lecture .vide{color:var(--ink-dim);font-style:italic;}'
  +'.rnrc-pf-foot{padding:14px 22px;border-top:1px solid var(--surface-line);}'
  +'.rnrc-pf-foot button{width:100%;padding:10px;background:var(--ink,#211a10);color:var(--gold,#C8A84B);'
  +'border:none;border-radius:8px;font-weight:700;cursor:pointer;font-family:inherit;}';

  /* ── 3 · Construction ── */
  function pageActive(href){
    var p = location.pathname.split('/').pop() || 'index.html';
    return p === href.split('#')[0];
  }
  function lien(l, mobile){
    var a = document.createElement('a');
    a.href = l.href;
    if(mobile){ a.innerHTML = '<span>'+ICONS[l.id]+'</span>'+l.label; }
    else { a.textContent = l.label; }
    if(pageActive(l.href)) a.className = 'rnrc-on';
    /* rnrc-phase désactivé — reprendre quand multi-phases actives */
    return a;
  }

  function inject(){
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    /* barre du haut */
    var nav = document.createElement('nav');
    nav.className = 'rnrc-nav';

    var logo = document.createElement('a');
    logo.className = 'rnrc-logo';
    logo.href = 'home.html';
    logo.innerHTML = 'Rock <em>N</em> Road';
    nav.appendChild(logo);

    var links = document.createElement('div');
    links.className = 'rnrc-links';
    LINKS.forEach(function(l){ links.appendChild(lien(l, false)); });
    nav.appendChild(links);

    var right = document.createElement('div');
    right.className = 'rnrc-right';

    /* Titre du voyage en cours + menu déroulant (à gauche du groupe) */
    var vyWrap = document.createElement('div');
    vyWrap.className = 'rnrc-voyage-wrap';
    var vyBtn = document.createElement('button');
    vyBtn.className = 'rnrc-voyage';
    vyBtn.innerHTML = '<span class="rnrc-vy-nom">—</span><span class="rnrc-vy-caret">▾</span>';
    var vyMenu = document.createElement('div');
    vyMenu.className = 'rnrc-vy-menu';
    vyWrap.appendChild(vyBtn);
    vyWrap.appendChild(vyMenu);
    vyBtn.addEventListener('click', function(e){
      e.stopPropagation();
      vyMenu.classList.toggle('open');
    });
    document.addEventListener('click', function(){ vyMenu.classList.remove('open'); });
    vyWrap.style.display = 'none'; // caché tant qu'aucun voyage n'est posé
    right.appendChild(vyWrap);

    var grp = document.createElement('a');
    grp.className = 'rnrc-groupe';
    grp.href = 'onboarding.html';
    grp.textContent = 'Mon groupe ⚙️';
    right.appendChild(grp);

    /* Console plateforme — cachée par défaut, révélée par setSuperAdmin(true) */
    var cons = document.createElement('a');
    cons.className = 'rnrc-console';
    cons.href = 'console.html';
    cons.title = 'Console plateforme';
    cons.textContent = '🛠️';
    if(pageActive('console.html')) cons.style.color = 'var(--gold-light)';
    right.appendChild(cons);

    var add = document.createElement('a');
    add.className = 'rnrc-add';
    add.href = 'admin.html';
    add.title = 'Créer une nouvelle fiche lieu';
    add.innerHTML = '+ <span class="rnrc-add-label">Fiche</span>';
    right.appendChild(add);

    // Sujet (08/07, retour Bruno) : le lien Conditions vivait ICI ET dans le
    // pied de page — doublon inutile qui encombrait une barre déjà chargée.
    // Retiré d'ici, il ne reste plus qu'à un seul endroit (le pied de page,
    // plus bas dans ce fichier).

    var th = document.createElement('button');
    th.className = 'rnrc-theme';
    th.title = 'Basculer clair / sombre';
    th.textContent = (theme === 'sombre') ? '☀️' : '🌙';
    th.addEventListener('click', function(){
      theme = (theme === 'sombre') ? 'clair' : 'sombre';
      document.documentElement.setAttribute('data-theme', theme);
      th.textContent = (theme === 'sombre') ? '☀️' : '🌙';
      try { localStorage.setItem('rnr-theme', theme); } catch(e){}
    });
    right.appendChild(th);

    var quit = document.createElement('button');
    quit.className = 'rnrc-quit';
    quit.title = 'Se déconnecter';
    quit.textContent = 'Quitter';
    quit.addEventListener('click', function(){
      if(typeof window.logout === 'function'){ window.logout(); }
      else { window.location.href = 'index.html'; }
    });
    right.appendChild(quit);

    nav.appendChild(right);
    document.body.insertAdjacentElement('afterbegin', nav);

    /* tabbar mobile */
    var tab = document.createElement('nav');
    tab.className = 'rnrc-tabbar';
    LINKS.forEach(function(l){ tab.appendChild(lien(l, true)); });
    document.body.appendChild(tab);

    /* pied de page partagé — lien CGU présent sur toutes les pages */
    if(pageActive('cgu.html') === false){
      var footer = document.createElement('footer');
      footer.className = 'rnrc-footer';
      var fcgu = document.createElement('a');
      fcgu.href = 'cgu.html';
      fcgu.textContent = "Conditions d'utilisation";
      footer.appendChild(fcgu);
      document.body.appendChild(footer);
    }

    /* API minimale pour les pages */
    window.rnrChrome = {
      setGroupe:     function(nom){ if(nom){ grp.textContent = nom + ' ⚙️'; } },
      setSuperAdmin: function(ok){ if(ok){ cons.classList.add('rnrc-sa-visible'); } },
      /* setVoyage(actifNom, liste[{id,nom}], onChange(id|'__new__')) */
      setVoyage: function(actifNom, liste, onChange){
        if(!actifNom){ vyWrap.style.display = 'none'; return; }
        vyWrap.style.display = 'flex';
        vyBtn.querySelector('.rnrc-vy-nom').textContent = actifNom;
        vyMenu.innerHTML = '';
        (liste||[]).forEach(function(v){
          var it = document.createElement('button');
          it.className = 'rnrc-vy-item' + (v.nom===actifNom ? ' actif' : '');
          it.textContent = v.nom;
          it.addEventListener('click', function(e){
            e.stopPropagation(); vyMenu.classList.remove('open');
            if(typeof onChange==='function') onChange(v.id);
          });
          vyMenu.appendChild(it);
        });
        var sep = document.createElement('div'); sep.className='rnrc-vy-sep'; vyMenu.appendChild(sep);
        var mod = document.createElement('a');
        mod.className = 'rnrc-vy-item rnrc-vy-modifier';
        mod.href = 'voyage.html?modifier=1';
        mod.textContent = '✏️ Modifier ce voyage';
        vyMenu.appendChild(mod);
        var sep2 = document.createElement('div'); sep2.className='rnrc-vy-sep'; vyMenu.appendChild(sep2);
        var nw = document.createElement('button');
        nw.className = 'rnrc-vy-item rnrc-vy-new';
        nw.textContent = '+ Nouveau voyage';
        nw.addEventListener('click', function(e){
          e.stopPropagation(); vyMenu.classList.remove('open');
          if(typeof onChange==='function') onChange('__new__');
        });
        vyMenu.appendChild(nw);
      }
    };

    /* Lecture immédiate du cache sessionStorage — évite d'attendre la page */
    try {
      var cached = sessionStorage.getItem('rnr_groupe');
      if(cached){
        var g = JSON.parse(cached);
        if(g.nom) grp.textContent = g.nom + ' ⚙️';
        if(g.is_superadmin) cons.classList.add('rnrc-sa-visible');
      }
      var cv = sessionStorage.getItem('rnr_voyage_nom');
      if(cv){ vyWrap.style.display='flex'; vyBtn.querySelector('.rnrc-vy-nom').textContent = cv; }
    } catch(e){}
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ inject(); initAvatarsEtProfil(); });
  } else {
    inject();
    initAvatarsEtProfil();
  }

  /* ════════════════════════════════════════════════════════════════════
     BARRE D'AVATARS + PRÉSENCE + PROFIL MEMBRE (08/07)
     Un coin en haut à droite, sur toutes les pages, posé ici et nulle part
     ailleurs. Clic sur soi-même → profil éditable (menus déroulants MINIMUM,
     jamais bloquants, + champs libres toujours dispo — retour Bruno).
     Clic sur un autre → sa fiche en lecture. Remplace la vision d'un
     formulaire d'onboarding séparé : la porte d'entrée devient permanente.
     ──────────────────────────────────────────────────────────────────── */
  var PASSIONS_CHOIX = [
    {v:'nature',label:'🌿 Nature'}, {v:'gastronomie',label:'🍽️ Gastronomie'},
    {v:'culture',label:'🏛️ Culture'}, {v:'sport',label:'🥾 Sport'},
    {v:'farniente',label:'🏖️ Farniente'}, {v:'rencontres',label:'👋 Rencontres'}
  ];
  var VOYAGEUR_DEPUIS_CHOIX = [
    {v:'', label:'—'},
    {v:'moins_1_an', label:'Moins d\'1 an'},
    {v:'1_3_ans', label:'1 à 3 ans'},
    {v:'3_10_ans', label:'3 à 10 ans'},
    {v:'veteran', label:'Vétéran(ne)'}
  ];
  // Seule source de ces libellés (08/07) — toute page qui affiche un profil
  // (Le Cahier, plus tard une page équipe dédiée) les lit ici, jamais une copie.
  window.RNR_PROFIL_CHOIX = { passions: PASSIONS_CHOIX, voyageurDepuis: VOYAGEUR_DEPUIS_CHOIX };
  var _sbChrome=null, _monUserId=null, _monGroupeId=null, _monMembre=null, _tousMembres=[];

  function coord(nom){
    var palette=['#D85A30','#2159A8','#2C5016','#8b6914','#6B3288','#1B2A6B'];
    var h=0; var s=nom||'?'; for(var i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0;
    return palette[h%palette.length];
  }
  function avatarInnerHtml(membre, email){
    var av=window.rnrAvatarMembre(membre, email);
    if(av.photo) return { html:'', bg:'url(\''+av.photo.replace(/'/g,'')+'\') center/cover' };
    if(av.emoji) return { html:av.emoji, bg:'var(--gold-a20)' };
    return { html:av.initiale, bg:coord(window.rnrNomMembre(membre, email)) };
  }
  function estActif(m){
    if(!m || !m.derniere_activite) return false;
    return (Date.now() - new Date(m.derniere_activite).getTime()) < 5*60*1000;
  }

  async function initAvatarsEtProfil(){
    try{
      if(typeof supabase === 'undefined') return;   // CDN pas chargé (cf. B39) — pas de barre plutôt qu'une erreur
      var _c = supabase.createClient; if(!_c) return;
      _sbChrome = _c("https://cazqllstxhuecoqpktwm.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhenFsbHN0eGh1ZWNvcXBrdHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTExNTQsImV4cCI6MjA5NDk2NzE1NH0.6YYAJXG4s-h78YUp2pd7fBvQJzDprSxtSkUZTv6ZtZs");
      var sess = await _sbChrome.auth.getSession();
      var session = sess && sess.data && sess.data.session;
      if(!session) return;   // page de connexion, ou pas encore authentifié
      _monUserId = session.user.id;
      var mres = await _sbChrome.from('membres').select('*').eq('user_id', _monUserId).limit(1).single();
      if(!mres || !mres.data) return;
      _monMembre = mres.data; _monGroupeId = mres.data.groupe_id;
      var lres = await _sbChrome.from('membres').select('*').eq('groupe_id', _monGroupeId);
      _tousMembres = (lres && lres.data) || [];
      rendreAvatars();
      battementCoeur();
      setInterval(battementCoeur, 60000);
    }catch(e){ console.warn('chrome.js: barre d\'avatars', e); }
  }
  async function battementCoeur(){
    if(!_sbChrome || !_monMembre) return;
    try{ await _sbChrome.from('membres').update({derniere_activite:new Date().toISOString()}).eq('id', _monMembre.id); }catch(e){}
  }

  function rendreAvatars(){
    var right = document.querySelector('.rnrc-right'); if(!right) return;
    var wrap = document.createElement('div'); wrap.className='rnrc-avs';
    var visibles = _tousMembres.slice(0,4);
    visibles.forEach(function(m){
      var b = document.createElement('div'); b.className='rnrc-av';
      var av = avatarInnerHtml(m, m.email);
      b.style.background = av.bg; b.textContent = av.html;
      var nom = window.rnrNomMembre(m, m.email);
      var actif = estActif(m);
      b.innerHTML = av.html + '<span class="rnrc-av-dot'+(actif?' on':'')+'"></span>'
        + '<span class="rnrc-av-tip">'+nom+(actif?' · en ligne':'')+'</span>';
      b.addEventListener('click', function(){ ouvrirProfil(m); });
      wrap.appendChild(b);
    });
    if(_tousMembres.length>4){
      var plus=document.createElement('div'); plus.className='rnrc-av rnrc-av-plus';
      plus.textContent='+'+(_tousMembres.length-4);
      plus.title=(_tousMembres.length-4)+' autre(s) membre(s)';
      wrap.appendChild(plus);
    }
    // posé juste avant le bouton thème, dans l'ordre naturel de lecture droite→gauche
    var theme = right.querySelector('.rnrc-theme');
    if(theme) right.insertBefore(wrap, theme); else right.appendChild(wrap);
  }

  /* ── Modale profil (soi-même : éditable · autre membre : lecture) ── */
  function ensureProfilDom(){
    if(document.getElementById('rnrc-profil-overlay')) return;
    var ov=document.createElement('div'); ov.id='rnrc-profil-overlay';
    ov.setAttribute('onclick',"if(event.target===this)window.__rnrProfilFerme()");
    ov.innerHTML =
      '<div id="rnrc-profil-modal">'+
        '<div class="rnrc-pf-tete">'+
          '<div class="rnrc-pf-av" id="rnrc-pf-av"></div>'+
          '<div style="flex:1;"><h3 id="rnrc-pf-nom"></h3><p id="rnrc-pf-sub"></p></div>'+
          '<button class="rnrc-pf-close" onclick="window.__rnrProfilFerme()">✕</button>'+
        '</div>'+
        '<div class="rnrc-pf-corps" id="rnrc-pf-corps"></div>'+
        '<div class="rnrc-pf-foot" id="rnrc-pf-foot" style="display:none;"><button onclick="window.__rnrProfilSauver()">💾 Enregistrer</button></div>'+
      '</div>';
    document.body.appendChild(ov);
  }
  function ouvrirProfil(m){
    ensureProfilDom();
    var estSoi = _monMembre && (m.id===_monMembre.id);
    var av = avatarInnerHtml(m, m.email);
    var avEl=document.getElementById('rnrc-pf-av'); avEl.style.background=av.bg; avEl.textContent=av.html;
    document.getElementById('rnrc-pf-nom').textContent = window.rnrNomMembre(m, m.email) + (estSoi?' (toi)':'');
    document.getElementById('rnrc-pf-sub').textContent = estActif(m) ? 'En ligne à l\'instant' : '';
    var corps=document.getElementById('rnrc-pf-corps');
    var foot=document.getElementById('rnrc-pf-foot');
    if(estSoi){
      foot.style.display='block';
      var passions = m.passions||[];
      corps.innerHTML =
        '<div><span class="rnrc-pf-lbl">Voyageur(se) depuis</span><select id="rnrc-pf-depuis">'+
          VOYAGEUR_DEPUIS_CHOIX.map(function(o){ return '<option value="'+o.v+'"'+(o.v===(m.voyageur_depuis||'')?' selected':'')+'>'+o.label+'</option>'; }).join('')+
        '</select></div>'+
        '<div><span class="rnrc-pf-lbl">Ta passion voyage <em style="font-weight:400;opacity:.7;">(optionnel)</em></span>'+
        '<div class="rnrc-pf-chips" id="rnrc-pf-passions">'+
          PASSIONS_CHOIX.map(function(p){ return '<span class="rnrc-pf-chip'+(passions.indexOf(p.v)>=0?' on':'')+'" data-v="'+p.v+'" onclick="window.__rnrProfilTogglePassion(this)">'+p.label+'</span>'; }).join('')+
        '</div></div>'+
        '<div><span class="rnrc-pf-lbl">Présentation <em style="font-weight:400;opacity:.7;">(optionnel, aucune limite — dis-en autant que tu veux)</em></span>'+
        '<textarea id="rnrc-pf-presentation" placeholder="Ce que tu veux partager avec le groupe…">'+ (m.presentation? m.presentation.replace(/</g,'&lt;'): '') +'</textarea></div>'+
        '<div><span class="rnrc-pf-lbl">Photo de profil <em style="font-weight:400;opacity:.7;">(optionnel, une URL pour l\'instant)</em></span>'+
        '<input id="rnrc-pf-photo" type="text" value="'+(m.photo_url||'').replace(/"/g,'&quot;')+'" placeholder="https://…"></div>';
      window.__rnrProfilTogglePassion = function(el){ el.classList.toggle('on'); };
      window.__rnrProfilSauver = async function(){
        var btn=foot.querySelector('button'); var txt=btn.textContent;
        btn.disabled=true; btn.textContent='⏳ Enregistrement…';
        var chosen=[]; corps.querySelectorAll('.rnrc-pf-chip.on').forEach(function(c){ chosen.push(c.dataset.v); });
        var payload={
          voyageur_depuis: document.getElementById('rnrc-pf-depuis').value || null,
          passions: chosen.length?chosen:null,
          presentation: (document.getElementById('rnrc-pf-presentation').value||'').trim() || null,
          photo_url: (document.getElementById('rnrc-pf-photo').value||'').trim() || null,
        };
        try{
          var r = await _sbChrome.from('membres').update(payload).eq('id', _monMembre.id);
          if(r.error) throw r.error;
          Object.assign(_monMembre, payload);
          var idx=_tousMembres.findIndex(function(x){return x.id===_monMembre.id;});
          if(idx>=0) Object.assign(_tousMembres[idx], payload);
          document.querySelectorAll('.rnrc-avs').forEach(function(w){ w.remove(); });
          rendreAvatars();
          btn.textContent='✅ Enregistré !';
          setTimeout(function(){ btn.disabled=false; btn.textContent=txt; },1400);
        }catch(e){
          console.warn('chrome.js: sauvegarde profil', e);
          btn.disabled=false; btn.textContent='⚠️ Échec — réessayer';
        }
      };
    } else {
      foot.style.display='none';
      var depuisLabel=(VOYAGEUR_DEPUIS_CHOIX.find(function(o){return o.v===m.voyageur_depuis;})||{}).label;
      var passionsLabels=(m.passions||[]).map(function(v){ var f=PASSIONS_CHOIX.find(function(p){return p.v===v;}); return f?f.label:v; });
      corps.innerHTML = '<div class="rnrc-pf-lecture">'+
        (depuisLabel&&depuisLabel!=='—' ? '<p><b>Voyageur(se) depuis</b> '+depuisLabel+'</p>' : '')+
        (passionsLabels.length ? '<p><b>Passions</b> '+passionsLabels.join(' · ')+'</p>' : '')+
        '<p>'+(m.presentation ? m.presentation.replace(/</g,'&lt;') : '<span class="vide">Pas encore de présentation.</span>')+'</p>'+
      '</div>';
    }
    document.getElementById('rnrc-profil-overlay').classList.add('open');
  }
  window.__rnrProfilFerme = function(){ var o=document.getElementById('rnrc-profil-overlay'); if(o) o.classList.remove('open'); };

  /* ════════════════════════════════════════════════════════════════════
     IDENTITÉ CANONIQUE — une seule maison pour le nom affiché d'un membre.
     Règle officielle (Master, identité v15) :  pseudo → prenom → dérivé
     propre de l'email → 'Voyageur'.  Toutes les pages (Hub, Cockpit,
     Horizon, Carnet) doivent passer par ici pour éviter qu'un même membre
     apparaisse sous deux noms selon la page. Fonction PURE, sans DOM :
     disponible dès que chrome.js est parsé.
     ──────────────────────────────────────────────────────────────────── */
  function _depuisEmail(email){
    var base = ((email||'').split('@')[0] || '');
    base = base.split(/[._0-9]/)[0] || base;        // coupe prenom.nom / chiffres, garde le tiret
    if(!base) return 'Voyageur';
    return base.split('-')
      .map(function(seg){ return seg ? seg.charAt(0).toUpperCase()+seg.slice(1).toLowerCase() : ''; })
      .filter(Boolean)
      .join('-');
  }
  /* nomMembre(membre, email) — membre = ligne `membres` (ou null), email = repli */
  window.rnrNomMembre = function(membre, email){
    if(membre){
      if(membre.pseudo && String(membre.pseudo).trim()) return String(membre.pseudo).trim();
      if(membre.prenom && String(membre.prenom).trim()) return String(membre.prenom).trim();
    }
    return _depuisEmail(email);
  };
  /* avatarMembre(membre, email) — {photo}/{emoji}/{initiale} : priorité à une
     vraie photo de profil (photo_url, 08/07), puis l'emoji, puis l'initiale.
     La couleur de fond reste gérée côté composant (discussion.js, etc.). */
  window.rnrAvatarMembre = function(membre, email){
    if(membre && membre.photo_url) return { photo: String(membre.photo_url).trim() };
    var av = membre && membre.avatar ? String(membre.avatar).trim() : '';
    if(av) return { emoji: av };
    var nom = window.rnrNomMembre(membre, email);
    return { initiale: (nom.charAt(0)||'?').toUpperCase() };
  };
})();
