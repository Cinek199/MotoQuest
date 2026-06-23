"use client";

import { useEffect, useState } from "react";

import { getActiveBike } from "../lib/garage";
import {
  formatDiscoveredArea,
  formatDiscoveryPercent,
} from "../lib/explorationProgress";
import { getProfile, PlayerProfile, saveProfile } from "../lib/profile";
import { loadPlayer, savePlayer } from "../lib/playerService";
import { getJson, getNumber, STORAGE_KEYS } from "../lib/storage";
import { supabase } from "../lib/supabase";
import type { FinishedTrip } from "../lib/trips";
import type { PlayerStats } from "../lib/usePlayerStats";

type PlayerProfilePanelProps = {
  stats: PlayerStats;
};

type CloudProfile = {
  avatar_url: string | null;
  username: string | null;
};

export default function PlayerProfilePanel({
  stats,
}: PlayerProfilePanelProps) {
  const [profile, setProfile] = useState<PlayerProfile>({
    avatarUrl: "",
    nickname: "MotoManiak",
  });
  const [status, setStatus] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loadCloudAwareProfile = async () => {
      const savedProfile = getProfile();

      setProfile(savedProfile);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(user.is_anonymous !== true);

      try {
        await loadPlayer(user.id);
      } catch (error) {
        console.error("Load player after login error:", error);
        setStatus("Nie udalo sie pobrac postepu z chmury");
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile load error:", error.message);

        const metadataNickname = user.user_metadata?.username;
        const fallbackNickname =
          typeof metadataNickname === "string" && metadataNickname.trim()
            ? metadataNickname.trim()
            : savedProfile.nickname || "MotoManiak";

        const fallbackProfile: PlayerProfile = {
          ...savedProfile,
          nickname: fallbackNickname,
        };

        saveProfile(fallbackProfile);
        setProfile(fallbackProfile);
        return;
      }

      const cloudData = data as CloudProfile | null;
      const cloudNickname =
        cloudData?.username?.trim() ||
        user.user_metadata?.username ||
        savedProfile.nickname ||
        "MotoManiak";

      const cloudProfile: PlayerProfile = {
        avatarUrl: cloudData?.avatar_url || savedProfile.avatarUrl || "",
        nickname: cloudNickname,
      };

      saveProfile(cloudProfile);
      setProfile(cloudProfile);
    };

    void loadCloudAwareProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadCloudAwareProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const activeBike = getActiveBike();
  const distanceKm = getNumber(STORAGE_KEYS.distance);
  const trips = getJson<FinishedTrip[]>(STORAGE_KEYS.trips, []);
  const voivodeships = getJson<string[]>(STORAGE_KEYS.voivodeships, []);
  const lastTrip = trips[0] ?? null;
  const xpInLevel = stats.xp % 1000;
  const xpToNextLevel = Math.max(0, 1000 - xpInLevel);
  const androidApkHref = "/downloads/motoquest-android-latest.apk";

  if (!isLoggedIn) {
    return (
      <section className="mq-profile-guest">
        <div className="mq-profile-guest-mark">MQ</div>
        <div className="mq-profile-guest-copy">
          <span className="mq-profile-eyebrow">Profil kierowcy</span>
          <h2>Zaloguj sie, aby zachowac swoj swiat</h2>
          <p>
            Zaloguj sie, aby zapisywac postep i synchronizowac MotoQuest miedzy
            telefonami.
          </p>
        </div>
        <div className="mq-profile-guest-actions">
          <a href="/login">Zaloguj sie</a>
          <a href="/register" className="secondary">
            Zarejestruj sie
          </a>
        </div>
      </section>
    );
  }

  const syncPlayer = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await savePlayer(user.id);
    }
  };

  const updateCloudProfile = async (nextProfile: PlayerProfile) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { data: takenProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", nextProfile.nickname)
      .neq("id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("Cloud profile username check error:", checkError.message);
      throw new Error("PROFILE_CHECK_FAILED");
    }

    if (takenProfile) {
      throw new Error("USERNAME_TAKEN");
    }

    const { error } = await supabase.from("profiles").upsert({
      avatar_url: nextProfile.avatarUrl || null,
      id: user.id,
      updated_at: new Date().toISOString(),
      username: nextProfile.nickname,
    });

    if (error) {
      console.error("Cloud profile update error:", error.message);
      throw error;
    }
  };

  const updateProfile = async (nextProfile: PlayerProfile) => {
    if (isLoggedIn) {
      await updateCloudProfile(nextProfile);
    }

    saveProfile(nextProfile);
    setProfile(nextProfile);
    await syncPlayer();
  };

  const uploadAvatar = async (file: File) => {
    setStatus("");
    setUploadingAvatar(true);

    try {
      const safeName = file.name.replace(/[^a-z0-9._-]/gi, "-");
      const fileName = `${Date.now()}-${safeName}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (error) {
        setStatus("Nie udalo sie wyslac avatara. Sprawdz bucket avatars.");
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

      await updateProfile({
        ...profile,
        avatarUrl: data.publicUrl,
      });

      setStatus("Avatar zapisany");
    } catch {
      setStatus("Nie udalo sie zapisac avatara");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <section className="mq-profile-panel">
      <div className="mq-profile-hero">
        <div className="mq-profile-hero-glow" />

        <div className="mq-profile-hero-main">
          <label className="mq-profile-avatar">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="mq-profile-avatar-image" />
            ) : (
              <span className="mq-profile-avatar-fallback">
                {profile.nickname.slice(0, 1).toUpperCase()}
              </span>
            )}

            <span className="mq-profile-avatar-edit">
              {uploadingAvatar ? "..." : "Edytuj"}
            </span>

            <input
              type="file"
              accept="image/*"
              disabled={uploadingAvatar}
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  void uploadAvatar(file);
                }
              }}
              className="hidden"
            />
          </label>

          <div className="mq-profile-hero-copy">
            <span className="mq-profile-eyebrow">Profil kierowcy</span>
            <div className="mq-profile-hero-title-row">
              <h2>{profile.nickname}</h2>
              <span className="mq-profile-level-badge">LVL {stats.level}</span>
            </div>
            <p>
              {activeBike
                ? `Aktywny motocykl: ${activeBike.brand} ${activeBike.model}`
                : "Dodaj aktywny motocykl, aby domknac profil kierowcy."}
            </p>

            <div className="mq-profile-xp-inline">
              <div className="mq-profile-xp-meta">
                <span>XP</span>
                <strong>
                  {xpInLevel} / 1000
                </strong>
              </div>
              <div className="mq-profile-xp-rail">
                <div
                  className="mq-profile-xp-fill"
                  style={{ width: `${Math.min(100, (xpInLevel / 1000) * 100)}%` }}
                />
              </div>
              <div className="mq-profile-xp-note">
                Do kolejnego poziomu: {xpToNextLevel} XP
              </div>
            </div>
          </div>
        </div>

        <div className="mq-profile-hero-side">
          <HeroStat label="Polska" value={formatDiscoveryPercent(stats.tiles)} />
          <HeroStat label="Obszar" value={formatDiscoveredArea(stats.tiles)} />
        </div>
      </div>

      <div className="mq-profile-metrics">
        <ProfileMetric label="Kafelki" value={String(stats.tiles)} />
        <ProfileMetric label="Miasta" value={String(stats.towns)} />
        <ProfileMetric label="Dystans" value={`${distanceKm.toFixed(0)} km`} />
        <ProfileMetric label="Wojewodztwa" value={String(voivodeships.length)} />
      </div>

      <div className="mq-profile-grid">
        <article className="mq-profile-card-surface">
          <span className="mq-profile-card-label">Aktywny motocykl</span>
          <strong className="mq-profile-card-title">
            {activeBike ? `${activeBike.brand} ${activeBike.model}` : "Brak motocykla"}
          </strong>
          <p className="mq-profile-card-copy">
            {activeBike
              ? `Przebieg przypisywany jest do tej maszyny podczas jazdy.`
              : "Przejdz do garazu i ustaw swoj glowny motocykl."}
          </p>
          <a href="/#garage" className="mq-profile-shortcut-link">
            Otworz garaz
          </a>
        </article>

        <article className="mq-profile-card-surface">
          <span className="mq-profile-card-label">Ostatnia aktywnosc</span>
          <strong className="mq-profile-card-title">
            {lastTrip ? lastTrip.name : "Brak zapisanej wyprawy"}
          </strong>
          <p className="mq-profile-card-copy">
            {lastTrip
              ? `${lastTrip.date} - ${lastTrip.distance.toFixed(1)} km - +${lastTrip.xp} XP`
              : "Rozpocznij wyprawe, aby zapisac pierwszy slad odkrywcy."}
          </p>
          <div className="mq-profile-card-meta">
            <span>{trips.length} wypraw</span>
            <span>{stats.towns} odkrytych miast</span>
          </div>
        </article>
      </div>

      <div className="mq-profile-shortcuts">
        <a href="/#garage" className="mq-profile-shortcut-card">
          <span className="mq-profile-shortcut-icon">G</span>
          <strong>Garaz</strong>
          <small>Motocykle i aktywna maszyna</small>
        </a>
        <a href="/#achievements" className="mq-profile-shortcut-card">
          <span className="mq-profile-shortcut-icon">O</span>
          <strong>Osiagniecia</strong>
          <small>Postep, nagrody i wyzwania</small>
        </a>
        <a href="/#ranking" className="mq-profile-shortcut-card">
          <span className="mq-profile-shortcut-icon">R</span>
          <strong>Ranking</strong>
          <small>Porownaj odkryty obszar</small>
        </a>
        <a href="/#settings" className="mq-profile-shortcut-card">
          <span className="mq-profile-shortcut-icon">U</span>
          <strong>Ustawienia</strong>
          <small>Konto, nick i preferencje</small>
        </a>
        <a
          href={androidApkHref}
          download="motoquest-android-latest.apk"
          className="mq-profile-shortcut-card"
        >
          <span className="mq-profile-shortcut-icon">APK</span>
          <strong>Pobierz APK</strong>
          <small>Najnowsza wersja Android do instalacji</small>
        </a>
      </div>

      {status ? <p className="mq-profile-status">{status}</p> : null}
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mq-profile-hero-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="mq-profile-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
