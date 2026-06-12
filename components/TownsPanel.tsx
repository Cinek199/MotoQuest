"use client";

import { useEffect, useState } from "react";

export default function TownsPanel() {
  const [towns, setTowns] = useState<string[]>([]);

  useEffect(() => {
    const update = () => {
      const saved = JSON.parse(localStorage.getItem("mq_towns") || "[]");

      setTowns(saved);
    };

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-orange-500/20 bg-zinc-950 shadow-2xl shadow-black/40">
      <div className="border-b border-zinc-800 bg-black/35 px-5 py-4">
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">
          Odkrycia
        </div>
        <div className="mt-1 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black text-white">Miejscowości</h2>
          <div className="text-right">
            <div className="text-2xl font-black text-orange-500">
              {towns.length}
            </div>
            <div className="text-[10px] font-black uppercase text-zinc-500">
              odkryte
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-[420px] space-y-2 overflow-y-auto p-5">
        {towns.length === 0 && (
          <div className="rounded-[1.5rem] border border-zinc-800 bg-black/45 p-5 text-zinc-500">
            Brak odkrytych miejscowości
          </div>
        )}

        {towns.map((town, index) => (
          <div
            key={town}
            className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-black/45 px-4 py-3"
          >
            <span className="min-w-0 truncate font-bold text-white">{town}</span>
            <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs font-black text-zinc-400">
              {index + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
