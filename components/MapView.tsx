"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import MapHud from "./MapHud";
import {
  createTilePolygon,
  getTileAreaKm2,
} from "../lib/tiles";
import { useMotoQuestTracking } from "../lib/useMotoQuestTracking";

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  const addTileLayer = useCallback((map: maplibregl.Map, tileId: string) => {
    const sourceId = `tile-${tileId}`;

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
        "fill-opacity": 0.35,
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
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [21.0122, 52.2297],
      zoom: 13,
    });

    nextMap.on("load", () => {
      nextMap.addControl(new maplibregl.NavigationControl(), "bottom-right");
      setMap(nextMap);
    });

    return () => {
      setMap(null);
      nextMap.remove();
    };
  }, []);

  return (
    <div className="relative min-h-[640px] overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-2xl">
      <div ref={mapContainer} className="h-[calc(100vh-8rem)] min-h-[640px] w-full" />

      <MapHud
        currentTown={currentTown}
        currentVoivodeship={currentVoivodeship}
        distanceKm={distanceKm}
        discoveredAreaKm2={tilesCount * getTileAreaKm2()}
        tilesCount={tilesCount}
      />

      {newVoivodeshipPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div className="rounded-3xl border border-orange-500 bg-zinc-900 p-8 text-center">
            <div className="text-6xl">✓</div>
            <div className="mt-3 text-zinc-400">
              Odkryto nowe województwo
            </div>
            <div className="mt-2 text-3xl font-bold text-orange-500">
              {newVoivodeshipPopup}
            </div>
            <div className="mt-4 text-xl font-bold text-green-400">+500 XP</div>
          </div>
        </div>
      )}
    </div>
  );
}
