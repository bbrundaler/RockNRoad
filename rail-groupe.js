// ═══════════════════════════════════════════════════════════════════════════
// RAIL GROUPE — Notes du groupe + Mémo de voyage (08/07, un seul endroit,
// partagé par Horizon/Carnet/Roadbook). Même motif que fiche-edit.js/
// lightbox.js : construit son propre DOM/CSS au premier usage.
//
// Usage : RNR_RAIL_GROUPE.init({
//   sb, voyageId, groupeId, userId, membreId,
//   railHote: document.getElementById('hz-rail') // optionnel — si fourni et
//     qu'il contient déjà un bouton #hz-rail-groupe et #hz-rail-coeurs,
//     les 2 nouveaux boutons s'intercalent dans le bon ordre (groupe, NOTES,
//     coeurs, MÉMO). Sinon, crée son propre petit rail autonome (Carnet,
//     Roadbook) au même endroit visuel (droite, milieu d'écran).
// })
(function(){
  let built=false, OPT=null;
  let NOTES_CHANNEL=null;

  function esc(t){ const d=document.createElement('div'); d.textContent=(t==null?'':t); return d.innerHTML; }

  function injectStyle(){
    if(document.getElementById('rnrg-style')) return;
    const css=`
#rnrg-rail{position:fixed;top:50%;right:14px;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px;z-index:9200;}
.rnrg-rail-btn{position:relative;width:54px;height:54px;border-radius:14px;
  background:var(--surface);border:1px solid var(--surface-line);box-shadow:var(--shadow);
  display:flex;align-items:center;justify-content:center;font-size:23px;cursor:pointer;transition:.15s;}
.rnrg-rail-btn:hover{border-color:var(--gold-a35);}
.rnrg-rail-badge{position:absolute;top:-5px;right:-5px;min-width:19px;height:19px;border-radius:10px;
  background:#d8456e;color:#fff;font-size:11.5px;font-weight:700;display:none;align-items:center;justify-content:center;padding:0 5px;}
.rnrg-rail-badge.on{display:flex;}

#rnrg-drawer-notes,#rnrg-drawer-memo{position:fixed;top:64px;right:0;bottom:0;left:auto;width:min(420px,90vw);
  background:var(--surface);border-left:1px solid var(--gold-a35);box-shadow:-8px 0 30px rgba(0,0,0,.22);
  z-index:9300;display:none;flex-direction:column;}
#rnrg-drawer-notes.open,#rnrg-drawer-memo.open{display:flex;}
.rnrg-dr-tete{display:flex;align-items:center;gap:8px;padding:14px 16px;flex-shrink:0;border-bottom:1px solid var(--surface-line);}
.rnrg-dr-tete h3{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:var(--ink);margin:0;flex:1;}
.rnrg-dr-fermer{background:none;border:none;font-size:16px;color:var(--ink-dim);cursor:pointer;padding:4px;}
.rnrg-dr-fermer:hover{color:var(--ink);}
.rnrg-dr-corps{flex:1;overflow-y:auto;scrollbar-width:thin;padding:9px 16px 16px;min-height:0;}

/* Notes du groupe : style discussion (avatar + bulle) */
.rnrg-note{display:flex;gap:9px;margin-bottom:14px;}
.rnrg-note-av{width:30px;height:30px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;}
.rnrg-note-meta{font-size:10.5px;color:var(--ink-dim);margin-bottom:2px;}
.rnrg-note-bulle{background:var(--bg,#F2EFE8);border-radius:10px;padding:8px 11px;font-size:13px;line-height:1.4;white-space:pre-wrap;}
.rnrg-note-empty{color:var(--ink-dim);font-size:13px;text-align:center;padding:30px 10px;}
.rnrg-note-form{padding:12px 16px;border-top:1px solid var(--surface-line);display:flex;gap:8px;flex-shrink:0;}
.rnrg-note-input{flex:1;border:1.5px solid var(--surface-line);border-radius:8px;padding:8px 10px;font-family:inherit;font-size:13px;resize:none;min-height:38px;background:var(--paper);color:var(--ink);}
.rnrg-note-send{background:var(--ink,#211a10);color:var(--gold,#C8A84B);border:none;border-radius:8px;padding:0 16px;font-weight:700;cursor:pointer;}

/* Mémo de voyage : mêmes blocs que "Bon à savoir" du Cahier, éditables */
.rnrg-memo-bloc{border:1.5px solid var(--surface-line);border-radius:8px;padding:12px 14px;margin-bottom:12px;background:var(--paper);}
.rnrg-memo-tete{display:flex;gap:8px;align-items:center;margin-bottom:8px;}
.rnrg-memo-emoji{font-size:18px;width:28px;text-align:center;flex-shrink:0;}
.rnrg-memo-titre{flex:1;border:none;background:transparent;font-weight:700;font-size:13px;font-family:inherit;color:var(--ink);}
.rnrg-memo-titre:focus{outline:none;border-bottom:1px dashed var(--gold,#C8A84B);}
.rnrg-memo-del{background:none;border:none;color:var(--ink-dim);cursor:pointer;font-size:13px;}
.rnrg-memo-texte{width:100%;border:none;background:transparent;font-size:12.5px;line-height:1.5;font-family:inherit;color:var(--ink);resize:vertical;min-height:44px;}
.rnrg-memo-texte:focus{outline:none;}
.rnrg-memo-add{width:100%;padding:10px;border:1.5px dashed var(--gold-a35);border-radius:8px;background:none;color:var(--gold-deep,#8b6914);font-weight:700;font-size:12.5px;cursor:pointer;margin-top:6px;}
.rnrg-memo-save{position:sticky;bottom:0;background:var(--surface);padding:12px 0 0;}
.rnrg-memo-save button{width:100%;padding:10px;background:var(--ink,#211a10);color:var(--gold,#C8A84B);border:none;border-radius:8px;font-weight:700;cursor:pointer;}
`;
    const s=document.createElement('style'); s.id='rnrg-style'; s.textContent=css;
    document.head.appendChild(s);
  }

  function couleurAvatar(nom){
    const palette=['#D85A30','#2159A8','#2C5016','#8b6914','#6B3288','#1B2A6B'];
    let h=0; for(let i=0;i<(nom||'?').length;i++) h=(h*31+nom.charCodeAt(i))>>>0;
    return palette[h%palette.length];
  }
  function avatarDe(membreId, nom){
    if(window.RNRDiscussion && OPT.membres){
      try{
        const av=RNRDiscussion.memberAvatar({membres:OPT.membres}, membreId, nom);
        if(av && av.emoji) return {texte:av.emoji, bg:'var(--gold-a20,rgba(200,168,75,.2))'};
        if(av) return {texte:av.initiale, bg:av.bg};
      }catch(e){}
    }
    const n=(nom||'?').charAt(0).toUpperCase();
    return {texte:n, bg:couleurAvatar(nom||'?')};
  }

  function ensureDom(){
    if(built) return;
    injectStyle();

    // Rail autonome (Carnet/Roadbook) — si un rail hôte a été fourni
    // (Horizon), on n'en crée pas un second, on s'intercale dedans.
    let btnNotes, btnMemo;
    if(OPT.railHote){
      btnNotes=document.createElement('button');
      btnNotes.className='rnrg-rail-btn'; btnNotes.type='button'; btnNotes.title='Notes du groupe';
      btnNotes.innerHTML='📝<span class="rnrg-rail-badge" id="rnrg-badge-notes"></span>';
      btnNotes.onclick=()=>ouvrirNotes();
      const btnGroupe=OPT.railHote.querySelector('#hz-rail-groupe');
      if(btnGroupe && btnGroupe.nextSibling) OPT.railHote.insertBefore(btnNotes, btnGroupe.nextSibling);
      else OPT.railHote.appendChild(btnNotes);

      btnMemo=document.createElement('button');
      btnMemo.className='rnrg-rail-btn'; btnMemo.type='button'; btnMemo.title='Mémo de voyage';
      btnMemo.innerHTML='🧳';
      btnMemo.onclick=()=>ouvrirMemo();
      OPT.railHote.appendChild(btnMemo);
      // adapte le style hz-rail-btn existant si besoin (classes différentes) :
      btnNotes.classList.add('hz-rail-btn'); btnMemo.classList.add('hz-rail-btn');
    } else {
      const rail=document.createElement('div');
      rail.id='rnrg-rail';
      rail.innerHTML=`
        <button class="rnrg-rail-btn" type="button" title="Notes du groupe" onclick="RNR_RAIL_GROUPE._ouvrirNotes()">📝<span class="rnrg-rail-badge" id="rnrg-badge-notes"></span></button>
        <button class="rnrg-rail-btn" type="button" title="Mémo de voyage" onclick="RNR_RAIL_GROUPE._ouvrirMemo()">🧳</button>`;
      document.body.appendChild(rail);
    }

    const drawers=document.createElement('div');
    drawers.innerHTML=`
      <div id="rnrg-drawer-notes">
        <div class="rnrg-dr-tete"><span>📝</span><h3>Notes du groupe</h3><button class="rnrg-dr-fermer" onclick="RNR_RAIL_GROUPE._fermerNotes()">✕</button></div>
        <div class="rnrg-dr-corps" id="rnrg-notes-feed"><div class="rnrg-note-empty">Chargement…</div></div>
        <div class="rnrg-note-form">
          <textarea class="rnrg-note-input" id="rnrg-note-input" placeholder="Une idée, un truc à ne pas oublier…" rows="1"></textarea>
          <button class="rnrg-note-send" onclick="RNR_RAIL_GROUPE._envoyerNote()">➤</button>
        </div>
      </div>
      <div id="rnrg-drawer-memo">
        <div class="rnrg-dr-tete"><span>🧳</span><h3>Mémo de voyage</h3><button class="rnrg-dr-fermer" onclick="RNR_RAIL_GROUPE._fermerMemo()">✕</button></div>
        <div class="rnrg-dr-corps" id="rnrg-memo-corps"><div class="rnrg-note-empty">Chargement…</div></div>
      </div>`;
    document.body.appendChild(drawers);
    built=true;
  }

  async function chargerNotes(){
    const feed=document.getElementById('rnrg-notes-feed');
    try{
      const {data}=await OPT.sb.from('voyage_notes').select('id,membre_id,texte,created_at,membres(nom,avatar)').eq('voyage_id',OPT.voyageId).order('created_at',{ascending:true});
      const notes=data||[];
      if(!notes.length){ feed.innerHTML='<div class="rnrg-note-empty">Rien pour l\'instant — un mot, une idée, un truc à ne pas oublier 👇</div>'; return; }
      feed.innerHTML=notes.map(n=>{
        const nom=(n.membres&&n.membres.nom)||'Voyageur';
        const av=avatarDe(n.membre_id, nom);
        const heure=new Date(n.created_at).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
        return '<div class="rnrg-note"><div class="rnrg-note-av" style="background:'+av.bg+'">'+esc(av.texte)+'</div>'
          +'<div style="flex:1;"><div class="rnrg-note-meta">'+esc(nom)+' · '+heure+'</div>'
          +'<div class="rnrg-note-bulle">'+esc(n.texte)+'</div></div></div>';
      }).join('');
      feed.scrollTop=feed.scrollHeight;
    }catch(e){ feed.innerHTML='<div class="rnrg-note-empty">Impossible de charger les notes.</div>'; console.warn('RailGroupe: notes', e); }
  }
  async function envoyerNote(){
    const input=document.getElementById('rnrg-note-input');
    const texte=(input.value||'').trim();
    if(!texte) return;
    input.value='';
    try{
      const {error}=await OPT.sb.from('voyage_notes').insert({voyage_id:OPT.voyageId, membre_id:OPT.membreId, texte});
      if(error) throw error;
      // pas de rechargement manuel ici : le canal realtime s'en charge (voir subscribeNotes)
    }catch(e){ console.warn('RailGroupe: envoi note', e); input.value=texte; }
  }
  function subscribeNotes(){
    if(NOTES_CHANNEL || !OPT.sb.channel) return;
    NOTES_CHANNEL=OPT.sb.channel('rnrg-notes-'+OPT.voyageId)
      .on('postgres_changes', {event:'INSERT', schema:'public', table:'voyage_notes', filter:'voyage_id=eq.'+OPT.voyageId}, ()=>{
        chargerNotes();
        const badge=document.getElementById('rnrg-badge-notes');
        if(badge && !document.getElementById('rnrg-drawer-notes').classList.contains('open')){ badge.textContent='●'; badge.classList.add('on'); }
      })
      .subscribe();
  }

  // Contenu de départ du Mémo de voyage (08/07, retour Bruno) : une copie du
  // "Bon à savoir" du Cahier — jamais de page vide au premier clic. Reste
  // entièrement éditable/supprimable ensuite ; ce n'est qu'un point de départ.
  // Dupliqué volontairement depuis cahier.html (BON_A_SAVOIR) : l'un est la
  // référence générique statique, l'autre le point de départ éditable par
  // voyage — même logique que les grilles d'envies dupliquées ailleurs.
  const MEMO_SEED=[
    { icone:'🔌', titre:'Électricité', texte:'Rallonge : 20 à 30 m avec prise européenne (CEE bleue) — la longueur standard des bornes de camping.\nAdaptateur : prévoir celui du pays visité si besoin.' },
    { icone:'💧', titre:'Eau', texte:'Tuyau alimentaire dédié au remplissage (pas un tuyau de jardin classique).\nJerrican de secours pour les nuits hors camping.' },
    { icone:'🛣️', titre:'Sur la route', texte:'Triangle + gilet réfléchissant par personne (obligatoire UE).\nVérifier les vignettes locales du pays traversé.\nCales de stabilisation pour terrain irrégulier.' },
    { icone:'🔥', titre:'Gaz', texte:'Une bouteille de rechange si le trajet est long.' },
    { icone:'📄', titre:'Papiers', texte:'Carte grise, assurance, permis — et carte verte si hors UE.' },
  ];

  function copieMemoSeed(){ return MEMO_SEED.map(b=>({icone:b.icone,titre:b.titre,texte:b.texte})); }

  async function chargerMemo(){
    const corps=document.getElementById('rnrg-memo-corps');
    let blocs=[];
    try{
      const {data}=await OPT.sb.from('voyages').select('memo_blocs').eq('id',OPT.voyageId).single();
      blocs=(data&&data.memo_blocs)||[];
    }catch(e){ console.warn('RailGroupe: memo', e); }
    OPT._memoBlocs = blocs.length ? blocs : copieMemoSeed();
    rendreMemo();
  }
  function rendreMemo(){
    const corps=document.getElementById('rnrg-memo-corps');
    const blocs=OPT._memoBlocs||[];
    corps.innerHTML = blocs.map((b,i)=>
      '<div class="rnrg-memo-bloc" data-i="'+i+'">'
        +'<div class="rnrg-memo-tete"><span class="rnrg-memo-emoji">'+esc(b.icone||'📌')+'</span>'
        +'<input class="rnrg-memo-titre" value="'+esc(b.titre||'')+'" placeholder="Titre du bloc" oninput="RNR_RAIL_GROUPE._majBloc('+i+',\'titre\',this.value)">'
        +'<button class="rnrg-memo-del" onclick="RNR_RAIL_GROUPE._supprBloc('+i+')" title="Supprimer">🗑</button></div>'
        +'<textarea class="rnrg-memo-texte" placeholder="Écrivez ici…" oninput="RNR_RAIL_GROUPE._majBloc('+i+',\'texte\',this.value)">'+esc(b.texte||'')+'</textarea>'
      +'</div>'
    ).join('') + '<button class="rnrg-memo-add" onclick="RNR_RAIL_GROUPE._ajouterBloc()">+ Ajouter un bloc</button>'
      + '<div class="rnrg-memo-save"><button onclick="RNR_RAIL_GROUPE._sauverMemo()">💾 Enregistrer le mémo</button></div>';
  }
  function majBloc(i, champ, val){ if(OPT._memoBlocs && OPT._memoBlocs[i]) OPT._memoBlocs[i][champ]=val; }
  function ajouterBloc(){
    OPT._memoBlocs=OPT._memoBlocs||[];
    OPT._memoBlocs.push({icone:'📌', titre:'', texte:''});
    rendreMemo();
  }
  function supprBloc(i){
    OPT._memoBlocs.splice(i,1);
    rendreMemo();
  }
  async function sauverMemo(){
    try{
      const {error}=await OPT.sb.from('voyages').update({memo_blocs:OPT._memoBlocs||[]}).eq('id',OPT.voyageId);
      if(error) throw error;
      if(window.showToast) showToast('✅ Mémo enregistré','success');
    }catch(e){ console.warn('RailGroupe: sauvegarde memo', e); if(window.showToast) showToast('Erreur mémo','error'); }
  }

  function ouvrirNotes(){ ensureDom(); document.getElementById('rnrg-drawer-notes').classList.add('open'); const b=document.getElementById('rnrg-badge-notes'); if(b) b.classList.remove('on'); chargerNotes(); subscribeNotes(); }
  function fermerNotes(){ const d=document.getElementById('rnrg-drawer-notes'); if(d) d.classList.remove('open'); }
  function ouvrirMemo(){ ensureDom(); document.getElementById('rnrg-drawer-memo').classList.add('open'); chargerMemo(); }
  function fermerMemo(){ const d=document.getElementById('rnrg-drawer-memo'); if(d) d.classList.remove('open'); }

  function init(opts){ OPT=opts||{}; ensureDom(); }

  window.RNR_RAIL_GROUPE={
    init,
    _ouvrirNotes: ouvrirNotes, _fermerNotes: fermerNotes, _envoyerNote: envoyerNote,
    _ouvrirMemo: ouvrirMemo, _fermerMemo: fermerMemo,
    _majBloc: majBloc, _ajouterBloc: ajouterBloc, _supprBloc: supprBloc, _sauverMemo: sauverMemo,
  };
})();
