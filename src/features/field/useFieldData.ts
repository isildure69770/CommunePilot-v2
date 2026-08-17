import { useCallback, useEffect, useState } from "react";
import { alertRepository, makeId, missionRepository, notificationRepository } from "./repository";
import type { FieldAlert, FileAttachment, LocalNotification, Mission } from "./types";

type RemoteCollection = "missions" | "alerts";

async function uploadAttachment(attachment: FileAttachment) {
  if (!attachment.dataUrl.startsWith("data:")) return attachment;
  const response = await fetch("/api/field-files", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(attachment) });
  if (!response.ok) throw new Error(`Envoi du fichier impossible (${response.status}).`);
  const result = await response.json() as { dataUrl: string };
  return { ...attachment, dataUrl: result.dataUrl };
}

async function uploadFiles<T>(collection: RemoteCollection, values: T[]) {
  if (collection === "alerts") {
    const uploaded = await Promise.all((values as FieldAlert[]).map(async (alert) => ({ ...alert, photos: await Promise.all(alert.photos.map(uploadAttachment)) })));
    return uploaded as T[];
  }
  const uploaded = await Promise.all((values as Mission[]).map(async (mission) => ({ ...mission, attachments: await Promise.all(mission.attachments.map(uploadAttachment)), reports: await Promise.all(mission.reports.map(async (report) => ({ ...report, photos: await Promise.all(report.photos.map(uploadAttachment)) }))) })));
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
  const saveMissions = useCallback((values: typeof missions) => {
    missionRepository.save(values);
    void synchronize("missions", values).then(missionRepository.save).catch(() => undefined);
  }, []);
  const saveAlerts = useCallback((values: typeof alerts) => {
    try {
      alertRepository.save(values);
    } catch (error) {
      if (!(error instanceof DOMException) || !["QuotaExceededError", "NS_ERROR_DOM_QUOTA_REACHED"].includes(error.name)) throw error;
      const lightweight = values.map((alert) => ({ ...alert, photos: alert.photos.map((photo) => ({ ...photo, dataUrl: photo.dataUrl.startsWith("data:") ? (photo.thumbnailDataUrl || "") : photo.dataUrl })) }));
      alertRepository.save(lightweight);
    }
    void synchronize("alerts", values).then(alertRepository.save).catch(() => undefined);
  }, []);
  const notify = (value: Omit<LocalNotification, "id" | "createdAt" | "readBy">) => notificationRepository.save([{ ...value, id: makeId("notif"), createdAt: new Date().toISOString(), readBy: [] }, ...notificationRepository.list()]);
  return { missions, alerts, notifications, saveMissions, saveAlerts, notify };
}
