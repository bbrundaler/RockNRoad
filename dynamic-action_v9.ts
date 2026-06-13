// ⚠️ FICHIER DE RÉFÉRENCE — source de l'Edge Function 'dynamic-action' v9
// DÉPLOYÉE sur Supabase (projet cazqllstxhuecoqpktwm) le 13/06/2026.
// Ne se déploie PAS sur GitHub Pages. Conservé dans le ZIP comme source de vérité.
// Déploiement : via MCP deploy_edge_function avec verify_jwt: FALSE (impératif).
// Edge Function : dynamic-action — VERSION SECURISEE (serrure + quota mensuel + bloquant photos)
// Proxy Google Places cote serveur. La cle reste secrete (jamais dans le front).
// Actions : findplace, textsearch, details, nearbysearch, photo, resolveurl, invite_user
//
// SERRURE : les actions COUTEUSES exigent un token utilisateur valide. La fonction
// deduit le groupe, et verifie le QUOTA MENSUEL d'import (fiches creees depuis le
// 1er du mois courant vs import_limit). Pas de token / pas de droit / quota atteint
// => refus, Google jamais appele.
// Les actions photo et resolveurl restent ouvertes (photo = <img> sans en-tete).
//
// BLOQUANT PHOTOS (etape 3) : la reponse 'details' est tronquee cote serveur selon
// groupes.niveau_photos — false => 1 photo (standard), true => 5 photos (premium).
// Une reference jamais transmise au front est une photo impossible a demander.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_KEY = Deno.env.get("GOOGLE_PLACES_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BASE = "https://maps.googleapis.com/maps/api/place";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
};

const COSTLY = new Set(["findplace", "textsearch", "details", "nearbysearch", "invite_user"]);
const PHOTOS_STANDARD = 1;
const PHOTOS_PREMIUM = 5;

function deny(msg: string, code = 403) {
  return new Response(
    JSON.stringify({ error: "refuse", reason: msg }),
    { status: code, headers: { ...CORS, "Content-Type": "application/json" } }
  );
}

