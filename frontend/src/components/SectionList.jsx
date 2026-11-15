import MarkdownContent from "./MarkdownContent";
import { normalizeExtractContent } from "../utils/meetingData";

export function toDisplayLines(value) {
  if (Array.isArray(value))
    return value.map((item) => (typeof item === "string" ? item : JSON.stringify(item)));
  if (typeof value !== "string" || !value.trim()) return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

export default function SectionList({ title, value, emptyText, number }) {
  const content = normalizeExtractContent(value);
  const items = Array.isArray(content) ? content : [];
  const hasContent = Array.isArray(content) ? items.length > 0 : Boolean(content.trim());
  return (
    <section className="border-b border-line py-6 last:border-b-0">
      <div className="flex gap-4">
        <span className="pt-1 font-display text-xs font-semibold text-clay">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-bold text-ink">{title}</h2>
          {hasContent ? (
            Array.isArray(content) ? (
              <ul className="mt-3 space-y-2.5">
                {items.map((item, index) => (
                  <li key={index} className="flex gap-3 text-sm leading-6 text-body">
                    <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                    <MarkdownContent className="text-sm leading-6 text-body">
                      {item}
                    </MarkdownContent>
                  </li>
                ))}
              </ul>
            ) : (
              <MarkdownContent className="prose-notes mt-3 text-sm leading-6 text-body">
                {content}
              </MarkdownContent>
            )
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">{emptyText}</p>
          )}
        </div>
      </div>
    </section>
  );
}
