import type {
  GeographicPosition,
  ReverseGeocodeResult,
} from "../types/geography";

export async function reverseGeocode(
  position: GeographicPosition,
): Promise<ReverseGeocodeResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.latitude}&lon=${position.longitude}`,
      {
        headers: {
          "Accept-Language": "fr",
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return {
      road:
        data.address?.road ??
        data.address?.pedestrian ??
        data.address?.path ??
        "",

      city:
        data.address?.village ??
        data.address?.town ??
        data.address?.city ??
        "",

      postcode:
        data.address?.postcode ?? "",

      department:
        data.address?.county ?? "",

      country:
        data.address?.country ?? "",

      displayName:
        data.display_name ?? "",
    };
  } catch {
    return null;
  }
}