"use client";
import { getTownName } from "../lib/reverseGeocode";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getVoivodeship } from "../lib/getVoivodeship";

import { supabase } from "../lib/supabase";
import {  savePlayer
} from "../lib/playerService";
const TILE_SIZE = 0.005;

function createTilePolygon(
  tileX: number,
  tileY: number
) {
  const minLon = tileX * TILE_SIZE;
  const minLat = tileY * TILE_SIZE;

  return [
    [minLon, minLat],
    [minLon + TILE_SIZE, minLat],
    [minLon + TILE_SIZE, minLat + TILE_SIZE],
    [minLon, minLat + TILE_SIZE],
    [minLon, minLat],
  ];
}
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) /
    180;

  const dLon =
    ((lon2 - lon1) * Math.PI) /
    180;

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(
      (lat1 * Math.PI) / 180
    ) *
      Math.cos(
        (lat2 * Math.PI) / 180
      ) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}
export default function MapView() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [tilesCount, setTilesCount] = useState(0);
  const [currentTown, setCurrentTown] =
    useState("Ładowanie...");
    const [currentVoivodeship, setCurrentVoivodeship] =
  useState("Nieznane");
const [newVoivodeshipPopup,
  setNewVoivodeshipPopup] =
  useState<string | null>(null);
  const userIdRef = useRef("");
  const lastPositionRef = useRef<{
  lat: number;
  lon: number;
} | null>(null);

