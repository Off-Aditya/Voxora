# Voxora

Voxora turns audio and video recordings into transcripts, meeting summaries, extracted follow-ups, decisions and open questions, with transcript-grounded chat.

## Architecture

- **Frontend:** React 18, Vite, React Router, Axios and Tailwind CSS. `WorkspaceContext` owns the active meeting, meeting library, chat history and recording workflow. Meeting pages share a route-aware workspace shell.
- **Backend:** FastAPI accepts a file or YouTube URL and runs the synchronous media pipeline in a worker thread. The pipeline uses FFmpeg, Whisper or Sarvam for transcription, Groq through LangChain for summaries and extraction, and Chroma/Hugging Face embeddings for retrieval.
- **API:** The existing `/api/transcribe`, `/api/summarize`, `/api/extract` and `/api/chat` contracts remain in place. The frontend defaults to `http://127.0.0.1:8000`.

## Requirements and setup

- Node.js 20+ and npm.
- Python 3.10+ (the checked project virtual environment uses Python 3.13).
- FFmpeg available on `PATH` for media conversion and chunking.
- Groq credentials for generated title, summary, extraction and RAG answers. Hinglish transcription also requires Sarvam credentials.

From the repository root, install frontend dependencies and prepare the backend environment:

```powershell
cd frontend
npm install
cd ..\backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Create `backend/.env` with provider credentials as needed. Variable names and placeholders:

```dotenv
GROQ_API_KEY=your-groq-api-key
SARVAM_API_KEY=your-sarvam-api-key
SARVAM_STT_MODEL=saaras:v2.5
WHISPER_MODEL=small
```

Start the backend from the `backend` directory:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Start the frontend in another terminal from the `frontend` directory:

```powershell
npm run dev
```

Open <http://localhost:5173>. To use a different backend address, create `frontend/.env` with `VITE_API_BASE_URL=http://127.0.0.1:8000` and restart Vite.

## Meeting workflow

1. Open **New recording** and choose one supported media file or a YouTube URL.
2. Select English or Hinglish and submit. The backend runs the full pipeline synchronously; the frontend does not invent staged progress.
3. On success, Voxora opens `/meetings/{session_id}`. The meeting tabs keep that session ID in the URL.
4. The Overview shows the backend summary and extracted categories. Transcript, Action Items, Decisions, Questions and Ask Voxora each show their own content.

## API

| Method | Path | Input | Success response |
|---|---|---|---|
| `GET` | `/` | — | API status message |
| `GET` | `/health` | — | `{"status":"ok"}` |
| `POST` | `/api/transcribe` | Multipart: `file` **or** `url`; `language` (`english` or `hinglish`) | Session ID, title, transcript, summary, `action_items`, `key_decisions`, `open_questions`, language and source |
| `POST` | `/api/summarize` | JSON `{"session_id":"…"}` | Session ID, title and summary |
| `POST` | `/api/extract` | JSON `{"session_id":"…"}` | Session ID and independent `action_items`, `key_decisions`, `open_questions` fields |
| `POST` | `/api/chat` | JSON `{"session_id":"…","question":"…"}` | Session ID, question and backend-generated answer |
| `DELETE` | `/api/sessions/{session_id}` | Session ID in the path | `204 No Content`; removes the process-local session and its RAG chain |

Transcription has no Axios timeout because the backend responds only after the synchronous pipeline finishes. Other API calls use a 120-second client timeout. Missing backend sessions return HTTP 404; provider/pipeline failures return safe HTTP 500 details without returning provider tracebacks.

## State and persistence limitations

- Meeting data and chat history are held in `sessionStorage` for the current browser tab session. Selected media is stored in IndexedDB to support a return to the recording form. Theme preference uses `localStorage`.
- The backend stores sessions and RAG chains in a process-local dictionary. A backend restart, another worker, or a lost process removes those sessions. Frontend storage cannot restore a backend RAG chain. Saved notes may still display, while chat and backend actions report that the session is unavailable.
- A page refresh during a synchronous transcription request cannot recover its server job: there is no job-status endpoint. Voxora shows an interruption message and allows a user to retry; it does not claim the previous request completed or automatically submit a duplicate.
- Deleting a meeting from the recent-meetings panel removes its browser copy and chat history and requests deletion of the in-memory backend session. If that backend session has already expired, the browser copy is still removed.
- The RAG chain is transient and meeting-specific. It does not provide durable storage or multi-turn model memory beyond the frontend's displayed chat history.

