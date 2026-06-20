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
  { id: "first-town", target: 1, title: "Pierwsza miejscowosc", unit: "miejscowosci", xp: 100 },
  { id: "towns-10", target: 10, title: "Lokalny odkrywca", unit: "miejscowosci", xp: 500 },
  { id: "towns-50", target: 50, title: "Miliony drog", unit: "miejscowosci", xp: 1500 },
  { id: "tiles-100", target: 25, title: "Odkrywca obszaru", unit: "km2", xp: 750 },
  { id: "tiles-1000", target: 250, title: "Kartograf powierzchni", unit: "km2", xp: 3000 },
  { id: "first-voivodeship", target: 1, title: "Pierwsze wojewodztwo", unit: "wojewodztw", xp: 500 },
  { id: "voivodeships-8", target: 8, title: "Pol Polski", unit: "wojewodztw", xp: 2500 },
  { id: "voivodeships-16", target: 16, title: "Korona Polski", unit: "wojewodztw", xp: 7000 },
  { id: "distance-100", target: 100, title: "Setka na liczniku", unit: "km", xp: 1000 },
  { id: "distance-1000", target: 1000, title: "Dlugodystansowiec", unit: "km", xp: 5000 },
  { id: "trip-1", target: 1, title: "Pierwsza wyprawa", unit: "wypraw", xp: 250 },
  { id: "trip-10", target: 10, title: "Kolekcjoner tras", unit: "wypraw", xp: 2500 },
];

const FILTERS = ["Wszystkie", "Odkryte", "Wyzwania", "Trasy"] as const;

export default function AchievementsPanel() {
  const [activeFilter, setActiveFilter] =
    useState<(typeof FILTERS)[number]>("Wszystkie");
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
  const totalXp = achievements.reduce((sum, achievement) => sum + achievement.xp, 0);
  const completedGoals = GOALS.filter((goal) => {
    return unlockedIds.has(goal.id) || getGoalValue(goal, progress) >= goal.target;
  }).length;
  const overallPercent = Math.round((completedGoals / GOALS.length) * 100);
  const visibleGoals = GOALS.filter((goal) => {
    const unlocked =
      unlockedIds.has(goal.id) || getGoalValue(goal, progress) >= goal.target;

    if (activeFilter === "Odkryte") return unlocked;
    if (activeFilter === "Trasy") {
      return goal.id.startsWith("trip-") || goal.id.startsWith("distance-");
    }
    if (activeFilter === "Wyzwania") {
      return !unlocked && !goal.id.startsWith("trip-");
    }

    return true;
  });

  return (
    <section className="mq-achievements-panel">
      <div className="mq-achievements-head">
        <div>
          <span className="mq-profile-eyebrow">Odznaki i wyzwania</span>
          <h2>Kolekcja osiagniec</h2>
          <p>
            Odblokowuj kolejne etapy odkrywania Polski i buduj swoj profil
            premium odkrywcy.
          </p>
        </div>

        <div className="mq-achievements-progress-pill">
          <strong>{overallPercent}%</strong>
          <span>ukonczenia</span>
        </div>
      </div>

      <div className="mq-achievements-summary">
        <SummaryCard label="Zdobyte" value={String(achievements.length)} />
        <SummaryCard label="XP z odznak" value={`+${totalXp}`} />
        <SummaryCard label="Cele ukonczone" value={`${completedGoals}/${GOALS.length}`} />
      </div>

      <div className="mq-achievements-track">
        <div
          className="mq-achievements-track-fill"
          style={{ width: `${overallPercent}%` }}
        />
      </div>

      <SegmentedTabs
        active={activeFilter}
        labels={[...FILTERS]}
        onChange={(value) => setActiveFilter(value as (typeof FILTERS)[number])}
      />

      <div className="mq-achievements-list">
        {visibleGoals.map((goal, index) => {
          const value = getGoalValue(goal, progress);
          const unlocked =
            unlockedIds.has(goal.id) || value >= goal.target;
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

        {visibleGoals.length === 0 ? (
          <div className="mq-achievements-empty">
            Brak osiagniec w tej kategorii.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SegmentedTabs({
  active,
  labels,
  onChange,
}: {
  active: string;
  labels: string[];
  onChange: (label: string) => void;
}) {
  return (
    <div className="mq-achievements-tabs">
      {labels.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(label)}
          className={active === label ? "is-active" : ""}
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
        "mq-achievement-card",
        unlocked ? "is-unlocked" : "is-locked",
      ].join(" ")}
    >
      <div className="mq-achievement-card-mark">
        <span>{unlocked ? "OK" : index + 1}</span>
      </div>

      <div className="mq-achievement-card-body">
        <div className="mq-achievement-card-top">
          <div>
            <strong>{goal.title}</strong>
            <small>
              {formatGoalValue(value, goal)} / {goal.target} {goal.unit}
            </small>
          </div>

          <em>+{goal.xp} XP</em>
        </div>

        <div className="mq-achievement-card-track">
          <div
            className="mq-achievement-card-fill"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mq-achievement-card-foot">
          <span>{unlocked ? "Zdobyte" : "W trakcie"}</span>
          <span>{percent}%</span>
        </div>
      </div>
    </article>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="mq-achievements-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatGoalValue(value: number, goal: AchievementGoal) {
  const precision = goal.unit === "km" || goal.unit === "km2" ? 1 : 0;

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

  if (goal.unit === "km2") {
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
