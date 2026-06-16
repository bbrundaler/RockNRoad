/* ===================================================================
   carto.js — LE MOTEUR DE DÉCOUPAGES (Pilier B, cap Archi_Chaine_v2)
   -------------------------------------------------------------------
   Un fichier autonome (inclus comme boussole.js) qui sait afficher
   N'IMPORTE QUEL découpage et y rattacher les fiches par leur position.
   Il ne sait RIEN de la France en particulier : on lui DONNE un découpage
   (fichier de données), il rattache.

   Décisions appliquées (cap Archi_Chaine_v2, NE PAS rouvrir) :
   - Rattachement fiche → zone = PRÉCIS, point-dans-polygone (Bruno 06/06).
     Pas de correspondance de noms : la VÉRITÉ est lat/lng, pas la colonne
     `region` (ancien découpage). Prouvé sur les 48 fiches : « Chalets monts
     Jura », rangé « Franche-Comté » en base, tombe réellement en
     Auvergne-Rhône-Alpes — seul le GPS le sait.
   - lat/lng obligatoire à la création (verrou §3) → rattachement toujours
     calculable. Vérifié : 48/48 fiches ont leur GPS.
   - Découpages = fichiers de données séparés (france-regions, villes,
     allemagne-lander…). Ajouter un découpage = déposer un fichier, moteur
     intact.

   FILET CÔTIER : une fiche en bord de mer peut tomber « dans l'eau » hors
   de tout polygone (contours simplifiés). Dans ce cas on la rattache à la
   région dont le CONTOUR est le plus proche (sous un seuil). Garantit le
   rattachement des plages sans dégrader la justesse à l'intérieur des terres.

   Inclusion :  <script src="carto.js"></script>
   Données :    chargées à part (ex. fetch('decoupage-france-regions.json'))
   Accès :      window.RNR_CARTO_MOTEUR
   =================================================================== */
(function () {
  'use strict';

  const SEUIL_PROXIMITE = 0.25; // ~25 km : au-delà, on ne force pas (hors zone réelle)

  // --- point dans un anneau (ray casting) -------------------------------
  function pointDansAnneau(lng, lat, ring) {
    let inside = false, n = ring.length, j = n - 1;
    for (let i = 0; i < n; i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      if (((yi > lat) !== (yj > lat)) &&
          (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
      j = i;
    }
    return inside;
  }

  // une géométrie MultiPolygon : dans l'enveloppe ET pas dans un trou
  function pointDansGeom(lng, lat, geom) {
    for (const poly of geom.coordinates) {
      if (pointDansAnneau(lng, lat, poly[0])) {
        let trou = false;
        for (let k = 1; k < poly.length; k++)
          if (pointDansAnneau(lng, lat, poly[k])) { trou = true; break; }
        if (!trou) return true;
      }
    }
    return false;
  }

  // distance² d'un point au segment [a,b] (en degrés, suffisant pour comparer)
  function dist2Segment(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    if (dx === 0 && dy === 0) return (px - ax) ** 2 + (py - ay) ** 2;
    let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    const qx = ax + t * dx, qy = ay + t * dy;
    return (px - qx) ** 2 + (py - qy) ** 2;
  }

  // distance min d'un point au contour d'une géométrie
  function distAuContour(lng, lat, geom) {
    let min = Infinity;
    for (const poly of geom.coordinates) {
      const ring = poly[0];
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const d = dist2Segment(lng, lat, ring[j][0], ring[j][1], ring[i][0], ring[i][1]);
        if (d < min) min = d;
      }
    }
    return Math.sqrt(min);
  }

  /* ---------------------------------------------------------------------
     UN DÉCOUPAGE chargé = { code, nom, geom } par zone, indexé.
     `charger(geojson)` accepte un FeatureCollection (properties.code/nom).
     --------------------------------------------------------------------- */
  function creerDecoupage(geojson) {
    const zones = geojson.features.map(f => ({
      code: f.properties.code,
      nom: f.properties.nom,
      geom: f.geometry.type === 'MultiPolygon'
        ? f.geometry
        : { type: 'MultiPolygon', coordinates: [f.geometry.coordinates] }
    }));

    // rattache une position à une zone : polygone d'abord, filet proximité ensuite
    function zoneDe(lat, lng) {
      for (const z of zones) if (pointDansGeom(lng, lat, z.geom)) return z;
      // filet : aucune zone ne contient le point → la plus proche sous le seuil
      let best = null, bestD = Infinity;
      for (const z of zones) {
        const d = distAuContour(lng, lat, z.geom);
        if (d < bestD) { bestD = d; best = z; }
      }
      return (best && bestD <= SEUIL_PROXIMITE) ? best : null;
    }

    // regroupe une liste de fiches {lat,lng,…} par code de zone
    function repartir(fiches) {
      const parZone = {}; const orphelines = [];
      for (const f of fiches) {
        const z = (f.lat != null && f.lng != null) ? zoneDe(+f.lat, +f.lng) : null;
        if (z) (parZone[z.code] = parZone[z.code] || []).push(f);
        else orphelines.push(f);
      }
      return { parZone, orphelines };
    }

    return { zones, zoneDe, repartir, codes: zones.map(z => z.code) };
  }

  window.RNR_CARTO_MOTEUR = Object.freeze({ creerDecoupage });
})();
