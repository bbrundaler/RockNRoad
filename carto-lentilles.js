/* ===================================================================
   carto-lentilles.js — LE SYSTÈME DE LENTILLES (Horizon, gros élagage)
   -------------------------------------------------------------------
   Idée (Bruno) : un grand coup d'élagage n'est pas « un tag », c'est une
   FAÇON DE LIRE LES FICHES. Mer/Montagne se lit par la GÉOGRAPHIE (GPS) ;
   Sportif/Farniente par l'HUMEUR (paquets de tags) ; Jour/Nuit par le MOMENT.
   Chaque lentille est interchangeable : même mécanique, angle différent.

   Principe « tout tourne autour des fiches » (Master 4.11) : une lentille
   garde/écarte des FICHES. Une région s'éteint quand elle n'a plus de fiche
   vivante. La lentille ne touche jamais les régions directement — elle filtre
   les fiches, et `regionsVivantes()` en déduit la carte.

   Une LENTILLE = {
     id, libelle, type:'geo'|'humeur'|'moment',
     cotes: [ {cle, libelle, emoji, garde:(fiche)=>bool}, ... ]   // 2 côtés (duel)
   }
   Choisir un côté = ne GARDER que les fiches dont garde()==true pour ce côté.

   Inclusion : <script src="carto-lentilles.js"></script> (après carto-cascade)
   Accès :     window.RNR_LENTILLES
   =================================================================== */
(function () {
  'use strict';

  // ── helpers géo ──────────────────────────────────────────────────
  // Distance approx (km) d'un point au trait de côte atlantique/manche.
  // On n'a pas de polygone côtier ici : on utilise un proxy simple et
  // honnête — la longitude ouest. En prod fine, brancher une vraie distance.
  function estProcheCote(f){
    // Atlantique : façade ouest. Proxy : lng très à l'ouest = proche océan.
    // Seuil calé sur les données réelles (Landes/Arcachon ~ -1.2).
    return (typeof f.lng === 'number') && f.lng < -1.05;
  }
  // Relief : on n'a pas l'altitude en base. Proxy par zones de montagne
  // connues (Pyrénées, Vosges, Jura, Alpes). HONNÊTE : approximation de
  // test ; en prod, remplacer par une altitude GPS réelle (chantier dédié).
  function estMontagne(f){
    const la=+f.lat, ln=+f.lng;
    if(isNaN(la)||isNaN(ln)) return false;
    const pyrenees = la < 43.25 && ln >= -0.95 && ln <= 0.85;
    const vosges   = la >= 47.6 && la <= 48.5 && ln > 6.7;
    const jura     = la >= 46.0 && la <= 47.1 && ln >= 5.4 && ln <= 6.6;
    const alpes    = la >= 44.0 && la <= 46.5 && ln > 5.7;
    return pyrenees || vosges || jura || alpes;
  }

  // ── helpers humeur (paquets de tags) ─────────────────────────────
  function aTag(f, liste){
    const t = Array.isArray(f.tags) ? f.tags : [];
    return liste.some(x => t.includes(x));
  }
  const TAGS_SPORTIF   = ['randonnee','nature','sport','balade'];
  const TAGS_FARNIENTE = ['teardrop','baignade']; // hébergement posé / plage tranquille
  const TYPES_FARNIENTE = ['Camping','Halte'];
  const TAGS_CULTUREL  = ['historique','vue','musee','patrimoine'];
  const TAGS_NATURE    = ['nature','randonnee','baignade','vue'];

  function estSportif(f){
    return aTag(f, TAGS_SPORTIF);
  }
  function estFarniente(f){
    return aTag(f, TAGS_FARNIENTE) || TYPES_FARNIENTE.includes(f.type);
  }

  // ── les LENTILLES disponibles ────────────────────────────────────
  // Chaque côté a garde(fiche) → la fiche reste vivante si true.
  const LENTILLES = [
    {
      id:'mer-montagne', libelle:'Mer ou Montagne', type:'geo',
      cotes:[
        { cle:'mer',      libelle:'La mer',      emoji:'🌊', garde:estProcheCote },
        { cle:'montagne', libelle:'La montagne', emoji:'⛰️', garde:estMontagne }
      ]
    },
    {
      id:'sportif-farniente', libelle:'Sportif ou Farniente', type:'humeur',
      cotes:[
        { cle:'sportif',   libelle:'Sportif',   emoji:'🥾', garde:estSportif },
        { cle:'farniente', libelle:'Farniente', emoji:'🏖️', garde:estFarniente }
      ]
    },
    {
      id:'culture-nature', libelle:'Culture ou Nature', type:'humeur',
      cotes:[
        { cle:'culture', libelle:'Culturel', emoji:'🏛️', garde:(f)=>aTag(f,TAGS_CULTUREL) },
        { cle:'nature',  libelle:'Nature',   emoji:'🌲', garde:(f)=>aTag(f,TAGS_NATURE) }
      ]
    },
    {
      id:'nord-sud', libelle:'Nord ou Sud', type:'geo',
      cotes:[
        { cle:'nord', libelle:'Nord', emoji:'🧭', garde:(f)=>(+f.lat) >= 46.2 },
        { cle:'sud',  libelle:'Sud',  emoji:'☀️', garde:(f)=>(+f.lat) <  46.2 }
      ]
    }
  ];

  function lentille(id){ return LENTILLES.find(l=>l.id===id)||null; }
  function cote(lentilleId, coteCle){
    const l=lentille(lentilleId); if(!l) return null;
    return l.cotes.find(c=>c.cle===coteCle)||null;
  }

  /* ---------------------------------------------------------------------
     Applique un choix de lentille à une liste de fiches.
     Retourne { gardees:[fiches], ecartees:[fiches] }.
     --------------------------------------------------------------------- */
  function filtre(fiches, lentilleId, coteCle){
    const c = cote(lentilleId, coteCle);
    if(!c) return { gardees: fiches.slice(), ecartees: [] };
    const gardees=[], ecartees=[];
    for(const f of fiches){ (c.garde(f) ? gardees : ecartees).push(f); }
    return { gardees, ecartees };
  }

  /* ---------------------------------------------------------------------
     Compteur d'aperçu : combien de fiches chaque côté garderait.
     Sert à l'UI (« 🌊 13 · ⛰️ 23 ») AVANT de cliquer — évite les surprises.
     --------------------------------------------------------------------- */
  function apercu(fiches, lentilleId){
    const l=lentille(lentilleId); if(!l) return {};
    const out={};
    for(const c of l.cotes){
      out[c.cle] = fiches.reduce((n,f)=> n + (c.garde(f)?1:0), 0);
    }
    return out;
  }

  window.RNR_LENTILLES = Object.freeze({
    LENTILLES, lentille, cote, filtre, apercu,
    // exposés pour test / réutilisation
    _h:{ estProcheCote, estMontagne, estSportif, estFarniente }
  });
})();
