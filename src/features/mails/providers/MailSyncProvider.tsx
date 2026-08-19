/* oxlint-disable react/only-export-components -- Le provider et son hook forment une API React unique. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMicrosoftAuth } from "../auth/MicrosoftAuthProvider";
import { mailRepository } from "../services/mailRepository";
import { MicrosoftGraphMailProvider } from "./microsoftGraphMailProvider";

interface Value { syncing: boolean; error: string; hasMore: boolean; lastSyncedAt?: string; sync(): Promise<void>; loadMore(): Promise<void>; fetchAttachment(messageId: string, attachmentId: string): Promise<Blob>; downloadAttachment(messageId: string, attachmentId: string, filename: string): Promise<void>; }
const Context = createContext<Value | null>(null);

function syncErrorMessage(reason: unknown) {
  if (reason instanceof DOMException && reason.name === "QuotaExceededError") {
    return "Le stockage local de Safari est plein. Les mails existants ont été conservés.";
  }
  return reason instanceof Error ? reason.message : "Synchronisation Microsoft impossible.";
}

export function MailSyncProvider({ children }: { children: ReactNode }) {
  const { account, getAccessToken } = useMicrosoftAuth();
  const provider = useMemo(() => new MicrosoftGraphMailProvider(getAccessToken), [getAccessToken]);
  const [syncing, setSyncing] = useState(false); const [error, setError] = useState(""); const [nextCursor, setNextCursor] = useState<string>(); const [lastSyncedAt, setLastSyncedAt] = useState<string>(); const synced = useRef<string | undefined>(undefined);
  const fetchPage = useCallback(async (cursor?: string) => {
    if (!account) return; setSyncing(true); setError("");
    try { const page = await provider.getMessages(cursor); mailRepository.mergeProviderMails(page.mails); setNextCursor(page.nextCursor); setLastSyncedAt(new Date().toISOString()); }
    catch (reason) { setError(syncErrorMessage(reason)); throw reason; }
    finally { setSyncing(false); }
  }, [account, provider]);
  useEffect(() => { if (!account?.homeAccountId || synced.current === account.homeAccountId) return; synced.current = account.homeAccountId; void fetchPage().catch(() => undefined); }, [account, fetchPage]);
  useEffect(() => { if (!account) { synced.current = undefined; setNextCursor(undefined); setError(""); } }, [account]);
  const fetchAttachment = useCallback(async (messageId: string, attachmentId: string) => {
    setError("");
    try { return await provider.getAttachment(messageId, attachmentId); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Téléchargement impossible."); throw reason; }
  }, [provider]);
  const downloadAttachment = useCallback(async (messageId: string, attachmentId: string, filename: string) => {
    const blob = await fetchAttachment(messageId, attachmentId); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }, [fetchAttachment]);
  const value = useMemo(() => ({ syncing, error, hasMore: Boolean(nextCursor), lastSyncedAt, sync: () => fetchPage(), loadMore: () => fetchPage(nextCursor), fetchAttachment, downloadAttachment }), [downloadAttachment, error, fetchAttachment, fetchPage, lastSyncedAt, nextCursor, syncing]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useMailSync() { const value = useContext(Context); if (!value) throw new Error("useMailSync doit être utilisé dans MailSyncProvider."); return value; }
