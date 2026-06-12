"use client";

import { useEffect, useState } from "react";

const ALL_VOIVODESHIPS = [
  "Dolnośląskie",
  "Kujawsko-Pomorskie",
  "Lubelskie",
  "Lubuskie",
  "Łódzkie",
  "Małopolskie",
  "Mazowieckie",
  "Opolskie",
  "Podkarpackie",
  "Podlaskie",
  "Pomorskie",
  "Śląskie",
  "Świętokrzyskie",
  "Warmińsko-Mazurskie",
  "Wielkopolskie",
  "Zachodniopomorskie",
];

export default function VoivodeshipPanel() {
  const [discovered, setDiscovered] = useState<string[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("mq_voivodeships") || "[]");

    setDiscovered(data);
  }, []);

  const percent = Math.round((discovered.length / ALL_VOIVODESHIPS.length) * 100);

  return (
    <div className="min-h-[420px] overflow-hidden rounded-[2rem] border border-orange-500/20 bg-zinc-950 shadow-2xl shadow-black/40">
      <div className="border-b border-zinc-800 bg-black/35 px-5 py-4">
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">
          Regiony
        </div>
        <h2 className="mt-1 text-2xl font-black text-white">Województwa</h2>
      </div>

      <div className="p-5">
        <div className="mb-4 rounded-[1.5rem] border border-zinc-800 bg-black/45 p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Odkryte
              </div>
              <div className="mt-1 text-4xl font-black text-orange-500">
                {discovered.length}/16
              </div>
            </div>

            <div className="text-2xl font-black text-white">{percent}%</div>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-orange-500 transition-all"
              style={{
                width: `${percent}%`,
              }}
            />
          </div>
        </div>

        <div className="h-[350px] space-y-2 overflow-y-auto pr-1">
          {ALL_VOIVODESHIPS.map((voivodeship) => {
            const unlocked = discovered.includes(voivodeship);

            return (
              <div
                key={voivodeship}
                className={[
                  "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm",
                  unlocked
                    ? "border-orange-500/30 bg-orange-500/10 text-white"
                    : "border-zinc-800 bg-black/45 text-zinc-500",
                ].join(" ")}
              >
                <span className="font-bold">{voivodeship}</span>
                <span
                  className={[
                    "h-2.5 w-2.5 rounded-full",
                    unlocked ? "bg-orange-500" : "bg-zinc-700",
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
