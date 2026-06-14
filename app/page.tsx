"use client";

import { useEffect, useState } from "react";

import AchievementsPanel from "../components/AchievementsPanel";
import BikeProfilePanel from "../components/BikeProfilePanel";
import CloudStatusPanel from "../components/CloudStatusPanel";
import DevRuntimeGuard from "../components/DevRuntimeGuard";
import GaragePanel from "../components/GaragePanel";
import LeaderboardPanel from "../components/LeaderboardPanel";
import MapView from "../components/MapView";
import NotificationsPanel from "../components/NotificationsPanel";
import PlayerProfilePanel from "../components/PlayerProfilePanel";
import PolandMap from "../components/PolandMap";
import SplashScreen from "../components/SplashScreen";
import TownsPanel from "../components/TownsPanel";
import TripsPanel from "../components/TripsPanel";
import VoivodeshipPanel from "../components/VoivodeshipPanel";
import XPBar from "../components/XPBar";

import { signInAnonymously } from "../lib/auth";
import { loadPlayer } from "../lib/loadPlayer";
import { getUnreadNotificationsCount } from "../lib/notifications";
import { usePlayerStats } from "../lib/usePlayerStats";

type TabId =
  | "map"
  | "trips"
  | "achievements"
  | "garage"
  | "profile"
  | "notifications";

const tabs: Array<{
  id: TabId;
  label: string;
}> = [
  {
    id: "map",
    label: "Mapa",
  },
  {
    id: "trips",
    label: "Wyprawy",
  },
  {
    id: "achievements",
    label: "Odznaki",
  },
  {
    id: "garage",
    label: "Garaz",
  },
  {
    id: "profile",
    label: "Profil",
  },
];

export default function Home() {
  const stats = usePlayerStats();

  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [showSplash, setShowSplash] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("Uruchamianie...");
  const [progress, setProgress] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    async function init() {
      setLoadingStatus("Logowanie...");
      setProgress(25);

      await new Promise((resolve) => setTimeout(resolve, 800));

      const user = await signInAnonymously();

      if (!user) {
        setShowSplash(false);
        return;
      }

      setLoadingStatus("Pobieranie postepu...");
      setProgress(50);

      await loadPlayer(user.id);

      setLoadingStatus("Ladowanie MotoQuest...");
      setProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 500));

      setShowSplash(false);
    }

    init();
  }, []);

  useEffect(() => {
    const syncNotifications = () => {
      setUnreadNotifications(getUnreadNotificationsCount());
    };

    syncNotifications();

    const interval = window.setInterval(syncNotifications, 1000);

    window.addEventListener("mq-notifications-updated", syncNotifications);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("mq-notifications-updated", syncNotifications);
    };
  }, []);

  if (showSplash) {
    return (
      <>
        <DevRuntimeGuard />
        <SplashScreen status={loadingStatus} progress={progress} />
      </>
    );
  }

  return (
    <main
      className={[
        "mq-app-shell min-h-screen text-white",
        activeTab === "map" ? "mq-map-active" : "",
      ].join(" ")}
    >
      <DevRuntimeGuard />

      <div className="mq-phone-frame relative z-10 mx-auto w-full px-3 py-3">
        {activeTab === "map" && (
          <MapView
            hasUnreadNotifications={unreadNotifications > 0}
            onOpenNotifications={() => setActiveTab("notifications")}
          />
        )}

        {activeTab === "trips" && (
          <section className="mq-screen space-y-3">
            <ScreenHeader title="Wyprawy" />
            <TripsPanel />
          </section>
        )}

        {activeTab === "achievements" && (
          <section className="mq-screen space-y-3">
            <ScreenHeader title="Odznaki" />
            <AchievementsPanel />
            <div className="grid gap-3">
              <PolandMap />
              <VoivodeshipPanel />
            </div>
            <div className="grid gap-3">
              <TownsPanel />
            </div>
          </section>
        )}

        {activeTab === "garage" && (
          <section className="mq-screen space-y-3">
            <ScreenHeader title="Garaz" action="+" />
            <div className="grid gap-3">
              <GaragePanel />
              <BikeProfilePanel />
            </div>
          </section>
        )}

        {activeTab === "profile" && (
          <section className="mq-screen space-y-3">
            <ScreenHeader title="Profil" action="gear" />
            <PlayerProfilePanel stats={stats} />
            <XPBar xp={stats.xp} />
            <div className="grid gap-3">
              <CloudStatusPanel />
              <LeaderboardPanel />
            </div>
          </section>
        )}

        {activeTab === "notifications" && (
          <section className="mq-screen space-y-3">
            <ScreenHeader title="Powiadomienia" />
            <NotificationsPanel />
          </section>
        )}
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}

