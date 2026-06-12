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
    <div className="overflow-hidden rounded-[2rem] border border-orange-500/20 bg-zinc-950 shadow-2xl shadow-black/40">
      <div className="border-b border-zinc-800 bg-black/35 px-5 py-4">
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">
          Status
        </div>
        <h2 className="mt-1 text-2xl font-black text-white">Aktywny motocykl</h2>
      </div>

      <div className="p-5">
        {!bike ? (
        <div className="rounded-[1.75rem] border border-zinc-800 bg-black/45 p-5 text-zinc-500">
          Dodaj motocykl w garażu, żeby przypisywać do niego przebieg.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] border border-orange-500/40 bg-black shadow-xl shadow-orange-500/10">
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
      <div className="text-[10px] font-black uppercase text-zinc-500">
        {label}
      </div>
      <div className="mt-1 font-black text-orange-500">{value}</div>
    </div>
  );
}
