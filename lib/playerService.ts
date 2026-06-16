import { supabase } from "./supabase";

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function savePlayer(userId: string) {
  console.log("savePlayer START", userId);

  const tiles = readJson<unknown[]>("mq_tiles", []);
  const towns = readJson<unknown[]>("mq_towns", []);
  const achievements = readJson<Array<{ xp?: number }>>("mq_achievements", []);
  const trips = readJson<unknown[]>("mq_trips", []);
  const distanceKm = Number(localStorage.getItem("mq_distance") || "0");

  console.log("savePlayer DATA", {
    tilesCount: tiles.length,
    townsCount: towns.length,
    achievementsCount: achievements.length,
    tripsCount: trips.length,
    distanceKm,
  });

  const achievementXp = achievements.reduce((sum, achievement) => {
    return sum + Number(achievement.xp || 0);
  }, 0);

  const xp = tiles.length * 25 + towns.length * 250 + achievementXp;
  const level = Math.floor(xp / 1000) + 1;

  const { data, error } = await supabase.from("player_progress").upsert(
    {
      user_id: userId,
      tiles,
      towns,
      achievements,
      trips,
      distance_km: distanceKm,
      xp,
      level,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  ).select();

  if (error) {
    console.error("Save player progress error:", error);
    throw error;
  }

  console.log("savePlayer SUCCESS", data);
}