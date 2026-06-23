"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import MapHud from "./MapHud";
import {
  enterNativePictureInPicture,
  isNativeAndroid,
} from "../lib/nativeAndroid";
import { savePlayer } from "../lib/playerService";
import { supabase } from "../lib/supabase";
import { TILE_SIZE } from "../lib/tiles";
import { ActiveTrip, finishActiveTrip, getActiveTrip } from "../lib/trips";
import { useMotoQuestTracking } from "../lib/useMotoQuestTracking";

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const FOG_DRIFT_X = 0.00058;
const FOG_DRIFT_Y = 0.00036;
const FOG_MAP_PARALLAX = 0.28;
const NORMAL_FOG_SYNC_MS = 120;
const LOW_POWER_FOG_SYNC_MS = 320;
const LOW_POWER_REVEAL_LIMIT = 140;
const NORMAL_REVEAL_LIMIT = 360;
const LOW_POWER_BOUNDARY_LIMIT = 180;
const NORMAL_BOUNDARY_LIMIT = 520;

type ScreenPoint = {
  x: number;
  y: number;
};

type FogRevealTile = {
  clear: number;
  points: ScreenPoint[];
};

type FogBoundaryEdge = {
  from: ScreenPoint;
  to: ScreenPoint;
};

type FogTextureOffset = ScreenPoint;

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
  const [fogBoundaryEdges, setFogBoundaryEdges] = useState<FogBoundaryEdge[]>([]);
  const [fogRevealTiles, setFogRevealTiles] = useState<FogRevealTile[]>([]);
  const [fogTextureOffset, setFogTextureOffset] = useState<FogTextureOffset>({
    x: 0,
    y: 0,
  });
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [fogEnabled, setFogEnabled] = useState(true);
  const [labelsEnabled, setLabelsEnabled] = useState(true);
  const [boundaryEnabled, setBoundaryEnabled] = useState(true);
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  const addTileLayer = useCallback((map: maplibregl.Map, tileId: string) => {
    const sourceId = `tile-${tileId}`;
    discoveredTileIdsRef.current.add(tileId);
    updateFogOverlay(
      map,
      discoveredTileIdsRef.current,
      setFogRevealTiles,
      setFogBoundaryEdges,
      setFogTextureOffset
    );

    // Discovered tiles are rendered by the fog canvas. Adding one invisible
    // MapLibre source/layer per tile makes gestures very slow on low-end Android.
    void sourceId;
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
      updateFogOverlay(
        nextMap,
        discoveredTileIdsRef.current,
        setFogRevealTiles,
        setFogBoundaryEdges,
        setFogTextureOffset
      );
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

    let fogSyncFrame = 0;
    let lastFogSync = 0;

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
      if (fogSyncFrame) {
        return;
      }

      fogSyncFrame = window.requestAnimationFrame(() => {
        fogSyncFrame = 0;
        const now = performance.now();
        const syncDelay = isLowPowerDevice()
          ? LOW_POWER_FOG_SYNC_MS
          : NORMAL_FOG_SYNC_MS;
        if (now - lastFogSync < syncDelay) return;
        lastFogSync = now;
        updateFogOverlay(
          map,
          discoveredTileIdsRef.current,
          setFogRevealTiles,
          setFogBoundaryEdges,
          setFogTextureOffset
        );
      });
    };

    map.on("dragstart", disableFollowMode);
    map.on("move", syncFog);
    map.on("moveend", syncFog);
    map.on("zoomstart", disableFollowMode);
    map.on("zoom", syncFog);
    map.on("zoomend", syncFog);
    map.on("rotatestart", disableFollowMode);
    map.on("rotate", syncFog);
    map.on("pitchstart", disableFollowMode);
    map.on("pitch", syncFog);

    return () => {
      if (fogSyncFrame) {
        window.cancelAnimationFrame(fogSyncFrame);
      }

      map.off("dragstart", disableFollowMode);
      map.off("move", syncFog);
      map.off("moveend", syncFog);
      map.off("zoomstart", disableFollowMode);
      map.off("zoom", syncFog);
      map.off("zoomend", syncFog);
      map.off("rotatestart", disableFollowMode);
      map.off("rotate", syncFog);
      map.off("pitchstart", disableFollowMode);
      map.off("pitch", syncFog);
    };
  }, [map]);

  useEffect(() => {
    if (!map) {
      return;
    }

    let resizeFrame = 0;
    const resizeTimeouts: number[] = [];
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const resizeMap = () => {
      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        const viewportHeight =
          window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight;

        document.documentElement.style.setProperty(
          "--mq-vh",
          `${Math.round(viewportHeight)}px`
        );
        window.scrollTo(0, 0);
        map.resize();
        updateFogOverlay(
          map,
          discoveredTileIdsRef.current,
          setFogRevealTiles,
          setFogBoundaryEdges,
          setFogTextureOffset
        );
      });
    };

    const scheduleResize = () => {
      resizeMap();
      [80, 160, 320, 520, 820, 1200].forEach((delay) => {
        resizeTimeouts.push(window.setTimeout(resizeMap, delay));
      });
    };
    const resizeObserver = new ResizeObserver(scheduleResize);

    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    window.addEventListener("resize", scheduleResize);
    window.addEventListener("orientationchange", scheduleResize);
    window.visualViewport?.addEventListener("scroll", scheduleResize);
    window.visualViewport?.addEventListener("resize", scheduleResize);

    scheduleResize();

    return () => {
      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }

      resizeTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("orientationchange", scheduleResize);
      window.visualViewport?.removeEventListener("scroll", scheduleResize);
      window.visualViewport?.removeEventListener("resize", scheduleResize);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
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

  const toggleLabels = () => {
    if (!map) return;
    const next = !labelsEnabled;
    map.getStyle().layers?.filter((layer) => layer.type === "symbol").forEach((layer) => map.setLayoutProperty(layer.id, "visibility", next ? "visible" : "none"));
    setLabelsEnabled(next);
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

  const enterPictureInPicture = () => {
    void enterNativePictureInPicture().catch((error) => {
      console.error("Picture in picture error:", error);
    });
  };

  return (
    <div className="mq-map-shell relative overflow-hidden rounded-[2.15rem] border border-white/10 bg-zinc-950 shadow-2xl shadow-black/80 ring-1 ring-orange-500/10">
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.12),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.12),transparent_35%,rgba(0,0,0,0.34))]" />

      <div
        ref={mapContainer}
        className="mq-map-canvas w-full"
      />

      {fogEnabled && <MapFogOverlay
        boundaryEdges={fogBoundaryEdges}
        revealTiles={fogRevealTiles}
        textureOffset={fogTextureOffset}
        showBoundary={boundaryEnabled}
      />}

      <MapHud
        activeTrip={activeTrip}
        currentTown={currentTown}
        currentVoivodeship={currentVoivodeship}
        distanceKm={distanceKm}
        hasUnreadNotifications={hasUnreadNotifications}
        isFollowingUser={isFollowingUser}
        fogEnabled={fogEnabled}
        labelsEnabled={labelsEnabled}
        boundaryEnabled={boundaryEnabled}
        onCenterUser={centerOnUser}
        onEnterPictureInPicture={
          isNativeAndroid() ? enterPictureInPicture : undefined
        }
        onOpenNotifications={onOpenNotifications}
        onStopRecording={stopActiveTrip}
        onToggleFog={() => setFogEnabled((value) => !value)}
        onToggleLabels={toggleLabels}
        onToggleBoundary={() => setBoundaryEnabled((value) => !value)}
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

function isLowPowerDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency || 4;
  const userAgent = navigator.userAgent.toLowerCase();

  return memory <= 3 || cores <= 4 || userAgent.includes("p20 lite");
}

function updateFogOverlay(
  map: maplibregl.Map,
  discoveredTileIds: Set<string>,
  setFogRevealTiles: (tiles: FogRevealTile[]) => void,
  setFogBoundaryEdges: (edges: FogBoundaryEdge[]) => void,
  setFogTextureOffset: (offset: FogTextureOffset) => void
) {
  const bounds = map.getBounds();
  const width = map.getContainer().clientWidth;
  const height = map.getContainer().clientHeight;
  const revealTileMap = new Map<
    string,
    {
      clear: number;
      tileX: number;
      tileY: number;
    }
  >();
  const revealTiles: FogRevealTile[] = [];
  const boundaryEdges: FogBoundaryEdge[] = [];
  const lowPower = isLowPowerDevice();
  const maxRevealTiles = lowPower ? LOW_POWER_REVEAL_LIMIT : NORMAL_REVEAL_LIMIT;
  const maxBoundaryEdges = lowPower ? LOW_POWER_BOUNDARY_LIMIT : NORMAL_BOUNDARY_LIMIT;
  const revealRadius = lowPower ? 1 : 2;
  const clearByDistance = lowPower ? [1, 0.24] : [1, 0.36, 0.12];
  const expandedWest = bounds.getWest() - TILE_SIZE * (revealRadius + 1);
  const expandedEast = bounds.getEast() + TILE_SIZE * (revealRadius + 1);
  const expandedSouth = bounds.getSouth() - TILE_SIZE * (revealRadius + 1);
  const expandedNorth = bounds.getNorth() + TILE_SIZE * (revealRadius + 1);
  const discoveredCoords = [...discoveredTileIds]
    .map((tileId) => tileId.split("_").map(Number))
    .filter(([tileX, tileY]) => {
      const tileWest = tileX * TILE_SIZE;
      const tileEast = tileWest + TILE_SIZE;
      const tileSouth = tileY * TILE_SIZE;
      const tileNorth = tileSouth + TILE_SIZE;

      return (
        tileEast >= expandedWest &&
        tileWest <= expandedEast &&
        tileNorth >= expandedSouth &&
        tileSouth <= expandedNorth
      );
    });
  const worldAnchor = map.project([0, 0]);

  setFogTextureOffset({
    x: worldAnchor.x,
    y: worldAnchor.y,
  });

  discoveredCoords.forEach(([tileX, tileY]) => {
    for (let xOffset = -revealRadius; xOffset <= revealRadius; xOffset += 1) {
      for (let yOffset = -revealRadius; yOffset <= revealRadius; yOffset += 1) {
        const distance = Math.max(Math.abs(xOffset), Math.abs(yOffset));
        const clear = clearByDistance[distance] ?? 0;

        if (clear <= 0) {
          continue;
        }

        const nextTileX = tileX + xOffset;
        const nextTileY = tileY + yOffset;
        const key = `${nextTileX}_${nextTileY}`;
        const current = revealTileMap.get(key);

        if (!current || clear > current.clear) {
          revealTileMap.set(key, {
            clear,
            tileX: nextTileX,
            tileY: nextTileY,
          });
        }
      }
    }
  });

  revealTileMap.forEach(({ clear, tileX, tileY }) => {
    const tileWest = tileX * TILE_SIZE;
    const tileEast = tileWest + TILE_SIZE;
    const tileSouth = tileY * TILE_SIZE;
    const tileNorth = tileSouth + TILE_SIZE;

    if (
      tileEast < bounds.getWest() - TILE_SIZE ||
      tileWest > bounds.getEast() + TILE_SIZE ||
      tileNorth < bounds.getSouth() - TILE_SIZE ||
      tileSouth > bounds.getNorth() + TILE_SIZE
    ) {
      return;
    }

    const points = [
      map.project([tileWest, tileSouth]),
      map.project([tileEast, tileSouth]),
      map.project([tileEast, tileNorth]),
      map.project([tileWest, tileNorth]),
    ];

    const isVisible = points.some((point) => {
      return (
        point.x >= -40 &&
        point.x <= width + 40 &&
        point.y >= -40 &&
        point.y <= height + 40
      );
    });

    if (!isVisible) {
      return;
    }

    if (revealTiles.length >= maxRevealTiles) {
      return;
    }

    revealTiles.push({
      clear,
      points,
    });
  });

  discoveredCoords.forEach(([tileX, tileY]) => {
    const tileWest = tileX * TILE_SIZE;
    const tileEast = tileWest + TILE_SIZE;
    const tileSouth = tileY * TILE_SIZE;
    const tileNorth = tileSouth + TILE_SIZE;

    if (
      tileEast < bounds.getWest() - TILE_SIZE ||
      tileWest > bounds.getEast() + TILE_SIZE ||
      tileNorth < bounds.getSouth() - TILE_SIZE ||
      tileSouth > bounds.getNorth() + TILE_SIZE
    ) {
      return;
    }

    const edges = [
      {
        from: [tileWest, tileSouth] as [number, number],
        neighbor: `${tileX}_${tileY - 1}`,
        to: [tileEast, tileSouth] as [number, number],
      },
      {
        from: [tileEast, tileSouth] as [number, number],
        neighbor: `${tileX + 1}_${tileY}`,
        to: [tileEast, tileNorth] as [number, number],
      },
      {
        from: [tileEast, tileNorth] as [number, number],
        neighbor: `${tileX}_${tileY + 1}`,
        to: [tileWest, tileNorth] as [number, number],
      },
      {
        from: [tileWest, tileNorth] as [number, number],
        neighbor: `${tileX - 1}_${tileY}`,
        to: [tileWest, tileSouth] as [number, number],
      },
    ];

    edges.forEach((edge) => {
      if (discoveredTileIds.has(edge.neighbor)) {
        return;
      }

      const from = map.project(edge.from);
      const to = map.project(edge.to);

      if (boundaryEdges.length >= maxBoundaryEdges) {
        return;
      }

      boundaryEdges.push({
        from,
        to,
      });
    });
  });

  setFogRevealTiles(revealTiles);
  setFogBoundaryEdges(boundaryEdges);
}

