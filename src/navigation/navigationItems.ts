import {
  Building2,
  CalendarDays,
  FileText,
  FolderKanban,
  Gauge,
  Landmark,
  Mail,
  Map,
  MapPin,
  Settings,
  TriangleAlert,
} from "lucide-react";

export const navigationItems = [
  { label: "Tableau de bord", path: "/dashboard", icon: Gauge },
  { label: "Dossiers", path: "/dossiers", icon: FolderKanban },
  { label: "Voirie", path: "/voirie", icon: MapPin },
  { label: "Signalements", path: "/signalements", icon: TriangleAlert },
  { label: "Conseil municipal", path: "/conseil-municipal", icon: Landmark },
  { label: "Bâtiments", path: "/batiments", icon: Building2 },
  { label: "Mails", path: "/mails", icon: Mail },
  { label: "Documents", path: "/documents", icon: FileText },
  { label: "Calendrier", path: "/calendrier", icon: CalendarDays },
  { label: "Carte", path: "/carte", icon: Map },
  { label: "Paramètres", path: "/parametres", icon: Settings },
] as const;
