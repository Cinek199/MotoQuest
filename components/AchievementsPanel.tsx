"use client";

import { useEffect, useState } from "react";

interface Achievement {
  id: string;
  title: string;
  xp: number;
}

export default function AchievementsPanel() {
  const [achievements, setAchievements] =
    useState<Achievement[]>([]);

  useEffect(() => {
    const update = () => {
      const data = JSON.parse(
        localStorage.getItem(
          "mq_achievements"
        ) || "[]"
      );

      setAchievements(data);
    };

    update();

    const interval = setInterval(
      update,
      1000
    );

    return () =>
      clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
      <h2 className="text-xl font-bold mb-4">
        🏆 Osiągnięcia
      </h2>

      <div className="space-y-2">

        {achievements.length === 0 && (
          <div className="text-zinc-500">
            Brak osiągnięć
          </div>
        )}

        {achievements.map((a) => (
          <div
            key={a.id}
            className="bg-zinc-800 rounded-xl p-3 flex justify-between"
          >
            <span>{a.title}</span>

            <span className="text-orange-500">
              +{a.xp} XP
            </span>
          </div>
        ))}

      </div>
    </div>
  );
}