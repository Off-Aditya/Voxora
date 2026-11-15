import { NavLink, Link } from "react-router-dom";
import {
  AudioWaveform,
  House,
  CalendarDays,
  Plus,
  Settings2,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import RecentMeetings from "./RecentMeetings";

const primary = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/meetings", label: "Meetings", icon: CalendarDays },
];
export default function Sidebar({ onNavigate }) {
  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-[248px] lg:flex-col lg:border-r lg:border-line lg:bg-sidebar lg:px-4 lg:py-5">
      <Link to="/" className="mb-8 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#6c63d9] text-white shadow-sm">
          <AudioWaveform size={22} />
        </div>
        <div>
          <div className="font-display text-[21px] font-extrabold tracking-tight text-ink">
            voxora
          </div>
          <div className="text-[9px] font-semibold tracking-[.17em] text-muted">
            MEETING INTELLIGENCE
          </div>
        </div>
      </Link>
      <Link
        to="/meetings/new"
        onClick={onNavigate}
        className="mb-7 flex items-center justify-center gap-2 rounded-xl bg-[#6c63d9] px-4 py-3 text-[13px] font-semibold text-white shadow-sm hover:bg-[#5148c8]"
      >
        <Plus size={17} /> New recording
      </Link>
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.13em] text-muted">
        Workspace
      </p>
      <nav className="space-y-1">
        {primary.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-[10px] text-[13px] font-medium ${isActive ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "text-muted hover:bg-surface-alt hover:text-ink"}`
            }
          >
            <Icon size={17} strokeWidth={1.9} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mb-2 mt-8 flex items-center justify-between px-3">
        <p className="text-[10px] font-bold uppercase tracking-[.13em] text-muted">
          Recent meetings
        </p>
        <ChevronDown size={13} className="text-muted" />
      </div>
      <RecentMeetings onNavigate={onNavigate} />
      <div className="mt-auto space-y-3">
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink">
            <Sparkles size={14} className="text-[var(--accent)]" /> Voxora workspace
          </div>
          <p className="mt-1.5 text-[11px] leading-4 text-muted">
            Turn conversations into knowledge you can use.
          </p>
        </div>
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-surface-alt"
        >
          <Settings2 size={16} /> Settings
        </NavLink>
      </div>
    </aside>
  );
}
