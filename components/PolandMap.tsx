"use client";

import { useEffect, useMemo, useState } from "react";

const HEX_MAP = [
  ["Zachodniopomorskie", "Pomorskie", "Warminsko-Mazurskie"],
  ["Lubuskie", "Wielkopolskie", "Kujawsko-Pomorskie", "Podlaskie"],
  ["Dolnoslaskie", "Opolskie", "Lodzkie", "Mazowieckie"],
  ["Slaskie", "Swietokrzyskie", "Lubelskie"],
  ["Malopolskie", "Podkarpackie"],
];

export default function PolandMap() {
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [selectedVoivodeship, setSelectedVoivodeship] = useState<string | null>(
    null
  );

  useEffect(() => {
    const loadVoivodeships = () => {
      try {
        setDiscovered(JSON.parse(localStorage.getItem("mq_voivodeships") || "[]"));
      } catch {
        setDiscovered([]);
      }
    };

    loadVoivodeships();
    window.addEventListener("mq-voivodeships-updated", loadVoivodeships);

    return () => {
      window.removeEventListener("mq-voivodeships-updated", loadVoivodeships);
    };
  }, []);

  const discoveredKeys = useMemo(() => {
    return new Set(discovered.map(normalizeName));
  }, [discovered]);
  const discoveredCount = HEX_MAP.flat().filter((voivodeship) => {
    return discoveredKeys.has(normalizeName(voivodeship));
  }).length;
  const percent = Math.round((discoveredCount / 16) * 100);
  const selectedUnlocked = selectedVoivodeship
    ? discoveredKeys.has(normalizeName(selectedVoivodeship))
    : false;

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#08090b] p-5 shadow-2xl shadow-black/50">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.36em] text-orange-500">
            Mapa Polski
          </div>
          <h2 className="mt-1 text-2xl font-black text-white">Hex odkryc</h2>
        </div>

        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-right">
          <div className="text-2xl font-black text-orange-400">{percent}%</div>
          <div className="text-[10px] font-black uppercase text-zinc-500">
            kraju
          </div>
        </div>
      </div>

      <div className="mb-6 h-3 overflow-hidden rounded-full bg-zinc-900">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-lime-400 transition-all"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>

      <div className="flex flex-col items-center gap-2 overflow-x-auto pb-1">
        {HEX_MAP.map((row, rowIndex) => (
          <div
            key={row.join("-")}
            className={`flex gap-2 ${rowIndex % 2 ? "ml-10" : ""}`}
          >
            {row.map((voivodeship) => {
              const unlocked = discoveredKeys.has(normalizeName(voivodeship));

              return (
                <button
                  key={voivodeship}
                  type="button"
                  onClick={() => setSelectedVoivodeship(voivodeship)}
                  title={voivodeship}
                  className={[
                    "relative flex h-20 w-20 items-center justify-center px-2 text-center text-[10px] font-black transition hover:scale-105",
                    unlocked ? "text-black" : "text-zinc-500",
                  ].join(" ")}
                  style={{
                    background: unlocked ? "#f97316" : "#27272a",
                    clipPath:
                      "polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)",
                  }}
                >
                  {shortenName(voivodeship)}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-6 text-center text-sm font-bold text-zinc-400">
        Odkryto{" "}
        <span className="font-black text-orange-400">{discoveredCount}</span> z
        16 wojewodztw
      </div>

      {selectedVoivodeship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur">
          <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-500">
              Wojewodztwo
            </div>
            <h3 className="mt-2 text-3xl font-black text-white">
              {selectedVoivodeship}
            </h3>

            <div
              className={[
                "mt-5 rounded-2xl border px-4 py-3 font-black",
                selectedUnlocked
                  ? "border-green-500/30 bg-green-500/10 text-green-300"
                  : "border-white/10 bg-black/45 text-zinc-400",
              ].join(" ")}
            >
              {selectedUnlocked ? "Odkryte" : "Nieodkryte"}
            </div>

            <button
              type="button"
              onClick={() => setSelectedVoivodeship(null)}
              className="mt-5 w-full rounded-2xl bg-orange-500 py-3 font-black text-black transition hover:bg-orange-400"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
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

function shortenName(value: string) {
  return value
    .replace("Warminsko-", "Warm. ")
    .replace("Kujawsko-", "Kuj. ")
    .replace("Zachodniopomorskie", "Zach. Pom.")
    .replace("Swietokrzyskie", "Swietokr.");
}
