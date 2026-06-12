"use client";

import { useEffect, useState } from "react";

import { unlockAchievement } from "../lib/achievements";
import { downloadTripGpx } from "../lib/gpx";
import { savePlayer } from "../lib/playerService";
import { supabase } from "../lib/supabase";
import { getJson, getNumber, setJson, STORAGE_KEYS } from "../lib/storage";
import {
  ActiveTrip,
  calculateAverageSpeedKmh,
  calculateTripXp,
  FinishedTrip,
  getActiveTrip,
  saveActiveTrip,
} from "../lib/trips";
import TripPhotosPanel from "./TripPhotosPanel";
import TripRoutePreview from "./TripRoutePreview";

export default function TripsPanel() {
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<FinishedTrip | null>(null);
  const [trips, setTrips] = useState<FinishedTrip[]>([]);
  const [tripName, setTripName] = useState("");

  useEffect(() => {
    const loadTrips = () => {
      const rawTrips = getJson<Partial<FinishedTrip>[]>(STORAGE_KEYS.trips, []);
      const normalizedTrips = normalizeTrips(rawTrips);

      migrateTripPhotosToIds(rawTrips, normalizedTrips);
      setJson(STORAGE_KEYS.trips, normalizedTrips);
      setActiveTrip(getActiveTrip());
      setTrips(normalizedTrips);
    };

    loadTrips();

    const interval = setInterval(loadTrips, 2000);

    return () => clearInterval(interval);
  }, []);

  const startTrip = () => {
    const name = tripName.trim();

    if (!name) {
      return;
    }

    const trip: ActiveTrip = {
      name,
      route: [],
      startedAt: Date.now(),
      startDistance: getNumber(STORAGE_KEYS.distance),
      startTiles: getJson<string[]>(STORAGE_KEYS.tiles, []).length,
      startTowns: getJson<string[]>(STORAGE_KEYS.towns, []).length,
      startVoivodeships: getJson<string[]>(
        STORAGE_KEYS.voivodeships,
        []
      ).length,
    };

    saveActiveTrip(trip);
    setActiveTrip(trip);
    setTripName("");
  };

  const endTrip = async () => {
    const latestActiveTrip = getActiveTrip();

    if (!latestActiveTrip) {
      return;
    }

    const distance = Math.max(
      0,
      getNumber(STORAGE_KEYS.distance) - latestActiveTrip.startDistance
    );
    const tiles = Math.max(
      0,
      getJson<string[]>(STORAGE_KEYS.tiles, []).length -
        latestActiveTrip.startTiles
    );
    const towns = Math.max(
      0,
      getJson<string[]>(STORAGE_KEYS.towns, []).length -
        latestActiveTrip.startTowns
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
      ...normalizeTrips(getJson<Partial<FinishedTrip>[]>(STORAGE_KEYS.trips, [])),
    ];

    setJson(STORAGE_KEYS.trips, nextTrips);
    localStorage.removeItem(STORAGE_KEYS.activeTrip);

    unlockTripAchievements(nextTrips, finishedTrip);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await savePlayer(user.id);
    }

    setTrips(nextTrips);
    setActiveTrip(null);
  };

  const deleteTrip = async (tripIndex: number) => {
    const accepted = window.confirm("Usunac te wyprawe z historii?");

    if (!accepted) {
      return;
    }

    const nextTrips = trips.filter((_, index) => index !== tripIndex);

    setJson(STORAGE_KEYS.trips, nextTrips);
    setJson(STORAGE_KEYS.tripPhotos, removeTripPhotosByTripId(trips[tripIndex]?.id));
    setTrips(nextTrips);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await savePlayer(user.id);
    }
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-orange-500/20 bg-zinc-950 shadow-2xl shadow-black/40">
      <div className="border-b border-zinc-800 bg-black/35 px-5 py-4">
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">
          Trasa
        </div>
        <h2 className="mt-1 text-2xl font-black text-white">Wyprawa</h2>
      </div>

      <div className="p-5">
        {!activeTrip ? (
          <div className="space-y-3">
            <input
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="Np. Tatry Weekend"
              className="w-full rounded-2xl border border-zinc-800 bg-black/45 px-4 py-4 font-bold text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
            />

            <button
              onClick={startTrip}
              className="w-full rounded-2xl bg-orange-500 py-4 font-black text-black shadow-lg shadow-orange-500/20 transition hover:bg-orange-400"
            >
              Rozpocznij wyprawe
            </button>
          </div>
        ) : (
          <ActiveTripCard activeTrip={activeTrip} onEndTrip={endTrip} />
        )}

        {trips.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-white">Historia wypraw</h3>
              <span className="rounded-full border border-zinc-800 bg-black px-3 py-1 text-xs font-bold text-zinc-400">
                {trips.length}
              </span>
            </div>

            {trips.slice(0, 10).map((trip, index) => (
              <FinishedTripCard
                key={`${trip.startedAt}-${index}`}
                trip={trip}
                index={index}
                onDelete={() => deleteTrip(index)}
                onOpenDetails={() => setSelectedTrip(trip)}
              />
            ))}
          </div>
        )}

        {selectedTrip && (
          <TripDetailsModal
            trip={selectedTrip}
            onClose={() => setSelectedTrip(null)}
          />
        )}
      </div>
    </div>
  );
}

