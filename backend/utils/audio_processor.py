import os
import glob
import subprocess
from typing import Any, cast

import yt_dlp

DOWNLOAD_DIR = "../downloads"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)


def run_ffmpeg(args: list[str]) -> None:
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args],
        check=True,
        capture_output=True,
        text=True,
    )


def download_youtube_audio(url: str) -> str:
    output_path = os.path.join(DOWNLOAD_DIR, "%(title)s.%(ext)s")

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_path,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
            }
        ],
        "quiet": True,
        "noplaylist": True,
    }

    with yt_dlp.YoutubeDL(cast(Any, ydl_opts)) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = os.path.splitext(ydl.prepare_filename(info))[0] + ".wav"

    if not os.path.isfile(filename):
        raise FileNotFoundError(f"Audio file not found: {filename}")

    return filename


def convert_to_wav(input_path: str) -> str:
    output_path = os.path.splitext(input_path)[0] + "_converted.wav"

    run_ffmpeg(
        [
            "-i",
            input_path,
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-c:a",
            "pcm_s16le",
            output_path,
        ]
    )

    return output_path


def chunk_audio(wav_path: str, chunk_minutes: int = 10) -> list[str]:
    if chunk_minutes <= 0:
        raise ValueError("chunk_minutes must be greater than zero")

    chunk_seconds = chunk_minutes * 60
    pattern = os.path.splitext(wav_path)[0] + "_chunk_%03d.wav"

    try:
        run_ffmpeg(
            [
                "-i",
                wav_path,
                "-f",
                "segment",
                "-segment_time",
                str(chunk_seconds),
                "-reset_timestamps",
                "1",
                "-ac",
                "1",
                "-ar",
                "16000",
                "-c:a",
                "pcm_s16le",
                pattern,
            ]
        )
    except Exception:
        for partial in glob.glob(os.path.splitext(wav_path)[0] + "_chunk_*.wav"):
            os.remove(partial)
        raise

    base = os.path.splitext(wav_path)[0]
    chunks = []

    for filename in sorted(os.listdir(os.path.dirname(wav_path) or ".")):
        if filename.startswith(
            os.path.basename(base) + "_chunk_"
        ) and filename.endswith(".wav"):
            chunks.append(os.path.join(os.path.dirname(wav_path) or ".", filename))

    if not chunks:
        raise RuntimeError("FFmpeg did not create any audio chunks")

    return chunks


def process_input(source: str) -> list[str]:
    if source.startswith(("http://", "https://")):
        print("Detected YouTube URL. Downloading audio...")
        wav_path = download_youtube_audio(source)
    else:
        print("Detected local file. Converting to WAV...")
        wav_path = convert_to_wav(source)

    print("Chunking audio...")
    try:
        chunks = chunk_audio(wav_path)
    except Exception:
        if os.path.isfile(wav_path):
            os.remove(wav_path)
        raise
    print(f"Audio ready — {len(chunks)} chunk(s) created.")

    return chunks