const [distanceKm, setDistanceKm] =
  useState(0);

  const discoverTile = async (
    lat: number,
    lon: number,
    map: maplibregl.Map,
    discoveredTiles: Set<string>
  ) => {
    const tileX = Math.floor(lon / TILE_SIZE);
    const tileY = Math.floor(lat / TILE_SIZE);

    const tileId = `${tileX}_${tileY}`;

    if (discoveredTiles.has(tileId)) return;

    discoveredTiles.add(tileId);

    const tilesArray = [...discoveredTiles];

    localStorage.setItem(
      "mq_tiles",
      JSON.stringify(tilesArray)
    );

    setTilesCount(discoveredTiles.size);

    if (userIdRef.current) {
      await savePlayer(
    userIdRef.current
      );
    }

    const sourceId = `tile-${tileId}`;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              createTilePolygon(
                tileX,
                tileY
              ),
            ],
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
    }

    console.log(
      "☁️ zapisano kafelki do Supabase"
    );
  };

  useEffect(() => {
    async function initUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        userIdRef.current = user.id;
      }
    }

    initUser();

    if (!mapContainer.current) return;

    const discoveredTiles = new Set<string>(
      JSON.parse(
        localStorage.getItem("mq_tiles") ||
          "[]"
      )
    );

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style:
        "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [21.0122, 52.2297],
      zoom: 13,
    });

    mapRef.current = map;

    map.on("load", () => {
      discoveredTiles.forEach(
        (tileId) => {
          const [tileX, tileY] =
            tileId
              .split("_")
              .map(Number);

          const sourceId =
            `tile-${tileId}`;

          map.addSource(sourceId, {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [
                  createTilePolygon(
                    tileX,
                    tileY
                  ),
                ],
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
        }
      );
    });

    setTilesCount(
      discoveredTiles.size
    );
    setDistanceKm(
  Number(
    localStorage.getItem(
      "mq_distance"
    ) || "0"
  )
);

    const watchId =
      navigator.geolocation.watchPosition(
        (position) => {
          const lat =
            position.coords.latitude;
          const lon =
            position.coords.longitude;
            if (
  lastPositionRef.current
) {
  const km =
    calculateDistance(
      lastPositionRef.current.lat,
      lastPositionRef.current.lon,
      lat,
      lon
    );

  if (km < 2) {
    const currentDistance =
      Number(
        localStorage.getItem(
          "mq_distance"
        ) || "0"
      );

    const newDistance =
      currentDistance + km;

    localStorage.setItem(
      "mq_distance",
      newDistance.toString()
    );

    const achievements = JSON.parse(
  localStorage.getItem(
    "mq_achievements"
  ) || "[]"
);

const addAchievement = (
  id: string,
  title: string,
  xp: number
) => {
  if (
    achievements.some(
      (a:any) => a.id === id
    )
  ) {
    return;
  }

  achievements.push({
    id,
    title,
    xp,
  });

  localStorage.setItem(
    "mq_achievements",
    JSON.stringify(
      achievements
    )
  );
};

if (newDistance >= 1) {
  addAchievement(
    "distance-1",
    "Pierwszy kilometr",
    100
  );
}

if (newDistance >= 100) {
  addAchievement(
    "distance-100",
    "100 km",
    500
  );
}

if (newDistance >= 1000) {
  addAchievement(
    "distance-1000",
    "1000 km",
    2500
  );
}

if (newDistance >= 10000) {
  addAchievement(
    "distance-10000",
    "10000 km",
    10000
  );
}

    setDistanceKm(
      Number(
        newDistance.toFixed(2)
      )
    );
  }
}

lastPositionRef.current = {
  lat,
  lon,
};

          map.flyTo({
            center: [lon, lat],
            zoom: 15,
            duration: 500,
          });

          if (!markerRef.current) {
            markerRef.current =
              new maplibregl.Marker({
                color: "#ff6b00",
              })
                .setLngLat([
                  lon,
                  lat,
                ])
                .addTo(map);
          } else {
            markerRef.current.setLngLat([
              lon,
              lat,
            ]);
          }

          (async () => {
            const town = await getTownName(
              lat,
              lon
            );

            setCurrentTown(town);
            const voivodeship =
  await getVoivodeship(
    lat,
    lon
  );

setCurrentVoivodeship(
  voivodeship
);

const discoveredVoivodeships =
  JSON.parse(
    localStorage.getItem(
      "mq_voivodeships"
    ) || "[]"
  );

if (
  !discoveredVoivodeships.includes(
    voivodeship
  )
) {
  discoveredVoivodeships.push(
    voivodeship
  );
setNewVoivodeshipPopup(
  voivodeship
);

setTimeout(() => {
  setNewVoivodeshipPopup(
    null
  );
}, 4000);

  localStorage.setItem(
    "mq_voivodeships",
    JSON.stringify(
      discoveredVoivodeships
    )
  );
window.dispatchEvent(
  new Event(
    "mq-voivodeships-updated"
  )
);
  const achievements =
    JSON.parse(
      localStorage.getItem(
        "mq_achievements"
      ) || "[]"
    );

  if (
    discoveredVoivodeships.length === 1 &&
    !achievements.some(
      (a:any) =>
        a.id === "first-voivodeship"
    )
  ) {
    achievements.push({
      id: "first-voivodeship",
      title:
        "Pierwsze województwo",
      xp: 500,
    });

    localStorage.setItem(
      "mq_achievements",
      JSON.stringify(
        achievements
      )
    );
  }
}

            const towns = JSON.parse(
              localStorage.getItem("mq_towns") || "[]"
            );

            if (!towns.includes(town)) {
              towns.push(town);

              localStorage.setItem(
                "mq_towns",
                JSON.stringify(towns)
              );

              const achievements = JSON.parse(
                localStorage.getItem("mq_achievements") || "[]"
              );

              if (
                towns.length === 1 &&
                !achievements.some((a:any)=>a.id==="first-town")
              ) {
                achievements.push({
                  id:"first-town",
                  title:"Pierwsza miejscowość",
                  xp:100
                });

                localStorage.setItem(
                  "mq_achievements",
                  JSON.stringify(achievements)
                );
              }
            }

            discoverTile(
              lat,
              lon,
              map,
              discoveredTiles
            );
          })();
        },
        console.error,
        {
          enableHighAccuracy: true,
          maximumAge: 0,
        }
      );

    
return (
<div className="space-y-5">

  <div className="bg-gradient-to-r from-zinc-900 to-black border border-orange-500/30 rounded-3xl p-6">
    <div className="text-zinc-500 text-sm uppercase tracking-widest">
      MotoQuest
    </div>

    <div className="flex items-center justify-between mt-2">
      <div>
        <div className="text-3xl font-bold text-white">
          Odkrywaj Polskę
        </div>
        <div className="text-zinc-400 mt-1">
          {currentTown} • {currentVoivodeship}
        </div>
      </div>

      <div className="text-right">
        <div className="text-zinc-500 text-xs">
          PRZEBIEG
        </div>
        <div className="text-2xl font-bold text-orange-500">
          {distanceKm.toFixed(1)} km
        </div>
      </div>
    </div>
  </div>

  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
      <div className="text-zinc-500 text-xs">KAFELKI</div>
      <div className="text-2xl font-bold text-orange-500">{tilesCount}</div>
    </div>

    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
      <div className="text-zinc-500 text-xs">POWIERZCHNIA</div>
      <div className="text-2xl font-bold text-orange-500">
        {(tilesCount * 0.25).toFixed(1)} km²
      </div>
    </div>

    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
      <div className="text-zinc-500 text-xs">MIASTO</div>
      <div className="font-bold text-white">{currentTown}</div>
    </div>

    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
      <div className="text-zinc-500 text-xs">WOJEWÓDZTWO</div>
      <div className="font-bold text-white">{currentVoivodeship}</div>
    </div>
  </div>

  <div className="relative">
    <div
      ref={mapContainer}
      className="w-full h-[75vh] rounded-3xl overflow-hidden border border-zinc-800"
    />
  </div>

  {newVoivodeshipPopup && (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
      <div className="bg-zinc-900 border border-orange-500 rounded-3xl p-8 text-center">
        <div className="text-6xl">🎉</div>
        <div className="text-zinc-400 mt-3">
          Odkryto nowe województwo
        </div>
        <div className="text-3xl font-bold text-orange-500 mt-2">
          {newVoivodeshipPopup}
        </div>
      </div>
    </div>
  )}
</div>
);

}
