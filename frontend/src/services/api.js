import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  timeout: 120000,
  headers: { Accept: "application/json" },
});

export async function checkHealth() {
  const { data } = await api.get("/health");
  return data;
}

export async function transcribeMedia({ file, url, language }) {
  const body = new FormData();
  if (file && url) throw new Error("Choose either a file or a YouTube URL.");
  if (file) body.append("file", file);
  else if (url) body.append("url", url);
  body.append("language", language);

  const { data } = await api.post("/api/transcribe", body, { timeout: 0 });
  return data;
}

export async function summarizeSession(session_id) {
  const { data } = await api.post("/api/summarize", { session_id });
  return data;
}

export async function extractSession(session_id) {
  const { data } = await api.post("/api/extract", { session_id });
  return data;
}

export async function askSession(session_id, question) {
  const { data } = await api.post("/api/chat", { session_id, question });
  return data;
}

export async function deleteMeetingSession(session_id) {
  await api.delete(`/api/sessions/${encodeURIComponent(session_id)}`);
}

export function getApiError(error) {
  if (error.response?.status === 404) {
    return "This meeting's backend session is no longer available. Its saved notes remain visible, but chat and backend actions require processing the recording again.";
  }
  if (error.code === "ECONNABORTED")
    return "The request timed out. Your meeting is unchanged; please try again.";
  if (error.code === "ERR_NETWORK") {
    return "Could not reach Voxora's backend. Check that FastAPI is running on the configured address.";
  }
  return (
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.message ||
    "Something went wrong. Please try again."
  );
}
