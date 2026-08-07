import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "../styles/main.css";

export default function MainLayout() {
  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <Header />

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}