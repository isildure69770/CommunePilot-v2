export interface AddressSuggestion {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

export async function searchAddresses(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const value = query.trim();
  if (value.length < 3) return [];
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=fr&q=${encodeURIComponent(value)}`,
      { headers: { "Accept-Language": "fr" }, signal },
    );
    if (!response.ok) return [];
    const data = await response.json() as Array<{ place_id: number; display_name: string; lat: string; lon: string }>;
    return data.flatMap((item) => {
      const latitude = Number(item.lat);
      const longitude = Number(item.lon);
      return Number.isFinite(latitude) && Number.isFinite(longitude)
        ? [{ id: String(item.place_id), label: item.display_name, latitude, longitude }]
        : [];
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return [];
    return [];
  }
}
