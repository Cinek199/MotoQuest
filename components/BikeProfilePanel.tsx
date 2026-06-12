"use client";

import { useEffect, useState } from "react";

import { Bike, getActiveBike } from "../lib/garage";

export default function BikeProfilePanel() {
  const [bike, setBike] = useState<Bike | null>(null);

  useEffect(() => {
    const loadBike = () => {
      setBike(getActiveBike());
    };

    loadBike();

    const interval = setInterval(loadBike, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="mb-4 text-xl font-bold">Aktywny motocykl</h2>

      {!bike ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-500">
          Dodaj motocykl w garażu, żeby przypisywać do niego przebieg.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-orange-500/40 bg-zinc-950">
          {bike.imageUrl && (
            <img src={bike.imageUrl} alt="" className="h-48 w-full object-cover" />
          )}

          <div className="p-5">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
              Główny motocykl
            </div>
            <div className="mt-2 text-3xl font-black text-white">
              {bike.brand} {bike.model}
            </div>
            <div className="mt-2 text-zinc-400">
              {bike.year || "Brak rocznika"} · {bike.engine || "Brak pojemności"}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <BikeMetric label="Przebieg" value={`${bike.totalDistanceKm.toFixed(1)} km`} />
              <BikeMetric label="Status" value="Aktywny" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BikeMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-900 p-3">
      <div className="text-[10px] font-bold uppercase text-zinc-500">
        {label}
      </div>
      <div className="mt-1 font-black text-orange-500">{value}</div>
    </div>
  );
}
