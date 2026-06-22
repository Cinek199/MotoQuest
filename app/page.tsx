"use client";

import { useEffect, useState } from "react";

import AchievementsPanel from "../components/AchievementsPanel";
import BikeProfilePanel from "../components/BikeProfilePanel";
import CityMissionsPanel from "../components/CityMissionsPanel";
import CloudStatusPanel from "../components/CloudStatusPanel";
import DevRuntimeGuard from "../components/DevRuntimeGuard";
import GaragePanel from "../components/GaragePanel";
import LeaderboardPanel from "../components/LeaderboardPanel";
import MapView from "../components/MapView";
import NotificationsPanel from "../components/NotificationsPanel";
import PlayerProfilePanel from "../components/PlayerProfilePanel";
import PolandMap from "../components/PolandMap";
import SplashScreen from "../components/SplashScreen";
import SpecialBadgesPanel from "../components/SpecialBadgesPanel";
import SettingsPanel from "../components/SettingsPanel";
import TownsPanel from "../components/TownsPanel";
import TripsPanel from "../components/TripsPanel";
import XPBar from "../components/XPBar";

import { signInAnonymously } from "../lib/auth";
import { getUnreadNotificationsCount } from "../lib/notifications";
import { loadPlayer } from "../lib/playerService";
import { usePlayerStats } from "../lib/usePlayerStats";
import { useScreenWakeLock } from "../lib/useScreenWakeLock";

type TabId = "map" | "trips" | "profile" | "garage" | "tasks" | "ranking" | "settings" | "achievements" | "notifications";

const tabs: Array<{
  id: TabId;
  label: string;
}> = [
  { id: "map", label: "Mapa" },
  { id: "trips", label: "Wyprawy" },
  { id: "profile", label: "Profil" },
  { id: "garage", label: "Garaz" },
  { id: "tasks", label: "Zadania" },
  { id: "ranking", label: "Ranking" },
];

