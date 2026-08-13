import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";
import App from "./App";
import "leaflet/dist/leaflet.css";

function containsMicrosoftResponse(parameters: URLSearchParams) {
  return parameters.has("state") && (parameters.has("code") || parameters.has("error"));
}

async function start() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  if (containsMicrosoftResponse(query) || containsMicrosoftResponse(hash)) {
    await broadcastResponseToMainFrame();
    return;
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}

void start();
