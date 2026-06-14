import { getTileAreaKm2 } from "./tiles";

export const POLAND_AREA_KM2 = 312696;

export function getDiscoveredAreaKm2(tileCount: number) {
  return tileCount * getTileAreaKm2();
}

export function getPolandDiscoveryPercent(tileCount: number) {
  const percent = (getDiscoveredAreaKm2(tileCount) / POLAND_AREA_KM2) * 100;

  if (percent > 0 && percent < 0.01) {
    return 0.01;
  }

  return Math.min(100, percent);
}

export function formatDiscoveryPercent(tileCount: number) {
  const percent = getPolandDiscoveryPercent(tileCount);

  if (percent < 1) {
    return `${percent.toFixed(2)}%`;
  }

  return `${percent.toFixed(1)}%`;
}

export function formatDiscoveredArea(tileCount: number) {
  const area = getDiscoveredAreaKm2(tileCount);

  if (area < 10) {
    return `${area.toFixed(1)} km²`;
  }

  return `${Math.round(area)} km²`;
}
