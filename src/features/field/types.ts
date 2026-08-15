export type MissionStatus = "À faire" | "Prise en compte" | "En cours" | "Terminée" | "Annulée";
export type MissionPriority = "Basse" | "Normale" | "Haute" | "Urgente";
export interface FileAttachment { id: string; name: string; type: string; dataUrl: string; addedAt: string; kind: "photo" | "document"; phase?: "avant" | "après" | "problème"; }
export interface HistoryEntry { id: string; at: string; userId: string; label: string; }
export interface InterventionReport { agentId: string; completedAt: string; comment: string; outcome: "terminée" | "nouvelle-intervention"; photos: FileAttachment[]; }
export interface MissionProblem { id: string; agentId: string; createdAt: string; comment: string; photos: FileAttachment[]; }
export interface Mission { id: string; title: string; description: string; address: string; latitude?: number; longitude?: number; priority: MissionPriority; status: MissionStatus; dueDate: string; category: string; dossierId?: number; signalementId?: number; chantierId?: number; archivedAt?: string; assigneeIds: string[]; attachments: FileAttachment[]; reports: InterventionReport[]; problems?: MissionProblem[]; history: HistoryEntry[]; createdAt: string; updatedAt: string; }
export type AlertStatus = "Nouveau" | "Pris en compte" | "Transformé en mission" | "Classé";
export interface FieldAlert { id: string; category: "Voirie" | "Bâtiment" | "Espaces verts" | "Eau" | "Sécurité" | "Autre"; priority: MissionPriority; comment: string; address: string; latitude?: number; longitude?: number; photos: FileAttachment[]; status: AlertStatus; createdBy: string; createdAt: string; updatedAt: string; missionId?: string; dossierId?: number; }
export interface LocalNotification { id: string; userIds: string[]; title: string; message: string; link: string; createdAt: string; readBy: string[]; }
