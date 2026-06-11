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
    {id:'hub',      label:'Hub',      href:'home.html'},
    {id:'horizon',  label:'Horizon',  href:'horizon.html'},
    {id:'carnet',   label:'Carnet',   href:'carnet.html'},
    {id:'cockpit',  label:'Cockpit',  href:'cockpit.html'},
    {id:'voyage',   label:'Voyage',   href:'voyage.html'},
    {id:'souvenir', label:'Souvenir', href:'souvenir.html'}
  ];
  var ICONS = {hub:'🏠', horizon:'🌅', carnet:'📖', cockpit:'🗳️', voyage:'🗺️', souvenir:'📸'};

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
  +'.rnrc-links a{font-size:13.5px;font-weight:500;color:var(--chrome-ink-dim);'
  +'text-decoration:none;padding:7px 13px;border-radius:var(--r-pill);'
  +'transition:color .15s,background .15s;position:relative;font-family:var(--font-body);}'
  +'.rnrc-links a:hover{color:var(--chrome-ink);background:var(--gold-a10);}'
  +'.rnrc-links a.rnrc-on{color:var(--gold-light);background:var(--gold-a10);}'
  +'.rnrc-links a.rnrc-phase::after{content:"";position:absolute;left:50%;bottom:1px;'
  +'transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:var(--gold);}'
  +'.rnrc-right{display:flex;align-items:center;gap:12px;}'
  +'.rnrc-groupe{font-size:13px;color:var(--chrome-ink-dim);text-decoration:none;'
  +'white-space:nowrap;font-family:var(--font-body);}'
  +'.rnrc-groupe:hover{color:var(--gold-light);}'
  +'.rnrc-theme{width:34px;height:34px;border-radius:50%;cursor:pointer;'
  +'background:var(--gold-a10);border:1px solid var(--gold-a35);font-size:15px;'
  +'display:flex;align-items:center;justify-content:center;transition:background .15s;padding:0;}'
  +'.rnrc-theme:hover{background:var(--gold-a20);}'
  +'.rnrc-quit{font-family:var(--font-body);font-size:12.5px;font-weight:600;'
  +'padding:6px 13px;border-radius:var(--r-pill);cursor:pointer;'
  +'background:transparent;color:var(--chrome-ink-dim);border:1px solid rgba(245,239,224,.18);'
  +'transition:all .15s;}'
  +'.rnrc-quit:hover{color:var(--chrome-ink);border-color:rgba(245,239,224,.35);}'
  +'.rnrc-tabbar{display:none;}'
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
    if(!mobile && l.id === PHASE) a.className += (a.className?' ':'') + 'rnrc-phase';
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

    var grp = document.createElement('a');
    grp.className = 'rnrc-groupe';
    grp.href = 'onboarding.html';
    grp.textContent = 'Mon groupe ⚙️';
    right.appendChild(grp);

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

    /* API minimale pour les pages */
    window.rnrChrome = {
      setGroupe: function(nom){ if(nom){ grp.textContent = nom + ' ⚙️'; } }
    };
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
