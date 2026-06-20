"use client";

import { useEffect, useState } from "react";

import { downloadTripGpx } from "../lib/gpx";
import { formatDiscoveredArea } from "../lib/explorationProgress";
import { savePlayer } from "../lib/playerService";
import { supabase } from "../lib/supabase";
import { getJson, getNumber, setJson, STORAGE_KEYS } from "../lib/storage";
import {
  ActiveTrip,
  calculateAverageSpeedKmh,
  FinishedTrip,
  finishActiveTrip,
  getActiveTrip,
  saveActiveTrip,
} from "../lib/trips";
import TripPhotosPanel from "./TripPhotosPanel";
import TripRoutePreview from "./TripRoutePreview";

export default function TripsPanel() {
  const [filter, setFilter] = useState("Wszystkie");
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<FinishedTrip | null>(null);
  const [trips, setTrips] = useState<FinishedTrip[]>([]);
  const [tripName, setTripName] = useState("");
  const visibleTrips = filter === "Aktywne" ? [] : trips;

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
    const result = finishActiveTrip();

    if (!result) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await savePlayer(user.id);
    }

    setTrips(normalizeTrips(result.nextTrips));
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
    <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#08090b] shadow-2xl shadow-black/50">
      <div className="space-y-4 p-3 sm:p-4">
        <SegmentedTabs active={filter} labels={["Wszystkie", "Aktywne", "Zakonczone"]} onChange={setFilter} />

        {filter !== "Zakonczone" && (!activeTrip ? (
          <div className="rounded-[1.4rem] border border-white/10 bg-zinc-950/80 p-3 shadow-xl shadow-black/20">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
                  Nowa trasa
                </div>
                <div className="mt-1 text-lg font-black text-white">
                  Rozpocznij wyprawe
                </div>
              </div>
              <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[11px] font-black text-green-300">
                GPS ready
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="Np. Tatry Weekend"
                className="min-h-14 w-full rounded-2xl border border-white/10 bg-black/60 px-4 font-bold text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
              />

              <button
                onClick={startTrip}
                className="min-h-14 rounded-2xl bg-orange-500 px-6 font-black text-black shadow-lg shadow-orange-500/20 transition hover:bg-orange-400"
              >
                Start
              </button>
            </div>
          </div>
        ) : (
          <ActiveTripCard activeTrip={activeTrip} onEndTrip={endTrip} />
        ))}

        {filter !== "Aktywne" && <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <h3 className="text-lg font-black text-white">Historia wypraw</h3>
              <p className="text-xs font-semibold text-zinc-500">
                Ostatnie zapisane trasy i galerie.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-black px-3 py-1 text-xs font-black text-zinc-300">
              {trips.length}
            </span>
          </div>

          {visibleTrips.length > 0 ? (
            visibleTrips.slice(0, 10).map((trip, index) => (
              <FinishedTripCard
                key={`${trip.startedAt}-${index}`}
                trip={trip}
                index={index}
                onDelete={() => deleteTrip(index)}
                onOpenDetails={() => setSelectedTrip(trip)}
              />
            ))
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-black/35 px-5 py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 text-xl font-black text-orange-400">
                0
              </div>
              <div className="mt-4 text-lg font-black text-white">
                Brak zapisanych wypraw
              </div>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                Nazwij trase i ruszaj, a pierwsza karta pojawi sie tutaj.
              </p>
            </div>
          )}
        </div>}

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

