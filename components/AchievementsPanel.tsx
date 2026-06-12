"use client";

import { useEffect, useState } from "react";

import { getJson, getNumber, STORAGE_KEYS } from "../lib/storage";
import type { FinishedTrip } from "../lib/trips";

type Achievement = {
  id: string;
  title: string;
  xp: number;
};

type AchievementGoal = {
  id: string;
  target: number;
  title: string;
  unit: string;
  xp: number;
};

const GOALS: AchievementGoal[] = [
  {
    id: "first-town",
    target: 1,
    title: "Pierwsza miejscowosc",
    unit: "miejscowosci",
    xp: 100,
  },
  {
    id: "towns-10",
    target: 10,
    title: "Lokalny odkrywca",
    unit: "miejscowosci",
    xp: 500,
  },
  {
    id: "towns-50",
    target: 50,
    title: "Miliony drog",
    unit: "miejscowosci",
    xp: 1500,
  },
  {
    id: "tiles-100",
    target: 100,
    title: "Odkrywca kafelkow",
    unit: "kafelkow",
    xp: 750,
  },
  {
    id: "tiles-1000",
    target: 1000,
    title: "Kartograf MotoQuest",
    unit: "kafelkow",
    xp: 3000,
  },
  {
    id: "first-voivodeship",
    target: 1,
    title: "Pierwsze wojewodztwo",
    unit: "wojewodztw",
    xp: 500,
  },
  {
    id: "voivodeships-8",
    target: 8,
    title: "Pol Polski",
    unit: "wojewodztw",
    xp: 2500,
  },
  {
    id: "voivodeships-16",
    target: 16,
    title: "Korona Polski",
    unit: "wojewodztw",
    xp: 7000,
  },
  {
    id: "distance-100",
    target: 100,
    title: "Setka na liczniku",
    unit: "km",
    xp: 1000,
  },
  {
    id: "distance-1000",
    target: 1000,
    title: "Dlugodystansowiec",
    unit: "km",
    xp: 5000,
  },
  {
    id: "trip-1",
    target: 1,
    title: "Pierwsza wyprawa",
    unit: "wypraw",
    xp: 250,
  },
  {
    id: "trip-10",
    target: 10,
    title: "Kolekcjoner tras",
    unit: "wypraw",
    xp: 2500,
  },
];

export default function AchievementsPanel() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState({
    distance: 0,
    tiles: 0,
    towns: 0,
    trips: 0,
    voivodeships: 0,
  });

  useEffect(() => {
    const update = () => {
      const savedAchievements = getJson<Achievement[]>(
        STORAGE_KEYS.achievements,
        []
      );
      const trips = getJson<FinishedTrip[]>(STORAGE_KEYS.trips, []);

      setAchievements(savedAchievements);
      setProgress({
        distance: getNumber(STORAGE_KEYS.distance),
        tiles: getJson<string[]>(STORAGE_KEYS.tiles, []).length,
        towns: getJson<string[]>(STORAGE_KEYS.towns, []).length,
        trips: trips.length,
        voivodeships: getJson<string[]>(STORAGE_KEYS.voivodeships, []).length,
      });
    };

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, []);

  const unlockedIds = new Set(achievements.map((achievement) => achievement.id));
  const totalXp = achievements.reduce((sum, achievement) => {
    return sum + achievement.xp;
  }, 0);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-orange-500/20 bg-zinc-950 shadow-2xl shadow-black/40">
      <div className="border-b border-zinc-800 bg-black/35 px-5 py-4">
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">
          Odznaki
        </div>
        <div className="mt-1 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black text-white">Osiagniecia</h2>
          <div className="text-right">
            <div className="text-2xl font-black text-orange-500">
              {achievements.length}
            </div>
            <div className="text-[10px] font-black uppercase text-zinc-500">
              zdobyte
            </div>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <SummaryCard label="XP z osiagniec" value={`+${totalXp}`} />
          <SummaryCard label="Cele w katalogu" value={String(GOALS.length)} />
        </div>

        <div className="space-y-2">
          {GOALS.map((goal) => {
            const value = getGoalValue(goal, progress);
            const unlocked = unlockedIds.has(goal.id) || value >= goal.target;
            const percent = Math.min(100, Math.round((value / goal.target) * 100));

            return (
              <div
                key={goal.id}
                className={[
                  "rounded-[1.5rem] border p-4",
                  unlocked
                    ? "border-orange-500/30 bg-orange-500/10"
                    : "border-zinc-800 bg-black/45",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate font-black text-white">
                      {goal.title}
                    </div>
                    <div className="mt-1 text-xs font-bold uppercase text-zinc-500">
                      {Math.min(value, goal.target).toFixed(goal.unit === "km" ? 1 : 0)}
                      {" / "}
                      {goal.target} {goal.unit}
                    </div>
                  </div>

                  <span
                    className={[
                      "shrink-0 rounded-full border px-3 py-1 text-sm font-black",
                      unlocked
                        ? "border-orange-500/30 bg-orange-500 text-black"
                        : "border-zinc-700 bg-zinc-950 text-zinc-400",
                    ].join(" ")}
                  >
                    +{goal.xp} XP
                  </span>
                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all"
                    style={{
                      width: `${percent}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-zinc-800 bg-black/45 p-4">
      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-3xl font-black text-orange-500">{value}</div>
    </div>
  );
}

function getGoalValue(
  goal: AchievementGoal,
  progress: {
    distance: number;
    tiles: number;
    towns: number;
    trips: number;
    voivodeships: number;
  }
) {
  if (goal.unit === "km") {
    return progress.distance;
  }

  if (goal.unit === "kafelkow") {
    return progress.tiles;
  }

  if (goal.unit === "miejscowosci") {
    return progress.towns;
  }

  if (goal.unit === "wojewodztw") {
    return progress.voivodeships;
  }

  return progress.trips;
}
