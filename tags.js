/* ════════════════════════════════════════════════════════════════════════
   RockNRoad — RÉFÉRENTIEL DE CONTENU  ·  tags.js  ·  v2 (07/06/2026)
   ════════════════════════════════════════════════════════════════════════
   Le « tokens.css du contenu ». UN SEUL endroit déclare tout le vocabulaire
   des fiches. Toutes les pages lisent ce fichier. Pour ajouter / renommer /
   déplacer un élément : on touche CE fichier, et nulle part ailleurs.

   Principe (comme tokens.css) :
   - chaque entrée a une CLÉ stable (jamais affichée, sert au code/stockage)
     et un LIBELLÉ (affiché, modifiable librement sans rien casser).
   - ouvert mais structuré : on enrichit en ajoutant une ligne dans la bonne
     famille ; pas de saisie libre anarchique, pas de doublons.

   ── PHILOSOPHIE v2 (session 07/06, voir RockNRoad_Fiche_Standard_v1) ──
   Vocabulaire ADOSSÉ AU RÉEL GOOGLE pour automatiser au maximum :
   - l'AMBIANCE (familles, sous-distinctions) est MAISON — Google ne l'a pas,
     c'est notre valeur ajoutée ;
   - la classification AUTO se fait via les vrais `types` Google (Places API),
     regroupés en paquets sous chaque sous-distinction ;
   - une TABLE DE CORRESPONDANCE (type Google → famille + sous-distinction)
     range chaque lieu importé automatiquement.

   Aligné PALIER PRO 17 $ : aucune règle ne dépend de reviews / price_level
   (jamais pris) ni de editorial_summary (hors standard). 0 coût ajouté.

   Étage 2 (tags perso par groupe) = chantier BDD futur : un crochet est
   réservé plus bas (api.fusionnerTagsGroupe) mais non implémenté.

   Inclusion : <script src="tags.js"></script>  (avant les pages qui l'utilisent)
   Accès :     window.RNR_TAGS  (objet global en lecture seule)
   ════════════════════════════════════════════════════════════════════════ */