function SegmentedTabs({ active, labels, onChange }: { active: string; labels: string[]; onChange: (label: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-black/45 p-1">
      {labels.map((label, index) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(label)}
          className={[
            "min-h-10 rounded-xl px-2 text-[11px] font-black transition",
            active === label
              ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20"
              : "text-zinc-400 hover:text-white",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
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
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, []);

  const durationTime = formatRecordingTime(
    Math.max(0, Math.floor((now - activeTrip.startedAt) / 1000))
  );

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-green-500/25 bg-zinc-950 shadow-xl shadow-black/30">
      <div className="relative p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.22),transparent_42%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-green-300">
              <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_18px_rgba(34,197,94,0.9)]" />
              Nagrywanie
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {activeTrip.name}
            </div>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              Punkty GPS dopisuja sie podczas jazdy.
            </p>
          </div>

          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-center">
            <div className="text-[10px] font-black uppercase text-green-300">
              Czas
            </div>
            <div className="text-lg font-black text-white">
              {durationTime}
            </div>
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-2 gap-2">
          <TripMetric label="Czas trasy" value={durationTime} />
          <TripMetric label="Punkty GPS" value={String(activeTrip.route.length)} />
        </div>
      </div>

      <button
        onClick={onEndTrip}
        className="w-full border-t border-red-500/20 bg-red-600/90 py-4 font-black text-white transition hover:bg-red-500"
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
    <article className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950 text-sm shadow-xl shadow-black/25 transition hover:border-orange-500/35">
      <div className="relative min-h-36 overflow-hidden bg-black">
        {coverPhoto ? (
          <img src={coverPhoto} alt="" className="h-44 w-full object-cover" />
        ) : (
          <TripRoutePreview route={trip.route} className="h-44 rounded-none border-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-400">
              Wyprawa #{index + 1}
            </div>
            <div className="mt-1 text-2xl font-black leading-tight text-white">
              {trip.name}
            </div>
            <div className="mt-1 text-xs font-bold text-zinc-300">
              {trip.date}
            </div>
          </div>

          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/15 px-3 py-2 text-right backdrop-blur">
            <div className="text-[10px] font-black uppercase text-orange-300">
              XP
            </div>
            <div className="text-lg font-black text-white">+{trip.xp}</div>
          </div>
        </div>
      </div>

      {coverPhoto && (
        <div className="px-3 pt-3">
          <TripRoutePreview route={trip.route} className="h-36" />
        </div>
      )}

      <div className="p-3">
        <TripMetricsGrid trip={trip} />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenDetails}
            className="rounded-2xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 font-black text-orange-300 transition hover:bg-orange-500 hover:text-black"
          >
            Szczegoly
          </button>

          <button
            type="button"
            onClick={() => shareTrip(trip, setShareStatus)}
            className="rounded-2xl border border-white/10 bg-black px-4 py-3 font-black text-zinc-200 transition hover:border-orange-500 hover:text-orange-300"
          >
            Udostepnij
          </button>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="mt-2 w-full rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 font-black text-red-300 transition hover:bg-red-600 hover:text-white"
        >
          Usun wyprawe
        </button>

        {shareStatus && (
          <div className="mt-2 rounded-2xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-xs font-black text-green-300">
            {shareStatus}
          </div>
        )}

        <TripPhotosPanel tripId={trip.id} />
      </div>
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
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/90 p-4 backdrop-blur">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#08090b] shadow-2xl">
        <div className="relative p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_44%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-500">
              Szczegoly wyprawy
            </div>
            <h2 className="mt-2 text-3xl font-black text-white">{trip.name}</h2>
            <div className="mt-1 text-sm font-bold text-zinc-400">{trip.date}</div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => shareTrip(trip, setShareStatus)}
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-black text-white hover:border-orange-500/50"
            >
              Udostepnij
            </button>
            <button
              type="button"
              onClick={() => downloadTripGpx(trip)}
              disabled={trip.route.length < 2}
              className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              GPX
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-black text-white hover:border-orange-500/50"
            >
              Zamknij
            </button>
          </div>
        </div>
        </div>

        <div className="px-5 pb-5">
          <TripRoutePreview
            route={trip.route}
            interactive
            className="h-[55vh] min-h-[320px]"
          />

          <TripMetricsGrid trip={trip} wide />

          <div className="mt-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 font-black text-orange-300">
            +{trip.xp} XP z tej wyprawy
          </div>

          {shareStatus && (
            <div className="mt-4 rounded-2xl border border-green-500/25 bg-green-500/10 p-4 text-sm font-black text-green-300">
              {shareStatus}
            </div>
          )}
        </div>
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
      <TripMetric label="Obszar" value={formatDiscoveredArea(trip.tiles)} />
      <TripMetric label="Miejscowosci" value={String(trip.towns)} />
      <TripMetric label="Punkty GPS" value={String(trip.route.length)} />
    </div>
  );
}

function TripMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/45 px-3 py-3">
      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 truncate font-black text-white">{value}</div>
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

function formatRecordingTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
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
    `Odkryty obszar: ${formatDiscoveredArea(trip.tiles)}`,
    `Miejscowosci: ${trip.towns}`,
    `XP: +${trip.xp}`,
  ].join("\n");
}
