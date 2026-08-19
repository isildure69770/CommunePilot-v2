const BOUNDARY_URL = "/data/montrottier/boundary.geojson";

type Position = [number, number];
type BoundaryGeometry = { type: "Polygon" | "MultiPolygon"; coordinates: Position[][] | Position[][][] };

let boundaryPromise: Promise<BoundaryGeometry | null> | null = null;

function loadBoundary() {
  if (!boundaryPromise) {
    boundaryPromise = fetch(BOUNDARY_URL)
      .then(async (response) => response.ok ? (await response.json() as { geometry?: BoundaryGeometry }).geometry ?? null : null)
      .catch(() => null);
  }
  return boundaryPromise;
}

function pointInRing(longitude: number, latitude: number, ring: Position[]) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [x, y] = ring[index];
    const [previousX, previousY] = ring[previous];
    if ((y > latitude) !== (previousY > latitude) && longitude < ((previousX - x) * (latitude - y)) / (previousY - y) + x) inside = !inside;
  }
  return inside;
}

function pointInPolygon(longitude: number, latitude: number, polygon: Position[][]) {
  return pointInRing(longitude, latitude, polygon[0]) && !polygon.slice(1).some((hole) => pointInRing(longitude, latitude, hole));
}

export async function isInMontrottier(latitude: number, longitude: number) {
  const geometry = await loadBoundary();
  if (!geometry) return null;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates as Position[][]] : geometry.coordinates as Position[][][];
  return polygons.some((polygon) => pointInPolygon(longitude, latitude, polygon));
}

export function isMontrottierAddress(address: Record<string, string | undefined>) {
  const locality = address.village || address.town || address.city || address.municipality || address.city_district || "";
  return locality.toLocaleLowerCase("fr-FR") === "montrottier" && address.postcode === "69770";
}

export function formatMontrottierAddress(address: Record<string, string | undefined>) {
  const street = address.road || address.pedestrian || address.residential || address.path || address.hamlet || address.locality || "";
  const line = [address.house_number, street].filter(Boolean).join(" ").trim();
  return [line, "Montrottier"].filter(Boolean).join(", ");
}
