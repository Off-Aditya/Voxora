import whisper
import os
import glob
import tempfile
import subprocess
import requests
from pathlib import Path
from typing import cast
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
SARVAM_STT_TRANSLATE_URL = "https://api.sarvam.ai/speech-to-text-translate"
SARVAM_MODEL = os.getenv("SARVAM_STT_MODEL", "saaras:v2.5")

SARVAM_PIECE_SECONDS = 25

_model = None


def load_model():
    global _model

    if _model is None:
        print(f"Loading Whisper model: {WHISPER_MODEL}...")
        _model = whisper.load_model(WHISPER_MODEL)
        print("Whisper model loaded successfully.")

    return _model


def transcribe_chunk_whisper(chunk_path: str) -> str:
    model = load_model()

    result = model.transcribe(
        chunk_path,
        task="transcribe",
    )

    return cast(str, result["text"]).strip()


def _send_to_sarvam(piece_path: str) -> str:
    if not SARVAM_API_KEY:
        raise RuntimeError("SARVAM_API_KEY is missing from environment.")

    headers = {"api-subscription-key": SARVAM_API_KEY}

    with open(piece_path, "rb") as f:
        files = {"file": (os.path.basename(piece_path), f, "audio/wav")}

        data = {
            "model": SARVAM_MODEL,
            "with_diarization": "false",
        }

        response = requests.post(
            SARVAM_STT_TRANSLATE_URL,
            headers=headers,
            files=files,
            data=data,
            timeout=120,
        )

    if not response.ok:
        print(f"Sarvam API error: {response.status_code}")
        print(f"Response: {response.text}")
        response.raise_for_status()

    return response.json().get("transcript", "").strip()


def transcribe_chunk_sarvam(chunk_path: str) -> str:
    if not SARVAM_API_KEY:
        raise RuntimeError("SARVAM_API_KEY is missing from environment.")

    full_text = ""

    with tempfile.TemporaryDirectory() as temp_dir:
        pattern = os.path.join(temp_dir, "piece_%03d.wav")

        subprocess.run(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                chunk_path,
                "-f",
                "segment",
                "-segment_time",
                str(SARVAM_PIECE_SECONDS),
                "-reset_timestamps",
                "1",
                "-ac",
                "1",
                "-ar",
                "16000",
                "-c:a",
                "pcm_s16le",
                pattern,
            ],
            check=True,
            capture_output=True,
            text=True,
        )

        pieces = sorted(glob.glob(os.path.join(temp_dir, "piece_*.wav")))
        total_pieces = len(pieces)

        if not pieces:
            raise RuntimeError("FFmpeg did not create any Sarvam audio pieces.")

        for i, piece_path in enumerate(pieces, start=1):
            print(f"  Sarvam piece {i}/{total_pieces}...")

            text = _send_to_sarvam(piece_path)
            full_text += text + " "

    return full_text.strip()


def transcribe_chunk(chunk_path: str, language: str = "english") -> str:
    language = language.lower().strip()

    if language == "hinglish":
        return transcribe_chunk_sarvam(chunk_path)

    if language == "english":
        return transcribe_chunk_whisper(chunk_path)

    raise ValueError("Language must be either 'english' or 'hinglish'.")


def transcribe_all(chunks: list[str], language: str = "english") -> str:
    full_transcript = ""

    engine = "Sarvam AI" if language.lower() == "hinglish" else "Whisper"

    print(f"Using {engine} for transcription.")

    for i, chunk in enumerate(chunks, start=1):
        print(f"Transcribing chunk {i}/{len(chunks)}...")

        text = transcribe_chunk(chunk, language=language)
        full_transcript += text + " "

    print("Transcription completed successfully.")

    return full_transcript.strip()
