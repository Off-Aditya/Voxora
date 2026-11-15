import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { deleteMeetingSession, getApiError, transcribeMedia } from "../services/api";
import { removeSelectedFile } from "../services/workflowStorage";
import { toMeetingRecord } from "../utils/meetingData";
import { normalizeChatHistory } from "../utils/chatData";

const WorkspaceContext = createContext(null);
const emptyWorkspace = {
  session_id: "",
  title: "",
  transcript: "",
  summary: "",
  actionItems: "",
  decisions: "",
  questions: "",
  source: "",
  language: "english",
};
const read = (key, fallback) => {
  try {
    return JSON.parse(sessionStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (import.meta.env.DEV) console.warn(`Could not persist Voxora ${key}.`, error);
  }
};

export function WorkspaceProvider({ children }) {
  const [meetings, setMeetings] = useState(() => read("voxora-meetings", []));
  const [workspace, setWorkspace] = useState(() => {
    const saved = read("voxora-workspace", emptyWorkspace);
    return meetings.find((meeting) => meeting.session_id === saved.session_id) || saved;
  });
  const [chatBySession, setChatBySession] = useState(() => {
    const saved = read("voxora-chats", {});
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
    return Object.fromEntries(
      Object.entries(saved).map(([id, history]) => [id, normalizeChatHistory(history)])
    );
  });
  const [workflow, setWorkflow] = useState(() => {
    const saved = read("voxora-workflow-form", {});
    let interrupted = false;
    try {
      interrupted = sessionStorage.getItem("voxora-processing") === "true";
    } catch {
      /* Browser storage may be disabled. */
    }
    return {
      file: null,
      url: saved.url || "",
      language: saved.language || "english",
      busy: false,
      error: interrupted
        ? "The browser was refreshed while processing. The backend does not expose job recovery; your selected media is saved so you can retry."
        : "",
    };
  });
  const addMeeting = (session) =>
    setMeetings((items) => [
      session,
      ...items.filter((m) => m.session_id !== session.session_id),
    ]);
  const deleteMeeting = useCallback(
    async (sessionId) => {
      try {
        await deleteMeetingSession(sessionId);
      } catch (error) {
        if (error.response?.status !== 404) throw error;
      }
      setMeetings((items) => items.filter((meeting) => meeting.session_id !== sessionId));
      setChatBySession((items) => {
        const next = { ...items };
        delete next[sessionId];
        return next;
      });
      if (workspace.session_id === sessionId) setWorkspace(emptyWorkspace);
    },
    [workspace.session_id]
  );
  useEffect(() => {
    write("voxora-workspace", { session_id: workspace.session_id });
  }, [workspace]);
  useEffect(() => {
    write("voxora-meetings", meetings);
  }, [meetings]);
  useEffect(() => {
    write("voxora-chats", chatBySession);
  }, [chatBySession]);
  useEffect(() => {
    write("voxora-workflow-form", { url: workflow.url, language: workflow.language });
  }, [workflow.url, workflow.language]);

  const startProcessing = async (input) => {
    if (workflow.busy) return;
    try {
      sessionStorage.setItem("voxora-processing", "true");
    } catch {
      /* Current-page workflow state remains available. */
    }
    setWorkflow({ ...input, busy: true, error: "" });
    try {
      const data = await transcribeMedia(input);
      if (!data?.session_id || !data?.transcript)
        throw new Error("The backend response was incomplete. No meeting was saved.");
      const meeting = toMeetingRecord(data, input);
      setWorkspace(meeting);
      addMeeting(meeting);
      setWorkflow({ file: null, url: "", language: "english", busy: false, error: "" });
      try {
        sessionStorage.removeItem("voxora-processing");
      } catch {
        /* Ignore unavailable browser storage. */
      }
      await removeSelectedFile().catch(() => {});
      return meeting;
    } catch (error) {
      const message = getApiError(error);
      try {
        sessionStorage.removeItem("voxora-processing");
      } catch {
        /* Ignore unavailable browser storage. */
      }
      setWorkflow((current) => ({ ...current, busy: false, error: message }));
      throw error;
    }
  };
  const chatHistory = workspace.session_id
    ? chatBySession[workspace.session_id] || []
    : [];
  const setChatHistory = (next) =>
    setChatBySession((all) => ({
      ...all,
      [workspace.session_id]: normalizeChatHistory(
        typeof next === "function" ? next(all[workspace.session_id] || []) : next
      ),
    }));
  const value = useMemo(
    () => ({
      workspace,
      setWorkspace,
      meetings,
      addMeeting,
      deleteMeeting,
      chatHistory,
      setChatHistory,
      workflow,
      setWorkflow,
      startProcessing,
      selectMeeting: (meeting) => setWorkspace(meeting),
    }),
    [workspace, meetings, chatBySession, workflow, deleteMeeting]
  );
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
