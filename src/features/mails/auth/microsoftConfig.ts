import type { Configuration, RedirectRequest } from "@azure/msal-browser";
const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID?.trim();
const tenant = import.meta.env.VITE_MICROSOFT_TENANT_ID?.trim() || "common";
export const microsoftConfigured = Boolean(clientId);
export const graphScopes = ["User.Read", "Mail.Read"];
export const microsoftConfiguration: Configuration = {
  auth: {
    clientId: clientId as string,
    authority: `https://login.microsoftonline.com/${tenant}`,
    redirectUri: import.meta.env.VITE_MICROSOFT_REDIRECT_URI?.trim() || window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  // MSAL reste seul propriétaire des jetons et de l'état PKCE. Le cache de
  // session évite qu'une popup interrompue verrouille les connexions suivantes.
  cache: { cacheLocation: "sessionStorage" },
};
export const loginRequest: RedirectRequest = { scopes: graphScopes, prompt: "select_account" };
