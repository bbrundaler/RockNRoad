/* ════════════════════════════════════════════════════════════════════════
   RockNRoad — RÉFÉRENTIEL DE CONTENU  ·  tags.js
   ════════════════════════════════════════════════════════════════════════
   Le « tokens.css du contenu ». UN SEUL endroit déclare tout le vocabulaire
   des fiches. Toutes les pages lisent ce fichier. Pour ajouter / renommer /
   déplacer un élément : on touche CE fichier, et nulle part ailleurs.

   Principe (comme tokens.css) :
   - chaque entrée a une CLÉ stable (jamais affichée, sert au code/stockage)
     et un LIBELLÉ (affiché, modifiable librement sans rien casser).
   - ouvert mais structuré : on enrichit en ajoutant une ligne dans la bonne
     famille ; pas de saisie libre anarchique, pas de doublons.

   Source : décisions Master v6.2 (anatomie de la fiche 2.1, décision 01/06 :
   5 familles-mères + ~10 sous-univers ; règle transverse Jour/Nuit).

   Inclusion : <script src="tags.js"></script>  (avant les pages qui l'utilisent)
   Accès :     window.RNR_TAGS  (objet global en lecture seule)
   ════════════════════════════════════════════════════════════════════════ */
(function(){

  /* ───────────────────────────────────────────────────────────────────
     1) FAMILLES-MÈRES  (Master 01/06 — les 5 grandes ambiances)
     Pour AJOUTER une famille : ajouter une entrée ici. C'est tout.
     'jourNuit' = orientation par défaut (peut être surchargée par le type).
     ─────────────────────────────────────────────────────────────────── */
  const FAMILLES = {
    visiter:    { libelle:'Visiter',      emoji:'🏛️', jourNuit:'jour' },
    nature:     { libelle:'Nature',       emoji:'🌿', jourNuit:'jour' },
    nuit:       { libelle:'Nuit · Dormir',emoji:'🌙', jourNuit:'nuit' },
    pause:      { libelle:'Pause',        emoji:'☕', jourNuit:'jour' },
    activite:   { libelle:'Activité',     emoji:'🥾', jourNuit:'jour' }
  };

  /* ───────────────────────────────────────────────────────────────────
     2) SOUS-UNIVERS  (Master 01/06 — ~9-10, rattachés à une famille-mère)
     Chaque sous-univers pointe sa famille par sa clé.
     Pour AJOUTER : une ligne, avec la bonne 'famille'.
     ─────────────────────────────────────────────────────────────────── */
  const SOUS_UNIVERS = {
    patrimoine: { libelle:'Patrimoine',  emoji:'🏰', famille:'visiter' },
    musee:      { libelle:'Musée',       emoji:'🖼️', famille:'visiter' },
    paysage:    { libelle:'Paysage',     emoji:'🏞️', famille:'nature'  },
    balade:     { libelle:'Balade',      emoji:'🚶', famille:'nature'  },
    table:      { libelle:'Table',       emoji:'🍽️', famille:'pause'   },
    bar:        { libelle:'Bar',         emoji:'🍷', famille:'pause'   },
    bienetre:   { libelle:'Bien-être',   emoji:'💆', famille:'pause'   },
    camping:    { libelle:'Camping',     emoji:'⛺', famille:'nuit'    },
    gite:       { libelle:'Gîte',        emoji:'🏡', famille:'nuit'    },
    terroir:    { libelle:'Terroir',     emoji:'🧺', famille:'activite'}
  };

  /* ───────────────────────────────────────────────────────────────────
     3) TYPES  (les 6 types CONCRETS du formulaire de création actuel)
     Ce que l'utilisateur choisit en 1 clic. Chaque type est rattaché à
     une famille-mère + une orientation Jour/Nuit par défaut.
     C'est le pont entre le formulaire existant (admin.html) et les familles.
     Pour AJOUTER un type : une ligne.
     ─────────────────────────────────────────────────────────────────── */
  const TYPES = {
    Site:       { libelle:'Site à visiter',   emoji:'🏛️', famille:'visiter',  jourNuit:'jour' },
    Camping:    { libelle:'Camping',          emoji:'⛺', famille:'nuit',     jourNuit:'nuit' },
    Plage:      { libelle:'Plage / Lac',      emoji:'🏖️', famille:'nature',   jourNuit:'jour' },
    Randonnee:  { libelle:'Randonnée / Vélo', emoji:'🥾', famille:'activite', jourNuit:'jour' },
    Restaurant: { libelle:'Restaurant',       emoji:'🍽️', famille:'pause',    jourNuit:'jour' },
    Halte:      { libelle:'Halte / Étape',    emoji:'🚗', famille:'pause',    jourNuit:'jour' }
  };

  /* ───────────────────────────────────────────────────────────────────
     4) JOUR / NUIT  (règle transverse Master — visible à tous les niveaux)
     ─────────────────────────────────────────────────────────────────── */
  const JOUR_NUIT = {
    jour: { libelle:'Jour',  emoji:'☀️' },
    nuit: { libelle:'Nuit',  emoji:'🌙' }
  };

  /* ───────────────────────────────────────────────────────────────────
     5a) TAGS AUTO  (alimentables AUTOMATIQUEMENT à l'import Google — 0 coût)
     ═══════════════════════════════════════════════════════════════════
     Décision Bruno 06/06 : 100% des fiches arrivent par une partie automatique
     (copier-coller Google Maps) qui pose une fiche de base standard. Ces tags
     se déduisent de ce que Google renvoie DÉJÀ (types, nom, editorial_summary)
     → leur capture ne coûte RIEN de plus. On en met le MAXIMUM.

     IMPORTANT : les CLÉS reprennent EXACTEMENT celles du formulaire admin.html
     actuel, pour ne pas casser le système d'auto-tags existant.

     Chaque tag porte :
       - libelle : affiché
       - emoji   : pour la grille
       - auto    : règles de détection Google (centralisées ICI, plus en dur
                   dans admin.html) :
                   · googleTypes : types Google qui déclenchent le tag
                   · motsCles    : mots du nom/description qui déclenchent le tag
     Pour AJOUTER un tag auto : une ligne + ses règles. Pour DÉSACTIVER une
     règle (ex. trop cher) : vider auto, le tag reste choisissable à la main.
     ─────────────────────────────────────────────────────────────────── */
  const TAGS_AUTO = {
    nature:     { libelle:'Nature',         emoji:'🌿', auto:{ googleTypes:['natural_feature','park','hiking_area','route'], motsCles:['cascade','lac ','foret','forêt','rocher','falaise','grotte'] } },
    randonnee:  { libelle:'Rando',          emoji:'🥾', auto:{ googleTypes:['natural_feature','park','hiking_area','route'], motsCles:['colorado','rocher','falaise','grotte'] } },
    baignade:   { libelle:'Baignade',       emoji:'🏊', auto:{ googleTypes:['beach','lake'], motsCles:['cascade','lac '] } },
    historique: { libelle:'Historique',     emoji:'🏰', auto:{ googleTypes:['museum','historical_landmark','church','place_of_worship'], motsCles:['chateau','château','fort'] } },
    vue:        { libelle:'Belle vue',      emoji:'🏔️', auto:{ googleTypes:[], motsCles:['chateau','château','fort','rocher','falaise','grotte'] } },
    velo:       { libelle:'Vélo',           emoji:'🚴', auto:{ googleTypes:[], motsCles:['velo','vélo','canal'] } },
    ombre:      { libelle:'Ombre',          emoji:'🌳', auto:{ googleTypes:[], motsCles:['foret','forêt'] } },
    teardrop:   { libelle:'Teardrop OK',    emoji:'🚐', auto:{ googleTypes:['campground','campsite','rv_park'], motsCles:[] } },
    enfants:    { libelle:'Enfants',        emoji:'👧', auto:{ googleTypes:['tourist_attraction','amusement_park'], motsCles:[] } },
    gratuit:    { libelle:'Gratuit',        emoji:'🆓', auto:{ googleTypes:[], motsCles:['gratuit','libre'], priceLevelZero:true } },
    unesco:     { libelle:'UNESCO',         emoji:'🌍', auto:{ googleTypes:[], motsCles:['unesco','patrimoine mondial'] } }
  };

  /* ───────────────────────────────────────────────────────────────────
     5b) TAGS COMPLÉMENT  (ajoutés par l'HUMAIN — sensibilité du groupe)
     ═══════════════════════════════════════════════════════════════════
     Google ne peut pas les deviner. C'est l'enrichissement après la fiche
     de base. Palette OUVERTE mais structurée : on grossit ici, grandeur nature.
     ─────────────────────────────────────────────────────────────────── */
  const TAGS_COMPLEMENT = {
    calme:        { libelle:'Calme',        emoji:'😌' },
    anime:        { libelle:'Animé',        emoji:'🎉' },
    'chien-plage':{ libelle:'Chien plage OK',emoji:'🐕' },
    piscine:      { libelle:'Piscine',      emoji:'🏊' },
    electricite:  { libelle:'Électricité',  emoji:'⚡' }
  };

  /* ───────────────────────────────────────────────────────────────────
     PETITS HELPERS (lecture seule, pour que les pages n'aient pas à
     connaître la structure interne — elles demandent, le référentiel répond).
     ─────────────────────────────────────────────────────────────────── */
  const api = {
    FAMILLES, SOUS_UNIVERS, TYPES, JOUR_NUIT, TAGS_AUTO, TAGS_COMPLEMENT,

    // famille-mère d'un type (clé) -> objet famille (ou null)
    familleDuType(typeKey){
      const t=TYPES[typeKey]; return t ? FAMILLES[t.famille]||null : null;
    },
    // orientation Jour/Nuit d'un type (clé) -> 'jour' | 'nuit'
    jourNuitDuType(typeKey){
      const t=TYPES[typeKey]; return t ? (t.jourNuit||(FAMILLES[t.famille]||{}).jourNuit||'jour') : 'jour';
    },
    // liste des sous-univers d'une famille (clé) -> [{cle, ...}]
    sousUniversDeFamille(familleKey){
      return Object.entries(SOUS_UNIVERS)
        .filter(([,v])=>v.famille===familleKey)
        .map(([cle,v])=>Object.assign({cle},v));
    },
    // tous les tags (auto + complément) à plat -> [{cle, libelle, emoji, source}]
    tousLesTags(){
      const out=[];
      for(const [k,v] of Object.entries(TAGS_AUTO))       out.push({cle:k,libelle:v.libelle,emoji:v.emoji,source:'auto'});
      for(const [k,v] of Object.entries(TAGS_COMPLEMENT)) out.push({cle:k,libelle:v.libelle,emoji:v.emoji,source:'complement'});
      return out;
    },
    // libellé d'un tag (cherche dans auto puis complément) -> string|null
    libelleTag(tagKey){
      if(TAGS_AUTO[tagKey])       return TAGS_AUTO[tagKey].libelle;
      if(TAGS_COMPLEMENT[tagKey]) return TAGS_COMPLEMENT[tagKey].libelle;
      return null;
    },
    // ══ AUTO-TAGS : calcule les tags à cocher depuis une réponse Google ══
    // Centralise la logique aujourd'hui en dur dans admin.html.
    // p = objet place Google (avec p.types, p.name, p.editorial_summary, p.price_level)
    // -> renvoie un tableau de clés de tags (sans doublon)
    autoTagsDepuisGoogle(p){
      if(!p) return [];
      const found=new Set();
      const types=p.types||[];
      const nom=(p.name||'').toLowerCase();
      const desc=(p.editorial_summary&&p.editorial_summary.overview||'').toLowerCase();
      const texte=nom+' '+desc;
      for(const [cle,t] of Object.entries(TAGS_AUTO)){
        const r=t.auto; if(!r) continue;
        if((r.googleTypes||[]).some(gt=>types.includes(gt))) found.add(cle);
        if((r.motsCles||[]).some(m=>texte.includes(m)))      found.add(cle);
        if(r.priceLevelZero && p.price_level===0)            found.add(cle);
      }
      return [...found];
    }
  };

  // Exposition globale en lecture (gelée pour éviter les modifs accidentelles)
  try{ Object.freeze(api); }catch(e){}
  window.RNR_TAGS = api;

})();
