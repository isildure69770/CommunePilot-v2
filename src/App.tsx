import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "./layout/MainLayout";

import Dashboard from "./pages/Dashboard";
import PlaceholderPage from "./pages/PlaceholderPage";

import DossiersPage from "./features/dossiers/pages/DossiersPage";
import DossierDetailPage from "./features/dossiers/pages/DossierDetailPage";
import VoiriePage from "./features/voirie/pages/VoiriePage";
import SignalementsPage from "./features/signalements/pages/SignalementsPage";
import CommuneMapPage from "./features/map/pages/CommuneMapPage";
import EquipmentDetailPage from "./features/equipments/pages/EquipmentDetailPage";
import MailsPage from "./features/mails/pages/MailsPage";

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
          path="/dossiers/:id"
          element={<DossierDetailPage />}
        />

        <Route
          path="/voirie"
          element={<VoiriePage />}
        />

        <Route
          path="/signalements"
          element={<SignalementsPage />}
        />

        <Route
          path="/carte"
          element={<CommuneMapPage />}
        />

        <Route
          path="/equipments/:id"
          element={<EquipmentDetailPage />}
        />

        <Route
          path="/conseil-municipal"
          element={
            <PlaceholderPage
              title="Conseil municipal"
              description="Le module Conseil municipal sera développé ici."
            />
          }
        />

        <Route
          path="/batiments"
          element={
            <PlaceholderPage
              title="Bâtiments"
              description="Le module Bâtiments sera développé ici."
            />
          }
        />

        <Route
          path="/mails"
          element={<MailsPage />}
        />

        <Route
          path="/documents"
          element={
            <PlaceholderPage
              title="Documents"
              description="Le module Documents sera développé ici."
            />
          }
        />

        <Route
          path="/calendrier"
          element={
            <PlaceholderPage
              title="Calendrier"
              description="Le module Calendrier sera développé ici."
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
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}
