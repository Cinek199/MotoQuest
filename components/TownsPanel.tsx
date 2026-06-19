"use client";

import { useEffect, useMemo, useState } from "react";

export default function TownsPanel() {
  const [towns, setTowns] = useState<string[]>([]);

  useEffect(() => {
    const update = () => {
      try {
        setTowns(JSON.parse(localStorage.getItem("mq_towns") || "[]"));
      } catch {
        setTowns([]);
      }
    };

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, []);

  const latestTowns = useMemo(() => towns.slice(-1), [towns]);
  const nextMilestone = getNextMilestone(towns.length);
  const milestonePercent = Math.min(
    100,
    Math.round((towns.length / nextMilestone) * 100)
  );

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#08090b] shadow-2xl shadow-black/50">
      <div className="relative overflow-hidden border-b border-white/10 px-5 py-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_44%),linear-gradient(135deg,rgba(24,24,27,0.9),rgba(0,0,0,0.35))]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.36em] text-orange-500">
              Odkrycia
            </div>
            <h2 className="mt-1 text-2xl font-black text-white">
              Miejscowosci
            </h2>
            <p className="mt-1 text-sm font-semibold text-zinc-400">
              Lista miejsc odwiedzonych podczas jazdy.
            </p>
          </div>

          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-right">
            <div className="text-2xl font-black text-sky-300">
              {towns.length}
            </div>
            <div className="text-[10px] font-black uppercase text-zinc-500">
              odkryte
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="rounded-[1.5rem] border border-white/10 bg-black/45 p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Nastepny prog
              </div>
              <div className="mt-1 text-3xl font-black text-orange-400">
                {towns.length}/{nextMilestone}
              </div>
            </div>

            <div className="text-right text-sm font-black text-zinc-300">
              {milestonePercent}%
            </div>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-orange-500 to-lime-400 transition-all"
              style={{
                width: `${milestonePercent}%`,
              }}
            />
          </div>
        </div>

        {latestTowns.length > 0 && (
          <div className="grid gap-2">
            {latestTowns.map((town) => (
              <div
                key={`latest-${town}`}
                className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3"
              >
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-300">
                  Ostatnio
                </div>
                <div className="mt-1 truncate font-black text-white">{town}</div>
              </div>
            ))}
          </div>
        )}

        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
          {towns.length === 0 && (
            <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/35 px-5 py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/10 text-xl font-black text-sky-300">
                0
              </div>
              <div className="mt-4 text-lg font-black text-white">
                Brak odkrytych miejscowosci
              </div>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                Rusz w trase, a odwiedzone miejsca pojawia sie tutaj.
              </p>
            </div>
          )}

          {towns.map((town, index) => (
            <div
              key={`${town}-${index}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-950 text-xs font-black text-zinc-400">
                  {index + 1}
                </div>
                <span className="min-w-0 truncate font-black text-white">
                  {town}
                </span>
              </div>

              <span className="shrink-0 rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-sky-300">
                Town
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getNextMilestone(count: number) {
  if (count < 10) {
    return 10;
  }

  if (count < 50) {
    return 50;
  }

  if (count < 100) {
    return 100;
  }

  return Math.ceil((count + 1) / 100) * 100;
}
