import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "pl.motoquest.app",
  appName: "MotoQuest",
  webDir: "www",
  server: {
    androidScheme: "https",
    cleartext: false,
    url: "https://motoquest.vercel.app",
  },
};

export default config;
