import type { HighlighterGeneric } from "shiki";

let highlighter: Promise<HighlighterGeneric<string, string>> | null = null;

/** Lazily loads Shiki once; the first code block on a page pays for it. */
export async function highlight(code: string, lang: string): Promise<string> {
  highlighter ??= import("shiki/bundle/web").then(({ createHighlighter }) =>
    createHighlighter({
      themes: ["github-dark"],
      langs: ["vue", "ts", "json", "css", "html", "bash", "python"],
    }) as Promise<HighlighterGeneric<string, string>>,
  );
  const h = await highlighter;
  const known = h.getLoadedLanguages().includes(lang) ? lang : "text";
  return h.codeToHtml(code, { lang: known, theme: "github-dark" });
}
