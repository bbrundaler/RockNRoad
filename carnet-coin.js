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

  /* Voisinages des 13 régions (slugs de decoupage-france-regions.json).
     Donnée stable et factuelle : quelles régions se touchent. Sert à inclure
     les fiches "limitrophes proches" (le château à 30 min de l'autre côté de
     la frontière n'est pas exclu bêtement — Master 4.15bis). */
  var VOISINS = {
    'ile-de-france':            ['hauts-de-france','grand-est','bourgogne-franche-comte','centre-val-de-loire','normandie'],
    'centre-val-de-loire':      ['ile-de-france','normandie','pays-de-la-loire','nouvelle-aquitaine','auvergne-rhone-alpes','bourgogne-franche-comte'],
    'bourgogne-franche-comte':  ['ile-de-france','grand-est','auvergne-rhone-alpes','centre-val-de-loire'],
    'normandie':                ['hauts-de-france','ile-de-france','centre-val-de-loire','pays-de-la-loire','bretagne'],
    'hauts-de-france':          ['normandie','ile-de-france','grand-est'],
    'grand-est':                ['hauts-de-france','ile-de-france','bourgogne-franche-comte'],
    'pays-de-la-loire':         ['bretagne','normandie','centre-val-de-loire','nouvelle-aquitaine'],
    'bretagne':                 ['normandie','pays-de-la-loire'],
    'nouvelle-aquitaine':       ['pays-de-la-loire','centre-val-de-loire','auvergne-rhone-alpes','occitanie'],
    'occitanie':                ['nouvelle-aquitaine','auvergne-rhone-alpes','provence-alpes-cote-d-azur'],
    'auvergne-rhone-alpes':     ['bourgogne-franche-comte','centre-val-de-loire','nouvelle-aquitaine','occitanie','provence-alpes-cote-d-azur'],
    'provence-alpes-cote-d-azur':['occitanie','auvergne-rhone-alpes'],
    'corse':                    []  /* île : pas de limitrophe terrestre */
  };

  /* Région d'une fiche : on privilégie le rattachement GPS réel (_regionSvg,
     posé par carto.js), avec repli sur la colonne region historique. */
  function regionDe(fiche) {
    return fiche._regionSvg || fiche.region || null;
  }

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

    var coeur = [], limitrophes = [];
    (fiches || []).forEach(function (f) {
      if (!correspondTheme(f, theme, tagsApi)) return;
      var reg = regionDe(f);
      if (!reg) return;
      if (setCible[reg]) {
        coeur.push(f);
      } else if (setLimitrophe[reg]) {
        var copie = f; copie._limitrophe = true;
        limitrophes.push(copie);
      }
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
