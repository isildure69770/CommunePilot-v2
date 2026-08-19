import type { LineStringGeometry } from "../types/customLayer";

export interface RoadRoutingRequest { points: Array<[number, number]>; profile: "driving" | "cycling" | "walking"; }
export interface RoadRoutingResult { geometry: LineStringGeometry; distanceMeters: number; }
export interface RoadRoutingProvider { name: string; route(request: RoadRoutingRequest): Promise<RoadRoutingResult>; }

const configuredEndpoint = import.meta.env.VITE_ROUTING_ENDPOINT?.trim();
const developmentEndpoint = "https://router.project-osrm.org";

export class OsrmRoutingProvider implements RoadRoutingProvider {
  name = "OSRM";
  private readonly endpoint: string;
  constructor(endpoint: string) { this.endpoint = endpoint; }

  async route({ points, profile }: RoadRoutingRequest): Promise<RoadRoutingResult> {
    if (points.length < 2) throw new Error("Choisissez au moins un départ et une arrivée.");
    const osrmProfile = profile === "driving" ? "driving" : profile === "cycling" ? "bike" : "foot";
    const coordinates = points.map(([latitude, longitude]) => `${longitude},${latitude}`).join(";");
    const response = await fetch(`${this.endpoint.replace(/\/$/, "")}/route/v1/${osrmProfile}/${coordinates}?overview=full&geometries=geojson&steps=false`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Le service de routage ne répond pas (${response.status}).`);
    const payload = await response.json() as { code?: string; message?: string; routes?: Array<{ distance: number; geometry: LineStringGeometry }> };
    const route = payload.routes?.[0];
    if (payload.code !== "Ok" || !route?.geometry || route.geometry.type !== "LineString") throw new Error(payload.message || "Aucun itinéraire n’a été trouvé entre ces points.");
    return { geometry: route.geometry, distanceMeters: route.distance };
  }
}

export const routingConfiguration: { provider: RoadRoutingProvider | null; message: string; isDevelopmentFallback: boolean } = configuredEndpoint
  ? { provider: new OsrmRoutingProvider(configuredEndpoint), message: "Routage automatique configuré.", isDevelopmentFallback: false }
  : import.meta.env.DEV
    ? { provider: new OsrmRoutingProvider(developmentEndpoint), message: "OSRM public est utilisé uniquement pour le développement. Configurez VITE_ROUTING_ENDPOINT vers un endpoint maîtrisé en production.", isDevelopmentFallback: true }
    : { provider: null, message: "Aucun moteur de routage n’est configuré. Configurez VITE_ROUTING_ENDPOINT vers un service OSRM maîtrisé.", isDevelopmentFallback: false };

export function routingErrorMessage(error: unknown): string {
  if (error instanceof TypeError) return "Le service de routage est indisponible ou bloqué par le réseau.";
  return error instanceof Error ? error.message : "Impossible de calculer l’itinéraire.";
}
