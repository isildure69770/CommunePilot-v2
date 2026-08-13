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
import BusinessLayersPage from "./features/voirie/pages/BusinessLayersPage";
import SignalementsPage from "./features/signalements/pages/SignalementsPage";
import CommuneMapPage from "./features/map/pages/CommuneMapPage";
import EquipmentDetailPage from "./features/equipments/pages/EquipmentDetailPage";
import MailsPage from "./features/mails/pages/MailsPage";
import { MicrosoftAuthProvider } from "./features/mails/auth/MicrosoftAuthProvider";
import { MailSyncProvider } from "./features/mails/providers/MailSyncProvider";
import { LocalIdentityProvider, useIdentity } from "./features/access/LocalIdentityProvider";
import ProtectedRoute from "./features/access/ProtectedRoute";
import UsersPage from "./features/access/UsersPage";
import MissionsPage from "./features/field/MissionsPage";
import TerrainPage from "./features/field/TerrainPage";
import FieldAlertsPage from "./features/field/FieldAlertsPage";
import NotificationsPage from "./features/field/NotificationsPage";
import CalendarPage from "./features/calendar/pages/CalendarPage";
import CalendarSettingsPage from "./features/calendar/pages/CalendarSettingsPage";
import CommissionPage from "./features/commissions/pages/CommissionPage";

const protect = (domain: Parameters<typeof ProtectedRoute>[0]["domain"], child: React.ReactNode, action?: Parameters<typeof ProtectedRoute>[0]["action"]) => <ProtectedRoute domain={domain} action={action}>{child}</ProtectedRoute>;
function HomeRedirect() { const { user } = useIdentity(); return <Navigate to={user.role === "Agent technique" ? "/terrain" : "/dashboard"} replace />; }

export default function App() {
  return (
    <MicrosoftAuthProvider><MailSyncProvider><LocalIdentityProvider><Routes>
      <Route element={<MainLayout />}>
        <Route
          path="/dashboard"
          element={protect("dashboard", <Dashboard />)}
        />

        <Route
          path="/dossiers"
          element={protect("dossiers", <DossiersPage />)}
        />

        <Route
          path="/dossiers/:id"
          element={protect("dossiers", <DossierDetailPage />)}
        />

        <Route
          path="/voirie"
          element={protect("equipements", <CommissionPage commissionId="voirie" />)}
        />
        <Route path="/voirie/chantiers" element={protect("equipements", <VoiriePage />)} />
        <Route path="/voirie/couches-metier" element={protect("carte", <BusinessLayersPage />)} />

        <Route
          path="/signalements"
          element={protect("signalements", <SignalementsPage />)}
        />

        <Route
          path="/carte"
          element={protect("carte", <CommuneMapPage />)}
        />

        <Route
          path="/equipments/:id"
          element={protect("equipements", <EquipmentDetailPage />)}
        />

        <Route
          path="/conseil-municipal"
          element={protect("documents",
            <PlaceholderPage
              title="Conseil municipal"
              description="Le module Conseil municipal sera développé ici."
            />)}
        />

        <Route
          path="/batiments"
          element={protect("dashboard", <CommissionPage commissionId="batiments" />)}
        />
        <Route path="/gestion-des-salles" element={protect("dashboard", <CommissionPage commissionId="salles" />)} />
        <Route path="/communication" element={protect("dashboard", <CommissionPage commissionId="communication" />)} />

        <Route
          path="/mails"
          element={protect("mails", <MailsPage />)}
        />

        <Route path="/missions" element={protect("missions", <MissionsPage />, "create")} />
        <Route path="/terrain" element={protect("missions", <TerrainPage />)} />
        <Route path="/alertes-terrain" element={protect("signalements", <FieldAlertsPage />, "update")} />
        <Route path="/utilisateurs" element={protect("utilisateurs", <UsersPage />)} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/acces-refuse" element={<PlaceholderPage title="Accès refusé" description="Votre rôle local ne permet pas d’accéder à cette rubrique." />} />

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
          element={protect("calendrier", <CalendarPage />)}
        />

        <Route
          path="/parametres"
          element={<CalendarSettingsPage />}
        />
      </Route>

      <Route
        path="/"
        element={
          <HomeRedirect />
        }
      />

      <Route
        path="*"
        element={
          <HomeRedirect />
        }
      />
    </Routes></LocalIdentityProvider></MailSyncProvider></MicrosoftAuthProvider>
  );
}
