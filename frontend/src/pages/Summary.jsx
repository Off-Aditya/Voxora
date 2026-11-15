import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { getApiError, summarizeSession } from "../services/api";
import EmptyState from "../components/EmptyState";
import MarkdownContent from "../components/MarkdownContent";

export default function Summary() {
  const { workspace } = useWorkspace();
  const [summary, setSummary] = useState(workspace.summary || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workspace.session_id) return undefined;
    let active = true;
    setSummary(workspace.summary || "");
    setError("");
    setLoading(true);
    summarizeSession(workspace.session_id)
      .then((data) => {
        if (active) setSummary(typeof data.summary === "string" ? data.summary : "");
      })
      .catch((requestError) => {
        if (active) setError(getApiError(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [workspace.session_id]);

  if (!workspace.session_id)
    return (
      <EmptyState
        title="Your overview will live here"
        description="Add a recording first. Once Voxora processes it, the meeting summary will appear here."
      />
    );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      setError("Clipboard access is unavailable in this browser context.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-sage-deep dark:text-[#C7D5C1]">
            Meeting overview
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-ink">
            {workspace.title || "Untitled recording"}
          </h2>
          <p className="mt-2 text-xs text-muted">
            {workspace.source || "Recording"} · {workspace.language}
          </p>
        </div>
        <button
          onClick={copy}
          disabled={!summary}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs font-semibold text-ink disabled:opacity-50"
        >
          <Copy size={14} />
          Copy summary
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-[#FBF0EC] px-4 py-3 text-xs text-[#9B5744]"
        >
          {error}
        </p>
      )}
      <article className="rounded-2xl border border-line bg-surface px-5 py-6 sm:px-8">
        <h3 className="font-display text-base font-bold text-ink">Summary</h3>
        {loading && !summary ? (
          <p className="mt-3 text-sm text-muted">Loading the saved summary…</p>
        ) : summary ? (
          <MarkdownContent className="prose-notes mt-4 text-sm leading-7 text-body">
            {summary}
          </MarkdownContent>
        ) : (
          <p className="mt-3 text-sm leading-6 text-muted">
            No summary was returned for this meeting.
          </p>
        )}
      </article>
    </div>
  );
}
