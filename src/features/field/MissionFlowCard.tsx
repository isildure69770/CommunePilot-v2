import { ChevronRight, Image, MapPin } from "lucide-react";
import type { CommuneUser } from "../access/types";
import type { FileAttachment, Mission } from "./types";

export function missionPhotos(mission: Mission): FileAttachment[] {
  return [
    ...mission.attachments.filter((file) => file.kind === "photo"),
    ...mission.reports.flatMap((report) => report.photos),
  ];
}

export function missionCompletion(mission: Mission, users: CommuneUser[]) {
  const report = [...mission.reports].sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
  const history = [...mission.history].reverse().find((entry) => entry.label.toLocaleLowerCase("fr").includes("termin"));
  const agentId = report?.agentId || history?.userId;
  const agent = users.find((candidate) => candidate.id === agentId);
  return {
    agentName: agent ? `${agent.firstName} ${agent.lastName}` : "un agent technique",
    completedAt: report?.completedAt || history?.at || mission.updatedAt,
  };
}

function mapPreviewUrl(mission: Mission) {
  if (mission.latitude == null || mission.longitude == null) return undefined;
  const lat = mission.latitude.toFixed(6);
  const lon = mission.longitude.toFixed(6);
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=15&size=360x180&maptype=mapnik&markers=${lat},${lon},red-pushpin`;
}

export default function MissionFlowCard({ mission, users, onOpen, sharedCompletion = false }: { mission: Mission; users: CommuneUser[]; onOpen(): void; sharedCompletion?: boolean }) {
  const photos = missionPhotos(mission);
  const mapUrl = mapPreviewUrl(mission);
  const completed = mission.status === "Terminée" ? missionCompletion(mission, users) : undefined;
  return <article className={`mission-flow-card${completed ? " is-completed" : ""}`}>
    <button className="mission-flow-card-main" type="button" onClick={onOpen} aria-label={`Ouvrir la mission ${mission.title}`}>
      <span className={`mission-flow-priority priority-${mission.priority.toLowerCase()}`}>{mission.priority}</span>
      {completed && <span className="mission-completed-stamp">TERMINÉE</span>}
      <span className="mission-flow-visuals">
        <span className="mission-flow-photo">{photos[0] ? <img src={photos[0].thumbnailDataUrl || photos[0].dataUrl} alt=""/> : <span><Image/><small>Sans photo</small></span>}</span>
        <span className="mission-flow-map" aria-label="Aperçu non interactif du lieu">{mapUrl ? <img src={mapUrl} alt="" loading="lazy"/> : <span><MapPin/><small>Lieu à préciser</small></span>}<i><MapPin/></i></span>
      </span>
      <span className="mission-flow-copy"><strong>{mission.title}</strong><span><MapPin/>{mission.address || "Adresse à préciser"}</span><small>{mission.status} · {mission.category || "Intervention"}</small></span>
      {completed && <span className="mission-flow-completion">Terminée par {completed.agentName} · {new Date(completed.completedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}{sharedCompletion ? " · Historique partagé" : ""}</span>}
      <ChevronRight className="mission-flow-chevron"/>
    </button>
  </article>;
}
