import type { CommuneUser, UserGroup, UserRole } from "./types";

const KEY = "communepilot-directory-cache-v2";
const LEGACY_KEY = "communepilot-local-users-v1";
const now = () => new Date().toISOString();
const groupForRole = (role: UserRole): UserGroup => role === "Maire" || role === "Adjoint" ? "Maire et adjoints" : role === "Conseiller" ? "Conseillers municipaux" : role === "Agent administratif" ? "Agents administratifs" : "Agents techniques";

export const sessionUser: CommuneUser = { id: "current-user", firstName: "Utilisateur", lastName: "CommunePilot", role: "Maire", group: "Maire et adjoints", jobTitle: "Compte connecté", active: true, addressVisibility: "administrators", commissionIds: [], createdAt: now(), updatedAt: now() };

function normalize(value: Partial<CommuneUser> & Pick<CommuneUser, "id" | "firstName" | "lastName" | "role">): CommuneUser {
  const timestamp = now();
  return { ...value, group: value.group ?? groupForRole(value.role), jobTitle: value.jobTitle ?? value.role, active: value.active !== false, addressVisibility: value.addressVisibility ?? "administrators", commissionIds: Array.isArray(value.commissionIds) ? value.commissionIds : [], createdAt: value.createdAt ?? timestamp, updatedAt: value.updatedAt ?? timestamp };
}

function parse(key: string): CommuneUser[] {
  try { const values = JSON.parse(localStorage.getItem(key) ?? "[]"); return Array.isArray(values) ? values.map(normalize) : []; } catch { return []; }
}

function load(): CommuneUser[] {
  const cached = parse(KEY);
  if (cached.length) return cached;
  const legacy = parse(LEGACY_KEY);
  if (legacy.length) { localStorage.setItem(KEY, JSON.stringify(legacy)); return legacy; }
  return [sessionUser];
}

export const userRepository = {
  list: load,
  save(users: CommuneUser[]) { localStorage.setItem(KEY, JSON.stringify(users)); window.dispatchEvent(new Event("communepilot:users")); },
  lightweight(users: CommuneUser[]) { return users.map((user) => ({ ...user, photoUrl: user.photoUrl?.startsWith("data:") ? undefined : user.photoUrl, thumbnailUrl: user.thumbnailUrl?.startsWith("data:") ? undefined : user.thumbnailUrl })); },
};
