import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

import app


class VoxoraApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app.app)
        app.sessions.clear()

    def tearDown(self):
        app.sessions.clear()

    def test_health(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_extract_returns_three_independent_contract_fields(self):
        app.sessions["session-1"] = {
            "action_items": "- Send proposal",
            "key_decisions": "- Keep current date",
            "open_questions": "- Who approves?",
        }
        response = self.client.post("/api/extract", json={"session_id": "session-1"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "session_id": "session-1",
            "action_items": "- Send proposal",
            "key_decisions": "- Keep current date",
            "open_questions": "- Who approves?",
        })

    def test_chat_success_sends_question_to_existing_route(self):
        app.sessions["session-1"] = {"rag_chain": object()}
        with patch("app.run_chat_question", return_value="The proposal is due Friday.") as ask:
            response = self.client.post("/api/chat", json={"session_id": "session-1", "question": "When is the proposal due?"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["answer"], "The proposal is due Friday.")
        ask.assert_called_once_with(app.sessions["session-1"]["rag_chain"], "When is the proposal due?")

    def test_chat_missing_session_returns_404(self):
        response = self.client.post("/api/chat", json={"session_id": "missing", "question": "Hello?"})
        self.assertEqual(response.status_code, 404)

    def test_delete_session_removes_meeting_and_rag_chain(self):
        app.sessions["session-1"] = {"title": "Test", "rag_chain": object()}
        response = self.client.delete("/api/sessions/session-1")
        self.assertEqual(response.status_code, 204)
        self.assertNotIn("session-1", app.sessions)
        self.assertEqual(self.client.post("/api/chat", json={"session_id": "session-1", "question": "Hello?"}).status_code, 404)

    def test_delete_missing_session_returns_404(self):
        self.assertEqual(self.client.delete("/api/sessions/missing").status_code, 404)

    def test_chat_provider_error_is_safe_http_error(self):
        app.sessions["session-1"] = {"rag_chain": object()}
        with patch("app.run_chat_question", side_effect=RuntimeError("provider detail")):
            response = self.client.post("/api/chat", json={"session_id": "session-1", "question": "Hello?"})
        self.assertEqual(response.status_code, 500)
        self.assertNotIn("provider detail", response.text)

    def test_transcribe_rejects_invalid_source_and_language(self):
        self.assertEqual(self.client.post("/api/transcribe").status_code, 400)
        self.assertEqual(self.client.post("/api/transcribe", data={"url": "https://example.com/x", "language": "english"}).status_code, 400)
        self.assertEqual(self.client.post("/api/transcribe", data={"url": "https://youtube.com/watch?v=x", "language": "french"}).status_code, 400)

    def test_pipeline_initialization_failure_is_safe(self):
        with patch("app.run_pipeline", side_effect=RuntimeError("private provider details")):
            response = self.client.post("/api/transcribe", data={"url": "https://youtube.com/watch?v=x", "language": "english"})
        self.assertEqual(response.status_code, 500)
        self.assertNotIn("private provider details", response.text)


if __name__ == "__main__":
    unittest.main()
