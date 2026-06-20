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
  const totalDistance = garage.reduce(
    (sum, bike) => sum + Number(bike.totalDistanceKm || 0),
    0
  );

  return (
    <section className="mq-garage-panel">
      <div className="mq-garage-hero">
        <div className="mq-garage-hero-copy">
          <span className="mq-profile-eyebrow">Maszyny</span>
          <h2>Garaz MotoQuest</h2>
          <p>
            Buduj swoja kolekcje motocykli i przypinaj przebieg do aktywnej
            maszyny.
          </p>
        </div>

        <div className="mq-garage-hero-stats">
          <GarageHeroStat label="Motocykle" value={String(garage.length)} />
          <GarageHeroStat
            label="Laczny przebieg"
            value={`${totalDistance.toFixed(0)} km`}
          />
        </div>
      </div>

      {activeBike ? (
        <BikeHero bike={activeBike} />
      ) : (
        <div className="mq-garage-empty">
          <div className="mq-garage-empty-mark">M</div>
          <strong>Brak motocykli w garazu</strong>
          <p>Dodaj swoja pierwsza maszyne, aby przypisywac do niej wyprawy.</p>
        </div>
      )}

      <div className="mq-garage-form-card">
        <div className="mq-garage-form-head">
          <div>
            <span className="mq-profile-eyebrow">Nowy motocykl</span>
            <h3>Dodaj maszyne do kolekcji</h3>
          </div>
          <div className="mq-garage-form-badge">Dodaj motocykl</div>
        </div>

        <div className="mq-garage-form-grid">
          <GarageInput placeholder="Marka" value={brand} onChange={setBrand} />
          <GarageInput placeholder="Model" value={model} onChange={setModel} />
          <GarageInput placeholder="Rok" value={year} onChange={setYear} />
          <GarageInput
            placeholder="Pojemnosc"
            value={engine}
            onChange={setEngine}
          />

          <label className="mq-garage-upload">
            <span className="mq-garage-upload-title">Zdjecie motocykla</span>
            <span className="mq-garage-upload-copy">Galeria lub aparat</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  void uploadBikePhoto(file);
                }
              }}
              className="mq-garage-upload-input"
            />
          </label>

          {uploadingPhoto ? (
            <Notice tone="orange" text="Wysylanie zdjecia..." />
          ) : null}
          {photoError ? <Notice tone="red" text={photoError} /> : null}
          {saveError ? <Notice tone="red" text={saveError} /> : null}

          {imageUrl ? (
            <div className="mq-garage-upload-preview">
              <img src={imageUrl} alt="" />
            </div>
          ) : null}

          <input
            type="number"
            min="0"
            placeholder="Aktualny przebieg motocykla"
            value={initialDistance}
            onChange={(event) => setInitialDistance(event.target.value)}
            className="mq-garage-input mq-garage-distance-input"
          />

          <button
            type="button"
            onClick={saveBike}
            disabled={uploadingPhoto}
            className="mq-garage-submit"
          >
            {uploadingPhoto ? "Poczekaj na zdjecie" : "Dodaj motocykl"}
          </button>
        </div>
      </div>

      <div className="mq-garage-collection">
        <div className="mq-garage-collection-head">
          <span className="mq-profile-eyebrow">Kolekcja</span>
          <strong>{garage.length} maszyn</strong>
        </div>

        {otherBikes.length > 0 ? (
          <div className="mq-garage-cards">
            {otherBikes.map((bike) => (
              <BikeCard
                key={bike.id}
                active={false}
                bike={bike}
                onActivate={() => activateBike(bike.id)}
              />
            ))}
          </div>
        ) : garage.length > 0 ? (
          <div className="mq-garage-empty secondary">
            <strong>Masz juz wybrany glowny motocykl</strong>
            <p>Kolejne motocykle pojawia sie tutaj jako osobne karty premium.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function BikeHero({ bike }: { bike: Bike }) {
  return (
    <article className="mq-garage-hero-bike">
      <div className="mq-garage-hero-bike-media">
        {bike.imageUrl ? (
          <img src={bike.imageUrl} alt="" />
        ) : (
          <div className="mq-garage-hero-bike-fallback">M</div>
        )}

        <div className="mq-garage-hero-bike-overlay" />
        <div className="mq-garage-hero-bike-status">Aktywny motocykl</div>
        <div className="mq-garage-hero-bike-copy">
          <span className="mq-profile-eyebrow">Maszyna glowna</span>
          <h3>
            {bike.brand} {bike.model}
          </h3>
          <p>
            {bike.year || "Brak rocznika"} /{" "}
            {bike.engine || "Brak pojemnosci"}
          </p>
        </div>
      </div>

      <div className="mq-garage-hero-bike-metrics">
        <BikeMiniMetric
          label="Przebieg"
          value={`${bike.totalDistanceKm.toFixed(1)} km`}
        />
        <BikeMiniMetric label="Status" value="Aktywny" />
      </div>
    </article>
  );
}

function GarageHeroStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mq-garage-hero-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BikeMiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="mq-garage-mini-metric">
      <span>{label}</span>
      <strong>{value}</strong>
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
        "mq-garage-bike-card",
        active ? "is-active" : "",
      ].join(" ")}
    >
      <div className="mq-garage-bike-card-media">
        {bike.imageUrl ? (
          <img src={bike.imageUrl} alt="" />
        ) : (
          <div className="mq-garage-bike-card-fallback">M</div>
        )}
      </div>

      <div className="mq-garage-bike-card-body">
        <div className="mq-garage-bike-card-head">
          <div>
            <strong>
              {bike.brand} {bike.model}
            </strong>
            <span>
              {bike.year || "Brak rocznika"} /{" "}
              {bike.engine || "Brak pojemnosci"}
            </span>
          </div>
          {active ? <em>Aktywny</em> : null}
        </div>

        <div className="mq-garage-bike-card-metric">
          <span>Przebieg motocykla</span>
          <strong>{bike.totalDistanceKm.toFixed(1)} km</strong>
        </div>

        {!active ? (
          <button type="button" onClick={onActivate} className="mq-garage-activate">
            Ustaw jako aktywny
          </button>
        ) : null}
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
      onChange={(event) => onChange(event.target.value)}
      className="mq-garage-input"
    />
  );
}

function Notice({ text, tone }: { text: string; tone: "orange" | "red" }) {
  return (
    <div
      className={[
        "mq-garage-notice",
        tone === "orange" ? "is-orange" : "is-red",
      ].join(" ")}
    >
      {text}
    </div>
  );
}
