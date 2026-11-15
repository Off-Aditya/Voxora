import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { Copy, Search } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import MarkdownContent from "../components/MarkdownContent";
import { normalizeExtractContent } from "../utils/meetingData";

const tabs = [
  ["", "Overview"],
  ["transcript", "Transcript"],
  ["actions", "Action items"],
  ["decisions", "Decisions"],
  ["questions", "Questions"],
  ["ask", "Ask Voxora"],
];
export function MeetingLayout() {
  const { sessionId } = useParams();
  const { meetings, workspace, setWorkspace } = useWorkspace();
  const location = useLocation();
  const meeting =
    meetings.find((item) => item.session_id === sessionId) ||
    (workspace.session_id === sessionId ? workspace : null);
  useEffect(() => {
    if (meeting && workspace.session_id !== meeting.session_id) setWorkspace(meeting);
  }, [meeting, workspace.session_id, setWorkspace]);
  if (!meeting)
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-8">
        <h2 className="font-display text-xl font-bold text-ink">
          Meeting workspace unavailable
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          This meeting is not saved in this browser session. The backend keeps meeting and
          RAG sessions in memory, so a refresh or backend restart can make a session
          unavailable.
        </p>
        <div className="mt-5 flex gap-3">
          <Link
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white"
            to="/meetings"
          >
            Meeting library
          </Link>
          <Link
            className="rounded-lg border border-line px-4 py-2 text-sm text-ink"
            to="/meetings/new"
          >
            Start a recording
          </Link>
        </div>
      </div>
    );
  const base = `/meetings/${encodeURIComponent(sessionId)}`;
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs capitalize text-muted">
              {meeting.source || "Recording"} · {meeting.language || "english"}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink">
              {meeting.title || "Untitled recording"}
            </h2>
          </div>
          <Link to="/meetings" className="text-sm text-[var(--accent-strong)]">
            All meetings
          </Link>
        </div>
        <nav className="mt-5 flex gap-1 overflow-x-auto border-b border-line">
          {tabs.map(([suffix, label]) => (
            <NavLink
              key={suffix || "overview"}
              end={!suffix}
              to={suffix ? `${base}/${suffix}` : base}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold ${isActive ? "border-[var(--accent)] text-[var(--accent-strong)]" : "border-transparent text-muted hover:text-ink"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      {workspace.session_id !== meeting.session_id ? (
        <div className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">
          Opening {meeting.title || "meeting"}…
        </div>
      ) : location.pathname.endsWith("/transcript") ? (
        <TranscriptView transcript={meeting.transcript} />
      ) : location.pathname.endsWith("/decisions") ||
        location.pathname.endsWith("/questions") ? (
        <InsightView
          meeting={meeting}
          section={location.pathname.endsWith("/decisions") ? "decisions" : "questions"}
        />
      ) : (
        <Outlet />
      )}
    </div>
  );
}
function TranscriptView({ transcript = "" }) {
  const [query, setQuery] = useState("");
  const chunks = useMemo(() => {
    if (!query.trim()) return [{ value: transcript, match: false }];
    const result = [];
    const source = transcript.toLowerCase();
    const needle = query.toLowerCase();
    let cursor = 0;
    while (cursor < transcript.length) {
      const found = source.indexOf(needle, cursor);
      if (found < 0) {
        result.push({ value: transcript.slice(cursor), match: false });
        break;
      }
      if (found > cursor)
        result.push({ value: transcript.slice(cursor, found), match: false });
      result.push({ value: transcript.slice(found, found + query.length), match: true });
      cursor = found + query.length;
    }
    return result;
  }, [transcript, query]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
    } catch {
      /* Clipboard may be unavailable outside secure contexts. */
    }
  };
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex flex-1 items-center gap-2 rounded-lg border border-line px-3 py-2">
          <Search size={15} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcript"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
        <button
          onClick={copy}
          className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink"
        >
          <Copy size={14} />
          Copy
        </button>
      </div>
      {transcript ? (
        <p className="prose-notes mt-5 whitespace-pre-wrap text-sm leading-7 text-body">
          {chunks.map((chunk, index) =>
            chunk.match ? (
              <mark key={index}>{chunk.value}</mark>
            ) : (
              <span key={index}>{chunk.value}</span>
            )
          )}
        </p>
      ) : (
        <p className="mt-5 text-sm text-muted">
          Transcript is not available in this saved browser session.
        </p>
      )}
    </section>
  );
}
function InsightView({ meeting, section }) {
  const value = normalizeExtractContent(
    section === "decisions" ? meeting.decisions : meeting.questions
  );
  const title = section === "decisions" ? "Decisions" : "Open questions";
  const hasContent = Array.isArray(value) ? value.length > 0 : Boolean(value.trim());
  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      {hasContent ? (
        Array.isArray(value) ? (
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-body">
            {value.map((item, index) => (
              <li key={index}>
                <MarkdownContent>{item}</MarkdownContent>
              </li>
            ))}
          </ul>
        ) : (
          <MarkdownContent className="prose-notes mt-4 text-sm leading-6 text-body">
            {value}
          </MarkdownContent>
        )
      ) : (
        <p className="mt-3 text-sm text-muted">
          No {title.toLowerCase()} were identified in this meeting.
        </p>
      )}
    </section>
  );
}
