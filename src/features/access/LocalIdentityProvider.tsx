import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { can } from "./permissions";
import { seedUsers, userRepository } from "./userRepository";
import type { CommuneUser, PermissionAction, PermissionDomain } from "./types";
import { communeRoleFromAzure, useAzureAuthentication } from "./useAzureAuthentication";

interface IdentityValue { user: CommuneUser; users: CommuneUser[]; setCurrentUser(id: string): void; refreshUsers(): void; can(domain: PermissionDomain, action?: PermissionAction): boolean; }
const IdentityContext = createContext<IdentityValue | null>(null);
const PROFILE_KEY = "communepilot-local-profile-v1";

export function LocalIdentityProvider({ children }: { children: React.ReactNode }) {
  const azureAuthentication = useAzureAuthentication();
  const [users, setUsers] = useState(() => userRepository.list());
  const [currentId, setCurrentId] = useState(() => localStorage.getItem(PROFILE_KEY) ?? seedUsers[0].id);
  const refreshUsers = () => setUsers(userRepository.list());
  useEffect(() => { window.addEventListener("communepilot:users", refreshUsers); return () => window.removeEventListener("communepilot:users", refreshUsers); }, []);
  const localUser = users.find((item) => item.id === currentId && item.active) ?? users.find((item) => item.active) ?? seedUsers[0];
  const azureUser = useMemo(() => azureAuthentication.status === "authenticated" ? azureIdentity(azureAuthentication.principal) : undefined, [azureAuthentication]);
  const user = azureUser ?? localUser;
  const availableUsers = useMemo(() => azureUser ? [azureUser, ...users.filter((item) => item.id !== azureUser.id)] : users, [azureUser, users]);
  const value = useMemo<IdentityValue>(() => ({ user, users: availableUsers, refreshUsers, setCurrentUser(id) { if (azureUser) return; localStorage.setItem(PROFILE_KEY, id); setCurrentId(id); }, can: (domain, action = "view") => can(user.role, domain, action) }), [azureUser, availableUsers, user]);
  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}
// oxlint-disable-next-line react/only-export-components -- Le hook partage volontairement le contexte privé de ce fournisseur.
export function useIdentity() { const value = useContext(IdentityContext); if (!value) throw new Error("Identity provider absent"); return value; }

function azureIdentity(principal: { userDetails: string; userId: string; userRoles: string[] }): CommuneUser {
  const label = principal.userDetails.split("@")[0].replace(/[._-]+/g, " ").trim() || "Utilisateur";
  const words = label.split(/\s+/);
  return {
    id: `azure-${principal.userId}`,
    firstName: words[0],
    lastName: words.slice(1).join(" ") || "Microsoft",
    email: principal.userDetails.includes("@") ? principal.userDetails : undefined,
    role: communeRoleFromAzure(principal.userRoles),
    active: true,
  };
}
