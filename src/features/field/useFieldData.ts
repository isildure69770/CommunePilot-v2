import { useCallback, useEffect, useState } from "react";
import { alertRepository, makeId, missionRepository, notificationRepository } from "./repository";
import type { FieldAlert, FileAttachment, LocalNotification, Mission } from "./types";

type RemoteCollection = "missions" | "alerts";

async function uploadAttachment(attachment: FileAttachment) {
  if (!attachment.dataUrl.startsWith("data:")) return attachment;
  const response = await fetch("/api/field-files", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(attachment) });
  if (!response.ok) {
    const details = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(details?.error || `Envoi de « ${attachment.name} » impossible (${response.status}).`);
  }
  const result = await response.json() as { dataUrl: string };
  let thumbnailDataUrl = attachment.thumbnailDataUrl;
  if (thumbnailDataUrl?.startsWith("data:")) {
    const thumbnailResponse = await fetch("/api/field-files", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...attachment, id: `${attachment.id}-thumb`, name: `aperçu-${attachment.name}`, dataUrl: thumbnailDataUrl }) });
    if (!thumbnailResponse.ok) throw new Error(`Création de l’aperçu de « ${attachment.name} » impossible.`);
    thumbnailDataUrl = ((await thumbnailResponse.json()) as { dataUrl: string }).dataUrl;
  }
  return { ...attachment, dataUrl: result.dataUrl, thumbnailDataUrl };
}

async function uploadFiles<T>(collection: RemoteCollection, values: T[]) {
  if (collection === "alerts") {
    const uploaded = await Promise.all((values as FieldAlert[]).map(async (alert) => ({ ...alert, photos: await Promise.all((alert.photos || []).map(uploadAttachment)) })));
    return uploaded as T[];
  }
  const uploaded = await Promise.all((values as Mission[]).map(async (mission) => ({ ...mission, attachments: await Promise.all(mission.attachments.map(uploadAttachment)), reports: await Promise.all(mission.reports.map(async (report) => ({ ...report, photos: await Promise.all(report.photos.map(uploadAttachment)) }))), problems: await Promise.all((mission.problems ?? []).map(async (problem) => ({ ...problem, photos: await Promise.all(problem.photos.map(uploadAttachment)) }))) })));
  return uploaded as T[];
}

function latest<T extends { id: string; updatedAt?: string; createdAt: string }>(local: T[], remote: T[]) {
  const values = new Map(local.map((item) => [item.id, item]));
  for (const item of remote) {
    const current = values.get(item.id);
    if (!current || (item.updatedAt || item.createdAt) > (current.updatedAt || current.createdAt)) values.set(item.id, item);
  }
  return [...values.values()].sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
}

async function synchronize<T extends { id: string; updatedAt?: string; createdAt: string }>(collection: RemoteCollection, local: T[]) {
  const endpoint = collection === "alerts" ? "field-alerts" : collection;
  const uploaded = await uploadFiles(collection, local);
  const response = await fetch(`/api/${endpoint}`);
  if (!response.ok) throw new Error(`Synchronisation ${collection} indisponible (${response.status}).`);
  const remote = (await response.json() as Record<RemoteCollection, T[]>)[collection] ?? [];
  const merged = latest(uploaded, remote);
  const saved = await fetch(`/api/${endpoint}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [collection]: merged }) });
  if (!saved.ok) throw new Error(`Enregistrement ${collection} impossible (${saved.status}).`);
  return (await saved.json() as Record<RemoteCollection, T[]>)[collection] ?? merged;
}

function lightweightAttachment(attachment: FileAttachment): FileAttachment {
  return { ...attachment, dataUrl: attachment.dataUrl.startsWith("data:") ? "" : attachment.dataUrl };
}

function lightweightMissions(values: Mission[]) {
  return values.map((mission) => ({ ...mission, attachments: mission.attachments.map(lightweightAttachment), reports: mission.reports.map((report) => ({ ...report, photos: report.photos.map(lightweightAttachment) })), problems: mission.problems?.map((problem) => ({ ...problem, photos: problem.photos.map(lightweightAttachment) })) }));
}

function lightweightAlerts(values: FieldAlert[]) {
  return values.map((alert) => ({ ...alert, photos: (alert.photos || []).map(lightweightAttachment) }));
}

export function useFieldData() {
  const [missions, setMissions] = useState(missionRepository.list);
  const [alerts, setAlerts] = useState(alertRepository.list);
  const [notifications, setNotifications] = useState(notificationRepository.list);
  const refresh = useCallback(() => { setMissions(missionRepository.list()); setAlerts(alertRepository.list()); setNotifications(notificationRepository.list()); }, []);
  useEffect(() => { const clean = [missionRepository.subscribe(refresh), alertRepository.subscribe(refresh), notificationRepository.subscribe(refresh)]; return () => clean.forEach((fn) => fn()); }, [refresh]);
  useEffect(() => {
    let active = true;
    void synchronize("missions", missionRepository.list()).then((values) => { if (active) missionRepository.save(values); }).catch(() => undefined);
    void synchronize("alerts", alertRepository.list()).then((values) => { if (active) alertRepository.save(values); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const saveMissions = useCallback(async (values: Mission[]) => {
    const uploaded = await uploadFiles("missions", values);
    const saved = await synchronize("missions", uploaded);
    const lightweight = lightweightMissions(saved);
    missionRepository.save(lightweight);
    setMissions(lightweight);
    return lightweight;
  }, []);
  const saveAlerts = useCallback(async (values: FieldAlert[]) => {
    const uploaded = await uploadFiles("alerts", values);
    const saved = await synchronize("alerts", uploaded);
    const lightweight = lightweightAlerts(saved);
    alertRepository.save(lightweight);
    setAlerts(lightweight);
    return lightweight;
  }, []);
  const notify = (value: Omit<LocalNotification, "id" | "createdAt" | "readBy">) => notificationRepository.save([{ ...value, id: makeId("notif"), createdAt: new Date().toISOString(), readBy: [] }, ...notificationRepository.list()]);
  return { missions, alerts, notifications, saveMissions, saveAlerts, notify };
}
