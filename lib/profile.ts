import { getJson, setJson, STORAGE_KEYS } from "./storage";

export type PlayerProfile = {
  avatarUrl: string;
  nickname: string;
};

const DEFAULT_PROFILE: PlayerProfile = {
  avatarUrl: "",
  nickname: "MotoManiak",
};

export function getProfile() {
  return getJson<PlayerProfile>(STORAGE_KEYS.profile, DEFAULT_PROFILE);
}

export function saveProfile(profile: PlayerProfile) {
  setJson(STORAGE_KEYS.profile, {
    avatarUrl: profile.avatarUrl.trim(),
    nickname: profile.nickname.trim() || DEFAULT_PROFILE.nickname,
  });
}
