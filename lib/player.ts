export interface PlayerStats {
  tiles: number;
  xp: number;
  level: number;
}

export function calculateLevel(xp: number) {
  return Math.floor(xp / 1000) + 1;
}

export function getPlayerStats(): PlayerStats {
  const tiles = JSON.parse(
    localStorage.getItem("mq_tiles") || "[]"
  ).length;

  const xp = tiles * 25;

  return {
    tiles,
    xp,
    level: calculateLevel(xp),
  };
}
