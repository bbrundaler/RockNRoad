// Edge Function dynamic-action v14 - gestion membres + comptes orphelins
// verify_jwt: FALSE (imperatif - photos <img> sans en-tete)
// v14 (15/06) : invite_user redirectTo -> index.html (consomme le token invite,
//   route ensuite vers nouveau-mot-de-passe.html puis onboarding.html).

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

const COSTLY = new Set(["findplace", "textsearch", "details", "nearbysearch", "invite_user", "toggle_user_ban"]);
const PHOTOS_STANDARD = 1;
const PHOTOS_PREMIUM = 5;

function deny(msg: string, code = 403) {
  return new Response(
    JSON.stringify({ error: "refuse", reason: msg }),
    { status: code, headers: { ...CORS, "Content-Type": "application/json" } }
  );
}

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

async function requireSuperAdmin(
  req: Request
): Promise<{ denial: string | null; admin: ReturnType<typeof createClient>; userId?: string }> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  if (!token) return { denial: "Token manquant.", admin };
  const { data: userData } = await admin.auth.getUser(token);
  if (!userData?.user) return { denial: "Token invalide.", admin };
  const { data: memData } = await admin.from("membres")
    .select("is_superadmin").eq("user_id", userData.user.id).single();
  if (!memData?.is_superadmin) return { denial: "Reserve au super-admin.", admin };
  return { denial: null, admin, userId: userData.user.id };
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
      const sa = await requireSuperAdmin(req);
      if (sa.denial) return deny(sa.denial);
      const admin2 = sa.admin;

      const email = (body.email as string) ?? "";
      const meta = (body.meta as Record<string, unknown>) ?? {};
      if (!email) return deny("Email requis.", 400);

      // v14 : redirectTo -> index.html. index.html consomme le token d'invitation,
      // route l'invite vers nouveau-mot-de-passe.html (definition du mot de passe),
      // qui redirige ensuite vers onboarding.html (identite / creation de groupe).
      const { data: invData, error: invErr } = await admin2.auth.admin.inviteUserByEmail(email, {
        data: meta,
        redirectTo: "https://bbrundaler.github.io/RockNRoad/index.html"
      });
      if (invErr) {
        return new Response(JSON.stringify({ error: invErr.message }), {
          status: 400, headers: { ...CORS, "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ ok: true, id: invData.user?.id }), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    } else if (action === "list_members") {
      const sa0 = await requireSuperAdmin(req);
      if (sa0.denial) return deny(sa0.denial);
      const admin0 = sa0.admin;

      const { data: membres0, error: mErr0 } = await admin0
        .from("membres").select("id, user_id, groupe_id, role, is_superadmin, pseudo, avatar, nom, prenom, naissance_mois_annee, type, tranche_age, parent_membre_id, consent_marketing, consent_marketing_date, joined_at");
      if (mErr0) {
        return new Response(JSON.stringify({ error: mErr0.message }), {
          status: 400, headers: { ...CORS, "Content-Type": "application/json" }
        });
      }

      const result = [];
      for (const m of membres0 ?? []) {
        let email = null;
        let banned = false;
        if (m.user_id) {
          const { data: u } = await admin0.auth.admin.getUserById(m.user_id as string);
          email = u?.user?.email ?? null;
          banned = !!(u?.user?.banned_until && u.user.banned_until !== "none" && new Date(u.user.banned_until) > new Date());
        }
        result.push({
          id: m.id, user_id: m.user_id, groupe_id: m.groupe_id, role: m.role,
          is_superadmin: m.is_superadmin, pseudo: m.pseudo, avatar: m.avatar,
          nom: m.nom, prenom: m.prenom, naissance_mois_annee: m.naissance_mois_annee,
          type: m.type, tranche_age: m.tranche_age, parent_membre_id: m.parent_membre_id,
          consent_marketing: m.consent_marketing, consent_marketing_date: m.consent_marketing_date,
          joined_at: m.joined_at, email, banned
        });
      }

      return new Response(JSON.stringify({ ok: true, membres: result }), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    } else if (action === "toggle_user_ban") {
      const sa = await requireSuperAdmin(req);
      if (sa.denial) return deny(sa.denial);
      const admin4 = sa.admin;

      const targetUserId = (body.user_id as string) ?? "";
      const ban = (body.ban as boolean) === true;
      if (!targetUserId) return deny("user_id requis.", 400);

      const { error: banErr } = await admin4.auth.admin.updateUserById(targetUserId, {
        ban_duration: ban ? "876000h" : "none"
      });
      if (banErr) {
        return new Response(JSON.stringify({ error: banErr.message }), {
          status: 400, headers: { ...CORS, "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ ok: true, banned: ban }), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    } else if (action === "update_member") {
      const sa = await requireSuperAdmin(req);
      if (sa.denial) return deny(sa.denial);
      const admin5 = sa.admin;

      const memberId = (body.member_id as string) ?? "";
      const fields = (body.fields as Record<string, unknown>) ?? {};
      if (!memberId) return deny("member_id requis.", 400);

      const ALLOWED = ["pseudo","avatar","nom","prenom","naissance_mois_annee",
                       "tranche_age","consent_marketing","role"];
      const patch: Record<string, unknown> = {};
      for (const k of ALLOWED) {
        if (k in fields) patch[k] = fields[k];
      }
      if (Object.keys(patch).length === 0) return deny("Aucun champ valide a modifier.", 400);

      const { error: upErr } = await admin5.from("membres").update(patch).eq("id", memberId);
      if (upErr) {
        return new Response(JSON.stringify({ error: upErr.message }), {
          status: 400, headers: { ...CORS, "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    } else if (action === "delete_member") {
      const sa = await requireSuperAdmin(req);
      if (sa.denial) return deny(sa.denial);
      const admin6 = sa.admin;

      const memberId = (body.member_id as string) ?? "";
      const directUserId = (body.user_id as string) ?? "";
      const hard = (body.hard as boolean) === true;
      if (!memberId && !directUserId) return deny("member_id ou user_id requis.", 400);

      let userIdToDelete: string | null = directUserId || null;

      if (memberId) {
        const { data: mem, error: getErr } = await admin6
          .from("membres").select("id, user_id").eq("id", memberId).single();
        if (getErr || !mem) return deny("Membre introuvable.", 404);
        userIdToDelete = (mem.user_id as string) ?? null;

        const { error: delErr } = await admin6.from("membres").delete().eq("id", memberId);
        if (delErr) {
          return new Response(JSON.stringify({ error: delErr.message }), {
            status: 400, headers: { ...CORS, "Content-Type": "application/json" }
          });
        }
      } else {
        await admin6.from("membres").delete().eq("user_id", directUserId);
      }

      let authDeleted = false;
      if (hard && userIdToDelete) {
        const { error: authErr } = await admin6.auth.admin.deleteUser(userIdToDelete);
        if (!authErr) authDeleted = true;
      }
      return new Response(JSON.stringify({ ok: true, hard, authDeleted }), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    } else if (action === "list_orphan_accounts") {
      const sa = await requireSuperAdmin(req);
      if (sa.denial) return deny(sa.denial);
      const admin8 = sa.admin;

      const { data: membres8 } = await admin8.from("membres").select("user_id");
      const withGroup = new Set((membres8 ?? []).map((m: { user_id: string | null }) => m.user_id).filter(Boolean));

      const orphans = [];
      let page = 1;
      const perPage = 200;
      while (page <= 5) {
        const { data: list, error: lErr } = await admin8.auth.admin.listUsers({ page, perPage });
        if (lErr || !list?.users?.length) break;
        for (const u of list.users) {
          if (!withGroup.has(u.id)) {
            orphans.push({
              user_id: u.id,
              email: u.email ?? null,
              created_at: u.created_at,
              banned: !!(u.banned_until && u.banned_until !== "none" && new Date(u.banned_until) > new Date())
            });
          }
        }
        if (list.users.length < perPage) break;
        page++;
      }
      return new Response(JSON.stringify({ ok: true, orphans }), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    } else if (action === "attach_member") {
      const sa = await requireSuperAdmin(req);
      if (sa.denial) return deny(sa.denial);
      const admin9 = sa.admin;

      const targetUserId = (body.user_id as string) ?? "";
      const groupeId = (body.groupe_id as string) ?? "";
      const role = ((body.role as string) === "admin") ? "admin" : "membre";
      if (!targetUserId || !groupeId) return deny("user_id et groupe_id requis.", 400);

      const { error: insErr } = await admin9.from("membres")
        .insert({ user_id: targetUserId, groupe_id: groupeId, role });
      if (insErr) {
        return new Response(JSON.stringify({ error: insErr.message }), {
          status: 400, headers: { ...CORS, "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    } else if (action === "create_group") {
      const sa = await requireSuperAdmin(req);
      if (sa.denial) return deny(sa.denial);
      const admin7 = sa.admin;

      const nom = (body.nom as string)?.trim() ?? "";
      if (!nom) return deny("Nom du groupe requis.", 400);

      const { data: g, error: gErr } = await admin7.from("groupes")
        .insert({ nom, adresse_depart: (body.adresse_depart as string) ?? null })
        .select("id, nom").single();
      if (gErr) {
        return new Response(JSON.stringify({ error: gErr.message }), {
          status: 400, headers: { ...CORS, "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ ok: true, groupe: g }), {
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
