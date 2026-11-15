import os
import re
from utils.audio_processor import process_input
from core.transcriber import transcribe_all
from core.summarizer import summarize, generate_title
from core.extractor import (
    extract_action_items,
    extract_key_decisions,
    extract_questions,
)
from core.rag_engine import build_rag_chain, ask_question
from dotenv import load_dotenv

load_dotenv()


def run_pipeline(source: str, language: str = "english") -> dict:
    print("\nStarting Voxora AI Media Intelligence...")
    print("-" * 50)

    chunks = []
    try:
        print("\n[1/6] Processing audio...")
        chunks = process_input(source)

        print("\n[2/6] Transcribing audio...")
        transcript = transcribe_all(chunks, language=language)
        if not transcript.strip():
            raise RuntimeError("No speech was detected in the recording.")
        print(f"Transcription completed ({len(transcript)} characters).")

        print("\n[3/6] Generating meeting title...")
        title = generate_title(transcript)

        print("\n[4/6] Generating meeting summary...")
        summary = summarize(transcript)

        print("\n[5/6] Extracting meeting insights...")
        action_items = extract_action_items(transcript)
        key_decisions = extract_key_decisions(transcript)
        open_questions = extract_questions(transcript)

        print("\n[6/6] Building RAG knowledge base...")
        rag_chain = build_rag_chain(transcript)

        print("\nVoxora processing completed successfully.")
        print("-" * 50)
        return {
            "title": title,
            "transcript": transcript,
            "summary": summary,
            "action_items": action_items,
            "key_decisions": key_decisions,
            "open_questions": open_questions,
            "rag_chain": rag_chain,
        }
    finally:
        for chunk in chunks:
            if os.path.isfile(chunk):
                os.remove(chunk)
        if chunks:
            audio_path = re.sub(r"_chunk_\d+\.wav$", ".wav", chunks[0])
            if os.path.isfile(audio_path):
                os.remove(audio_path)


def display_results(result: dict) -> None:
    print("\n" + "=" * 60)
    print("                 VOXORA RESULTS")
    print("=" * 60)

    print(f"\nTitle:\n{result['title']}")

    print(f"\nMeeting Summary:\n{result['summary']}")

    print(f"\nAction Items:\n{result['action_items']}")

    print(f"\nKey Decisions:\n{result['key_decisions']}")

    print(f"\nOpen Questions:\n{result['open_questions']}")

    print("\n" + "=" * 60)


def chat_with_meeting(rag_chain) -> None:
    print("\nVoxora Meeting Assistant")
    print("Ask questions about your meeting transcript.")
    print("Type 'exit' to end the conversation.\n")

    while True:
        question = input("You: ").strip()

        if question.lower() in ["exit", "quit", "q"]:
            print("Voxora: Goodbye!")
            break

        if not question:
            continue

        answer = ask_question(rag_chain, question)
        print(f"\nVoxora: {answer}\n")


if __name__ == "__main__":
    source = input("Enter YouTube URL or local file path: ").strip()

    language = (
        input("Select language (english/hinglish): ").strip().lower() or "english"
    )

    result = run_pipeline(source, language)

    display_results(result)

    chat_with_meeting(result["rag_chain"])
