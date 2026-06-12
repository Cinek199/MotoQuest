"use client";

type MapHudProps = {
  currentTown: string;
  currentVoivodeship: string;
  distanceKm: number;
  discoveredAreaKm2: number;
  tilesCount: number;
};

export default function MapHud({
  currentTown,
  currentVoivodeship,
  distanceKm,
  discoveredAreaKm2,
  tilesCount,
}: MapHudProps) {
  return (
    <>
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-20 sm:left-5 sm:right-5 sm:top-5">
        <section className="rounded-3xl border border-orange-500/25 bg-black/60 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-500">
                MotoQuest
              </div>
              <h1 className="mt-1 text-2xl font-black text-white sm:text-4xl">
                Odkrywaj Polskę
              </h1>
              <div className="mt-2 truncate text-sm text-zinc-300 sm:text-base">
                {currentTown} · {currentVoivodeship}
              </div>
            </div>

            <div className="shrink-0 rounded-2xl border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-right">
              <div className="text-[10px] font-bold uppercase text-zinc-500">
                Przebieg
              </div>
              <div className="mt-1 text-xl font-black text-orange-500 sm:text-2xl">
                {distanceKm.toFixed(1)} km
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-3 right-3 z-20 sm:bottom-5 sm:left-5 sm:right-5">
        <section className="grid grid-cols-2 gap-3 rounded-3xl border border-zinc-700/80 bg-black/65 p-3 shadow-2xl backdrop-blur-xl sm:grid-cols-4 sm:p-4">
          <MapHudStat label="Kafelki" value={String(tilesCount)} />
          <MapHudStat
            label="Powierzchnia"
            value={`${discoveredAreaKm2.toFixed(1)} km²`}
          />
          <MapHudStat label="Miasto" value={currentTown} />
          <MapHudStat label="Województwo" value={currentVoivodeship} />
        </section>
      </div>
    </>
  );
}

function MapHudStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/75 p-3">
      <div className="text-[10px] font-bold uppercase text-zinc-500">
        {label}
      </div>
      <div className="mt-1 truncate text-base font-black text-white">
        {value}
      </div>
    </div>
  );
}
