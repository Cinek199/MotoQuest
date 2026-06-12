"use client";

import { useEffect, useState } from "react";

import {
  Bike,
  createBike,
  getActiveBikeId,
  getGarage,
  saveGarage,
  setActiveBikeId,
} from "../lib/garage";
import { savePlayer } from "../lib/playerService";
import { supabase } from "../lib/supabase";

export default function GaragePanel() {
  const [garage, setGarage] = useState<Bike[]>([]);
  const [activeBikeId, setActiveBikeIdState] = useState<string | null>(null);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [initialDistance, setInitialDistance] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    loadGarage();
  }, []);

  const loadGarage = () => {
    const bikes = getGarage();
    const activeId = getActiveBikeId() || bikes[0]?.id || null;

    if (activeId) {
      setActiveBikeId(activeId);
    }

    setGarage(bikes);
    setActiveBikeIdState(activeId);
  };

  const syncPlayer = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await savePlayer(user.id);
    }
  };

  const saveBike = async () => {
    setSaveError("");

    if (!brand.trim() || !model.trim()) {
      setSaveError("Podaj przynajmniej markę i model motocykla.");
      return;
    }

    try {
      const bike = createBike({
        brand: brand.trim(),
        engine: engine.trim(),
        imageUrl: imageUrl.trim(),
        model: model.trim(),
        totalDistanceKm: Number(initialDistance || 0),
        year: year.trim(),
      });

      const nextGarage = [...garage, bike];
      saveGarage(nextGarage);
      setActiveBikeId(bike.id);

      setGarage(nextGarage);
      setActiveBikeIdState(bike.id);
      setBrand("");
      setModel("");
      setYear("");
      setEngine("");
      setImageUrl("");
      setInitialDistance("");

      await syncPlayer();
    } catch (error) {
      console.error(error);
      setSaveError("Nie udało się dodać motocykla. Spróbuj ponownie.");
    }
  };

  const uploadBikePhoto = async (file: File) => {
    setPhotoError("");
    setUploadingPhoto(true);

    try {
      const safeName = file.name.replace(/[^a-z0-9._-]/gi, "-");
      const fileName = `${Date.now()}-${safeName}`;

      const { error } = await supabase.storage
        .from("bike-photos")
        .upload(fileName, file);

      if (error) {
        setPhotoError(
          "Nie udało się wysłać zdjęcia. Sprawdź bucket bike-photos w Supabase."
        );
        console.error(error);
        return;
      }

      const { data } = supabase.storage
        .from("bike-photos")
        .getPublicUrl(fileName);

      setImageUrl(data.publicUrl);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const activateBike = async (bikeId: string) => {
    setActiveBikeId(bikeId);
    setActiveBikeIdState(bikeId);
    await syncPlayer();
  };

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="mb-4 text-xl font-bold">Garaż</h2>

      <div className="mb-5 grid gap-2 sm:grid-cols-2">
        <input
          placeholder="Marka"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-2"
        />
        <input
          placeholder="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-2"
        />
        <input
          placeholder="Rok"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-2"
        />
        <input
          placeholder="Pojemność"
          value={engine}
          onChange={(e) => setEngine(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-2"
        />
        <label className="rounded-lg border border-dashed border-zinc-700 bg-zinc-800 px-3 py-3 sm:col-span-2">
          <span className="block text-sm font-bold text-white">
            Zdjęcie motocykla
          </span>
          <span className="mt-1 block text-xs text-zinc-400">
            Wybierz zdjęcie z galerii lub aparatu
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (file) {
                void uploadBikePhoto(file);
              }
            }}
            className="mt-3 w-full text-sm text-zinc-300"
          />
        </label>

        {uploadingPhoto && (
          <div className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-orange-400 sm:col-span-2">
            Wysyłanie zdjęcia...
          </div>
        )}

        {photoError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300 sm:col-span-2">
            {photoError}
          </div>
        )}

        {saveError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300 sm:col-span-2">
            {saveError}
          </div>
        )}

        {imageUrl && (
          <div className="overflow-hidden rounded-xl border border-zinc-700 sm:col-span-2">
            <img src={imageUrl} alt="" className="h-44 w-full object-cover" />
          </div>
        )}
        <input
          type="number"
          min="0"
          placeholder="Aktualny przebieg motocykla"
          value={initialDistance}
          onChange={(e) => setInitialDistance(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-2 sm:col-span-2"
        />

        <button
          onClick={saveBike}
          disabled={uploadingPhoto}
          className="rounded-lg bg-orange-500 py-3 font-bold text-black hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
        >
          {uploadingPhoto ? "Poczekaj na zdjęcie..." : "Dodaj motocykl"}
        </button>
      </div>

      <div className="space-y-3">
        {garage.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-500">
            Brak motocykli w garażu
          </div>
        )}

        {garage.map((bike) => {
          const active = activeBikeId === bike.id;

          return (
            <article
              key={bike.id}
              className={[
                "overflow-hidden rounded-2xl border bg-zinc-950",
                active ? "border-orange-500" : "border-zinc-800",
              ].join(" ")}
            >
              {bike.imageUrl && (
                <img
                  src={bike.imageUrl}
                  alt=""
                  className="h-40 w-full object-cover"
                />
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-black text-white">
                      {bike.brand} {bike.model}
                    </div>
                    <div className="text-sm text-zinc-400">
                      {bike.year || "Brak rocznika"} ·{" "}
                      {bike.engine || "Brak pojemności"}
                    </div>
                  </div>

                  {active && (
                    <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-black">
                      Aktywny
                    </span>
                  )}
                </div>

                <div className="mt-4 rounded-xl bg-zinc-900 p-3">
                  <div className="text-[10px] font-bold uppercase text-zinc-500">
                    Przebieg motocykla
                  </div>
                  <div className="mt-1 text-2xl font-black text-orange-500">
                    {bike.totalDistanceKm.toFixed(1)} km
                  </div>
                </div>

                {!active && (
                  <button
                    type="button"
                    onClick={() => activateBike(bike.id)}
                    className="mt-3 w-full rounded-xl border border-orange-500/40 px-4 py-3 font-bold text-orange-400 hover:bg-orange-500 hover:text-black"
                  >
                    Ustaw jako aktywny
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
