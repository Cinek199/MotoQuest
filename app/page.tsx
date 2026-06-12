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

      setLoadingStatus(
        "🔐 Logowanie..."
      );

      setProgress(25);

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            1000
          )
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

      await loadPlayer(
        user.id
      );

      setLoadingStatus(
        "🗺️ Ładowanie MotoQuest..."
      );

      setProgress(75);

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            500
          )
      );

      setLoadingStatus(
        "✅ Gotowe"
      );

      setProgress(100);

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            500
          )
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
    <main className="min-h-screen bg-black text-white">

      <div className="max-w-7xl mx-auto px-4 py-4">

        <div className="
          mb-6
          rounded-3xl
          border
          border-orange-500/30
          bg-gradient-to-r
          from-zinc-900
          to-black
          p-6
        ">

          <div className="flex items-center justify-between">

            <div>

              <div className="
                text-orange-500
                uppercase
                tracking-[0.3em]
                text-xs
              ">
                MotoQuest
              </div>

              <h1 className="
                text-4xl
                md:text-6xl
                font-black
                mt-2
              ">
                Odkrywaj
                <span className="text-orange-500">
                  {" "}Polskę
                </span>
              </h1>

              <p className="
                text-zinc-400
                mt-2
              ">
                Adventure • Exploration • Motorcycle
              </p>

            </div>

            <div className="
              bg-zinc-900/80
              border
              border-zinc-800
              rounded-3xl
              px-6
              py-4
              text-center
            ">

              <div className="
                text-zinc-500
                text-xs
              ">
                POZIOM
              </div>

              <div className="
                text-5xl
                font-black
                text-orange-500
              ">
                {stats.level}
              </div>

            </div>

          </div>

        </div>

        <div className="
          grid
          grid-cols-3
          gap-3
          mb-5
        ">

          <div className="
            bg-zinc-900
            border
            border-zinc-800
            rounded-2xl
            p-4
          ">

            <div className="
              text-zinc-500
              text-xs
            ">
              KAFELKI
            </div>

            <div className="
              text-2xl
              font-bold
              text-orange-500
            ">
              {stats.tiles}
            </div>

          </div>

          <div className="
            bg-zinc-900
            border
            border-zinc-800
            rounded-2xl
            p-4
          ">

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

          <div className="
            bg-zinc-900
            border
            border-zinc-800
            rounded-2xl
            p-4
          ">

            <div className="
              text-zinc-500
              text-xs
            ">
              MIASTA
            </div>

            <div className="
              text-2xl
              font-bold
              text-orange-500
            ">
              {stats.towns}
            </div>

          </div>

        </div>

        <MapView />

      </div>

    </main>
  );
}