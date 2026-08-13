export const roles = ["Maire", "Adjoint", "Conseiller", "Agent administratif", "Agent technique"] as const;
export type UserRole = (typeof roles)[number];
export const domains = ["dashboard", "mails", "dossiers", "documents", "equipements", "missions", "signalements", "carte", "calendrier", "utilisateurs"] as const;
export type PermissionDomain = (typeof domains)[number];
export type PermissionAction = "view" | "create" | "update" | "delete";
export type DomainPermissions = Record<PermissionAction, boolean>;

export interface CommuneUser {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  active: boolean;
  email?: string;
  phone?: string;
}
