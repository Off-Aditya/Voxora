const safeHref = (value) => {
  try {
    const url = new URL(value, "https://voxora.invalid");
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
};

export function parseInlineMarkdown(value) {
  const tokens = [];
  const pattern =
    /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let previous = 0;
  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > previous)
      tokens.push({ type: "text", value: value.slice(previous, index) });
    const token = match[0];
    if (token.startsWith("**") || token.startsWith("__")) {
      tokens.push({ type: "strong", value: token.slice(2, -2) });
    } else if (token.startsWith("*") || token.startsWith("_")) {
      tokens.push({ type: "em", value: token.slice(1, -1) });
    } else if (token.startsWith("`")) {
      tokens.push({ type: "code", value: token.slice(1, -1) });
    } else {
      const [, label, href] = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const safe = safeHref(href);
      tokens.push(
        safe ? { type: "link", value: label, href: safe } : { type: "text", value: token }
      );
    }
    previous = index + token.length;
  }
  if (previous < value.length)
    tokens.push({ type: "text", value: value.slice(previous) });
  return tokens;
}

export function parseMarkdown(value = "") {
  const lines = String(value).replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        children: parseInlineMarkdown(heading[2]),
      });
      index += 1;
      continue;
    }
    if (/^\s*```/.test(line)) {
      index += 1;
      const code = [];
      while (index < lines.length && !/^\s*```/.test(lines[index]))
        code.push(lines[index++]);
      if (index < lines.length) index += 1;
      blocks.push({ type: "codeBlock", value: code.join("\n") });
      continue;
    }
    const listItem = line.match(/^\s*(?:([-*+])|\d+[.)])\s+(.+)$/);
    if (listItem) {
      const ordered = /^\s*\d/.test(line);
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*(?:([-*+])|\d+[.)])\s+(.+)$/);
        if (!item || /^\s*\d/.test(lines[index]) !== ordered) break;
        items.push(parseInlineMarkdown(item[2]));
        index += 1;
      }
      blocks.push({ type: ordered ? "orderedList" : "unorderedList", items });
      continue;
    }
    const paragraph = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s|^\s*```|^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    const children = paragraph.flatMap((text, lineIndex) => [
      ...parseInlineMarkdown(text),
      ...(lineIndex < paragraph.length - 1 ? [{ type: "break" }] : []),
    ]);
    blocks.push({ type: "paragraph", children });
  }
  return blocks;
}
