"use client";

import { useEffect, useState } from "react";

import AchievementsPanel from "../components/AchievementsPanel";
import BikeProfilePanel from "../components/BikeProfilePanel";
import CloudStatusPanel from "../components/CloudStatusPanel";
import DevRuntimeGuard from "../components/DevRuntimeGuard";
import GaragePanel from "../components/GaragePanel";
import LeaderboardPanel from "../components/LeaderboardPanel";
import MapView from "../components/MapView";
import PlayerProfilePanel from "../components/PlayerProfilePanel";
import SplashScreen from "../components/SplashScreen";
import TownsPanel from "../components/TownsPanel";
import TripsPanel from "../components/TripsPanel";
import VoivodeshipPanel from "../components/VoivodeshipPanel";
import XPBar from "../components/XPBar";

import { signInAnonymously } from "../lib/auth";
import { loadPlayer } from "../lib/loadPlayer";
import { usePlayerStats } from "../lib/usePlayerStats";

type TabId = "map" | "trips" | "achievements" | "garage" | "profile";

const tabs: Array<{
  id: TabId;
  label: string;
}> = [
  {
    id: "map",
    label: "Mapa",
  },
  {
    id: "trips",
    label: "Wyprawy",
  },
  {
    id: "achievements",
    label: "Odznaki",
  },
  {
    id: "garage",
    label: "Garaz",
  },
  {
    id: "profile",
    label: "Profil",
  },
];

export default function Home() {
  const stats = usePlayerStats();

  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [showSplash, setShowSplash] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("Uruchamianie...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function init() {
      setLoadingStatus("Logowanie...");
      setProgress(25);

      await new Promise((resolve) => setTimeout(resolve, 800));

      const user = await signInAnonymously();

      if (!user) {
        setShowSplash(false);
        return;
      }

      setLoadingStatus("Pobieranie postepu...");
      setProgress(50);

      await loadPlayer(user.id);

      setLoadingStatus("Ladowanie MotoQuest...");
      setProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 500));

      setShowSplash(false);
    }

    init();
  }, []);

  if (showSplash) {
    return (
      <>
        <DevRuntimeGuard />
        <SplashScreen status={loadingStatus} progress={progress} />
      </>
    );
  }

  return (
    <main className="min-h-screen bg-black pb-28 text-white">
      <DevRuntimeGuard />

      <div
        className={[
          "mx-auto w-full px-3 py-3 sm:px-4 sm:py-5",
          activeTab === "map"
            ? "max-w-[520px] lg:max-w-[1180px]"
            : "max-w-[760px] lg:max-w-6xl",
        ].join(" ")}
      >
        {activeTab === "map" && <MapView />}

        {activeTab === "trips" && (
          <section className="space-y-4">
            <ScreenHeader
              title="Wyprawy"
              subtitle="Zapisuj przejazdy, zdjecia i postep z trasy."
            />
            <TripsPanel />
          </section>
        )}

        {activeTab === "achievements" && (
          <section className="space-y-4">
            <ScreenHeader
              title="Odznaki"
              subtitle="Wyzwania, wojewodztwa i odkryte miejscowosci."
            />
            <AchievementsPanel />
            <div className="grid gap-4 lg:grid-cols-2">
              <VoivodeshipPanel />
              <TownsPanel />
            </div>
          </section>
        )}

        {activeTab === "garage" && (
          <section className="space-y-4">
            <ScreenHeader
              title="Garaz"
              subtitle="Motocykle, przebieg i statystyki maszyny."
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <GaragePanel />
              <BikeProfilePanel />
            </div>
          </section>
        )}

        {activeTab === "profile" && (
          <section className="space-y-4">
            <ScreenHeader
              title="Profil"
              subtitle="Poziom gracza, XP, chmura i ranking."
            />
            <PlayerProfilePanel stats={stats} />
            <XPBar xp={stats.xp} />
            <div className="grid gap-4 lg:grid-cols-2">
              <CloudStatusPanel />
              <LeaderboardPanel />
            </div>
          </section>
        )}
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}

function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <header className="overflow-hidden rounded-[1.7rem] border border-orange-500/25 bg-zinc-950 shadow-2xl shadow-black/35">
      <div className="border-b border-zinc-800 bg-black/45 px-4 py-3 sm:px-5">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500">
          MotoQuest
        </div>
      </div>
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <h1 className="text-3xl font-black text-white sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">{subtitle}</p>
      </div>
    </header>
  );
}

function BottomNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3">
      <div className="mx-auto max-w-[470px] rounded-[1.6rem] border border-zinc-800 bg-black/90 p-1.5 shadow-2xl shadow-black/80 backdrop-blur-xl">
        <div className="grid grid-cols-5 gap-1">
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={selected ? "page" : undefined}
                className={[
                  "group relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-3xl border text-[11px] font-black transition",
                  selected
                    ? "border-orange-500 bg-orange-500 text-black shadow-lg shadow-orange-500/25"
                    : "border-transparent bg-zinc-950/70 text-zinc-500 hover:border-zinc-700 hover:text-white",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-7 w-7 items-center justify-center transition",
                    selected
                      ? "text-black"
                      : "text-zinc-400 group-hover:text-orange-400",
                  ].join(" ")}
                >
                  <NavIcon id={tab.id} />
                </span>
                <span className="max-w-full truncate px-1">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function NavIcon({ id }: { id: TabId }) {
  const common = {
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  if (id === "map") {
    return (
      <svg {...common}>
        <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" />
        <path d="M9 3v15" />
        <path d="M15 6v15" />
      </svg>
    );
  }

  if (id === "trips") {
    return (
      <svg {...common}>
        <path d="M5 17h14" />
        <path d="M6 17l2-7h8l2 7" />
        <circle cx="8" cy="17" r="2" />
        <circle cx="16" cy="17" r="2" />
      </svg>
    );
  }

  if (id === "achievements") {
    return (
      <svg {...common}>
        <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
        <path d="M6 6H4a3 3 0 0 0 3 3" />
        <path d="M18 6h2a3 3 0 0 1-3 3" />
        <path d="M12 13v5" />
        <path d="M9 21h6" />
      </svg>
    );
  }

  if (id === "garage") {
    return (
      <svg {...common}>
        <path d="M4 11l8-6 8 6" />
        <path d="M6 10v10h12V10" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
