"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import MapHud from "./MapHud";
import { savePlayer } from "../lib/playerService";
import { supabase } from "../lib/supabase";
import { createTilePolygon } from "../lib/tiles";
import { ActiveTrip, finishActiveTrip, getActiveTrip } from "../lib/trips";
import { useMotoQuestTracking } from "../lib/useMotoQuestTracking";

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function MapView({
  hasUnreadNotifications,
  onOpenNotifications,
}: {
  hasUnreadNotifications: boolean;
  onOpenNotifications: () => void;
}) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  const addTileLayer = useCallback((map: maplibregl.Map, tileId: string) => {
    const sourceId = `tile-${tileId}`;
    const lineId = `tile-line-${tileId}`;

    if (map.getSource(sourceId)) {
      return;
    }

    const [tileX, tileY] = tileId.split("_").map(Number);

    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [createTilePolygon(tileX, tileY)],
        },
        properties: {},
      },
    });

    map.addLayer({
      id: sourceId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": "#ff6b00",
        "fill-opacity": 0.28,
      },
    });

    map.addLayer({
      id: lineId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#ff8a1f",
        "line-opacity": 0.8,
        "line-width": 1.5,
      },
    });
  }, []);

  const {
    currentTown,
    currentVoivodeship,
    distanceKm,
    newVoivodeshipPopup,
    tilesCount,
  } = useMotoQuestTracking({
    addTileLayer,
    map,
  });

  useEffect(() => {
    if (!mapContainer.current) {
      return;
    }

    const nextMap = new maplibregl.Map({
      center: [21.0122, 52.2297],
      container: mapContainer.current,
      style: MAP_STYLE,
      zoom: 13,
    });

    nextMap.on("load", () => {
      setMap(nextMap);
    });

    return () => {
      setMap(null);
      nextMap.remove();
    };
  }, []);

  useEffect(() => {
    const syncActiveTrip = () => {
      setActiveTrip(getActiveTrip());
    };

    syncActiveTrip();

    const interval = window.setInterval(syncActiveTrip, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const stopActiveTrip = async () => {
    const result = finishActiveTrip();

    if (!result) {
      return;
    }

    setActiveTrip(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await savePlayer(user.id);
    }
  };

  return (
    <div className="relative min-h-[calc(100dvh-6rem)] overflow-hidden rounded-[2.15rem] border border-white/10 bg-zinc-950 shadow-2xl shadow-black/80 ring-1 ring-orange-500/10">
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.12),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.12),transparent_35%,rgba(0,0,0,0.34))]" />

      <div
        ref={mapContainer}
        className="h-[calc(100dvh-6rem)] min-h-[690px] w-full"
      />

      <MapHud
        activeTrip={activeTrip}
        currentTown={currentTown}
        currentVoivodeship={currentVoivodeship}
        distanceKm={distanceKm}
        hasUnreadNotifications={hasUnreadNotifications}
        onOpenNotifications={onOpenNotifications}
        onStopRecording={stopActiveTrip}
        tilesCount={tilesCount}
        onZoomIn={() => map?.zoomIn()}
        onZoomOut={() => map?.zoomOut()}
      />

      {newVoivodeshipPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-6 backdrop-blur">
          <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-orange-500/40 bg-zinc-950 p-8 text-center shadow-2xl shadow-orange-500/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.24),transparent_44%)]" />
            <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-500 text-2xl font-black text-black shadow-lg shadow-orange-500/25">
              OK
            </div>
            <div className="relative mt-4 text-sm font-black uppercase tracking-[0.18em] text-zinc-500">
              Odkryto region
            </div>
            <div className="relative mt-2 text-3xl font-black text-white">
              {newVoivodeshipPopup}
            </div>
            <div className="relative mt-4 inline-flex rounded-full border border-green-500/30 bg-green-500/10 px-5 py-2 text-xl font-black text-green-300">
              +500 XP
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
