const createId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `message-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function normalizeChatHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.flatMap((message) => {
    if (!message || typeof message !== "object") return [];
    if (message.role !== "user" && message.role !== "assistant") return [];
    if (typeof message.content !== "string") return [];
    return [
      {
        id: typeof message.id === "string" ? message.id : createId(),
        role: message.role,
        content: message.content,
      },
    ];
  });
}

export function normalizeChatAnswer(data, sessionId) {
  if (
    !data ||
    data.session_id !== sessionId ||
    typeof data.answer !== "string" ||
    !data.answer.trim()
  ) {
    throw new Error(
      "Voxora returned an invalid chat response. Please retry your question."
    );
  }
  return data.answer;
}

export function scrollChatToBottom(element) {
  element?.scrollIntoView?.({ behavior: "smooth" });
}
