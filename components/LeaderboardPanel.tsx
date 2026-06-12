"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type LeaderboardProfile = {
  avatarUrl?: string;
  nickname?: string;
};

type LeaderboardPlayer = {
  id?: string;
  level: number;
  profile?: LeaderboardProfile | null;
  xp: number;
};

export default function LeaderboardPanel() {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("players")
        .select("id,xp,level,profile")
        .order("xp", {
          ascending: false,
        })
        .limit(20);

      if (!error) {
        setPlayers(data || []);
      }

      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-orange-500/20 bg-zinc-950 shadow-2xl shadow-black/40">
      <div className="border-b border-zinc-800 bg-black/35 px-5 py-4">
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">
          Rywalizacja
        </div>
        <div className="mt-1 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black text-white">Ranking TOP 20</h2>
          <div className="text-right">
            <div className="text-2xl font-black text-orange-500">
              {players.length}
            </div>
            <div className="text-[10px] font-black uppercase text-zinc-500">
              graczy
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 p-5">
        {loading && (
          <div className="rounded-[1.5rem] border border-zinc-800 bg-black/45 p-5 text-zinc-500">
            Ladowanie rankingu...
          </div>
        )}

        {!loading && players.length === 0 && (
          <div className="rounded-[1.5rem] border border-zinc-800 bg-black/45 p-5 text-zinc-500">
            Brak danych rankingu
          </div>
        )}

        {players.map((player, index) => {
          const podium = index < 3;
          const nickname = getNickname(player, index);
          const avatarUrl = player.profile?.avatarUrl || "";

          return (
            <div
              key={`${player.id || player.xp}-${index}`}
              className={[
                "flex items-center justify-between gap-4 rounded-[1.5rem] border p-4",
                podium
                  ? "border-orange-500/35 bg-orange-500/10"
                  : "border-zinc-800 bg-black/45",
              ].join(" ")}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-black",
                    podium
                      ? "border-orange-500 bg-orange-500 text-black"
                      : "border-zinc-700 bg-zinc-950 text-zinc-300",
                  ].join(" ")}
                >
                  {index + 1}
                </div>

                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-zinc-700 bg-zinc-900">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-black text-orange-500">
                      {nickname.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="truncate font-black text-white">
                    {nickname}
                  </div>
                  <div className="text-xs font-bold uppercase text-zinc-500">
                    Poziom {player.level}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-black text-orange-500">{player.xp}</div>
                <div className="text-[10px] font-black uppercase text-zinc-500">
                  XP
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getNickname(player: LeaderboardPlayer, index: number) {
  const nickname = player.profile?.nickname?.trim();

  return nickname || `Gracz ${index + 1}`;
}