function ScreenHeader({
  action,
  title,
}: {
  action?: "+" | "gear";
  title: string;
}) {
  return (
    <header className="grid h-14 grid-cols-[44px_1fr_44px] items-center">
      <button
        type="button"
        aria-label="Menu"
        className="flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-300"
      >
        <span className="text-2xl leading-none">≡</span>
      </button>

      <h1 className="truncate text-center text-lg font-black text-white">
        {title}
      </h1>

      <button
        type="button"
        aria-label="Akcja"
        className="flex h-10 w-10 items-center justify-center rounded-2xl text-orange-500"
      >
        {action === "+" ? (
          <span className="text-2xl leading-none">+</span>
        ) : action === "gear" ? (
          <span className="h-5 w-5 rounded-full border-2 border-current" />
        ) : (
          <span />
        )}
      </button>
    </header>
  );
}

function BottomNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  return (
    <nav className="mq-bottom-nav fixed inset-x-0 bottom-0 z-50 px-3 pb-3">
      <div className="mq-bottom-nav-inner mx-auto overflow-hidden rounded-[1.65rem] border border-white/10 bg-black/92 shadow-2xl shadow-black/90 backdrop-blur-2xl">
        <div className="h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
        <div className="mq-bottom-nav-grid grid grid-cols-5 gap-0 px-2 py-2">
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={selected ? "page" : undefined}
                className={[
                  "mq-bottom-nav-item group relative flex min-h-[54px] flex-col items-center justify-center gap-1 border text-[10px] font-black transition active:scale-95",
                  selected
                    ? "border-transparent bg-transparent text-orange-500"
                    : "border-transparent bg-transparent text-zinc-500 hover:text-white",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-6 w-6 items-center justify-center transition",
                    selected
                      ? "text-orange-500"
                      : "text-zinc-400 group-hover:text-orange-400",
                  ].join(" ")}
                >
                  <NavIcon id={tab.id} />
                </span>
                <span className="max-w-full truncate px-1 leading-none">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function NavIcon({ id }: { id: TabId }) {
  const common = {
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  if (id === "map") {
    return (
      <svg {...common}>
        <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" />
        <path d="M9 3v15" />
        <path d="M15 6v15" />
      </svg>
    );
  }

  if (id === "trips") {
    return (
      <svg {...common}>
        <path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2V6z" />
        <path d="M9 4v14" />
        <path d="M15 6v14" />
        <path d="M6.5 10.5h1" />
        <path d="M11.5 8.5h1" />
        <path d="M16.5 12.5h1" />
      </svg>
    );
  }

  if (id === "achievements") {
    return (
      <svg {...common}>
        <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
        <path d="M6 6H4a3 3 0 0 0 3 3" />
        <path d="M18 6h2a3 3 0 0 1-3 3" />
        <path d="M12 13v5" />
        <path d="M9 21h6" />
      </svg>
    );
  }

  if (id === "garage") {
    return (
      <svg {...common}>
        <path d="M4 11l8-6 8 6" />
        <path d="M6 10v10h12V10" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
