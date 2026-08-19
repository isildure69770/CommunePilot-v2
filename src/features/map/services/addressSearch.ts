import { formatMontrottierAddress, isInMontrottier, isMontrottierAddress } from "./montrottier";

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
      `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=fr&bounded=1&viewbox=4.420,45.845,4.510,45.755&q=${encodeURIComponent(`${value}, 69770 Montrottier, France`)}`,
      { headers: { "Accept-Language": "fr" }, signal },
    );
    if (!response.ok) return [];
    const data = await response.json() as Array<{ place_id: number; lat: string; lon: string; address?: Record<string, string | undefined> }>;
    const candidates = await Promise.all(data.map(async (item) => {
      const latitude = Number(item.lat);
      const longitude = Number(item.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !item.address || !isMontrottierAddress(item.address)) return null;
      if (await isInMontrottier(latitude, longitude) === false) return null;
      return { id: String(item.place_id), label: formatMontrottierAddress(item.address), latitude, longitude };
    }));
    return candidates.filter((item): item is AddressSuggestion => Boolean(item?.label)).slice(0, 5);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return [];
    return [];
  }
}
