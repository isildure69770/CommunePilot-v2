export interface ReverseGeocodingResult {
  road: string;
  city: string;
  postcode: string;
  displayName: string;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodingResult | null> {
  try {
    const url =
      "https://nominatim.openstreetmap.org/reverse" +
      `?format=jsonv2&lat=${latitude}&lon=${longitude}`;

    const response = await fetch(url, {
      headers: {
        "Accept-Language": "fr",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    const address = data.address ?? {};

    const road =
      address.road ||
      address.pedestrian ||
      address.path ||
      address.residential ||
      address.hamlet ||
      "";

    const city =
      address.village ||
      address.town ||
      address.city ||
      address.municipality ||
      "";

    const postcode =
      address.postcode || "";

    return {
      road,
      city,
      postcode,
      displayName:
        data.display_name || "",
    };
  } catch {
    return null;
  }
}