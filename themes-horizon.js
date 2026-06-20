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

  /* ── Sous-distinctions de tags.js → thème(s) (réutilise la taxonomie) ──────
     Une sous-distinction peut nourrir plusieurs thèmes. On ne perd pas le
     travail v2 : on le branche sur les thèmes. */
  var SD_VERS_THEMES = {
    patrimoine: ['culture'],
    musee:      ['culture'],
    paysage:    ['nature'],
    balade:     ['nature'],
    baignade:   ['mer','nature'],
    sport:      ['sport'],
    terroir:    ['terroir'],
    parcs:      ['loisirs'],
    animaux:    ['loisirs'],
    spectacle:  ['loisirs','culture']
    /* camping / hotel / table / cafebar / bienetre = LOGISTIQUE → aucun thème */
  };

  /* ── GÉOGRAPHIE (GPS) : filets façades maritimes + massifs ─────────────────
     Reprend et COMPLÈTE carto-lentilles (qui ne voyait que l'Atlantique ouest
     et ratait le Massif central). Approximation honnête de pré-tri ; une vraie
     élévation viendra plus tard (chantier dédié). */
  function estCotier(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    /* Atlantique / Manche : façade ouest. */
    if (lng < -1.05) return true;
    /* Méditerranée : sud-est sous ~43.6° et est de ~3°. */
    if (lat < 43.6 && lng > 3.0) return true;
    /* Manche / Mer du Nord : nord au-dessus de ~49.3°, ouest de ~2.6°. */
    if (lat > 49.3 && lng < 2.6) return true;
    return false;
  }

  function estMontagne(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    /* Cœurs de massifs resserrés (on vise la VRAIE montagne, pas le piémont,
       qui ferait apparaître des campings de plaine en "Montagne"). Calé sur
       les coordonnées réelles des fiches. */
    var pyrenees     = lat < 43.05 && lng >= -0.90 && lng <= 2.1;   /* haute chaîne */
    var alpes        = lat >= 44.0 && lat <= 46.3 && lng > 6.0;     /* Alpes franches */
    var jura         = lat >= 46.1 && lat <= 47.2 && lng >= 5.7 && lng <= 6.9;
    var vosges       = lat >= 47.85 && lat <= 48.45 && lng >= 6.85 && lng <= 7.10; /* crêtes, exclut piémont alsacien */
    var massifCentral= lat >= 44.6 && lat <= 45.6 && lng >= 2.4 && lng <= 4.0;
    return pyrenees || alpes || jura || vosges || massifCentral;
  }

  /* Cherche un mot-clé d'un thème dans le nom. Le mot-clé doit commencer un
     mot (frontière AVANT) — ainsi « disney » attrape « disneyland », mais on
     évite « cap » ⊂ « scapin ». Les pièges où le préfixe matche un mot sans
     rapport (cap⊂capitale, port⊂portalet, mont⊂montre) sont neutralisés en
     déclarant ces mots-clés en LOCUTION (avec un espace : « cap », « port de »). */
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
    var nom = (fiche && fiche.nom ? String(fiche.nom) : '').toLowerCase();
    var lat = (fiche && fiche.lat != null) ? +fiche.lat : null;
    var lng = (fiche && fiche.lng != null) ? +fiche.lng : null;

    /* 1) Le NOM prime (règle d'or). */
    Object.keys(THEMES).forEach(function (t) {
      if (nom && nomMatcheTheme(nom, t)) trouve[t] = true;
    });

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
    if (tags.indexOf('baignade') !== -1)  { trouve.mer = true; trouve.nature = true; }

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
