"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

import { unlockAchievement } from "./achievements";
import { calculateDistanceKm } from "./distance";
import { addDistanceToActiveBike } from "./garage";
import { getVoivodeship } from "./getVoivodeship";
import {
  drainNativeLocations,
  isNativeAndroid,
  type NativeLocationPoint,
  startNativeBackgroundTracking,
} from "./nativeAndroid";
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

type CompassOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionState>;
};

export function useMotoQuestTracking({
  addTileLayer,
  map,
  shouldFollowUser,
}: UseMotoQuestTrackingParams) {
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const markerHeadingRef = useRef(0);
  const compassFrameRef = useRef<number | null>(null);
  const markerAnimationRef = useRef<number | null>(null);
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

    const cleanupCompass = setupCompassHeading(map);

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

    let nativeSyncRunning = false;

    const syncNativeTracking = async () => {
      if (!isNativeAndroid() || nativeSyncRunning) {
        return;
      }

      nativeSyncRunning = true;

      try {
        await startNativeBackgroundTracking();
        const points = await drainNativeLocations();

        if (points.length > 0) {
          await handleNativeLocations(points, map);
        }
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !error.message.includes("LOCATION_PERMISSION_REQUIRED")
        ) {
          console.error("Native background tracking error:", error);
        }
      } finally {
        nativeSyncRunning = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncNativeTracking();
      }
    };

    void syncNativeTracking();
    const nativeSyncInterval = window.setInterval(syncNativeTracking, 5000);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(nativeSyncInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      cleanupCompass();
      if (markerAnimationRef.current !== null) window.cancelAnimationFrame(markerAnimationRef.current);
    };
  }, [addTileLayer, map]);

  async function handlePosition(
    position: GeolocationPosition,
    map: maplibregl.Map
  ) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const nextPosition = { lat, lon };

    if (lastPositionRef.current && (position.coords.accuracy ?? 0) > 120) {
      return;
    }

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

    const tileChanged = discoverTile(lat, lon, map, voivodeship);

    if ((progressChanged || tileChanged) && userIdRef.current) {
      await savePlayer(userIdRef.current);
    }
  }

  async function handleNativeLocations(
    points: NativeLocationPoint[],
    map: maplibregl.Map
  ) {
    const validPoints = points
      .filter(
        (point) =>
          Number.isFinite(point.lat) &&
          Number.isFinite(point.lon) &&
          Number.isFinite(point.timestamp)
      )
      .sort((first, second) => first.timestamp - second.timestamp);

    if (validPoints.length === 0) {
      return;
    }

    lastPositionRef.current = {
      lat: validPoints[0].lat,
      lon: validPoints[0].lon,
    };

    let tileChanged = false;

    validPoints.forEach((point) => {
      const nextPosition = { lat: point.lat, lon: point.lon };

      appendActiveTripPoint({
        accuracy: point.accuracy,
        lat: point.lat,
        lon: point.lon,
        speedKmh:
          typeof point.speed === "number" && Number.isFinite(point.speed)
            ? point.speed * 3.6
            : null,
        timestamp: point.timestamp,
      });

      updateDistance(nextPosition);
      tileChanged = discoverTile(point.lat, point.lon, map) || tileChanged;
    });

    const latest = validPoints[validPoints.length - 1];
    const latestPosition = { lat: latest.lat, lon: latest.lon };

    if (typeof latest.bearing === "number" && Number.isFinite(latest.bearing)) {
      markerHeadingRef.current = smoothHeading(
        markerHeadingRef.current,
        latest.bearing
      );
    }

    setCurrentPosition(latestPosition);
    updateMapPosition(map, latestPosition);

    const town = await getTownName(latest.lat, latest.lon);
    const voivodeship = await getVoivodeship(latest.lat, latest.lon);

    setCurrentTown(town);
    setCurrentVoivodeship(voivodeship);

    let progressChanged = false;

    if (town !== "Nieznana") {
      progressChanged =
        addUniqueString(STORAGE_KEYS.towns, town).added || progressChanged;
    }

    if (voivodeship !== "Nieznane") {
      const voivodeshipResult = addUniqueString(
        STORAGE_KEYS.voivodeships,
        voivodeship
      );
      progressChanged = voivodeshipResult.added || progressChanged;

      if (voivodeshipResult.added) {
        window.dispatchEvent(new Event("mq-voivodeships-updated"));
      }
    }

    if ((progressChanged || tileChanged) && userIdRef.current) {
      await savePlayer(userIdRef.current);
    }

    window.dispatchEvent(new Event("motoquest-progress-updated"));
    window.dispatchEvent(new Event("storage"));
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
      map.easeTo({
        center: [position.lon, position.lat],
        bearing: markerHeadingRef.current,
        zoom: Math.max(15, map.getZoom()),
        duration: 950,
        easing: (value) => value * value * (3 - 2 * value),
      });
    }

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({
        anchor: "center",
        element: createUserPositionMarker(getDisplayHeading(map)),
      })
        .setLngLat([position.lon, position.lat])
        .addTo(map);

      return;
    }

    animateMarker(position);
    applyUserMarkerHeading(markerRef.current.getElement(), getDisplayHeading(map));
  }

  function animateMarker(position: Position) {
    if (!markerRef.current) return;
    if (markerAnimationRef.current !== null) window.cancelAnimationFrame(markerAnimationRef.current);
    const start = markerRef.current.getLngLat();
    const startedAt = performance.now();
    const duration = 900;
    const frame = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = progress * progress * (3 - 2 * progress);
      markerRef.current?.setLngLat([
        start.lng + (position.lon - start.lng) * eased,
        start.lat + (position.lat - start.lat) * eased,
      ]);
      if (progress < 1) markerAnimationRef.current = window.requestAnimationFrame(frame);
      else markerAnimationRef.current = null;
    };
    markerAnimationRef.current = window.requestAnimationFrame(frame);
  }

  function setupCompassHeading(map: maplibregl.Map) {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      return () => {};
    }

    let listenerAdded = false;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const heading = getCompassHeading(event as CompassOrientationEvent);

      if (heading === null) {
        return;
      }

      markerHeadingRef.current = smoothHeading(markerHeadingRef.current, heading);

      if (compassFrameRef.current !== null) {
        return;
      }

      compassFrameRef.current = window.requestAnimationFrame(() => {
        compassFrameRef.current = null;

        if (!markerRef.current) {
          return;
        }

        applyUserMarkerHeading(
          markerRef.current.getElement(),
          getDisplayHeading(map)
        );
      });
    };

    const addListener = () => {
      if (listenerAdded) {
        return;
      }

      listenerAdded = true;
      window.addEventListener("deviceorientation", handleOrientation, true);
    };

    const requestPermission = () => {
      const orientationEvent =
        DeviceOrientationEvent as DeviceOrientationEventWithPermission;

      if (typeof orientationEvent.requestPermission !== "function") {
        addListener();
        return;
      }

      void orientationEvent
        .requestPermission()
        .then((state) => {
          if (state === "granted") {
            addListener();
          }
        })
        .catch(() => {});
    };

    const orientationEvent =
      DeviceOrientationEvent as DeviceOrientationEventWithPermission;

    if (typeof orientationEvent.requestPermission === "function") {
      window.addEventListener("pointerdown", requestPermission, { once: true });
      window.addEventListener("touchend", requestPermission, { once: true });
    } else {
      addListener();
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
      window.removeEventListener("pointerdown", requestPermission);
      window.removeEventListener("touchend", requestPermission);

      if (compassFrameRef.current !== null) {
        window.cancelAnimationFrame(compassFrameRef.current);
        compassFrameRef.current = null;
      }
    };
  }

  function getDisplayHeading(map: maplibregl.Map) {
    return normalizeHeading(markerHeadingRef.current - map.getBearing());
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

  function discoverTile(lat: number, lon: number, map: maplibregl.Map, voivodeship?: string) {
    const tileId = getTileId(lat, lon);

    if (discoveredTilesRef.current.has(tileId)) {
      return false;
    }

    discoveredTilesRef.current.add(tileId);
    setJson(STORAGE_KEYS.tiles, [...discoveredTilesRef.current]);
    setTilesCount(discoveredTilesRef.current.size);
    addTileLayer(map, tileId);

    if (voivodeship && voivodeship !== "Nieznane") {
      const slug = voivodeship.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const counts = getJson<Record<string, number>>(STORAGE_KEYS.voivodeshipTiles, {});
      counts[slug] = (counts[slug] || 0) + 1;
      setJson(STORAGE_KEYS.voivodeshipTiles, counts);
      window.dispatchEvent(new Event("mq-voivodeships-updated"));
    }

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
    height: "40px",
    pointerEvents: "none",
    position: "relative",
    width: "40px",
  });

  const glow = document.createElement("div");
  Object.assign(glow.style, {
    background:
      "radial-gradient(circle, rgba(255, 107, 0, 0.34) 0%, rgba(255, 107, 0, 0.14) 42%, rgba(255, 107, 0, 0) 74%)",
    borderRadius: "999px",
    height: "40px",
    inset: "0",
    position: "absolute",
    width: "40px",
  });

  const rotator = document.createElement("div");
  Object.assign(rotator.style, {
    height: "40px",
    inset: "0",
    position: "absolute",
    transform: "rotate(var(--mq-user-marker-heading, 0deg))",
    transformOrigin: "50% 50%",
    transition: "transform 260ms ease-out",
    width: "40px",
    willChange: "transform",
  });

  const shadow = document.createElement("div");
  Object.assign(shadow.style, {
    background: "rgba(0, 0, 0, 0.76)",
    clipPath: "polygon(50% 0%, 96% 100%, 50% 78%, 4% 100%)",
    filter: "blur(0.3px)",
    height: "30px",
    left: "10px",
    position: "absolute",
    top: "5px",
    transform: "translate(2px, 2px)",
    width: "21px",
  });

  const arrow = document.createElement("div");
  Object.assign(arrow.style, {
    background:
      "linear-gradient(180deg, #ff8a1f 0%, #ff5a00 62%, #bd3f00 100%)",
    clipPath: "polygon(50% 0%, 96% 100%, 50% 78%, 4% 100%)",
    filter:
      "drop-shadow(0 0 8px rgba(249, 115, 22, 0.95)) drop-shadow(0 2px 7px rgba(0, 0, 0, 0.9))",
    height: "30px",
    left: "10px",
    position: "absolute",
    top: "4px",
    width: "21px",
  });

  const core = document.createElement("div");
  Object.assign(core.style, {
    background: "#0b0b0d",
    border: "1px solid rgba(255, 255, 255, 0.82)",
    borderRadius: "999px",
    height: "6px",
    left: "17px",
    position: "absolute",
    top: "15px",
    width: "6px",
  });

  rotator.append(shadow, arrow, core);
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

function getCompassHeading(event: CompassOrientationEvent) {
  if (
    typeof event.webkitCompassHeading === "number" &&
    Number.isFinite(event.webkitCompassHeading)
  ) {
    return normalizeHeading(event.webkitCompassHeading);
  }

  if (typeof event.alpha !== "number" || !Number.isFinite(event.alpha)) {
    return null;
  }

  const screenAngle =
    typeof window !== "undefined" && window.screen?.orientation
      ? window.screen.orientation.angle
      : 0;

  return normalizeHeading(360 - event.alpha + screenAngle);
}

function normalizeHeading(heading: number) {
  return ((heading % 360) + 360) % 360;
}

function smoothHeading(previous: number, next: number) {
  const delta = ((((next - previous) % 360) + 540) % 360) - 180;
  return normalizeHeading(previous + delta * 0.4);
}