function ActiveTripCard({
  activeTrip,
  onEndTrip,
}: {
  activeTrip: ActiveTrip;
  onEndTrip: () => void;
}) {
  const durationMinutes = Math.max(
    1,
    Math.floor((Date.now() - activeTrip.startedAt) / 1000 / 60)
  );

  return (
    <div className="space-y-3">
      <div className="rounded-[1.75rem] border border-green-500/30 bg-green-500/10 p-5 shadow-xl shadow-green-950/20">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-green-400">
          Wyprawa aktywna
        </div>
        <div className="mt-1 text-2xl font-black text-orange-500">
          {activeTrip.name}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-zinc-300">
          <TripMetric label="Czas" value={`${durationMinutes} min`} />
          <TripMetric label="Punkty GPS" value={String(activeTrip.route.length)} />
        </div>
      </div>

      <button
        onClick={onEndTrip}
        className="w-full rounded-2xl bg-red-600 py-4 font-black text-white transition hover:bg-red-500"
      >
        Zakoncz wyprawe
      </button>
    </div>
  );
}

function FinishedTripCard({
  onDelete,
  onOpenDetails,
  trip,
  index,
}: {
  onDelete: () => void;
  onOpenDetails: () => void;
  trip: FinishedTrip;
  index: number;
}) {
  const coverPhoto = getJson<Record<string, string[]>>(
    STORAGE_KEYS.tripPhotos,
    {}
  )[trip.id]?.[0];
  const [shareStatus, setShareStatus] = useState("");

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-black/45 p-3 text-sm transition hover:border-orange-500/45">
      {coverPhoto && (
        <img
          src={coverPhoto}
          alt=""
          className="mb-3 h-40 w-full rounded-xl object-cover"
        />
      )}

      <div className="px-1 text-xl font-black text-white">{trip.name}</div>
      <div className="mt-1 px-1 text-zinc-400">{trip.date}</div>

      <div className="mt-3">
        <TripRoutePreview route={trip.route} />
      </div>

      <TripMetricsGrid trip={trip} />

      <div className="mt-3 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 font-black text-orange-400">
        +{trip.xp} XP z wyprawy
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onOpenDetails}
          className="rounded-2xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 font-black text-orange-400 transition hover:bg-orange-500 hover:text-black"
        >
          Szczegoly trasy
        </button>

        <button
          type="button"
          onClick={() => shareTrip(trip, setShareStatus)}
          className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-black text-zinc-200 transition hover:border-orange-500 hover:text-orange-400"
        >
          Udostepnij
        </button>
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="mt-2 w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-black text-red-300 transition hover:bg-red-600 hover:text-white"
      >
        Usun wyprawe
      </button>

      {shareStatus && (
        <div className="mt-2 rounded-2xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-xs font-black text-green-300">
          {shareStatus}
        </div>
      )}

      <TripPhotosPanel tripId={trip.id} />
    </article>
  );
}

