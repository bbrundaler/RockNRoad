/* ════════════════════════════════════════════════════════════════════
   RockNRoad — rnr-config.js
   SOURCE UNIQUE de l'URL et de la clé anon Supabase (M4, dette technique).

   Avant ce fichier (19/07) : la clé anon était recopiée en dur dans 15
   fichiers (8 sous les noms SURL/SKEY, 2 sous SUPABASE_URL/SUPABASE_ANON,
   4 directement inline dans createClient(), plus chrome.js) — changer la
   clé un jour aurait demandé 15 modifications manuelles, avec un fort
   risque d'en oublier une (exactement le genre de trou que B87 a montré
   ce soir sur les GRANTs : un oubli invisible jusqu'à l'échec réel).

   Ce n'est PAS un secret à protéger : c'est la clé anon publique, déjà
   visible dans le HTML servi à n'importe quel visiteur. Zéro changement
   de sécurité en la centralisant ici — uniquement un seul endroit à
   changer si elle tourne un jour (rotation de clé, migration de projet).

   INCLUSION : <script src="rnr-config.js"></script> en tout premier dans
   le <head>, avant tout autre script (y compris chrome.js qui pose le
   thème avant le premier rendu, et le SDK Supabase CDN) — pose deux
   constantes globales lues partout ensuite.
   ════════════════════════════════════════════════════════════════════ */
window.RNR_SURL = 'https://cazqllstxhuecoqpktwm.supabase.co';
window.RNR_SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhenFsbHN0eGh1ZWNvcXBrdHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTExNTQsImV4cCI6MjA5NDk2NzE1NH0.6YYAJXG4s-h78YUp2pd7fBvQJzDprSxtSkUZTv6ZtZs';
