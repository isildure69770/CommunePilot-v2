import { useCallback, useEffect, useState } from "react";
import type { CommuneUser } from "./types";
import { userRepository } from "./userRepository";

const request = (input: RequestInfo | URL, init: RequestInit = {}) => fetch(input, { ...init, credentials: "same-origin" });
async function errorFor(response: Response) { const body = await response.json().catch(() => null) as { error?: string } | null; return new Error(body?.error || `Annuaire indisponible (${response.status}).`); }

export async function uploadDirectoryPhoto(file: File, id: string) {
  const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Lecture de la photo impossible.")); reader.readAsDataURL(file); });
  const thumbnailDataUrl = await new Promise<string>((resolve) => { const image = new Image(); image.onload = () => { const canvas = document.createElement("canvas"); canvas.width = 240; canvas.height = 240; const context = canvas.getContext("2d"); if (!context) return resolve(dataUrl); const scale = Math.max(240 / image.width, 240 / image.height); context.drawImage(image, (240 - image.width * scale) / 2, (240 - image.height * scale) / 2, image.width * scale, image.height * scale); resolve(canvas.toDataURL("image/jpeg", .82)); }; image.onerror = () => resolve(dataUrl); image.src = dataUrl; });
  const response = await request("/api/directory-photos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: file.name, type: file.type, dataUrl, thumbnailDataUrl }) });
  if (!response.ok) throw await errorFor(response);
  return response.json() as Promise<{ photoUrl: string; thumbnailUrl: string }>;
}

export function useDirectory() {
  const [users, setUsers] = useState(userRepository.list);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const response = await request("/api/users");
      if (!response.ok) throw await errorFor(response);
      const remote = (await response.json() as { users: CommuneUser[] }).users;
      let values = remote;
      if (!values.length) {
        const local = userRepository.list().filter((user) => user.id !== "current-user");
        if (local.length) {
          const migrated = await Promise.all(local.map(async (user) => { const result = await request(`/api/users/${encodeURIComponent(user.id)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(user) }); if (!result.ok) throw await errorFor(result); return (await result.json() as { user: CommuneUser }).user; }));
          values = migrated;
        } else values = userRepository.list();
      }
      userRepository.save(userRepository.lightweight(values)); setUsers(values); setError("");
    } catch (reason) { setUsers(userRepository.list()); setError(reason instanceof Error ? reason.message : "Annuaire hors ligne."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const save = useCallback(async (user: CommuneUser) => {
    const response = await request(`/api/users/${encodeURIComponent(user.id)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(user) });
    if (!response.ok) throw await errorFor(response);
    const saved = (await response.json() as { user: CommuneUser }).user;
    const values = [saved, ...users.filter((candidate) => candidate.id !== saved.id)];
    userRepository.save(userRepository.lightweight(values)); setUsers(values); return saved;
  }, [users]);
  return { users, loading, error, refresh, save };
}
