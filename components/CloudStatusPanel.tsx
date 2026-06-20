"use client";

import { useEffect, useState } from "react";

type CloudMode = "loading" | "offline" | "online";

const cloudCopy: Record<
  CloudMode,
  {
    accentClassName: string;
    badge: string;
    description: string;
    title: string;
  }
> = {
  loading: {
    accentClassName: "is-loading",
    badge: "Sprawdzanie",
    description: "MotoQuest sprawdza polaczenie i gotowosc synchronizacji.",
    title: "Inicjalizacja chmury",
  },
  offline: {
    accentClassName: "is-offline",
    badge: "Offline",
    description:
      "Mozesz dalej jezdzic. Dane zostana wyslane, gdy telefon odzyska internet.",
    title: "Tryb lokalny",
  },
  online: {
    accentClassName: "is-online",
    badge: "Online",
    description:
      "Profil, garaz, wyprawy i odkrycia sa gotowe do odtworzenia po zalogowaniu.",
    title: "Synchronizacja aktywna",
  },
};

export default function CloudStatusPanel() {
  const [mode, setMode] = useState<CloudMode>("loading");

  useEffect(() => {
    const sync = () => {
      setMode(navigator.onLine ? "online" : "offline");
    };

    sync();

    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);

    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const copy = cloudCopy[mode];

  return (
    <section className="mq-cloud-panel">
      <div className="mq-cloud-panel-head">
        <div>
          <span className="mq-profile-eyebrow">Synchronizacja</span>
          <h2>Chmura gracza</h2>
          <p>Ten panel pokazuje, czy postep jest gotowy do synchronizacji.</p>
        </div>

        <div className={`mq-cloud-orb ${copy.accentClassName}`}>
          <span />
        </div>
      </div>

      <div className={`mq-cloud-status-card ${copy.accentClassName}`}>
        <div>
          <strong>{copy.title}</strong>
          <p>{copy.description}</p>
        </div>
        <span className="mq-cloud-status-pill">{copy.badge}</span>
      </div>
    </section>
  );
}
