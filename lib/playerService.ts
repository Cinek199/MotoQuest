import { supabase } from "./supabase";

export async function savePlayer(userId: string) {
  const tiles = JSON.parse(localStorage.getItem("mq_tiles") || "[]");
  const towns = JSON.parse(localStorage.getItem("mq_towns") || "[]");
  const voivodeships = JSON.parse(
    localStorage.getItem("mq_voivodeships") || "[]"
  );
  const achievements = JSON.parse(
    localStorage.getItem("mq_achievements") || "[]"
  );
  const garage = JSON.parse(localStorage.getItem("mq_garage") || "[]");
  const trips = JSON.parse(localStorage.getItem("mq_trips") || "[]");
  const tripPhotos = JSON.parse(
    localStorage.getItem("mq_trip_photos") || "{}"
  );
  const profile = JSON.parse(localStorage.getItem("mq_profile") || "{}");
  const activeBikeId = localStorage.getItem("mq_active_bike_id") || null;
  const distanceKm = Number(localStorage.getItem("mq_distance") || "0");

  const achievementXp = achievements.reduce((sum: number, achievement: any) => {
    return sum + (achievement.xp || 0);
  }, 0);

  const xp = tiles.length * 25 + towns.length * 250 + achievementXp;
  const level = Math.floor(xp / 1000) + 1;

  await supabase.from("players").upsert({
    id: userId,
    tiles: tiles.length,
    towns: towns.length,
    xp,
    level,
    discovered_tiles: tiles,
    discovered_towns: towns,
    discovered_voivodeships: voivodeships,
    achievements,
    garage,
    profile,
    active_bike_id: activeBikeId,
    trips,
    trip_photos: tripPhotos,
    distance_km: distanceKm,
  });
}
