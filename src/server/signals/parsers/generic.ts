/**
 * Parse generic text content (logs, terminal output, support messages).
 * Extracts a title from the first meaningful line.
 */
export function parseGenericContent(content: string) {
  const lines = content.trim().split("\n").filter(Boolean);
  const firstLine = lines[0] ?? "Untitled signal";
  const title =
    firstLine.length > 100 ? firstLine.substring(0, 97) + "..." : firstLine;

  return {
    title,
    content,
    rawPayload: { text: content },
  };
}
