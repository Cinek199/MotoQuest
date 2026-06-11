"use client";

import { useEffect, useState } from "react";

import XPBar from "../components/XPBar";
import MapView from "../components/MapView";
import TownsPanel from "../components/TownsPanel";
import AchievementsPanel from "../components/AchievementsPanel";
import PolandMap from "../components/PolandMap";
import TripsPanel from "../components/TripsPanel";

import VoivodeshipPanel from "../components/VoivodeshipPanel";
import LeaderboardPanel from "../components/LeaderboardPanel";
import CloudStatusPanel from "../components/CloudStatusPanel";
import BikeProfilePanel from "../components/BikeProfilePanel";
import GaragePanel from "../components/GaragePanel";
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

      console.log(
        "USER:",
        user.id
      );

      setLoadingStatus(
        "☁️ Pobieranie postępu..."
      );

      setProgress(50);



      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            1000
          )
      );

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
            1000
          )
      );

      console.log(
        "☁️ postęp załadowany"
      );

      setLoadingStatus(
        "✅ Gotowe"
      );

      setProgress(100);



      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            800
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
      <div className="max-w-7xl mx-auto p-4">

        <div className="flex items-center justify-between mb-8">

          <div>
            <h1 className="text-5xl font-bold">
              Moto
              <span className="text-orange-500">
                Quest
              </span>
            </h1>

            <p className="text-zinc-400 mt-2">
              MotoQuest 3.0
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl px-6 py-4">
            <div className="text-xs text-zinc-500">
              POZIOM
            </div>

            <div className="text-4xl font-bold text-orange-500">
              {stats.level}
            </div>
          </div>

        </div>

        <div className="grid lg:grid-cols-4 gap-4 mb-6">

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <div className="text-zinc-500 text-sm">
              🟧 Kafelki
            </div>

            <div className="text-3xl font-bold mt-2">
              {stats.tiles}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <div className="text-zinc-500 text-sm">
              🏘️ Miejscowości
            </div>

            <div className="text-3xl font-bold mt-2">
              {stats.towns}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <div className="text-zinc-500 text-sm">
              🏆 XP
            </div>

            <div className="text-3xl font-bold mt-2 text-orange-500">
              {stats.xp}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <div className="text-zinc-500 text-sm">
              🗺️ Powierzchnia
            </div>

            <div className="text-3xl font-bold mt-2">
              {(stats.tiles * 0.25).toFixed(2)}
            </div>
          </div>

        </div>

        <XPBar xp={stats.xp} />

        <MapView />

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <TownsPanel />
          <AchievementsPanel />
          <VoivodeshipPanel />
        </div>

        <div className="grid lg:grid-cols-4 gap-6 mt-6">
          <LeaderboardPanel />
          <CloudStatusPanel />
          <PolandMap />
          <TripsPanel />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <BikeProfilePanel />
          <GaragePanel />
        </div>

      </div>
    </main>
  );
}