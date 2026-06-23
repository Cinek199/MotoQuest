const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const sourceApk = path.join(
  repoRoot,
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  "debug",
  "app-debug.apk"
);
const downloadsDir = path.join(repoRoot, "public", "downloads");
const targetApk = path.join(downloadsDir, "motoquest-android-latest.apk");
const targetMeta = path.join(downloadsDir, "motoquest-android-latest.json");
const buildGradlePath = path.join(repoRoot, "android", "app", "build.gradle");

if (!fs.existsSync(sourceApk)) {
  console.error(`Brak APK do publikacji: ${sourceApk}`);
  process.exit(1);
}

if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

fs.copyFileSync(sourceApk, targetApk);

const buildGradle = fs.readFileSync(buildGradlePath, "utf8");
const versionNameMatch = buildGradle.match(/versionName\s+"([^"]+)"/);
const versionCodeMatch = buildGradle.match(/versionCode\s+(\d+)/);
const apkStats = fs.statSync(targetApk);

const metadata = {
  file: "/downloads/motoquest-android-latest.apk",
  fileName: "motoquest-android-latest.apk",
  sizeBytes: apkStats.size,
  updatedAt: new Date().toISOString(),
  versionCode: versionCodeMatch ? Number(versionCodeMatch[1]) : null,
  versionName: versionNameMatch ? versionNameMatch[1] : null,
};

fs.writeFileSync(targetMeta, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
console.log(`Opublikowano APK: ${targetApk}`);