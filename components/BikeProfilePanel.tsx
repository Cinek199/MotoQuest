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
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#08090b] shadow-2xl shadow-black/50">
      <div className="relative overflow-hidden border-b border-white/10 px-5 py-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.2),transparent_42%),linear-gradient(135deg,rgba(24,24,27,0.9),rgba(0,0,0,0.35))]" />
        <div className="relative">
          <div className="text-[10px] font-black uppercase tracking-[0.36em] text-orange-500">
            Status
          </div>
          <h2 className="mt-1 text-2xl font-black text-white">
            Aktywny motocykl
          </h2>
          <p className="mt-1 text-sm font-semibold text-zinc-400">
            Maszyna przypisana do przebiegu i wypraw.
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {!bike ? (
          <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-black/35 px-5 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 text-xl font-black text-orange-400">
              M
            </div>
            <div className="mt-4 text-lg font-black text-white">
              Brak aktywnego motocykla
            </div>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              Dodaj motocykl w garazu, zeby przypisywac do niego przebieg.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.75rem] border border-orange-500/35 bg-black shadow-xl shadow-orange-500/10">
            <div className="relative min-h-48 bg-zinc-950">
              {bike.imageUrl ? (
                <img src={bike.imageUrl} alt="" className="h-52 w-full object-cover" />
              ) : (
                <div className="flex h-52 items-center justify-center bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_44%),linear-gradient(135deg,#18181b,#020202)]">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-orange-500/30 bg-orange-500/10 text-3xl font-black text-orange-400">
                    M
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-[10px] font-black uppercase tracking-[0.26em] text-orange-400">
                  Glowny motocykl
                </div>
                <div className="mt-1 text-3xl font-black text-white">
                  {bike.brand} {bike.model}
                </div>
                <div className="mt-1 text-sm font-bold text-zinc-300">
                  {bike.year || "Brak rocznika"} /{" "}
                  {bike.engine || "Brak pojemnosci"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4">
              <BikeMetric
                label="Przebieg"
                value={`${bike.totalDistanceKm.toFixed(1)} km`}
              />
              <BikeMetric label="Status" value="Aktywny" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BikeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 truncate font-black text-orange-400">{value}</div>
    </div>
  );
}
