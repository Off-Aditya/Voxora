# Voxora frontend

A warm, sage-accented workspace for turning recordings into useful notes. The interface supports light and dark appearance, file/YouTube transcription, meeting notes, extracted insights and transcript-grounded Q&A.

## Requirements

- Node.js 20 or newer
- npm
- Voxora FastAPI backend running locally

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows Command Prompt, copy the environment file with:

```cmd
copy .env.example .env
```

Open `http://localhost:5173`.

## Backend

By default, requests go to `http://127.0.0.1:8000`. Change `VITE_API_BASE_URL` in `.env` if needed.

The frontend uses the routes found in the supplied `app.py`:

| Method | Route | Request |
|---|---|---|
| GET | `/health` | No body |
| POST | `/api/transcribe` | Multipart: `file` or `url`, plus `language` |
| POST | `/api/summarize` | JSON: `session_id` |
| POST | `/api/extract` | JSON: `session_id` |
| POST | `/api/chat` | JSON: `session_id`, `question` |
| DELETE | `/api/sessions/{session_id}` | Remove the in-memory meeting and RAG session |

The transcription request has no Axios timeout because the backend runs the full synchronous pipeline before responding. Other requests use a 120-second timeout.

The response's `action_items`, `key_decisions` and `open_questions` are handled as strings or arrays, matching the supplied extractor's string return values.

## Formatting and build

```bash
npm run format
npm run format:check
npm run build
npm test
```

## Persistence notes

- Meeting notes and chat history persist in `sessionStorage` for the browser tab session. Selected media is stored in IndexedDB for upload-form recovery.
- The FastAPI app stores RAG chains in a process-local dictionary. Sessions are not durable across backend restarts or multiple workers; browser storage cannot restore a lost backend session.
- A refresh during synchronous transcription cannot reconnect to the in-flight backend call. Voxora reports the interruption and permits a manual retry.
- The frontend does not alter or duplicate the Python pipeline.
- Light/dark preference is saved in browser local storage.
