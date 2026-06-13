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
      setSaveError("Podaj przynajmniej marke i model motocykla.");
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
    } catch {
      setSaveError("Nie udalo sie dodac motocykla. Sprobuj ponownie.");
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
        setPhotoError("Nie udalo sie wyslac zdjecia. Sprawdz bucket bike-photos.");
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
  const activeBike = garage.find((bike) => bike.id === activeBikeId) || null;
  const otherBikes = garage.filter((bike) => bike.id !== activeBikeId);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#08090b] shadow-2xl shadow-black/50">
      <PanelHeader eyebrow="Maszyny" title="Garaz" count={garage.length} />

      <div className="grid gap-4 p-4 sm:p-5">
        {activeBike ? (
          <BikeHero bike={activeBike} />
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/35 p-5 text-zinc-500">
            Brak motocykli w garazu
          </div>
        )}

        <div className="grid gap-2 rounded-[1.5rem] border border-white/10 bg-black/45 p-3 shadow-xl shadow-black/20 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-500">
              Dodaj motocykl
            </div>
          </div>

          <GarageInput placeholder="Marka" value={brand} onChange={setBrand} />
          <GarageInput placeholder="Model" value={model} onChange={setModel} />
          <GarageInput placeholder="Rok" value={year} onChange={setYear} />
          <GarageInput placeholder="Pojemnosc" value={engine} onChange={setEngine} />

          <label className="rounded-2xl border border-dashed border-orange-500/30 bg-orange-500/5 px-4 py-4 sm:col-span-2">
            <span className="block text-sm font-black text-white">
              Zdjecie motocykla
            </span>
            <span className="mt-1 block text-xs font-bold text-zinc-500">
              Galeria lub aparat
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
              className="mt-3 w-full text-xs font-bold text-zinc-400 file:mr-3 file:rounded-full file:border-0 file:bg-orange-500 file:px-3 file:py-2 file:text-xs file:font-black file:text-black"
            />
          </label>

          {uploadingPhoto && (
            <Notice tone="orange" text="Wysylanie zdjecia..." />
          )}
          {photoError && <Notice tone="red" text={photoError} />}
          {saveError && <Notice tone="red" text={saveError} />}

          {imageUrl && (
            <div className="overflow-hidden rounded-2xl border border-white/10 sm:col-span-2">
              <img src={imageUrl} alt="" className="h-44 w-full object-cover" />
            </div>
          )}

          <input
            type="number"
            min="0"
            placeholder="Aktualny przebieg motocykla"
            value={initialDistance}
            onChange={(e) => setInitialDistance(e.target.value)}
            className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 font-bold outline-none transition placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 sm:col-span-2"
          />

          <button
            onClick={saveBike}
            disabled={uploadingPhoto}
            className="rounded-2xl bg-orange-500 py-4 font-black text-black shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
          >
            {uploadingPhoto ? "Poczekaj na zdjecie" : "Dodaj motocykl"}
          </button>
        </div>

        {otherBikes.length > 0 && (
          <div className="space-y-3">
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-lime-400">
              Moje motocykle
            </div>

            {otherBikes.map((bike) => (
            <BikeCard
              key={bike.id}
              active={false}
              bike={bike}
              onActivate={() => activateBike(bike.id)}
            />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BikeHero({ bike }: { bike: Bike }) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-orange-500/35 bg-black shadow-xl shadow-orange-500/10">
      <div className="relative h-56 bg-zinc-950">
        {bike.imageUrl ? (
          <img src={bike.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_45%),linear-gradient(135deg,#18181b,#020202)]">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-orange-500/30 bg-orange-500/10 text-3xl font-black text-orange-400">
              M
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute right-3 top-3 rounded-full border border-lime-500/30 bg-lime-500/15 px-3 py-1 text-[10px] font-black uppercase text-lime-300">
          Aktywny
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-2xl font-black text-white">
            {bike.brand} {bike.model}
          </div>
          <div className="mt-1 text-sm font-bold text-zinc-300">
            {bike.year || "Brak rocznika"} / {bike.engine || "Brak pojemnosci"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 border-t border-white/10">
        <BikeMiniMetric label="Przebieg" value={`${bike.totalDistanceKm.toFixed(1)} km`} />
        <BikeMiniMetric label="Trasy" value="Aktywny" />
      </div>
    </article>
  );
}

function BikeMiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-white/10 p-4 last:border-r-0">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 truncate text-lg font-black text-white">{value}</div>
    </div>
  );
}

function BikeCard({
  active,
  bike,
  onActivate,
}: {
  active: boolean;
  bike: Bike;
  onActivate: () => void;
}) {
  return (
    <article
      className={[
        "overflow-hidden rounded-[1.5rem] border bg-black/45 transition hover:border-orange-500/35",
        active ? "border-orange-500 shadow-lg shadow-orange-500/10" : "border-white/10",
      ].join(" ")}
    >
      {bike.imageUrl && (
        <img src={bike.imageUrl} alt="" className="h-40 w-full object-cover" />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-xl font-black text-white">
              {bike.brand} {bike.model}
            </div>
            <div className="mt-1 text-sm text-zinc-400">
              {bike.year || "Brak rocznika"} / {bike.engine || "Brak pojemnosci"}
            </div>
          </div>

          {active && (
            <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-black">
              Aktywny
            </span>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-950 p-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Przebieg motocykla
          </div>
          <div className="mt-1 text-2xl font-black text-orange-500">
            {bike.totalDistanceKm.toFixed(1)} km
          </div>
        </div>

        {!active && (
          <button
            type="button"
            onClick={onActivate}
            className="mt-3 w-full rounded-2xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 font-black text-orange-400 transition hover:bg-orange-500 hover:text-black"
          >
            Ustaw jako aktywny
          </button>
        )}
      </div>
    </article>
  );
}

function GarageInput({
  onChange,
  placeholder,
  value,
}: {
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 font-bold outline-none transition placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
    />
  );
}

function Notice({ text, tone }: { text: string; tone: "orange" | "red" }) {
  return (
    <div
      className={[
        "rounded-2xl border px-4 py-3 text-sm font-bold sm:col-span-2",
        tone === "orange"
          ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
          : "border-red-500/40 bg-red-500/10 text-red-300",
      ].join(" ")}
    >
      {text}
    </div>
  );
}

function PanelHeader({
  count,
  eyebrow,
  title,
}: {
  count: number;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="relative overflow-hidden border-b border-white/10 px-4 py-5 sm:px-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.2),transparent_42%),linear-gradient(135deg,rgba(24,24,27,0.9),rgba(0,0,0,0.35))]" />
      <div className="relative flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">
            {eyebrow}
          </div>
          <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-orange-400">{count}</div>
          <div className="text-[10px] font-black uppercase text-zinc-500">
            szt.
          </div>
        </div>
      </div>
    </div>
  );
}
