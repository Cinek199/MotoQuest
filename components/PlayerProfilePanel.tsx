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
import type { PlayerStats } from "../lib/usePlayerStats";

type PlayerProfilePanelProps = {
  stats: PlayerStats;
};

type CloudProfile = {
  username: string | null;
  avatar_url: string | null;
};

export default function PlayerProfilePanel({ stats }: PlayerProfilePanelProps) {
  const [profile, setProfile] = useState<PlayerProfile>({
    avatarUrl: "",
    nickname: "MotoManiak",
  });
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const savedProfile = getProfile();

      setProfile(savedProfile);
      setNickname(savedProfile.nickname);

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
        setNickname(fallbackProfile.nickname);
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
      setNickname(cloudProfile.nickname);
    };

    void loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const activeBike = getActiveBike();
  const distanceKm = getNumber(STORAGE_KEYS.distance);
  const tripsCount = getJson<unknown[]>(STORAGE_KEYS.trips, []).length;
  const xpInLevel = stats.xp % 1000;
  const xpPercent = Math.min(100, Math.round((xpInLevel / 1000) * 100));

  if (!isLoggedIn) {
    return (
      <section className="mq-profile-guest">
        <img src="/icon-512.png" alt="MotoQuest" />
        <h2>Nie jestes zalogowany</h2>
        <p>Zaloguj sie, aby zapisywac postepy i synchronizowac je miedzy urzadzeniami.</p>
        <div><a href="/login">Zaloguj sie</a><a href="/register" className="secondary">Zarejestruj sie</a></div>
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
      id: user.id,
      username: nextProfile.nickname,
      avatar_url: nextProfile.avatarUrl || null,
      updated_at: new Date().toISOString(),
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
    setNickname(nextProfile.nickname);

    await syncPlayer();
  };

  const saveNickname = async () => {
    const cleanNickname = nickname.trim();

    setStatus("");

    if (cleanNickname.length < 3) {
      setStatus("Nick musi mieć minimum 3 znaki");
      return;
    }

    try {
      await updateProfile({
        ...profile,
        nickname: cleanNickname,
      });

      setStatus("Profil zapisany");
    } catch (error) {
      if (error instanceof Error && error.message === "USERNAME_TAKEN") {
        setStatus("Ten nick jest juz zajety. Wybierz inny.");
        return;
      }

      console.error("Save nickname error:", error);
      setStatus("Nie udalo sie zapisac nicku w chmurze");
      return;
      setStatus("Nie udało się zapisać nicku w chmurze");
    }
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
        setStatus("Nie udało się wysłać avatara. Sprawdź bucket avatars.");
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

      await updateProfile({
        ...profile,
        avatarUrl: data.publicUrl,
      });

      setStatus("Avatar zapisany");
    } catch {
      setStatus("Nie udało się zapisać avatara");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#08090b] shadow-2xl shadow-black/50">
      <div className="p-3">
        <div className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-zinc-950/90">
          <div className="relative p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.2),transparent_46%)]" />
            <div className="relative flex items-center gap-4">
              <label className="relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-orange-500 bg-zinc-800 shadow-2xl shadow-orange-500/15">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-black text-orange-500">
                    {profile.nickname.slice(0, 1).toUpperCase()}
                  </div>
                )}
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

              <div className="min-w-0 flex-1">
                <div className="truncate text-2xl font-black text-white">
                  {profile.nickname}
                </div>
                <div className="mt-1 text-sm font-black text-orange-400">
                  Poziom {stats.level}
                </div>
                <div className="mt-2 text-xs font-semibold text-zinc-400">
                  {activeBike
                    ? `${activeBike.brand} ${activeBike.model}`
                    : "Brak aktywnego motocykla"}
                </div>
                <div className="mt-2 text-[11px] font-bold text-zinc-500">
                  {isLoggedIn
                    ? "Konto zalogowane"
                    : "Profil lokalny — zaloguj się, aby przenosić konto"}
                </div>
              </div>
            </div>

            <div className="relative mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-black">
                <span className="text-orange-400">XP</span>
                <span className="text-zinc-300">{xpInLevel} / 1000</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{
                    width: `${xpPercent}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-white/10">
            <ProfileMetric
              label="Polska"
              value={formatDiscoveryPercent(stats.tiles)}
            />
            <ProfileMetric
              label="Obszar"
              value={formatDiscoveredArea(stats.tiles)}
            />
            <ProfileMetric label="Trasy" value={String(tripsCount)} />
            <ProfileMetric label="Dystans" value={`${distanceKm.toFixed(0)} km`} />
          </div>
        </div>

        {status && <div className="mt-3 text-sm font-bold text-orange-400">{status}</div>}
      </div>
    </section>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-t border-white/10 p-4 last:border-r-0 odd:border-r">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
    </div>
  );
}