function TripDetailsModal({
  onClose,
  trip,
}: {
  onClose: () => void;
  trip: FinishedTrip;
}) {
  const [shareStatus, setShareStatus] = useState("");

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 p-4 backdrop-blur">
      <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
              Szczegoly wyprawy
            </div>
            <h2 className="mt-2 text-3xl font-black text-white">{trip.name}</h2>
            <div className="mt-1 text-zinc-400">{trip.date}</div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => shareTrip(trip, setShareStatus)}
              className="rounded-xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-800"
            >
              Udostepnij
            </button>
            <button
              type="button"
              onClick={() => downloadTripGpx(trip)}
              disabled={trip.route.length < 2}
              className="rounded-xl bg-orange-500 px-4 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              Eksport GPX
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-800"
            >
              Zamknij
            </button>
          </div>
        </div>

        <div className="mt-5">
          <TripRoutePreview
            route={trip.route}
            interactive
            className="h-[60vh] min-h-[360px]"
          />
        </div>

        <TripMetricsGrid trip={trip} wide />

        <div className="mt-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 font-bold text-orange-300">
          +{trip.xp} XP z tej wyprawy
        </div>

        {shareStatus && (
          <div className="mt-4 rounded-2xl border border-green-500/25 bg-green-500/10 p-4 text-sm font-black text-green-300">
            {shareStatus}
          </div>
        )}
      </div>
    </div>
  );
}

function TripMetricsGrid({
  trip,
  wide = false,
}: {
  trip: FinishedTrip;
  wide?: boolean;
}) {
  return (
    <div
      className={[
        "mt-3 grid grid-cols-2 gap-2 text-zinc-200 sm:grid-cols-3",
        wide ? "lg:grid-cols-6" : "",
      ].join(" ")}
    >
      <TripMetric label="Dystans" value={`${trip.distance.toFixed(1)} km`} />
      <TripMetric label="Czas" value={`${trip.duration} min`} />
      <TripMetric
        label="Sr. predkosc"
        value={`${trip.averageSpeedKmh.toFixed(1)} km/h`}
      />
      <TripMetric label="Kafelki" value={String(trip.tiles)} />
      <TripMetric label="Miejscowosci" value={String(trip.towns)} />
      <TripMetric label="Punkty GPS" value={String(trip.route.length)} />
    </div>
  );
}

function TripMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-3">
      <div className="text-[10px] font-black uppercase text-zinc-500">
        {label}
      </div>
      <div className="mt-1 font-black text-white">{value}</div>
    </div>
  );
}

function normalizeTrips(trips: Partial<FinishedTrip>[]) {
  return trips.map((trip) => {
    const distance = safeNumber(trip.distance);
    const duration = Math.max(1, safeNumber(trip.duration, 1));

    return {
      averageSpeedKmh:
        typeof trip.averageSpeedKmh === "number" &&
        Number.isFinite(trip.averageSpeedKmh)
          ? trip.averageSpeedKmh
          : calculateAverageSpeedKmh(distance, duration),
      date: trip.date || "Brak daty",
      distance,
      duration,
      endedAt: safeNumber(trip.endedAt),
      id: trip.id || createTripId(trip.name || "Wyprawa", trip.startedAt, trip.endedAt),
      name: trip.name || "Wyprawa",
      route: Array.isArray(trip.route) ? trip.route : [],
      startedAt: safeNumber(trip.startedAt),
      tiles: safeNumber(trip.tiles),
      towns: safeNumber(trip.towns),
      voivodeships: safeNumber(trip.voivodeships),
      xp: safeNumber(trip.xp),
    };
  });
}

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function removeTripPhotosByTripId(tripId: string | undefined) {
  const tripPhotos = getJson<Record<string, string[]>>(
    STORAGE_KEYS.tripPhotos,
    {}
  );
  const nextTripPhotos = { ...tripPhotos };

  if (tripId) {
    delete nextTripPhotos[tripId];
  }

  return nextTripPhotos;
}

