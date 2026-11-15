import { NavLink, Link } from "react-router-dom";
import { AudioWaveform, House, CalendarDays, Settings2, X, Plus } from "lucide-react";
import RecentMeetings from "./RecentMeetings";
const links = [
  ["/", "Home", House],
  ["/meetings", "Meetings", CalendarDays],
  ["/settings", "Settings", Settings2],
];
export default function MobileNav({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close navigation"
      />
      <aside className="absolute inset-y-0 left-0 flex w-[290px] flex-col border-r border-line bg-sidebar p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#6c63d9] text-white">
              <AudioWaveform size={20} />
            </div>
            <span className="font-display text-xl font-extrabold text-ink">voxora</span>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <Link
          to="/meetings/new"
          onClick={onClose}
          className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 text-xs font-semibold text-white"
        >
          <Plus size={16} /> New recording
        </Link>
        <p className="mb-2 mt-9 px-2 text-[10px] font-bold uppercase tracking-widest text-muted">
          Workspace
        </p>
        <nav className="space-y-1">
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${isActive ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "text-muted hover:bg-surface"}`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="mb-2 mt-7 px-2 text-[10px] font-bold uppercase tracking-widest text-muted">
          Recent meetings
        </p>
        <div className="max-h-[35vh] overflow-y-auto">
          <RecentMeetings limit={4} onNavigate={onClose} />
        </div>
      </aside>
    </div>
  );
}
