import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import MobileNavigation from "../components/MobileNavigation";
import "../styles/main.css";
import { useIdentity } from "../features/access/LocalIdentityProvider";

export default function MainLayout() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const { user } = useIdentity();

  return (
    <div className={`layout${user.role === "Agent technique" ? " agent-layout" : ""}`}>
      {user.role !== "Agent technique" && <Sidebar isOpen={isNavigationOpen} onClose={() => setIsNavigationOpen(false)} />}
      <div className="content">
        <Header onOpenMenu={() => setIsNavigationOpen(true)} />
        <main className="page"><Outlet /></main>
      </div>
      <MobileNavigation onOpenMore={() => setIsNavigationOpen(true)} />
    </div>
  );
}
