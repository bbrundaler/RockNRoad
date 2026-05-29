/* =============================================
   RockNRoad — sidebar.js
   Source unique : HTML + navigation + état actif
   Ajouter un lien ? Modifie UNIQUEMENT ce fichier.
   ============================================= */

document.addEventListener('DOMContentLoaded', function() {
(function() {
  const page = window.location.pathname.split('/').pop() || 'home.html';
  const hash = window.location.hash.replace('#', '');

  const NAV = [
    {
      group: 'Destinations',
      items: [
        { href: 'carnet.html#alsace',    icon: iconHouse(),   label: 'France',  active: page === 'carnet.html' && ['alsace','pyrenees','atlantique','bourgogne','overview','','carte','fiche'].includes(hash) },
        { href: 'carnet.html#allemagne', icon: iconGlobe(),   label: 'Europe',  active: page === 'carnet.html' && ['allemagne','suisse','autriche','italie','espagne','portugal','belgique','luxembourg','pays-bas','croatie'].includes(hash) },
        { href: 'carnet.html#nepal',     icon: iconPhone(),   label: 'Monde',   active: page === 'carnet.html' && ['nepal','vietnam','egypte','afriquesud','srilanka','mexique'].includes(hash) },
      ]
    },
    {
      group: 'Outils',
      items: [
        { href: 'carnet.html#carte',  icon: iconMap(),      label: 'Carte',   active: page === 'carnet.html' && hash === 'carte' },
        { href: 'voyage.html',        icon: iconCompass(),  label: 'Voyage',  active: page === 'voyage.html' },
        { href: 'carnet.html#fiche',  icon: iconFile(),     label: 'Récap',   active: page === 'carnet.html' && hash === 'fiche' },
      ]
    },
    {
      group: 'Compte',
      items: [
        { href: 'admin.html',         icon: iconPlus(),     label: 'Créer',   active: page === 'admin.html' },
        { href: 'onboarding.html',    icon: iconUser(),     label: 'Profil',  active: page === 'onboarding.html' },
        { href: 'config.html',        icon: iconSettings(), label: 'Config',  active: page === 'config.html' },
      ]
    }
  ];

  function buildNav() {
    return NAV.map(group => {
      const items = group.items.map(item => `
        <a class="sb-item${item.active ? ' active' : ''}" href="${item.href}">
          ${item.icon}
          <span class="sb-item-label">${item.label}</span>
        </a>`).join('');
      return items + '<div class="sb-sep-icon"></div>';
    }).join('').replace(/<div class="sb-sep-icon"><\/div>$/, ''); // pas de séparateur final
  }

  const compassSVG = `
    <svg class="sb-compass" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" stroke="rgba(200,168,75,.3)" stroke-width="1.5"/>
      <circle cx="40" cy="40" r="30" stroke="rgba(200,168,75,.15)" stroke-width="1"/>
      <text x="40" y="12" text-anchor="middle" fill="rgba(200,168,75,.7)" font-size="8" font-family="serif" font-weight="bold">N</text>
      <text x="40" y="72" text-anchor="middle" fill="rgba(200,168,75,.4)" font-size="7" font-family="serif">S</text>
      <text x="72" y="43" text-anchor="middle" fill="rgba(200,168,75,.4)" font-size="7" font-family="serif">E</text>
      <text x="8"  y="43" text-anchor="middle" fill="rgba(200,168,75,.4)" font-size="7" font-family="serif">O</text>
      <polygon points="40,14 43,40 40,46 37,40" fill="rgba(200,168,75,.8)"/>
      <polygon points="40,66 43,40 40,34 37,40" fill="rgba(200,168,75,.3)"/>
      <circle cx="40" cy="40" r="4" fill="rgba(200,168,75,.6)" stroke="rgba(200,168,75,.9)" stroke-width="1"/>
    </svg>`;

  const sidebarHTML = `
    <div class="sb-logo" onclick="window.location.href='home.html'" style="cursor:pointer;">
      <div class="sb-logo-title">Rock<span>N</span>Road</div>
      <div class="sb-logo-sub">Aventures</div>
    </div>
    <nav class="sb-nav">${buildNav()}</nav>
    <div class="sb-footer">
      <div class="sb-user" id="sb-user-block" style="display:none;">
        <div class="sb-avatar" id="sb-avatar"></div>
        <div style="flex:1;min-width:0;">
          <div class="sb-user-name" id="sb-username"></div>
          <div class="sb-user-role" id="sb-groupe-nom">Mon groupe</div>
        </div>
        <button class="sb-logout" onclick="if(window.logout)logout();">↩</button>
      </div>
      <p class="sb-quote">Explorer.<br>Partager.<br>Se souvenir.</p>
      ${compassSVG}
    </div>`;

  // Injecter dans le div#sidebar existant
  const el = document.getElementById('sidebar');
  if (el) el.innerHTML = sidebarHTML;

  // Exposer une fonction pour afficher l'utilisateur connecté
  window.sidebarSetUser = function(email, groupeNom) {
    const block = document.getElementById('sb-user-block');
    const av = document.getElementById('sb-avatar');
    const un = document.getElementById('sb-username');
    const gn = document.getElementById('sb-groupe-nom');
    if (av) av.textContent = email.charAt(0).toUpperCase();
    if (un) un.textContent = email.split('@')[0];
    if (gn && groupeNom) gn.textContent = groupeNom;
    if (block) block.style.display = 'flex';
  };

  // ── ICÔNES SVG ──────────────────────────────────────────────────────────────
  function iconHouse() {
    return `<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  }
  function iconGlobe() {
    return `<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`;
  }
  function iconPhone() {
    return `<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>`;
  }
  function iconMap() {
    return `<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M9 4L3 7v13l6-3 6 3 6-3V4l-6 3-6-3z"/>
      <path d="M9 4v13M15 7v13"/></svg>`;
  }
  function iconCompass() {
    return `<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
  }
  function iconFile() {
    return `<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/></svg>`;
  }
  function iconPlus() {
    return `<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/></svg>`;
  }
  function iconUser() {
    return `<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/></svg>`;
  }
  function iconSettings() {
    return `<svg class="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`;
  }
})();

  // ── Transitions de page fluides ────────────────────────────────────────────
  // Intercepte les clics sidebar pour fade-out avant navigation
  document.addEventListener('click', function(e) {
    const link = e.target.closest('.sb-item');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href === window.location.href) return;
    // Si même page (hash) → pas de transition, hashchange gère
    const isSamePage = href.split('#')[0] === window.location.pathname.split('/').pop() ||
                       href.split('#')[0] === '';
    if (isSamePage) return;
    e.preventDefault();
    document.body.classList.add('page-out');
    setTimeout(() => { window.location.href = href; }, 80);
  });

}); // DOMContentLoaded
