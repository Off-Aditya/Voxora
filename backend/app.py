import uuid
import logging
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool
from main import run_pipeline

load_dotenv()


app = FastAPI(
    title="Voxora API",
    description="AI-powered media intelligence backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DOWNLOAD_DIR = Path("downloads")
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

sessions: dict[str, dict] = {}
logger = logging.getLogger("voxora.api")


class SessionRequest(BaseModel):
    session_id: str


class ChatRequest(BaseModel):
    session_id: str
    question: str


@app.get("/")
def root():
    return {"message": "Voxora API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/transcribe")
async def transcribe(
    file: Optional[UploadFile] = File(default=None),
    url: Optional[str] = Form(default=None),
    language: str = Form(default="english"),
):
    if file is None and not url:
        raise HTTPException(
            status_code=400,
            detail="Upload an audio/video file or provide a YouTube URL.",
        )
    if file is not None and url and url.strip():
        raise HTTPException(status_code=400, detail="Provide either an uploaded file or a YouTube URL, not both.")

    language = language.lower().strip()
    if language not in {"english", "hinglish"}:
        raise HTTPException(
            status_code=400,
            detail="Language must be either 'english' or 'hinglish'.",
        )

    source = url.strip() if url else None
    if source:
        parsed = urlparse(source)
        if parsed.scheme not in {"http", "https"} or parsed.hostname not in {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"}:
            raise HTTPException(status_code=400, detail="Enter a valid YouTube URL.")
    saved_file = None

    if file is not None:
        if not file.filename:
            raise HTTPException(
                status_code=400, detail="Uploaded file has no filename."
            )

        safe_name = Path(file.filename).name
        saved_file = DOWNLOAD_DIR / f"{uuid.uuid4().hex}_{safe_name}"

        try:
            content = await file.read()
            if not content:
                raise HTTPException(status_code=400, detail="Uploaded file is empty.")
            saved_file.write_bytes(content)
            source = str(saved_file)
        finally:
            await file.close()

    if not source:
        raise HTTPException(
            status_code=400, detail="No valid media source was provided."
        )

    try:
        result = await run_in_threadpool(run_pipeline, source, language)
    except Exception as exc:
        logger.error("Transcription pipeline failed (%s).", type(exc).__name__)
        raise HTTPException(
            status_code=500, detail="Voxora could not process this recording. Check the media format and backend configuration, then try again."
        ) from exc
    finally:
        if saved_file:
            saved_file.unlink(missing_ok=True)

    session_id = str(uuid.uuid4())

    sessions[session_id] = {
        "title": result["title"],
        "transcript": result["transcript"],
        "summary": result["summary"],
        "action_items": result["action_items"],
        "key_decisions": result["key_decisions"],
        "open_questions": result["open_questions"],
        "rag_chain": result["rag_chain"],
    }

    return {
        "session_id": session_id,
        "title": result["title"],
        "transcript": result["transcript"],
        "summary": result["summary"],
        "action_items": result["action_items"],
        "key_decisions": result["key_decisions"],
        "open_questions": result["open_questions"],
        "language": language,
        "source": file.filename if file else url,
    }


@app.post("/api/summarize")
def summarize_session(request: SessionRequest):
    session = sessions.get(request.session_id)
    if not session:
        raise HTTPException(
            status_code=404, detail="Session not found. Transcribe the media again."
        )

    return {
        "session_id": request.session_id,
        "title": session["title"],
        "summary": session["summary"],
    }


@app.post("/api/extract")
def extract_session(request: SessionRequest):
    session = sessions.get(request.session_id)
    if not session:
        raise HTTPException(
            status_code=404, detail="Session not found. Transcribe the media again."
        )

    return {
        "session_id": request.session_id,
        "action_items": session["action_items"],
        "key_decisions": session["key_decisions"],
        "open_questions": session["open_questions"],
    }


@app.delete("/api/sessions/{session_id}", status_code=204)
def delete_session(session_id: str):
    if sessions.pop(session_id, None) is None:
        raise HTTPException(status_code=404, detail="Session not found.")
    return Response(status_code=204)


@app.post("/api/chat")
def chat(request: ChatRequest):
    session = sessions.get(request.session_id)
    if not session:
        raise HTTPException(
            status_code=404, detail="Session not found. Transcribe the media again."
        )

    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        answer = run_chat_question(session["rag_chain"], question)
    except Exception as exc:
        logger.error("Chat request failed (%s).", type(exc).__name__)
        raise HTTPException(
            status_code=500, detail="Voxora could not answer right now. Please try again."
        ) from exc

    return {
        "session_id": request.session_id,
        "question": question,
        "answer": answer,
    }


def run_chat_question(rag_chain, question: str) -> str:
    from core.rag_engine import ask_question

    return ask_question(rag_chain, question)
