"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

import { unlockAchievement } from "./achievements";
import { calculateDistanceKm } from "./distance";
import { addDistanceToActiveBike } from "./garage";
import { getVoivodeship } from "./getVoivodeship";
import { savePlayer } from "./playerService";
import { getTownName } from "./reverseGeocode";
import {
  addUniqueString,
  getJson,
  getNumber,
  setJson,
  setNumber,
  STORAGE_KEYS,
} from "./storage";
import { getTileId } from "./tiles";
import { appendActiveTripPoint } from "./trips";
import { supabase } from "./supabase";

type Position = {
  lat: number;
  lon: number;
};

type UseMotoQuestTrackingParams = {
  addTileLayer: (map: maplibregl.Map, tileId: string) => void;
  map: maplibregl.Map | null;
  shouldFollowUser: boolean;
};

export function useMotoQuestTracking({
  addTileLayer,
  map,
  shouldFollowUser,
}: UseMotoQuestTrackingParams) {
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const userIdRef = useRef("");
  const lastPositionRef = useRef<Position | null>(null);
  const shouldFollowUserRef = useRef(shouldFollowUser);
  const discoveredTilesRef = useRef(
    new Set<string>(getJson<string[]>(STORAGE_KEYS.tiles, []))
  );

  const [tilesCount, setTilesCount] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [currentTown, setCurrentTown] = useState("Ładowanie...");
  const [currentVoivodeship, setCurrentVoivodeship] = useState("Nieznane");
  const [newVoivodeshipPopup, setNewVoivodeshipPopup] = useState<string | null>(
    null
  );
  const [distanceKm, setDistanceKm] = useState(0);

  useEffect(() => {
    shouldFollowUserRef.current = shouldFollowUser;
  }, [shouldFollowUser]);

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
  }, []);

  useEffect(() => {
    if (!map) {
      return;
    }

    discoveredTilesRef.current.forEach((tileId) => {
      addTileLayer(map, tileId);
    });

    setTilesCount(discoveredTilesRef.current.size);
    setDistanceKm(getNumber(STORAGE_KEYS.distance));

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        void handlePosition(position, map);
      },
      () => {
        setCurrentTown("Brak GPS");
        setCurrentVoivodeship("Nieznane");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [addTileLayer, map]);

  async function handlePosition(
    position: GeolocationPosition,
    map: maplibregl.Map
  ) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const nextPosition = { lat, lon };

    setCurrentPosition(nextPosition);

    appendActiveTripPoint({
      accuracy: position.coords.accuracy ?? null,
      lat,
      lon,
      speedKmh:
        typeof position.coords.speed === "number" &&
        Number.isFinite(position.coords.speed)
          ? position.coords.speed * 3.6
          : null,
      timestamp: position.timestamp || Date.now(),
    });

    updateDistance(nextPosition);

    updateMapPosition(map, nextPosition);

    let progressChanged = false;

    const town = await getTownName(lat, lon);
    setCurrentTown(town);

    if (town !== "Nieznana") {
      const result = addUniqueString(STORAGE_KEYS.towns, town);

      if (result.added) {
        progressChanged = true;
        unlockAchievement("first-town", "Pierwsza miejscowość", 100);
      }
    }

    const voivodeship = await getVoivodeship(lat, lon);
    setCurrentVoivodeship(voivodeship);

    if (voivodeship !== "Nieznane") {
      const result = addUniqueString(STORAGE_KEYS.voivodeships, voivodeship);

      if (result.added) {
        progressChanged = true;
        showVoivodeshipPopup(voivodeship);
        window.dispatchEvent(new Event("mq-voivodeships-updated"));
        unlockAchievement("first-voivodeship", "Pierwsze województwo", 500);
      }
    }

    const tileChanged = discoverTile(lat, lon, map);

    if ((progressChanged || tileChanged) && userIdRef.current) {
      await savePlayer(userIdRef.current);
    }
  }

  function updateDistance(position: Position) {
    if (!lastPositionRef.current) {
      lastPositionRef.current = position;
      return;
    }

    const km = calculateDistanceKm(
      lastPositionRef.current.lat,
      lastPositionRef.current.lon,
      position.lat,
      position.lon
    );

    lastPositionRef.current = position;

    if (km >= 2) {
      return;
    }

    const newDistance = getNumber(STORAGE_KEYS.distance) + km;
    setNumber(STORAGE_KEYS.distance, newDistance);
    addDistanceToActiveBike(km);

    unlockDistanceAchievements(newDistance);
    setDistanceKm(Number(newDistance.toFixed(2)));
  }

  function updateMapPosition(map: maplibregl.Map, position: Position) {
    if (shouldFollowUserRef.current) {
      map.flyTo({
        center: [position.lon, position.lat],
        zoom: 15,
        duration: 500,
      });
    }

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({
        element: createUserPositionMarker(),
      })
        .setLngLat([position.lon, position.lat])
        .addTo(map);

      return;
    }

    markerRef.current.setLngLat([position.lon, position.lat]);
  }

  function discoverTile(lat: number, lon: number, map: maplibregl.Map) {
    const tileId = getTileId(lat, lon);

    if (discoveredTilesRef.current.has(tileId)) {
      return false;
    }

    discoveredTilesRef.current.add(tileId);
    setJson(STORAGE_KEYS.tiles, [...discoveredTilesRef.current]);
    setTilesCount(discoveredTilesRef.current.size);
    addTileLayer(map, tileId);

    return true;
  }

  function showVoivodeshipPopup(voivodeship: string) {
    setNewVoivodeshipPopup(voivodeship);

    setTimeout(() => {
      setNewVoivodeshipPopup(null);
    }, 4000);
  }

  return {
    currentPosition,
    currentTown,
    currentVoivodeship,
    distanceKm,
    newVoivodeshipPopup,
    tilesCount,
  };
}

