"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { savePlayer } from "./playerService";

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