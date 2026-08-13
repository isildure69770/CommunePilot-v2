import type { CommuneUser } from "./types";

const KEY = "communepilot-local-users-v1";
export const seedUsers: CommuneUser[] = [
  { id: "u-maire", firstName: "Bernard", lastName: "Boulocher", role: "Maire", active: true, email: "maire@commune.local" },
  { id: "u-adjoint", firstName: "Claire", lastName: "Martin", role: "Adjoint", active: true },
  { id: "u-conseiller", firstName: "Louis", lastName: "Robert", role: "Conseiller", active: true },
  { id: "u-admin", firstName: "Sophie", lastName: "Durand", role: "Agent administratif", active: true },
  { id: "u-tech", firstName: "Jean", lastName: "Petit", role: "Agent technique", active: true, phone: "06 00 00 00 00" },
  { id: "u-tech-2", firstName: "Marc", lastName: "Morel", role: "Agent technique", active: true },
];

function load(): CommuneUser[] {
  try { const value = JSON.parse(localStorage.getItem(KEY) ?? "null"); return Array.isArray(value) ? value : seedUsers; } catch { return seedUsers; }
}
export const userRepository = {
  list: load,
  save(users: CommuneUser[]) { localStorage.setItem(KEY, JSON.stringify(users)); window.dispatchEvent(new Event("communepilot:users")); },
};
