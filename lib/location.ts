export async function getTownName(
  lat: number,
  lon: number
) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
    );

    const data = await response.json();

    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.municipality ||
      null
    );
  } catch {
    return null;
  }
}