"use client";

import type { TripRoutePoint } from "../lib/trips";

type TripRoutePreviewProps = {
  className?: string;
  interactive?: boolean;
  route: TripRoutePoint[];
};

type PreviewPoint = {
  x: number;
  y: number;
};

export default function TripRoutePreview({
  className = "h-44",
  route,
}: TripRoutePreviewProps) {
  const points = createPreviewPoints(route);
  const path = points.map((point) => `${point.x},${point.y}`).join(" ");
  const start = points[0];
  const end = points[points.length - 1];

  if (route.length < 2 || points.length < 2) {
    return (
      <div className="flex h-44 items-center justify-center rounded-2xl border border-white/10 bg-black/40 px-4 text-center text-sm font-bold text-zinc-500">
        Za malo punktow GPS, zeby narysowac trase
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1f2937_0,transparent_35%),linear-gradient(135deg,#020617,#09090b)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:24px_24px]" />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="Podglad trasy GPS"
      >
        <polyline
          points={path}
          fill="none"
          stroke="#38bdf8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.2"
          strokeWidth="9"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={path}
          fill="none"
          stroke="#0ea5e9"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={start.x}
          cy={start.y}
          fill="#22c55e"
          r="2.4"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={end.x}
          cy={end.y}
          fill="#ef4444"
          r="2.4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-sky-400/40 bg-black/70 px-3 py-1 text-xs font-bold text-sky-300 backdrop-blur">
        Trasa GPS
      </div>
    </div>
  );
}

function createPreviewPoints(route: TripRoutePoint[]): PreviewPoint[] {
  const validRoute = route.filter((point) => {
    return Number.isFinite(point.lat) && Number.isFinite(point.lon);
  });

  if (validRoute.length < 2) {
    return [];
  }

  const lats = validRoute.map((point) => point.lat);
  const lons = validRoute.map((point) => point.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latRange = maxLat - minLat || 0.0001;
  const lonRange = maxLon - minLon || 0.0001;
  const padding = 10;
  const size = 100 - padding * 2;

  return validRoute.map((point) => {
    return {
      x: padding + ((point.lon - minLon) / lonRange) * size,
      y: padding + (1 - (point.lat - minLat) / latRange) * size,
    };
  });
}
