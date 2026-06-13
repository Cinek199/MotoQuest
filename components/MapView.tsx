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
const FOG_SOURCE_ID = "mq-map-fog";
const FOG_LAYER_ID = "mq-map-fog-fill";
const FOG_LINE_LAYER_ID = "mq-map-fog-line";
const MAX_VISIBLE_FOG_TILES = 2200;

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
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  const addTileLayer = useCallback((map: maplibregl.Map, tileId: string) => {
    const sourceId = `tile-${tileId}`;
    discoveredTileIdsRef.current.add(tileId);
    updateVisibleFog(map, discoveredTileIdsRef.current);

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
      ensureFogLayer(nextMap);
      updateVisibleFog(nextMap, discoveredTileIdsRef.current);
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
      updateVisibleFog(map, discoveredTileIdsRef.current);
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

function ensureFogLayer(map: maplibregl.Map) {
  if (map.getSource(FOG_SOURCE_ID)) {
    return;
  }

  map.addSource(FOG_SOURCE_ID, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  });

  map.addLayer({
    id: FOG_LAYER_ID,
    type: "fill",
    source: FOG_SOURCE_ID,
    paint: {
      "fill-color": "#050506",
      "fill-opacity": ["get", "opacity"],
    },
  });

  map.addLayer({
    id: FOG_LINE_LAYER_ID,
    type: "line",
    source: FOG_SOURCE_ID,
    paint: {
      "line-color": "#f97316",
      "line-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        9,
        0.04,
        13,
        0.06,
        16,
        0.08,
      ],
      "line-width": 0.5,
    },
  });
}

function updateVisibleFog(map: maplibregl.Map, discoveredTileIds: Set<string>) {
  ensureFogLayer(map);

  const source = map.getSource(FOG_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;

  if (!source) {
    return;
  }

  const bounds = map.getBounds();
  const minTileX = Math.floor(bounds.getWest() / TILE_SIZE) - 2;
  const maxTileX = Math.floor(bounds.getEast() / TILE_SIZE) + 2;
  const minTileY = Math.floor(bounds.getSouth() / TILE_SIZE) - 2;
  const maxTileY = Math.floor(bounds.getNorth() / TILE_SIZE) + 2;
  const tileCount = (maxTileX - minTileX + 1) * (maxTileY - minTileY + 1);

  if (tileCount > MAX_VISIBLE_FOG_TILES) {
    source.setData({
      type: "FeatureCollection",
      features: [
        createFogFeature(
          [
            [bounds.getWest() - TILE_SIZE * 4, bounds.getSouth() - TILE_SIZE * 4],
            [bounds.getEast() + TILE_SIZE * 4, bounds.getSouth() - TILE_SIZE * 4],
            [bounds.getEast() + TILE_SIZE * 4, bounds.getNorth() + TILE_SIZE * 4],
            [bounds.getWest() - TILE_SIZE * 4, bounds.getNorth() + TILE_SIZE * 4],
            [bounds.getWest() - TILE_SIZE * 4, bounds.getSouth() - TILE_SIZE * 4],
          ],
          0.99
        ),
      ],
    });
    return;
  }

  const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];

  for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      features.push(
        createFogFeature(
          createTilePolygon(tileX, tileY),
          getFogOpacity(tileX, tileY, discoveredTileIds)
        )
      );
    }
  }

  source.setData({
    type: "FeatureCollection",
    features,
  });
}

function createFogFeature(
  coordinates: number[][],
  opacity: number
): GeoJSON.Feature<GeoJSON.Polygon> {
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coordinates],
    },
    properties: {
      opacity,
      status: opacity === 0 ? "discovered" : "fog",
    },
  };
}

function getFogOpacity(
  tileX: number,
  tileY: number,
  discoveredTileIds: Set<string>
) {
  const opacityByDistance = [0, 0.34, 0.58, 0.78, 0.92, 0.99];

  for (let distance = 0; distance < opacityByDistance.length; distance += 1) {
    for (let xOffset = -distance; xOffset <= distance; xOffset += 1) {
      for (let yOffset = -distance; yOffset <= distance; yOffset += 1) {
        if (Math.max(Math.abs(xOffset), Math.abs(yOffset)) !== distance) {
          continue;
        }

        if (discoveredTileIds.has(`${tileX + xOffset}_${tileY + yOffset}`)) {
          return opacityByDistance[distance];
        }
      }
    }
  }

  return 1;
}
