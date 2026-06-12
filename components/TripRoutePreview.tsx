"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { TripRoutePoint } from "../lib/trips";

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

type TripRoutePreviewProps = {
  className?: string;
  interactive?: boolean;
  route: TripRoutePoint[];
};

export default function TripRoutePreview({
  className = "h-44",
  interactive = false,
  route,
}: TripRoutePreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || route.length < 2) {
      return;
    }

    const coordinates = route.map((point) => [point.lon, point.lat]);

    const map = new maplibregl.Map({
      attributionControl: false,
      center: coordinates[0] as [number, number],
      container: containerRef.current,
      interactive,
      style: MAP_STYLE,
      zoom: 10,
    });

    map.on("load", () => {
      map.addSource("trip-route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates,
          },
          properties: {},
        },
      });

      map.addLayer({
        id: "trip-route-glow",
        type: "line",
        source: "trip-route",
        paint: {
          "line-blur": 3,
          "line-color": "#38bdf8",
          "line-opacity": 0.8,
          "line-width": 8,
        },
      });

      map.addLayer({
        id: "trip-route-line",
        type: "line",
        source: "trip-route",
        paint: {
          "line-color": "#0ea5e9",
          "line-width": 4,
        },
      });

      addPoint(map, "trip-start", coordinates[0], "#22c55e");
      addPoint(map, "trip-end", coordinates[coordinates.length - 1], "#ef4444");

      const bounds = coordinates.reduce(
        (currentBounds, coordinate) =>
          currentBounds.extend(coordinate as [number, number]),
        new maplibregl.LngLatBounds(
          coordinates[0] as [number, number],
          coordinates[0] as [number, number]
        )
      );

      map.fitBounds(bounds, {
        duration: 0,
        padding: 28,
      });
    });

    return () => {
      map.remove();
    };
  }, [route]);

  if (route.length < 2) {
    return (
      <div className="flex h-44 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950 text-sm text-zinc-500">
        Za mało punktów GPS, żeby narysować trasę
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-sky-400/40 bg-black/70 px-3 py-1 text-xs font-bold text-sky-300 backdrop-blur">
        Trasa GPS
      </div>
    </div>
  );
}

function addPoint(
  map: maplibregl.Map,
  id: string,
  coordinate: number[],
  color: string
) {
  map.addSource(id, {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: coordinate,
      },
      properties: {},
    },
  });

  map.addLayer({
    id,
    type: "circle",
    source: id,
    paint: {
      "circle-color": color,
      "circle-radius": 6,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  });
}