function migrateTripPhotosToIds(
  rawTrips: Partial<FinishedTrip>[],
  normalizedTrips: FinishedTrip[]
) {
  const tripPhotos = getJson<Record<string, string[]>>(STORAGE_KEYS.tripPhotos, {});
  const nextTripPhotos: Record<string, string[]> = {};
  let changed = false;

  Object.entries(tripPhotos).forEach(([key, photos]) => {
    if (!Array.isArray(photos)) {
      return;
    }

    if (!isNumericKey(key)) {
      nextTripPhotos[key] = [...(nextTripPhotos[key] || []), ...photos];
      return;
    }

    const index = Number(key);
    const targetTrip =
      findTripForLegacyPhotos(photos, normalizedTrips) || normalizedTrips[index];

    if (!targetTrip) {
      return;
    }

    nextTripPhotos[targetTrip.id] = [
      ...(nextTripPhotos[targetTrip.id] || []),
      ...photos,
    ];
    changed = true;
  });

  if (changed || rawTrips.some((trip) => !trip.id)) {
    setJson(STORAGE_KEYS.tripPhotos, nextTripPhotos);
  }
}

function findTripForLegacyPhotos(
  photos: string[],
  trips: FinishedTrip[]
) {
  const timestamps = photos
    .map(extractTimestampFromPhotoUrl)
    .filter((timestamp): timestamp is number => typeof timestamp === "number");

  if (timestamps.length === 0) {
    return null;
  }

  const firstPhotoTime = Math.min(...timestamps);

  return (
    trips
      .filter((trip) => trip.startedAt <= firstPhotoTime)
      .sort((a, b) => b.startedAt - a.startedAt)[0] || null
  );
}

function extractTimestampFromPhotoUrl(photoUrl: string) {
  const match = photoUrl.match(/(\d{13})-/);

  return match ? Number(match[1]) : null;
}

function isNumericKey(key: string) {
  return /^\d+$/.test(key);
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

async function shareTrip(
  trip: FinishedTrip,
  setShareStatus: (status: string) => void
) {
  const text = buildTripShareText(trip);
  const title = `MotoQuest: ${trip.name}`;

  if (navigator.share) {
    try {
      await navigator.share({
        text,
        title,
      });
      setShareStatus("Wyprawa gotowa do udostepnienia.");
      return;
    } catch {
      // User cancel or insecure browser context. Fall back to copying below.
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    setShareStatus("Podsumowanie wyprawy skopiowane do schowka.");
    return;
  } catch {
    const copied = copyTextFallback(text);

    setShareStatus(
      copied
        ? "Podsumowanie wyprawy skopiowane do schowka."
        : "Nie udalo sie skopiowac. Zaznacz tekst podsumowania recznie."
    );
  }
}

function copyTextFallback(text: string) {
  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

function buildTripShareText(trip: FinishedTrip) {
  return [
    `MotoQuest - ${trip.name}`,
    `Data: ${trip.date}`,
    `Dystans: ${trip.distance.toFixed(1)} km`,
    `Czas: ${trip.duration} min`,
    `Srednia predkosc: ${trip.averageSpeedKmh.toFixed(1)} km/h`,
    `Odkryte kafelki: ${trip.tiles}`,
    `Miejscowosci: ${trip.towns}`,
    `XP: +${trip.xp}`,
  ].join("\n");
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
