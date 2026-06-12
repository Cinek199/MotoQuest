import { getJson, setJson, STORAGE_KEYS } from "./storage";

export type Bike = {
  brand: string;
  engine: string;
  id: string;
  imageUrl: string;
  model: string;
  totalDistanceKm: number;
  year: string;
};

type LegacyBike = Partial<Bike> & {
  brand?: string;
  engine?: string;
  model?: string;
  year?: string;
};

export function getGarage() {
  const bikes = getJson<LegacyBike[]>(STORAGE_KEYS.garage, []).map(
    normalizeBike
  );

  setJson(STORAGE_KEYS.garage, bikes);

  return bikes;
}

export function saveGarage(bikes: Bike[]) {
  setJson(STORAGE_KEYS.garage, bikes);
}

export function createBike(input: {
  brand: string;
  engine: string;
  imageUrl: string;
  model: string;
  totalDistanceKm: number;
  year: string;
}) {
  return {
    ...input,
    id: createId(),
  };
}

export function getActiveBikeId() {
  return localStorage.getItem(STORAGE_KEYS.activeBikeId);
}

export function setActiveBikeId(id: string) {
  localStorage.setItem(STORAGE_KEYS.activeBikeId, id);
}

export function getActiveBike() {
  const garage = getGarage();
  const activeBikeId = getActiveBikeId();

  return garage.find((bike) => bike.id === activeBikeId) || garage[0] || null;
}

export function addDistanceToActiveBike(distanceKm: number) {
  if (distanceKm <= 0) {
    return;
  }

  const garage = getGarage();
  const activeBike = getActiveBike();

  if (!activeBike) {
    return;
  }

  const nextGarage = garage.map((bike) =>
    bike.id === activeBike.id
      ? {
          ...bike,
          totalDistanceKm: bike.totalDistanceKm + distanceKm,
        }
      : bike
  );

  saveGarage(nextGarage);
}

function normalizeBike(bike: LegacyBike): Bike {
  return {
    brand: bike.brand || "",
    engine: bike.engine || "",
    id: bike.id || createId(),
    imageUrl: bike.imageUrl || "",
    model: bike.model || "",
    totalDistanceKm: Number(bike.totalDistanceKm || 0),
    year: bike.year || "",
  };
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
