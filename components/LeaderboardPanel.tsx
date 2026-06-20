"use client";

import { useEffect, useState } from "react";
import { getDiscoveredAreaKm2 } from "../lib/explorationProgress";
import { supabase } from "../lib/supabase";

type RankedPlayer = { id: string; nickname: string; avatarUrl: string; areaKm2: number; tiles: number };

export default function LeaderboardPanel() {
  const [players, setPlayers] = useState<RankedPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.rpc("mq_real_player_leaderboard", { p_limit: 20 });
      if (error || !data?.length) { setPlayers([]); setLoading(false); return; }
      setPlayers(data.map((row: {user_id:string;username:string;avatar_url:string|null;tiles_count:number}) => {
        const tiles = Number(row.tiles_count || 0);
        return { id: row.user_id, nickname: row.username || "Odkrywca", avatarUrl: row.avatar_url || "", tiles, areaKm2: getDiscoveredAreaKm2(tiles) };
      }));
      setLoading(false);
    };
    void load();
  }, []);

  return <section className="mq-ranking-panel">
    <header><div><small>RYWALIZACJA</small><h2>Ranking odkrywcow</h2><p>Tylko zarejestrowani gracze, wedlug odkrytego obszaru.</p></div><b>{players.length}<span>graczy</span></b></header>
    {loading && <div className="mq-ranking-empty">Ladowanie rankingu...</div>}
    {!loading && players.length === 0 && <div className="mq-ranking-empty">Brak zarejestrowanych graczy z postepem.</div>}
    <div className="mq-ranking-list">{players.map((player, index) => <article key={player.id} className={index < 3 ? "is-podium" : ""}>
      <strong>{index + 1}</strong>
      <Avatar player={player} />
      <div><b>{player.nickname}</b><span>{player.tiles} odkrytych kafelkow</span></div>
      <em>{formatArea(player.areaKm2)}<span>obszaru</span></em>
    </article>)}</div>
  </section>;
}

function Avatar({ player }: { player: RankedPlayer }) {
  return <div className="mq-ranking-avatar">{player.avatarUrl ? <img src={player.avatarUrl} alt="" /> : player.nickname.slice(0, 1).toUpperCase()}</div>;
}

function formatArea(area: number) { return area < 10 ? `${area.toFixed(1)} km²` : `${Math.round(area)} km²`; }
