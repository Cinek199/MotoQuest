"use client";

import { useEffect, useState } from "react";

export default function TownsPanel() {
  const [towns, setTowns] = useState<string[]>([]);

  useEffect(() => {
    const update = () => {
      const saved = JSON.parse(
        localStorage.getItem("mq_towns") || "[]"
      );

      setTowns(saved);
    };

    update();

    const interval = setInterval(
      update,
      1000
    );

    return () =>
      clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
      <h2 className="text-xl font-bold mb-4">
        🏘️ Odkryte miejscowości
      </h2>

      <div className="max-h-[300px] overflow-y-auto space-y-2">

        {towns.length === 0 && (
          <div className="text-zinc-500">
            Brak odkrytych miejscowości
          </div>
        )}

        {towns.map((town) => (
          <div
            key={town}
            className="bg-zinc-800 rounded-xl p-3"
          >
            {town}
          </div>
        ))}

      </div>
    </div>
  );
}