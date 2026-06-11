export const TILE_SIZE = 0.005;

export function getTileId(
  lat: number,
  lon: number
) {
  const tileX = Math.floor(lon / TILE_SIZE);
  const tileY = Math.floor(lat / TILE_SIZE);

  return `${tileX}_${tileY}`;
}

export function getTileAreaKm2() {
  return 0.25;
}