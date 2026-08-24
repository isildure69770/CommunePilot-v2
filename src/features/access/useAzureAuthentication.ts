import { useEffect, useState } from "react";

interface AzurePrincipal {
  identityProvider: string;
  userDetails: string;
  userId: string;
  userRoles: string[];
}

export type AzureAuthenticationState =
  | { status: "local" | "loading" | "anonymous" | "error"; principal: null }
  | { status: "authenticated"; principal: AzurePrincipal };

const isAzureHost = () => window.location.hostname.endsWith(".azurestaticapps.net");

export function useAzureAuthentication() {
  const [state, setState] = useState<AzureAuthenticationState>(() => ({
    status: isAzureHost() ? "loading" : "local",
    principal: null,
  }));

  useEffect(() => {
    if (!isAzureHost()) return;
    const controller = new AbortController();
    fetch("/.auth/me", { credentials: "same-origin", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Authentification indisponible (${response.status}).`);
        return response.json() as Promise<{ clientPrincipal?: AzurePrincipal | null }>;
      })
      .then(({ clientPrincipal }) => setState(clientPrincipal
        ? { status: "authenticated", principal: clientPrincipal }
        : { status: "anonymous", principal: null }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "error", principal: null });
      });
    return () => controller.abort();
  }, []);

  return state;
}

export const azureLoginUrl = "/.auth/login/aad?post_login_redirect_uri=/dashboard";
export const azureLogoutUrl = "/.auth/logout?post_logout_redirect_uri=/dashboard";
