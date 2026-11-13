/**
 * Raw source of this repo's own files, so every notes page can show the code
 * that implements it. The files are read from disk at build time, not retyped.
 *
 * Paths are repo-relative: "frontend/src/…", "frontend/runtime/…",
 * "frontend/server.ts", "backend/src/…".
 */
const loaders: Record<string, () => Promise<unknown>> = {
  ...import.meta.glob("../**/*.{vue,ts,css}", { query: "?raw", import: "default" }),
  ...import.meta.glob("../../runtime/**/*.ts", { query: "?raw", import: "default" }),
  ...import.meta.glob("../../{server.ts,package.json,vite.config.ts,index.html}", {
    query: "?raw",
    import: "default",
  }),
  ...import.meta.glob("../../../backend/src/**/*.{py,json}", { query: "?raw", import: "default" }),
};

/** Map a repo-relative path ("frontend/src/…") to its glob key. */
function keyFor(file: string): string | undefined {
  if (file.startsWith("frontend/src/")) return `../${file.slice("frontend/src/".length)}`;
  if (file.startsWith("frontend/")) return `../../${file.slice("frontend/".length)}`;
  if (file.startsWith("backend/")) return `../../../${file}`;
  return undefined;
}

export async function readSource(file: string): Promise<string | null> {
  const key = keyFor(file);
  const load = key ? loaders[key] : undefined;
  if (!load) return null;
  return (await load()) as string;
}

export function languageOf(file: string): string {
  const ext = file.split(".").pop() ?? "";
  return { vue: "vue", ts: "ts", json: "json", css: "css", html: "html", py: "python" }[ext] ?? "text";
}
