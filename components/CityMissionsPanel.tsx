"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { unlockAchievement } from "../lib/achievements";
import {
  type CityMission,
  getAccuratePosition,
  type MissionCity,
  prepareMissionPhoto,
  type VerificationResult,
} from "../lib/cityMissions";
import { savePlayer } from "../lib/playerService";
import { supabase } from "../lib/supabase";

export default function CityMissionsPanel() {
  const [cities, setCities] = useState<MissionCity[]>([]);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [missions, setMissions] = useState<CityMission[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [busyMissionId, setBusyMissionId] = useState("");
  const [status, setStatus] = useState("");

  const selectedCity = useMemo(
    () => cities.find((city) => city.id === selectedCityId) ?? null,
    [cities, selectedCityId]
  );
  const regularMissions = missions.filter((mission) => !mission.is_special);
  const specialMissions = missions.filter((mission) => mission.is_special);
  const completedRegular = regularMissions.filter((mission) =>
    completedIds.has(mission.id)
  ).length;

  const loadMissions = useCallback(async (cityId: string) => {
    if (!cityId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("Zaloguj sie, aby korzystac z misji miejskich.");
      return;
    }

    const { error: assignmentError } = await supabase.rpc(
      "mq_assign_city_missions",
      { p_city_id: cityId }
    );

    if (assignmentError) {
      console.error("Mission assignment error:", assignmentError);
      setStatus("Uruchom migracje V5 w Supabase SQL Editor.");
      return;
    }

    const { data: assignments } = await supabase
      .from("mq_mission_assignments")
      .select("mission_id")
      .eq("user_id", user.id);
    const assignedIds = (assignments ?? []).map((row) => row.mission_id);
    const assignedQuery = assignedIds.length
      ? supabase.from("mq_city_missions").select("*").in("id", assignedIds)
      : Promise.resolve({ data: [] as CityMission[], error: null });
    const [assignedResult, specialResult, completionResult] = await Promise.all([
      assignedQuery,
      supabase
        .from("mq_city_missions")
        .select("*")
        .eq("city_id", cityId)
        .eq("is_special", true),
      supabase
        .from("mq_mission_completions")
        .select("mission_id")
        .eq("user_id", user.id),
    ]);

    if (assignedResult.error || specialResult.error || completionResult.error) {
      console.error(
        "Mission load error:",
        assignedResult.error || specialResult.error || completionResult.error
      );
      setStatus("Nie udalo sie pobrac misji.");
      return;
    }

    const all = [
      ...((assignedResult.data ?? []) as CityMission[]),
      ...((specialResult.data ?? []) as CityMission[]),
    ].filter((mission) => mission.city_id === cityId);
    setMissions(all);
    setCompletedIds(
      new Set((completionResult.data ?? []).map((row) => row.mission_id))
    );
    setStatus("");
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      const { data, error } = await supabase
        .from("mq_cities")
        .select("*")
        .order("required_missions");

      if (error) {
        setStatus("Uruchom migracje V5 w Supabase SQL Editor.");
        return;
      }

      const loaded = (data ?? []) as MissionCity[];
      setCities(loaded);
      setSelectedCityId((current) => current || loaded[0]?.id || "");
    };

    void loadCities();
  }, []);

  useEffect(() => {
    void loadMissions(selectedCityId);
  }, [loadMissions, selectedCityId]);

  const verifyMission = async (mission: CityMission, file?: File) => {
    setBusyMissionId(mission.id);
    setStatus("Sprawdzanie GPS...");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Zaloguj sie ponownie.");

      const position = await getAccuratePosition();
      let storagePath: string | undefined;

      if (mission.photo_required) {
        if (!file) throw new Error("Dodaj zdjecie do tej misji.");
        setStatus("Przygotowanie zdjecia...");
        const photo = await prepareMissionPhoto(file);
        storagePath = `${user.id}/${mission.id}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("mission-photos")
          .upload(storagePath, photo, {
            cacheControl: "3600",
            contentType: "image/jpeg",
            upsert: false,
          });

        if (uploadError) throw uploadError;
        setStatus("Weryfikacja zdjecia i GPS...");
      } else {
        setStatus("Potwierdzanie miejsca...");
      }

      const { data, error } = await supabase.functions.invoke<VerificationResult>(
        "verify-mission-photo",
        {
          body: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            missionId: mission.id,
            storagePath,
          },
        }
      );

      if (error) throw error;
      if (!data?.approved) {
        throw new Error(data?.reason || data?.error || "Misja nie zostala zaliczona.");
      }

      unlockAchievement(`mission-${mission.id}`, mission.title, mission.xp);

      if (data.cityCompleted && selectedCity) {
        unlockAchievement(
          `city-${selectedCity.slug}`,
          `${selectedCity.name} ukonczone`,
          selectedCity.completion_xp
        );
      }

      if (data.specialBadgeUnlocked) {
        unlockAchievement(`special-${mission.slug}`, mission.title, mission.xp);
      }

      await savePlayer(user.id);
      setStatus("Misja zaliczona przez GPS.");
      await loadMissions(selectedCityId);
    } catch (error) {
      console.error("Mission verification error:", error);
      setStatus(error instanceof Error ? error.message : "Weryfikacja nie powiodla sie.");
    } finally {
      setBusyMissionId("");
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
            City Quest
          </div>
          <h2 className="text-xl font-black text-white">Misje miejskie</h2>
        </div>
        <select
          value={selectedCityId}
          onChange={(event) => setSelectedCityId(event.target.value)}
          className="min-h-10 max-w-[160px] rounded-lg border border-white/10 bg-zinc-950 px-3 text-sm font-bold text-white"
        >
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCity && (
        <div className="border-y border-white/10 bg-black/35 px-1 py-3">
          <div className="flex items-center justify-between text-sm font-black">
            <span>{selectedCity.name}</span>
            <span className="text-orange-400">
              {Math.min(completedRegular, selectedCity.required_missions)} / {selectedCity.required_missions}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-orange-500 transition-all"
              style={{
                width: `${Math.min(100, (completedRegular / selectedCity.required_missions) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-2">
        {regularMissions.map((mission) => (
          <MissionRow
            key={mission.id}
            busy={busyMissionId === mission.id}
            completed={completedIds.has(mission.id)}
            mission={mission}
            onVerify={verifyMission}
          />
        ))}
      </div>

      {specialMissions.length > 0 && (
        <div className="space-y-2 border-t border-orange-500/25 pt-3">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">
            Misje specjalne
          </div>
          {specialMissions.map((mission) => (
            <MissionRow
              key={mission.id}
              busy={busyMissionId === mission.id}
              completed={completedIds.has(mission.id)}
              mission={mission}
              onVerify={verifyMission}
            />
          ))}
        </div>
      )}

      {status && <div className="text-sm font-bold text-orange-300">{status}</div>}
    </section>
  );
}

function MissionRow({
  busy,
  completed,
  mission,
  onVerify,
}: {
  busy: boolean;
  completed: boolean;
  mission: CityMission;
  onVerify: (mission: CityMission, file?: File) => Promise<void>;
}) {
  return (
    <article className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-zinc-950/80 p-3">
      <div className="grid h-11 w-11 place-items-center rounded-lg border border-orange-500/25 bg-orange-500/10 text-xs font-black text-orange-400">
        {mission.mission_type === "motoshot" ? "MOTO" : mission.photo_required ? "FOTO" : "GPS"}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-black text-white">{mission.title}</div>
        <div className="mt-1 line-clamp-2 text-[11px] text-zinc-400">{mission.description}</div>
        <div className="mt-1 text-[10px] font-black text-orange-400">+{mission.xp} XP</div>
      </div>
      {completed ? (
        <span className="text-sm font-black text-green-400">OK</span>
      ) : mission.photo_required ? (
        <label className="cursor-pointer rounded-lg bg-orange-500 px-3 py-2 text-xs font-black text-black active:scale-95">
          {busy ? "..." : "Zdjecie"}
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onVerify(mission, file);
              event.target.value = "";
            }}
          />
        </label>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void onVerify(mission)}
          className="rounded-lg border border-orange-500/40 px-3 py-2 text-xs font-black text-orange-400 active:scale-95 disabled:opacity-50"
        >
          {busy ? "..." : "Sprawdz"}
        </button>
      )}
    </article>
  );
}
