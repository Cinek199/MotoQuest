import { supabase } from "./supabase";

type Achievement = {
  id?: string;
  xp?: number;
  [key: string]: unknown;
};

type PlayerProgress = {
  tiles: unknown[];
  towns: unknown[];
  achievements: Achievement[];
  trips: unknown[];
  distance_km: number;
  xp: number;
  level: number;
  garage: unknown[];
  active_bike_id: string | null;
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

function getItemKey(item: unknown): string {
  if (typeof item === "string") {
    return item;
  }

  if (
    item &&
    typeof item === "object" &&
    "id" in item &&
    typeof item.id === "string"
  ) {
    return item.id;
  }

  return JSON.stringify(item);
}

function mergeArrayUnique<T>(localItems: T[], cloudItems: T[]): T[] {
  const map = new Map<string, T>();

  [...cloudItems, ...localItems].forEach((item) => {
    map.set(getItemKey(item), item);
  });

  return Array.from(map.values());
}

function mergeAchievements(localItems: Achievement[], cloudItems: Achievement[]) {
  const map = new Map<string, Achievement>();

  [...cloudItems, ...localItems].forEach((item) => {
    const key = item.id || JSON.stringify(item);
    map.set(key, item);
  });

  return Array.from(map.values());
}

function calculateProgress(
  tiles: unknown[],
  towns: unknown[],
  achievements: Achievement[],
  distanceKm: number,
  trips: unknown[]
): PlayerProgress {
  const achievementXp = achievements.reduce((sum, achievement) => {
    return sum + Number(achievement.xp || 0);
  }, 0);

  const calculatedXp = tiles.length * 25 + towns.length * 250 + achievementXp;
  const calculatedLevel = Math.floor(calculatedXp / 1000) + 1;

  return {
    tiles,
    towns,
    achievements,
    trips,
    distance_km: distanceKm,
    xp: calculatedXp,
    level: calculatedLevel,
    garage: [],
    active_bike_id: null,
  };
}

function getLocalProgress(): PlayerProgress {
  const tiles = readJson<unknown[]>("mq_tiles", []);
  const towns = readJson<unknown[]>("mq_towns", []);
  const achievements = readJson<Achievement[]>("mq_achievements", []);
  const trips = readJson<unknown[]>("mq_trips", []);
  const distanceKm = Number(localStorage.getItem("mq_distance") || "0");

  return {
    ...calculateProgress(tiles, towns, achievements, distanceKm, trips),
    garage: readJson<unknown[]>("mq_garage", []),
    active_bike_id: localStorage.getItem("mq_active_bike_id"),
  };
}

function saveLocalProgress(progress: PlayerProgress) {
  writeJson("mq_tiles", progress.tiles);
  writeJson("mq_towns", progress.towns);
  writeJson("mq_achievements", progress.achievements);
  writeJson("mq_trips", progress.trips);
  localStorage.setItem("mq_distance", String(progress.distance_km));
  writeJson("mq_garage", progress.garage || []);
  if (progress.active_bike_id) {
    localStorage.setItem("mq_active_bike_id", progress.active_bike_id);
  }
}

export function mergeProgress(
  local: PlayerProgress,
  cloud: PlayerProgress
): PlayerProgress {
  const tiles = mergeArrayUnique(local.tiles, cloud.tiles);
  const towns = mergeArrayUnique(local.towns, cloud.towns);
  const achievements = mergeAchievements(local.achievements, cloud.achievements);
  const trips = mergeArrayUnique(local.trips, cloud.trips);

  const distanceKm = Math.max(
    Number(local.distance_km || 0),
    Number(cloud.distance_km || 0)
  );

  const recalculated = calculateProgress(
    tiles,
    towns,
    achievements,
    distanceKm,
    trips
  );

  return {
    ...recalculated,
    garage: mergeArrayUnique(local.garage || [], cloud.garage || []),
    active_bike_id: local.active_bike_id || cloud.active_bike_id || null,
    xp: Math.max(recalculated.xp, Number(local.xp || 0), Number(cloud.xp || 0)),
    level: Math.max(
      recalculated.level,
      Number(local.level || 1),
      Number(cloud.level || 1)
    ),
  };
}

async function saveProgressToCloud(userId: string, progress: PlayerProgress) {
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
      garage: progress.garage,
      active_bike_id: progress.active_bike_id,
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

export async function savePlayer(userId: string) {
  const progress = getLocalProgress();
  await saveProgressToCloud(userId, progress);
  return progress;
}

export async function loadPlayer(userId: string) {
  const { data, error } = await supabase
    .from("player_progress")
    .select("tiles, towns, achievements, trips, distance_km, xp, level, garage, active_bike_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Load player progress error:", error);
    throw error;
  }

  const localProgress = getLocalProgress();

  if (!data) {
    await saveProgressToCloud(userId, localProgress);
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
    garage: Array.isArray(data.garage) ? data.garage : [],
    active_bike_id: typeof data.active_bike_id === "string" ? data.active_bike_id : null,
  };

  const mergedProgress = mergeProgress(localProgress, cloudProgress);

  saveLocalProgress(mergedProgress);
  await saveProgressToCloud(userId, mergedProgress);

  window.dispatchEvent(new Event("motoquest-progress-updated"));
  window.dispatchEvent(new Event("storage"));

  return mergedProgress;
}
