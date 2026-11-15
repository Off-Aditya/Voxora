import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import {
  mapExtractResponse,
  normalizeExtractContent,
  toMeetingRecord,
} from "../src/utils/meetingData.js";
import {
  normalizeChatAnswer,
  normalizeChatHistory,
  scrollChatToBottom,
} from "../src/utils/chatData.js";
import { parseMarkdown } from "../src/utils/markdown.js";

const records = [
  {
    session_id: "session-one",
    title: "Quarterly planning",
    source: "planning.mp3",
    language: "english",
    transcript: "We discussed hiring and budgets.",
    summary:
      "## Highlights\n\n**Hiring** is on track.\n\n- **Budget** needs review.\n1. Confirm the plan.",
    actionItems: "- **Send the plan** by Friday.",
    decisions: "- **Keep the current launch date.**",
    questions: "- Who owns the revised budget?",
  },
];

const memory = new Map([
  ["voxora-meetings", JSON.stringify(records)],
  ["voxora-workspace", JSON.stringify({ session_id: "session-one" })],
  [
    "voxora-chats",
    JSON.stringify({
      "session-one": [null, { role: "assistant", content: { invalid: true } }],
    }),
  ],
  ["voxora-workflow-form", JSON.stringify({ language: "english", url: "" })],
]);
globalThis.sessionStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key),
};
globalThis.localStorage = { getItem: () => "light", setItem() {} };

let vite;
let App;
let ThemeProvider;
let WorkspaceProvider;
before(async () => {
  vite = await createServer({
    configFile: fileURLToPath(new URL("../vite.config.js", import.meta.url)),
    server: { middlewareMode: true },
    appType: "custom",
  });
  ({ default: App } = await vite.ssrLoadModule("/src/App.jsx"));
  ({ ThemeProvider } = await vite.ssrLoadModule("/src/context/ThemeContext.jsx"));
  ({ WorkspaceProvider } = await vite.ssrLoadModule("/src/context/WorkspaceContext.jsx"));
});
after(async () => {
  await vite?.close();
});

function render(path) {
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: React.createElement(
          ThemeProvider,
          null,
          React.createElement(WorkspaceProvider, null, React.createElement(App))
        ),
      },
    ],
    { initialEntries: [path] }
  );
  const html = () => renderToString(React.createElement(RouterProvider, { router }));
  return { router, html };
}

