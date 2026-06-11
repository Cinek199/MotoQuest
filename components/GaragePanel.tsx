"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { savePlayer } from "../lib/playerService";

interface Bike {
  brand: string;
  model: string;
  year: string;
  engine: string;
}

export default function GaragePanel() {
  const [garage, setGarage] = useState<Bike[]>([]);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");

  useEffect(() => {
    const data = JSON.parse(
      localStorage.getItem("mq_garage") || "[]"
    );

    setGarage(data);
  }, []);

  const saveBike = async () => {
    if (!brand || !model) return;

    const newGarage = [
      ...garage,
      {
        brand,
        model,
        year,
        engine,
      },
    ];

    setGarage(newGarage);

    localStorage.setItem(
      "mq_garage",
      JSON.stringify(newGarage)
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await savePlayer(user.id);
    }

    setBrand("");
    setModel("");
    setYear("");
    setEngine("");
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">

      <h2 className="text-xl font-bold mb-4">
        🏍 Garaż
      </h2>

      <div className="space-y-2 mb-4">

        <input
          placeholder="Marka"
          value={brand}
          onChange={(e) =>
            setBrand(e.target.value)
          }
          className="w-full bg-zinc-800 rounded-lg px-3 py-2"
        />

        <input
          placeholder="Model"
          value={model}
          onChange={(e) =>
            setModel(e.target.value)
          }
          className="w-full bg-zinc-800 rounded-lg px-3 py-2"
        />

        <input
          placeholder="Rok"
          value={year}
          onChange={(e) =>
            setYear(e.target.value)
          }
          className="w-full bg-zinc-800 rounded-lg px-3 py-2"
        />

        <input
          placeholder="Pojemność"
          value={engine}
          onChange={(e) =>
            setEngine(e.target.value)
          }
          className="w-full bg-zinc-800 rounded-lg px-3 py-2"
        />

        <button
          onClick={saveBike}
          className="w-full bg-orange-500 hover:bg-orange-600 rounded-lg py-2 font-bold"
        >
          Dodaj motocykl
        </button>

      </div>

      <div className="space-y-2">

        {garage.map((bike, index) => (
          <div
            key={index}
            className="bg-zinc-800 rounded-xl p-3"
          >
            <div className="font-bold">
              {bike.brand} {bike.model}
            </div>

            <div className="text-zinc-400 text-sm">
              {bike.year} • {bike.engine}
            </div>
          </div>
        ))}

      </div>

    </div>
  );
}