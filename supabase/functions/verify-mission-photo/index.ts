import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
};

type VerifyRequest = {
  latitude?: number;
  longitude?: number;
  missionId?: string;
  storagePath?: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Brak autoryzacji." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authorization } },
    });
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Sesja wygasla." }, 401);

    const body = (await request.json()) as VerifyRequest;
    if (!body.missionId) return json({ error: "Brak misji." }, 400);

    const { count } = await admin
      .from("mq_mission_submissions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 3600000).toISOString());
    if ((count ?? 0) >= 30) return json({ error: "Limit prob na godzine." }, 429);

    const { data: mission } = await admin
      .from("mq_city_missions")
      .select("*, city:mq_cities(id, name, required_missions, completion_xp)")
      .eq("id", body.missionId)
      .single();
    if (!mission) return json({ error: "Nie znaleziono misji." }, 404);

    const { data: completed } = await admin
      .from("mq_mission_completions")
      .select("mission_id")
      .eq("user_id", user.id)
      .eq("mission_id", mission.id)
      .maybeSingle();
    if (completed) return json({ approved: true, alreadyCompleted: true, mission });

    const distance = distanceMeters(
      body.latitude,
      body.longitude,
      mission.target_lat,
      mission.target_lon
    );
    const locationAccepted = distance !== null && distance <= Number(mission.radius_m || 350);
    const photoAccepted = !mission.photo_required ||
      Boolean(body.storagePath?.startsWith(`${user.id}/${mission.id}/`));
    const reason = !locationAccepted
      ? distance === null
        ? "Nie udalo sie potwierdzic GPS."
        : `Jestes za daleko od celu (${Math.round(distance)} m).`
      : !photoAccepted
        ? "Dodaj zdjecie wykonania misji."
        : "";

    const { data: submission } = await admin
      .from("mq_mission_submissions")
      .insert({
        user_id: user.id,
        mission_id: mission.id,
        storage_path: body.storagePath || null,
        latitude: finiteOrNull(body.latitude),
        longitude: finiteOrNull(body.longitude),
        distance_m: distance,
        status: locationAccepted && photoAccepted ? "approved" : "rejected",
        rejection_reason: reason || null,
        reviewed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (!submission) throw new Error("SUBMISSION_CREATE_FAILED");
    if (!locationAccepted || !photoAccepted) return json({ approved: false, distance, reason });

    await admin.from("mq_mission_completions").upsert({
      user_id: user.id,
      mission_id: mission.id,
      submission_id: submission.id,
    });

    const { data: cityCompletion } = await admin
      .from("mq_city_completions")
      .select("city_id")
      .eq("user_id", user.id)
      .eq("city_id", mission.city_id)
      .maybeSingle();
    const { data: specialBadge } = mission.special_badge_id
      ? await admin
          .from("mq_user_special_badges")
          .select("badge_id")
          .eq("user_id", user.id)
          .eq("badge_id", mission.special_badge_id)
          .maybeSingle()
      : { data: null };

    return json({
      approved: true,
      cityCompleted: Boolean(cityCompletion),
      distance,
      mission,
      specialBadgeUnlocked: Boolean(specialBadge),
      verification: "gps",
    });
  } catch (error) {
    console.error("verify-mission-photo error", error);
    return json({ error: "Nie udalo sie zweryfikowac misji." }, 500);
  }
});

function finiteOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function distanceMeters(lat1: unknown, lon1: unknown, lat2: unknown, lon2: unknown) {
  if (![lat1, lon1, lat2, lon2].every(
    (value) => typeof value === "number" && Number.isFinite(value)
  )) return null;

  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const firstLat = toRad(lat1 as number);
  const secondLat = toRad(lat2 as number);
  const deltaLat = toRad((lat2 as number) - (lat1 as number));
  const deltaLon = toRad((lon2 as number) - (lon1 as number));
  const a = Math.sin(deltaLat / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(deltaLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
