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
  <main className="min-h-screen bg-black text-white flex items-center justify-center">
    <h1 className="text-7xl text-red-500">
      TEST PREMIUM
    </h1>
  </main>
);
}