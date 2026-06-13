"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import MapHud from "./MapHud";
import { savePlayer } from "../lib/playerService";
import { supabase } from "../lib/supabase";
import { createTilePolygon, TILE_SIZE } from "../lib/tiles";
import { ActiveTrip, finishActiveTrip, getActiveTrip } from "../lib/trips";
import { useMotoQuestTracking } from "../lib/useMotoQuestTracking";

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

type FogRevealPoint = {
  r: number;
  x: number;
  y: number;
};

export default function MapView({
  hasUnreadNotifications,
  onOpenNotifications,
}: {
  hasUnreadNotifications: boolean;
  onOpenNotifications: () => void;
}) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const discoveredTileIdsRef = useRef(new Set<string>());
  const suppressMapInteractionRef = useRef(false);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [fogRevealPoints, setFogRevealPoints] = useState<FogRevealPoint[]>([]);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  const addTileLayer = useCallback((map: maplibregl.Map, tileId: string) => {
    const sourceId = `tile-${tileId}`;
    discoveredTileIdsRef.current.add(tileId);
    updateFogRevealPoints(map, discoveredTileIdsRef.current, setFogRevealPoints);

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
        "fill-color": "#ffffff",
        "fill-opacity": 0,
      },
    });
  }, []);

  const {
    currentTown,
    currentVoivodeship,
    currentPosition,
    distanceKm,
    newVoivodeshipPopup,
    tilesCount,
  } = useMotoQuestTracking({
    addTileLayer,
    map,
    shouldFollowUser: isFollowingUser,
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
      updateFogRevealPoints(nextMap, discoveredTileIdsRef.current, setFogRevealPoints);
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

  useEffect(() => {
    if (!map) {
      return;
    }

    const disableFollowMode = (event: maplibregl.MapLibreEvent) => {
      if (suppressMapInteractionRef.current) {
        return;
      }

      if (!event.originalEvent) {
        return;
      }

      setIsFollowingUser(false);
    };
    const syncFog = () => {
      updateFogRevealPoints(map, discoveredTileIdsRef.current, setFogRevealPoints);
    };

    map.on("dragstart", disableFollowMode);
    map.on("moveend", syncFog);
    map.on("zoomstart", disableFollowMode);
    map.on("zoomend", syncFog);
    map.on("rotatestart", disableFollowMode);
    map.on("pitchstart", disableFollowMode);

    return () => {
      map.off("dragstart", disableFollowMode);
      map.off("moveend", syncFog);
      map.off("zoomstart", disableFollowMode);
      map.off("zoomend", syncFog);
      map.off("rotatestart", disableFollowMode);
      map.off("pitchstart", disableFollowMode);
    };
  }, [map]);

  const centerOnUser = () => {
    if (!map || !currentPosition) {
      return;
    }

    suppressMapInteractionRef.current = true;
    setIsFollowingUser(true);
    map.flyTo({
      center: [currentPosition.lon, currentPosition.lat],
      duration: 500,
      zoom: Math.max(map.getZoom(), 15),
    });

    window.setTimeout(() => {
      suppressMapInteractionRef.current = false;
    }, 700);
  };

  const zoomIn = () => {
    setIsFollowingUser(false);
    map?.zoomIn();
  };

  const zoomOut = () => {
    setIsFollowingUser(false);
    map?.zoomOut();
  };

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

      <MapFogOverlay revealPoints={fogRevealPoints} />

      <MapHud
        activeTrip={activeTrip}
        currentTown={currentTown}
        currentVoivodeship={currentVoivodeship}
        distanceKm={distanceKm}
        hasUnreadNotifications={hasUnreadNotifications}
        isFollowingUser={isFollowingUser}
        onCenterUser={centerOnUser}
        onOpenNotifications={onOpenNotifications}
        onStopRecording={stopActiveTrip}
        tilesCount={tilesCount}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
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

function updateFogRevealPoints(
  map: maplibregl.Map,
  discoveredTileIds: Set<string>,
  setFogRevealPoints: (points: FogRevealPoint[]) => void
) {
  const bounds = map.getBounds();
  const width = map.getContainer().clientWidth;
  const height = map.getContainer().clientHeight;
  const revealPoints = [...discoveredTileIds]
    .map((tileId) => tileId.split("_").map(Number))
    .filter(([tileX, tileY]) => {
      const tileWest = tileX * TILE_SIZE;
      const tileEast = tileWest + TILE_SIZE;
      const tileSouth = tileY * TILE_SIZE;
      const tileNorth = tileSouth + TILE_SIZE;

      return (
        tileEast >= bounds.getWest() - TILE_SIZE * 8 &&
        tileWest <= bounds.getEast() + TILE_SIZE * 8 &&
        tileNorth >= bounds.getSouth() - TILE_SIZE * 8 &&
        tileSouth <= bounds.getNorth() + TILE_SIZE * 8
      );
    })
    .slice(-450)
    .map(([tileX, tileY]) => {
      const centerLon = (tileX + 0.5) * TILE_SIZE;
      const centerLat = (tileY + 0.5) * TILE_SIZE;
      const center = map.project([centerLon, centerLat]);
      const left = map.project([tileX * TILE_SIZE, centerLat]);
      const right = map.project([(tileX + 1) * TILE_SIZE, centerLat]);
      const top = map.project([centerLon, (tileY + 1) * TILE_SIZE]);
      const bottom = map.project([centerLon, tileY * TILE_SIZE]);
      const tilePixelSize = Math.max(
        Math.abs(right.x - left.x),
        Math.abs(bottom.y - top.y)
      );

      return {
        r: clamp(tilePixelSize * 1.75, 42, 190),
        x: center.x,
        y: center.y,
      };
    })
    .filter((point) => {
      return (
        point.x >= -point.r &&
        point.x <= width + point.r &&
        point.y >= -point.r &&
        point.y <= height + point.r
      );
    });

  setFogRevealPoints(revealPoints);
}

function MapFogOverlay({ revealPoints }: { revealPoints: FogRevealPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(3, 4, 5, 0.96)";
    context.fillRect(0, 0, width, height);

    drawCloudTexture(context, width, height);

    context.globalCompositeOperation = "destination-out";

    revealPoints.forEach((point) => {
      const radius = point.r * 1.45;
      const gradient = context.createRadialGradient(
        point.x,
        point.y,
        radius * 0.2,
        point.x,
        point.y,
        radius
      );

      gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
      gradient.addColorStop(0.48, "rgba(0, 0, 0, 0.96)");
      gradient.addColorStop(0.72, "rgba(0, 0, 0, 0.42)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      context.fillStyle = gradient;
      context.beginPath();
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.fill();
    });

    context.globalCompositeOperation = "source-over";
    context.fillStyle = "rgba(255, 255, 255, 0.035)";
    context.fillRect(0, 0, width, height);
  }, [revealPoints]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[12] h-full w-full"
    />
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function drawCloudTexture(
  context: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  context.save();
  context.filter = "blur(26px)";

  for (let index = 0; index < 42; index += 1) {
    const x = seededNoise(index, 13.17) * width;
    const y = seededNoise(index, 91.73) * height;
    const radius = 58 + seededNoise(index, 41.29) * 130;
    const opacity = 0.08 + seededNoise(index, 7.61) * 0.14;
    const gradient = context.createRadialGradient(x, y, radius * 0.12, x, y, radius);

    gradient.addColorStop(0, `rgba(215, 220, 218, ${opacity})`);
    gradient.addColorStop(0.45, `rgba(170, 176, 174, ${opacity * 0.72})`);
    gradient.addColorStop(1, "rgba(80, 88, 88, 0)");

    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(
      x,
      y,
      radius * (1.1 + seededNoise(index, 5.33) * 0.9),
      radius * (0.42 + seededNoise(index, 2.77) * 0.5),
      seededNoise(index, 19.91) * Math.PI,
      0,
      Math.PI * 2
    );
    context.fill();
  }

  context.restore();
}

function seededNoise(index: number, seed: number) {
  const value = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453123;

  return value - Math.floor(value);
}
