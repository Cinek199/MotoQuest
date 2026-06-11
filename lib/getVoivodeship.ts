export async function getVoivodeship(
  lat: number,
  lon: number
) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );

    const data = await res.json();

    const voivodeship =
      data.address?.state ||
      "Nieznane";

    return voivodeship
      .split(" ")
      .map(
        (word: string) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");

  } catch {
    return "Nieznane";
  }
}