## Tests and checks

From `frontend`:

```powershell
npm test
npm run format:check
npm run build
```

From `backend`:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m compileall -q app.py main.py core utils
```

The deterministic chat API tests mock the RAG/provider call. They verify the HTTP contract and safe error handling, not live Groq/Sarvam/Whisper inference.

## Troubleshooting

### Ask Voxora

- Confirm FastAPI is running at the configured `VITE_API_BASE_URL` and that `/health` returns `{"status":"ok"}`.
- A 404 from `/api/chat` means the backend no longer has that session. Reprocess the recording to create a new backend session; saved browser notes do not restore RAG state.
- Provider failures appear as an inline message. Check backend logs for the exception class and provider configuration without sharing API keys.
- In development, the application error boundary logs render exceptions to the browser console. The reproduced Ask error was caused by returning `scrollIntoView()` from the effect callback; the verified fix and browser reproduction are recorded below. Backend 404 responses mean the RAG session is gone, not that the frontend notes were erased.

### Markdown and extraction

- Summary and extracted text are rendered by the frontend's restricted Markdown parser. It renders headings, emphasis, code, links and lists as React elements; raw HTML is treated as text and unsafe link schemes are not made clickable.
- Extraction fields are mapped independently: `action_items` to Action Items, `key_decisions` to Decisions and `open_questions` to Questions. A missing backend session is shown inline rather than replaced with inferred content.
- Assistant chat messages use the same safe Markdown renderer as meeting notes; user-entered questions remain plain text.

### Media processing

- Ensure FFmpeg is available on `PATH`, the file uses a supported audio/video format, and the selected language has its required provider configuration.
- A failed pipeline does not create a successful meeting. Check backend logs for the exception class, then retry after correcting media or configuration issues.

## Known Issues and Fixes

1. **Ask Voxora runtime error:** Reproducing the meeting-specific route in headless Chrome captured React's warning that `Ask`'s `useEffect` returned a Promise, followed by `TypeError: destroy is not a function` during Strict Mode effect cleanup. The effect's expression returned `scrollIntoView()`; React interpreted that return value as a cleanup callback. The effect now calls a helper from a block body and returns `undefined`. A regression test checks this cleanup contract, and the browser route now renders without an error boundary. Malformed persisted chat entries are also normalized, chat responses are validated, and failures remain inline with retry.
2. **Raw Markdown:** Summary and extraction output was rendered as plain text, exposing Markdown markers. A safe React-element renderer now handles supported Markdown without `dangerouslySetInnerHTML`; parser safety and Markdown structure have automated tests.
3. **Extraction mapping:** The Action Items route rendered follow-ups, decisions and open questions together. The API fields are now normalized independently, and Action Items renders only `action_items`; Decisions and Questions read their own fields. API shape and frontend mapping have tests.
4. **Meeting navigation/session recovery:** Meeting tabs now use the same session-specific route shell; missing browser data and missing backend sessions show explicit recovery state. Meeting/chat/workflow browser-session persistence and route-history behavior are regression-tested. Backend RAG sessions remain process-local. Recent-meeting deletion clears its browser chat and calls the session delete endpoint.
5. **Transcript search:** A route-render regression exposed that an empty search query split the transcript into individual characters. Empty queries now render the transcript as one text segment; non-empty searches use literal string matching.
6. **Cross-meeting retrieval:** Each newly built RAG chain now receives its own transient Chroma collection, avoiding retrieval from a shared collection across meetings.

Unverified areas: live external AI inference and recovery after a backend process restart. Headless Chrome UI smoke tests used an isolated local fixture and a mocked pipeline/chat provider.
