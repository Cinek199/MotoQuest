import { unlockAchievement } from "./achievements";
import { calculateDistanceKm } from "./distance";
import { getJson, setJson, STORAGE_KEYS } from "./storage";

export type TripRoutePoint = {
  accuracy: number | null;
  lat: number;
  lon: number;
  speedKmh: number | null;
  timestamp: number;
};

export type ActiveTrip = {
  name: string;
  route: TripRoutePoint[];
  startDistance: number;
  startTiles: number;
  startTowns: number;
  startVoivodeships: number;
  startedAt: number;
};

export type FinishedTrip = {
  averageSpeedKmh: number;
  date: string;
  distance: number;
  duration: number;
  endedAt: number;
  id: string;
  name: string;
  route: TripRoutePoint[];
  startedAt: number;
  tiles: number;
  towns: number;
  voivodeships: number;
  xp: number;
};

const MIN_POINT_DISTANCE_KM = 0.015;
const MIN_POINT_INTERVAL_MS = 5000;

export function getActiveTrip() {
  return getJson<ActiveTrip | null>(STORAGE_KEYS.activeTrip, null);
}

export function saveActiveTrip(trip: ActiveTrip) {
  setJson(STORAGE_KEYS.activeTrip, trip);
}

export function finishActiveTrip() {
  const latestActiveTrip = getActiveTrip();

  if (!latestActiveTrip) {
    return null;
  }

  const distance = Math.max(
    0,
    getNumber(STORAGE_KEYS.distance) - latestActiveTrip.startDistance
  );
  const tiles = Math.max(
    0,
    getJson<string[]>(STORAGE_KEYS.tiles, []).length - latestActiveTrip.startTiles
  );
  const towns = Math.max(
    0,
    getJson<string[]>(STORAGE_KEYS.towns, []).length - latestActiveTrip.startTowns
  );
  const voivodeships = Math.max(
    0,
    getJson<string[]>(STORAGE_KEYS.voivodeships, []).length -
      latestActiveTrip.startVoivodeships
  );
  const endedAt = Date.now();
  const duration = Math.max(
    1,
    Math.floor((endedAt - latestActiveTrip.startedAt) / 1000 / 60)
  );

  const finishedTrip: FinishedTrip = {
    averageSpeedKmh: calculateAverageSpeedKmh(distance, duration),
    date: new Date(endedAt).toLocaleDateString("pl-PL"),
    distance,
    duration,
    endedAt,
    id: createTripId(latestActiveTrip.name, latestActiveTrip.startedAt, endedAt),
    name: latestActiveTrip.name,
    route: latestActiveTrip.route,
    startedAt: latestActiveTrip.startedAt,
    tiles,
    towns,
    voivodeships,
    xp: calculateTripXp({
      distance,
      tiles,
      towns,
      voivodeships,
    }),
  };

  const nextTrips = [
    finishedTrip,
    ...getJson<FinishedTrip[]>(STORAGE_KEYS.trips, []),
  ];

  setJson(STORAGE_KEYS.trips, nextTrips);
  localStorage.removeItem(STORAGE_KEYS.activeTrip);
  unlockTripAchievements(nextTrips, finishedTrip);

  return {
    finishedTrip,
    nextTrips,
  };
}

export function appendActiveTripPoint(point: TripRoutePoint) {
  const trip = getActiveTrip();

  if (!trip) {
    return false;
  }

  const lastPoint = trip.route.at(-1);

  if (lastPoint) {
    const distanceFromLastPoint = calculateDistanceKm(
      lastPoint.lat,
      lastPoint.lon,
      point.lat,
      point.lon
    );

    const timeFromLastPoint = point.timestamp - lastPoint.timestamp;

    if (
      distanceFromLastPoint < MIN_POINT_DISTANCE_KM &&
      timeFromLastPoint < MIN_POINT_INTERVAL_MS
    ) {
      return false;
    }
  }

  saveActiveTrip({
    ...trip,
    route: [...trip.route, point],
  });

  return true;
}

export function calculateTripXp({
  distance,
  tiles,
  towns,
  voivodeships,
}: {
  distance: number;
  tiles: number;
  towns: number;
  voivodeships: number;
}) {
  return (
    Math.round(distance * 10) +
    tiles * 25 +
    towns * 250 +
    voivodeships * 500
  );
}

export function calculateAverageSpeedKmh(distance: number, durationMinutes: number) {
  if (durationMinutes <= 0) {
    return 0;
  }

  return distance / (durationMinutes / 60);
}

function createTripId(name: string, startedAt: unknown, endedAt: unknown) {
  const start = safeNumber(startedAt, Date.now());
  const end = safeNumber(endedAt, start);
  const safeName = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return `trip-${start}-${end}-${safeName || "wyprawa"}`;
}

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getNumber(key: string) {
  return safeNumber(Number(localStorage.getItem(key) || 0));
}

function unlockTripAchievements(
  trips: FinishedTrip[],
  finishedTrip: FinishedTrip
) {
  if (trips.length >= 1) {
    unlockAchievement("trip-1", "Pierwsza wyprawa", 250);
  }

  if (trips.length >= 5) {
    unlockAchievement("trip-5", "5 wypraw", 1000);
  }

  if (trips.length >= 10) {
    unlockAchievement("trip-10", "10 wypraw", 2500);
  }

  if (finishedTrip.distance >= 1000) {
    unlockAchievement("trip-1000km", "1000 km w jednej wyprawie", 5000);
  }
}
