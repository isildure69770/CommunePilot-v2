import { useCallback, useEffect, useState } from "react";
import { alertRepository, makeId, missionRepository, notificationRepository } from "./repository";
import type { LocalNotification } from "./types";

export function useFieldData() {
  const [missions, setMissions] = useState(missionRepository.list);
  const [alerts, setAlerts] = useState(alertRepository.list);
  const [notifications, setNotifications] = useState(notificationRepository.list);
  const [alertSync, setAlertSync] = useState(alertRepository.getSyncState);
  const refresh = useCallback(() => { setMissions(missionRepository.list()); setAlerts(alertRepository.list()); setNotifications(notificationRepository.list()); }, []);
  useEffect(() => { const refreshSync = () => setAlertSync(alertRepository.getSyncState()); const clean = [missionRepository.subscribe(refresh), alertRepository.subscribe(refresh), alertRepository.subscribeSync(refreshSync), notificationRepository.subscribe(refresh)]; void alertRepository.synchronize(); return () => clean.forEach((fn) => fn()); }, [refresh]);
  const notify = (value: Omit<LocalNotification, "id" | "createdAt" | "readBy">) => notificationRepository.save([{ ...value, id: makeId("notif"), createdAt: new Date().toISOString(), readBy: [] }, ...notificationRepository.list()]);
  return { missions, alerts, notifications, saveMissions: missionRepository.save, saveAlerts: alertRepository.save, alertSync, synchronizeAlerts: alertRepository.synchronize, notify };
}
