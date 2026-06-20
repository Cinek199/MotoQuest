"use client";

import { useEffect, useState } from "react";

import { getDiscoveredAreaKm2 } from "../lib/explorationProgress";
import { supabase } from "../lib/supabase";

type RankedPlayer = {
  areaKm2: number;
  avatarUrl: string;
  id: string;
  nickname: string;
  tiles: number;
};

export default function LeaderboardPanel() {
  const [players, setPlayers] = useState<RankedPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.rpc("mq_real_player_leaderboard", {
        p_limit: 20,
      });

      if (error || !data?.length) {
        setPlayers([]);
        setLoading(false);
        return;
      }

      setPlayers(
        data.map(
          (row: {
            avatar_url: string | null;
            tiles_count: number;
            user_id: string;
            username: string;
          }) => {
            const tiles = Number(row.tiles_count || 0);

            return {
              areaKm2: getDiscoveredAreaKm2(tiles),
              avatarUrl: row.avatar_url || "",
              id: row.user_id,
              nickname: row.username || "Odkrywca",
              tiles,
            };
          }
        )
      );
      setLoading(false);
    };

    void load();
  }, []);

  const podium = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <section className="mq-ranking-premium">
      <div className="mq-ranking-premium-head">
        <div>
          <span className="mq-profile-eyebrow">Rywalizacja</span>
          <h2>Ranking odkrywcow</h2>
          <p>
            Tylko zarejestrowani gracze. Pozycja zalezy od odkrytego obszaru,
            zgodnie z obecna logika rankingu.
          </p>
        </div>

        <div className="mq-ranking-premium-pill">
          <strong>{players.length}</strong>
          <span>graczy</span>
        </div>
      </div>

      {loading ? <div className="mq-ranking-premium-empty">Ladowanie rankingu...</div> : null}

      {!loading && players.length === 0 ? (
        <div className="mq-ranking-premium-empty">
          Brak zarejestrowanych graczy z postepem.
        </div>
      ) : null}

      {!loading && podium.length > 0 ? (
        <div className="mq-ranking-podium">
          {podium.map((player, index) => (
            <article
              key={player.id}
              className={[
                "mq-ranking-podium-card",
                `is-place-${index + 1}`,
              ].join(" ")}
            >
              <div className="mq-ranking-podium-rank">{index + 1}</div>
              <Avatar player={player} large />
              <strong>{player.nickname}</strong>
              <span>{player.tiles} kafelkow</span>
              <em>{formatArea(player.areaKm2)}</em>
            </article>
          ))}
        </div>
      ) : null}

      {!loading && rest.length > 0 ? (
        <div className="mq-ranking-premium-list">
          {rest.map((player, index) => (
            <article key={player.id} className="mq-ranking-premium-row">
              <strong className="mq-ranking-premium-position">{index + 4}</strong>
              <Avatar player={player} />
              <div className="mq-ranking-premium-player">
                <b>{player.nickname}</b>
                <span>{player.tiles} odkrytych kafelkow</span>
              </div>
              <em className="mq-ranking-premium-area">
                {formatArea(player.areaKm2)}
                <span>obszaru</span>
              </em>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Avatar({
  large,
  player,
}: {
  large?: boolean;
  player: RankedPlayer;
}) {
  return (
    <div className={large ? "mq-ranking-avatar large" : "mq-ranking-avatar"}>
      {player.avatarUrl ? (
        <img src={player.avatarUrl} alt="" />
      ) : (
        player.nickname.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}

function formatArea(area: number) {
  return area < 10 ? `${area.toFixed(1)} km2` : `${Math.round(area)} km2`;
}
