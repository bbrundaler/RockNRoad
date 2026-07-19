/* ════════════════════════════════════════════════════════════════════
   RockNRoad — carto-marqueurs.js
   LE MOTEUR UNIQUE des pastilles de carte.

   Une seule maison pour « à quoi ressemble un point sur une carte ».
   Branché par Horizon, Carnet, Voyage, Hub. Toute page qui dessine des
   lieux passe par ici : on ne recopie JAMAIS la logique de marqueur
   ailleurs (loi du Master : un comportement = un seul endroit).

   ── GRAMMAIRE (D-MK, refonte 29/06, décision Bruno) ──────────────────
     · la FORME dit le STATUT  → rond = un lieu · cœur = coup de cœur ·
                                  épingle = retenu · rond numéroté = placé dans le trajet
     · la COULEUR dit le MONDE → or = jour/activité · bleu nuit = nuit/couchage
   On lit d'un coup d'œil OÙ EN EST la fiche (silhouette) ET dans QUEL
   monde elle vit (couleur). Le cœur EST un cœur, l'épingle EST une épingle :
   plus de symbole minuscule à deviner.

   Numéro + tracé = grammaire COMMUNE au Hub ET à Voyage (correspondance
   bidirectionnelle : on enrichit depuis le Hub, on ordonne dans Voyage).

   Règles gravées :
     · ZÉRO COULEUR EN DUR : tout vient de tokens.css (--mk-*), lu via getComputedStyle.
     · LE MONDE se décide via RNR_TAGS.estCouchage — jamais une détection maison.
     · SIGNATURE STABLE : icone(fiche, {epingle,coeurMoi,coeurAutre}, opts?) —
       inchangée pour ne pas casser Horizon/Carnet/Hub. opts.numero = rond numéroté.

   Dépendance : Leaflet (window.L) + tags.js (window.RNR_TAGS) chargés avant.
   ════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* — Lecture des tokens couleur (une fois, mises en cache). On lit sur
       <html> pour capter le thème courant ; si le token manque, repli sûr. */
  var _cache = null;
  function tok(name, repli) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    v = (v || '').trim();
    return v || repli;
  }
  function couleurs() {
    if (_cache) return _cache;
    _cache = {
      jour:    tok('--mk-jour',     '#F5C518'),
      nuit:    tok('--mk-nuit',     '#1B2A6B'),
      jourInk: tok('--mk-jour-ink', '#5a4a00'),
      nuitInk: tok('--mk-nuit-ink', '#FFFFFF'),
      bord:    tok('--mk-bord',     '#FFFFFF'),
      bordEpingle: tok('--mk-bord-epingle', '#E24B4A'),
      trace:   tok('--mk-trace',    '#C8A84B')
    };
    return _cache;
  }
  /* À appeler si le thème change en cours de route (rare) pour relire les tokens. */
  function invalideCache() { _cache = null; }

  /* — Le MONDE d'une fiche : 'nuit' (couchage) ou 'jour' (activité).
       Vérité unique RNR_TAGS — aucune logique dupliquée ici. */
  function estNuit(fiche) {
    try {
      if (global.RNR_TAGS && typeof global.RNR_TAGS.estCouchage === 'function') {
        return global.RNR_TAGS.estCouchage(fiche) === true;
      }
    } catch (e) { /* repli prudent ci-dessous */ }
    return false; /* défaut : jour */
  }

  /* — Le STATUT d'une fiche, par priorité de SENS. La forme en découle.
       placé (numéro fourni) > épingle > mon cœur > cœur d'un autre > neutre.
       etat = { epingle, coeurMoi, coeurAutre } ; opts.numero = placé dans le trajet. */
  function statutDe(etat, opts) {
    if (opts && opts.numero != null) return 'place';
    if (!etat) return 'neutre';
    if (etat.epingle)    return 'epingle';
    if (etat.coeurMoi)   return 'coeur';
    if (etat.coeurAutre) return 'coeur';   /* même forme cœur ; nuance possible plus tard */
    return 'neutre';
  }

  /* ── Les SILHOUETTES (SVG inline, couleur = monde) ──────────────────
     Chaque forme reçoit la couleur de fond (jour/nuit) + le liseré.
     Tailles pensées pour une carte dense : nettes mais pas envahissantes. */

  /* Rond simple — un lieu. */
  function svgRond(coul, bord, t) {
    var r = t / 2 - 2;
    return '<svg width="' + t + '" height="' + t + '" viewBox="0 0 ' + t + ' ' + t + '">' +
      '<circle cx="' + (t/2) + '" cy="' + (t/2) + '" r="' + r + '" fill="' + coul + '" stroke="' + bord + '" stroke-width="2.5"/>' +
      '</svg>';
  }

  /* Rond numéroté — placé dans le trajet. Le chiffre prend la couleur lisible du monde. */
  function svgRondNum(coul, bord, ink, num, t) {
    var r = t / 2 - 2;
    return '<svg width="' + t + '" height="' + t + '" viewBox="0 0 ' + t + ' ' + t + '">' +
      '<circle cx="' + (t/2) + '" cy="' + (t/2) + '" r="' + r + '" fill="' + coul + '" stroke="' + bord + '" stroke-width="2.5"/>' +
      '<text x="' + (t/2) + '" y="' + (t/2) + '" text-anchor="middle" dominant-baseline="central" ' +
      'font-family="Inter,sans-serif" font-weight="800" font-size="' + Math.round(t*0.46) + '" fill="' + ink + '">' + num + '</text>' +
      '</svg>';
  }

  /* Cœur — coup de cœur. Rempli couleur monde, liseré pour ressortir. */
  function svgCoeur(coul, bord, t) {
    /* path cœur normalisé sur une boîte 24x24, mis à l'échelle. Tracé corrigé
       02/07 : l'ancien était asymétrique (lobe gauche trop large, pointe
       décalée à droite) — repéré par Bruno sur une maquette à fond plat où
       ça sautait aux yeux. Ce tracé est symétrique autour de x=12. */
    var s = t / 24;
    return '<svg width="' + t + '" height="' + t + '" viewBox="0 0 24 24">' +
      '<path transform="scale(1)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" ' +
      'fill="' + coul + '" stroke="' + bord + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '</svg>';
  }

  /* Épingle — retenu, en attente. Goutte classique de carte, couleur monde. */
  function svgEpingle(coul, bord, t) {
    return '<svg width="' + t + '" height="' + t + '" viewBox="0 0 24 24">' +
      '<path d="M12 2c-3.9 0-7 3.1-7 7 0 5 7 13 7 13s7-8 7-13c0-3.9-3.1-7-7-7z" ' +
      'fill="' + coul + '" stroke="' + bord + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<circle cx="12" cy="9" r="2.4" fill="' + bord + '"/>' +
      '</svg>';
  }

  /* ── API PUBLIQUE ──────────────────────────────────────────────────
     icone(fiche, etat, opts?) → L.divIcon prêt à poser sur un marqueur.
       fiche : la fiche (pour estCouchage → monde)
       etat  : { epingle, coeurMoi, coeurAutre } (statut → forme)
       opts  : { taille?, numero? } — numero présent → rond numéroté (placé)
  */
  function icone(fiche, etat, opts) {
    if (!global.L) return null;
    etat = etat || {};
    opts = opts || {};
    var c = couleurs();
    var nuit = estNuit(fiche);
    var coul = nuit ? c.nuit : c.jour;
    var ink  = nuit ? c.nuitInk : c.jourInk;
    var statut = statutDe(etat, opts);

    var taille, html;
    if (statut === 'place') {
      taille = opts.taille || 30;
      html = svgRondNum(coul, c.bord, ink, opts.numero, taille);
    } else if (statut === 'epingle') {
      taille = opts.taille || 38;          /* la goutte a besoin de hauteur, agrandie (Bruno 29/06) */
      html = svgEpingle(coul, c.bordEpingle, taille);
    } else if (statut === 'coeur') {
      taille = opts.taille || 28;
      html = svgCoeur(coul, c.bord, taille);
    } else {
      taille = opts.taille || 20;
      html = svgRond(coul, c.bord, taille);
    }

    /* L'ancre dépend de la forme : goutte = pointe en bas, rond/cœur = centre. */
    var anchor;
    if (statut === 'epingle') anchor = [taille / 2, taille];   /* la pointe touche le sol */
    else anchor = [taille / 2, taille / 2];

    return global.L.divIcon({
      className: 'rnr-mk',
      html: html,
      iconSize: [taille, taille],
      iconAnchor: anchor,
      popupAnchor: [0, -Math.round(taille * 0.55)]
    });
  }

  /* Couleur du tracé reliant l'itinéraire (pour que les pages ne la codent pas en dur). */
  function couleurTrace() { return couleurs().trace; }

  /* (10/07, retour Bruno) : chaque SÉJOUR à excursions a SA PROPRE couleur —
     le trajet principal garde toujours la même (couleurTrace, D-MK inchangée),
     mais les pétales doivent se distinguer les uns des autres au premier coup
     d'œil, y compris quand plusieurs séjours à excursions coexistent sur le
     même voyage. Palette dédiée, SANS rapport avec la grammaire de statut des
     marqueurs (jour/nuit/épingle/cœur) — jamais la même couleur qu'une de ces
     4-là, pour ne jamais laisser croire qu'un pétale est un statut de fiche.
     Un seul endroit pour l'attribution : Hub, Horizon et Voyage utilisent tous
     cette fonction, avec le même index (position du séjour dans la chaîne
     principale) → même séjour = même couleur, quelle que soit la page. */
  var EXCURSION_PALETTE = ['--mk-excursion-1', '--mk-excursion-2', '--mk-excursion-3', '--mk-excursion-4', '--mk-excursion-5'];
  var EXCURSION_PALETTE_REPLI = ['#B8631F', '#6B3288', '#3D6B35', '#A83250', '#4A5FA8'];
  function couleurExcursion(index) {
    var i = ((index % EXCURSION_PALETTE.length) + EXCURSION_PALETTE.length) % EXCURSION_PALETTE.length;
    return tok(EXCURSION_PALETTE[i], EXCURSION_PALETTE_REPLI[i]);
  }

  /* Marqueur MAISON : le point de départ/retour du groupe (groupes.*_depart).
     Pastille or au token --mk-jour, contour blanc, petite maison dedans.
     Volontairement distincte des pastilles numérotées (ce n'est pas une étape,
     c'est l'ancrage du voyage). Une seule icône sert au départ ET au retour. */
  function iconeMaison(opts) {
    opts = opts || {};
    var t = opts.taille || 34;
    var c = couleurs();
    var r = t / 2;
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + t + '" height="' + t + '" viewBox="0 0 ' + t + ' ' + t + '">' +
      '<circle cx="' + r + '" cy="' + r + '" r="' + (r - 1.5) + '" fill="' + c.jour + '" stroke="' + c.bord + '" stroke-width="2.5"/>' +
      '<path d="M' + r + ' ' + (r - t * 0.18) + ' L' + (r + t * 0.22) + ' ' + (r + t * 0.02) +
        ' L' + (r + t * 0.15) + ' ' + (r + t * 0.02) + ' L' + (r + t * 0.15) + ' ' + (r + t * 0.20) +
        ' L' + (r - t * 0.15) + ' ' + (r + t * 0.20) + ' L' + (r - t * 0.15) + ' ' + (r + t * 0.02) +
        ' L' + (r - t * 0.22) + ' ' + (r + t * 0.02) + ' Z" fill="' + c.jourInk + '"/>' +
      '</svg>';
    return L.divIcon({
      html: svg,
      className: 'rnr-mk rnr-mk-maison',
      iconSize: [t, t],
      iconAnchor: [r, r],
      popupAnchor: [0, -Math.round(t * 0.55)]
    });
  }

  /* Légende prête à afficher (libellés courts). */
  function legende() {
    return {
      forme:   [{ forme: 'rond',    texte: 'Un lieu' },
                { forme: 'coeur',   texte: 'Coup de cœur' },
                { forme: 'epingle', texte: 'Retenu pour le voyage' },
                { forme: 'rondNum', texte: 'Placé dans le trajet' }],
      couleur: [{ cle: 'jour', texte: 'Activité (jour)' },
                { cle: 'nuit', texte: 'Couchage (nuit)' }]
    };
  }

  /* ───────────────────────────────────────────────────────────────────────
     TRACÉ ROUTIER — un seul endroit pour tout le site (Hub + Voyage).
     Relie une suite de points en suivant LES ROUTES (via l'Edge Function
     'route' → OpenRouteService), au lieu d'une ligne droite qui coupe l'océan.

     traceRoute(map, layer, latlngs, cfg, opts) :
       map     : la carte Leaflet (pour rien aujourd'hui mais réservé).
       layer   : le L.layerGroup où dessiner (on y ajoute les polylignes).
       latlngs : [[lat,lng], [lat,lng], ...] dans l'ordre du trajet (≥2).
       cfg     : { surl, skey } — URL Supabase + clé anon (les pages les ont déjà).
       opts    : { profile } optionnel ('driving-car' par défaut).
     → renvoie une Promise résolue avec { ok, distance_km, duree_h } si routé,
       ou { ok:false } si on a dû retomber sur la ligne droite.

     ROBUSTESSE : si l'Edge Function échoue, tarde (>8s) ou renvoie autre chose
     qu'un GeoJSON exploitable, on dessine la LIGNE DROITE (comportement d'avant).
     Le tracé n'est JAMAIS absent. Le site ne casse pas.
  */
  function _ligneDroite(layer, latlngs, leger, couleur) {
    var col = couleur || couleurTrace();
    if (leger) {
      // (10/07, retour Bruno) : « sans le chemin principal les pétales sont pas
      // très lisibles » — trait remonté à 4px et bien opaque (avant 2px/.55 :
      // trop fin dès qu'il devient la SEULE chose affichée sur la carte).
      // Toujours distinct du trajet principal (pas de halo, pointillé plus long).
      L.polyline(latlngs, { color: col, opacity: 0.85, weight: 4, dashArray: '9,6' }).addTo(layer);
    } else {
      L.polyline(latlngs, { color: col, opacity: 0.2, weight: 10 }).addTo(layer);
      L.polyline(latlngs, { color: col, weight: 3, dashArray: '10,6' }).addTo(layer);
    }
  }

  /* Flèches de SENS le long du tracé (chevrons orientés dans la direction de marche).
     Posées à intervalles réguliers pour qu'on lise l'aller du retour sans ambiguïté.
     Un chevron = un petit divIcon SVG tourné selon l'angle du segment. */
  function _capDeg(a, b) {
    // Angle écran (degrés, 0 = est) de a vers b en [lat,lng]. La longitude est
    // compressée selon la latitude (projection Web Mercator) → on pondère dLng par
    // cos(lat) pour que la flèche pointe vraiment dans le sens du tracé à l'écran.
    var latMoy = (a[0] + b[0]) / 2 * Math.PI / 180;
    var dLng = (b[1] - a[1]) * Math.cos(latMoy);
    var dLat = b[0] - a[0];
    return Math.atan2(dLat, dLng) * 180 / Math.PI;
  }
  function _flechesSens(layer, trace, couleur) {
    if (!trace || trace.length < 2) return;
    var col = couleur || couleurTrace();
    // Une flèche à intervalles réguliers (~10 au total), jamais trop pour ne pas charger.
    var pas = Math.max(6, Math.floor(trace.length / 10));
    for (var i = pas; i < trace.length - 1; i += pas) {
      var a = trace[i - 1], b = trace[i];
      var ang = -_capDeg(a, b); // CSS rotate : sens horaire → on inverse le cap (0 = est).
      // Triangle SVG plein, pointe vers la droite (est) avant rotation. Halo blanc pour
      // ressortir sur le tracé doré. Taille généreuse pour être lisible à l'échelle carte.
      var svg =
        '<svg width="18" height="18" viewBox="0 0 18 18" style="transform:rotate(' + ang + 'deg);display:block;">' +
        '<circle cx="9" cy="9" r="8" fill="#fff" opacity="0.9"/>' +
        '<path d="M6 4 L13 9 L6 14 Z" fill="' + col + '"/>' +
        '</svg>';
      L.marker(b, {
        icon: L.divIcon({ html: svg, className: 'rnr-mk-fleche', iconSize: [18, 18], iconAnchor: [9, 9] }),
        interactive: false,
        keyboard: false
      }).addTo(layer);
    }
  }

  /* Dessine un tracé routier déjà calculé (liste de [lat,lng]) dans le layer.
     leger=true (10/07) : style EXCURSION — plus fin, pointillé, sans flèches.
     couleur : override explicite (10/07, palette par séjour) — sinon couleurTrace(). */
  function _dessineTrace(layer, trace, leger, couleur) {
    var col = couleur || couleurTrace();
    if (leger) {
      L.polyline(trace, { color: col, opacity: 0.85, weight: 4, dashArray: '9,6' }).addTo(layer);
    } else {
      L.polyline(trace, { color: col, opacity: 0.2, weight: 10 }).addTo(layer);
      L.polyline(trace, { color: col, weight: 3 }).addTo(layer);
      _flechesSens(layer, trace, col);
    }
  }

  /* CACHE MÉMOIRE du tracé (le temps de la page ouverte). Économise le quota ORS :
     tant que la suite des étapes est identique, on ne rappelle PAS le routeur.
     Vidé au rechargement de page (volontaire — cf. décision « cache option 1 »).
     Clé = profil + coordonnées arrondies (5 décimales ≈ 1 m, largement assez).
     Sert aussi bien pour le trajet entier que pour un tronçon isolé (09/07). */
  var _routeCache = {};
  function _cleRoute(latlngs, profile) {
    return profile + '|' + latlngs.map(function (p) {
      return p[0].toFixed(5) + ',' + p[1].toFixed(5);
    }).join(';');
  }

  /* Distance à vol d'oiseau (km, formule de Haversine). Sert de repli quand un
     tronçon ne peut pas être routé (cf. _routeParTroncons) : mieux qu'un chiffre
     manquant, et cohérent avec l'estimation « à vol d'oiseau » déjà affichée
     ailleurs (Roadbook, Hub) avant que le tracé réel ne réponde. */
  function _haversineKm(a, b) {
    var R = 6371;
    var dLat = (b[0] - a[0]) * Math.PI / 180;
    var dLng = (b[1] - a[1]) * Math.PI / 180;
    var la1 = a[0] * Math.PI / 180, la2 = b[0] * Math.PI / 180;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }
  // Vitesse moyenne route pour estimer la durée d'un tronçon non routable — même
  // valeur que l'estimation provisoire du Roadbook (RB_VITESSE_MOY_KMH), gardée
  // ici en dur pour ne pas dépendre d'une variable propre à une seule page.
  var _VITESSE_FALLBACK_KMH = 65;

  /* FILE D'ATTENTE ORS (10/07, retour Bruno — capture d'écran à l'appui) : avec
     plusieurs pétales, un render() tire maintenant plusieurs appels ORS EN MÊME
     TEMPS (le trajet principal + un par jour de séjour). Au-delà d'un certain
     nombre simultané, OpenRouteService répond en erreur — des 502 quasi
     instantanés (quelques dizaines de ms), signature d'un plafond de requêtes
     en parallèle, pas d'un vrai échec de calcul. On sérialise : 2 requêtes en
     vol maximum, les autres patientent en file — un seul endroit, ça corrige
     toutes les pages (Hub, Horizon, Voyage) d'un coup. */
  var _fileOrsEnAttente = [];
  var _fileOrsEnVol = 0;
  var _FILE_ORS_MAX = 2;
  function _fileOrs(tache) {
    return new Promise(function (resolve, reject) {
      _fileOrsEnAttente.push({ tache: tache, resolve: resolve, reject: reject });
      _traiteFileOrs();
    });
  }
  function _traiteFileOrs() {
    if (_fileOrsEnVol >= _FILE_ORS_MAX || !_fileOrsEnAttente.length) return;
    var item = _fileOrsEnAttente.shift();
    _fileOrsEnVol++;
    item.tache().then(
      function (r) { _fileOrsEnVol--; item.resolve(r); _traiteFileOrs(); },
      function (e) { _fileOrsEnVol--; item.reject(e); _traiteFileOrs(); }
    );
  }

  /* Appelle l'Edge Function pour UNE suite de points donnée (le trajet entier OU
     un seul tronçon). Résout avec { trace, distance_km, duree_h } ou rejette —
     ne dessine rien, ne décide de rien : c'est à l'appelant de choisir le repli.
     Factorisé pour être appelé une fois sur tout le trajet (cas normal, économe
     en quota) ou une fois par tronçon (repli fin, cf. _routeParTroncons).
     La requête HTTP elle-même passe par _fileOrs() (ci-dessus) — jamais plus de
     _FILE_ORS_MAX en vol en même temps, quel que soit le nombre d'appelants. */
  function _appelORS(latlngs, cfg, profile) {
    return _fileOrs(function () {
      // ORS attend [lng,lat] ; Leaflet nous donne [lat,lng] → on inverse.
      var pts = latlngs.map(function (p) { return [p[1], p[0]]; });
      var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      // (10/07, retour Bruno) : 8s coupait trop tôt les longs tronçons (700+ km,
      // ex. maison en Alsace → première étape dans les Pyrénées) — le calcul
      // n'avait pas fini, on retombait en ligne droite alors que le point était
      // bon. 20s laisse le temps à un vrai grand trajet de se calculer, tout en
      // continuant à couper une requête réellement bloquée.
      var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);

      return fetch(cfg.surl + '/functions/v1/dynamic-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': cfg.skey,
          'Authorization': 'Bearer ' + cfg.skey
        },
        body: JSON.stringify({
          action: 'route',
          points: pts,
          profile: profile
        }),
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (r) {
          if (r.ok) return r.json();
          // (18/07, B76) Avant : on rejetait juste "http 502", aucun détail —
          // impossible de savoir SI c'était le quota ORS, une clé absente, un
          // point hors réseau routier, etc. On lit le corps pour de vrai.
          return r.text().then(function (txt) {
            return Promise.reject('http ' + r.status + (txt ? ' — ' + txt.slice(0, 200) : ''));
          });
        })
        .then(function (geo) {
          clearTimeout(to);
          var feat = geo && geo.features && geo.features[0];
          var coords = feat && feat.geometry && feat.geometry.coordinates;
          if (!coords || !coords.length) throw 'pas de géométrie';
          // GeoJSON = [lng,lat] → Leaflet veut [lat,lng].
          var trace = coords.map(function (c) { return [c[1], c[0]]; });
          var s = (feat.properties && feat.properties.summary) || {};
          var dist = s.distance ? Math.round(s.distance / 1000) : null;
          var duree = s.duration ? (s.duration / 3600) : null;
          return { trace: trace, distance_km: dist, duree_h: duree };
        })
        .catch(function (e) { clearTimeout(to); return Promise.reject(e); });
    });
  }

  /* REPLI FIN (09/07, retour Bruno — Cirque de Gavarnie) : un seul point non
     routable (un site accessible seulement à pied, hors de toute route) faisait
     échouer l'appel groupé, et TOUT le trajet retombait en ligne droite — même
     les tronçons qui, eux, se routaient très bien. Ici, on route chaque tronçon
     séparément : un point capricieux ne casse plus que SON tronçon. Chaque
     tronçon garde son propre repli (ligne droite + estimation Haversine) pour
     que le total affiché reste cohérent même si un morceau n'a pas pu être
     routé. Un seul cache (_routeCache), qu'on l'appelle en gros ou par bouts. */
  function _routeParTroncons(layer, latlngs, cfg, profile, leger, couleur) {
    var troncons = [];
    for (var i = 0; i < latlngs.length - 1; i++) troncons.push([latlngs[i], latlngs[i + 1]]);

    var promesses = troncons.map(function (seg) {
      var cle = _cleRoute(seg, profile);
      var hit = _routeCache[cle];
      if (hit) return Promise.resolve({ ok: true, trace: hit.trace, distance_km: hit.distance_km, duree_h: hit.duree_h });
      return _appelORS(seg, cfg, profile)
        .then(function (res) {
          _routeCache[cle] = res;
          return { ok: true, trace: res.trace, distance_km: res.distance_km, duree_h: res.duree_h };
        })
        .catch(function (e) {
          console.warn('RNR_MARQUEURS.traceRoute : tronçon non routable, repli ligne droite estimée.', seg, e);
          var km = _haversineKm(seg[0], seg[1]);
          return { ok: false, trace: seg, distance_km: km, duree_h: km / _VITESSE_FALLBACK_KMH };
        });
    });

    return Promise.all(promesses).then(function (resultats) {
      var distTot = 0, dureeTot = 0, unTronconRoute = false, unTronconEnPanne = false;
      resultats.forEach(function (r) {
        if (r.ok) { _dessineTrace(layer, r.trace, leger, couleur); unTronconRoute = true; }
        else { _ligneDroite(layer, r.trace, leger, couleur); unTronconEnPanne = true; }
        if (r.distance_km != null) distTot += r.distance_km;
        if (r.duree_h != null) dureeTot += r.duree_h;
      });
      return {
        ok: unTronconRoute,          // au moins un tronçon routé = total exploitable
        distance_km: Math.round(distTot),
        duree_h: dureeTot,
        partiel: unTronconEnPanne    // un ou plusieurs tronçons repliés en ligne droite
      };
    });
  }

  function traceRoute(map, layer, latlngs, cfg, opts) {
    opts = opts || {};
    if (!layer || !Array.isArray(latlngs) || latlngs.length < 2) {
      return Promise.resolve({ ok: false });
    }
    var profile = opts.profile || 'driving-car';
    // (10/07) opts.leger=true : style EXCURSION (nuit ↔ fiches du jour, aller-
    // retour) — visuellement plus fin/pointillé. opts.couleur : override explicite
    // (ex. couleurExcursion(index)) — sinon couleurTrace() comme avant.
    var leger = !!opts.leger;
    var couleur = opts.couleur || null;

    // (0) CACHE : itinéraire déjà routé → on redessine sans appeler ORS.
    var cle = _cleRoute(latlngs, profile);
    var hit = _routeCache[cle];
    if (hit) {
      _dessineTrace(layer, hit.trace, leger, couleur);
      return Promise.resolve({ ok: true, distance_km: hit.distance_km, duree_h: hit.duree_h, cache: true, trace: hit.trace });
    }

    // Repli immédiat si on n'a pas de quoi appeler l'Edge Function.
    if (!cfg || !cfg.surl || !cfg.skey) {
      console.warn('RNR_MARQUEURS.traceRoute : repli ligne droite — cfg incomplet (surl/skey manquant).', cfg);
      _ligneDroite(layer, latlngs, leger, couleur);
      return Promise.resolve({ ok: false });
    }

    // (1) Appel groupé — un seul appel ORS pour tout le trajet, comme avant
    // (le cas normal reste aussi économe en quota qu'aujourd'hui).
    return _appelORS(latlngs, cfg, profile)
      .then(function (res) {
        _routeCache[cle] = res;
        _dessineTrace(layer, res.trace, leger, couleur);
        // trace incluse dans la résolution (19/07, Bloc4 suite) : permet à
        // l'appelant (voyage.html) de mémoriser le VRAI tracé routier en base
        // pour l'afficher sur la page publique de partage SANS jamais rappeler
        // ORS depuis un accès non authentifié (cf. commentaire dynamic-action v27).
        return { ok: true, distance_km: res.distance_km, duree_h: res.duree_h, trace: res.trace };
      })
      .catch(function (e) {
        // (18/07, B76) Journalisation systématique AVANT de retomber sur le
        // repli fin — jusqu'ici cette erreur disparaissait silencieusement,
        // rendant tout diagnostic impossible sans deviner. Toujours visible
        // en console, même si le repli lui-même reste automatique/silencieux
        // pour l'utilisateur (comportement voulu, cf. commentaire plus haut).
        console.warn('RNR_MARQUEURS.traceRoute : appel groupé ORS échoué, repli tronçon par tronçon.', e);
        // (2) Repli fin, tronçon par tronçon (09/07) — AVANT la ligne droite
        // globale : un point isolé impossible à router ne doit plus emporter
        // tout le trajet avec lui. Le tracé n'est toujours JAMAIS absent.
        return _routeParTroncons(layer, latlngs, cfg, profile, leger, couleur);
      });
  }

  global.RNR_MARQUEURS = {
    icone: icone,
    iconeMaison: iconeMaison,
    estNuit: estNuit,
    couleurTrace: couleurTrace,
    couleurExcursion: couleurExcursion,
    traceRoute: traceRoute,
    legende: legende,
    invalideCache: invalideCache
  };
})(window);
