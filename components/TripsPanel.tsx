"use client";

import { useEffect, useState } from "react";

import { unlockAchievement } from "../lib/achievements";
import { downloadTripGpx } from "../lib/gpx";
import { savePlayer } from "../lib/playerService";
import { supabase } from "../lib/supabase";
import {
  getJson,
  getNumber,
  setJson,
  STORAGE_KEYS,
} from "../lib/storage";
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
      setActiveTrip(getActiveTrip());
      setTrips(getJson<FinishedTrip[]>(STORAGE_KEYS.trips, []));
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
      name: latestActiveTrip.name,
      date: new Date(endedAt).toLocaleDateString("pl-PL"),
      startedAt: latestActiveTrip.startedAt,
      endedAt,
      distance,
      duration,
      averageSpeedKmh: calculateAverageSpeedKmh(distance, duration),
      route: latestActiveTrip.route,
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await savePlayer(user.id);
    }

    setTrips(nextTrips);
    setActiveTrip(null);
  };

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="mb-4 text-xl font-bold">Wyprawa</h2>

      {!activeTrip ? (
        <div className="space-y-3">
          <input
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            placeholder="Np. Tatry Weekend"
            className="w-full rounded-xl bg-zinc-800 px-3 py-3"
          />

          <button
            onClick={startTrip}
            className="w-full rounded-xl bg-orange-500 py-3 font-bold text-black hover:bg-orange-600"
          >
            Rozpocznij wyprawę
          </button>
        </div>
      ) : (
        <ActiveTripCard activeTrip={activeTrip} onEndTrip={endTrip} />
      )}

      {trips.length > 0 && (
        <div className="mt-5 space-y-3">
          <h3 className="font-bold">Historia wypraw</h3>

          {trips.slice(0, 10).map((trip, index) => (
            <FinishedTripCard
              key={`${trip.startedAt}-${index}`}
              trip={trip}
              index={index}
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
      <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
        <div className="text-sm font-bold uppercase text-green-400">
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
        className="w-full rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-700"
      >
        Zakończ wyprawę
      </button>
    </div>
  );
}

function FinishedTripCard({
  onOpenDetails,
  trip,
  index,
}: {
  onOpenDetails: () => void;
  trip: FinishedTrip;
  index: number;
}) {
  const coverPhoto = getJson<Record<number, string[]>>(
    STORAGE_KEYS.tripPhotos,
    {}
  )[index]?.[0];

  return (
    <article className="rounded-xl bg-zinc-800 p-3 text-sm">
      {coverPhoto && (
        <img
          src={coverPhoto}
          alt=""
          className="mb-3 h-40 w-full rounded-xl object-cover"
        />
      )}

      <div className="text-lg font-bold text-orange-500">{trip.name}</div>
      <div className="mt-1 text-zinc-400">{trip.date}</div>

      <div className="mt-3">
        <TripRoutePreview route={trip.route} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-zinc-200 sm:grid-cols-3">
        <TripMetric label="Dystans" value={`${trip.distance.toFixed(1)} km`} />
        <TripMetric label="Czas" value={`${trip.duration} min`} />
        <TripMetric
          label="Śr. prędkość"
          value={`${trip.averageSpeedKmh.toFixed(1)} km/h`}
        />
        <TripMetric label="Kafelki" value={String(trip.tiles)} />
        <TripMetric label="Miejscowości" value={String(trip.towns)} />
        <TripMetric label="Punkty GPS" value={String(trip.route.length)} />
      </div>

      <div className="mt-3 rounded-lg border border-orange-500/20 bg-black/20 px-3 py-2 font-bold text-orange-500">
        +{trip.xp} XP z wyprawy
      </div>

      <button
        type="button"
        onClick={onOpenDetails}
        className="mt-3 w-full rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 font-bold text-orange-400 hover:bg-orange-500 hover:text-black"
      >
        Szczegóły trasy
      </button>

      <TripPhotosPanel tripIndex={index} />
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
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 p-4 backdrop-blur">
      <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
              Szczegóły wyprawy
            </div>
            <h2 className="mt-2 text-3xl font-black text-white">{trip.name}</h2>
            <div className="mt-1 text-zinc-400">{trip.date}</div>
          </div>

          <div className="flex gap-2">
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

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <TripMetric label="Dystans" value={`${trip.distance.toFixed(1)} km`} />
          <TripMetric label="Czas" value={`${trip.duration} min`} />
          <TripMetric
            label="Śr. prędkość"
            value={`${trip.averageSpeedKmh.toFixed(1)} km/h`}
          />
          <TripMetric label="Kafelki" value={String(trip.tiles)} />
          <TripMetric label="Miejscowości" value={String(trip.towns)} />
          <TripMetric label="Punkty GPS" value={String(trip.route.length)} />
        </div>

        <div className="mt-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 font-bold text-orange-300">
          +{trip.xp} XP z tej wyprawy
        </div>
      </div>
    </div>
  );
}

function TripMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-zinc-900 px-3 py-2">
      <div className="text-[10px] font-bold uppercase text-zinc-500">
        {label}
      </div>
      <div className="mt-1 font-bold text-white">{value}</div>
    </div>
  );
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
