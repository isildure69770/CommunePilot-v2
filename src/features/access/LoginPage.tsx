import { ArrowRight, CheckCircle2, LogIn, MapPinned, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useIdentity } from "./LocalIdentityProvider";
import { azureLoginUrl } from "./useAzureAuthentication";

export default function LoginPage() {
  const {ready,azureDeployment,authenticated,user}=useIdentity();
  if(!ready)return <main className="login-page"><div className="login-loading">Vérification de la session…</div></main>;
  if(!azureDeployment||authenticated)return <Navigate to={user.role==="Agent technique"?"/terrain":"/dashboard"} replace/>;
  return <main className="login-page"><section className="login-card"><div className="login-town-banner"><div className="login-hills"/><span><MapPinned/> Commune de Montrottier</span><h1>CommunePilot</h1><p>Le centre de commande numérique de votre mairie</p></div><div className="login-content"><div className="login-brand"><span>CP</span><div><strong>Bienvenue</strong><small>Espace sécurisé des élus et des agents</small></div></div><h2>Connexion CommunePilot</h2><p>Connectez-vous avec l’adresse individuelle enregistrée dans votre profil CommunePilot. Chaque élu et chaque agent dispose de son propre accès.</p><a className="login-microsoft" href={azureLoginUrl}><LogIn/> Accéder à mon profil CommunePilot <ArrowRight/></a><div className="login-reassurance"><span><ShieldCheck/> Connexion sécurisée</span><span><UserRoundCheck/> Compte strictement personnel</span><span><CheckCircle2/> Droits selon votre fonction</span></div><small className="login-help">Première connexion ou accès oublié ? Contactez l’administrateur CommunePilot de la mairie.</small></div></section></main>;
}
