"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import MapHud from "./MapHud";
import { createTilePolygon, getTileAreaKm2 } from "../lib/tiles";
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
      center: [21.0122, 52.2297],
      container: mapContainer.current,
      style: MAP_STYLE,
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
    <div className="relative min-h-[calc(100dvh-7rem)] overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/80 lg:min-h-[760px] lg:rounded-[2.4rem]">
      <div
        ref={mapContainer}
        className="h-[calc(100dvh-7rem)] min-h-[650px] w-full lg:h-[760px]"
      />

      <MapHud
        currentTown={currentTown}
        currentVoivodeship={currentVoivodeship}
        distanceKm={distanceKm}
        discoveredAreaKm2={tilesCount * getTileAreaKm2()}
        tilesCount={tilesCount}
      />

      {newVoivodeshipPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-sm rounded-3xl border border-orange-500 bg-zinc-950 p-8 text-center shadow-2xl shadow-orange-500/20">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-orange-500 text-2xl font-black text-black">
              OK
            </div>
            <div className="mt-4 text-zinc-400">Odkryto nowe wojewodztwo</div>
            <div className="mt-2 text-3xl font-black text-orange-500">
              {newVoivodeshipPopup}
            </div>
            <div className="mt-4 text-xl font-black text-green-400">+500 XP</div>
          </div>
        </div>
      )}
    </div>
  );
}
