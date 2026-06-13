"use client";

import { useEffect, useMemo, useState } from "react";

const ALL_VOIVODESHIPS = [
  "Dolnoslaskie",
  "Kujawsko-Pomorskie",
  "Lubelskie",
  "Lubuskie",
  "Lodzkie",
  "Malopolskie",
  "Mazowieckie",
  "Opolskie",
  "Podkarpackie",
  "Podlaskie",
  "Pomorskie",
  "Slaskie",
  "Swietokrzyskie",
  "Warminsko-Mazurskie",
  "Wielkopolskie",
  "Zachodniopomorskie",
];

export default function VoivodeshipPanel() {
  const [discovered, setDiscovered] = useState<string[]>([]);

  useEffect(() => {
    const update = () => {
      try {
        setDiscovered(JSON.parse(localStorage.getItem("mq_voivodeships") || "[]"));
      } catch {
        setDiscovered([]);
      }
    };

    update();

    window.addEventListener("mq-voivodeships-updated", update);

    const interval = setInterval(update, 1500);

    return () => {
      window.removeEventListener("mq-voivodeships-updated", update);
      clearInterval(interval);
    };
  }, []);

  const discoveredKeys = useMemo(() => {
    return new Set(discovered.map(normalizeName));
  }, [discovered]);
  const discoveredCount = ALL_VOIVODESHIPS.filter((voivodeship) => {
    return discoveredKeys.has(normalizeName(voivodeship));
  }).length;
  const percent = Math.round((discoveredCount / ALL_VOIVODESHIPS.length) * 100);

  return (
    <div className="min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#08090b] shadow-2xl shadow-black/50">
      <div className="relative overflow-hidden border-b border-white/10 px-5 py-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_42%),linear-gradient(135deg,rgba(24,24,27,0.9),rgba(0,0,0,0.35))]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.36em] text-orange-500">
              Regiony
            </div>
            <h2 className="mt-1 text-2xl font-black text-white">
              Wojewodztwa
            </h2>
            <p className="mt-1 text-sm font-semibold text-zinc-400">
              Odkrywaj kolejne obszary Polski.
            </p>
          </div>

          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-right">
            <div className="text-2xl font-black text-green-300">{percent}%</div>
            <div className="text-[10px] font-black uppercase text-zinc-500">
              kraju
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="rounded-[1.5rem] border border-white/10 bg-black/45 p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Odkryte regiony
              </div>
              <div className="mt-1 text-4xl font-black text-orange-400">
                {discoveredCount}/16
              </div>
            </div>

            <div className="rounded-2xl border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-sm font-black text-orange-300">
              Korona Polski
            </div>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-lime-400 transition-all"
              style={{
                width: `${percent}%`,
              }}
            />
          </div>
        </div>

        <div className="max-h-[350px] space-y-2 overflow-y-auto pr-1">
          {ALL_VOIVODESHIPS.map((voivodeship, index) => {
            const unlocked = discoveredKeys.has(normalizeName(voivodeship));

            return (
              <div
                key={voivodeship}
                className={[
                  "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                  unlocked
                    ? "border-green-500/30 bg-green-500/10 text-white"
                    : "border-white/10 bg-black/45 text-zinc-500",
                ].join(" ")}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={[
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-black",
                      unlocked
                        ? "border-green-500/40 bg-green-500 text-black"
                        : "border-white/10 bg-zinc-950 text-zinc-500",
                    ].join(" ")}
                  >
                    {unlocked ? "OK" : index + 1}
                  </div>
                  <span className="min-w-0 truncate font-black">
                    {voivodeship}
                  </span>
                </div>

                <span
                  className={[
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    unlocked ? "bg-green-400" : "bg-zinc-700",
                  ].join(" ")}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/gi, "l")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}
