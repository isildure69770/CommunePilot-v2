import {
  lazy,
  Suspense,
} from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "./layout/MainLayout";

import { MicrosoftAuthProvider } from "./features/mails/auth/MicrosoftAuthProvider";
import { MailSyncProvider } from "./features/mails/providers/MailSyncProvider";
import { LocalIdentityProvider, useIdentity } from "./features/access/LocalIdentityProvider";
import ProtectedRoute from "./features/access/ProtectedRoute";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const PlaceholderPage = lazy(() => import("./pages/PlaceholderPage"));
const DossiersPage = lazy(() => import("./features/dossiers/pages/DossiersPage"));
const DossierDetailPage = lazy(() => import("./features/dossiers/pages/DossierDetailPage"));
const VoiriePage = lazy(() => import("./features/voirie/pages/VoiriePage"));
const BusinessLayersPage = lazy(() => import("./features/voirie/pages/BusinessLayersPage"));
const SignalementsPage = lazy(() => import("./features/signalements/pages/SignalementsPage"));
const CommuneMapPage = lazy(() => import("./features/map/pages/CommuneMapPage"));
const EquipmentDetailPage = lazy(() => import("./features/equipments/pages/EquipmentDetailPage"));
const MailsPage = lazy(() => import("./features/mails/pages/MailsPage"));
const UsersPage = lazy(() => import("./features/access/UsersPage"));
const MissionsPage = lazy(() => import("./features/field/MissionsPage"));
const TerrainPage = lazy(() => import("./features/field/TerrainPage"));
const FieldAlertsPage = lazy(() => import("./features/field/FieldAlertsPage"));
const NotificationsPage = lazy(() => import("./features/field/NotificationsPage"));
const CalendarPage = lazy(() => import("./features/calendar/pages/CalendarPage"));
const CalendarSettingsPage = lazy(() => import("./features/calendar/pages/CalendarSettingsPage"));
const CommissionPage = lazy(() => import("./features/commissions/pages/CommissionPage"));

const protect = (domain: Parameters<typeof ProtectedRoute>[0]["domain"], child: React.ReactNode, action?: Parameters<typeof ProtectedRoute>[0]["action"]) => <ProtectedRoute domain={domain} action={action}>{child}</ProtectedRoute>;
function HomeRedirect() { const { ready, user } = useIdentity(); if (!ready) return <div className="empty-state">Vérification de votre accès Azure…</div>; return <Navigate to={user.role === "Agent technique" ? "/terrain" : "/dashboard"} replace />; }

export default function App() {
  return (
    <MicrosoftAuthProvider><MailSyncProvider><LocalIdentityProvider><Suspense fallback={<div className="empty-state">Chargement…</div>}><Routes>
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
    </Routes></Suspense></LocalIdentityProvider></MailSyncProvider></MicrosoftAuthProvider>
  );
}
