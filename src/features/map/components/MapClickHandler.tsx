import {
  useMapEvents,
} from "react-leaflet";

import {
  reverseGeocode,
} from "../services/reverseGeocoding";

interface MapClickHandlerProps {
  onSelect: (
    latitude: number,
    longitude: number,
    location?: string,
  ) => void;
}

export default function MapClickHandler({
  onSelect,
}: MapClickHandlerProps) {
  useMapEvents({
    async click(event) {
      const latitude = event.latlng.lat;
      const longitude = event.latlng.lng;

      const result = await reverseGeocode(
        latitude,
        longitude,
      );

      onSelect(
        latitude,
        longitude,
        result?.road ??
          result?.displayName,
      );
    },
  });

  return null;
}