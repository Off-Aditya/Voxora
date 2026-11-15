import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { getApiError } from "../services/api";
import { useWorkspace } from "../context/WorkspaceContext";

export default function RecentMeetings({ onNavigate, limit = 5 }) {
  const { meetings, workspace, deleteMeeting } = useWorkspace();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const remove = async (event, meeting) => {
    event.preventDefault();
    event.stopPropagation();
    const title = meeting.title || "Untitled recording";
    if (!window.confirm(`Delete “${title}” and its chat history from Voxora?`)) return;
    setDeletingId(meeting.session_id);
    setError("");
    try {
      await deleteMeeting(meeting.session_id);
      if (workspace.session_id === meeting.session_id)
        navigate("/meetings", { replace: true });
      onNavigate?.();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="space-y-1">
      {meetings.slice(0, limit).map((meeting) => {
        const title = meeting.title || "Untitled recording";
        return (
          <div
            key={meeting.session_id}
            className="group flex min-w-0 items-center gap-1 rounded-lg hover:bg-surface-alt"
          >
            <Link
              to={`/meetings/${encodeURIComponent(meeting.session_id)}`}
              onClick={onNavigate}
              title={title}
              className="min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-xs text-muted hover:text-ink"
            >
              {title}
            </Link>
            <button
              type="button"
              disabled={deletingId === meeting.session_id}
              onClick={(event) => remove(event, meeting)}
              aria-label={`Delete ${title}`}
              title={`Delete ${title}`}
              className="mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted opacity-60 hover:bg-[#FBF0EC] hover:text-[#9B5744] focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-40"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}
      {!meetings.length && (
        <p className="px-3 py-2 text-[11px] leading-5 text-muted">
          Your recent recordings will appear here.
        </p>
      )}
      {error && (
        <p role="alert" className="px-3 py-2 text-[11px] leading-5 text-[#9B5744]">
          {error}
        </p>
      )}
    </div>
  );
}
