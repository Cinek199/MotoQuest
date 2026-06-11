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

    return () => {
      navigator.geolocation.clearWatch(
        watchId
      );
      map.remove();
    };
  }, []);

  return (
  <div className="space-y-4">

    <div className="bg-zinc-900 rounded-3xl p-4 border border-orange-500">

      <div className="font-bold text-orange-500 mb-3">
        🧪 DEV PANEL
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">

        <button
  onClick={() => {

    const discovered =
      JSON.parse(
        localStorage.getItem(
          "mq_voivodeships"
        ) || "[]"
      );

    if (
      !discovered.includes(
        "Mazowieckie"
      )
    ) {
      discovered.push(
        "Mazowieckie"
      );

      localStorage.setItem(
        "mq_voivodeships",
        JSON.stringify(
          discovered
        )
      );

      window.dispatchEvent(
        new Event(
          "mq-voivodeships-updated"
        )
      );
    }

    setCurrentVoivodeship(
      "Mazowieckie"
    );

    setNewVoivodeshipPopup(
      "Mazowieckie"
    );

    setTimeout(() => {
      setNewVoivodeshipPopup(
        null
      );
    }, 4000);
  }}
  className="bg-zinc-800 rounded-lg p-2"
>
  Warszawa
</button>

        <button
          onClick={() => {
            setCurrentVoivodeship(
              "Małopolskie"
            );

            setNewVoivodeshipPopup(
              "Małopolskie"
            );

            setTimeout(() => {
              setNewVoivodeshipPopup(
                null
              );
            }, 4000);
          }}
          className="bg-zinc-800 rounded-lg p-2"
        >
          Kraków
        </button>

        <button
          onClick={() => {
            setCurrentVoivodeship(
              "Pomorskie"
            );

            setNewVoivodeshipPopup(
              "Pomorskie"
            );

            setTimeout(() => {
              setNewVoivodeshipPopup(
                null
              );
            }, 4000);
          }}
          className="bg-zinc-800 rounded-lg p-2"
        >
          Gdańsk
        </button>

        <button
          onClick={() => {
            setCurrentVoivodeship(
              "Dolnośląskie"
            );

            setNewVoivodeshipPopup(
              "Dolnośląskie"
            );

            setTimeout(() => {
              setNewVoivodeshipPopup(
                null
              );
            }, 4000);
          }}
          className="bg-zinc-800 rounded-lg p-2"
        >
          Wrocław
        </button>

        <button
          onClick={() => {
            setCurrentVoivodeship(
              "Podlaskie"
            );

            setNewVoivodeshipPopup(
              "Podlaskie"
            );

            setTimeout(() => {
              setNewVoivodeshipPopup(
                null
              );
            }, 4000);
          }}
          className="bg-zinc-800 rounded-lg p-2"
        >
          Białystok
        </button>

        <button
          onClick={() => {
            setCurrentVoivodeship(
              "Lubelskie"
            );

            setNewVoivodeshipPopup(
              "Lubelskie"
            );

            setTimeout(() => {
              setNewVoivodeshipPopup(
                null
              );
            }, 4000);
          }}
          className="bg-zinc-800 rounded-lg p-2"
        >
          Lublin
        </button>

      </div>

    </div>
      <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800">
  <div className="text-sm text-zinc-400">
    Województwo
  </div>

  <div className="text-4xl font-bold text-orange-500">
    {currentVoivodeship}
  </div>
</div>
      <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800">
        <div className="text-sm text-zinc-400">
          Aktualna miejscowość
        </div>

        <div className="text-4xl font-bold text-orange-500">
          {currentTown}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800">
        <div className="text-sm text-zinc-400">
          Odkryte kafelki
        </div>
        <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800">
  <div className="text-sm text-zinc-400">
    🏍 Przebieg
  </div>

  <div className="text-4xl font-bold text-orange-500">
    {distanceKm.toFixed(2)} km
  </div>
</div>

        <div className="text-4xl font-bold text-orange-500">
          {tilesCount}
        </div>

        <div className="text-sm text-zinc-500">
          Powierzchnia{" "}
          {(tilesCount * 0.25).toFixed(2)}
          {" "}km²
        </div>
      </div>

      <div
        ref={mapContainer}
        className="w-full h-[650px] rounded-3xl overflow-hidden"
      />
      {newVoivodeshipPopup && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">

    <div className="bg-zinc-900 border border-orange-500 rounded-3xl p-8 text-center max-w-md mx-4 animate-pulse">

      <div className="text-6xl mb-4">
        🎉
      </div>

      <div className="text-zinc-400 text-sm uppercase tracking-widest">
        Odkryto nowe województwo
      </div>

      <div className="text-3xl font-bold text-orange-500 mt-3">
        {newVoivodeshipPopup}
      </div>

      <div className="text-2xl font-bold mt-6 text-green-400">
        +500 XP
      </div>

    </div>

  </div>
)}
    </div>
  );
}