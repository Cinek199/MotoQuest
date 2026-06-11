"use client";

import { useEffect, useState } from "react";

interface Bike {
  brand: string;
  model: string;
  year: string;
  engine: string;
}

export default function BikeProfilePanel() {
  const [bike, setBike] =
  useState<Bike | null>(null);

const [distance, setDistance] =
  useState(0);
  useEffect(() => {
    const garage = JSON.parse(
      localStorage.getItem("mq_garage") || "[]"
    );
const km = Number(
  localStorage.getItem(
    "mq_distance"
  ) || "0"
);

setDistance(km);
    if (garage.length > 0) {
      setBike(garage[0]);
    }
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
      <h2 className="text-xl font-bold mb-4">
        🏍️ Mój motocykl
      </h2>

      {!bike ? (
        <div className="text-zinc-500">
          Brak motocykla w garażu
        </div>
      ) : (
        <div className="space-y-2">

          <div className="text-2xl font-bold text-orange-500">
            {bike.brand} {bike.model}
          </div>

          <div>
            📅 Rocznik: {bike.year}
          </div>

          <div>
            ⚙️ Pojemność: {bike.engine}
          </div>

          <div>
            🏍 Status: Główny motocykl
          </div>
<div>
  📏 Przebieg:
  <span className="text-orange-500 font-bold ml-2">
    {distance.toFixed(2)} km
  </span>
</div>
        </div>
      )}
    </div>
  );
}