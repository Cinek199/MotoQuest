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

  const podiumPlayers = players.slice(0, 3);
  const listPlayers = players.slice(3);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#08090b] shadow-2xl shadow-black/50">
      <div className="relative overflow-hidden border-b border-white/10 px-5 py-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.24),transparent_44%),linear-gradient(135deg,rgba(24,24,27,0.9),rgba(0,0,0,0.3))]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.36em] text-orange-500">
              Rywalizacja
            </div>
            <h2 className="mt-1 text-2xl font-black text-white">Ranking TOP 20</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-400">
              Najaktywniejsi odkrywcy MotoQuest.
            </p>
          </div>

          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-right shadow-lg shadow-orange-950/20">
            <div className="text-2xl font-black text-orange-400">
              {players.length}
            </div>
            <div className="text-[10px] font-black uppercase text-zinc-500">
              graczy
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {loading && (
          <div className="rounded-[1.5rem] border border-white/10 bg-black/45 p-5 text-sm font-bold text-zinc-500">
            Ladowanie rankingu...
          </div>
        )}

        {!loading && players.length === 0 && (
          <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/35 px-5 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 text-xl font-black text-orange-400">
              0
            </div>
            <div className="mt-4 text-lg font-black text-white">
              Brak danych rankingu
            </div>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              Po synchronizacji graczy lista pojawi sie tutaj.
            </p>
          </div>
        )}

        {!loading && podiumPlayers.length > 0 && (
          <div className="grid grid-cols-3 items-end gap-2 rounded-[1.75rem] border border-white/10 bg-black/45 p-3">
            {podiumPlayers.map((player, index) => (
              <PodiumCard
                key={`${player.id || player.xp}-podium-${index}`}
                index={index}
                player={player}
              />
            ))}
          </div>
        )}

        {listPlayers.length > 0 && (
          <div className="space-y-2">
            {listPlayers.map((player, index) => (
              <RankingRow
                key={`${player.id || player.xp}-${index + 3}`}
                index={index + 3}
                player={player}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PodiumCard({
  index,
  player,
}: {
  index: number;
  player: LeaderboardPlayer;
}) {
  const nickname = getNickname(player, index);
  const avatarUrl = player.profile?.avatarUrl || "";
  const heightClass = index === 0 ? "min-h-40" : index === 1 ? "min-h-32" : "min-h-28";
  const orderClass = index === 0 ? "order-2" : index === 1 ? "order-1" : "order-3";

  return (
    <div className={`${orderClass} flex flex-col items-center justify-end`}>
      <Avatar nickname={nickname} src={avatarUrl} size="lg" />

      <div
        className={[
          "mt-2 flex w-full flex-col items-center justify-end rounded-2xl border px-2 py-3 text-center",
          heightClass,
          index === 0
            ? "border-amber-400/50 bg-gradient-to-b from-amber-400/25 to-orange-500/10"
            : "border-white/10 bg-zinc-950",
        ].join(" ")}
      >
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black",
            index === 0 ? "bg-amber-400 text-black" : "bg-zinc-800 text-white",
          ].join(" ")}
        >
          {index + 1}
        </div>
        <div className="mt-2 max-w-full truncate text-sm font-black text-white">
          {nickname}
        </div>
        <div className="mt-1 text-[10px] font-black uppercase text-zinc-500">
          LVL {player.level}
        </div>
        <div className="mt-2 text-sm font-black text-orange-400">
          {player.xp} XP
        </div>
      </div>
    </div>
  );
}

function RankingRow({
  index,
  player,
}: {
  index: number;
  player: LeaderboardPlayer;
}) {
  const nickname = getNickname(player, index);
  const avatarUrl = player.profile?.avatarUrl || "";

  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-black/45 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-950 text-sm font-black text-zinc-300">
          {index + 1}
        </div>

        <Avatar nickname={nickname} src={avatarUrl} />

        <div className="min-w-0">
          <div className="truncate font-black text-white">{nickname}</div>
          <div className="text-xs font-bold uppercase text-zinc-500">
            Poziom {player.level}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="font-black text-orange-400">{player.xp}</div>
        <div className="text-[10px] font-black uppercase text-zinc-500">XP</div>
      </div>
    </div>
  );
}

function Avatar({
  nickname,
  size = "md",
  src,
}: {
  nickname: string;
  size?: "md" | "lg";
  src: string;
}) {
  const sizeClass = size === "lg" ? "h-14 w-14" : "h-11 w-11";

  return (
    <div
      className={`${sizeClass} shrink-0 overflow-hidden rounded-full border border-white/10 bg-zinc-900`}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-lg font-black text-orange-500">
          {nickname.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function getNickname(player: LeaderboardPlayer, index: number) {
  const nickname = player.profile?.nickname?.trim();

  return nickname || `Gracz ${index + 1}`;
}
