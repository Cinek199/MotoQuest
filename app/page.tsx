"use client";

import { useEffect, useState } from "react";

import AchievementsPanel from "../components/AchievementsPanel";
import BikeProfilePanel from "../components/BikeProfilePanel";
import CloudStatusPanel from "../components/CloudStatusPanel";
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
  icon: string;
}> = [
  {
    id: "map",
    label: "Mapa",
    icon: "M",
  },
  {
    id: "trips",
    label: "Wyprawy",
    icon: "W",
  },
  {
    id: "achievements",
    label: "Osiągnięcia",
    icon: "O",
  },
  {
    id: "garage",
    label: "Garaż",
    icon: "G",
  },
  {
    id: "profile",
    label: "Profil",
    icon: "P",
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

      setLoadingStatus("Pobieranie postępu...");
      setProgress(50);

      await loadPlayer(user.id);

      setLoadingStatus("Ładowanie MotoQuest...");
      setProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 500));

      setShowSplash(false);
    }

    init();
  }, []);

  if (showSplash) {
    return <SplashScreen status={loadingStatus} progress={progress} />;
  }

  return (
    <main className="min-h-screen bg-black pb-28 text-white">
      <div
        className={[
          "mx-auto w-full px-4 py-4",
          activeTab === "map" ? "max-w-[1600px]" : "max-w-6xl",
        ].join(" ")}
      >
        {activeTab === "map" && <MapView />}

        {activeTab === "trips" && (
          <section className="space-y-4">
            <ScreenHeader
              title="Wyprawy"
              subtitle="Zapisuj przejazdy, zdjęcia i postęp z trasy."
            />
            <TripsPanel />
          </section>
        )}

        {activeTab === "achievements" && (
          <section className="space-y-4">
            <ScreenHeader
              title="Osiągnięcia"
              subtitle="Odznaki, województwa i odkryte miejscowości."
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
              title="Garaż"
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

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-black/90 px-3 pb-4 pt-3 backdrop-blur-xl">
        <div className="mx-auto grid max-w-2xl grid-cols-5 gap-2">
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border text-xs font-bold transition",
                  selected
                    ? "border-orange-500 bg-orange-500 text-black"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400",
                ].join(" ")}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-[11px]">
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
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
    <header className="rounded-3xl border border-orange-500/25 bg-zinc-950 p-5">
      <div className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
        MotoQuest
      </div>
      <h1 className="mt-2 text-3xl font-black text-white">{title}</h1>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
    </header>
  );
}
