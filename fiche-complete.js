// ═══════════════════════════════════════════════════════════════════════════
// FICHE COMPLÈTE — rendu partagé Carnet + Horizon (un seul endroit, B22-like).
// Sujet (05/07, retour Bruno) : Horizon doit pouvoir montrer la même fiche
// riche que le Carnet ("elle est super belle") sans jamais la reconstruire à
// côté. Ce module rend UNIQUEMENT le contenu (photo, description, mot de la
// famille, conseil, infos pratiques, tags) — le vote et les actions restent
// injectés par l'appelant, pour ne jamais dupliquer le moteur de vote
// (B20 : ❤️→candidate reste dans hzToggleVote/toggleVote, jamais ailleurs).
//
// Usage : RNR_FICHE_COMPLETE.html(lieu, {
//   noteG, noteF, dogBadge,       // badges déjà formatés par l'appelant (HTML)
//   voteBarHtml,                  // barre de vote/actions de LA page appelante
//   extraActionsHtml,             // ex: bouton crayon (Carnet uniquement)
//   closeButtonHtml,              // bouton fermer, propre à chaque page
//   onPhotoClick(index)           // nom de fonction globale pour la galerie/lightbox
// })
(function(){
  function esc(s){ return (s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function photosDe(l){
    return [...new Set([l.photo_url,...(l.photos_urls||[])].filter(Boolean))];
  }
  function html(l, opts){
    opts = opts || {};
    const photos = photosDe(l);
    const cover = photos[0] ? `url('${photos[0]}')` : 'linear-gradient(135deg,#3a2f1a,#1a1510)';
    const mapsUrl = l.nom
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.nom + (l.sous_region||l.region ? ', '+(l.sous_region||l.region) : ''))}`
      : (l.lat&&l.lng ? `https://www.google.com/maps?q=${l.lat},${l.lng}` : 'https://maps.google.com/');
    const photoFn = opts.onPhotoClick || 'RNR_FICHE_COMPLETE.noop';

    const galerie = photos.length>1 ? `<div style="display:flex;gap:6px;padding:10px 22px 0;flex-wrap:wrap;">${
      photos.slice(1,5).map((u,i)=>`<div style="width:54px;height:40px;background-image:url('${u}');background-size:cover;background-position:center;border-radius:6px;cursor:pointer;" onclick="${photoFn}(${i+1})"></div>`).join('')
    }</div>` : '';

    let pratique = '';
    if(l.horaires_text){
      const statut = l.ouvert_maintenant===true?'<span style="color:var(--st-ok-vif);">● Ouvert</span>':l.ouvert_maintenant===false?'<span style="color:var(--st-bad-vif);">● Fermé</span>':'';
      pratique += `<div class="gf-cell"><div class="gf-cell-t">🕒 HORAIRES</div><div class="gf-cell-v">${esc(l.horaires_text).split('|').join('<br>')}${statut?'<br>'+statut:''}</div></div>`;
    }
    if(l.accessibilite || l.wheelchair) pratique += `<div class="gf-cell"><div class="gf-cell-t">♿ ACCESSIBILITÉ</div><div class="gf-cell-v">${esc(l.accessibilite||'Accès PMR')}<br><span style="opacity:.4;font-size:10px;">(à confirmer sur place)</span></div></div>`;
    if(l.tel) pratique += `<div class="gf-cell"><div class="gf-cell-t">📞 CONTACT</div><div class="gf-cell-v"><a href="tel:${esc(l.tel)}" style="color:var(--ink);">${esc(l.tel)}</a></div></div>`;
    if(l.adresse||l.sous_region) pratique += `<div class="gf-cell"><div class="gf-cell-t">📍 ADRESSE</div><div class="gf-cell-v">${esc(l.adresse||l.sous_region)}</div></div>`;

    const tags = (l.tags&&l.tags.length) ? l.tags.map(t=>`<span style="background:var(--gold-a10);color:var(--gold-deep);font-size:10px;padding:3px 9px;border-radius:10px;border:1px solid var(--gold-a20);">${esc(t)}</span>`).join('') : '';

    return `
      <div class="gf-cover" style="background-image:${cover};">
        ${opts.closeButtonHtml||''}
        ${photos.length>1?`<div class="gf-photo-count">📷 ${photos.length} photos</div>`:''}
        <div class="gf-cover-overlay"><span class="gf-type-badge">${esc(l.type||'Lieu')}${l.sous_region||l.region?' · '+esc(l.sous_region||l.region):''}</span></div>
      </div>
      ${galerie}
      <div class="gf-content">
        <div class="gf-badges">${opts.noteG||''}${opts.noteF||''}${opts.dogBadge||''}</div>
        <h2 class="gf-title">${esc(l.nom||'—')}</h2>
        ${l.adresse||l.sous_region?`<p class="gf-sub">${esc(l.adresse||l.sous_region)}</p>`:''}
        ${l.description?`<p class="gf-desc">${esc(l.description)}</p>`:''}
        ${l.commentaire?`<div class="gf-quote"><div class="gf-quote-t">💬 LE MOT DE LA FAMILLE</div><p>${esc(l.commentaire)}</p></div>`:''}
        ${l.dog_info?`<div class="dog-info-box" style="margin-bottom:14px;">🐾 ${esc(l.dog_info)}</div>`:''}
        ${l.conseil?`<div class="gf-conseil"><div class="gf-conseil-t">💡 Conseil</div><p>${esc(l.conseil)}</p></div>`:''}
        ${pratique?`<div class="gf-grid">${pratique}</div>`:''}
        ${tags?`<div class="gf-tags">${tags}</div>`:''}
        ${opts.voteBarHtml?`<div class="gf-votebar">${opts.voteBarHtml}</div>`:''}
        <div class="gf-actions">
          <a href="${mapsUrl}" target="_blank" class="gf-btn-gold">📍 Voir sur Maps</a>
          ${opts.extraActionsHtml||''}
        </div>
      </div>
    `;
  }
  window.RNR_FICHE_COMPLETE = { html, photosDe, noop:function(){} };
})();
