import { Fragment } from "react";
import { parseInlineMarkdown, parseMarkdown } from "../utils/markdown";

function Inline({ tokens }) {
  return tokens.map((token, index) => {
    const key = `${token.type}-${index}`;
    if (token.type === "strong") return <strong key={key}>{token.value}</strong>;
    if (token.type === "em") return <em key={key}>{token.value}</em>;
    if (token.type === "code")
      return (
        <code
          key={key}
          className="rounded bg-surface-alt px-1 py-0.5 font-mono text-[.92em]"
        >
          {token.value}
        </code>
      );
    if (token.type === "break") return <br key={key} />;
    if (token.type === "link")
      return (
        <a
          key={key}
          href={token.href}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--accent-strong)] underline"
        >
          {token.value}
        </a>
      );
    return <Fragment key={key}>{token.value}</Fragment>;
  });
}

export default function MarkdownContent({ children, className = "" }) {
  const blocks = parseMarkdown(children);
  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        if (block.type === "heading") {
          const Tag = `h${block.level + 2}`;
          return (
            <Tag key={key} className="font-display font-bold text-ink">
              <Inline tokens={block.children} />
            </Tag>
          );
        }
        if (block.type === "unorderedList" || block.type === "orderedList") {
          const Tag = block.type === "orderedList" ? "ol" : "ul";
          return (
            <Tag
              key={key}
              className={`${block.type === "orderedList" ? "list-decimal" : "list-disc"} space-y-1 pl-5`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inline tokens={item} />
                </li>
              ))}
            </Tag>
          );
        }
        if (block.type === "codeBlock")
          return (
            <pre
              key={key}
              className="overflow-x-auto rounded-lg bg-surface-alt p-3 font-mono text-xs"
            >
              <code>{block.value}</code>
            </pre>
          );
        return (
          <p key={key}>
            <Inline tokens={block.children} />
          </p>
        );
      })}
    </div>
  );
}

export { parseInlineMarkdown };
