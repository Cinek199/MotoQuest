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
