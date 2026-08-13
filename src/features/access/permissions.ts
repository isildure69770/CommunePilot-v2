import type { DomainPermissions, PermissionAction, PermissionDomain, UserRole } from "./types";

const none = (): DomainPermissions => ({ view: false, create: false, update: false, delete: false });
const read = (): DomainPermissions => ({ view: true, create: false, update: false, delete: false });
const edit = (): DomainPermissions => ({ view: true, create: true, update: true, delete: false });
const all = (): DomainPermissions => ({ view: true, create: true, update: true, delete: true });

export const permissionMatrix: Record<UserRole, Record<PermissionDomain, DomainPermissions>> = {
  Maire: Object.fromEntries(["dashboard","mails","dossiers","documents","equipements","missions","signalements","carte","calendrier","utilisateurs"].map((d) => [d, all()])) as Record<PermissionDomain, DomainPermissions>,
  Adjoint: { dashboard: read(), mails: edit(), dossiers: edit(), documents: edit(), equipements: edit(), missions: edit(), signalements: edit(), carte: edit(), calendrier: edit(), utilisateurs: read() },
  Conseiller: { dashboard: read(), mails: read(), dossiers: read(), documents: read(), equipements: read(), missions: read(), signalements: edit(), carte: read(), calendrier: read(), utilisateurs: none() },
  "Agent administratif": { dashboard: read(), mails: edit(), dossiers: edit(), documents: edit(), equipements: read(), missions: edit(), signalements: edit(), carte: edit(), calendrier: edit(), utilisateurs: none() },
  "Agent technique": { dashboard: none(), mails: none(), dossiers: none(), documents: none(), equipements: read(), missions: { view: true, create: false, update: true, delete: false }, signalements: { view: true, create: true, update: false, delete: false }, carte: read(), calendrier: read(), utilisateurs: none() },
};

export function can(role: UserRole, domain: PermissionDomain, action: PermissionAction = "view") {
  return permissionMatrix[role][domain][action];
}
