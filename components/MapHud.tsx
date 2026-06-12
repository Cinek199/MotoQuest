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
  const explorationLevel = Math.min(100, Math.round((tilesCount / 500) * 100));
  const gpsReady = currentTown !== "Ladowanie..." && currentTown !== "Nieznana";

  return (
    <>
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-500/35 bg-black/80 text-sm font-black text-orange-500 shadow-2xl backdrop-blur-xl">
            MQ
          </div>

          <div className="min-w-0 flex-1 text-center">
            <div className="text-xl font-black leading-none text-white">
              Moto<span className="text-orange-500">Quest</span>
            </div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">
              mapa odkrywania
            </div>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-black/80 text-zinc-300 shadow-2xl backdrop-blur-xl">
            <span className="h-4 w-4 rounded-full border-2 border-current" />
          </div>
        </div>

        <section className="mt-4 overflow-hidden rounded-[1.6rem] border border-zinc-700/80 bg-black/78 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-orange-500/35 bg-orange-500/10">
              <span className="h-4 w-4 rounded-sm border border-orange-400" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Odkrywasz
              </div>
              <div className="truncate text-sm font-black text-white">
                {currentVoivodeship}
              </div>
            </div>

            <div className="w-24">
              <div className="mb-1 text-right text-[10px] font-black text-green-400">
                {explorationLevel}%
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${explorationLevel}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="pointer-events-none absolute right-3 top-[180px] z-20 flex flex-col gap-3">
        <HudRoundButton active={gpsReady} label="GPS" />
        <HudRoundButton label="WAR" />
        <div className="overflow-hidden rounded-full border border-zinc-700 bg-black/80 shadow-2xl backdrop-blur-xl">
          <HudZoomButton label="+" />
          <div className="h-px bg-zinc-800" />
          <HudZoomButton label="-" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-24 z-20 sm:bottom-6">
        <section className="overflow-hidden rounded-[1.7rem] border border-orange-500/35 bg-black/80 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-3 divide-x divide-zinc-800">
            <MapHudStat label="km" value={distanceKm.toFixed(1)} />
            <MapHudStat label="kafelki" value={String(tilesCount)} />
            <MapHudStat label="obszar" value={discoveredAreaKm2.toFixed(1)} />
          </div>

          <div className="border-t border-zinc-800 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-white">
                  {currentTown}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  aktualna pozycja
                </div>
              </div>
              <div className="rounded-full border border-orange-500/35 bg-orange-500/10 px-4 py-2 text-xs font-black text-orange-400">
                Gotowy do trasy
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function HudRoundButton({
  active = false,
  label,
}: {
  active?: boolean;
  label: string;
}) {
  return (
    <div
      className={[
        "grid h-12 w-12 place-items-center rounded-full border bg-black/80 text-[10px] font-black shadow-2xl backdrop-blur-xl",
        active
          ? "border-green-500/45 text-green-400"
          : "border-zinc-700 text-zinc-300",
      ].join(" ")}
    >
      {label}
    </div>
  );
}

function HudZoomButton({ label }: { label: string }) {
  return (
    <div className="grid h-11 w-12 place-items-center text-xl font-black text-white">
      {label}
    </div>
  );
}

function MapHudStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 p-3 text-center">
      <div className="truncate text-lg font-black text-white">{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
        {label}
      </div>
    </div>
  );
}
