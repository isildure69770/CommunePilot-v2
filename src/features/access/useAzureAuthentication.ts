import { useEffect, useState } from "react";
import type { UserRole } from "./types";

interface AzurePrincipal {
  identityProvider: string;
  userDetails: string;
  userId: string;
  userRoles: string[];
}

export interface AzureDirectoryUser {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  active: boolean;
  email?: string;
}

export type AzureAuthenticationState =
  | { status: "local" | "loading" | "anonymous" | "error"; principal: null }
  | { status: "authenticated"; principal: AzurePrincipal; users: AzureDirectoryUser[]; directoryError: string };

const isAzureHost = () => window.location.hostname.endsWith(".azurestaticapps.net");

const communeRoles: Record<string, UserRole> = {
  maire: "Maire",
  adjoint: "Adjoint",
  conseiller: "Conseiller",
  "agent-administratif": "Agent administratif",
  "agent-technique": "Agent technique",
};

export function communeRoleFromAzure(userRoles: string[]): UserRole {
  for (const role of userRoles) {
    const communeRole = communeRoles[role.toLocaleLowerCase("fr-FR")];
    if (communeRole) return communeRole;
  }
  return "Aucun accès";
}

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
      .then(async ({ clientPrincipal }) => {
        if (!clientPrincipal) { setState({ status: "anonymous", principal: null }); return; }
        try {
          const response = await fetch("/api/users", { method: "PUT", credentials: "same-origin", signal: controller.signal });
          if (!response.ok) throw new Error(`Annuaire indisponible (${response.status}).`);
          const body = await response.json() as { users?: AzureDirectoryUser[] };
          setState({ status: "authenticated", principal: clientPrincipal, users: Array.isArray(body.users) ? body.users : [], directoryError: "" });
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setState({ status: "authenticated", principal: clientPrincipal, users: [], directoryError: error instanceof Error ? error.message : "Annuaire indisponible." });
        }
      })
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
