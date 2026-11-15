import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FileAudio, FileVideo, Link2, LoaderCircle, UploadCloud, X } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { restoreSelectedFile, storeSelectedFile } from "../services/workflowStorage";

const allowed = /\.(mp3|wav|m4a|mp4|mpeg|webm|ogg|aac|flac)$/i;

export default function Transcribe() {
  const inputRef = useRef(null);
  const { workflow, setWorkflow, startProcessing } = useWorkspace();
  const navigate = useNavigate();
  const { file, url, language, busy, error } = workflow;
  const setFile = (value) => {
    setWorkflow((current) => ({ ...current, file: value }));
    storeSelectedFile(value).catch(() =>
      setError("This browser could not save the selected file for recovery.")
    );
  };
  const setUrl = (value) => setWorkflow((current) => ({ ...current, url: value }));
  const setLanguage = (value) =>
    setWorkflow((current) => ({ ...current, language: value }));
  const setError = (value) => setWorkflow((current) => ({ ...current, error: value }));

  useEffect(() => {
    if (file) return;
    restoreSelectedFile()
      .then((savedFile) => {
        if (savedFile)
          setWorkflow((current) =>
            current.file ? current : { ...current, file: savedFile }
          );
      })
      .catch(() => {});
  }, []);

  const selectFile = (next) => {
    if (!next) return;
    if (!allowed.test(next.name)) {
      setFile(null);
      setError("That file type is not supported. Choose an audio or video file.");
      return;
    }
    setFile(next);
    setUrl("");
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    if (!file && !url.trim()) {
      setError("Choose a file or paste a YouTube link.");
      return;
    }
    if (url.trim() && !/^https?:\/\//i.test(url.trim())) {
      setError("Enter a complete link beginning with http:// or https://.");
      return;
    }

    try {
      const meeting = await startProcessing({ file, url: url.trim(), language });
      if (meeting)
        navigate(`/meetings/${encodeURIComponent(meeting.session_id)}`, {
          replace: true,
        });
    } catch {
      /* Error is retained in shared workflow state for retry. */
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-sage-deep dark:text-[#C7D5C1]">
          Start with a recording
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-ink">
          What would you like Voxora to listen to?
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Choose a file from your device, or paste a YouTube link. We’ll prepare the notes
          for you.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            selectFile(e.dataTransfer.files?.[0]);
          }}
          className="rounded-2xl border border-dashed border-line bg-surface px-6 py-9 text-center transition hover:border-sage"
        >
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,video/*,.mp3,.wav,.m4a,.mp4,.mpeg,.webm"
            className="hidden"
            onChange={(e) => selectFile(e.target.files?.[0])}
          />
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sage-pale text-sage-deep dark:bg-[#29352B] dark:text-[#C7D5C1]">
            <UploadCloud size={22} />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-ink">Drop a file here</h3>
          <p className="mt-1 text-xs text-muted">Audio and video formats are welcome.</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-5 rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-semibold text-ink hover:bg-surface-alt"
          >
            Browse files
          </button>
          <p className="mt-3 text-[10px] text-muted">MP3 · WAV · M4A · MP4 · WEBM</p>
        </div>
        {file && (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-sage-pale/70 p-3 dark:bg-[#29352B]">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-sage-deep">
              {file.type.startsWith("video") ? (
                <FileVideo size={17} />
              ) : (
                <FileAudio size={17} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">{file.name}</p>
              <p className="mt-1 text-[10px] text-muted">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              aria-label="Remove file"
              className="text-muted hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-line" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            or use a link
          </span>
          <div className="h-px flex-1 bg-line" />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink">
            <Link2 size={14} className="text-sage-deep" /> YouTube URL
          </label>
          <input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (e.target.value) setFile(null);
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none placeholder:text-muted focus:border-sage"
          />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="mb-3 text-xs font-semibold text-ink">Spoken language</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["english", "English", "Whisper transcription"],
              ["hinglish", "Hinglish", "Sarvam AI · translated into English"],
            ].map(([value, label, detail]) => (
              <button
                type="button"
                key={value}
                onClick={() => setLanguage(value)}
                className={`rounded-xl border p-4 text-left ${language === value ? "border-sage bg-sage-pale/70 dark:bg-[#29352B]" : "border-line bg-surface hover:border-sage/60"}`}
              >
                <span className="text-sm font-semibold text-ink">{label}</span>
                <p className="mt-1 text-xs text-muted">{detail}</p>
              </button>
            ))}
          </div>
        </div>
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[#E8C9BE] bg-[#FBF0EC] px-4 py-3 text-xs text-[#9B5744] dark:border-[#65463C] dark:bg-[#382923] dark:text-[#E9B7A7]"
          >
            {error}
          </div>
        )}
        {busy && (
          <div className="flex items-center gap-2 rounded-xl bg-sage-pale px-4 py-3 text-xs leading-5 text-sage-deep dark:bg-[#29352B] dark:text-[#C7D5C1]">
            <LoaderCircle size={15} className="shrink-0 animate-spin" /> Sending your
            recording to Voxora. Longer recordings can take a few minutes. You can
            navigate away and return to this processing screen.
          </div>
        )}
        <button
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sage px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-sage-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <>
              <LoaderCircle size={16} className="animate-spin" /> Working on your
              recording…
            </>
          ) : (
            "Create my notes"
          )}
        </button>
      </form>
      <p className="px-1 text-xs leading-5 text-muted">
        Voxora prepares the transcript, summary, extracted details and question-answering
        knowledge base in one run.
      </p>
    </div>
  );
}
