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
    /* Cahier promu dans la barre principale (10/07, retour Bruno) : il avait
       sa place officielle, pas juste un petit bouton planqué dans Roadbook —
       retiré de là (voyage.html) au même moment. */
    {id:'cahier',   label:'Cahier',   href:'cahier.html'},
    {id:'souvenir', label:'Souvenir', href:'souvenir.html'}
  ];
  var ICONS = {hub:'🏠', horizon:'🌅', carnet:'📖', voyage:'🗺️', cahier:'📓', souvenir:'📸'};

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
  +'.rnrc-vy-supprimer{color:var(--terracotta);}'
  +'@media(max-width:700px){.rnrc-voyage{font-size:14px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}}'
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
  +'.rnrc-links{display:none;}'
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
     partout, posé par ce seul fichier. (18/07, retour Bruno : « le rond des
     photos est trop petit ») — agrandi 32px→42px, quitte à élargir un peu
     la barre ; le chevauchement (-8px→-11px) et la police suivent. ── */
  +'.rnrc-avs{display:flex;align-items:center;margin-right:4px;}'
  +'.rnrc-av{position:relative;width:42px;height:42px;border-radius:50%;margin-left:-11px;'
  +'border:2px solid var(--chrome-bg);cursor:pointer;display:flex;align-items:center;justify-content:center;'
  +'font-size:17px;font-weight:800;color:#fff;overflow:hidden;background-size:cover;background-position:center;'
  +'transition:transform .15s;}'
  +'.rnrc-av:hover{transform:translateY(-2px);z-index:5;}'
  +'.rnrc-av:first-child{margin-left:0;}'
  +'.rnrc-av-dot{position:absolute;bottom:-1px;right:-1px;width:11px;height:11px;border-radius:50%;'
  +'background:#5cb85c;border:2px solid var(--chrome-bg);display:none;}'
  +'.rnrc-av-dot.on{display:block;}'
  +'.rnrc-av-plus{background:var(--gold-a10);color:var(--gold-light);border:2px solid var(--chrome-bg);font-size:13px;}'
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
  +'.rnrc-pf-photo-row{display:flex;align-items:center;gap:12px;}'
  +'.rnrc-pf-photo-preview{width:64px;height:64px;border-radius:50%;background-size:cover;background-position:center;'
  +'background-color:var(--surface);border:1.5px dashed var(--surface-line);flex-shrink:0;}'
  +'.rnrc-pf-photo-actions{display:flex;flex-direction:column;gap:6px;}'
  +'.rnrc-pf-photo-actions button{padding:7px 12px;border-radius:8px;font-size:12px;font-family:inherit;cursor:pointer;}'
  +'.rnrc-pf-photo-choisir{background:var(--ink,#211a10);color:var(--gold,#C8A84B);border:none;font-weight:700;}'
  +'.rnrc-pf-photo-del{background:none;border:1.5px solid var(--surface-line);color:var(--ink-dim);}'
  +'.rnrc-pf-photo-etat{font-size:11px;color:var(--ink-dim);}'
  +'.rnrc-pf-lecture{font-size:13px;line-height:1.6;color:var(--ink);}'
  +'.rnrc-pf-lecture .vide{color:var(--ink-dim);font-style:italic;}'
  +'.rnrc-pf-mail-btn{width:100%;padding:10px;margin-top:14px;background:var(--gold-a20);color:var(--gold-deep,#8a6d1f);'
  +'border:1.5px solid var(--gold-a35);border-radius:8px;font-weight:700;cursor:pointer;font-family:inherit;font-size:13px;}'
  +'.rnrc-pf-mail-btn:hover{background:var(--gold);color:#1a1208;}'
  +'.rnrc-pf-foot{padding:14px 22px;border-top:1px solid var(--surface-line);}'
  +'.rnrc-pf-foot button{width:100%;padding:10px;background:var(--ink,#211a10);color:var(--gold,#C8A84B);'
  +'border:none;border-radius:8px;font-weight:700;cursor:pointer;font-family:inherit;}'
  /* ── Animaux du groupe (18/07) — même moteur monté dans la modale profil
     ET dans onboarding.html, jamais reconstruit deux fois. ── */
  +'.rnrc-anx-vide{font-size:12px;color:var(--ink-dim);font-style:italic;margin:0 0 8px;}'
  +'.rnrc-anx-card{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--surface-line);}'
  +'.rnrc-anx-card:last-child{border-bottom:none;}'
  +'.rnrc-anx-av{width:44px;height:44px;border-radius:50%;background-size:cover;background-position:center;'
  +'flex-shrink:0;cursor:pointer;border:1.5px dashed var(--surface-line);}'
  +'.rnrc-anx-nom{width:100%;padding:5px 8px;border:1.5px solid var(--surface-line);border-radius:7px;'
  +'font-family:inherit;font-size:12.5px;font-weight:700;color:var(--paper-ink);background:var(--paper);'
  +'box-sizing:border-box;margin-bottom:4px;}'
  +'.rnrc-anx-infos{width:100%;padding:5px 8px;border:1.5px solid var(--surface-line);border-radius:7px;'
  +'font-family:inherit;font-size:11.5px;color:var(--paper-ink-dim);background:var(--paper);box-sizing:border-box;}'
  +'.rnrc-anx-suppr{background:none;border:none;color:var(--ink-dim);cursor:pointer;font-size:14px;padding:4px 6px;flex-shrink:0;}'
  +'.rnrc-anx-suppr:hover{color:#b3392c;}'
  +'.rnrc-anx-ajouter{margin-top:8px;padding:8px 12px;border-radius:8px;border:1.5px dashed var(--surface-line);'
  +'background:none;color:var(--ink-dim);font-size:12px;cursor:pointer;font-family:inherit;width:100%;}'
  +'.rnrc-anx-ajouter:hover{border-color:var(--gold);color:var(--ink);}';

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

    /* (10/07, retour Bruno) : « Mon groupe ⚙️ » et « + Fiche » retirés d'ici —
       doublons exacts de ce que le Hub affiche déjà dans son propre bandeau
       (même liens, onboarding.html et admin.html). Une barre plus légère sur
       CHAQUE page plutôt qu'une action répétée partout ; ces deux actions
       restent à un seul endroit logique, l'accueil, pas retirées du site. */

    /* Console plateforme — cachée par défaut, révélée par setSuperAdmin(true) */
    var cons = document.createElement('a');
    cons.className = 'rnrc-console';
    cons.href = 'console.html';
    cons.title = 'Console plateforme';
    cons.textContent = '🛠️';
    if(pageActive('console.html')) cons.style.color = 'var(--gold-light)';
    right.appendChild(cons);

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
      // (10/07) setGroupe ne fait plus rien de visible — « Mon groupe ⚙️ » a
      // été retiré de la barre (doublon du Hub). Gardé en no-op plutôt que
      // supprimé : les pages qui l'appellent encore ne doivent jamais planter.
      setGroupe:     function(nom){},
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

        // (19/07) Supprimer ce voyage — manquait : on pouvait en créer mais
        // jamais en détruire. Placé tout en bas, séparé, seule action
        // destructive du menu. Autogéré ici (confirm + suppression + retour
        // en lieu sûr) plutôt que via onChange : évite de dupliquer la même
        // logique dans les 5 pages qui appellent setVoyage (home/horizon/
        // carnet/cahier/voyage), chrome.js a déjà son propre client Supabase
        // (_sbChrome) comme pour RNR_ANIMAUX.
        var sep3 = document.createElement('div'); sep3.className='rnrc-vy-sep'; vyMenu.appendChild(sep3);
        var actifItem = (liste||[]).find(function(v){ return v.nom===actifNom; });
        var del = document.createElement('button');
        del.className = 'rnrc-vy-item rnrc-vy-supprimer';
        del.textContent = '🗑️ Supprimer ce voyage';
        del.addEventListener('click', function(e){
          e.stopPropagation(); vyMenu.classList.remove('open');
          if(window.RNR_VOYAGES) window.RNR_VOYAGES.supprimer(actifItem ? actifItem.id : null, actifNom);
        });
        vyMenu.appendChild(del);
      }
    };

    /* Lecture immédiate du cache sessionStorage — évite d'attendre la page */
    try {
      var cached = sessionStorage.getItem('rnr_groupe');
      if(cached){
        var g = JSON.parse(cached);
        if(g.is_superadmin) cons.classList.add('rnrc-sa-visible');
      }
      var cv = sessionStorage.getItem('rnr_voyage_nom');
      if(cv){ vyWrap.style.display='flex'; vyBtn.querySelector('.rnrc-vy-nom').textContent = cv; }
    } catch(e){}
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ inject(); _rnrInitProfilPromise = initAvatarsEtProfil(); });
  } else {
    inject();
    _rnrInitProfilPromise = initAvatarsEtProfil();
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
  // (17/07, correctif retour Bruno) : initAvatarsEtProfil() était lancée en
  // « fire and forget » — un clic sur son propre avatar arrivant AVANT la fin
  // de cette résolution async voyait _monMembre encore à null, et tombait à
  // tort dans la branche lecture seule. On garde la promesse pour pouvoir
  // l'attendre avant de décider soi-même/autre (cf. window.rnrOuvrirProfil).
  var _rnrInitProfilPromise = null;

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

  // (17/07, retour Bruno) : sur certaines pages (le Cahier), le SDK
  // Supabase est chargé APRÈS chrome.js, en asynchrone (rnrChargerScript) —
  // l'ancien "if(typeof supabase==='undefined') return" abandonnait alors
  // pour de bon, sans jamais réessayer : la barre d'avatars ET la modale de
  // profil restaient mortes en permanence sur ces pages-là, quoi qu'il
  // arrive ensuite. On attend maintenant que le SDK apparaisse (jusqu'à
  // ~4s), plutôt que de conclure trop vite qu'il n'arrivera jamais.
  function attendreSupabaseSDK(delaiMaxMs){
    return new Promise(function(resolve){
      var essais = 0, maxEssais = Math.ceil(delaiMaxMs/150);
      (function tick(){
        if(typeof supabase !== 'undefined' && supabase.createClient){ resolve(true); return; }
        essais++;
        if(essais >= maxEssais){ resolve(false); return; }
        setTimeout(tick, 150);
      })();
    });
  }

  async function initAvatarsEtProfil(){
    try{
      var pret = await attendreSupabaseSDK(4000);
      if(!pret) return;   // CDN vraiment pas chargé (cf. B39) — pas de barre plutôt qu'une erreur
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
      // (18/07, retour Bruno : « si nous avons des animaux, il faudrait les
      // mettre partout, ils font partie des familles ») — même liste
      // (_chargerAnimaux, déjà utilisée par la section "Nos animaux" de la
      // modale profil) réutilisée ici pour la barre du haut, un seul endroit.
      await _chargerAnimaux();
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
    // (18/07) Les animaux du groupe suivent les membres, toujours visibles
    // (pas de troncature à 4 comme les membres — un groupe a rarement plus
    // de 2-3 compagnons, pas besoin d'un "+N" ici).
    (_animaux||[]).forEach(function(a){
      var b = document.createElement('div'); b.className='rnrc-av';
      b.style.background = a.photo_url ? '' : 'var(--gold-a20)';
      if(a.photo_url) b.style.backgroundImage = "url('"+String(a.photo_url).replace(/'/g,'')+"')";
      var nom = a.nom || 'Compagnon';
      b.innerHTML = (a.photo_url?'':(nom.charAt(0)||'?').toUpperCase())
        + '<span class="rnrc-av-tip">'+nom+'</span>';
      b.addEventListener('click', function(){ ouvrirProfilAnimal(a); });
      wrap.appendChild(b);
    });
    // posé juste avant le bouton thème, dans l'ordre naturel de lecture droite→gauche
    var theme = right.querySelector('.rnrc-theme');
    if(theme) right.insertBefore(wrap, theme); else right.appendChild(wrap);
  }

  /* (18/07) Moteur UNIQUE de préparation+envoi d'une photo : redimensionne
     via <canvas> (allège le poids, supprime l'EXIF au passage), envoie dans
     le bucket donné, renvoie l'URL publique au callback (ou null en échec).
     Auparavant dupliqué en ligne dans le seul cas "photo de membre" — mainten-
     ant la SEULE version, réutilisée aussi par les photos d'animaux. */
  function _rnrPreparerEtEnvoyerPhoto(file, bucket, cheminPrefix, callback){
    if(!/^image\//.test(file.type)){ alert('Ce fichier n\'est pas une image.'); callback(null); return; }
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function(){
      URL.revokeObjectURL(url);
      var MAX=480;
      var w=img.width, h=img.height;
      if(w>h){ if(w>MAX){ h=Math.round(h*MAX/w); w=MAX; } } else { if(h>MAX){ w=Math.round(w*MAX/h); h=MAX; } }
      var cv=document.createElement('canvas'); cv.width=w; cv.height=h;
      cv.getContext('2d').drawImage(img,0,0,w,h);
      cv.toBlob(async function(blob){
        if(!blob){ callback(null); return; }
        try{
          var chemin=cheminPrefix+'/'+Date.now()+'.jpg';
          var up = await _sbChrome.storage.from(bucket).upload(chemin, blob, {contentType:'image/jpeg', upsert:true});
          if(up.error) throw up.error;
          var pub = _sbChrome.storage.from(bucket).getPublicUrl(chemin);
          var publicUrl = pub && pub.data && pub.data.publicUrl;
          callback(publicUrl || null);
        }catch(e){ console.warn('chrome.js: upload photo', e); callback(null); }
      }, 'image/jpeg', 0.85);
    };
    img.onerror = function(){ URL.revokeObjectURL(url); callback(null); };
    img.src = url;
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
      // (17/07, B71) : la galerie de photos (membres.photos_disponibles,
      // plafond 10) est le même réservoir que celui affiché dans le Cahier
      // — une photo choisie ici y réapparaît, une photo posée par un leader
      // depuis le Cahier réapparaît ici comme option (jamais imposée).
      var galerieActuelle = Array.isArray(m.photos_disponibles) ? m.photos_disponibles.slice() : [];
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
        '<div><span class="rnrc-pf-lbl">Photo de profil <em style="font-weight:400;opacity:.7;">(optionnel)</em></span>'+
        '<div class="rnrc-pf-photo-row">'+
          '<div class="rnrc-pf-photo-preview" id="rnrc-pf-photo-preview" style="'+(m.photo_url?("background-image:url('"+String(m.photo_url).replace(/'/g,"")+"');"):'')+'"></div>'+
          '<div class="rnrc-pf-photo-actions">'+
            '<button type="button" class="rnrc-pf-photo-choisir" onclick="document.getElementById(\'rnrc-pf-photo-file\').click()">Choisir une photo</button>'+
            (m.photo_url?'<button type="button" class="rnrc-pf-photo-del" onclick="window.__rnrProfilPhotoSuppr()">Retirer la photo</button>':'')+
            '<span class="rnrc-pf-photo-etat" id="rnrc-pf-photo-etat"></span>'+
          '</div>'+
          '<input id="rnrc-pf-photo-file" type="file" accept="image/*" style="display:none;" onchange="window.__rnrProfilPhotoChoisie(this)">'+
          '<input type="hidden" id="rnrc-pf-photo" value="'+(m.photo_url||'').replace(/"/g,'&quot;')+'">'+
        '</div></div>'+
        '<div><span class="rnrc-pf-lbl">Nos animaux <em style="font-weight:400;opacity:.7;">(tout le groupe peut les ajouter/modifier)</em></span>'+
        '<div id="rnrc-anx-liste-hote"></div></div>';
      window.__rnrProfilTogglePassion = function(el){ el.classList.toggle('on'); };
      if(window.RNR_ANIMAUX) window.RNR_ANIMAUX.monter('rnrc-anx-liste-hote');
      // (17/07, retour Bruno) : vraie sélection de fichier, plus un champ URL
      // à coller. Redimensionnement + ré-encodage via <canvas> avant l'envoi
      // — ça allège le poids ET supprime les métadonnées EXIF (dont une
      // éventuelle géoloc cachée) au passage, même logique que la moulinette
      // des photos de lieux. Bucket dédié : photos-membres (public, lecture
      // seule côté client comme photos-lieux).
      window.__rnrProfilPhotoChoisie = function(input){
        var f = input.files && input.files[0]; if(!f) return;
        var etat=document.getElementById('rnrc-pf-photo-etat'); if(etat) etat.textContent='Préparation…';
        var cheminPrefix=(_monMembre&&_monMembre.id?_monMembre.id:'anon');
        _rnrPreparerEtEnvoyerPhoto(f, 'photos-membres', cheminPrefix, async function(publicUrl){
          if(!publicUrl){ if(etat) etat.textContent='Échec de l\'envoi — réessaie.'; return; }
          document.getElementById('rnrc-pf-photo').value = publicUrl;
          var prev=document.getElementById('rnrc-pf-photo-preview'); if(prev) prev.style.backgroundImage="url('"+publicUrl.replace(/'/g,'')+"')";
          if(galerieActuelle.indexOf(publicUrl)<0 && galerieActuelle.length<10) galerieActuelle.push(publicUrl);
          // (18/07, B78, retour de test de Bruno) : AVANT, cette photo restait
          // en local jusqu'au bouton "Enregistrer", qui écrasait ensuite
          // photos_disponibles avec ce snapshot — effaçant une photo posée
          // entre-temps par un leader (set_photo_cahier, Cahier). Persistance
          // immédiate, fusionnée avec l'état réel en base (relu juste avant
          // d'écrire), jamais un simple remplacement.
          try{
            var fraiche = await _sbChrome.from('membres').select('photos_disponibles').eq('id', _monMembre.id).maybeSingle();
            var dbActuelle = Array.isArray(fraiche && fraiche.data && fraiche.data.photos_disponibles) ? fraiche.data.photos_disponibles : [];
            var fusionnee = dbActuelle.indexOf(publicUrl)>=0 ? dbActuelle : dbActuelle.concat([publicUrl]).slice(0,10);
            await _sbChrome.from('membres').update({photos_disponibles:fusionnee}).eq('id', _monMembre.id);
            galerieActuelle = fusionnee;
          }catch(e){ console.warn('chrome.js: persistance immédiate galerie', e); }
          if(etat) etat.textContent='Photo prête — Enregistrer pour confirmer.';
        });
      };
      window.__rnrProfilPhotoSuppr = function(){
        document.getElementById('rnrc-pf-photo').value='';
        var prev=document.getElementById('rnrc-pf-photo-preview'); if(prev) prev.style.backgroundImage='';
        var etat=document.getElementById('rnrc-pf-photo-etat'); if(etat) etat.textContent='Photo retirée — Enregistrer pour confirmer.';
      };
      window.__rnrProfilSauver = async function(){
        var btn=foot.querySelector('button'); var txt=btn.textContent;
        btn.disabled=true; btn.textContent='⏳ Enregistrement…';
        var chosen=[]; corps.querySelectorAll('.rnrc-pf-chip.on').forEach(function(c){ chosen.push(c.dataset.v); });
        var payload={
          voyageur_depuis: document.getElementById('rnrc-pf-depuis').value || null,
          passions: chosen.length?chosen:null,
          presentation: (document.getElementById('rnrc-pf-presentation').value||'').trim() || null,
          photo_url: (document.getElementById('rnrc-pf-photo').value||'').trim() || null,
          photos_disponibles: galerieActuelle,
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
      '</div>'+
      // (18/07, retour Bruno) : pouvoir écrire directement à la personne
      // depuis son profil, pas seulement la lire — mailto, rien n'est
      // envoyé par le site (même principe que "Écrire aux membres cochés").
      (m.email ? '<button type="button" class="rnrc-pf-mail-btn" onclick="window.location.href=\'mailto:'+String(m.email).replace(/'/g,'')+'\'">✉️ Écrire à '+window.rnrNomMembre(m,m.email)+'</button>' : '');
    }
    document.getElementById('rnrc-profil-overlay').classList.add('open');
  }
  window.__rnrProfilFerme = function(){ var o=document.getElementById('rnrc-profil-overlay'); if(o) o.classList.remove('open'); };
  // (18/07, retour Bruno) : les animaux "font partie des familles" — ils
  // ont donc leur propre petite fiche, cliquable comme un membre, mais
  // strictement lecture seule (pas d'email, pas d'édition : l'édition vit
  // dans RNR_ANIMAUX, "Nos animaux", section du profil de chacun).
  function ouvrirProfilAnimal(a){
    ensureProfilDom();
    var avEl=document.getElementById('rnrc-pf-av');
    if(a.photo_url){ avEl.style.background="url('"+String(a.photo_url).replace(/'/g,'')+"') center/cover"; avEl.textContent=''; }
    else { avEl.style.background='var(--gold-a20)'; avEl.textContent=(a.nom||'?').charAt(0).toUpperCase(); }
    document.getElementById('rnrc-pf-nom').textContent = a.nom || 'Compagnon de route';
    document.getElementById('rnrc-pf-sub').textContent = 'Compagnon de route de la famille';
    document.getElementById('rnrc-pf-foot').style.display='none';
    document.getElementById('rnrc-pf-corps').innerHTML = '<div class="rnrc-pf-lecture">'+
      (a.infos ? a.infos.replace(/</g,'&lt;') : '<span class="vide">Pas encore d\'infos.</span>')+
    '</div>';
    document.getElementById('rnrc-profil-overlay').classList.add('open');
  }
  // (17/07) Le Cahier (page Équipe) doit ouvrir EXACTEMENT cette modale —
  // jamais une variante — pour éditer/ajouter sa photo. Un seul moteur,
  // partagé par la barre d'avatars ET la page Équipe imprimable.
  // Attend l'initialisation (session + _monMembre) avant de trancher
  // soi-même/autre — sinon un clic trop rapide après le chargement de la
  // page tombait à tort en lecture seule, même sur sa propre carte.
  window.rnrOuvrirProfil = async function(m){
    try{ if(_rnrInitProfilPromise) await _rnrInitProfilPromise; }catch(e){}
    ouvrirProfil(m);
  };
  // (18/07) Même principe que rnrOuvrirProfil, pour un animal — utilisé par
  // la barre d'avatars ET la rangée d'avatars du Hub (home.html) : un seul
  // point d'entrée public, jamais une variante par page.
  window.rnrOuvrirProfilAnimal = function(a){ ouvrirProfilAnimal(a); };

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

  /* ════════════════════════════════════════════════════════════════════
     ANIMAUX DU GROUPE (18/07) — nos amis à quatre pattes, sur le même
     principe qu'une fiche membre : nom, photo, infos libres. Table
     `animaux` (groupe_id, RLS ouverte à tout membre du groupe — pas de
     notion de leader ici, un animal appartient au groupe entier, pas à
     une personne). UN SEUL MOTEUR (ce bloc), monté à deux endroits : la
     section "Nos animaux" de la modale profil ci-dessus, ET
     onboarding.html — jamais reconstruit une seconde fois. Le Cahier
     (page Équipe) lit directement la table pour ses cartes imprimables,
     en lecture seule (l'édition reste ici, un seul moteur d'édition).
     ──────────────────────────────────────────────────────────────────── */
  var _animaux = [];
  async function _chargerAnimaux(){
    if(!_sbChrome || !_monGroupeId) return [];
    try{
      var r = await _sbChrome.from('animaux').select('*').eq('groupe_id', _monGroupeId).order('created_at',{ascending:true});
      _animaux = (r && r.data) || [];
    }catch(e){ console.warn('chrome.js: chargement animaux', e); }
    return _animaux;
  }
  function _animalAvatarStyle(a){
    return a.photo_url ? ("background-image:url('"+String(a.photo_url).replace(/'/g,'')+"');") : 'background:var(--gold-a20);';
  }
  function _animauxListeHtml(){
    if(!_animaux.length) return '<p class="rnrc-anx-vide">Pas encore de compagnon à quatre pattes enregistré.</p>';
    return _animaux.map(function(a){
      return '<div class="rnrc-anx-card" data-id="'+a.id+'">'+
        '<div class="rnrc-anx-av" style="'+_animalAvatarStyle(a)+'" title="Changer la photo" onclick="document.getElementById(\'rnrc-anx-file-'+a.id+'\').click()"></div>'+
        '<input id="rnrc-anx-file-'+a.id+'" type="file" accept="image/*" style="display:none;" onchange="window.__rnrAnimalPhotoChoisie(this,\''+a.id+'\')">'+
        '<div style="flex:1;min-width:0;">'+
          '<input class="rnrc-anx-nom" value="'+String(a.nom||'').replace(/"/g,'&quot;')+'" placeholder="Nom" onchange="window.__rnrAnimalChamp(\''+a.id+'\',\'nom\',this.value)">'+
          '<input class="rnrc-anx-infos" value="'+String(a.infos||'').replace(/"/g,'&quot;')+'" placeholder="Race, âge, une phrase…" onchange="window.__rnrAnimalChamp(\''+a.id+'\',\'infos\',this.value)">'+
        '</div>'+
        '<button type="button" class="rnrc-anx-suppr" title="Retirer" onclick="window.__rnrAnimalSupprimer(\''+a.id+'\')">✕</button>'+
      '</div>';
    }).join('');
  }
  function _animauxSectionHtml(){
    return '<div id="rnrc-anx-liste">'+_animauxListeHtml()+'</div>'+
      '<button type="button" class="rnrc-anx-ajouter" onclick="window.__rnrAnimalAjouter()">+ Ajouter un animal</button>';
  }
  function _animauxRerendre(){
    document.querySelectorAll('.rnrc-anx-hote').forEach(function(h){ h.innerHTML=_animauxSectionHtml(); });
  }
  window.__rnrAnimalAjouter = async function(){
    if(!_sbChrome || !_monGroupeId) return;
    try{
      var r = await _sbChrome.from('animaux').insert({groupe_id:_monGroupeId, nom:'Nouveau compagnon'}).select().single();
      if(r.error) throw r.error;
      _animaux.push(r.data);
      _animauxRerendre();
    }catch(e){ console.warn('chrome.js: ajout animal', e); }
  };
  window.__rnrAnimalChamp = async function(id, champ, valeur){
    var payload={}; payload[champ]=(valeur||'').trim()||null;
    try{
      var r=await _sbChrome.from('animaux').update(payload).eq('id', id);
      if(r.error) throw r.error;
      var a=_animaux.find(function(x){return x.id===id;}); if(a) a[champ]=payload[champ];
    }catch(e){ console.warn('chrome.js: maj animal', e); }
  };
  window.__rnrAnimalSupprimer = async function(id){
    if(!confirm('Retirer cet animal du carnet du groupe ?')) return;
    try{
      var r=await _sbChrome.from('animaux').delete().eq('id', id);
      if(r.error) throw r.error;
      _animaux=_animaux.filter(function(x){return x.id!==id;});
      _animauxRerendre();
    }catch(e){ console.warn('chrome.js: suppression animal', e); }
  };
  window.__rnrAnimalPhotoChoisie = function(input, id){
    var f=input.files && input.files[0]; if(!f) return;
    _rnrPreparerEtEnvoyerPhoto(f, 'photos-membres', 'animaux/'+id, async function(publicUrl){
      if(!publicUrl) return;
      try{
        var r=await _sbChrome.from('animaux').update({photo_url:publicUrl}).eq('id', id);
        if(r.error) throw r.error;
        var a=_animaux.find(function(x){return x.id===id;}); if(a) a.photo_url=publicUrl;
        _animauxRerendre();
      }catch(e){ console.warn('chrome.js: photo animal', e); }
    });
  };
  /* Point d'entrée public : monte la section "Nos animaux" dans le
     conteneur donné. Attend l'initialisation de session (_sbChrome/
     _monGroupeId) comme rnrOuvrirProfil — même garde-fou, même raison
     (B70 : un clic trop rapide après le chargement de la page ne doit
     jamais tomber sur un état vide faute d'avoir attendu la session). */
  window.RNR_ANIMAUX = {
    monter: async function(containerId){
      try{ if(_rnrInitProfilPromise) await _rnrInitProfilPromise; }catch(e){}
      var host=document.getElementById(containerId);
      if(!host || !_monGroupeId) return;
      host.classList.add('rnrc-anx-hote');
      host.innerHTML='<p class="rnrc-anx-vide">Chargement…</p>';
      await _chargerAnimaux();
      host.innerHTML=_animauxSectionHtml();
    },
    // (18/07) lecture seule pour le Cahier — jamais une seconde requête
    // dupliquée ailleurs : cahier.html appelle ceci puis lit le tableau.
    lister: async function(groupeId, sb){
      if(!sb || !groupeId) return [];
      try{
        var r = await sb.from('animaux').select('*').eq('groupe_id', groupeId).order('created_at',{ascending:true});
        return (r && r.data) || [];
      }catch(e){ console.warn('RNR_ANIMAUX.lister', e); return []; }
    }
  };

  /* ════════════════════════════════════════════════════════════════════
     RNR_VOYAGES — suppression d'un voyage (19/07). On pouvait en créer
     depuis le Hub et le sélecteur du chrome, jamais en détruire — trou
     signalé par Bruno. Un seul point d'entrée (le sélecteur multi-voyages
     du chrome, setVoyage ci-dessus), quelle que soit la page d'où on part :
     home/horizon/carnet/cahier/voyage n'ont RIEN à changer, ce moteur vit
     ici avec son propre client (_sbChrome), même principe que RNR_ANIMAUX.

     Toutes les tables filles (voyage_leaders, propositions, voyage_fiches,
     voyage_itineraire, voyage_notes) sont en ON DELETE CASCADE en base —
     vérifié en base avant d'écrire ce code (le réel fait foi) : un simple
     DELETE sur voyages suffit, pas de nettoyage manuel à dupliquer ici.

     Permission : la RLS ('voyages_all', is_member_of(groupe_id)) autorise
     déjà n'importe quel membre du groupe à créer/modifier un voyage — la
     suppression suit la même logique collective, pas réservée à
     l'organisateur. Si Bruno préfère la réserver au leader du voyage ou à
     l'organisateur du groupe, c'est un ajout de vérification ici, pas une
     réécriture. */
  window.RNR_VOYAGES = {
    supprimer: async function(voyageId, voyageNom){
      try{ if(_rnrInitProfilPromise) await _rnrInitProfilPromise; }catch(e){}
      if(!voyageId || !_sbChrome || !_monGroupeId) return;
      var ok = confirm(
        'Supprimer définitivement « '+(voyageNom||'ce voyage')+' » ?\n\n'+
        'Toutes ses étapes, votes et notes disparaîtront pour tout le groupe. '+
        'Cette action est irréversible.'
      );
      if(!ok) return;
      try{
        var del = await _sbChrome.from('voyages').delete().eq('id', voyageId);
        if(del.error) throw del.error;

        try{ sessionStorage.removeItem('rnr_voyage_id'); sessionStorage.removeItem('rnr_voyage_nom'); }catch(e){}

        var reste = await _sbChrome.from('voyages').select('id,est_principal,created_at')
          .eq('groupe_id', _monGroupeId).order('created_at',{ascending:true});
        var liste = (reste && reste.data) || [];

        if(!liste.length){
          // Plus aucun voyage dans le groupe : même porte que la toute
          // première connexion (verifierPremierVoyage, home.html).
          window.location.href = 'home.html?nouveau=1';
          return;
        }
        // Le voyage supprimé était peut-être le principal (⭐) : on en
        // promeut un autre pour que le repli habituel (est_principal ||
        // liste[0], déjà présent sur chaque page) garde un choix explicite
        // plutôt qu'implicite, et que l'étoile reste cohérente pour
        // onboarding.html qui l'affiche.
        if(!liste.some(function(v){ return v.est_principal; })){
          try{ await _sbChrome.from('voyages').update({est_principal:true}).eq('id', liste[0].id); }catch(e){}
        }
        window.location.reload();
      }catch(e){
        console.warn('chrome.js: suppression voyage', e);
        alert('Suppression impossible, réessayez.');
      }
    }
  };
})();
