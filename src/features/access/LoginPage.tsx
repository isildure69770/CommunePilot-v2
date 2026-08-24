import { ArrowRight, Building2, CheckCircle2, MapPinned, ShieldCheck } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useIdentity } from "./LocalIdentityProvider";
import { azureLoginUrl } from "./useAzureAuthentication";

export default function LoginPage() {
  const {ready,azureDeployment,authenticated,user}=useIdentity();
  if(!ready)return <main className="login-page"><div className="login-loading">Vérification de la session…</div></main>;
  if(!azureDeployment||authenticated)return <Navigate to={user.role==="Agent technique"?"/terrain":"/dashboard"} replace/>;
  return <main className="login-page"><section className="login-card"><div className="login-town-banner"><div className="login-hills"/><span><MapPinned/> Commune de Montrottier</span><h1>CommunePilot</h1><p>Le centre de commande numérique de votre mairie</p></div><div className="login-content"><div className="login-brand"><span>CP</span><div><strong>Bienvenue</strong><small>Espace sécurisé des élus et des agents</small></div></div><h2>Connectez-vous à votre espace</h2><p>Utilisez votre compte Microsoft professionnel. Vos identifiants sont saisis directement sur la page sécurisée Microsoft.</p><a className="login-microsoft" href={azureLoginUrl}><Building2/> Se connecter avec Microsoft <ArrowRight/></a><div className="login-reassurance"><span><ShieldCheck/> Connexion sécurisée</span><span><CheckCircle2/> Accès selon votre fonction</span></div><small className="login-help">Un problème de connexion ? Contactez l’administrateur CommunePilot de la mairie.</small></div></section></main>;
}
