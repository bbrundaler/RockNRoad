// ═══════════════════════════════════════════════════════════════════════════
// FICHE ÉDITION — modale partagée Carnet + Horizon (un seul endroit, 07/07).
// Sujet (retour Bruno, 07/07) : le stylo d'édition manquait sur Horizon. Plutôt
// que dupliquer tout le module (mini-carte GPS, envies, chien, étoiles, photos)
// une seconde fois dans horizon.html, il est extrait ICI — même motif que
// lightbox.js : construit son propre DOM + CSS au premier usage, aucune balise
// à poser dans la page hôte, juste charger ce script (après tokens.css et
// Leaflet). Dépend de : `sb` (client Supabase, déjà global sur les deux pages),
// `L` (Leaflet), et `RNR_THEMES` (themes-horizon.js, chargé sur les deux
// pages) pour 🔮 Suggérer. Optionnel : window.showToast (sinon repli sur alert).
//
// Usage : RNR_FICHE_EDIT.open(lieu /* objet complet, pas juste un id */, {
//   onSaved(lieuMisAJour),   // appelé après écriture DB réussie
//   onDeleted(lieuId),      // appelé après suppression réussie
// })
(function(){
  let built=false;
  let editingLieu=null, editingOpts={};
  let emMiniMap=null, emMiniMarker=null;
  let emDogVal='inconnu', emDogSource='google', emStarVal=0, emEnviesVal=[];

  function toast(msg,type){
    if(window.showToast) window.showToast(msg,type);
    else if(type==='error') alert(msg);
  }
  function dogEtatDe(l){
    if(l.dog_etat) return l.dog_etat;
    if(l.dog_friendly===true) return 'oui';
    if(l.dog_friendly===false) return 'non';
    return 'inconnu';
  }

  function injectStyle(){
    if(document.getElementById('rnr-fe-style')) return;
    const css=`
#rnr-fe-overlay{position:fixed;inset:0;background:rgba(15,13,9,.88);z-index:6000;display:none;align-items:flex-start;justify-content:center;padding:30px 16px;overflow-y:auto;}
#rnr-fe-overlay.open{display:flex;}
#rnr-fe-modal{background:var(--paper);border-radius:16px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;font-family:'Inter',sans-serif;color:var(--ink);}
.rnr-fe-header{padding:20px 24px 16px;border-bottom:1px solid var(--surface-line);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--paper);z-index:1;}
.rnr-fe-title{font-family:'Playfair Display',serif;font-size:18px;color:var(--ink);}
.rnr-fe-close{background:none;border:none;font-size:20px;cursor:pointer;color:var(--ink-dim);padding:4px;}
.rnr-fe-close:hover{color:var(--ink);}
.rnr-fe-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.rnr-fe-body{padding:18px 24px;}
.rnr-fe-fg{display:flex;flex-direction:column;gap:5px;}
.rnr-fe-fg.full{grid-column:1/-1;}
.rnr-fe-label{font-size:9.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink-dim);}
.rnr-fe-input,.rnr-fe-select,.rnr-fe-textarea{width:100%;padding:9px 11px;border:1.5px solid var(--surface-line);border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;color:var(--ink);background:var(--paper);box-sizing:border-box;}
.rnr-fe-input:focus,.rnr-fe-select:focus,.rnr-fe-textarea:focus{border-color:var(--gold);outline:none;}
.rnr-fe-textarea{resize:vertical;min-height:70px;font-size:12px;}
#rnr-fe-mini-map{height:160px;border-radius:10px;margin-bottom:8px;}
.rnr-fe-stars{display:flex;gap:4px;margin-top:2px;}
.rnr-fe-star{font-size:20px;cursor:pointer;color:#ddd;transition:color .15s;}
.rnr-fe-star.on{color:var(--gold);}
.rnr-fe-dog-row{display:flex;gap:6px;margin-top:2px;}
.rnr-fe-dog-btn{flex:1;padding:7px;border-radius:7px;border:1.5px solid var(--surface-line);background:var(--paper);cursor:pointer;font-size:11.5px;font-weight:600;color:var(--ink-dim);}
.rnr-fe-dog-btn.active-oui{background:var(--st-ok-bg);border-color:var(--st-ok-ink);color:var(--st-ok-ink);}
.rnr-fe-dog-btn.active-conditions{background:var(--st-warn-bg);border-color:var(--st-warn-line);color:var(--st-warn-ink);}
.rnr-fe-dog-btn.active-non{background:var(--st-bad-bg);border-color:var(--st-bad-ink);color:var(--st-bad-ink);}
.rnr-fe-dog-btn.active-inconnu{background:var(--st-na-bg);border-color:var(--gold);color:var(--st-na-ink);}
.rnr-fe-envie-grid{display:flex;flex-wrap:wrap;gap:6px;}
.rnr-fe-envie-chip{padding:6px 12px;border-radius:20px;border:1.5px solid var(--surface-line);background:var(--paper);font-size:11.5px;cursor:pointer;transition:all .15s;color:var(--ink-dim);}
.rnr-fe-envie-chip.on{background:var(--gold-a20);border-color:var(--gold);color:var(--ink);font-weight:700;}
.rnr-fe-check{background:var(--st-na-bg);border:1px solid var(--gold-a35);color:var(--st-na-ink);font-size:9.5px;font-weight:700;padding:4px 9px;border-radius:6px;cursor:pointer;font-family:'Inter',sans-serif;}
.rnr-fe-check:hover{background:var(--gold-a20);}
.rnr-fe-footer{padding:16px 24px;border-top:1px solid var(--surface-line);display:flex;gap:10px;justify-content:flex-end;position:sticky;bottom:0;background:var(--paper);}
.rnr-fe-btn-save{padding:10px 24px;background:var(--ink);color:var(--gold);border:none;border-radius:8px;font-weight:700;cursor:pointer;}
.rnr-fe-btn-save:hover{background:var(--gold);color:var(--ink);}
.rnr-fe-btn-save:disabled{opacity:.5;cursor:not-allowed;}
.rnr-fe-btn-del{padding:10px 16px;background:rgba(200,50,0,.08);color:var(--st-bad-ink);border:1px solid rgba(200,50,0,.2);border-radius:8px;font-weight:700;cursor:pointer;}
.rnr-fe-btn-del:hover{background:rgba(200,50,0,.15);}
`;
    const s=document.createElement('style'); s.id='rnr-fe-style'; s.textContent=css;
    document.head.appendChild(s);
  }

  function ensureDom(){
    if(built) return;
    injectStyle();
    const wrap=document.createElement('div');
    wrap.id='rnr-fe-overlay';
    wrap.setAttribute('onclick','if(event.target===this)RNR_FICHE_EDIT.close()');
    wrap.innerHTML=`
      <div id="rnr-fe-modal">
        <div class="rnr-fe-header">
          <span class="rnr-fe-title">✏️ Modifier la fiche</span>
          <button class="rnr-fe-close" onclick="RNR_FICHE_EDIT.close()">✕</button>
        </div>
        <div class="rnr-fe-body">
          <div class="rnr-fe-grid">
            <div class="rnr-fe-fg full">
              <label class="rnr-fe-label">Nom du lieu *</label>
              <input class="rnr-fe-input" id="rnr-fe-nom" type="text" placeholder="Nom du lieu">
            </div>
            <div class="rnr-fe-fg">
              <label class="rnr-fe-label">Type</label>
              <select class="rnr-fe-select" id="rnr-fe-type">
                <option value="Site">Site / Visite</option>
                <option value="Camping">Camping</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Randonnee">Randonnée</option>
                <option value="Plage">Plage</option>
                <option value="Musee">Musée</option>
                <option value="Culture">Culture</option>
                <option value="Chateau">Château</option>
                <option value="Cave">Cave / Dégustation</option>
                <option value="Halte">Halte</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div class="rnr-fe-fg">
              <label class="rnr-fe-label">Sous-région</label>
              <input class="rnr-fe-input" id="rnr-fe-sous-region" type="text" placeholder="ex: Haut-Rhin">
            </div>
            <div class="rnr-fe-fg full">
              <label class="rnr-fe-label">Position GPS · glisser le repère pour corriger</label>
              <div id="rnr-fe-mini-map"></div>
              <div style="display:flex;gap:8px;">
                <input class="rnr-fe-input" id="rnr-fe-lat" type="number" step="0.000001" placeholder="Latitude">
                <input class="rnr-fe-input" id="rnr-fe-lng" type="number" step="0.000001" placeholder="Longitude">
              </div>
            </div>
            <div class="rnr-fe-fg full">
              <label class="rnr-fe-label">Envie <button type="button" class="rnr-fe-check" onclick="RNR_FICHE_EDIT._suggereEnvies()">🔮 Suggérer</button></label>
              <div class="rnr-fe-envie-grid" id="rnr-fe-envies-grid">
                <span class="rnr-fe-envie-chip" data-envie="culture" onclick="RNR_FICHE_EDIT._toggleEnvie(this)">🏛️ Culture</span>
                <span class="rnr-fe-envie-chip" data-envie="nature" onclick="RNR_FICHE_EDIT._toggleEnvie(this)">🌿 Nature</span>
                <span class="rnr-fe-envie-chip" data-envie="mer" onclick="RNR_FICHE_EDIT._toggleEnvie(this)">🌊 Mer</span>
                <span class="rnr-fe-envie-chip" data-envie="montagne" onclick="RNR_FICHE_EDIT._toggleEnvie(this)">⛰️ Montagne</span>
                <span class="rnr-fe-envie-chip" data-envie="sport" onclick="RNR_FICHE_EDIT._toggleEnvie(this)">🥾 Sport</span>
                <span class="rnr-fe-envie-chip" data-envie="loisirs" onclick="RNR_FICHE_EDIT._toggleEnvie(this)">🎡 Loisirs</span>
                <span class="rnr-fe-envie-chip" data-envie="terroir" onclick="RNR_FICHE_EDIT._toggleEnvie(this)">🧺 Terroir</span>
              </div>
            </div>
            <div class="rnr-fe-fg full">
              <label class="rnr-fe-label">Description</label>
              <textarea class="rnr-fe-textarea" id="rnr-fe-description" placeholder="Description du lieu…"></textarea>
            </div>
            <div class="rnr-fe-fg full">
              <label class="rnr-fe-label">Commentaire personnel</label>
              <textarea class="rnr-fe-textarea" id="rnr-fe-commentaire" placeholder="Vos notes personnelles…"></textarea>
            </div>
            <div class="rnr-fe-fg full">
              <label class="rnr-fe-label">Conseil</label>
              <input class="rnr-fe-input" id="rnr-fe-conseil" type="text" placeholder="Astuce ou conseil…">
            </div>
            <div class="rnr-fe-fg">
              <label class="rnr-fe-label">Note famille</label>
              <div class="rnr-fe-stars" id="rnr-fe-stars">
                <span class="rnr-fe-star" data-v="1">★</span>
                <span class="rnr-fe-star" data-v="2">★</span>
                <span class="rnr-fe-star" data-v="3">★</span>
                <span class="rnr-fe-star" data-v="4">★</span>
                <span class="rnr-fe-star" data-v="5">★</span>
              </div>
            </div>
            <div class="rnr-fe-fg">
              <label class="rnr-fe-label">Téléphone</label>
              <input class="rnr-fe-input" id="rnr-fe-tel" type="text" placeholder="Numéro de téléphone">
            </div>
            <div class="rnr-fe-fg full">
              <label class="rnr-fe-label">Dog Friendly</label>
              <div class="rnr-fe-dog-row">
                <button class="rnr-fe-dog-btn" id="rnr-fe-dog-oui" onclick="RNR_FICHE_EDIT._setDog('oui')">🐕 Oui</button>
                <button class="rnr-fe-dog-btn" id="rnr-fe-dog-conditions" onclick="RNR_FICHE_EDIT._setDog('conditions')">🟠 Conditions</button>
                <button class="rnr-fe-dog-btn" id="rnr-fe-dog-non" onclick="RNR_FICHE_EDIT._setDog('non')">🚫 Non</button>
                <button class="rnr-fe-dog-btn" id="rnr-fe-dog-inconnu" onclick="RNR_FICHE_EDIT._setDog('inconnu')">❓ À vérifier</button>
              </div>
            </div>
            <div class="rnr-fe-fg full">
              <label class="rnr-fe-label">Info chien</label>
              <input class="rnr-fe-input" id="rnr-fe-dog-info" type="text" placeholder="Détails sur les conditions…">
              <div style="margin-top:8px;display:flex;gap:7px;flex-wrap:wrap;align-items:center;">
                <span style="font-size:9.5px;color:var(--ink-dim);font-weight:600;">🔎 Vérifier :</span>
                <button type="button" class="rnr-fe-check" onclick="RNR_FICHE_EDIT._dogSearch('web')">🔍 Recherche web</button>
                <button type="button" class="rnr-fe-check" onclick="RNR_FICHE_EDIT._dogSearch('bringfido')">🐕 BringFido</button>
              </div>
            </div>
          </div>
        </div>
        <div class="rnr-fe-body" style="padding-top:0;border-top:1px solid var(--surface-line);margin-top:4px;">
          <div class="rnr-fe-fg full" style="margin-top:14px;">
            <label class="rnr-fe-label">Photos (URLs séparées par une virgule)</label>
            <textarea class="rnr-fe-textarea" id="rnr-fe-photos" placeholder="https://... , https://..." style="min-height:56px;font-size:11px;font-family:monospace;"></textarea>
            <div style="font-size:10px;color:var(--ink-dim);margin-top:3px;">Photo principale en premier · max 5 photos</div>
            <div id="rnr-fe-photos-preview" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;"></div>
          </div>
        </div>
        <div class="rnr-fe-footer">
          <button class="rnr-fe-btn-del" onclick="RNR_FICHE_EDIT._delete()">🗑 Supprimer</button>
          <button class="rnr-fe-btn-save" id="rnr-fe-save-btn" onclick="RNR_FICHE_EDIT._save()">💾 Enregistrer</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    document.querySelectorAll('#rnr-fe-stars .rnr-fe-star').forEach(s=>{
      s.addEventListener('click', ()=>{ emStarVal=parseInt(s.dataset.v); updateStars(); });
    });
    document.getElementById('rnr-fe-lat').addEventListener('input', syncMarkerDepuisChamps);
    document.getElementById('rnr-fe-lng').addEventListener('input', syncMarkerDepuisChamps);
    built=true;
  }

  function initMiniMap(lat,lng){
    const pos=[lat||46.6, lng||2.4];
    if(!emMiniMap){
      emMiniMap=L.map('rnr-fe-mini-map',{zoomControl:false}).setView(pos, lat&&lng?12:5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:18}).addTo(emMiniMap);
      emMiniMarker=L.marker(pos,{draggable:true}).addTo(emMiniMap);
      emMiniMarker.on('dragend', ()=>{
        const ll=emMiniMarker.getLatLng();
        document.getElementById('rnr-fe-lat').value=ll.lat.toFixed(6);
        document.getElementById('rnr-fe-lng').value=ll.lng.toFixed(6);
      });
    } else {
      emMiniMap.setView(pos, lat&&lng?12:5);
      emMiniMarker.setLatLng(pos);
      setTimeout(()=>emMiniMap.invalidateSize(), 50);
    }
  }
  function syncMarkerDepuisChamps(){
    const lat=parseFloat(document.getElementById('rnr-fe-lat').value);
    const lng=parseFloat(document.getElementById('rnr-fe-lng').value);
    if(emMiniMarker && !isNaN(lat) && !isNaN(lng)){
      emMiniMarker.setLatLng([lat,lng]);
      emMiniMap.setView([lat,lng], Math.max(emMiniMap.getZoom(),10));
    }
  }
  function updateStars(){
    document.querySelectorAll('#rnr-fe-stars .rnr-fe-star').forEach(s=>{
      s.classList.toggle('on', parseInt(s.dataset.v)<=emStarVal);
    });
  }
  function updateDog(){
    ['oui','conditions','non','inconnu'].forEach(v=>{
      const btn=document.getElementById('rnr-fe-dog-'+v);
      if(btn) btn.className='rnr-fe-dog-btn'+(emDogVal===v?' active-'+v:'');
    });
  }
  function toggleEnvie(el){
    const envie=el.dataset.envie;
    el.classList.toggle('on');
    if(emEnviesVal.includes(envie)) emEnviesVal=emEnviesVal.filter(t=>t!==envie);
    else emEnviesVal.push(envie);
  }
  function suggereEnvies(){
    if(!window.RNR_THEMES){ toast('themes-horizon.js absent','error'); return; }
    const ficheProvisoire={
      nom: document.getElementById('rnr-fe-nom').value,
      lat: parseFloat(document.getElementById('rnr-fe-lat').value)||null,
      lng: parseFloat(document.getElementById('rnr-fe-lng').value)||null,
      tags: (editingLieu&&editingLieu.tags)||[],
      type: document.getElementById('rnr-fe-type').value,
      monde_nuit: (editingLieu&&editingLieu.monde_nuit)||false
    };
    let suggestions=[];
    try{ suggestions=RNR_THEMES.themesDeFiche(ficheProvisoire)||[]; }catch(e){ suggestions=[]; }
    suggestions.forEach(envie=>{
      if(envie==='nuit') return;
      const el=document.querySelector('#rnr-fe-envies-grid [data-envie="'+envie+'"]');
      if(el && !el.classList.contains('on')){ el.classList.add('on'); if(!emEnviesVal.includes(envie)) emEnviesVal.push(envie); }
    });
    toast(suggestions.length?'Suggestions ajoutées':'Rien trouvé automatiquement', suggestions.length?'success':'error');
  }
  function dogSearch(source){
    const nom=(document.getElementById('rnr-fe-nom').value||'').trim();
    if(!nom){ toast('Nom du lieu manquant','error'); return; }
    const lieu=encodeURIComponent(nom);
    const url=source==='bringfido'
      ? `https://www.google.com/search?q=site:bringfido.com+${lieu}`
      : `https://www.google.com/search?q=${lieu}+chien+admis+accept%C3%A9`;
    window.open(url,'_blank','noopener');
  }
  function renderPhotosPreview(){
    const prev=document.getElementById('rnr-fe-photos-preview');
    const urls=document.getElementById('rnr-fe-photos').value.split(',').map(s=>s.trim()).filter(s=>s.startsWith('http')).slice(0,5);
    prev.innerHTML='';
    urls.forEach((u,i)=>{
      const wrapper=document.createElement('div');
      wrapper.style.cssText='position:relative;cursor:pointer;';
      wrapper.dataset.url=u;
      const img=document.createElement('img');
      img.src=u;
      img.style.cssText=`width:64px;height:48px;object-fit:cover;border-radius:6px;border:2.5px solid ${i===0?'var(--gold)':'var(--surface-line)'};transition:all .2s;`;
      img.title=i===0?'Photo principale (cliquez pour changer)':'Cliquer pour définir comme principale';
      if(i===0){
        const lbl=document.createElement('div');
        lbl.textContent='✓';
        lbl.style.cssText='position:absolute;bottom:2px;right:3px;background:var(--gold);color:var(--ink);font-size:9px;font-weight:800;padding:1px 4px;border-radius:3px;';
        wrapper.appendChild(lbl);
      }
      wrapper.addEventListener('click', ()=>{
        const allUrls=document.getElementById('rnr-fe-photos').value.split(',').map(s=>s.trim()).filter(s=>s.startsWith('http'));
        const reordered=[u,...allUrls.filter(x=>x!==u)].slice(0,5);
        document.getElementById('rnr-fe-photos').value=reordered.join(', ');
        renderPhotosPreview();
      });
      wrapper.appendChild(img);
      prev.appendChild(wrapper);
    });
  }

  function open(lieu, opts){
    if(!lieu){ toast('Fiche introuvable','error'); return; }
    ensureDom();
    editingLieu=lieu; editingOpts=opts||{};

    document.getElementById('rnr-fe-nom').value=lieu.nom||'';
    document.getElementById('rnr-fe-type').value=lieu.type||'Site';
    document.getElementById('rnr-fe-sous-region').value=lieu.sous_region||'';
    document.getElementById('rnr-fe-description').value=lieu.description||'';
    document.getElementById('rnr-fe-commentaire').value=lieu.commentaire||'';
    document.getElementById('rnr-fe-conseil').value=lieu.conseil||'';
    document.getElementById('rnr-fe-tel').value=lieu.tel||'';
    document.getElementById('rnr-fe-dog-info').value=lieu.dog_info||'';
    document.getElementById('rnr-fe-lat').value=lieu.lat!=null?lieu.lat:'';
    document.getElementById('rnr-fe-lng').value=lieu.lng!=null?lieu.lng:'';

    emEnviesVal=Array.isArray(lieu.envies)?lieu.envies.slice():[];
    document.querySelectorAll('#rnr-fe-envies-grid .rnr-fe-envie-chip').forEach(chip=>{
      chip.classList.toggle('on', emEnviesVal.includes(chip.dataset.envie));
    });
    setTimeout(()=>initMiniMap(lieu.lat!=null?+lieu.lat:null, lieu.lng!=null?+lieu.lng:null), 30);

    const allPhotos=[lieu.photo_url,...(lieu.photos_urls||[])].filter(Boolean);
    const uniquePhotos=[...new Set(allPhotos)].slice(0,5);
    document.getElementById('rnr-fe-photos').value=uniquePhotos.join(', ');
    renderPhotosPreview();

    emStarVal=lieu.note_famille||0; updateStars();
    emDogVal=dogEtatDe(lieu); emDogSource=lieu.dog_source||'google'; updateDog();

    document.getElementById('rnr-fe-overlay').classList.add('open');
    document.body.style.overflow='hidden';
  }
  function close(){
    const o=document.getElementById('rnr-fe-overlay');
    if(o) o.classList.remove('open');
    document.body.style.overflow='';
    editingLieu=null;
  }
  function setDog(val){ emDogVal=val; emDogSource='membre'; updateDog(); }

  async function save(){
    if(!editingLieu) return;
    const btn=document.getElementById('rnr-fe-save-btn');
    btn.disabled=true; btn.textContent='⏳';
    try{
      const payload={
        nom: document.getElementById('rnr-fe-nom').value.trim(),
        type: document.getElementById('rnr-fe-type').value,
        sous_region: document.getElementById('rnr-fe-sous-region').value||null,
        description: document.getElementById('rnr-fe-description').value||null,
        commentaire: document.getElementById('rnr-fe-commentaire').value||null,
        conseil: document.getElementById('rnr-fe-conseil').value||null,
        tel: document.getElementById('rnr-fe-tel').value||null,
        dog_info: document.getElementById('rnr-fe-dog-info').value||null,
        lat: parseFloat(document.getElementById('rnr-fe-lat').value)||null,
        lng: parseFloat(document.getElementById('rnr-fe-lng').value)||null,
        envies: emEnviesVal.length?emEnviesVal:null,
        note_famille: emStarVal||null,
        dog_etat: emDogVal,
        dog_source: emDogSource,
        dog_friendly: emDogVal==='oui'?true:emDogVal==='non'?false:null,
        ...(()=>{
          const urls=document.getElementById('rnr-fe-photos').value.split(',').map(s=>s.trim()).filter(s=>s.startsWith('http')).slice(0,5);
          return { photo_url: urls[0]||null, photos_urls: urls.length>1?urls:null };
        })(),
      };
      const {error}=await sb.from('lieux').update(payload).eq('id', editingLieu.id);
      if(error) throw error;
      toast('✅ Fiche mise à jour !','success');
      const updated={...editingLieu, ...payload};
      const cb=editingOpts.onSaved;
      close();
      if(typeof cb==='function') cb(updated);
    }catch(e){
      toast('Erreur : '+e.message,'error');
    }finally{
      btn.disabled=false; btn.textContent='💾 Enregistrer';
    }
  }
  async function del(){
    if(!editingLieu) return;
    if(!confirm('Supprimer cette fiche définitivement ?')) return;
    try{
      const {error}=await sb.from('lieux').delete().eq('id', editingLieu.id);
      if(error) throw error;
      toast('🗑 Fiche supprimée','success');
      const id=editingLieu.id;
      const cb=editingOpts.onDeleted;
      close();
      if(typeof cb==='function') cb(id);
    }catch(e){
      toast('Erreur : '+e.message,'error');
    }
  }

  window.RNR_FICHE_EDIT={
    open, close,
    _toggleEnvie: toggleEnvie, _suggereEnvies: suggereEnvies,
    _setDog: setDog, _dogSearch: dogSearch,
    _save: save, _delete: del,
  };
})();
