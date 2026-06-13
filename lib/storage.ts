export const STORAGE_KEYS = {
  achievements: "mq_achievements",
  activeTrip: "mq_active_trip",
  activeBikeId: "mq_active_bike_id",
  distance: "mq_distance",
  garage: "mq_garage",
  notifications: "mq_notifications",
  profile: "mq_profile",
  tiles: "mq_tiles",
  towns: "mq_towns",
  tripPhotos: "mq_trip_photos",
  trips: "mq_trips",
  voivodeships: "mq_voivodeships",
} as const;

export function getJson<T>(key: string, fallback: T): T {
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

export function setJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getNumber(key: string, fallback = 0) {
  const value = Number(localStorage.getItem(key) || fallback);

  return Number.isFinite(value) ? value : fallback;
}

export function setNumber(key: string, value: number) {
  localStorage.setItem(key, String(value));
}

export function addUniqueString(key: string, value: string) {
  const values = getJson<string[]>(key, []);

  if (values.includes(value)) {
    return {
      added: false,
      values,
    };
  }

  const nextValues = [...values, value];
  setJson(key, nextValues);

  return {
    added: true,
    values: nextValues,
  };
}
