import { Link, Navigate, Outlet, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Transcribe from "./pages/Transcribe";
import Summary from "./pages/Summary";
import Extract from "./pages/Extract";
import Ask from "./pages/Ask";
import Meetings from "./pages/Meetings";
import Settings from "./pages/Settings";
import { MeetingLayout } from "./pages/MeetingWorkspace";
import { useWorkspace } from "./context/WorkspaceContext";

function LegacyMeetingRedirect({ tab = "" }) {
  const { workspace, workflow } = useWorkspace();
  if (workflow.busy) return <Navigate to="/meetings/new" replace />;
  return workspace.session_id ? (
    <Navigate
      to={`/meetings/${encodeURIComponent(workspace.session_id)}${tab ? `/${tab}` : ""}`}
      replace
    />
  ) : (
    <Navigate to="/meetings" replace />
  );
}
function NotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-8 text-center">
      <h2 className="font-display text-xl font-bold text-ink">Page not found</h2>
      <p className="mt-2 text-sm text-muted">That Voxora page does not exist.</p>
      <Link
        to="/"
        className="mt-5 inline-block text-sm font-semibold text-[var(--accent-strong)]"
      >
        Return home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/meetings/new" element={<Transcribe />} />
          <Route path="/meetings/:sessionId" element={<MeetingLayout />}>
            <Route index element={<Summary />} />
            <Route path="transcript" element={null} />
            <Route path="actions" element={<Extract />} />
            <Route path="decisions" element={null} />
            <Route path="questions" element={null} />
            <Route path="ask" element={<Ask />} />
          </Route>
          <Route path="/transcribe" element={<Navigate to="/meetings/new" replace />} />
          <Route path="/summary" element={<LegacyMeetingRedirect />} />
          <Route path="/extract" element={<LegacyMeetingRedirect tab="actions" />} />
          <Route path="/ask" element={<LegacyMeetingRedirect tab="ask" />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
