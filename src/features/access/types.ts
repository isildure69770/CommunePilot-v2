export const roles = ["Maire", "Adjoint", "Conseiller", "Agent administratif", "Agent technique"] as const;
export type UserRole = (typeof roles)[number];
export const userGroups = ["Maire et adjoints", "Conseillers municipaux", "Agents administratifs", "Agents techniques"] as const;
export type UserGroup = (typeof userGroups)[number];
export const domains = ["dashboard", "mails", "dossiers", "documents", "equipements", "missions", "signalements", "carte", "calendrier", "utilisateurs"] as const;
export type PermissionDomain = (typeof domains)[number];
export type PermissionAction = "view" | "create" | "update" | "delete";
export type DomainPermissions = Record<PermissionAction, boolean>;

export interface CommuneUser {
  id: string;
  firstName: string;
  lastName: string;
  /** Rôle applicatif, volontairement indépendant du groupe métier. */
  role: UserRole;
  group: UserGroup;
  jobTitle: string;
  active: boolean;
  email?: string;
  phone?: string;
  address?: string;
  addressVisibility: "administrators" | "directory";
  commissionIds: string[];
  notes?: string;
  photoUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}
