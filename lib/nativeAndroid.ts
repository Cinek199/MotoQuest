import { Capacitor, registerPlugin } from "@capacitor/core";

export type NativeLocationPoint = {
  accuracy: number | null;
  bearing: number | null;
  lat: number;
  lon: number;
  speed: number | null;
  timestamp: number;
};

type MotoQuestNativePlugin = {
  drainLocations(): Promise<{ points: NativeLocationPoint[] }>;
  enterPictureInPicture(): Promise<void>;
  startBackgroundTracking(): Promise<void>;
  stopBackgroundTracking(): Promise<void>;
};

const MotoQuestNative = registerPlugin<MotoQuestNativePlugin>(
  "MotoQuestNative"
);

export function isNativeAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export async function startNativeBackgroundTracking() {
  if (!isNativeAndroid()) {
    return false;
  }

  await MotoQuestNative.startBackgroundTracking();
  return true;
}

export async function drainNativeLocations() {
  if (!isNativeAndroid()) {
    return [];
  }

  const result = await MotoQuestNative.drainLocations();
  return Array.isArray(result.points) ? result.points : [];
}

export async function enterNativePictureInPicture() {
  if (!isNativeAndroid()) {
    return false;
  }

  await MotoQuestNative.enterPictureInPicture();
  return true;
}
