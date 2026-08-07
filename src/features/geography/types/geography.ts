export interface GeographicPosition {
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodeResult {
  road: string;
  city: string;
  postcode: string;
  department?: string;
  country?: string;
  displayName: string;
}

export interface CommuneSector {
  id: string;
  name: string;
  color: string;
}