// Renvoie { denial } en cas de refus, sinon { denial: null, niveauPhotos }.
async function checkAccess(
  req: Request
): Promise<{ denial: string | null; niveauPhotos: boolean }> {
  const refuse = (msg: string) => ({ denial: msg, niveauPhotos: false });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return refuse("Connexion requise pour importer.");

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr) return refuse("Token rejete: " + userErr.message);
  if (!userData?.user) return refuse("Token sans utilisateur.");
  const userId = userData.user.id;

  const { data: membre, error: mErr } = await admin
    .from("membres").select("groupe_id").eq("user_id", userId).single();
  if (mErr) return refuse("Erreur lecture membre: " + mErr.message);
  if (!membre?.groupe_id) return refuse("Aucun groupe rattache a ce compte.");
  const groupeId = membre.groupe_id;

  const { data: groupe, error: gErr } = await admin
    .from("groupes").select("import_limit, niveau_photos").eq("id", groupeId).single();
  if (gErr || !groupe) return refuse("Groupe introuvable.");
  const limit = groupe.import_limit ?? 0;
  if (limit <= 0) return refuse("Import non autorise pour ce groupe.");

  const debutMois = new Date();
  debutMois.setUTCDate(1);
  debutMois.setUTCHours(0, 0, 0, 0);
  const { count, error: cErr } = await admin
    .from("lieux")
    .select("id", { count: "exact", head: true })
    .eq("groupe_id", groupeId)
    .gte("created_at", debutMois.toISOString());
  if (cErr) return refuse("Impossible de verifier le quota: " + cErr.message);
  if ((count ?? 0) >= limit) {
    return refuse(`Quota mensuel atteint (${count}/${limit} ce mois-ci).`);
  }

  return { denial: null, niveauPhotos: groupe.niveau_photos === true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    let body: Record<string, unknown> = {};
    if (req.method === "POST") {
      body = await req.json().catch(() => ({}));
    }
    const urlObj = new URL(req.url);
    const qp = (k: string) => urlObj.searchParams.get(k) ?? undefined;

    const action = (body.action as string) ?? qp("action");

    let niveauPhotos = false;
    if (COSTLY.has(action ?? "")) {
      const access = await checkAccess(req);
      if (access.denial) return deny(access.denial);
      niveauPhotos = access.niveauPhotos;
    }

    if (action === "photo") {
      const ref = (body.photo_reference as string) ?? qp("photo_reference") ?? "";
      const maxwidth = (body.maxwidth as number) ?? qp("maxwidth") ?? 800;
      const photoUrl = `${BASE}/photo?maxwidth=${maxwidth}&photo_reference=${encodeURIComponent(ref)}&key=${GOOGLE_KEY}`;
      const imgRes = await fetch(photoUrl);
      const bytes = await imgRes.arrayBuffer();
      return new Response(bytes, {
        headers: {
          ...CORS,
          "Content-Type": imgRes.headers.get("Content-Type") ?? "image/jpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    if (action === "resolveurl") {
      const target = (body.url as string) ?? qp("url") ?? "";
      const res = await fetch(target, { redirect: "follow" });
      const html = await res.text();
      return new Response(
        JSON.stringify({ finalUrl: res.url, html: html.slice(0, 20000) }),
        { headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    let url = "";

    if (action === "findplace") {
      const input = encodeURIComponent((body.input as string) ?? qp("input") ?? "");
      const locationbias = (body.locationbias as string) ?? "";
      url = `${BASE}/findplacefromtext/json?input=${input}&inputtype=textquery&fields=place_id,name,types&language=fr&key=${GOOGLE_KEY}`;
      if (locationbias) url += `&locationbias=${encodeURIComponent(locationbias)}`;
    } else if (action === "textsearch") {
      const query = encodeURIComponent((body.query as string) ?? qp("query") ?? "");
      url = `${BASE}/textsearch/json?query=${query}&language=fr&key=${GOOGLE_KEY}`;
    } else if (action === "details") {
      const placeId = encodeURIComponent((body.place_id as string) ?? qp("place_id") ?? "");
      const fields = encodeURIComponent(
        (body.fields as string) ??
          "name,formatted_address,address_components,geometry,formatted_phone_number,website,rating,user_ratings_total,types,photos,opening_hours,editorial_summary,price_level,reviews"
      );
      url = `${BASE}/details/json?place_id=${placeId}&fields=${fields}&language=fr&key=${GOOGLE_KEY}`;
    } else if (action === "nearbysearch") {
      const location = encodeURIComponent((body.location as string) ?? qp("location") ?? "");
      const radius = (body.radius as number) ?? qp("radius") ?? 100;
      url = `${BASE}/nearbysearch/json?location=${location}&radius=${radius}&language=fr&key=${GOOGLE_KEY}`;
    } else if (action === "invite_user") {
      // ── invite_user : invitation email via Supabase Auth Admin ────────────────
      // Vérifier que l'appelant est super-admin (double-check en plus de checkAccess)
      const authHeader2 = req.headers.get("Authorization") ?? "";
      const token2 = authHeader2.replace(/^Bearer\s+/i, "").trim();
      const admin2 = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: userData2 } = await admin2.auth.getUser(token2);
      if (!userData2?.user) return deny("Token invalide.");
      const { data: memData } = await admin2.from("membres")
        .select("is_superadmin").eq("user_id", userData2.user.id).single();
      if (!memData?.is_superadmin) return deny("Réservé au super-admin.", 403);

      const email = (body.email as string) ?? "";
      const meta = (body.meta as Record<string, unknown>) ?? {};
      if (!email) return deny("Email requis.", 400);

      const { data: invData, error: invErr } = await admin2.auth.admin.inviteUserByEmail(email, {
        data: meta,
        redirectTo: "https://bbrundaler.github.io/RockNRoad/onboarding.html"
      });
      if (invErr) {
        return new Response(JSON.stringify({ error: invErr.message }), {
          status: 400, headers: { ...CORS, "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ ok: true, id: invData.user?.id }), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    } else {
      return new Response(
        JSON.stringify({ error: "action inconnue", recu: action }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch(url);
    const data = await res.json();

    // BLOQUANT PHOTOS : troncature serveur de la galerie selon le niveau du groupe.
    if (action === "details" && Array.isArray(data?.result?.photos)) {
      const max = niveauPhotos ? PHOTOS_PREMIUM : PHOTOS_STANDARD;
      data.result.photos = data.result.photos.slice(0, max);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
