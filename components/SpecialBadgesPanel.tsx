"use client";

import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

type Badge = {
  description: string;
  icon: string;
  id: string;
  name: string;
};

export default function SpecialBadgesPanel() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [completedCities, setCompletedCities] = useState(0);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [badgeLinks, cityLinks] = await Promise.all([
        supabase
          .from("mq_user_special_badges")
          .select("badge_id")
          .eq("user_id", user.id),
        supabase
          .from("mq_city_completions")
          .select("city_id")
          .eq("user_id", user.id),
      ]);
      const ids = (badgeLinks.data ?? []).map((item) => item.badge_id);

      if (ids.length > 0) {
        const { data } = await supabase
          .from("mq_special_badges")
          .select("id, name, description, icon")
          .in("id", ids);
        setBadges((data ?? []) as Badge[]);
      }

      setCompletedCities(cityLinks.data?.length ?? 0);
    };

    void load();
  }, []);

  return (
    <section className="border-y border-white/10 bg-black/30 py-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
            Kolekcja gracza
          </div>
          <h2 className="text-lg font-black text-white">Odznaki specjalne</h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-orange-400">{completedCities}</div>
          <div className="text-[9px] font-bold uppercase text-zinc-500">ukonczone miasta</div>
        </div>
      </div>

      {badges.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {badges.map((badge) => (
            <div key={badge.id} className="rounded-lg border border-orange-500/20 bg-zinc-950 p-3">
              <div className="text-sm font-black text-orange-300">{badge.name}</div>
              <div className="mt-1 text-[10px] text-zinc-500">{badge.description}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 text-sm text-zinc-500">Pierwsza rzadka odznaka nadal czeka.</div>
      )}
    </section>
  );
}
