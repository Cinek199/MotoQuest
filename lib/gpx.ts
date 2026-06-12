import type { FinishedTrip, TripRoutePoint } from "./trips";

export function buildGpx(trip: FinishedTrip) {
  const points = trip.route.map(formatTrackPoint).join("\n");
  const name = escapeXml(trip.name);

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MotoQuest" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${name}</name>
    <time>${new Date(trip.startedAt).toISOString()}</time>
  </metadata>
  <trk>
    <name>${name}</name>
    <trkseg>
${points}
    </trkseg>
  </trk>
</gpx>
`;
}

export function downloadTripGpx(trip: FinishedTrip) {
  const gpx = buildGpx(trip);
  const blob = new Blob([gpx], {
    type: "application/gpx+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${slugify(trip.name)}.gpx`;
  link.click();

  URL.revokeObjectURL(url);
}

function formatTrackPoint(point: TripRoutePoint) {
  const time = new Date(point.timestamp).toISOString();
  const speed = point.speedKmh === null ? "" : `\n        <speed>${point.speedKmh.toFixed(2)}</speed>`;

  return `      <trkpt lat="${point.lat}" lon="${point.lon}">
        <time>${time}</time>${speed}
      </trkpt>`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9ąćęłńóśźż]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "motoquest-trasa"
  );
}
