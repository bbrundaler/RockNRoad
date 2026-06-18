/* ===================================================================
   discussion.js — LE FIL DE DISCUSSION UNIFIÉ (composant partagé)
   -------------------------------------------------------------------
   Un seul composant de chat, réutilisable sur n'importe quelle page
   (Cockpit, Horizon, HUB…). Bonnes pratiques des outils pro (Stream,
   MUI Chat, shadcn) :
     • Hauteur FIXE + scroll interne (jamais d'expansion infinie).
     • Auto-scroll en bas à l'arrivée d'un message.
     • Messages GROUPÉS par auteur : avatar/emoji en tête du groupe.
     • Séparateurs de DATE entre les jours.
     • Messages SYSTÈME visuellement distincts (gris, neutres).
   Le fil reste COMMUN au groupe (un seul fil, pas par-voyage) — règle
   Bruno : les votes suivent le voyage, la discussion reste commune.

   USAGE :
     <script src="discussion.js"></script>
     RNRDiscussion.monter('mon-conteneur', {
       sb, groupeId, userId, userNom,
       membres: [{id,user_id,pseudo,prenom,avatar}],  // optionnel (avatars emoji)
       hauteur: '320px',         // optionnel
       titre: 'Partager au groupe' // optionnel (en-tête)
     });
   API : RNRDiscussion.recharger(idConteneur), RNRDiscussion.demonter(id)
   =================================================================== */
