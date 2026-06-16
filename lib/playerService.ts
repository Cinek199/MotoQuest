import { supabase } from "./supabase";

type PlayerProgress = {
  tiles: unknown[];
  towns: unknown[];
  achievements: Array<{ id?: string; xp?: number; [key: string]: unknown }>;
  trips: unknown[];
  distance_km: number;
  xp: number;
  level: number;
};

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

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function mergeArrayUnique<T>(localItems: T[], cloudItems: T[]): T[] {
  const map = new Map<string, T>();

  [...cloudItems, ...localItems].forEach((item) => {
    const key =
      typeof item === "string"
        ? item
        : JSON.stringify(item);

    map.set(key, item);
  });

  return Array.from(map.values());
}

function mergeAchievements(
  localItems: Array<{ id?: string; [key: string]: unknown }>,
  cloudItems: Array<{ id?: string; [key: string]: unknown }>
) {
  const map = new Map<string, { id?: string; [key: string]: unknown }>();

  [...cloudItems, ...localItems].forEach((item) => {
    const key = item.id || JSON.stringify(item);
    map.set(key, item);
  });

  return Array.from(map.values());
}

function getLocalProgress(): PlayerProgress {
  const tiles = readJson<unknown[]>("mq_tiles", []);
  const towns = readJson<unknown[]>("mq_towns", []);
  const achievements = readJson<Array<{ id?: string; xp?: number }>>(
    "mq_achievements",
    []
  );
  const trips = readJson<unknown[]>("mq_trips", []);
  const distanceKm = Number(localStorage.getItem("mq_distance") || "0");

  const achievementXp = achievements.reduce((sum, achievement) => {
    return sum + Number(achievement.xp || 0);
  }, 0);

  const xp = tiles.length * 25 + towns.length * 250 + achievementXp;
  const level = Math.floor(xp / 1000) + 1;

  return {
    tiles,
    towns,
    achievements,
    trips,
    distance_km: distanceKm,
    xp,
    level,
  };
}

function saveLocalProgress(progress: PlayerProgress) {
  writeJson("mq_tiles", progress.tiles);
  writeJson("mq_towns", progress.towns);
  writeJson("mq_achievements", progress.achievements);
  writeJson("mq_trips", progress.trips);
  localStorage.setItem("mq_distance", String(progress.distance_km));
}

function mergeProgress(local: PlayerProgress, cloud: PlayerProgress): PlayerProgress {
  const tiles = mergeArrayUnique(local.tiles, cloud.tiles);
  const towns = mergeArrayUnique(local.towns, cloud.towns);
  const achievements = mergeAchievements(local.achievements, cloud.achievements);
  const trips = mergeArrayUnique(local.trips, cloud.trips);
  const distanceKm = Math.max(
    Number(local.distance_km || 0),
    Number(cloud.distance_km || 0)
  );

  const achievementXp = achievements.reduce((sum, achievement) => {
    return sum + Number(achievement.xp || 0);
  }, 0);

  const xp = tiles.length * 25 + towns.length * 250 + achievementXp;
  const level = Math.floor(xp / 1000) + 1;

  return {
    tiles,
    towns,
    achievements,
    trips,
    distance_km: distanceKm,
    xp,
    level,
  };
}

export async function savePlayer(userId: string) {
  const progress = getLocalProgress();

  const { error } = await supabase.from("player_progress").upsert(
    {
      user_id: userId,
      tiles: progress.tiles,
      towns: progress.towns,
      achievements: progress.achievements,
      trips: progress.trips,
      distance_km: progress.distance_km,
      xp: progress.xp,
      level: progress.level,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    console.error("Save player progress error:", error);
    throw error;
  }
}

export async function loadPlayer(userId: string) {
  const { data, error } = await supabase
    .from("player_progress")
    .select("tiles, towns, achievements, trips, distance_km, xp, level")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Load player progress error:", error);
    throw error;
  }

  const localProgress = getLocalProgress();

  if (!data) {
    await savePlayer(userId);
    return localProgress;
  }

  const cloudProgress: PlayerProgress = {
    tiles: Array.isArray(data.tiles) ? data.tiles : [],
    towns: Array.isArray(data.towns) ? data.towns : [],
    achievements: Array.isArray(data.achievements) ? data.achievements : [],
    trips: Array.isArray(data.trips) ? data.trips : [],
    distance_km: Number(data.distance_km || 0),
    xp: Number(data.xp || 0),
    level: Number(data.level || 1),
  };

  const mergedProgress = mergeProgress(localProgress, cloudProgress);

  saveLocalProgress(mergedProgress);
  await savePlayer(userId);

  return mergedProgress;
}