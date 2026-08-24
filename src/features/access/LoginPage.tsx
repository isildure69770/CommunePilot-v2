import { ArrowRight, CheckCircle2, LogIn, MapPinned, RefreshCw, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useIdentity } from "./LocalIdentityProvider";
import { azureAlternateLoginUrl, azureLoginUrl } from "./useAzureAuthentication";

export default function LoginPage() {
  const {ready,azureDeployment,authenticated,user}=useIdentity();
  const [searchParams]=useSearchParams();
  const changingAccount=searchParams.get("autre_compte")==="1";
  if(!ready)return <main className="login-page"><div className="login-loading">Vérification de la session…</div></main>;
  if(!azureDeployment||authenticated)return <Navigate to={user.role==="Agent technique"?"/terrain":"/dashboard"} replace/>;
  return <main className="login-page"><section className="login-card"><div className="login-town-banner"><span><MapPinned/> Commune de Montrottier</span><div className="login-town-copy"><h1>CommunePilot</h1><p>Le centre de commande numérique de votre mairie</p><a href="https://commons.wikimedia.org/wiki/File:Vue_globale_village_montrottier.jpg" target="_blank" rel="noreferrer">Photo de Montrottier — Wikimedia Commons</a></div></div><div className="login-content"><div className="login-brand"><span>CP</span><div><strong>Bienvenue</strong><small>Espace sécurisé des élus et des agents</small></div></div><h2>{changingAccount?"Choisir une autre adresse":"Connexion CommunePilot"}</h2><p>{changingAccount?"Votre précédente session est fermée. Appuyez ci-dessous puis choisissez l’adresse correspondant au profil CommunePilot à utiliser.":"Connectez-vous avec l’adresse individuelle enregistrée dans votre profil CommunePilot. Chaque élu et chaque agent dispose de son propre accès."}</p><a className="login-microsoft" href={changingAccount?azureAlternateLoginUrl:azureLoginUrl}>{changingAccount?<RefreshCw/>:<LogIn/>}{changingAccount?"Choisir mon adresse":"Accéder à mon profil CommunePilot"}<ArrowRight/></a>{!changingAccount&&<a className="login-alternate" href={azureAlternateLoginUrl}><RefreshCw/> Se connecter avec une autre adresse</a>}<div className="login-reassurance"><span><ShieldCheck/> Connexion sécurisée</span><span><UserRoundCheck/> Compte strictement personnel</span><span><CheckCircle2/> Droits selon votre fonction</span></div><small className="login-help">Première connexion ou accès oublié ? Contactez l’administrateur CommunePilot de la mairie.</small></div></section></main>;
}