(function(){

  /* ───────────────────────────────────────────────────────────────────
     1) FAMILLES-MÈRES  (6 — les grandes ambiances, miroir des catégories
        Google mais nommées par le RESSENTI)
     'jourNuit' = orientation par défaut (peut être surchargée par le type).
     Pour AJOUTER une famille : une entrée ici. C'est tout.
     ─────────────────────────────────────────────────────────────────── */
  const FAMILLES = {
    visiter:  { libelle:'Visiter',       emoji:'🏛️', jourNuit:'jour', ordre:1 },
    nature:   { libelle:'Nature',        emoji:'🌿', jourNuit:'jour', ordre:2 },
    nuit:     { libelle:'Nuit · Dormir', emoji:'🌙', jourNuit:'nuit', ordre:3 },
    pause:    { libelle:'Pause',         emoji:'☕', jourNuit:'jour', ordre:4 },
    activite: { libelle:'Activité',      emoji:'🥾', jourNuit:'jour', ordre:5 },
    loisirs:  { libelle:'Loisirs',       emoji:'🎡', jourNuit:'jour', ordre:6 }
  };

  /* ───────────────────────────────────────────────────────────────────
     2) SOUS-DISTINCTIONS  (15 — la finesse DANS une famille)
     Chaque sous-distinction :
       - famille     : clé de la famille-mère
       - libelle     : affiché
       - emoji       : pour la grille
       - googleTypes : PAQUET de types Google (Places API) qui la déclenchent
                       AUTOMATIQUEMENT à l'import. C'est le cœur de l'auto-
                       classement. Ouvert : on ajoute un type à la liste.

     ⚠ Types marqués « à confirmer » : leur présence exacte en Table A/B de
       l'API varie. À vérifier au branchement réel (B4-b, test en ligne).
       Ne pas considérer cette liste comme gravée tant que non testée.
       Concernés : castle, hot_spring, ferris_wheel, farm, market, arena.

     ⚠ winery est rattaché à 'terroir' (Activité) qui PRIME pour l'ambiance
       (esprit RockNRoad = l'expérience, pas juste boire).
     ─────────────────────────────────────────────────────────────────── */
  const SOUS_DISTINCTIONS = {
    // ── Visiter ──
    patrimoine: { famille:'visiter', libelle:'Patrimoine', emoji:'🏰',
      googleTypes:['castle','historical_landmark','historical_place','monument','cultural_landmark','church','place_of_worship'] },
    musee:      { famille:'visiter', libelle:'Musée & art', emoji:'🖼️',
      googleTypes:['museum','art_gallery'] },

    // ── Nature ──
    paysage:    { famille:'nature', libelle:'Paysage', emoji:'🏞️',
      googleTypes:['natural_feature','national_park','state_park','park'] },
    balade:     { famille:'nature', libelle:'Balade', emoji:'🚶',
      googleTypes:['hiking_area','garden','botanical_garden'] },
    baignade:   { famille:'nature', libelle:'Baignade', emoji:'🏊',
      googleTypes:['beach'] },

    // ── Nuit · Dormir ──
    camping:    { famille:'nuit', libelle:'Camping', emoji:'⛺',
      googleTypes:['campground','camping_cabin','rv_park'] },
    hotel:      { famille:'nuit', libelle:'Hôtel & gîte', emoji:'🏨',
      googleTypes:['lodging','hotel','motel','guest_house','bed_and_breakfast','cottage','farmstay'] },

    // ── Pause ──
    table:      { famille:'pause', libelle:'Table', emoji:'🍽️',
      googleTypes:['restaurant','meal_takeaway'] },
    cafebar:    { famille:'pause', libelle:'Café & bar', emoji:'🍷',
      googleTypes:['cafe','coffee_shop','bakery','bar','pub','ice_cream_shop'] },
    bienetre:   { famille:'pause', libelle:'Bien-être', emoji:'💆',
      googleTypes:['spa','wellness_center','sauna','hot_spring','massage'] },

    // ── Activité ──
    sport:      { famille:'activite', libelle:'Sport & aventure', emoji:'🧗',
      googleTypes:['adventure_sports_center','sports_complex','ski_resort','marina'] },
    terroir:    { famille:'activite', libelle:'Terroir', emoji:'🧺',
      googleTypes:['winery','farm','market'] },

    // ── Loisirs ──
    parcs:      { famille:'loisirs', libelle:'Parcs & attractions', emoji:'🎡',
      googleTypes:['amusement_park','water_park','ferris_wheel'] },
    animaux:    { famille:'loisirs', libelle:'Animaux', emoji:'🦁',
      googleTypes:['zoo','aquarium','wildlife_park'] },
    spectacle:  { famille:'loisirs', libelle:'Spectacle', emoji:'🎭',
      googleTypes:['stadium','arena'] }
  };

  /* ───────────────────────────────────────────────────────────────────
     2b) INDICES DU NOM  (rattrapage quand les types Google sont imprécis)
     ═══════════════════════════════════════════════════════════════════
     Google est souvent avare en types précis (les châteaux français
     reviennent fréquemment en simple 'tourist_attraction'). Ces mots-clés,
     cherchés dans le NOM du lieu, affinent le classement vers la bonne
     sous-distinction. Centralisé ici, modifiable comme le reste.
     Ordre = priorité (le premier qui matche gagne). Gratuit (nom déjà reçu).
     ─────────────────────────────────────────────────────────────────── */
  const INDICES_NOM = {
    patrimoine: { mots:['chateau','château','fort ','fortress','citadelle','abbaye','cathédrale','cathedrale','basilique','église','eglise','chapelle','monastère','monastere','ruines','remparts','donjon'] },
    musee:      { mots:['musée','musee','museum','galerie'] },
    paysage:    { mots:['cascade','gorge','gorges','col ','sommet','pic ','lac ','étang','etang','grotte','belvédère','belvedere','panorama'] },
    balade:     { mots:['jardin','jardins','parc ','sentier','arboretum'] },
    camping:    { mots:['camping','aire de'] },
    terroir:    { mots:['vignoble','domaine','cave ','caves','ferme','marché','marche couvert'] }
  };

  /* ───────────────────────────────────────────────────────────────────
     3) TYPES  (les 6 types CONCRETS du formulaire de création actuel)
     Ce que l'utilisateur choisit en 1 clic. CLÉS INCHANGÉES depuis v1
     pour ne pas casser le pont avec admin.html. Axe FACTUEL (filtrage fin).
     ─────────────────────────────────────────────────────────────────── */
  const TYPES = {
    Site:       { libelle:'Site à visiter',   emoji:'🏛️', famille:'visiter',  jourNuit:'jour' },
    Restaurant: { libelle:'Restaurant',       emoji:'🍽️', famille:'pause',    jourNuit:'jour' },
    Randonnee:  { libelle:'Randonnée / Vélo', emoji:'🥾', famille:'activite', jourNuit:'jour' },
    Plage:      { libelle:'Plage / Lac',      emoji:'🏖️', famille:'nature',   jourNuit:'jour' },
    Musee:      { libelle:'Musée',            emoji:'🖼️', famille:'visiter',  jourNuit:'jour' },
    Culture:    { libelle:'Culture',          emoji:'🎭', famille:'visiter',  jourNuit:'jour' },
    Chateau:    { libelle:'Château',          emoji:'🏰', famille:'visiter',  jourNuit:'jour' },
    Cave:       { libelle:'Cave / Dégustation', emoji:'🍷', famille:'pause',  jourNuit:'jour' },
    Halte:      { libelle:'Halte / Étape',    emoji:'🚗', famille:'pause',    jourNuit:'jour' },
    Autre:      { libelle:'Autre',            emoji:'📌', famille:'visiter',  jourNuit:'jour' },
    Camping:    { libelle:'Camping',          emoji:'⛺', famille:'nuit',     jourNuit:'nuit' },
    SpotNuit:   { libelle:'Spot nuit',        emoji:'🌌', famille:'nuit',     jourNuit:'nuit' },
    CampBase:   { libelle:'Camp de base',     emoji:'🏡', famille:'nuit',     jourNuit:'nuit' },
    HotelGite:  { libelle:'Hôtel / Gîte',     emoji:'🛏️', famille:'nuit',     jourNuit:'nuit' }
  };

  /* ───────────────────────────────────────────────────────────────────
     4) JOUR / NUIT  (règle transverse — visible à tous les niveaux)
     ─────────────────────────────────────────────────────────────────── */
  const JOUR_NUIT = {
    jour: { libelle:'Jour', emoji:'☀️' },
    nuit: { libelle:'Nuit', emoji:'🌙' }
  };

  /* ───────────────────────────────────────────────────────────────────
     5a) TAGS AUTO  (déduits AUTOMATIQUEMENT à l'import — 0 coût, palier 17 $)
     ═══════════════════════════════════════════════════════════════════
     Règles de détection centralisées ICI (plus en dur dans admin.html) :
       · googleTypes : types Google qui déclenchent le tag
       · motsCles    : mots du NOM qui déclenchent le tag
     ALIGNÉ 17 $ : aucune règle ne lit editorial_summary ni price_level.
     (Le tag 'gratuit' de v1, basé sur price_level, est RETIRÉ — champ banni.)
     Pour DÉSACTIVER une règle : vider 'auto', le tag reste choisissable à la main.
     ─────────────────────────────────────────────────────────────────── */
  const TAGS_AUTO = {
    nature:     { libelle:'Nature',     emoji:'🌿', auto:{ googleTypes:['natural_feature','park','national_park','state_park','hiking_area'], motsCles:['cascade','lac','foret','forêt','rocher','falaise','grotte'] } },
    randonnee:  { libelle:'Rando',      emoji:'🥾', auto:{ googleTypes:['hiking_area','adventure_sports_center'], motsCles:['sentier','rocher','falaise','grotte','col'] } },
    baignade:   { libelle:'Baignade',   emoji:'🏊', auto:{ googleTypes:['beach','water_park'], motsCles:['plage','lac','baignade'] } },
    historique: { libelle:'Historique', emoji:'🏰', auto:{ googleTypes:['museum','historical_landmark','historical_place','monument','church','place_of_worship','castle'], motsCles:['chateau','château','fort','abbaye','ruines'] } },
    vue:        { libelle:'Belle vue',  emoji:'🏔️', auto:{ googleTypes:[], motsCles:['chateau','château','fort','rocher','falaise','grotte','panorama','belvedere','belvédère','sommet'] } },
    enfants:    { libelle:'Enfants',    emoji:'👧', auto:{ googleTypes:['amusement_park','water_park','zoo','aquarium','wildlife_park'], motsCles:[] } },
    teardrop:   { libelle:'Camping-car',emoji:'🚐', auto:{ googleTypes:['campground','rv_park','camping_cabin'], motsCles:[] } },
    terroir:    { libelle:'Terroir',    emoji:'🧺', auto:{ googleTypes:['winery','farm','market'], motsCles:['vignoble','domaine','ferme','marché'] } }
  };

  /* ───────────────────────────────────────────────────────────────────
     5b) TAGS COMPLÉMENT  (ajoutés par l'HUMAIN — Google ne les devine pas)
     ═══════════════════════════════════════════════════════════════════
     L'enrichissement après la fiche de base. Palette OUVERTE mais structurée.
     ─────────────────────────────────────────────────────────────────── */
  const TAGS_COMPLEMENT = {
    calme:        { libelle:'Calme',         emoji:'😌' },
    anime:        { libelle:'Animé',         emoji:'🎉' },
    romantique:   { libelle:'Romantique',    emoji:'💕' },
    'chien-ok':   { libelle:'Chien OK',      emoji:'🐕' },
    piscine:      { libelle:'Piscine',       emoji:'🏊' },
    electricite:  { libelle:'Électricité',   emoji:'⚡' }
  };

  /* ───────────────────────────────────────────────────────────────────
     6) DOG FRIENDLY NUANCÉ  (solde le Point Ouvert fiche n°1)
     ═══════════════════════════════════════════════════════════════════
     Remplace le badge binaire (qui ment). 3 ÉTATS + ORIGINE de l'info.
     À la création : état 'inconnu' (gris, « à confirmer ») ; un MEMBRE
     fiabilise ensuite en vert/ambre. La fiabilité vient de l'humain.
     ─────────────────────────────────────────────────────────────────── */
  const DOG_FRIENDLY = {
    etats: {
      oui:     { libelle:'Bienvenus',       couleur:'vert',  emoji:'🟢' },
      conditions:{ libelle:'Sous conditions', couleur:'ambre', emoji:'🟠' },
      inconnu: { libelle:'À confirmer',     couleur:'gris',  emoji:'⚪' }
    },
    origines: {
      google: { libelle:'importé Google' },
      membre: { libelle:'vérifié par un membre' }
    },
    defaut: { etat:'inconnu', origine:'google' }
  };

  /* ───────────────────────────────────────────────────────────────────
     7) GÉNÉRATEUR DE PHRASE MAISON  (remplace editorial_summary, 0 coût)
     ═══════════════════════════════════════════════════════════════════
     Gabarit à trous : jamais de champ vide. Plus générique que Google,
     mais gratuit et sans dépendance. Le groupe peut réécrire ensuite.
     N'utilise QUE des données du palier 17 $ (type, commune, département, note).
     ─────────────────────────────────────────────────────────────────── */
  function phraseMaison(infos){
    if(!infos) return '';
    const sd   = infos.sousDistinction && SOUS_DISTINCTIONS[infos.sousDistinction];
    const fam  = infos.famille && FAMILLES[infos.famille];
    // mot-catégorie le plus parlant : sous-distinction si dispo, sinon un
    // libellé naturel par famille (évite « Visiter à … » qui sonne mal)
    const motFamille = {
      visiter:'Lieu à visiter', nature:'Coin de nature', nuit:'Hébergement',
      pause:'Pause gourmande', activite:'Activité', loisirs:'Sortie loisirs'
    };
    const quoi = (sd && sd.libelle)
              || (fam && motFamille[infos.famille])
              || (fam && fam.libelle) || 'Lieu';
    const lieu = infos.commune ? ('à '+infos.commune) : '';
    // Le département n'est PAS répété dans la phrase : il est déjà affiché
    // ailleurs sur la fiche (sous-région + badge). On évite ainsi les pièges
    // d'articles irréguliers (le Bas-Rhin / les Landes / l'Yonne…).
    const noteTxt = (typeof infos.note==='number' && infos.note>0)
      ? (', noté '+infos.note.toFixed(1).replace('.',',')+' ★') : '';
    const corps = [quoi, lieu].filter(Boolean).join(' ');
    return (corps + noteTxt).replace(/\s+/g,' ').trim();
  }

  /* ───────────────────────────────────────────────────────────────────
     HELPERS (lecture seule — les pages demandent, le référentiel répond)
     ─────────────────────────────────────────────────────────────────── */
  const api = {
    FAMILLES, SOUS_DISTINCTIONS, TYPES, JOUR_NUIT,
    TAGS_AUTO, TAGS_COMPLEMENT, DOG_FRIENDLY,

    // familles triées par 'ordre' -> [{cle, ...}]
    famillesOrdonnees(){
      return Object.entries(FAMILLES)
        .map(([cle,v])=>Object.assign({cle},v))
        .sort((a,b)=>(a.ordre||99)-(b.ordre||99));
    },

    // sous-distinctions d'une famille (clé) -> [{cle, ...}]
    sousDistinctionsDeFamille(familleKey){
      return Object.entries(SOUS_DISTINCTIONS)
        .filter(([,v])=>v.famille===familleKey)
        .map(([cle,v])=>Object.assign({cle},v));
    },

    // famille-mère d'un type de formulaire (clé) -> objet famille (ou null)
    familleDuType(typeKey){
      const t=TYPES[typeKey]; return t ? FAMILLES[t.famille]||null : null;
    },

    // orientation Jour/Nuit d'un type (clé) -> 'jour' | 'nuit'
    jourNuitDuType(typeKey){
      const t=TYPES[typeKey]; return t ? (t.jourNuit||(FAMILLES[t.famille]||{}).jourNuit||'jour') : 'jour';
    },

    // ══ VÉRITÉ UNIQUE Jour/Nuit d'une FICHE (le couchage = "nuit") ══
    // Cascade (la main humaine prime, puis la donnée structurée, puis repli) :
    //   (1) marqueur explicite monde_nuit=true        -> nuit
    //   (2) type de la fiche (TYPES[...].jourNuit)     -> source structurée
    //   (3) famille déduite (tags / Google)            -> repli
    //   (4) défaut prudent                             -> jour
    // Une SEULE définition : tout le reste (Horizon 8e thème, Cockpit, etc.)
    // appelle estCouchage — aucune logique de classement dupliquée ailleurs.
    jourNuitFiche(fiche){
      if(!fiche) return 'jour';
      if(fiche.monde_nuit === true) return 'nuit';
      if(fiche.monde_nuit === false && fiche.jour_nuit === 'nuit') return 'nuit';
      const t = fiche.type;
      if(t && TYPES[t] && TYPES[t].jourNuit) return TYPES[t].jourNuit;
      try{
        const fam = fiche.famille
          ? fiche.famille
          : (api.classerDepuisGoogle(fiche.types || fiche.google_types, fiche.nom)||{}).famille;
        if(fam && FAMILLES[fam] && FAMILLES[fam].jourNuit) return FAMILLES[fam].jourNuit;
      }catch(e){ /* repli défaut */ }
      return 'jour';
    },

    // true si la fiche est un couchage (où l'on dort). Confort par-dessus jourNuitFiche.
    estCouchage(fiche){ return api.jourNuitFiche(fiche) === 'nuit'; },

    // ══ MENU TYPE — un seul endroit (règle Master : une liste, une source) ══
    // Génère les <optgroup> Jour/Nuit du menu Type, dans l'ordre de TYPES.
    // admin.html ET fiche-edit.js appellent CETTE fonction plutôt que de
    // recopier chacun leur propre liste HTML — si un type change ici, les
    // deux pages suivent automatiquement, jamais de liste à resynchroniser.
    optionsTypeHtml(){
      const grp=(jn)=>Object.entries(TYPES)
        .filter(([,v])=>v.jourNuit===jn)
        .map(([cle,v])=>'<option value="'+cle+'">'+v.libelle+'</option>').join('');
      return '<optgroup label="☀️ Jour">'+grp('jour')+'</optgroup>'+
             '<optgroup label="🌙 Nuit">'+grp('nuit')+'</optgroup>';
    },

    // ══ CŒUR AUTO : classe un lieu depuis son NOM puis ses types Google ══
    // Priorité (décision 08/06 — le NOM prime) :
    //   (1) indices FORTS du nom (château, abbaye… priment même si Google
    //       tague 'museum' — ex. Château de Versailles → Patrimoine) ;
    //   (2) type Google précis ;
    //   (3) filet de sécurité tourist_attraction → Visiter.
    // p.types = tableau des types Google ; nom = libellé du lieu.
    // -> { famille, sousDistinction } | null si rien ne matche
    classerDepuisGoogle(types, nom){
      const set = new Set(Array.isArray(types)?types:[]);
      const n=(nom||'').toLowerCase();
      // Types « commerce » : si Google l'affirme, le NOM ne doit PAS l'emporter
      // (« Restaurant du Château » reste une Table, pas du Patrimoine).
      const COMMERCE=['restaurant','meal_takeaway','cafe','coffee_shop','bakery',
        'bar','pub','ice_cream_shop','lodging','hotel','motel','guest_house',
        'bed_and_breakfast','spa','store','shopping_mall'];
      const estCommerce = COMMERCE.some(gt=>set.has(gt));
      // (1) Indices FORTS du nom — priment SAUF si c'est un commerce avéré
      if(n && !estCommerce){
        for(const [cle,regle] of Object.entries(INDICES_NOM)){
          if(regle.mots.some(m=>n.includes(m)))
            return { famille:SOUS_DISTINCTIONS[cle].famille, sousDistinction:cle };
        }
      }
      // (2) Type Google PRÉCIS (tourist_attraction n'est dans aucune liste)
      for(const [cle,sd] of Object.entries(SOUS_DISTINCTIONS)){
        if((sd.googleTypes||[]).some(gt=>set.has(gt)))
          return { famille:sd.famille, sousDistinction:cle };
      }
      // (3) Indices du nom en RATTRAPAGE (si commerce sans sous-distinction trouvée)
      if(n){
        for(const [cle,regle] of Object.entries(INDICES_NOM)){
          if(regle.mots.some(m=>n.includes(m)))
            return { famille:SOUS_DISTINCTIONS[cle].famille, sousDistinction:cle };
        }
      }
      // (4) Filet de sécurité : « à voir » sans rien de précis → Visiter
      if(set.has('tourist_attraction') || set.has('point_of_interest'))
        return { famille:'visiter', sousDistinction:null };
      return null;
    },

    // ══ AUTO-TAGS : tags à cocher depuis une réponse Google (aligné 17 $) ══
    // p = place Google ; lit p.types et p.name UNIQUEMENT (pas de champ cher).
    // -> tableau de clés de tags (sans doublon)
    autoTagsDepuisGoogle(p){
      if(!p) return [];
      const found=new Set();
      const types=p.types||[];
      const nom=(p.name||'').toLowerCase();
      for(const [cle,t] of Object.entries(TAGS_AUTO)){
        const r=t.auto; if(!r) continue;
        if((r.googleTypes||[]).some(gt=>types.includes(gt))) found.add(cle);
        if((r.motsCles||[]).some(m=>nom.includes(m)))        found.add(cle);
      }
      return [...found];
    },

    // tous les tags (auto + complément) à plat -> [{cle, libelle, emoji, source}]
    tousLesTags(){
      const out=[];
      for(const [k,v] of Object.entries(TAGS_AUTO))       out.push({cle:k,libelle:v.libelle,emoji:v.emoji,source:'auto'});
      for(const [k,v] of Object.entries(TAGS_COMPLEMENT)) out.push({cle:k,libelle:v.libelle,emoji:v.emoji,source:'complement'});
      return out;
    },

    // libellé d'un tag (auto puis complément) -> string|null
    libelleTag(tagKey){
      if(TAGS_AUTO[tagKey])       return TAGS_AUTO[tagKey].libelle;
      if(TAGS_COMPLEMENT[tagKey]) return TAGS_COMPLEMENT[tagKey].libelle;
      return null;
    },

    // génère la phrase de description maison (voir §7)
    phraseMaison,

    // ── ÉTAGE 2 (tags perso par groupe) — CROCHET RÉSERVÉ, NON IMPLÉMENTÉ ──
    // Quand l'étage 2 existera (table tags_groupe + plafond), cette fonction
    // fusionnera le vocabulaire MAISON avec les tags PERSO d'un groupe.
    // Pour l'instant : renvoie les tags maison seuls.
    fusionnerTagsGroupe(tagsPersoGroupe){
      const maison=this.tousLesTags();
      if(!Array.isArray(tagsPersoGroupe)||!tagsPersoGroupe.length) return maison;
      const perso=tagsPersoGroupe.map(t=>({cle:t.cle,libelle:t.libelle,emoji:t.emoji||'🏷️',source:'groupe'}));
      return maison.concat(perso);
    }
  };

  // Exposition globale en lecture (gelée pour éviter les modifs accidentelles)
  try{ Object.freeze(api); }catch(e){}
  window.RNR_TAGS = api;

})();
