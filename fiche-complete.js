// ═══════════════════════════════════════════════════════════════════════════
// FICHE COMPLÈTE — rendu partagé Carnet + Horizon (un seul endroit, B22-like).
// Sujet (05/07, retour Bruno) : Horizon doit pouvoir montrer la même fiche
// riche que le Carnet ("elle est super belle") sans jamais la reconstruire à
// côté. Ce module rend UNIQUEMENT le contenu (photo, description, mot de la
// famille, conseil, infos pratiques, tags) — les actions utilitaires restent
// injectées par l'appelant, pour ne jamais dupliquer le moteur de vote
// (B20 : ❤️→candidate reste dans hzToggleVote/toggleVote, jamais ailleurs).
//
// Sujet (09/07, retour Bruno, test à deux) : le vote (Garder/Écarter) ne vit
// plus DANS ce gabarit. Enterré tout en bas d'une fiche avec photo+description
// +bloc pratique, il fallait scroller pour le voir — la testeuse pensait que
// la fiche s'arrêtait à la description. Le vote vit maintenant dans un bandeau
// fixe hors du scroll (hz-gf-vote-footer / gf-vote-footer), posé par CHAQUE
// page hôte à côté de son conteneur (jamais ici, pour ne pas forker ce
// gabarit en une "fiche à voter" différente d'une "fiche à lire").
//
// Usage : RNR_FICHE_COMPLETE.html(lieu, {
//   noteG, noteF, dogBadge,     // badges déjà formatés — utiliser badgeNoteGoogle/
//                               // badgeNoteFamille ci-dessous pour rester lisibles
//   extraActionsHtml,           // ex: bouton crayon (Carnet uniquement)
//   closeButtonHtml,            // bouton fermer, propre à chaque page
// })
// La galerie photo (couverture + vignettes) ouvre TOUJOURS le lightbox partagé
// (lightbox.js) — plus besoin de le préciser à l'appel.
(function(){
  function esc(s){ return (s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function photosDe(l){
    return [...new Set([l.photo_url,...(l.photos_urls||[])].filter(Boolean))];
  }
  // Sujet (05/07, retour Bruno) : texte vert sur fond vert, illisible. Un seul
  // badge défini ici — le corriger une fois le corrige partout.
  function badgeNoteGoogle(note, totalAvis){
    if(!note) return '';
    return '<span style="background:#1f4d16;color:#eafbe0;font-size:11px;font-weight:700;padding:3px 9px;border-radius:5px;">★ '+note+' Google'+(totalAvis?' ('+totalAvis+' avis)':'')+'</span>';
  }
  function badgeNoteFamille(n){
    const note=Number(n)||0; if(!note) return '';
    return '<span style="background:var(--gold-a20);color:var(--gold-light,var(--gold-deep));font-size:11px;font-weight:700;padding:3px 9px;border-radius:5px;">Famille '+'★'.repeat(note)+'</span>';
  }
  function ouvrirLightbox(photosJson, idx){
    if(window.RNR_LIGHTBOX) RNR_LIGHTBOX.open(JSON.parse(photosJson), idx);
  }
  function html(l, opts){
    opts = opts || {};
    const photos = photosDe(l);
    const photosAttr = esc(JSON.stringify(photos)).replace(/"/g,'&quot;');
    const cover = photos[0] ? `url('${photos[0]}')` : 'linear-gradient(135deg,#3a2f1a,#1a1510)';
    const mapsUrl = l.nom
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.nom + (l.sous_region||l.region ? ', '+(l.sous_region||l.region) : ''))}`
      : (l.lat&&l.lng ? `https://www.google.com/maps?q=${l.lat},${l.lng}` : 'https://maps.google.com/');

    const galerie = photos.length>1 ? `<div style="display:flex;gap:6px;padding:10px 22px 0;flex-wrap:wrap;">${
      photos.slice(1,5).map((u,i)=>`<div style="width:54px;height:40px;background-image:url('${u}');background-size:cover;background-position:center;border-radius:6px;cursor:pointer;" onclick="RNR_FICHE_COMPLETE._openLb('${photosAttr}',${i+1})"></div>`).join('')
    }</div>` : '';

    let pratique = '';
    if(l.horaires_text){
      const statut = l.ouvert_maintenant===true?'<span style="color:var(--st-ok-vif);">● Ouvert</span>':l.ouvert_maintenant===false?'<span style="color:var(--st-bad-vif);">● Fermé</span>':'';
      pratique += `<div class="gf-cell"><div class="gf-cell-t">🕒 HORAIRES</div><div class="gf-cell-v">${esc(l.horaires_text).split('|').join('<br>')}${statut?'<br>'+statut:''}</div></div>`;
    }
    if(l.accessibilite || l.wheelchair) pratique += `<div class="gf-cell"><div class="gf-cell-t">♿ ACCESSIBILITÉ</div><div class="gf-cell-v">${esc(l.accessibilite||'Accès PMR')}<br><span style="opacity:.4;font-size:10px;">(à confirmer sur place)</span></div></div>`;
    if(l.tel) pratique += `<div class="gf-cell"><div class="gf-cell-t">📞 CONTACT</div><div class="gf-cell-v"><a href="tel:${esc(l.tel)}" style="color:var(--ink);">${esc(l.tel)}</a></div></div>`;
    if(l.adresse||l.sous_region) pratique += `<div class="gf-cell"><div class="gf-cell-t">📍 ADRESSE</div><div class="gf-cell-v">${esc(l.adresse||l.sous_region)}</div></div>`;

    // (16/07) : l.tags contient des CLÉS internes stables (ex. "teardrop" =
    // Camping-car), jamais des libellés — tags.js (window.RNR_TAGS) est LE
    // seul endroit qui sait les traduire en français. Repli sur la clé brute
    // si le module n'est pas chargé (jamais planter l'affichage pour ça).
    const libelleDeTag = t => (window.RNR_TAGS && RNR_TAGS.libelleTag(t)) || t;
    const tags = (l.tags&&l.tags.length) ? l.tags.map(t=>`<span style="background:var(--gold-a10);color:var(--gold-deep);font-size:10px;padding:3px 9px;border-radius:10px;border:1px solid var(--gold-a20);">${esc(libelleDeTag(t))}</span>`).join('') : '';

    // Retour Bruno (07/07) : depuis le Carnet, repérer où se trouve une fiche sur
    // la carte Horizon (au milieu des autres) — un seul bouton, ici, partagé par
    // tous les appelants (jamais dupliqué page par page). Inutile sur Horizon
    // lui-même (on y est déjà) — masqué sur cette seule page via le chemin d'URL.
    const surHorizon = /horizon\.html/i.test(window.location.pathname);
    const horizonUrl = (!surHorizon && l.id) ? `horizon.html?fiche=${encodeURIComponent(l.id)}` : null;

    // Sujet (05/07, retour Bruno) : Maps/Site/crayon groupés à droite (utilitaire),
    // vote/retenue à gauche (social) — plus la longue barre dorée pleine largeur.
    return `
      <div class="gf-cover" style="background-image:${cover};${photos.length>1?'cursor:pointer;':''}" ${photos.length>1?`onclick="if(!event.target.closest('.gf-close'))RNR_FICHE_COMPLETE._openLb('${photosAttr}',0)"`:''}>
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
        <div class="gf-bottom-row">
          <div class="gf-bottom-actions">
            <a href="${mapsUrl}" target="_blank" class="gf-btn-dark">📍 Maps</a>
            ${horizonUrl?`<a href="${horizonUrl}" class="gf-btn-dark">🧭 Horizon</a>`:''}
            ${l.site_web?`<a href="${l.site_web}" target="_blank" class="gf-btn-dark">🌐 Site</a>`:''}
            ${opts.extraActionsHtml||''}
          </div>
        </div>
      </div>
    `;
  }
  window.RNR_FICHE_COMPLETE = { html, photosDe, badgeNoteGoogle, badgeNoteFamille, _openLb:ouvrirLightbox };
})();
