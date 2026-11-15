import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { extractSession, getApiError } from "../services/api";
import EmptyState from "../components/EmptyState";
import SectionList from "../components/SectionList";
import { mapExtractResponse } from "../utils/meetingData";

export default function Extract() {
  const { workspace, setWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!workspace.session_id) return undefined;
    let active = true;
    setError("");
    setLoading(true);
    extractSession(workspace.session_id)
      .then((data) => {
        if (active)
          setWorkspace((current) => ({ ...current, ...mapExtractResponse(data) }));
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
  }, [workspace.session_id, setWorkspace]);

  if (!workspace.session_id)
    return (
      <EmptyState
        title="No action items yet"
        description="Add a recording first. Voxora will list follow-up tasks it identifies here."
      />
    );

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-sage-deep dark:text-[#C7D5C1]">
          The useful details
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-ink">Action items</h2>
        <p className="mt-2 text-sm text-muted">
          Follow-up tasks from {workspace.title || "this conversation"}.
        </p>
      </div>
      {loading && (
        <p className="flex items-center gap-2 text-xs text-muted">
          <LoaderCircle size={14} className="animate-spin" />
          Loading action items…
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-[#FBF0EC] px-4 py-3 text-xs text-[#9B5744]"
        >
          {error}
        </p>
      )}
      <article className="rounded-2xl border border-line bg-surface px-5 sm:px-8">
        <SectionList
          number="01"
          title="Follow-ups"
          value={workspace.actionItems}
          emptyText="No action items were identified in this meeting."
        />
      </article>
    </div>
  );
}
