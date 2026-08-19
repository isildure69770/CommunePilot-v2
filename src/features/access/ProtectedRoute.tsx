import { Navigate, useLocation } from "react-router-dom";
import { useIdentity } from "./LocalIdentityProvider";
import type { PermissionAction, PermissionDomain } from "./types";

export default function ProtectedRoute({ domain, action = "view", children }: { domain: PermissionDomain; action?: PermissionAction; children: React.ReactNode }) {
  const { can, user } = useIdentity(); const location = useLocation();
  if (!can(domain, action)) return <Navigate to={user.role === "Agent technique" ? "/terrain" : "/acces-refuse"} replace state={{ from: location.pathname }} />;
  return children;
}
