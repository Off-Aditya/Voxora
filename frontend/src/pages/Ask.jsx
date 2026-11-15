import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowUp, Bot, LoaderCircle, MessagesSquare, UserRound } from "lucide-react";
import { askSession, getApiError } from "../services/api";
import { useWorkspace } from "../context/WorkspaceContext";
import EmptyState from "../components/EmptyState";
import { normalizeChatAnswer, scrollChatToBottom } from "../utils/chatData";
import MarkdownContent from "../components/MarkdownContent";

const suggestions = [
  "What was the main topic?",
  "What decisions were made?",
  "What should happen next?",
];

export default function Ask() {
  const { workspace, chatHistory, setChatHistory } = useWorkspace();
  const { sessionId } = useParams();
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const sendingRef = useRef(false);
  const [lastFailed, setLastFailed] = useState("");

  useEffect(() => {
    scrollChatToBottom(bottomRef.current);
  }, [chatHistory, busy]);

  const send = async (value = question, retry = false) => {
    const prompt = value.trim();
    if (!prompt || sendingRef.current || workspace.session_id !== sessionId) return;
    sendingRef.current = true;
    setQuestion("");
    setError("");
    if (!retry)
      setChatHistory((items) => [
        ...items,
        { id: globalThis.crypto?.randomUUID?.(), role: "user", content: prompt },
      ]);
    setBusy(true);
    try {
      const data = await askSession(sessionId, prompt);
      const answer = normalizeChatAnswer(data, sessionId);
      setChatHistory((items) => [
        ...items,
        {
          id: globalThis.crypto?.randomUUID?.(),
          role: "assistant",
          content: answer,
        },
      ]);
      setLastFailed("");
    } catch (requestError) {
      setError(getApiError(requestError));
      setQuestion(prompt);
      setLastFailed(prompt);
    } finally {
      sendingRef.current = false;
      setBusy(false);
    }
  };

  if (!workspace.session_id || workspace.session_id !== sessionId)
    return (
      <EmptyState
        title="Add a recording before asking"
        description="Once Voxora has prepared your notes, you can ask questions and look up details from the conversation."
      />
    );
  return (
    <div className="mx-auto flex min-h-[calc(100vh-190px)] max-w-3xl flex-col">
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-sage-deep dark:text-[#C7D5C1]">
          A question about your recording
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-ink">
          What would you like to know?
        </h2>
        <p className="mt-2 text-sm text-muted">
          Ask in your own words. Answers are grounded in the transcript.
        </p>
      </div>
      <div className="flex-1 space-y-4 pb-5">
        {!chatHistory.length ? (
          <div className="rounded-2xl border border-line bg-surface px-5 py-10 text-center">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-sage-pale text-sage-deep dark:bg-[#29352B] dark:text-[#C7D5C1]">
              <MessagesSquare size={20} />
            </div>
            <h3 className="mt-4 font-display text-base font-bold text-ink">
              Start with a question
            </h3>
            <p className="mt-2 text-xs text-muted">A few places you could begin:</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {suggestions.map((item) => (
                <button
                  key={item}
                  onClick={() => send(item)}
                  className="rounded-full border border-line bg-surface px-3 py-2 text-[11px] text-body hover:border-sage"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatHistory.map((message, index) => (
            <div
              key={message.id || `${message.role}-${index}`}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
            >
              {message.role === "assistant" && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sage-pale text-sage-deep dark:bg-[#29352B] dark:text-[#C7D5C1]">
                  <Bot size={16} />
                </div>
              )}
              <div
                className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "assistant" ? "border border-line bg-surface text-body" : "bg-sage text-white"}`}
              >
                {message.role === "assistant" ? (
                  <MarkdownContent className="prose-notes text-sm leading-6 text-body">
                    {message.content}
                  </MarkdownContent>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
              {message.role === "user" && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-alt text-muted">
                  <UserRound size={16} />
                </div>
              )}
            </div>
          ))
        )}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <LoaderCircle size={14} className="animate-spin" /> Looking through the
            recording…
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[#E8C9BE] bg-[#FBF0EC] p-3 text-xs text-[#9B5744] dark:border-[#65463C] dark:bg-[#382923] dark:text-[#E9B7A7]"
          >
            {error}
            {lastFailed && (
              <button
                type="button"
                onClick={() => send(lastFailed, true)}
                className="ml-2 font-semibold underline"
              >
                Retry
              </button>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        className="sticky bottom-4 rounded-2xl border border-line bg-surface p-2 shadow-paper"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Ask about something that was said…"
            className="max-h-32 min-h-11 flex-1 resize-y bg-transparent px-3 py-3 text-sm text-ink outline-none placeholder:text-muted"
          />
          <button
            disabled={!question.trim() || busy}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sage text-white hover:bg-sage-deep disabled:opacity-40"
            aria-label="Send question"
          >
            <ArrowUp size={17} />
          </button>
        </div>
      </form>
    </div>
  );
}
