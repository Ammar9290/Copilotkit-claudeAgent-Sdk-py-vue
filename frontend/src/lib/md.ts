/** Inline-code-only markdown for repo-authored strings (summaries, try-it text). */
export function md(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
