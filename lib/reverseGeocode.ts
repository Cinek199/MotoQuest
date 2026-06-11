let lastTown = "";
let lastLookup = 0;

export async function getTownName(
  lat: number,
  lon: number
) {
  const now = Date.now();

  if (
    lastTown &&
    now - lastLookup < 30000
  ) {
    return lastTown;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      {
        headers: {
          "Accept-Language": "pl",
        },
      }
    );

    if (!response.ok) {
      return lastTown || "Nieznana";
    }

    const data = await response.json();

    const town =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.municipality ||
      "Nieznana";

    lastTown = town;
    lastLookup = now;

    return town;
  } catch {
    return lastTown || "Nieznana";
  }
}