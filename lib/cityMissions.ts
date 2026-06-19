export type CityMission = {
  city_id: string;
  description: string;
  id: string;
  is_special: boolean;
  mission_type: "explore" | "motoshot" | "photo" | "poi" | "ride";
  motorcycle_required: boolean;
  photo_required: boolean;
  radius_m: number;
  slug: string;
  special_badge_id: string | null;
  target_name: string | null;
  title: string;
  xp: number;
};

export type MissionCity = {
  active_missions: number;
  completion_xp: number;
  id: string;
  name: string;
  required_missions: number;
  slug: string;
};

export type VerificationResult = {
  approved?: boolean;
  cityCompleted?: boolean;
  error?: string;
  reason?: string;
  specialBadgeUnlocked?: boolean;
};

export function getAccuratePosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 20000,
    });
  });
}

export async function prepareMissionPhoto(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Wybierz plik ze zdjeciem.");
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Zdjecie jest za duze. Maksymalnie 20 MB.");
  }

  if (!("createImageBitmap" in window)) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    return file;
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.86);
  });

  return blob ?? file;
}
