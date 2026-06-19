"use client";

import { useEffect, useState } from "react";

import { getDiscoveredAreaKm2 } from "../lib/explorationProgress";
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
    target: 25,
    title: "Odkrywca obszaru",
    unit: "km²",
    xp: 750,
  },
  {
    id: "tiles-1000",
    target: 250,
    title: "Kartograf powierzchni",
    unit: "km²",
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
  const [activeFilter, setActiveFilter] = useState("Wszystkie");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState({
    areaKm2: 0,
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
      const tiles = getJson<string[]>(STORAGE_KEYS.tiles, []);

      setAchievements(savedAchievements);
      setProgress({
        areaKm2: getDiscoveredAreaKm2(tiles.length),
        distance: getNumber(STORAGE_KEYS.distance),
        tiles: tiles.length,
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
  const completedGoals = GOALS.filter((goal) => {
    return unlockedIds.has(goal.id) || getGoalValue(goal, progress) >= goal.target;
  }).length;
  const overallPercent = Math.round((completedGoals / GOALS.length) * 100);
  const visibleGoals = GOALS.filter((goal) => {
    const unlocked = unlockedIds.has(goal.id) || getGoalValue(goal, progress) >= goal.target;
    if (activeFilter === "Odkryte") return unlocked;
    if (activeFilter === "Trasy") return goal.id.startsWith("trip-") || goal.id.startsWith("distance-");
    if (activeFilter === "Wyzwania") return !unlocked && !goal.id.startsWith("trip-");
    return true;
  });

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#08090b] shadow-2xl shadow-black/50">
      <div className="space-y-3 p-3 sm:p-4">
        <SegmentedTabs active={activeFilter} labels={["Wszystkie", "Odkryte", "Wyzwania", "Trasy"]} onChange={setActiveFilter} />

        <div className="grid grid-cols-3 gap-2">
          <SummaryCard label="Zdobyte" value={String(achievements.length)} />
          <SummaryCard label="XP z odznak" value={`+${totalXp}`} />
          <SummaryCard label="Postep" value={`${overallPercent}%`} />
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-zinc-900">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-lime-400 transition-all"
            style={{
              width: `${overallPercent}%`,
            }}
          />
        </div>

        <div className="space-y-2">
          {visibleGoals.map((goal, index) => {
            const value = getGoalValue(goal, progress);
            const unlocked = unlockedIds.has(goal.id) || value >= goal.target;
            const percent = Math.min(100, Math.round((value / goal.target) * 100));

            return (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={index}
                percent={percent}
                unlocked={unlocked}
                value={value}
              />
            );
          })}
          {visibleGoals.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-black/40 p-8 text-center text-sm font-bold text-zinc-500">
              Brak osiagniec w tej kategorii.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SegmentedTabs({ active, labels, onChange }: { active: string; labels: string[]; onChange: (label: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-black/45 p-1">
      {labels.map((label, index) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(label)}
          className={[
            "min-h-10 rounded-xl px-1 text-[10px] font-black transition",
            active === label
              ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20"
              : "text-zinc-400 hover:text-white",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function GoalCard({
  goal,
  index,
  percent,
  unlocked,
  value,
}: {
  goal: AchievementGoal;
  index: number;
  percent: number;
  unlocked: boolean;
  value: number;
}) {
  return (
    <article
      className={[
        "overflow-hidden rounded-[1.35rem] border p-3 transition",
        unlocked
          ? "border-orange-500/35 bg-orange-500/10 shadow-lg shadow-orange-950/10"
          : "border-white/10 bg-black/45",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-black",
            unlocked
              ? "border-orange-500/40 bg-orange-500 text-black"
              : "border-white/10 bg-zinc-950 text-zinc-500",
          ].join(" ")}
        >
          {unlocked ? "OK" : index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-white">
                {goal.title}
              </div>
              <div className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
                {formatGoalValue(value, goal)} / {goal.target} {goal.unit}
              </div>
            </div>

            <span
              className={[
                "shrink-0 rounded-full border px-3 py-1 text-xs font-black",
                unlocked
                  ? "border-orange-500/40 bg-orange-500 text-black"
                  : "border-white/10 bg-zinc-950 text-zinc-400",
              ].join(" ")}
            >
              +{goal.xp} XP
            </span>
          </div>

          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-900">
            <div
              className={[
                "h-full rounded-full transition-all",
                unlocked
                  ? "bg-gradient-to-r from-orange-500 to-lime-400"
                  : "bg-orange-500",
              ].join(" ")}
              style={{
                width: `${percent}%`,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-black/45 p-3">
      <div className="truncate text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 truncate text-xl font-black text-orange-400">{value}</div>
    </div>
  );
}

function formatGoalValue(value: number, goal: AchievementGoal) {
  const precision = goal.unit === "km" || goal.unit === "km²" ? 1 : 0;

  return Math.min(value, goal.target).toFixed(precision);
}

function getGoalValue(
  goal: AchievementGoal,
  progress: {
    areaKm2: number;
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

  if (goal.unit === "km²") {
    return progress.areaKm2;
  }

  if (goal.unit === "miejscowosci") {
    return progress.towns;
  }

  if (goal.unit === "wojewodztw") {
    return progress.voivodeships;
  }

  return progress.trips;
}
