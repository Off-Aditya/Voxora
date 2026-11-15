import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import { Link } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { workflow } = useWorkspace();
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Sidebar />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="min-h-screen lg:pl-[252px]">
        <Header onMenuClick={() => setMobileOpen(true)} />
        {workflow.busy && (
          <div className="border-b border-line bg-[var(--accent-soft)] px-5 py-2 text-center text-xs text-[var(--accent-strong)]">
            A recording is processing.{" "}
            <Link className="font-bold underline" to="/meetings/new">
              Return to its status
            </Link>
          </div>
        )}
        <main className="mx-auto max-w-[1450px] px-5 py-7 sm:px-8 sm:py-8">
          <Outlet />
        </main>
        <footer className="border-t border-line px-6 py-5 text-center text-[10px] text-muted">
          Voxora · Intelligence in every conversation.
        </footer>
      </div>
    </div>
  );
}