function MapFogOverlay({
  boundaryEdges,
  revealTiles,
  textureOffset,
  showBoundary,
}: {
  boundaryEdges: FogBoundaryEdge[];
  revealTiles: FogRevealTile[];
  textureOffset: FogTextureOffset;
  showBoundary: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const boundaryEdgesRef = useRef(boundaryEdges);
  const revealTilesRef = useRef(revealTiles);
  const showBoundaryRef = useRef(showBoundary);
  const textureOffsetRef = useRef(textureOffset);
  const [fogTexture, setFogTexture] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    boundaryEdgesRef.current = boundaryEdges;
    revealTilesRef.current = revealTiles;
    showBoundaryRef.current = showBoundary;
    textureOffsetRef.current = textureOffset;
  }, [boundaryEdges, revealTiles, showBoundary, textureOffset]);

  useEffect(() => {
    const image = new Image();

    image.onload = () => setFogTexture(image);
    image.src = "/fog/fog-texture.png";
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !fogTexture) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: true });

    if (!context) {
      return;
    }

    const lowPower = isLowPowerDevice();
    const dpr = lowPower ? 0.55 : Math.min(1.15, window.devicePixelRatio || 1);
    let animationFrame = 0;
    let lastPaint = 0;
    let canvasWidth = 0;
    let canvasHeight = 0;

    const resizeCanvasIfNeeded = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const nextCanvasWidth = Math.round(width * dpr);
      const nextCanvasHeight = Math.round(height * dpr);

      if (canvas.width !== nextCanvasWidth || canvas.height !== nextCanvasHeight) {
        canvas.width = nextCanvasWidth;
        canvas.height = nextCanvasHeight;
        canvasWidth = width;
        canvasHeight = height;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      return { height, width };
    };

    const paint = (time: number) => {
      const minFrameTime = lowPower ? 420 : 170;

      if (time - lastPaint < minFrameTime) {
        animationFrame = window.requestAnimationFrame(paint);
        return;
      }

      lastPaint = time;
      const { height, width } = resizeCanvasIfNeeded();
      canvasWidth = width;
      canvasHeight = height;
      drawFogCanvas(
        context,
        fogTexture,
        canvasWidth,
        canvasHeight,
        revealTilesRef.current,
        showBoundaryRef.current ? boundaryEdgesRef.current : [],
        textureOffsetRef.current,
        time
      );
      animationFrame = window.requestAnimationFrame(paint);
    };

    resizeCanvasIfNeeded();
    animationFrame = window.requestAnimationFrame(paint);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [fogTexture]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[12] h-full w-full"
    />
  );
}

