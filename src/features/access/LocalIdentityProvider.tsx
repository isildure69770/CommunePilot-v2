import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { can } from "./permissions";
import { seedUsers, userRepository } from "./userRepository";
import type { CommuneUser, PermissionAction, PermissionDomain } from "./types";

interface IdentityValue { user: CommuneUser; users: CommuneUser[]; setCurrentUser(id: string): void; refreshUsers(): void; can(domain: PermissionDomain, action?: PermissionAction): boolean; }
const IdentityContext = createContext<IdentityValue | null>(null);
const PROFILE_KEY = "communepilot-local-profile-v1";

export function LocalIdentityProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState(() => userRepository.list());
  const [currentId, setCurrentId] = useState(() => localStorage.getItem(PROFILE_KEY) ?? seedUsers[0].id);
  const refreshUsers = () => setUsers(userRepository.list());
  useEffect(() => { window.addEventListener("communepilot:users", refreshUsers); return () => window.removeEventListener("communepilot:users", refreshUsers); }, []);
  const user = users.find((item) => item.id === currentId && item.active) ?? users.find((item) => item.active) ?? seedUsers[0];
  const value = useMemo<IdentityValue>(() => ({ user, users, refreshUsers, setCurrentUser(id) { localStorage.setItem(PROFILE_KEY, id); setCurrentId(id); }, can: (domain, action = "view") => can(user.role, domain, action) }), [user, users]);
  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}
export function useIdentity() { const value = useContext(IdentityContext); if (!value) throw new Error("Identity provider absent"); return value; }
