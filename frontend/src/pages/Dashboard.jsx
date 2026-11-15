import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Plus,
  Upload,
  Youtube,
  CalendarDays,
  AudioWaveform,
  Sparkles,
  FileText,
  ListChecks,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
export default function Dashboard() {
  const { workspace, meetings } = useWorkspace();
  const actions = [
    [Upload, "Upload media", "Add an audio or video file", "/meetings/new"],
    [Youtube, "YouTube link", "Bring a video into your library", "/meetings/new"],
    [CalendarDays, "Browse meetings", "Revisit your processed recordings", "/meetings"],
  ];
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-line bg-surface px-6 py-8 sm:px-9 sm:py-10"
      >
        <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-[var(--accent-soft)] blur-2xl" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-[10px] font-semibold text-[var(--accent-strong)]">
            <Sparkles size={12} /> YOUR AI MEETING WORKSPACE
          </div>
          <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-[42px]">
            Every conversation.
            <br />
            <span className="text-[var(--accent-strong)]">A little more clarity.</span>
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted">
            Turn recordings into searchable notes, meaningful decisions and next steps.
            Spend less time replaying and more time moving forward.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/meetings/new"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-3 text-xs font-semibold text-white shadow-sm hover:bg-[var(--accent-strong)]"
            >
              <Plus size={16} /> New recording
            </Link>
            <Link
              to="/meetings"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-5 py-3 text-xs font-semibold text-ink hover:bg-paper"
            >
              Explore meetings <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <div className="absolute bottom-7 right-10 hidden h-36 w-36 items-center justify-center rounded-full border border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent-strong)] lg:flex">
          <div className="flex flex-col items-center">
            <AudioWaveform size={42} strokeWidth={1.2} />
            <span className="mt-2 text-[9px] font-bold tracking-[.16em]">VOXORA AI</span>
          </div>
        </div>
      </motion.section>
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">Jump back in</h3>
            <p className="mt-1 text-xs text-muted">
              A few ways to work with your conversations.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map(([Icon, title, desc, to]) => (
            <Link
              key={title}
              to={to}
              className="group rounded-xl border border-line bg-surface p-4 hover:border-[var(--accent)]/50 hover:shadow-[var(--shadow)]"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  <Icon size={17} />
                </div>
                <ArrowRight
                  size={15}
                  className="text-muted transition group-hover:translate-x-1 group-hover:text-[var(--accent-strong)]"
                />
              </div>
              <h4 className="mt-4 text-sm font-semibold text-ink">{title}</h4>
              <p className="mt-1 text-xs leading-5 text-muted">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-ink">Recent meetings</h3>
            <p className="mt-1 text-[11px] text-muted">
              Your latest processed conversations
            </p>
          </div>
          <Link
            to="/meetings"
            className="text-xs font-semibold text-[var(--accent-strong)]"
          >
            View all <ArrowRight size={13} className="ml-1 inline" />
          </Link>
        </div>
        {meetings.length ? (
          meetings.slice(0, 4).map((m) => (
            <div
              key={m.session_id}
              className="flex items-center gap-3 border-b border-line px-5 py-4 last:border-0"
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                <FileText size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {m.title || "Untitled recording"}
                </p>
                <p className="mt-1 truncate text-[11px] text-muted">
                  {m.source || "Recording"} · {m.language || "English"}
                </p>
              </div>
              <Link
                to={`/meetings/${encodeURIComponent(m.session_id)}`}
                className="text-xs font-semibold text-[var(--accent-strong)]"
              >
                Open
              </Link>
            </div>
          ))
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <AudioWaveform size={20} />
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">No meetings yet</p>
            <p className="mt-1 text-xs text-muted">
              Your first recording will show up here once it is processed.
            </p>
            <Link
              to="/meetings/new"
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-strong)]"
            >
              Add a recording <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>
      <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-alt px-4 py-3">
        <ListChecks size={16} className="mt-0.5 shrink-0 text-[var(--accent-strong)]" />
        <p className="text-[11px] leading-5 text-muted">
          {workspace.session_id
            ? `Currently working with: ${workspace.title || "Untitled recording"}.`
            : "Your library is kept in the active browser session. The backend does not yet provide persistent meeting history."}
        </p>
      </div>
    </div>
  );
}
