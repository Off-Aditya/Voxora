export function mapExtractResponse(data = {}) {
  data = data || {};
  return {
    actionItems: normalizeExtractContent(data.action_items),
    decisions: normalizeExtractContent(data.key_decisions),
    questions: normalizeExtractContent(data.open_questions),
  };
}

export function normalizeExtractContent(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return JSON.stringify(item);
        return item == null ? "" : String(item);
      })
      .filter((item) => item.trim());
  }
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function toMeetingRecord(data, input = {}) {
  return {
    session_id: data.session_id,
    title: data.title || input.file?.name || "YouTube recording",
    transcript: data.transcript || "",
    summary: data.summary || "",
    ...mapExtractResponse(data),
    source: data.source || input.file?.name || input.url || "",
    language: data.language || input.language || "english",
  };
}
