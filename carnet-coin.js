/* ============================================================================
   RockNRoad — Le Carnet du coin (Horizon → Cockpit)
   ----------------------------------------------------------------------------
   Master 4.15bis : un couple THÈME × LIEU (1-2 régions max) engendre un paquet
   de fiches « du coin » = fiches du thème dans la/les région(s) choisie(s)
   + fiches limitrophes proches. Ce paquet part ensuite au Cockpit.

   Ce module est PUR (aucun accès réseau, aucun DOM) : on lui donne les fiches
   déjà chargées + rattachées (chaque fiche a _regionSvg), il rend le paquet.
   Testable hors navigateur.
   ============================================================================ */
(function () {
  'use strict';

  /* Voisinages des 22 anciennes régions (maille D-22, slugs de
     decoupage-france-regions.json). Donnée stable et factuelle : quelles
     régions se touchent. Sert à inclure les fiches "limitrophes proches"
     (le château à 30 min de l'autre côté de la frontière n'est pas exclu
     bêtement — Master 4.15bis).

     CACHE DÉRIVÉ, PAS UNE 2e SOURCE : cette table est CALCULÉE une fois depuis
     decoupage-france-regions.json (adjacence = ≥2 sommets de contour partagés).
     Le JSON reste l'unique vérité de la maille. Pour régénérer après un
     changement de découpage : recalculer l'adjacence des polygones du JSON.
     (Historique : était restée en 13 régions après le réalignement D-22 —
     la couche « juste à côté » était donc muette ; réparée ici.) */
  var VOISINS = {
    'ile-de-france':       ['bourgogne','centre','champagne-ardenne','haute-normandie','picardie'],
    'champagne-ardenne':   ['bourgogne','franche-comte','ile-de-france','lorraine','picardie'],
    'picardie':            ['champagne-ardenne','haute-normandie','ile-de-france','nord-pas-de-calais'],
    'haute-normandie':     ['basse-normandie','centre','ile-de-france','picardie'],
    'centre':              ['auvergne','basse-normandie','bourgogne','haute-normandie','ile-de-france','limousin','pays-de-la-loire','poitou-charentes'],
    'basse-normandie':     ['bretagne','centre','haute-normandie','pays-de-la-loire'],
    'bourgogne':           ['auvergne','centre','champagne-ardenne','franche-comte','ile-de-france','rhone-alpes'],
    'nord-pas-de-calais':  ['picardie'],
    'lorraine':            ['alsace','champagne-ardenne','franche-comte'],
    'alsace':              ['franche-comte','lorraine'],
    'franche-comte':       ['alsace','bourgogne','champagne-ardenne','lorraine','rhone-alpes'],
    'pays-de-la-loire':    ['basse-normandie','bretagne','centre','poitou-charentes'],
    'bretagne':            ['basse-normandie','pays-de-la-loire'],
    'poitou-charentes':    ['aquitaine','centre','limousin','pays-de-la-loire'],
    'aquitaine':           ['limousin','midi-pyrenees','poitou-charentes'],
    'midi-pyrenees':       ['aquitaine','auvergne','languedoc-roussillon','limousin'],
    'limousin':            ['aquitaine','auvergne','centre','midi-pyrenees','poitou-charentes'],
    'rhone-alpes':         ['auvergne','bourgogne','franche-comte','languedoc-roussillon','provence-alpes-cote-d-azur'],
    'auvergne':            ['bourgogne','centre','languedoc-roussillon','limousin','midi-pyrenees','rhone-alpes'],
    'languedoc-roussillon':['auvergne','midi-pyrenees','provence-alpes-cote-d-azur','rhone-alpes'],
    'provence-alpes-cote-d-azur':['languedoc-roussillon','rhone-alpes'],
    'corse':               []  /* île : pas de limitrophe terrestre */
  };

  /* Région d'une fiche : on privilégie le rattachement GPS réel (_regionSvg,
     posé par carto.js), avec repli sur la colonne region historique. */
  function regionDe(fiche) {
    return fiche._regionSvg || fiche.region || null;
  }

  /* Distance en km entre deux points GPS (Haversine). Sert à ne garder comme
     « limitrophe » que les fiches RÉELLEMENT proches d'une frontière commune,
     pas toute la région voisine (une région est grande : Bordeaux ≠ Bayonne). */
  function distanceKm(lat1, lng1, lat2, lng2) {
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
    var R = 6371, toRad = Math.PI / 180;
    var dLat = (lat2 - lat1) * toRad, dLng = (lng2 - lng1) * toRad;
    var a = Math.sin(dLat/2)*Math.sin(dLat/2) +
            Math.cos(lat1*toRad)*Math.cos(lat2*toRad)*Math.sin(dLng/2)*Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  /* Rayon max d'une fiche limitrophe à une fiche cœur (km). Au-delà, ce n'est
     plus « juste à côté » — on l'écarte. Réglable. */
  var RAYON_LIMITROPHE_KM = 120;

  /* Une fiche correspond-elle au thème ? Le thème est une clé de famille de
     tags.js (ex. 'culture', 'nature', 'farniente'...). On s'appuie sur
     RNR_TAGS si présent ; sinon repli souple sur les champs de la fiche.
     theme === null => pas de filtre thématique (tout passe). */
  function correspondTheme(fiche, theme, tagsApi) {
    if (!theme) return true;
    if (tagsApi && typeof tagsApi.familleDeFiche === 'function') {
      try {
        var fam = tagsApi.familleDeFiche(fiche);
        if (fam && (fam.cle === theme || fam === theme)) return true;
      } catch (e) { /* repli ci-dessous */ }
    }
    /* Repli : famille stockée directement sur la fiche, ou liste de tags. */
    if (fiche.famille && fiche.famille === theme) return true;
    if (Array.isArray(fiche.tags) && fiche.tags.indexOf(theme) !== -1) return true;
    return false;
  }

  /* Cœur : construit le paquet du Carnet du coin.
       fiches  : tableau de fiches (chacune avec _regionSvg de préférence)
       theme   : clé de thème (ou null pour "toutes")
       regions : 1 ou 2 slugs de région (le LIEU choisi)
       options : { tagsApi, limitrophes:true }
     Rend : { coeur:[...], limitrophes:[...], toutes:[...], regionsLimitrophes:[...] }
     - coeur       = fiches du thème DANS les régions choisies
     - limitrophes = fiches du thème dans les régions qui touchent celles choisies
     - toutes      = coeur puis limitrophes (limitrophes marquées _limitrophe=true) */
  function construirePaquet(fiches, theme, regions, options) {
    options = options || {};
    var tagsApi = options.tagsApi || (typeof window !== 'undefined' ? window.RNR_TAGS : null);
    var avecLimitrophes = options.limitrophes !== false; /* défaut : true */

    regions = (Array.isArray(regions) ? regions : [regions]).filter(Boolean).slice(0, 2);
    var setCible = {};
    regions.forEach(function (r) { setCible[r] = true; });

    /* Régions limitrophes des régions choisies (hors régions choisies elles-mêmes). */
    var setLimitrophe = {};
    if (avecLimitrophes) {
      regions.forEach(function (r) {
        (VOISINS[r] || []).forEach(function (v) {
          if (!setCible[v]) setLimitrophe[v] = true;
        });
      });
    }

    var coeur = [], limitrophesCandidates = [];
    (fiches || []).forEach(function (f) {
      if (!correspondTheme(f, theme, tagsApi)) return;
      var reg = regionDe(f);
      if (!reg) return;
      if (setCible[reg]) {
        coeur.push(f);
      } else if (setLimitrophe[reg]) {
        limitrophesCandidates.push(f);
      }
    });

    /* Ne garder que les limitrophes RÉELLEMENT proches d'une fiche cœur.
       Une fiche limitrophe sans GPS, ou si le cœur n'a aucun GPS, est gardée
       (on ne pénalise pas l'absence de données ; le filtre n'agit que quand on
       peut mesurer). */
    var coeurAvecGPS = coeur.filter(function (c) { return c.lat != null && c.lng != null; });
    var limitrophes = [];
    limitrophesCandidates.forEach(function (f) {
      var copie = f; copie._limitrophe = true;
      if (f.lat == null || f.lng == null || !coeurAvecGPS.length) {
        limitrophes.push(copie); return;   // pas de mesure possible → on garde
      }
      var proche = coeurAvecGPS.some(function (c) {
        return distanceKm(f.lat, f.lng, c.lat, c.lng) <= RAYON_LIMITROPHE_KM;
      });
      if (proche) limitrophes.push(copie);
    });

    return {
      coeur: coeur,
      limitrophes: limitrophes,
      toutes: coeur.concat(limitrophes),
      regionsCible: regions,
      regionsLimitrophes: Object.keys(setLimitrophe)
    };
  }

  var api = {
    VOISINS: VOISINS,
    voisinsDe: function (slug) { return (VOISINS[slug] || []).slice(); },
    regionDe: regionDe,
    construirePaquet: construirePaquet
  };

  if (typeof window !== 'undefined') {
    window.RNR_CARNET_COIN = Object.freeze(api);
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api; /* pour test hors navigateur */
  }
})();
