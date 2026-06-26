/* ════════════════════════════════════════════════════════════════════
   RockNRoad — carto-marqueurs.js
   LE MOTEUR UNIQUE des pastilles de carte (A6, étape 3).

   Une seule maison pour « à quoi ressemble un point sur une carte ».
   Branché par Horizon, Carnet, Voyage — et le futur Hub. Toute page qui
   dessine des lieux passe par ici : on ne recopie JAMAIS la logique de
   marqueur ailleurs (loi du Master : un comportement = un seul endroit).

   DEUX CANAUX INDÉPENDANTS (décision Bruno 25/06) :
     · la FORME dit le MONDE      → rond = activité (jour) · carré arrondi = couchage (nuit)
     · la COULEUR dit MON RAPPORT → neutre · mon cœur · cœur des autres · épingle
   Les deux ne s'annulent pas : un couchage épinglé = carré teal ;
   une activité épinglée = rond teal. On lit le voyage ET le monde d'un coup d'œil.

   Règles gravées :
     · L'ÉPINGLE N'EST JAMAIS ROUGE — le rouge appartient à l'émotion (❤️), pas à la décision.
     · ZÉRO COULEUR EN DUR : tout vient de tokens.css (--mk-*), lu via getComputedStyle.
     · LE COUCHAGE se décide via RNR_TAGS.estCouchage — jamais une détection maison.
     · Épuré : forme + couleur portent le sens ; seul symbole toléré = 📌 sur l'épingle.

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
      neutre:      tok('--mk-neutre',      '#6B5F4A'),
      coeurMoi:    tok('--mk-coeur-moi',   '#DC3C64'),
      coeurAutre:  tok('--mk-coeur-autre', '#EF9F27'),
      epingle:     tok('--mk-epingle',     '#1D9E75'),
      bord:        tok('--mk-bord',        '#FFFFFF')
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
    return false; /* défaut : jour (cohérent avec jourNuitFiche) */
  }

  /* — La COULEUR : mon rapport à la fiche, par priorité de SENS.
       épingle > mon cœur > cœur d'un autre > neutre.
       etat = { epingle:bool, coeurMoi:bool, coeurAutre:bool } — fourni par la page. */
  function couleurDe(etat) {
    var c = couleurs();
    if (!etat) return c.neutre;
    if (etat.epingle)    return c.epingle;
    if (etat.coeurMoi)   return c.coeurMoi;
    if (etat.coeurAutre) return c.coeurAutre;
    return c.neutre;
  }

  /* — Construit le HTML interne d'une pastille selon forme + couleur.
       nuit → carré arrondi ; jour → rond. taille = diamètre/côté en px.
       epingle → on pose le seul symbole toléré : 📌. */
  function pastilleHTML(opts) {
    var couleur = opts.couleur;
    var nuit    = opts.nuit;
    var taille  = opts.taille || 16;
    var bord    = opts.bord;
    var symbole = opts.epingle ? '📌' : '';
    var rayon   = nuit ? Math.round(taille * 0.32) + 'px' : '50%';
    var police  = Math.round(taille * 0.62);
    return '<div style="' +
      'width:' + taille + 'px;height:' + taille + 'px;' +
      'background:' + couleur + ';' +
      'border:2px solid ' + bord + ';' +
      'border-radius:' + rayon + ';' +
      'box-shadow:0 1px 4px rgba(0,0,0,.45);' +
      'display:flex;align-items:center;justify-content:center;' +
      'font-size:' + police + 'px;line-height:1;">' + symbole + '</div>';
  }

  /* ── API PUBLIQUE ──────────────────────────────────────────────────
     icone(fiche, etat, opts?) → L.divIcon prêt à poser sur un marqueur.
       fiche : la fiche (pour estCouchage)
       etat  : { epingle, coeurMoi, coeurAutre } (rapport au lieu)
       opts  : { taille } optionnel (défaut 16 ; l'épingle gagne +4 pour respirer)
  */
  function icone(fiche, etat, opts) {
    if (!global.L) return null;
    etat = etat || {};
    opts = opts || {};
    var c = couleurs();
    var nuit = estNuit(fiche);
    var epingle = !!etat.epingle;
    var taille = opts.taille || (epingle ? 20 : 16);
    var html = pastilleHTML({
      couleur: couleurDe(etat),
      nuit: nuit,
      taille: taille,
      bord: c.bord,
      epingle: epingle
    });
    var demi = Math.round(taille / 2);
    return global.L.divIcon({
      className: 'rnr-mk',
      html: html,
      iconSize: [taille, taille],
      iconAnchor: [demi, demi],
      popupAnchor: [0, -demi - 2]
    });
  }

  /* Légende prête à afficher (libellés courts) — pour un futur encart d'aide. */
  function legende() {
    return {
      forme:   [{ forme: 'rond',  texte: 'Activité de jour' },
                { forme: 'carre', texte: 'Lieu de nuit' }],
      couleur: [{ cle: 'neutre',     texte: 'Pas encore aimée' },
                { cle: 'coeurMoi',   texte: 'Mon coup de cœur' },
                { cle: 'coeurAutre', texte: 'Coup de cœur des autres' },
                { cle: 'epingle',    texte: 'Épingle — le voyage' }]
    };
  }

  global.RNR_MARQUEURS = {
    icone: icone,
    estNuit: estNuit,
    couleurDe: couleurDe,
    legende: legende,
    invalideCache: invalideCache
  };
})(window);
