import { useCallback, useEffect, useState } from "react";
import { alertRepository, makeId, missionRepository, notificationRepository } from "./repository";
import type { LocalNotification } from "./types";

export function useFieldData() {
  const [missions, setMissions] = useState(missionRepository.list);
  const [alerts, setAlerts] = useState(alertRepository.list);
  const [notifications, setNotifications] = useState(notificationRepository.list);
  const refresh = useCallback(() => { setMissions(missionRepository.list()); setAlerts(alertRepository.list()); setNotifications(notificationRepository.list()); }, []);
  useEffect(() => { const clean = [missionRepository.subscribe(refresh), alertRepository.subscribe(refresh), notificationRepository.subscribe(refresh)]; return () => clean.forEach((fn) => fn()); }, [refresh]);
  const notify = (value: Omit<LocalNotification, "id" | "createdAt" | "readBy">) => notificationRepository.save([{ ...value, id: makeId("notif"), createdAt: new Date().toISOString(), readBy: [] }, ...notificationRepository.list()]);
  return { missions, alerts, notifications, saveMissions: missionRepository.save, saveAlerts: alertRepository.save, notify };
}
