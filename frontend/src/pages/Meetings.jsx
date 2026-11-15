import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  FileAudio,
  Youtube,
  ArrowUpRight,
  MoreHorizontal,
  AudioLines,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import EmptyState from "../components/EmptyState";
export default function Meetings() {
  const { meetings, setWorkspace } = useWorkspace();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const list = useMemo(
    () =>
      meetings.filter(
        (m) =>
          (m.title || "").toLowerCase().includes(query.toLowerCase()) &&
          (filter === "all" || String(m.language || "").toLowerCase() === filter)
      ),
    [meetings, query, filter]
  );
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--accent-strong)]">Your library</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-ink">All meetings</h2>
          <p className="mt-1 text-sm text-muted">
            A home for the conversations you have processed.
          </p>
        </div>
        <Link
          to="/meetings/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-white"
        >
          <Plus size={15} /> New recording
        </Link>
      </div>
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 px-2">
          <Search size={16} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search meeting titles…"
            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-line bg-paper px-3 py-2 text-xs text-ink outline-none"
        >
          <option value="all">All languages</option>
          <option value="english">English</option>
          <option value="hinglish">Hinglish</option>
        </select>
      </div>
      {list.length ? (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="grid grid-cols-[minmax(0,1fr)_130px_90px_32px] gap-3 border-b border-line bg-surface-alt px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted">
            <span>Meeting</span>
            <span className="hidden sm:block">Source</span>
            <span>Language</span>
            <span />
          </div>
          {list.map((m) => (
            <div
              key={m.session_id}
              className="grid grid-cols-[minmax(0,1fr)_130px_90px_32px] items-center gap-3 border-b border-line px-5 py-4 last:border-0 hover:bg-paper/70"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  {String(m.source || "").includes("youtube") ? (
                    <Youtube size={17} />
                  ) : (
                    <FileAudio size={17} />
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    to={`/meetings/${encodeURIComponent(m.session_id)}`}
                    onClick={() => {
                      setWorkspace({
                        session_id: m.session_id,
                        title: m.title || "Untitled recording",
                        transcript: m.transcript || "",
                        summary: m.summary || "",
                        actionItems: m.actionItems ?? "",
                        decisions: m.decisions ?? "",
                        questions: m.questions ?? "",
                        source: m.source || "",
                        language: m.language || "english",
                      });
                    }}
                    className="block truncate text-sm font-semibold text-ink hover:text-[var(--accent-strong)]"
                  >
                    {m.title || "Untitled recording"}
                  </Link>
                  <p className="mt-1 truncate text-[11px] text-muted">
                    {m.summary ? m.summary.slice(0, 95) : "Transcript and meeting notes"}
                  </p>
                </div>
              </div>
              <span className="hidden truncate text-xs text-muted sm:block">
                {m.source || "Uploaded media"}
              </span>
              <span className="text-[11px] capitalize text-muted">
                {m.language || "English"}
              </span>
              <Link
                to={`/meetings/${encodeURIComponent(m.session_id)}`}
                onClick={() => {
                  setWorkspace({
                    session_id: m.session_id,
                    title: m.title || "Untitled recording",
                    transcript: m.transcript || "",
                    summary: m.summary || "",
                    actionItems: m.actionItems ?? "",
                    decisions: m.decisions ?? "",
                    questions: m.questions ?? "",
                    source: m.source || "",
                    language: m.language || "english",
                  });
                }}
                className="text-muted hover:text-[var(--accent-strong)]"
                aria-label="Open meeting"
              >
                <ArrowUpRight size={17} />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
            <AudioLines size={22} />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-ink">
            {meetings.length
              ? "No matching meetings"
              : "Your library starts with a conversation"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            {meetings.length
              ? "Try another search or language filter."
              : "Upload an audio or video file, or paste a YouTube link. Voxora will turn it into notes, decisions and follow-ups."}
          </p>
          {!meetings.length && (
            <Link
              to="/meetings/new"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-white"
            >
              <Plus size={15} /> Add your first recording
            </Link>
          )}
        </div>
      )}
      <p className="text-[11px] leading-5 text-muted">
        Library availability: meetings are retained in this active browser workspace only.
        The current backend keeps session/RAG data in memory; refreshing the page or
        restarting the backend can make previous sessions unavailable.
      </p>
    </div>
  );
}
