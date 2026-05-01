import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="appShell">
      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
      <div className="appBody">
        {sidebarOpen ? (
          <button
            type="button"
            className="sidebarOverlay"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}
        <aside className={`sidebarPanel ${sidebarOpen ? "sidebarPanelOpen" : ""}`}>
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </aside>
        <div className="mainColumn">
          <main className="container">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