export default function Home() {
  const stats = usePlayerStats();

  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [showSplash, setShowSplash] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("Uruchamianie...");
  const [progress, setProgress] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useScreenWakeLock(!showSplash);

  useEffect(() => {
    const requestedTab = window.location.hash.slice(1) as TabId;
    const availableTabs: TabId[] = ["map", "trips", "profile", "garage", "tasks", "ranking", "settings", "achievements", "notifications"];
    if (availableTabs.includes(requestedTab)) {
      setActiveTab(requestedTab);
      history.replaceState(null, "", window.location.pathname);
    }

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

      try {
        await loadPlayer(user.id);
      } catch (error) {
        console.error("Initial player load error:", error);
      }

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

        {activeTab === "tasks" && (
          <section className="mq-screen mq-screen-safe space-y-3">
            <ScreenHeader title="Zadania" />
            <CityMissionsPanel />
          </section>
        )}

        {activeTab === "trips" && (
          <section className="mq-screen mq-screen-safe space-y-3">
            <ScreenHeader title="Wyprawy" />
            <TripsPanel />
          </section>
        )}

        {activeTab === "achievements" && (
          <section className="mq-screen mq-screen-safe space-y-3">
            <ScreenHeader title="Odznaki" />
            <CollapsibleSection title="Osiagniecia i wyzwania"><AchievementsPanel /></CollapsibleSection>
            <CollapsibleSection title="Mapa Polski"><PolandMap /></CollapsibleSection>
            <CollapsibleSection title="Odkrycia miejscowosci"><TownsPanel /></CollapsibleSection>
          </section>
        )}

        {activeTab === "garage" && (
          <section className="mq-screen mq-screen-safe space-y-3">
            <ScreenHeader title="Garaz" />
            <div className="grid gap-3">
              <GaragePanel />
              <BikeProfilePanel />
            </div>
          </section>
        )}

        {activeTab === "profile" && (
          <section className="mq-screen mq-screen-safe space-y-3">
            <ScreenHeader title="Profil" action="gear" onAction={() => setActiveTab("settings")} />
            <PlayerProfilePanel stats={stats} />
            <SpecialBadgesPanel />
            <XPBar xp={stats.xp} />
            <CloudStatusPanel />
            <button type="button" className="mq-panel-link" onClick={() => setActiveTab("achievements")}>Zobacz wszystkie osiagniecia</button>
          </section>
        )}

        {activeTab === "ranking" && (
          <section className="mq-screen mq-screen-safe space-y-3">
            <ScreenHeader title="Ranking" />
            <LeaderboardPanel />
          </section>
        )}

        {activeTab === "settings" && (
          <section className="mq-screen mq-screen-safe space-y-3">
            <ScreenHeader title="Ustawienia" back onAction={() => setActiveTab("profile")} />
            <SettingsPanel />
          </section>
        )}

        {activeTab === "notifications" && (
          <section className="mq-screen mq-screen-safe space-y-3">
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
  back,
  onAction,
  title,
}: {
  action?: "+" | "gear";
  back?: boolean;
  onAction?: () => void;
  title: string;
}) {
  return (
    <header className="mq-screen-header grid h-14 grid-cols-[44px_1fr_44px] items-center">
      <button
        type="button"
        aria-label={back ? "Wroc" : "Menu"}
        onClick={back ? onAction : undefined}
        className={["flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-300", back ? "mq-screen-back" : ""].join(" ")}
      >
        {back ? <ArrowLeftIcon /> : <MenuIcon />}
      </button>

      <h1 className="truncate text-center text-lg font-black text-white">
        {title}
      </h1>

      <button
        type="button"
        aria-label={action === "gear" ? "Ustawienia" : "Akcja"}
        onClick={onAction}
        className="flex h-10 w-10 items-center justify-center rounded-2xl text-orange-500"
      >
        {action === "+" ? (
          <span className="text-2xl leading-none">+</span>
        ) : action === "gear" ? (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/><circle cx="12" cy="12" r="7"/></svg>
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
  const [isLandscape, setIsLandscape] = useState(false);
  const [isLandscapeNavOpen, setIsLandscapeNavOpen] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(orientation: landscape)");

    const syncOrientation = () => {
      setIsLandscape(mediaQuery.matches);
      setIsLandscapeNavOpen(!mediaQuery.matches);
    };

    syncOrientation();
    mediaQuery.addEventListener("change", syncOrientation);

    return () => mediaQuery.removeEventListener("change", syncOrientation);
  }, []);

  const handleTabChange = (tabId: TabId) => {
    onTabChange(tabId);

    if (isLandscape) {
      setIsLandscapeNavOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Pokaz menu"
        onClick={() => setIsLandscapeNavOpen(true)}
        className={[
          "mq-landscape-menu-toggle fixed z-50",
          isLandscape && isLandscapeNavOpen ? "is-hidden" : "",
        ].join(" ")}
      >
        <span />
        <span />
        <span />
      </button>

      <nav
        className={[
          "mq-bottom-nav fixed inset-x-0 bottom-0 z-50",
          isLandscape ? "is-landscape" : "",
          isLandscape && !isLandscapeNavOpen ? "is-landscape-closed" : "",
          isLandscape && isLandscapeNavOpen ? "is-landscape-open" : "",
        ].join(" ")}
      >
        <div className="mq-bottom-nav-inner">
        <div className="mq-bottom-nav-grid grid grid-cols-6">
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                aria-current={selected ? "page" : undefined}
                className={[
                  "mq-bottom-nav-item group",
                  selected ? "is-active" : "",
                ].join(" ")}
              >
                <span className="mq-bottom-nav-icon">
                  <NavIcon id={tab.id} />
                </span>
                <span className="mq-bottom-nav-label">{tab.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            aria-label="Schowaj menu"
            onClick={() => setIsLandscapeNavOpen(false)}
            className="mq-bottom-nav-item mq-bottom-nav-collapse"
          >
            <span className="mq-bottom-nav-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </span>
            <span className="mq-bottom-nav-label">Schowaj</span>
          </button>
        </div>
      </div>
      </nav>
    </>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h12" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h10" />
    </svg>
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

  if (id === "tasks") {
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

  if (id === "trips") {
    return (
      <svg {...common}>
        <path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2V6z" />
        <path d="M9 4v14M15 6v14" />
        <circle cx="7" cy="10" r="1" />
        <circle cx="17" cy="14" r="1" />
      </svg>
    );
  }

  if (id === "ranking") {
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

  if (id === "settings") {
    return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z" /></svg>;
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function CollapsibleSection({ children, title }: { children: React.ReactNode; title: string }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mq-collapsible">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span>{title}</span><b>{open ? "-" : "+"}</b>
      </button>
      {open && <div className="mq-collapsible-content">{children}</div>}
    </section>
  );
}