function drawFogCanvas(
  context: CanvasRenderingContext2D,
  fogTexture: HTMLImageElement,
  width: number,
  height: number,
  revealTiles: FogRevealTile[],
  boundaryEdges: FogBoundaryEdge[],
  textureOffset: FogTextureOffset,
  time: number
) {
  context.clearRect(0, 0, width, height);
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  context.fillStyle = "rgba(2, 3, 4, 0.92)";
  context.fillRect(0, 0, width, height);

  drawTiledFogTexture(context, fogTexture, width, height, textureOffset, time, 0.68, 0.72);
  drawTiledFogTexture(
    context,
    fogTexture,
    width,
    height,
    textureOffset,
    time * 0.22 + 9000,
    0.42,
    1.08
  );

  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
  context.fillStyle = "rgba(0, 0, 0, 0.22)";
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = "destination-out";

  revealTiles.forEach((tile) => {
    context.fillStyle = `rgba(0, 0, 0, ${tile.clear})`;
    context.beginPath();
    tile.points.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
        return;
      }

      context.lineTo(point.x, point.y);
    });
    context.closePath();
    context.fill();
  });

  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
  context.fillStyle = "rgba(255, 255, 255, 0.018)";
  context.fillRect(0, 0, width, height);

  drawDiscoveryBoundary(context, boundaryEdges);
}

