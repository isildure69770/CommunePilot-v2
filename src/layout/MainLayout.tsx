import type { ReactNode } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "../styles/main.css";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <Header />

        <main className="page">
          {children}
        </main>
      </div>
    </div>
  );
}