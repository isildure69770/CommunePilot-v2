import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./layout/MainLayout";

import Dashboard from "./pages/Dashboard";
import PlaceholderPage from "./pages/PlaceholderPage";

import DossiersPage from "./features/dossiers/pages/DossiersPage";
import VoiriePage from "./features/voirie/pages/VoiriePage";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/dossiers"
          element={<DossiersPage />}
        />

        <Route
          path="/voirie"
          element={<VoiriePage />}
        />

        <Route
          path="/conseil-municipal"
          element={
            <PlaceholderPage
              title="Conseil municipal"
              description="Le module Conseil municipal sera développé prochainement."
            />
          }
        />

        <Route
          path="/batiments"
          element={
            <PlaceholderPage
              title="Bâtiments"
              description="Le module Bâtiments sera développé prochainement."
            />
          }
        />

        <Route
          path="/documents"
          element={
            <PlaceholderPage
              title="Documents"
              description="Le module Documents sera développé prochainement."
            />
          }
        />

        <Route
          path="/calendrier"
          element={
            <PlaceholderPage
              title="Calendrier"
              description="Le module Calendrier sera développé prochainement."
            />
          }
        />

        <Route
          path="/parametres"
          element={
            <PlaceholderPage
              title="Paramètres"
              description="Configuration générale de CommunePilot."
            />
          }
        />
      </Route>

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}