function drawTiledFogTexture(
  context: CanvasRenderingContext2D,
  fogTexture: HTMLImageElement,
  width: number,
  height: number,
  textureOffset: FogTextureOffset,
  time: number,
  alpha: number,
  scale: number
) {
  const tileSize = 620 * scale;
  const offsetX =
    -tileSize +
    positiveModulo(textureOffset.x * FOG_MAP_PARALLAX + time * FOG_DRIFT_X, tileSize);
  const offsetY =
    -tileSize +
    positiveModulo(textureOffset.y * FOG_MAP_PARALLAX + time * FOG_DRIFT_Y, tileSize);

  context.save();
  context.globalCompositeOperation = "screen";
  context.globalAlpha = alpha;

  for (let x = offsetX; x < width + tileSize; x += tileSize) {
    for (let y = offsetY; y < height + tileSize; y += tileSize) {
      context.drawImage(fogTexture, x, y, tileSize, tileSize);
    }
  }

  context.restore();
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function drawDiscoveryBoundary(
  context: CanvasRenderingContext2D,
  boundaryEdges: FogBoundaryEdge[]
) {
  if (boundaryEdges.length === 0) {
    return;
  }

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowBlur = 18;
  context.shadowColor = "rgba(249, 115, 22, 0.9)";
  context.strokeStyle = "rgba(249, 115, 22, 0.72)";
  context.lineWidth = 5;
  context.beginPath();

  boundaryEdges.forEach((edge) => {
    context.moveTo(edge.from.x, edge.from.y);
    context.lineTo(edge.to.x, edge.to.y);
  });

  context.stroke();
  context.shadowBlur = 7;
  context.strokeStyle = "rgba(255, 186, 74, 0.95)";
  context.lineWidth = 2;
  context.stroke();
  context.restore();
}
