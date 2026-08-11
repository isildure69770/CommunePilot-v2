import type { MunicipalMail } from "../types/mail";

export const sampleMails: MunicipalMail[] = [
  {
    id: 1,
    sender: "Préfecture du Rhône",
    senderEmail: "prefecture@rhone.gouv.fr",
    subject: "Dotation voirie 2026",
    preview: "Dossier de demande et calendrier de dépôt.",
    content: "Bonjour,\n\nVous trouverez les éléments relatifs à la dotation voirie 2026. Le dossier devra être déposé selon le calendrier indiqué.\n\nCordialement,\nPréfecture du Rhône",
    receivedAt: "2026-08-11T09:42:00+02:00",
    status: "À traiter",
    commission: "Voirie",
    category: "Subventions",
    attachments: [
      { id: "1-1", name: "dossier-demande.pdf", mimeType: "application/pdf" },
      { id: "1-2", name: "calendrier-2026.pdf", mimeType: "application/pdf" },
    ],
    summary: "Préparer et déposer la demande de dotation voirie selon le calendrier reçu.",
    internalNotes: "",
    followUps: [],
    source: "local",
    updatedAt: "2026-08-11T09:42:00+02:00",
  },
  {
    id: 2, sender: "Syndicat des eaux", subject: "Intervention route de Saint-Martin",
    preview: "Confirmation de l’intervention programmée.", content: "Le Syndicat des eaux confirme son intervention route de Saint-Martin la semaine prochaine.",
    receivedAt: "2026-08-10T16:18:00+02:00", status: "En cours", commission: "Travaux", category: "Intervention", dossierId: 1,
    attachments: [{ id: "2-1", name: "plan-intervention.pdf", mimeType: "application/pdf" }], summary: "Intervention du Syndicat des eaux confirmée route de Saint-Martin.", internalNotes: "Coordonner avec l’entreprise de voirie.", followUps: [], source: "local", updatedAt: "2026-08-10T16:18:00+02:00",
  },
  {
    id: 3, sender: "Association Les Amis du Village", subject: "Réservation de la salle des fêtes",
    preview: "Nous souhaitons réserver la salle pour notre assemblée générale.", content: "Bonjour,\n\nNous souhaitons réserver la salle des fêtes pour notre assemblée générale du mois de septembre. Pouvez-vous nous confirmer sa disponibilité ?",
    receivedAt: "2026-08-08T11:05:00+02:00", status: "À traiter", commission: "Vie locale", category: "Réservation", dossierId: 2,
    attachments: [], summary: "Demande de disponibilité de la salle des fêtes pour une assemblée générale en septembre.", internalNotes: "", followUps: [], source: "local", updatedAt: "2026-08-08T11:05:00+02:00",
  },
  {
    id: 4, sender: "Trésorerie de L’Arbresle", subject: "État mensuel – juillet",
    preview: "Veuillez trouver ci-joint l’état mensuel.", content: "Veuillez trouver ci-joint l’état mensuel du mois de juillet pour classement.",
    receivedAt: "2026-08-07T14:32:00+02:00", status: "Classé", commission: "Finances", category: "Comptabilité",
    attachments: [{ id: "4-1", name: "etat-mensuel-juillet.pdf", mimeType: "application/pdf" }], summary: "État mensuel de juillet transmis par la trésorerie.", internalNotes: "", followUps: [], source: "local", updatedAt: "2026-08-07T14:32:00+02:00",
  },
];