(function () {
  'use strict';

  var INSTANCES = {}; // idConteneur -> config

  /* ── CSS injecté une seule fois (tokens de charte, zéro couleur en dur) ── */
  function injecterCss() {
    if (document.getElementById('rnr-disc-css')) return;
    var css = ''
    + '.rnrd-wrap{display:flex;flex-direction:column;min-height:0;}'
    + '.rnrd-head{font-family:var(--font-title);font-size:14px;color:var(--gold-text);'
    +   'font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:6px;}'
    + '.rnrd-feed{flex:1 1 auto;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;'
    +   'gap:2px;padding:4px 2px;scrollbar-width:thin;scrollbar-color:var(--gold-a35) transparent;}'
    + '.rnrd-feed::-webkit-scrollbar{width:6px;}'
    + '.rnrd-feed::-webkit-scrollbar-thumb{background:var(--gold-a35);border-radius:3px;}'
    + '.rnrd-empty{margin:auto;text-align:center;color:var(--ink-dim);font-size:13px;font-style:italic;'
    +   'line-height:1.5;padding:18px;}'
    /* séparateur de date */
    + '.rnrd-date{align-self:center;font-size:10.5px;color:var(--ink-dim);background:var(--gold-a10);'
    +   'border-radius:var(--r-pill,999px);padding:2px 12px;margin:10px 0 6px;text-transform:uppercase;letter-spacing:.04em;}'
    /* groupe de messages d'un même auteur */
    + '.rnrd-grp{display:flex;gap:9px;margin-top:9px;align-items:flex-start;}'
    + '.rnrd-grp.cont{margin-top:2px;}'   /* message suivant du même auteur : collé */
    + '.rnrd-av{width:30px;height:30px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;'
    +   'justify-content:center;font-size:15px;color:#fff;font-weight:700;overflow:hidden;}'
    + '.rnrd-av.vide{background:transparent;}'   /* messages suivants : pas de ré-avatar */
    + '.rnrd-col{flex:1;min-width:0;display:flex;flex-direction:column;}'
    + '.rnrd-meta{display:flex;align-items:baseline;gap:7px;margin-bottom:2px;}'
    + '.rnrd-nom{font-size:13px;font-weight:700;color:var(--ink);}'
    + '.rnrd-h{font-size:10.5px;color:var(--ink-dim);}'
    + '.rnrd-bulle{font-size:13.5px;color:var(--ink);line-height:1.45;word-wrap:break-word;'
    +   'white-space:pre-wrap;}'
    + '.rnrd-photo{margin-top:4px;font-size:12px;color:var(--ink-dim);}'
    /* message SYSTÈME : neutre, gris, distinct d'un vrai message */
    + '.rnrd-sys{align-self:center;text-align:center;font-size:11.5px;color:var(--ink-dim);'
    +   'background:var(--surface-line,rgba(150,150,150,.12));border-radius:8px;padding:5px 12px;'
    +   'margin:7px 0;max-width:85%;font-style:italic;}'
    /* réactions */
    + '.rnrd-react{display:flex;gap:5px;margin-top:5px;flex-wrap:wrap;}'
    + '.rnrd-rb{display:inline-flex;align-items:center;gap:3px;cursor:pointer;border:1px solid var(--gold-a35);'
    +   'background:transparent;border-radius:var(--r-pill,999px);padding:1px 8px;font-size:12px;'
    +   'color:var(--ink-dim);transition:.15s;}'
    + '.rnrd-rb:hover{border-color:var(--gold);}'
    + '.rnrd-rb.mine{background:var(--gold-a20);color:var(--gold-text);border-color:var(--gold);}'
    + '.rnrd-rb .rc{font-size:11px;font-weight:700;}'
    + '.rnrd-flag{margin-left:auto;cursor:pointer;border:none;background:none;color:var(--ink-dim);'
    +   'opacity:.4;font-size:12px;transition:opacity .15s;}'
    + '.rnrd-flag:hover{opacity:1;}'
    /* composer */
    + '.rnrd-composer{display:flex;gap:7px;align-items:flex-end;margin-top:9px;flex-shrink:0;}'
    + '.rnrd-input{flex:1;font-family:var(--font-body);font-size:13.5px;padding:9px 12px;resize:none;'
    +   'border:1.5px solid var(--surface-line);border-radius:var(--r,12px);background:var(--bg);'
    +   'color:var(--ink);max-height:90px;min-height:20px;line-height:1.4;}'
    + '.rnrd-input:focus{outline:none;border-color:var(--gold);}'
    + '.rnrd-send{flex-shrink:0;width:38px;height:38px;border-radius:50%;border:none;cursor:pointer;'
    +   'background:var(--gold);color:var(--chrome-bg,#1a1a1a);font-size:16px;transition:background .15s;}'
    + '.rnrd-send:hover{background:var(--gold-light);}'
    + '.rnrd-send:disabled{opacity:.5;cursor:wait;}';
    var st = document.createElement('style');
    st.id = 'rnr-disc-css'; st.textContent = css;
    document.head.appendChild(st);
  }

  /* ── Helpers ── */
  function esc(t){ var d=document.createElement('div'); d.textContent=(t==null?'':t); return d.innerHTML; }
  function initiale(nom){ return ((nom||'?').trim().charAt(0)||'?').toUpperCase(); }
  function couleurAvatar(nom){
    var pal=[['#7a5a1f','#caa24a'],['#13384a','#3d8fb0'],['#6B3288','#c89be0'],
             ['#2C5016','#7DBB4F'],['#7a3320','#d08a5a']];
    var h=0,s=nom||''; for(var i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0;
    var p=pal[h%pal.length];
    return 'linear-gradient(135deg,'+p[0]+','+p[1]+')';
  }
  function heure(iso){
    try{ return new Date(iso).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}); }
    catch(e){ return ''; }
  }
  function libelleJour(iso){
    try{
      var d=new Date(iso), now=new Date();
      var hier=new Date(now); hier.setDate(now.getDate()-1);
      if(d.toDateString()===now.toDateString()) return "Aujourd'hui";
      if(d.toDateString()===hier.toDateString()) return 'Hier';
      return d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
    }catch(e){ return ''; }
  }
  function memberAvatar(cfg, auteurId, nom){
    var m = (cfg.membres||[]).find(function(x){ return x.id===auteurId || x.user_id===auteurId; });
    if(m && m.avatar) return {emoji:m.avatar};
    return {initiale:initiale(nom), bg:couleurAvatar(nom||'?')};
  }

  /* ── Chargement + rendu ── */
  async function charger(idConteneur){
    var cfg = INSTANCES[idConteneur]; if(!cfg) return;
    var feed = document.getElementById(idConteneur+'__feed'); if(!feed) return;
    var sb=cfg.sb;
    if(!cfg.groupeId){ feed.innerHTML='<div class="rnrd-empty">Groupe introuvable.</div>'; return; }
    var res = await sb.from('messages')
      .select('id,auteur_id,auteur_nom,texte,photo_url,event,statut,created_at')
      .eq('groupe_id',cfg.groupeId).eq('statut','actif')
      .order('created_at',{ascending:true}).limit(200);
    if(res.error){ feed.innerHTML='<div class="rnrd-empty">Impossible de charger les messages.</div>'; return; }
    var msgs=res.data||[];
    if(!msgs.length){
      feed.innerHTML='<div class="rnrd-empty">Rien de partagé pour l\'instant.<br>Lancez la discussion : un mot, une idée, un coup de cœur 👇</div>';
      return;
    }
    /* réactions, en une requête */
    var reacts={};
    var ids=msgs.map(function(m){return m.id;});
    var rr = await sb.from('reactions').select('cible_id,membre_id,emoji')
      .eq('cible_type','message').in('cible_id',ids);
    (rr.data||[]).forEach(function(r){
      var slot=reacts[r.cible_id]||(reacts[r.cible_id]={});
      var e=slot[r.emoji]||(slot[r.emoji]={count:0,mine:false});
      e.count++; if(r.membre_id && r.membre_id===cfg.userId) e.mine=true;
    });
    cfg._reacts=reacts;

    /* rendu : séparateurs de date + groupage par auteur consécutif */
    var html='', dernierJour=null, dernierAuteur=null, dernierTs=0;
    var FENETRE=5*60*1000; // 5 min : au-delà, on refait un en-tête même si même auteur
    msgs.forEach(function(m){
      // message système (event non vide) → bulle neutre centrée
      if(m.event){
        html+='<div class="rnrd-sys">'+esc(m.texte||m.event)+'</div>';
        dernierAuteur=null; return;
      }
      var jour=new Date(m.created_at).toDateString();
      if(jour!==dernierJour){
        html+='<div class="rnrd-date">'+esc(libelleJour(m.created_at))+'</div>';
        dernierJour=jour; dernierAuteur=null;
      }
      var ts=new Date(m.created_at).getTime();
      var nom=m.auteur_nom||'Voyageur';
      var continuite = (m.auteur_id===dernierAuteur) && (ts-dernierTs<FENETRE);
      var av=memberAvatar(cfg, m.auteur_id, nom);
      var avHtml;
      if(continuite){ avHtml='<div class="rnrd-av vide"></div>'; }
      else if(av.emoji){ avHtml='<div class="rnrd-av" style="background:var(--gold-a20)">'+esc(av.emoji)+'</div>'; }
      else { avHtml='<div class="rnrd-av" style="background:'+av.bg+'">'+esc(av.initiale)+'</div>'; }

      html+='<div class="rnrd-grp'+(continuite?' cont':'')+'">'+avHtml+'<div class="rnrd-col">';
      if(!continuite){
        html+='<div class="rnrd-meta"><span class="rnrd-nom">'+esc(nom)+'</span>'
            + '<span class="rnrd-h">'+heure(m.created_at)+'</span></div>';
      }
      html+='<div class="rnrd-bulle">'+esc(m.texte)+'</div>';
      if(m.photo_url) html+='<div class="rnrd-photo">📷 photo partagée</div>';
      html+=rendReactions(idConteneur, m.id);
      html+='</div></div>';
      dernierAuteur=m.auteur_id; dernierTs=ts;
    });
    feed.innerHTML=html;
    feed.scrollTop=feed.scrollHeight; // auto-scroll en bas (pratique pro)
  }

  var EMOJIS=['👍','❤️','😂'];
  function rendReactions(idConteneur, msgId){
    var cfg=INSTANCES[idConteneur]; var slot=(cfg._reacts||{})[msgId]||{};
    var btns=EMOJIS.map(function(e){
      var d=slot[e]||{count:0,mine:false};
      return '<button class="rnrd-rb'+(d.mine?' mine':'')+'" data-react="'+e+'" data-msg="'+msgId+'">'
        +'<span>'+e+'</span>'+(d.count>0?'<span class="rc">'+d.count+'</span>':'')+'</button>';
    }).join('');
    return '<div class="rnrd-react">'+btns
      +'<button class="rnrd-flag" data-flag="'+msgId+'" title="Signaler">⚐</button></div>';
  }

  async function toggleReaction(idConteneur, msgId, emoji){
    var cfg=INSTANCES[idConteneur]; if(!cfg||!cfg.userId) return;
    var slot=(cfg._reacts||{})[msgId]||{}; var mine=slot[emoji]&&slot[emoji].mine;
    if(mine){
      await cfg.sb.from('reactions').delete().eq('cible_type','message')
        .eq('cible_id',msgId).eq('membre_id',cfg.userId).eq('emoji',emoji);
    }else{
      await cfg.sb.from('reactions').insert({cible_type:'message',cible_id:msgId,membre_id:cfg.userId,emoji:emoji});
    }
    await charger(idConteneur);
  }

  async function signaler(idConteneur, msgId){
    var cfg=INSTANCES[idConteneur]; if(!cfg) return;
    if(!confirm('Signaler ce message aux administrateurs ?')) return;
    await cfg.sb.from('messages').update({statut:'signale'}).eq('id',msgId);
    await charger(idConteneur);
  }

  async function envoyer(idConteneur){
    var cfg=INSTANCES[idConteneur]; if(!cfg) return;
    var input=document.getElementById(idConteneur+'__input');
    var btn=document.getElementById(idConteneur+'__send');
    var texte=(input.value||'').trim();
    if(!texte||!cfg.groupeId) return;
    btn.disabled=true; input.disabled=true;
    var ins = await cfg.sb.from('messages').insert({
      groupe_id:cfg.groupeId, auteur_id:cfg.userId, auteur_nom:cfg.userNom,
      texte:texte, statut:'actif'
    });
    btn.disabled=false; input.disabled=false;
    if(ins.error){ alert('Message non envoyé. Réessaie.'); return; }
    input.value=''; input.style.height='auto'; input.focus();
    await charger(idConteneur);
    if(typeof cfg.onEnvoi==='function') cfg.onEnvoi();
  }

  /* ── Montage public ── */
  function monter(idConteneur, opts){
    injecterCss();
    var host=document.getElementById(idConteneur);
    if(!host){ console.warn('RNRDiscussion: conteneur introuvable',idConteneur); return; }
    opts=opts||{};
    INSTANCES[idConteneur]=opts;
    var hauteur=opts.hauteur||'320px';
    host.innerHTML=''
      +'<div class="rnrd-wrap" style="height:'+hauteur+'">'
      + (opts.titre?'<div class="rnrd-head">💬 '+esc(opts.titre)+'</div>':'')
      +'  <div class="rnrd-feed" id="'+idConteneur+'__feed"></div>'
      +'  <div class="rnrd-composer">'
      +'    <textarea class="rnrd-input" id="'+idConteneur+'__input" rows="1" placeholder="Partager au groupe…"></textarea>'
      +'    <button class="rnrd-send" id="'+idConteneur+'__send" title="Envoyer">➤</button>'
      +'  </div>'
      +'</div>';
    var input=document.getElementById(idConteneur+'__input');
    var send=document.getElementById(idConteneur+'__send');
    var feed=document.getElementById(idConteneur+'__feed');
    // envoi
    send.addEventListener('click', function(){ envoyer(idConteneur); });
    input.addEventListener('keydown', function(e){
      if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); envoyer(idConteneur); }
    });
    // textarea auto-grow
    input.addEventListener('input', function(){ input.style.height='auto'; input.style.height=Math.min(input.scrollHeight,90)+'px'; });
    // délégation réactions + signalement
    feed.addEventListener('click', function(e){
      var rb=e.target.closest('[data-react]');
      if(rb){ toggleReaction(idConteneur, rb.getAttribute('data-msg'), rb.getAttribute('data-react')); return; }
      var fl=e.target.closest('[data-flag]');
      if(fl){ signaler(idConteneur, fl.getAttribute('data-flag')); return; }
    });
    charger(idConteneur);
  }

  function recharger(idConteneur){ charger(idConteneur); }
  function demonter(idConteneur){ delete INSTANCES[idConteneur]; var h=document.getElementById(idConteneur); if(h) h.innerHTML=''; }

  window.RNRDiscussion = { monter: monter, recharger: recharger, demonter: demonter };
})();
