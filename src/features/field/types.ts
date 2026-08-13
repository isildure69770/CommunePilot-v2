export type MissionStatus = "À faire" | "En cours" | "Terminée" | "Annulée";
export type MissionPriority = "Basse" | "Normale" | "Haute" | "Urgente";
export interface FileAttachment { id: string; name: string; type: string; dataUrl: string; addedAt: string; kind: "photo" | "document"; phase?: "avant" | "après"; }
export interface HistoryEntry { id: string; at: string; userId: string; label: string; }
export interface InterventionReport { agentId: string; completedAt: string; comment: string; outcome: "terminée" | "nouvelle-intervention"; photos: FileAttachment[]; }
export interface Mission { id: string; title: string; description: string; address: string; latitude?: number; longitude?: number; priority: MissionPriority; status: MissionStatus; dueDate: string; category: string; dossierId?: number; assigneeIds: string[]; attachments: FileAttachment[]; reports: InterventionReport[]; history: HistoryEntry[]; createdAt: string; updatedAt: string; }
export type AlertStatus = "Nouveau" | "Pris en compte" | "Transformé en mission" | "Classé";
export interface FieldAlert { id: string; category: "Voirie" | "Bâtiment" | "Espaces verts" | "Eau" | "Sécurité" | "Autre"; comment: string; address: string; latitude?: number; longitude?: number; photos: FileAttachment[]; status: AlertStatus; createdBy: string; createdAt: string; missionId?: string; dossierId?: number; }
export interface LocalNotification { id: string; userIds: string[]; title: string; message: string; link: string; createdAt: string; readBy: string[]; }