test("meeting tabs render their own content and retain shared meeting identity", async () => {
  const routes = [
    ["/meetings/session-one", "Budget", "Quarterly planning"],
    [
      "/meetings/session-one/transcript",
      "We discussed hiring and budgets.",
      "Quarterly planning",
    ],
    ["/meetings/session-one/actions", "Send the plan", "Quarterly planning"],
    ["/meetings/session-one/decisions", "current launch date", "Quarterly planning"],
    [
      "/meetings/session-one/questions",
      "Who owns the revised budget",
      "Quarterly planning",
    ],
    ["/meetings/session-one/ask", "Start with a question", "Quarterly planning"],
  ];
  for (const [path, ownContent, title] of routes) {
    const { html } = render(path);
    const output = html();
    assert.match(
      output,
      new RegExp(ownContent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      path
    );
    assert.match(output, new RegExp(title), path);
  }
});

test("action items route does not render decision or question content", () => {
  const output = render("/meetings/session-one/actions").html();
  assert.match(output, /Send the plan/);
  assert.doesNotMatch(output, /current launch date|revised budget/);
});

test("overview renders Markdown summary without duplicating the extracted sections", () => {
  const output = render("/meetings/session-one").html();
  assert.match(output, /<strong>Budget<\/strong>/);
  assert.doesNotMatch(
    output,
    /Send the plan|current launch date|Who owns the revised budget/
  );
});

test("missing meeting direct URL renders recovery instead of crashing", () => {
  assert.match(
    render("/meetings/missing-session/ask").html(),
    /Meeting workspace unavailable/
  );
});

test("Ask renders backend Markdown responses as formatted lists and emphasis", () => {
  const original = memory.get("voxora-chats");
  memory.set(
    "voxora-chats",
    JSON.stringify({
      "session-one": [
        {
          id: "answer-1",
          role: "assistant",
          content: "**Key takeaways**\n\n- First point\n- Second point",
        },
      ],
    })
  );
  try {
    const output = render("/meetings/session-one/ask").html();
    assert.match(output, /<strong>Key takeaways<\/strong>/);
    assert.match(output, /<ul/);
    assert.match(output, /First point/);
    assert.doesNotMatch(output, /\*\*Key takeaways\*\*/);
  } finally {
    memory.set("voxora-chats", original);
  }
});

test("recent meetings expose an accessible delete control", () => {
  const output = render("/").html();
  assert.match(output, /aria-label="Delete Quarterly planning"/);
  assert.match(output, /href="\/meetings\/session-one"/);
});

test("meeting route history supports back and forward without dropping the session", async () => {
  const { router, html } = render("/meetings/session-one");
  await router.navigate("/meetings/session-one/transcript");
  await router.navigate("/meetings/session-one/ask");
  await router.navigate(-1);
  assert.equal(router.state.location.pathname, "/meetings/session-one/transcript");
  assert.match(html(), /We discussed hiring and budgets/);
  await router.navigate(1);
  assert.equal(router.state.location.pathname, "/meetings/session-one/ask");
  assert.match(html(), /Start with a question/);
});

test("Markdown parser supports structure and refuses unsafe links", () => {
  const blocks = parseMarkdown(
    '## Notes\n\n**Bold** and *italic* with `code`.\n\n- one\n- [bad](javascript:alert(1))\n1. two\n\n\"quoted text\"'
  );
  assert.deepEqual(
    blocks.map((block) => block.type),
    ["heading", "paragraph", "unorderedList", "orderedList", "paragraph"]
  );
  assert.ok(
    blocks[1].children.some((token) => token.type === "strong" && token.value === "Bold")
  );
  assert.ok(
    parseMarkdown("line one\nline two")[0].children.some(
      (token) => token.type === "break"
    )
  );
  const linkTokens = blocks[2].items[1];
  assert.equal(linkTokens[0].type, "text");
});

test("extract response fields remain independent and support strings, arrays and nulls", () => {
  assert.deepEqual(
    mapExtractResponse({
      action_items: ["Task A", { task: "Task B" }],
      key_decisions: "Decision",
      open_questions: null,
    }),
    {
      actionItems: ["Task A", '{"task":"Task B"}'],
      decisions: "Decision",
      questions: "",
    }
  );
  assert.equal(normalizeExtractContent("  \n "), "  \n ");
  const longMultiline = '**Owner:**\n- Prepare the review\n\nQuoted text: "keep wording"';
  assert.equal(normalizeExtractContent(longMultiline), longMultiline);
  const meeting = toMeetingRecord(
    {
      session_id: "s2",
      transcript: "t",
      action_items: "A",
      key_decisions: "D",
      open_questions: "Q",
    },
    { language: "hinglish" }
  );
  assert.deepEqual(
    [meeting.actionItems, meeting.decisions, meeting.questions, meeting.language],
    ["A", "D", "Q", "hinglish"]
  );
});

test("malformed persisted chat is filtered and invalid backend answers are rejected", () => {
  assert.deepEqual(
    normalizeChatHistory([
      null,
      { role: "tool", content: "x" },
      { role: "assistant", content: { x: 1 } },
      { role: "user", content: "hi", id: "msg-1" },
    ]),
    [{ role: "user", content: "hi", id: "msg-1" }]
  );
  assert.throws(
    () =>
      normalizeChatAnswer(
        { session_id: "session-one", answer: { text: "no" } },
        "session-one"
      ),
    /invalid chat response/
  );
  assert.equal(
    normalizeChatAnswer(
      { session_id: "session-one", answer: "Grounded answer" },
      "session-one"
    ),
    "Grounded answer"
  );
});

test("Ask scroll effect does not return a browser method's Promise as cleanup", () => {
  const element = { scrollIntoView: () => Promise.resolve() };
  assert.equal(scrollChatToBottom(element), undefined);
  assert.equal(scrollChatToBottom(null), undefined);
});
