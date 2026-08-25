import type { MunicipalMail } from "../types/mail";

export const MAIL_AI_CATEGORIES = ["Subventions", "Intervention", "Réservation", "Comptabilité", "Administratif", "Autre"] as const;
export const MAIL_AI_URGENCIES = ["Faible", "Normale", "Haute", "Urgente"] as const;

export interface LocalMailAnalysis {
  summary: string;
  category: (typeof MAIL_AI_CATEGORIES)[number];
  urgency: (typeof MAIL_AI_URGENCIES)[number];
  deadline: string | null;
  suggestedAction: string;
}

export async function analyzeMailLocally(mail: MunicipalMail, signal?: AbortSignal): Promise<LocalMailAnalysis> {
  const response = await fetch("/api/ai/analyze-mail", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sender: mail.sender, senderEmail: mail.senderEmail, subject: mail.subject, receivedAt: mail.receivedAt, content: mail.content || mail.preview }),
    signal,
  });
  const payload = await response.json().catch(() => ({})) as Partial<LocalMailAnalysis> & { error?: string };
  if (!response.ok) throw new Error(payload.error || "L’analyse locale n’a pas pu être réalisée.");
  if (!payload.summary || !MAIL_AI_CATEGORIES.includes(payload.category as LocalMailAnalysis["category"]) || !MAIL_AI_URGENCIES.includes(payload.urgency as LocalMailAnalysis["urgency"]) || !payload.suggestedAction) throw new Error("La réponse de l’IA locale est incomplète.");
  return payload as LocalMailAnalysis;
}
