/* ===================================================================
   carto-cascade.js — LE MOTEUR DE CASCADE DE LA CARTE (Horizon)
   -------------------------------------------------------------------
   Idée directrice (demande de Bruno) : raisonner « comme du CSS ».

   - Une RÉGION est un élément.
   - Une COUCHE (layer) est une feuille de style : elle dit, pour chaque
     région, si elle la garde allumée, l'estompe, ou ne se prononce pas.
   - L'ÉTAT FINAL d'une région = la CASCADE de toutes les couches actives,
     dans l'ordre, exactement comme le navigateur résout une propriété CSS
     en empilant les règles.

   Ce moteur ne connaît NI les votes, NI le SVG, NI Supabase. Il prend des
   couches (objets simples) et rend un verdict par région. On lui branche
   n'importe quelle source de couche (mode tri perso, vote macro de groupe,
   thèmes, jeux perso…) SANS jamais le réécrire. C'est le socle stable.

   Règles de cascade (volontairement simples au départ, extensibles) :
   - Verdict par défaut d'une région : 'vivante' (rien ne l'éteint).
   - Une couche peut poser sur une région : 'garde' | 'estompe' | null(=neutre).
   - Cascade : on lit les couches dans l'ordre ; le DERNIER verdict non-neutre
     gagne (last-wins, comme la source-order CSS). 'garde' peut donc rallumer
     ce qu'une couche précédente avait estompé → réversibilité native.
   - GARDE-FOU MASTER 4.2 : on n'éteint JAMAIS tout. Si la cascade laisserait
     moins de MIN_VIVANTES régions allumées, on REFUSE d'éteindre les
     dernières (elles restent vivantes). Estomper = grisé réversible, jamais
     supprimé : ce moteur ne supprime rien, il qualifie.

   Inclusion :  <script src="carto-cascade.js"></script>  (avant horizon)
   Accès :      window.RNR_CARTO
   =================================================================== */
(function () {
  'use strict';

  const MIN_VIVANTES = 2; // garde-fou Master 4.2 : jamais moins de 2 régions

  // --- Verdicts qu'une couche peut poser sur une région -----------------
  const POSE = { GARDE: 'garde', ESTOMPE: 'estompe', NEUTRE: null };

  /* ---------------------------------------------------------------------
     Une COUCHE est un objet :
       {
         id:      'tri-perso' | 'macro-<uuid>' | …   (identifiant unique)
         source:  'perso' | 'groupe'                  (d'où elle vient)
         titre:   'Ton tri'                           (lisible, pour debug/UI)
         actif:   true|false                          (on peut la suspendre)
         // la fonction qui, pour un code région, rend GARDE/ESTOMPE/NEUTRE :
         pose:    (regionCode) => POSE.*
       }
     On NE stocke pas l'état des régions dans la couche : la couche est une
     RÈGLE, pas un état. L'état est recalculé par la cascade à chaque fois.
     --------------------------------------------------------------------- */

  const _couches = []; // pile ordonnée (index 0 = première posée = la + basse)

  function ajouterCouche(couche) {
    if (!couche || !couche.id || typeof couche.pose !== 'function') {
      console.warn('[carto] couche invalide ignorée', couche); return;
    }
    // remplace si même id (re-poser une couche la met à jour, pas en double)
    const i = _couches.findIndex(c => c.id === couche.id);
    // défauts : actif=true SAUF si explicitement false (undefined ne désactive pas)
    const norm = Object.assign({ source: 'perso', titre: '', actif: true }, couche);
    norm.actif = (couche.actif === false) ? false : true;
    if (i >= 0) _couches[i] = norm; else _couches.push(norm);
    return norm;
  }

  function retirerCouche(id) {
    const i = _couches.findIndex(c => c.id === id);
    if (i >= 0) _couches.splice(i, 1);
  }

  function viderCouches() { _couches.length = 0; }

  function couches() { return _couches.slice(); } // copie lecture seule

  /* ---------------------------------------------------------------------
     LA CASCADE — le cœur. Donne, pour la liste de régions fournie, le
     verdict final de chaque région : 'vivante' | 'estompee'.
     `toutesRegions` = tableau de codes régions (la maille courante).
     --------------------------------------------------------------------- */
  function resoudre(toutesRegions) {
    const actives = _couches.filter(c => c.actif);

    // 1) verdict brut par cascade last-wins
    const brut = {};
    for (const code of toutesRegions) {
      let verdict = 'vivante'; // défaut : rien ne l'éteint
      for (const couche of actives) {
        const p = couche.pose(code);
        if (p === POSE.ESTOMPE) verdict = 'estompee';
        else if (p === POSE.GARDE) verdict = 'vivante';
        // NEUTRE : la couche ne se prononce pas, on garde le verdict courant
      }
      brut[code] = verdict;
    }

    // 2) GARDE-FOU : jamais moins de MIN_VIVANTES allumées.
    //    Si la cascade éteint trop, on rallume les dernières estompées
    //    (ordre stable = ordre de `toutesRegions`) jusqu'au seuil.
    const vivantes = toutesRegions.filter(c => brut[c] === 'vivante');
    if (vivantes.length < MIN_VIVANTES) {
      const aRallumer = toutesRegions
        .filter(c => brut[c] === 'estompee')
        .slice(0, MIN_VIVANTES - vivantes.length);
      for (const c of aRallumer) brut[c] = 'vivante';
    }

    return brut; // { regionCode: 'vivante'|'estompee', … }
  }

  // Petit utilitaire : la cascade est-elle « vierge » (aucune couche active) ?
  function vierge() { return _couches.filter(c => c.actif).length === 0; }

  /* ---------------------------------------------------------------------
     FABRIQUES DE COUCHES — sucre pour créer les couches courantes sans
     réécrire la logique `pose` à chaque fois. On en ajoutera (thèmes, etc.).
     --------------------------------------------------------------------- */

  // Couche « liste » : on fournit explicitement les régions gardées et/ou
  // estompées. Le mode tri perso et le vote macro régional s'en servent.
  //   gardees   : régions à garder allumées (POSE.GARDE)
  //   estompees : régions à estomper       (POSE.ESTOMPE)
  //   tout le reste = NEUTRE (la couche ne se prononce pas)
  function coucheListe({ id, source, titre, actif, gardees, estompees }) {
    const G = new Set(gardees || []);
    const E = new Set(estompees || []);
    return ajouterCouche({
      id, source, titre, actif,
      pose: (code) => E.has(code) ? POSE.ESTOMPE
                    : G.has(code) ? POSE.GARDE
                    : POSE.NEUTRE
    });
  }

  // exposé global, lecture seule
  window.RNR_CARTO = Object.freeze({
    POSE, MIN_VIVANTES,
    ajouterCouche, retirerCouche, viderCouches, couches,
    resoudre, vierge, coucheListe
  });
})();
