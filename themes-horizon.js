/* ============================================================================
   RockNRoad — Thèmes d'Horizon (couche par-dessus tags.js)
   ----------------------------------------------------------------------------
   Master 4.15bis : Horizon range les fiches par THÈME D'ENVIE (≠ famille de
   fiche). 7 thèmes, le plus large possible pour croiser les envies (4.13) :
     Culture · Nature · Mer · Montagne · Sport · Loisirs · Terroir.
   Une fiche peut porter PLUSIEURS thèmes (un château en bord de mer = Culture
   + Mer). On NE jette rien : on dérive de l'existant (nom prime — règle 08/06,
   types Google, GPS façades+massifs déjà amorcés dans carto-lentilles).

   Nuit/Pause restent LOGISTIQUES (où dormir / où manger) : pas des thèmes.

   PUR : aucun réseau, aucun DOM. Testable hors navigateur.
   ============================================================================ */
(function () {
  'use strict';

  /* Les 7 thèmes officiels (ordre = présentation). */
  var THEMES = {
    culture:  { libelle: 'Culture',  emoji: '🏛️' },
    nature:   { libelle: 'Nature',   emoji: '🌿' },
    mer:      { libelle: 'Mer',      emoji: '🌊' },
    montagne: { libelle: 'Montagne', emoji: '⛰️' },
    sport:    { libelle: 'Sport',    emoji: '🥾' },
    loisirs:  { libelle: 'Loisirs',  emoji: '🎡' },
    terroir:  { libelle: 'Terroir',  emoji: '🧺' }
  };

  /* ── INDICES DU NOM par thème (le NOM prime — règle d'or du 08/06) ─────────
     Massivement enrichi à partir des trous RÉELS révélés par les 51 fiches
     (Dune du Pilat, Cap Ferret, Cirque de Gavarnie, Ville close, Palais…).
     Le mot est cherché en minuscules dans le nom. Gratuit, stable, sous notre
     contrôle (contrairement aux types Google qui changent — release 12/02/26). */
  var MOTS = {
    culture: ['chateau','château','fort','fortress','citadelle','abbaye','cathédrale','cathedrale',
      'basilique','église','eglise','chapelle','monastère','monastere','prieuré','prieure','cloître','cloitre',
      'ruines','remparts','donjon','palais','manoir','château fort','cité','cite médiévale','cite medievale',
      'ville close','village','musée','musee','museum','galerie','mémorial','memorial','monument',
      'guédelon','guedelon','altschloss','colombages','beffroi','hôtel de ville'],
    nature: ['cascade','gorge','gorges','col ','sommet','pic ','grotte','grottes','gouffre','aven',
      'belvédère','belvedere','panorama','point de vue','réserve','reserve','parc naturel','parc national',
      'géoparc','geoparc','forêt','foret','marais','tourbière','tourbiere','source','résurgence','resurgence',
      'sentier','arboretum','jardin','jardins','karst','karstique','colorado'],
    mer: ['plage','plages','mer','océan','ocean','atlantique','méditerranée','mediterranee','manche',
      'côte','cote','littoral','dune','dunes','cap ','baie','golfe','presqu\u2019île','presqu\'ile',
      'estuaire','lagune','bassin','arcachon','calanque','calanques','phare','port de'],
    montagne: ['mont ','montagne','massif','cirque','vallée','vallee','aiguille','crête','crete',
      'glacier','névé','neve','téléphérique','telepherique','refuge','alpage','estive','ballon des',
      'puy','pyrénées','pyrenees','alpes','vosges','jura','cantal'],
    sport: ['via ferrata','escalade','accrobranche','rafting','canoë','canoe','kayak','parapente',
      'ski ','vtt','tyrolienne','sport','aventure','base nautique','spot de'],
    loisirs: ['parc d\'attraction','parc d attraction','disney','astérix','asterix','aquaparc','aquapark',
      'zoo','aquarium','parc animalier','accropark','luna park','fête foraine','fete foraine','bowling',
      'laser','karting','futuroscope','vulcania','puy du fou'],
    terroir: ['vignoble','vignobles','domaine','cave ','caves','cellier','distillerie','brasserie',
      'ferme','fromagerie','marché','marche couvert','halles','moulin','salines','miellerie','conservatoire']
  };

  /* Mots-mer AMBIGUS : ils existent aussi en intérieur (plage/dune/baie de LAC,
     bassin, lagune d'étang…). Ils ne donnent « mer » que si le GPS confirme la
     côte (estCotier). Les mots SANS ambiguïté (mer, océan, méditerranée,
     atlantique, manche, littoral, calanque, phare, port de…) restent fiables. */
  var MOTS_MER_AMBIGUS = ['plage','plages','dune','dunes','baie','bassin','lagune','cap '];

  /* ── Sous-distinctions de tags.js → thème(s) (réutilise la taxonomie) ──────
     Une sous-distinction peut nourrir plusieurs thèmes. On ne perd pas le
     travail v2 : on le branche sur les thèmes. */
  var SD_VERS_THEMES = {
    patrimoine: ['culture'],
    musee:      ['culture'],
    paysage:    ['nature'],
    balade:     ['nature'],
    baignade:   ['nature'],
    sport:      ['sport'],
    terroir:    ['terroir'],
    parcs:      ['loisirs'],
    animaux:    ['loisirs'],
    spectacle:  ['loisirs','culture']
    /* camping / hotel / table / cafebar / bienetre = LOGISTIQUE → aucun thème */
  };

  /* ── GÉOGRAPHIE (GPS) : littoral réel + filet montagne ──────────────────────
     Sujet (05/07, retour Bruno) : « pour un FAIT géographique, la précision
     doit venir de la source, pas d'une case à cocher ». Le littoral vient
     maintenant de Natural Earth (domaine public, mondial — via le miroir npm
     world-atlas, découpé sur l'Europe + Atlantique proche), chargé une fois au
     démarrage. Tant que ce n'est pas chargé (bref instant), on retombe sur
     l'ancien rectangle — jamais pire qu'avant, juste moins précis le temps du
     chargement. La montagne reste au rectangle en attendant les polygones
     officiels des massifs (chantier posé, données à récupérer par Bruno sur
     data.gouv.fr — non accessible depuis l'environnement de code). */
  var LITTORAL_SEUIL_KM = 15;
  var LITTORAL_ANNEAUX = null;   // rempli par le chargement ci-dessous : [[ [lng,lat], ... ], ...]
  var LITTORAL_CHARGEMENT = (function(){
    if (typeof fetch !== 'function') return null;
    return fetch('littoral-europe.geojson', {cache:'force-cache'})
      .then(function(r){ return r.json(); })
      .then(function(geo){
        var anneaux = [];
        (geo.features||[]).forEach(function(f){
          var coords = f.geometry && f.geometry.coordinates;
          if (!coords) return;
          coords.forEach(function(poly){
            poly.forEach(function(ring){ if (ring && ring.length>1) anneaux.push(ring); });
          });
        });
        LITTORAL_ANNEAUX = anneaux;
      })
      .catch(function(e){ console.warn('themes-horizon: littoral réel non chargé, repli sur rectangle', e); });
  })();
  // Distance point→segment en projection locale (suffisante pour un seuil de
  // quelques km — pas besoin d'une géodésie exacte pour ce test de pré-tri).
  function distancePointSegmentKm(lat, lng, lng1, lat1, lng2, lat2) {
    var R = 6371, cosLat = Math.cos(lat * Math.PI/180);
    function mx(lo){ return lo * Math.PI/180 * cosLat * R; }
    function my(la){ return la * Math.PI/180 * R; }
    var px = mx(lng), py = my(lat), x1 = mx(lng1), y1 = my(lat1), x2 = mx(lng2), y2 = my(lat2);
    var dx = x2-x1, dy = y2-y1, lenSq = dx*dx+dy*dy;
    var t = lenSq ? ((px-x1)*dx + (py-y1)*dy) / lenSq : 0;
    if (t<0) t=0; if (t>1) t=1;
    var cx = x1+t*dx, cy = y1+t*dy, ddx = px-cx, ddy = py-cy;
    return Math.sqrt(ddx*ddx + ddy*ddy);
  }
  function distanceLittoralKm(lat, lng) {
    if (!LITTORAL_ANNEAUX) return null;
    var min = Infinity;
    for (var i=0; i<LITTORAL_ANNEAUX.length; i++) {
      var ring = LITTORAL_ANNEAUX[i];
      for (var j=0; j<ring.length-1; j++) {
        var d = distancePointSegmentKm(lat, lng, ring[j][0], ring[j][1], ring[j+1][0], ring[j+1][1]);
        if (d<min) min=d;
      }
    }
    return min;
  }
  function estCotierApprox(lat, lng) {
    /* Ancien filet par rectangles — conservé UNIQUEMENT comme repli le temps
       du chargement du vrai littoral. Ne plus enrichir : à retirer une fois
       qu'on est sûr que le chargement réseau est toujours fiable en prod. */
    if (lng < -1.05) return true;
    if (lat < 43.6 && lng > 3.0) return true;
    if (lat > 49.3 && lng < 2.6) return true;
    return false;
  }
  function estCotier(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    var d = distanceLittoralKm(lat, lng);
    if (d !== null) return d <= LITTORAL_SEUIL_KM;
    return estCotierApprox(lat, lng);
  }

  /* Massifs officiels (05/07) : décret du 16 janvier 2004 (loi montagne),
     communes → massif fournies par Bruno (data.gouv.fr), jointes aux contours
     communaux réels (miroir GitHub gregoiredavid/france-geojson) et fusionnées
     en un seul contour par massif. Même moteur que les régions (`carto.js`,
     point-dans-polygone) — un seul endroit pour "être dans un polygone".
     Chargé une fois au démarrage ; tant que ce n'est pas prêt, repli sur
     l'ancien rectangle (jamais pire qu'avant, juste moins précis le temps du
     chargement). filet:false volontairement : être à côté d'un massif ne
     veut pas dire qu'on y est (contrairement aux régions, toujours pourvues). */
  var MASSIFS_DECOUPAGE = null;
  var MASSIFS_CHARGEMENT = (function(){
    if (typeof fetch !== 'function') return null;
    return fetch('massifs-france.geojson', {cache:'no-cache'})
      .then(function(r){ return r.json(); })
      .then(function(geo){
        if (window.RNR_CARTO_MOTEUR) {
          MASSIFS_DECOUPAGE = window.RNR_CARTO_MOTEUR.creerDecoupage(geo, {filet:false});
        }
      })
      .catch(function(e){ console.warn('themes-horizon: massifs réels non chargés, repli sur rectangle', e); });
  })();
  function estMontagneApprox(lat, lng) {
    /* Ancien filet par rectangles — conservé UNIQUEMENT comme repli le temps
       du chargement des vrais massifs. Ne plus enrichir. */
    var pyrenees     = lat < 43.05 && lng >= -0.90 && lng <= 2.1;
    var alpes        = lat >= 44.0 && lat <= 46.3 && lng > 6.0;
    var jura         = lat >= 46.1 && lat <= 47.2 && lng >= 5.7 && lng <= 6.9;
    var vosges       = lat >= 47.85 && lat <= 48.45 && lng >= 6.85 && lng <= 7.10;
    var massifCentral= lat >= 44.6 && lat <= 45.6 && lng >= 2.4 && lng <= 4.0;
    return pyrenees || alpes || jura || vosges || massifCentral;
  }
  function estMontagne(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (MASSIFS_DECOUPAGE) return !!MASSIFS_DECOUPAGE.zoneDe(lat, lng);
    return estMontagneApprox(lat, lng);
  }

  /* Cherche un mot-clé d'un thème dans le nom. Le mot-clé doit commencer un
     mot (frontière AVANT) — ainsi « disney » attrape « disneyland », mais on
     évite « cap » ⊂ « scapin ». Les pièges où le préfixe matche un mot sans
     rapport (cap⊂capitale, port⊂portalet, mont⊂montre) sont neutralisés en
     déclarant ces mots-clés en LOCUTION (avec un espace : « cap », « port de »). */
  /* Un mot (simple ou locution) est-il présent dans le nom ? Même règle que
     nomMatcheTheme mais pour UN mot donné (sert à l'arbitrage mer ambigu). */
  function motDansNom(nomLower, mot) {
    if (mot.indexOf(' ') !== -1) return nomLower.indexOf(mot) !== -1;
    var re = new RegExp('(^|[^a-zà-ÿ])' + escapeRe(mot), 'i');
    return re.test(nomLower);
  }

  function nomMatcheTheme(nomLower, theme) {
    var liste = MOTS[theme] || [];
    for (var i = 0; i < liste.length; i++) {
      var mot = liste[i];
      if (mot.indexOf(' ') !== -1) {
        if (nomLower.indexOf(mot) !== -1) return true;        /* locution : inclusion exacte */
      } else {
        var re = new RegExp('(^|[^a-zà-ÿ])' + escapeRe(mot), 'i');
        if (re.test(nomLower)) return true;                   /* mot simple : début de mot */
      }
    }
    return false;
  }
  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* ── CŒUR : thèmes d'une fiche (tableau, car multi-thèmes) ─────────────────
     Entrées : la fiche (nom, lat, lng, tags) + éventuellement le résultat de
     RNR_TAGS.classerDepuisGoogle (sousDistinction) si dispo.
     Sortie : ['culture','mer', ...] sans doublon. */
  function themesDeFiche(fiche, options) {
    options = options || {};
    var trouve = {};
    /* 0-bis) SOURCE DE VÉRITÉ (05/07, décision Bruno) : la colonne `envies` est
       la réponse EXPLICITE et définitive — pré-remplie par cette même fonction
       à la création, mais confirmée ou corrigée par un humain, et obligatoire.
       Si elle existe, elle fait foi, un point c'est tout ; la devinette
       ci-dessous ne sert plus que de filet pour une fiche pas encore migrée. */
    if (fiche && Array.isArray(fiche.envies) && fiche.envies.length) {
      return fiche.envies.slice();
    }
    /* 0) COUCHAGE = 8e thème « nuit », et RIEN d'autre (décidé 24/06 avec Bruno :
       un camping n'est pas 'culture'). On réutilise la VÉRITÉ UNIQUE estCouchage
       de tags.js — aucune logique de classification dupliquée ici. Si la fiche est
       un couchage, on court-circuite : elle n'appartient qu'au thème nuit. */
    try {
      var _tags = (typeof window !== 'undefined' && window.RNR_TAGS) ? window.RNR_TAGS : null;
      if (_tags && typeof _tags.estCouchage === 'function' && _tags.estCouchage(fiche)) {
        return ['nuit'];
      }
    } catch (e) { /* si tags.js absent : la fiche suit la détection normale */ }
    var nom = (fiche && fiche.nom ? String(fiche.nom) : '').toLowerCase();
    var lat = (fiche && fiche.lat != null) ? +fiche.lat : null;
    var lng = (fiche && fiche.lng != null) ? +fiche.lng : null;

    /* 1) Le NOM prime (règle d'or). */
    Object.keys(THEMES).forEach(function (t) {
      if (nom && nomMatcheTheme(nom, t)) trouve[t] = true;
    });

    /* 1bis) ARBITRAGE « plage/dune/baie… » par le GPS (décision Bruno) :
       un mot-mer AMBIGU (qui existe aussi pour un lac) ne suffit pas. Si « mer »
       n'a été posée QUE par un mot ambigu et que le GPS n'est PAS côtier, on
       retire « mer » (la fiche reste « nature »). Une vraie plage atlantique,
       elle, sera confirmée par estCotier à l'étape 4. */
    if (trouve.mer) {
      var motMerFiable = false, motMerAmbigu = false;
      (MOTS.mer || []).forEach(function (mot) {
        if (nom && motDansNom(nom, mot)) {
          if (MOTS_MER_AMBIGUS.indexOf(mot) !== -1) motMerAmbigu = true;
          else motMerFiable = true;
        }
      });
      var cotier = (lat != null && lng != null && options.geo !== false) ? estCotier(lat, lng) : false;
      if (motMerAmbigu && !motMerFiable && !cotier) {
        delete trouve.mer;        /* plage/dune/baie en intérieur → pas la mer */
        trouve.nature = true;     /* mais ça reste de la nature */
      }
    }

    /* 2) Sous-distinction tags.js (si on l'a — via classerDepuisGoogle). */
    var sd = options.sousDistinction || (fiche && fiche._sousDistinction) || null;
    if (sd && SD_VERS_THEMES[sd]) {
      SD_VERS_THEMES[sd].forEach(function (t) { trouve[t] = true; });
    }

    /* 3) Tags bruts de la fiche (filet souple, vocabulaire actuel). */
    var tags = Array.isArray(fiche && fiche.tags) ? fiche.tags : [];
    if (tags.indexOf('historique') !== -1) trouve.culture = true;
    if (tags.indexOf('musee') !== -1)      trouve.culture = true;
    if (tags.indexOf('nature') !== -1)     trouve.nature = true;
    if (tags.indexOf('vue') !== -1)        trouve.nature = true;
    if (tags.indexOf('randonnee') !== -1) { trouve.nature = true; trouve.sport = true; }
    if (tags.indexOf('baignade') !== -1)  { trouve.nature = true; }  /* baignade = nature ; la mer ne vient que du GPS côtier ou des mots marins */

    /* 4) GÉO : filets façades + massifs (en PLUS des mots). */
    if (options.geo !== false && lat != null && lng != null) {
      if (estCotier(lat, lng))   trouve.mer = true;
      if (estMontagne(lat, lng)) trouve.montagne = true;
    }

    return Object.keys(trouve);
  }

  var api = {
    THEMES: THEMES,
    MOTS: MOTS,
    estCotier: estCotier,
    estMontagne: estMontagne,
    themesDeFiche: themesDeFiche,
    listeThemes: function () {
      return Object.keys(THEMES).map(function (cle) {
        return { cle: cle, libelle: THEMES[cle].libelle, emoji: THEMES[cle].emoji };
      });
    }
  };

  if (typeof window !== 'undefined') window.RNR_THEMES = Object.freeze(api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
