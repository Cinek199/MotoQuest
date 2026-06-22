"use client";

import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

type Badge = {
  description: string;
  icon: string | null;
  id: string;
  name: string;
};

const BADGE_ICONS: Record<string, string> = {
  mountain: "⛰️",
  snow: "❄️",
  storm: "⚡",
  castle: "🏰",
  coast: "🌊",
  forest: "🌲",
  lake: "🏞️",
  city: "🏙️",
  road: "🛣️",
  photo: "📸",
  night: "🌙",
  sunrise: "🌅",
};

export default function SpecialBadgesPanel() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [completedBadgeIds, setCompletedBadgeIds] = useState<string[]>([]);
  const [completedCities, setCompletedCities] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setBadges([]);
        setCompletedBadgeIds([]);
        setCompletedCities(0);
        setIsLoading(false);
        return;
      }

      const [allBadgesResponse, badgeLinks, cityLinks] = await Promise.all([
        supabase
          .from("mq_special_badges")
          .select("id, name, description, icon")
          .order("name"),
        supabase
          .from("mq_user_special_badges")
          .select("badge_id")
          .eq("user_id", user.id),
        supabase
          .from("mq_city_completions")
          .select("city_id")
          .eq("user_id", user.id),
      ]);

      setBadges((allBadgesResponse.data ?? []) as Badge[]);
      setCompletedBadgeIds(
        (badgeLinks.data ?? []).map((item) => String(item.badge_id))
      );
      setCompletedCities(cityLinks.data?.length ?? 0);
      setIsLoading(false);
    };

    void load();
  }, []);

  const unlockedCount = completedBadgeIds.length;

  return (
    <section className="mq-badges-panel">
      <div className="mq-badges-panel-head">
        <div>
          <span className="mq-profile-eyebrow">Kolekcja gracza</span>
          <h2>Odznaki specjalne</h2>
          <p>Rzadkie trofea za miasta, progres i jazde po swoim stylu.</p>
        </div>

        <div className="mq-badges-counter">
          <strong>{unlockedCount}</strong>
          <span>odblokowane</span>
        </div>
      </div>

      <div className="mq-badges-summary">
        <div className="mq-badges-summary-card">
          <span>Ukonczone miasta</span>
          <strong>{completedCities}</strong>
        </div>
        <div className="mq-badges-summary-card">
          <span>Wszystkie odznaki</span>
          <strong>{badges.length}</strong>
        </div>
        <div className="mq-badges-summary-card">
          <span>Status kolekcji</span>
          <strong>{badges.length ? Math.round((unlockedCount / badges.length) * 100) + "%" : "0%"}</strong>
        </div>
      </div>

      {isLoading ? (
        <div className="mq-badges-empty">Ladowanie prestizowych odznak...</div>
      ) : badges.length === 0 ? (
        <div className="mq-badges-empty">
          Pierwsza rzadka odznaka nadal czeka na odkrycie.
        </div>
      ) : (
        <div className="mq-badges-grid">
          {badges.map((badge) => {
            const unlocked = completedBadgeIds.includes(badge.id);

            return (
              <article
                key={badge.id}
                className={[
                  "mq-badge-card",
                  unlocked ? "is-unlocked" : "is-locked",
                ].join(" ")}
              >
                <div className="mq-badge-card-top">
                  <span className="mq-badge-icon" aria-hidden="true">
                    {getBadgeIcon(badge)}
                  </span>
                  <span className="mq-badge-state">
                    {unlocked ? "Zdobyta" : "Zablokowana"}
                  </span>
                </div>
                <strong>{badge.name}</strong>
                <p>{badge.description}</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getBadgeIcon(badge: Badge) {
  const raw = badge.icon?.trim().toLowerCase();

  if (raw && BADGE_ICONS[raw]) {
    return BADGE_ICONS[raw];
  }

  return badge.name.slice(0, 1).toUpperCase();
}