function unlockDistanceAchievements(distanceKm: number) {
  if (distanceKm >= 1) {
    unlockAchievement("distance-1", "Pierwszy kilometr", 100);
  }

  if (distanceKm >= 100) {
    unlockAchievement("distance-100", "100 km", 500);
  }

  if (distanceKm >= 1000) {
    unlockAchievement("distance-1000", "1000 km", 2500);
  }

  if (distanceKm >= 10000) {
    unlockAchievement("distance-10000", "10000 km", 10000);
  }
}

function createUserPositionMarker() {
  const marker = document.createElement("div");
  marker.setAttribute("aria-label", "Aktualna pozycja");
  Object.assign(marker.style, {
    height: "46px",
    pointerEvents: "none",
    position: "relative",
    width: "46px",
  });

  const trail = document.createElement("div");
  Object.assign(trail.style, {
    background: "rgba(249, 115, 22, 0.5)",
    borderRadius: "999px",
    bottom: "6px",
    boxShadow: "0 0 18px rgba(249, 115, 22, 0.75)",
    height: "10px",
    left: "17px",
    position: "absolute",
    transform: "rotate(45deg)",
    width: "22px",
  });

  const halo = document.createElement("div");
  Object.assign(halo.style, {
    background: "rgba(0, 0, 0, 0.78)",
    border: "1px solid rgba(249, 115, 22, 0.75)",
    borderRadius: "999px",
    boxShadow: "0 0 0 5px rgba(249, 115, 22, 0.12), 0 0 26px rgba(249, 115, 22, 0.55)",
    height: "34px",
    left: "6px",
    position: "absolute",
    top: "5px",
    width: "34px",
  });

  const arrow = document.createElement("div");
  Object.assign(arrow.style, {
    background: "linear-gradient(180deg, #ff8a1f 0%, #ff5a00 100%)",
    clipPath: "polygon(50% 0%, 96% 100%, 50% 78%, 4% 100%)",
    filter: "drop-shadow(0 0 10px rgba(249, 115, 22, 0.95))",
    height: "25px",
    left: "14px",
    position: "absolute",
    top: "9px",
    transform: "rotate(45deg)",
    width: "18px",
  });

  const core = document.createElement("div");
  Object.assign(core.style, {
    background: "#0b0b0d",
    border: "1px solid rgba(255, 255, 255, 0.82)",
    borderRadius: "999px",
    height: "7px",
    left: "19.5px",
    position: "absolute",
    top: "18.5px",
    width: "7px",
  });

  marker.append(trail, halo, arrow, core);

  return marker;
}
