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

      <MapFogOverlay
        boundaryEdges={fogBoundaryEdges}
        revealTiles={fogRevealTiles}
        textureOffset={fogTextureOffset}
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
  const discoveredCoords = [...discoveredTileIds].map((tileId) =>
    tileId.split("_").map(Number)
  );
  const worldAnchor = map.project([0, 0]);

  setFogTextureOffset({
    x: worldAnchor.x,
    y: worldAnchor.y,
  });

  discoveredCoords.forEach(([tileX, tileY]) => {
    for (let xOffset = -2; xOffset <= 2; xOffset += 1) {
      for (let yOffset = -2; yOffset <= 2; yOffset += 1) {
        const distance = Math.max(Math.abs(xOffset), Math.abs(yOffset));
        const clearByDistance = [1, 0.36, 0.12];
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
}: {
  boundaryEdges: FogBoundaryEdge[];
  revealTiles: FogRevealTile[];
  textureOffset: FogTextureOffset;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fogTexture, setFogTexture] = useState<HTMLImageElement | null>(null);

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

    let animationFrame = 0;
    let lastPaint = 0;

    const paint = (time: number) => {
      if (time - lastPaint < 120) {
        animationFrame = window.requestAnimationFrame(paint);
        return;
      }

      lastPaint = time;
      drawFogCanvas(
        context,
        fogTexture,
        width,
        height,
        revealTiles,
        boundaryEdges,
        textureOffset,
        time
      );
      animationFrame = window.requestAnimationFrame(paint);
    };

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    animationFrame = window.requestAnimationFrame(paint);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [boundaryEdges, fogTexture, revealTiles, textureOffset]);

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
    time * 0.62 + 9000,
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
  const offsetX = -tileSize + positiveModulo(textureOffset.x + time * 0.006, tileSize);
  const offsetY = -tileSize + positiveModulo(textureOffset.y + time * 0.0035, tileSize);

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
