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
    <section className="mq-bike-profile-panel">
      <div className="mq-bike-profile-head">
        <div>
          <span className="mq-profile-eyebrow">Status motocykla</span>
          <h2>Aktywny motocykl</h2>
          <p>Maszyna przypisana do przebiegu, odkryc i wypraw podczas jazdy.</p>
        </div>

        <div className="mq-bike-profile-badge">Glowny</div>
      </div>

      {!bike ? (
        <div className="mq-bike-profile-empty">
          <div className="mq-bike-profile-empty-mark">M</div>
          <strong>Brak aktywnego motocykla</strong>
          <p>Dodaj motocykl w garazu, aby przypisywac do niego przebieg.</p>
        </div>
      ) : (
        <article className="mq-bike-profile-card">
          <div className="mq-bike-profile-media">
            {bike.imageUrl ? (
              <img src={bike.imageUrl} alt="" />
            ) : (
              <div className="mq-bike-profile-fallback">M</div>
            )}
            <div className="mq-bike-profile-overlay" />
            <div className="mq-bike-profile-copy">
              <span className="mq-profile-eyebrow">Aktywna maszyna</span>
              <h3>
                {bike.brand} {bike.model}
              </h3>
              <p>
                {bike.year || "Brak rocznika"} /{" "}
                {bike.engine || "Brak pojemnosci"}
              </p>
            </div>
          </div>

          <div className="mq-bike-profile-stats">
            <BikeMetric
              label="Przebieg"
              value={`${bike.totalDistanceKm.toFixed(1)} km`}
            />
            <BikeMetric label="Status" value="Aktywny" />
            <BikeMetric
              label="Silnik"
              value={bike.engine || "Brak danych"}
            />
            <BikeMetric label="Rocznik" value={bike.year || "Brak danych"} />
          </div>
        </article>
      )}
    </section>
  );
}

function BikeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="mq-bike-profile-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
