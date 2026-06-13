"use client";

import { useEffect, useState } from "react";

import { getProfile, type PlayerProfile } from "../lib/profile";
import type { ActiveTrip } from "../lib/trips";

type MapHudProps = {
  activeTrip?: ActiveTrip | null;
  currentTown: string;
  currentVoivodeship: string;
  distanceKm: number;
  hasUnreadNotifications: boolean;
  isFollowingUser: boolean;
  onCenterUser?: () => void;
  onOpenNotifications: () => void;
  onStopRecording?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  tilesCount: number;
};

export default function MapHud({
  activeTrip,
  currentTown,
  currentVoivodeship,
  distanceKm,
  hasUnreadNotifications,
  isFollowingUser,
  onCenterUser,
  onOpenNotifications,
  onStopRecording,
  onZoomIn,
  onZoomOut,
  tilesCount,
}: MapHudProps) {
  const [profile, setProfile] = useState<PlayerProfile>(() => ({
    avatarUrl: "",
    nickname: "MotoManiak",
  }));
  const explorationLevel = Math.min(100, Math.round((tilesCount / 500) * 100));
  const gpsReady = currentTown !== "Ladowanie..." && currentTown !== "Nieznana";
  const recordingTime = activeTrip
    ? formatRecordingTime(Math.max(0, Math.floor((Date.now() - activeTrip.startedAt) / 1000)))
    : "00:00:00";

  useEffect(() => {
    const syncProfile = () => setProfile(getProfile());

    syncProfile();

    const interval = window.setInterval(syncProfile, 2000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <>
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-orange-500/35 bg-black/82 text-sm font-black text-orange-500 shadow-2xl backdrop-blur-xl">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              profile.nickname.slice(0, 1).toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1 text-center">
            <div className="text-xl font-black leading-none text-white">
              Moto<span className="text-orange-500">Quest</span>
            </div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">
              mapa odkrywania
            </div>
          </div>

          <button
            type="button"
            aria-label="Powiadomienia"
            onClick={onOpenNotifications}
            className="pointer-events-auto relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/82 text-zinc-300 shadow-2xl backdrop-blur-xl transition active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
            {hasUnreadNotifications && (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_14px_rgba(249,115,22,0.9)]" />
            )}
          </button>
        </div>

        <section className="mt-4 overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/70 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <VoivodeshipCrest name={currentVoivodeship} />

            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Odkrywasz
              </div>
              <div className="truncate text-sm font-black text-white">
                {currentVoivodeship}
              </div>
            </div>

            <div className="w-20">
              <div className="mb-1 text-right text-[10px] font-black text-lime-400">
                {explorationLevel}%
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-lime-400"
                  style={{ width: `${explorationLevel}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="pointer-events-none absolute right-3 top-[188px] z-20 flex flex-col gap-3">
        <HudRoundButton active={gpsReady} label="GPS" sublabel={gpsReady ? "ON" : "..."} />
        <HudRoundButton label="MAP" sublabel="2D" />
        <HudRoundButton
          active={isFollowingUser}
          label="CEL"
          onClick={onCenterUser}
          sublabel="GPS"
        />
        <div className="pointer-events-auto overflow-hidden rounded-full border border-white/10 bg-black/82 shadow-2xl backdrop-blur-xl">
          <HudZoomButton label="+" onClick={onZoomIn} />
          <div className="h-px bg-white/10" />
          <HudZoomButton label="-" onClick={onZoomOut} />
        </div>
      </div>

      {activeTrip && (
        <div className="pointer-events-none absolute inset-x-5 bottom-3 z-20">
          <section className="overflow-hidden rounded-[1.35rem] border border-orange-500/25 bg-black/82 shadow-2xl shadow-black/80 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div>
                  <div className="max-w-[170px] truncate text-[13px] font-black text-white">
                    {activeTrip.name}
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
                    Nagrywanie - {gpsReady ? currentTown : "Brak GPS"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                aria-label="Zakoncz nagrywanie wyprawy"
                onClick={onStopRecording}
                className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-red-500 bg-red-500/10 text-red-400 transition active:scale-95"
              >
                <span className="h-3.5 w-3.5 rounded-[0.2rem] bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.65)]" />
              </button>
            </div>

            <div className="grid grid-cols-3 divide-x divide-white/10">
              <MapHudStat label="km" value={distanceKm.toFixed(1)} />
              <MapHudStat label="kafelki" value={String(tilesCount)} />
              <MapHudStat label="czas" value={recordingTime} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function HudRoundButton({
  active = false,
  label,
  onClick,
  sublabel,
}: {
  active?: boolean;
  label: string;
  onClick?: () => void;
  sublabel?: string;
}) {
  const content = (
    <>
      <span>{label}</span>
      {sublabel && <span className="text-[8px] text-zinc-500">{sublabel}</span>}
    </>
  );
  const className = [
    "flex h-12 w-12 flex-col items-center justify-center rounded-full border bg-black/82 text-[10px] font-black shadow-2xl backdrop-blur-xl",
    active ? "border-green-500/45 text-green-400" : "border-white/10 text-zinc-300",
    onClick ? "pointer-events-auto transition active:scale-95" : "",
  ].join(" ");

  if (onClick) {
    return (
      <button
        type="button"
        aria-label="Wycentruj mape na aktualnej pozycji"
        onClick={onClick}
        className={className}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}

function HudZoomButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-11 w-12 place-items-center text-xl font-black text-white transition hover:bg-white/10"
    >
      {label}
    </button>
  );
}

function MapHudStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-2 py-2 text-center">
      <div className="truncate text-base font-black text-white">{value}</div>
      <div className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-zinc-500">
        {label}
      </div>
    </div>
  );
}

function VoivodeshipCrest({ name }: { name: string }) {
  const slug = normalizeVoivodeshipName(name);
  const src = VOIVODESHIP_CREST_FILES[slug];

  return (
    <div
      className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/55 p-1 shadow-[0_0_18px_rgba(0,0,0,0.35)]"
      title={`Herb: ${name}`}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="max-h-full max-w-full object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.12)]"
        />
      ) : (
        <span className="text-sm font-black text-orange-500">?</span>
      )}
    </div>
  );
}

function normalizeVoivodeshipName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const VOIVODESHIP_CREST_FILES: Record<string, string> = {
  dolnoslaskie: "/voivodeships/dolnoslaskie.svg",
  "kujawsko-pomorskie": "/voivodeships/kujawsko-pomorskie.svg",
  lubelskie: "/voivodeships/lubelskie.svg",
  lubuskie: "/voivodeships/lubuskie.svg",
  lodzkie: "/voivodeships/lodzkie.svg",
  malopolskie: "/voivodeships/malopolskie.svg",
  mazowieckie: "/voivodeships/mazowieckie.svg",
  opolskie: "/voivodeships/opolskie.svg",
  podkarpackie: "/voivodeships/podkarpackie.svg",
  podlaskie: "/voivodeships/podlaskie.svg",
  pomorskie: "/voivodeships/pomorskie.svg",
  slaskie: "/voivodeships/slaskie.svg",
  swietokrzyskie: "/voivodeships/swietokrzyskie.svg",
  "warminsko-mazurskie": "/voivodeships/warminsko-mazurskie.svg",
  wielkopolskie: "/voivodeships/wielkopolskie.svg",
  zachodniopomorskie: "/voivodeships/zachodniopomorskie.svg",
};

function formatRecordingTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}
