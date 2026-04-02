const MAX_CHARS = 12000;

export function normalizeContent(raw: string): string {
  // Remove excessive whitespace and special characters
  let text = raw
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // control chars
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n") // collapse runs of blank lines
    .replace(/[ \t]{3,}/g, "  ") // collapse horizontal whitespace
    .trim();

  if (text.length <= MAX_CHARS) return text;

  // Smart truncation: try to keep beginning and end (intro + last project)
  const head = text.slice(0, Math.floor(MAX_CHARS * 0.7));
  const tail = text.slice(text.length - Math.floor(MAX_CHARS * 0.3));

  return (
    head +
    "\n\n[...content truncated for length...]\n\n" +
    tail
  );
}
