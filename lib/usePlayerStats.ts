"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { savePlayer } from "./playerService";
import { unlockAchievement } from "./achievements";

export interface PlayerStats {
  tiles: number;
  towns: number;
  xp: number;
  level: number;
}

export function usePlayerStats() {
  const [stats, setStats] = useState<PlayerStats>({
    tiles: 0,
    towns: 0,
    xp: 0,
    level: 1,
  });

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const update = async () => {
        const tiles = JSON.parse(
          localStorage.getItem("mq_tiles") || "[]"
        ).length;

        const towns = JSON.parse(
          localStorage.getItem("mq_towns") || "[]"
        ).length;

        const voivodeships = JSON.parse(
          localStorage.getItem("mq_voivodeships") || "[]"
        ).length;
        const trips = JSON.parse(
          localStorage.getItem("mq_trips") || "[]"
        ).length;
        const distance = Number(localStorage.getItem("mq_distance") || "0");

        unlockProgressAchievements({
          distance,
          tiles,
          towns,
          trips,
          voivodeships,
        });

        const achievements = JSON.parse(
          localStorage.getItem("mq_achievements") || "[]"
        );

        const achievementXp = achievements.reduce(
          (sum: number, a: any) => sum + (a.xp || 0),
          0
        );

        const xp =
          tiles * 25 +
          towns * 250 +
          achievementXp;

        const level =
          Math.floor(xp / 1000) + 1;

        setStats({
          tiles,
          towns,
          xp,
          level,
        });

        await savePlayer(user.id);
      };

      await update();

      const interval = setInterval(
        update,
        5000
      );

      return () =>
        clearInterval(interval);
    }

    init();
  }, []);

  return stats;
}

function unlockProgressAchievements({
  distance,
  tiles,
  towns,
  trips,
  voivodeships,
}: {
  distance: number;
  tiles: number;
  towns: number;
  trips: number;
  voivodeships: number;
}) {
  if (towns >= 10) {
    unlockAchievement("towns-10", "Lokalny odkrywca", 500);
  }

  if (towns >= 50) {
    unlockAchievement("towns-50", "Miliony drog", 1500);
  }

  if (tiles >= 100) {
    unlockAchievement("tiles-100", "Odkrywca kafelkow", 750);
  }

  if (tiles >= 1000) {
    unlockAchievement("tiles-1000", "Kartograf MotoQuest", 3000);
  }

  if (voivodeships >= 8) {
    unlockAchievement("voivodeships-8", "Pol Polski", 2500);
  }

  if (voivodeships >= 16) {
    unlockAchievement("voivodeships-16", "Korona Polski", 7000);
  }

  if (distance >= 100) {
    unlockAchievement("distance-100", "Setka na liczniku", 1000);
  }

  if (distance >= 1000) {
    unlockAchievement("distance-1000", "Dlugodystansowiec", 5000);
  }

  if (trips >= 10) {
    unlockAchievement("trip-10", "Kolekcjoner tras", 2500);
  }
}
