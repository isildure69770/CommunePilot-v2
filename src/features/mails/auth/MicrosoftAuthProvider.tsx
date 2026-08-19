/* oxlint-disable react/only-export-components -- Le provider et son hook forment une API React unique. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { InteractionRequiredAuthError, PublicClientApplication, type AccountInfo, type AuthenticationResult } from "@azure/msal-browser";
import { graphScopes, loginRequest, microsoftConfiguration, microsoftConfigured } from "./microsoftConfig";

interface MicrosoftAuthValue {
  configured: boolean;
  account: AccountInfo | null;
  loading: boolean;
  error: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getAccessToken(): Promise<string>;
}

interface MsalErrorLike {
  errorCode?: string;
  subError?: string;
  message?: string;
}

const MicrosoftAuthContext = createContext<MicrosoftAuthValue | null>(null);

// L'instance et son initialisation vivent au niveau du module : les remontages de
// StrictMode ne peuvent donc ni les dupliquer ni relancer une interaction MSAL.
const msal = microsoftConfigured ? new PublicClientApplication(microsoftConfiguration) : null;
const msalReady: Promise<AuthenticationResult | null> = msal
  ? msal.initialize().then(() => msal.handleRedirectPromise())
  : Promise.resolve(null);

function msalErrorDetails(error: unknown): MsalErrorLike {
  return typeof error === "object" && error !== null ? error as MsalErrorLike : {};
}

function readableError(error: unknown) {
  const details = msalErrorDetails(error);
  const code = details.errorCode;
  const messages: Record<string, string> = {
    no_token_request_cache_error: "Microsoft n’a pas pu retrouver la demande de connexion. Fermez toute ancienne fenêtre Microsoft puis réessayez.",
    timed_out: "La connexion Microsoft a expiré. Vérifiez que la fenêtre de connexion n’est pas bloquée, puis réessayez.",
    popup_window_error: "La fenêtre de connexion Microsoft a été bloquée par le navigateur. Autorisez les fenêtres surgissantes pour ce site.",
    user_cancelled: "La connexion Microsoft a été annulée.",
    interaction_in_progress: "Une connexion Microsoft est déjà en cours. Terminez-la ou fermez sa fenêtre avant de réessayer.",
  };
  const friendly = code ? messages[code] : undefined;
  if (friendly) return `${friendly} (code MSAL : ${code})`;
  if (code) return `Connexion Microsoft impossible. Réessayez. (code MSAL : ${code})`;
  return details.message || "Une erreur Microsoft inattendue est survenue.";
}

function restoreAccount(result?: AuthenticationResult | null) {
  if (!msal) return null;
  const next = result?.account ?? msal.getActiveAccount() ?? msal.getAllAccounts()[0] ?? null;
  if (next) msal.setActiveAccount(next);
  return next;
}

export function MicrosoftAuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(Boolean(msal));
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void msalReady
      .then((result) => {
        if (active) setAccount(restoreAccount(result));
      })
      .catch((reason: unknown) => {
        if (active) setError(readableError(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const connect = useCallback(async () => {
    if (!msal) {
      setError("Configuration Microsoft manquante : renseignez VITE_MICROSOFT_CLIENT_ID.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await msalReady;
      await msal.loginRedirect(loginRequest);
    } catch (reason) {
      setError(readableError(reason));
      throw reason;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!msal || !account) return;
    setLoading(true);
    setError("");
    try {
      await msalReady;
      await msal.logoutPopup({ account, postLogoutRedirectUri: window.location.origin });
      msal.setActiveAccount(null);
      setAccount(null);
    } catch (reason) {
      setError(readableError(reason));
      throw reason;
    } finally {
      setLoading(false);
    }
  }, [account]);

  const getAccessToken = useCallback(async () => {
    if (!msal || !account) throw new Error("Connectez d’abord un compte Outlook/Hotmail.");
    try {
      await msalReady;
      try {
        return (await msal.acquireTokenSilent({ scopes: graphScopes, account })).accessToken;
      } catch (reason) {
        if (reason instanceof InteractionRequiredAuthError) {
          return (await msal.acquireTokenPopup({ scopes: graphScopes, account })).accessToken;
        }
        throw reason;
      }
    } catch (reason) {
      setError(readableError(reason));
      throw reason;
    }
  }, [account]);

  const value = useMemo(() => ({ configured: microsoftConfigured, account, loading, error, connect, disconnect, getAccessToken }), [account, connect, disconnect, error, getAccessToken, loading]);
  return <MicrosoftAuthContext.Provider value={value}>{children}</MicrosoftAuthContext.Provider>;
}

export function useMicrosoftAuth() {
  const value = useContext(MicrosoftAuthContext);
  if (!value) throw new Error("useMicrosoftAuth doit être utilisé dans MicrosoftAuthProvider.");
  return value;
}
