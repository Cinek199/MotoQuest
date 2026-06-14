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
  const markerHeadingRef = useRef(0);
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
    updateMarkerHeading(nextPosition, position.coords);

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
        anchor: "center",
        element: createUserPositionMarker(markerHeadingRef.current),
      })
        .setLngLat([position.lon, position.lat])
        .addTo(map);

      return;
    }

    markerRef.current.setLngLat([position.lon, position.lat]);
    applyUserMarkerHeading(
      markerRef.current.getElement(),
      markerHeadingRef.current
    );
  }

  function updateMarkerHeading(
    position: Position,
    coords: GeolocationCoordinates
  ) {
    const gpsHeading =
      typeof coords.heading === "number" && Number.isFinite(coords.heading)
        ? coords.heading
        : null;
    const gpsSpeed =
      typeof coords.speed === "number" && Number.isFinite(coords.speed)
        ? coords.speed
        : 0;

    if (gpsHeading !== null && gpsSpeed > 0.5) {
      markerHeadingRef.current = smoothHeading(
        markerHeadingRef.current,
        gpsHeading
      );
      return;
    }

    if (!lastPositionRef.current) {
      return;
    }

    const distanceKm = calculateDistanceKm(
      lastPositionRef.current.lat,
      lastPositionRef.current.lon,
      position.lat,
      position.lon
    );

    if (distanceKm < 0.005 || distanceKm >= 2) {
      return;
    }

    markerHeadingRef.current = smoothHeading(
      markerHeadingRef.current,
      calculateBearing(lastPositionRef.current, position)
    );
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

function createUserPositionMarker(heading: number) {
  const marker = document.createElement("div");
  marker.setAttribute("aria-label", "Aktualna pozycja");
  marker.style.setProperty("--mq-user-marker-heading", `${heading}deg`);
  Object.assign(marker.style, {
    height: "36px",
    pointerEvents: "none",
    position: "relative",
    width: "36px",
  });

  const glow = document.createElement("div");
  Object.assign(glow.style, {
    background:
      "radial-gradient(circle, rgba(255, 107, 0, 0.38) 0%, rgba(255, 107, 0, 0.18) 38%, rgba(255, 107, 0, 0) 72%)",
    borderRadius: "999px",
    height: "36px",
    inset: "0",
    position: "absolute",
    width: "36px",
  });

  const rotator = document.createElement("div");
  Object.assign(rotator.style, {
    height: "36px",
    inset: "0",
    position: "absolute",
    transform: "rotate(var(--mq-user-marker-heading, 0deg))",
    transformOrigin: "50% 50%",
    transition: "transform 260ms ease-out",
    width: "36px",
    willChange: "transform",
  });

  const shadow = document.createElement("div");
  Object.assign(shadow.style, {
    background: "rgba(0, 0, 0, 0.68)",
    clipPath: "polygon(50% 0%, 88% 100%, 50% 78%, 12% 100%)",
    filter: "blur(0.2px)",
    height: "29px",
    left: "9px",
    position: "absolute",
    top: "5px",
    transform: "translate(2px, 2px)",
    width: "18px",
  });

  const arrow = document.createElement("div");
  Object.assign(arrow.style, {
    background:
      "linear-gradient(180deg, #ffb020 0%, #ff6b00 56%, #c84605 100%)",
    clipPath: "polygon(50% 0%, 88% 100%, 50% 78%, 12% 100%)",
    filter:
      "drop-shadow(0 0 8px rgba(255, 107, 0, 0.85)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.95))",
    height: "29px",
    left: "9px",
    position: "absolute",
    top: "4px",
    width: "18px",
  });

  rotator.append(shadow, arrow);
  marker.append(glow, rotator);

  return marker;
}

function applyUserMarkerHeading(marker: HTMLElement, heading: number) {
  marker.style.setProperty("--mq-user-marker-heading", `${heading}deg`);
}

function calculateBearing(from: Position, to: Position) {
  const lat1 = degreesToRadians(from.lat);
  const lat2 = degreesToRadians(to.lat);
  const deltaLon = degreesToRadians(to.lon - from.lon);
  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  return (radiansToDegrees(Math.atan2(y, x)) + 360) % 360;
}

function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function radiansToDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}

function smoothHeading(previous: number, next: number) {
  const delta = ((((next - previous) % 360) + 540) % 360) - 180;
  return (previous + delta * 0.4 + 360) % 360;
}
