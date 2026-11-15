import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useParams } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
const headings = {
  "/": ["Home", "Your conversations, organized."],
  "/meetings": ["Meetings", "Browse and revisit your recordings."],
  "/meetings/new": ["New recording", "Bring a conversation into Voxora."],
  "/summary": ["Meeting workspace", "Your conversation, made useful."],
  "/extract": ["Action items", "The next steps worth following up."],
  "/ask": ["Ask Voxora", "Get answers from your meeting transcript."],
  "/settings": ["Settings", "Manage your Voxora experience."],
};
export default function Header({ onMenuClick }) {
  const { pathname } = useLocation();
  const { sessionId } = useParams();
  const { workspace, meetings, workflow } = useWorkspace();
  const meeting = meetings.find((item) => item.session_id === sessionId) || workspace;
  const meetingTab = pathname.endsWith("/transcript")
    ? "Transcript"
    : pathname.endsWith("/actions")
      ? "Action items"
      : pathname.endsWith("/decisions")
        ? "Decisions"
        : pathname.endsWith("/questions")
          ? "Questions"
          : pathname.endsWith("/ask")
            ? "Ask Voxora"
            : "Overview";
  const [title, subtitle] = sessionId
    ? [
        meetingTab,
        meeting.session_id === sessionId
          ? meeting.title || "Meeting workspace"
          : "Opening meeting workspace",
      ]
    : pathname === "/meetings/new" && workflow.busy
      ? ["Processing recording", "Your meeting will open here when processing finishes."]
      : headings[pathname] || headings["/"];
  return (
    <header className="sticky top-0 z-20 flex min-h-[72px] items-center justify-between border-b border-line bg-surface/90 px-5 backdrop-blur-md sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-alt lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={19} />
        </button>
        <div>
          <h1 className="font-display text-[17px] font-bold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-0.5 hidden text-[11px] text-muted sm:block">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
