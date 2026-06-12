export const TILE_SIZE = 0.005;

export function getTileId(
  lat: number,
  lon: number
) {
  const tileX = Math.floor(lon / TILE_SIZE);
  const tileY = Math.floor(lat / TILE_SIZE);

  return `${tileX}_${tileY}`;
}

export function getTileCoords(
  lat: number,
  lon: number
) {
  return {
    tileX: Math.floor(lon / TILE_SIZE),
    tileY: Math.floor(lat / TILE_SIZE),
  };
}

export function createTilePolygon(
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

export function getTileAreaKm2() {
  return 0.25;
}
