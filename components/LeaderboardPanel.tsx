"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function LeaderboardPanel() {
  const [players, setPlayers] =
    useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const {
        data,
        error,
      } = await supabase
        .from("players")
        .select("xp,level")
        .order("xp", {
          ascending: false,
        })
        .limit(20);

      if (error) {
        console.error(error);
        return;
      }

      setPlayers(data || []);
    }

    load();
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
      <h2 className="text-xl font-bold mb-4">
        🏆 Ranking TOP 20
      </h2>

      {players.map((p, i) => (
        <div
          key={i}
          className="bg-zinc-800 rounded-xl p-3 mb-2"
        >
          #{i + 1} • Level {p.level} • {p.xp} XP
        </div>
      ))}
    </div>
  );
}