import type { MunicipalMail } from "../types/mail";

export const sampleMails: MunicipalMail[] = [
  { id: 1, sender: "Préfecture du Rhône", subject: "Dotation voirie 2026", preview: "Dossier de demande et calendrier de dépôt…", receivedAt: "Aujourd’hui, 09:42", status: "À traiter", commission: "Voirie", attachmentCount: 2 },
  { id: 2, sender: "Syndicat des eaux", subject: "Intervention route de Saint-Martin", preview: "Confirmation de l’intervention programmée…", receivedAt: "Hier, 16:18", status: "En cours", commission: "Travaux", attachmentCount: 1 },
  { id: 3, sender: "Association Les Amis du Village", subject: "Réservation de la salle des fêtes", preview: "Nous souhaitons réserver la salle pour…", receivedAt: "8 août, 11:05", status: "À traiter", commission: "Vie locale", attachmentCount: 0 },
  { id: 4, sender: "Trésorerie de L’Arbresle", subject: "État mensuel – juillet", preview: "Veuillez trouver ci-joint l’état mensuel…", receivedAt: "7 août, 14:32", status: "Classé", commission: "Finances", attachmentCount: 1 },
];
