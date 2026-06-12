import { supabase } from "./supabase";

export async function loadPlayer(userId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  localStorage.setItem(
    "mq_tiles",
    JSON.stringify(data.discovered_tiles || [])
  );
  localStorage.setItem(
    "mq_towns",
    JSON.stringify(data.discovered_towns || [])
  );
  localStorage.setItem(
    "mq_voivodeships",
    JSON.stringify(data.discovered_voivodeships || [])
  );
  localStorage.setItem(
    "mq_achievements",
    JSON.stringify(data.achievements || [])
  );
  localStorage.setItem("mq_garage", JSON.stringify(data.garage || []));
  localStorage.setItem("mq_profile", JSON.stringify(data.profile || {}));

  if (data.active_bike_id) {
    localStorage.setItem("mq_active_bike_id", data.active_bike_id);
  }

  localStorage.setItem("mq_trips", JSON.stringify(data.trips || []));
  localStorage.setItem("mq_trip_photos", JSON.stringify(data.trip_photos || {}));
  localStorage.setItem("mq_distance", String(data.distance_km || 0));

  return data;
}
