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
#rnrg-rail{position:fixed;top:50%;right:14px;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px;z-index:900;}
.rnrg-rail-btn{width:42px;height:42px;border-radius:50%;background:var(--chrome-bg,#161410);color:var(--gold,#C8A84B);
  border:1.5px solid var(--gold-a20,rgba(200,168,75,.2));font-size:18px;cursor:pointer;position:relative;
  display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.25);}
.rnrg-rail-btn:hover{background:var(--gold,#C8A84B);color:var(--chrome-bg,#161410);}
.rnrg-rail-badge{position:absolute;top:-4px;right:-4px;background:var(--gold,#C8A84B);color:var(--chrome-bg,#161410);
  font-size:9px;font-weight:800;min-width:15px;height:15px;border-radius:8px;display:none;align-items:center;justify-content:center;padding:0 3px;}
.rnrg-rail-badge.on{display:flex;}

#rnrg-drawer-notes,#rnrg-drawer-memo{position:fixed;top:64px;right:-420px;bottom:0;width:min(400px,90vw);
  background:var(--paper,#FFFDF8);z-index:2000;transition:right .25s ease;box-shadow:-8px 0 24px rgba(0,0,0,.25);
  display:flex;flex-direction:column;}
#rnrg-drawer-notes.open,#rnrg-drawer-memo.open{right:0;}
.rnrg-dr-tete{padding:16px 18px;border-bottom:1px solid var(--gold-a20,rgba(200,168,75,.2));display:flex;align-items:center;gap:10px;}
.rnrg-dr-tete h3{font-family:'Playfair Display',serif;font-size:16px;margin:0;flex:1;}
.rnrg-dr-fermer{background:none;border:none;font-size:18px;cursor:pointer;color:var(--ink-dim);}
.rnrg-dr-corps{flex:1;overflow-y:auto;padding:14px 18px;}

/* Notes du groupe : style discussion (avatar + bulle) */
.rnrg-note{display:flex;gap:9px;margin-bottom:14px;}
.rnrg-note-av{width:30px;height:30px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;}
.rnrg-note-meta{font-size:10.5px;color:var(--ink-dim);margin-bottom:2px;}
.rnrg-note-bulle{background:var(--bg,#F2EFE8);border-radius:10px;padding:8px 11px;font-size:13px;line-height:1.4;white-space:pre-wrap;}
.rnrg-note-empty{color:var(--ink-dim);font-size:13px;text-align:center;padding:30px 10px;}
.rnrg-note-form{padding:12px 18px;border-top:1px solid var(--gold-a20,rgba(200,168,75,.2));display:flex;gap:8px;}
.rnrg-note-input{flex:1;border:1.5px solid var(--paper-line,rgba(26,18,8,.09));border-radius:8px;padding:8px 10px;font-family:inherit;font-size:13px;resize:none;min-height:38px;}
.rnrg-note-send{background:var(--ink,#211a10);color:var(--gold,#C8A84B);border:none;border-radius:8px;padding:0 16px;font-weight:700;cursor:pointer;}

/* Mémo de voyage : mêmes blocs que "Bon à savoir" du Cahier, éditables */
.rnrg-memo-bloc{border:1.5px solid var(--paper-line,rgba(26,18,8,.09));border-radius:8px;padding:12px 14px;margin-bottom:12px;background:rgba(255,255,255,.4);}
.rnrg-memo-tete{display:flex;gap:8px;align-items:center;margin-bottom:8px;}
.rnrg-memo-emoji{font-size:18px;width:28px;text-align:center;flex-shrink:0;}
.rnrg-memo-titre{flex:1;border:none;background:transparent;font-weight:700;font-size:13px;font-family:inherit;color:var(--ink);}
.rnrg-memo-titre:focus{outline:none;border-bottom:1px dashed var(--gold,#C8A84B);}
.rnrg-memo-del{background:none;border:none;color:var(--ink-dim);cursor:pointer;font-size:13px;}
.rnrg-memo-texte{width:100%;border:none;background:transparent;font-size:12.5px;line-height:1.5;font-family:inherit;resize:vertical;min-height:44px;}
.rnrg-memo-texte:focus{outline:none;}
.rnrg-memo-add{width:100%;padding:10px;border:1.5px dashed var(--gold-a20,rgba(200,168,75,.2));border-radius:8px;background:none;color:var(--gold-deep,#8b6914);font-weight:700;font-size:12.5px;cursor:pointer;margin-top:6px;}
.rnrg-memo-save{position:sticky;bottom:0;background:var(--paper,#FFFDF8);padding:12px 0 0;}
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

  async function chargerMemo(){
    const corps=document.getElementById('rnrg-memo-corps');
    let blocs=[];
    try{
      const {data}=await OPT.sb.from('voyages').select('memo_blocs').eq('id',OPT.voyageId).single();
      blocs=(data&&data.memo_blocs)||[];
    }catch(e){ console.warn('RailGroupe: memo', e); }
    OPT._memoBlocs=blocs;
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
