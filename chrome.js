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
  +'.rnrc-cgu-link{font-size:12px;color:var(--chrome-ink-dim);text-decoration:none;'
  +'white-space:nowrap;font-family:var(--font-body);opacity:.8;}'
  +'.rnrc-cgu-link:hover{color:var(--gold-light);opacity:1;}'
  +'@media(max-width:700px){.rnrc-cgu-link{display:none;}}'  /* sur mobile : seulement dans le pied */
  +'.rnrc-footer{text-align:center;padding:22px 16px calc(22px + env(safe-area-inset-bottom));'
  +'border-top:1px solid var(--gold-a20);margin-top:40px;}'
  +'.rnrc-footer a{font-size:12px;color:var(--chrome-ink-dim);text-decoration:none;'
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
  +'}';

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

    var cgu = document.createElement('a');
    cgu.className = 'rnrc-cgu-link';
    cgu.href = 'cgu.html';
    cgu.title = "Conditions d'utilisation";
    cgu.textContent = 'Conditions';
    if(pageActive('cgu.html')) cgu.style.color = 'var(--gold-light)';
    right.appendChild(cgu);

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
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

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
  /* avatarMembre(membre, email) — {emoji} si avatar défini, sinon {initiale} du nom.
     La couleur de fond reste gérée côté composant (discussion.js, etc.). */
  window.rnrAvatarMembre = function(membre, email){
    var av = membre && membre.avatar ? String(membre.avatar).trim() : '';
    if(av) return { emoji: av };
    var nom = window.rnrNomMembre(membre, email);
    return { initiale: (nom.charAt(0)||'?').toUpperCase() };
  };
})();
