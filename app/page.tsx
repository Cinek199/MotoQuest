"use client";

import { useEffect, useState } from "react";

import MapView from "../components/MapView";
import SplashScreen from "../components/SplashScreen";

import { usePlayerStats } from "../lib/usePlayerStats";
import { signInAnonymously } from "../lib/auth";
import { loadPlayer } from "../lib/loadPlayer";

export default function Home() {
  const stats = usePlayerStats();

  const [showSplash, setShowSplash] =
    useState(true);

  const [loadingStatus, setLoadingStatus] =
    useState("Uruchamianie...");

  const [progress, setProgress] =
    useState(0);

  useEffect(() => {
    async function init() {
      setLoadingStatus("🔐 Logowanie...");
      setProgress(25);

      await new Promise(resolve =>
        setTimeout(resolve, 800)
      );

      const user =
        await signInAnonymously();

      if (!user) {
        setShowSplash(false);
        return;
      }

      setLoadingStatus(
        "☁️ Pobieranie postępu..."
      );

      setProgress(50);

      await loadPlayer(user.id);

      setLoadingStatus(
        "🗺️ Ładowanie MotoQuest..."
      );

      setProgress(100);

      await new Promise(resolve =>
        setTimeout(resolve, 500)
      );

      setShowSplash(false);
    }

    init();
  }, []);

  if (showSplash) {
    return (
      <SplashScreen
        status={loadingStatus}
        progress={progress}
      />
    );
  }

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">

      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-zinc-950 via-black to-black" />

      <div className="fixed top-0 left-0 right-0 z-50 p-4">

        <div className="
          backdrop-blur-xl
          bg-black/50
          border border-orange-500/20
          rounded-3xl
          p-4
          flex
          items-center
          justify-between
        ">

          <div>

            <div className="
              text-orange-500
              text-xs
              tracking-[0.35em]
              uppercase
            ">
              MotoQuest
            </div>

            <div className="
              text-2xl
              font-black
              text-white
            ">
              LVL {stats.level}
            </div>

          </div>

          <div className="text-right">

            <div className="
              text-zinc-500
              text-xs
            ">
              XP
            </div>

            <div className="
              text-2xl
              font-bold
              text-orange-500
            ">
              {stats.xp}
            </div>

          </div>

        </div>

      </div>

      <div className="pt-24 pb-28 px-4">
        <MapView />
      </div>

      <div className="
        fixed
        bottom-4
        left-4
        right-4
        z-50
      ">

        <div className="
          backdrop-blur-xl
          bg-black/60
          border border-zinc-800
          rounded-3xl
          p-4
          grid
          grid-cols-4
          text-center
        ">

          <button className="text-orange-500">
            🗺️
            <div className="text-xs mt-1">
              Mapa
            </div>
          </button>

          <button className="text-zinc-400">
            🏆
            <div className="text-xs mt-1">
              XP
            </div>
          </button>

          <button className="text-zinc-400">
            🏍️
            <div className="text-xs mt-1">
              Garaż
            </div>
          </button>

          <button className="text-zinc-400">
            👤
            <div className="text-xs mt-1">
              Profil
            </div>
          </button>

        </div>

      </div>

    </main>
  );
}