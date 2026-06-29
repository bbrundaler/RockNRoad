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
    /* path cœur normalisé sur une boîte 24x24, mis à l'échelle */
    var s = t / 24;
    return '<svg width="' + t + '" height="' + t + '" viewBox="0 0 24 24">' +
      '<path transform="scale(1)" d="M12 21s-7.5-4.9-10-9.2C.3 8.6 1.6 5 5 5c2 0 3.3 1.2 4 2.3C9.7 6.2 11 5 13 5c3.4 0 4.7 3.6 3 6.8C19.5 16.1 12 21 12 21z" ' +
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

  global.RNR_MARQUEURS = {
    icone: icone,
    estNuit: estNuit,
    couleurTrace: couleurTrace,
    legende: legende,
    invalideCache: invalideCache
  };
})(window);
