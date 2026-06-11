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
  const [discovered, setDiscovered] =
    useState<string[]>([]);

  useEffect(() => {
    const data = JSON.parse(
      localStorage.getItem(
        "mq_voivodeships"
      ) || "[]"
    );

    setDiscovered(data);
  }, []);

  const percent = Math.round(
    (discovered.length / 16) * 100
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 min-h-[420px]">

      <h2 className="text-xl font-bold mb-4">
        🗺️ Województwa
      </h2>

      <div className="flex items-center justify-between mb-3">

        <div className="text-4xl font-bold text-orange-500">
          {discovered.length}/16
        </div>

        <div className="text-zinc-400">
          {percent}%
        </div>

      </div>

      <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden mb-4">

        <div
          className="h-full bg-orange-500"
          style={{
            width: `${percent}%`,
          }}
        />

      </div>

      <div className="space-y-1 h-[350px] overflow-y-auto">

        {ALL_VOIVODESHIPS.map(
          (voivodeship) => {
            const unlocked =
              discovered.includes(
                voivodeship
              );

            return (
              <div
                key={voivodeship}
                className="flex justify-between text-sm bg-zinc-800 rounded-lg px-3 py-2"
              >
                <span>
                  {voivodeship}
                </span>

                <span>
                  {unlocked
                    ? "✅"
                    : "⬜"}
                </span>
              </div>
            );
          }
        )}

      </div>

    </div>
  );
}