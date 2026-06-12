"use client";

import { useEffect, useState } from "react";

import { getActiveBike } from "../lib/garage";
import { getProfile, PlayerProfile, saveProfile } from "../lib/profile";
import { savePlayer } from "../lib/playerService";
import { getNumber, STORAGE_KEYS } from "../lib/storage";
import { supabase } from "../lib/supabase";
import type { PlayerStats } from "../lib/usePlayerStats";

type PlayerProfilePanelProps = {
  stats: PlayerStats;
};

export default function PlayerProfilePanel({ stats }: PlayerProfilePanelProps) {
  const [profile, setProfile] = useState<PlayerProfile>({
    avatarUrl: "",
    nickname: "MotoManiak",
  });
  const [nickname, setNickname] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const savedProfile = getProfile();

    setProfile(savedProfile);
    setNickname(savedProfile.nickname);
  }, []);

  const activeBike = getActiveBike();
  const distanceKm = getNumber(STORAGE_KEYS.distance);

  const syncPlayer = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await savePlayer(user.id);
    }
  };

  const updateProfile = async (nextProfile: PlayerProfile) => {
    saveProfile(nextProfile);
    setProfile(nextProfile);
    setNickname(nextProfile.nickname);
    await syncPlayer();
  };

  const saveNickname = async () => {
    setStatus("");
    await updateProfile({
      ...profile,
      nickname,
    });
    setStatus("Profil zapisany");
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
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[1.7rem] border border-orange-500/25 bg-zinc-950 shadow-2xl shadow-black/40">
      <div className="border-b border-zinc-800 bg-black/45 px-4 py-4 sm:px-5">
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">
          Gracz
        </div>
        <h2 className="mt-1 text-2xl font-black text-white">Profil kierowcy</h2>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[260px_1fr]">
        <div className="rounded-[1.35rem] border border-zinc-800 bg-black/45 p-5 text-center">
          <div className="mx-auto h-32 w-32 overflow-hidden rounded-full border-4 border-orange-500 bg-zinc-800 shadow-2xl shadow-orange-500/15">
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
          </div>

          <div className="mt-4 text-2xl font-black text-white">
            {profile.nickname}
          </div>
          <div className="mt-1 text-sm font-bold text-zinc-400">
            LVL {stats.level}
          </div>

          <label className="mt-4 block cursor-pointer rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm font-black text-orange-300 transition hover:border-orange-500 hover:bg-orange-500 hover:text-black">
            {uploadingAvatar ? "Wysylanie..." : "Zmien avatar"}
            <input
              type="file"
              accept="image/*"
              disabled={uploadingAvatar}
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  void uploadAvatar(file);
                }
              }}
              className="hidden"
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.35rem] border border-zinc-800 bg-black/45 p-4">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">
              Nick
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="min-w-0 flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-bold outline-none transition focus:border-orange-500"
              />
              <button
                type="button"
                onClick={saveNickname}
                className="rounded-2xl bg-orange-500 px-5 py-3 font-black text-black transition hover:bg-orange-400"
              >
                Zapisz
              </button>
            </div>
            {status && (
              <div className="mt-2 text-sm font-bold text-orange-400">
                {status}
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <ProfileMetric label="XP" value={String(stats.xp)} />
            <ProfileMetric label="Kafelki" value={String(stats.tiles)} />
            <ProfileMetric label="Miasta" value={String(stats.towns)} />
            <ProfileMetric label="Przebieg" value={`${distanceKm.toFixed(1)} km`} />
          </div>

          <div className="rounded-[1.35rem] border border-zinc-800 bg-black/45 p-4">
            <div className="text-xs font-black uppercase tracking-widest text-zinc-500">
              Aktywny motocykl
            </div>
            <div className="mt-2 text-xl font-black text-white">
              {activeBike
                ? `${activeBike.brand} ${activeBike.model}`
                : "Brak aktywnego motocykla"}
            </div>
            {activeBike && (
              <div className="mt-1 text-sm text-zinc-400">
                {activeBike.totalDistanceKm.toFixed(1)} km na tej maszynie
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/45 p-4">
      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black text-orange-500">{value}</div>
    </div>
  );
}
