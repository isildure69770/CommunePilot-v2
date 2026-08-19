import { useEffect, useState } from "react";
import { MAILS_CHANGED_EVENT, MAIL_STORAGE_KEY, mailRepository } from "../services/mailRepository";
import type { MunicipalMail } from "../types/mail";

export function useMails() {
  const [mails, setMails] = useState<MunicipalMail[]>(() => mailRepository.getAll());

  useEffect(() => {
    const refresh = (event?: Event) => {
      if (event instanceof StorageEvent && event.key !== MAIL_STORAGE_KEY) return;
      setMails(mailRepository.getAll());
    };
    window.addEventListener(MAILS_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(MAILS_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return {
    mails,
    updateMail: (id: number, changes: Partial<MunicipalMail>) => setMails(mailRepository.update(id, changes)),
    deleteMail: (id: number) => setMails(mailRepository.deleteLocal(id)),
  };
}
