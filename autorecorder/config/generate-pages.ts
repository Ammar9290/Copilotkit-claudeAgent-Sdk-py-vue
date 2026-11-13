/**
 * Regenerates `config/pages.config.ts` from the app's nav.
 *
 *   npm run pages:generate
 *
 * One entry per nav route with `hasDemo: true` (pages whose status is
 * `not-available` are skipped: there is nothing to drive). For each:
 *   - `ideFile` is the route's Demo.vue, and the shown line range is the first
 *     `[!code highlight:N]` marker in it (the N lines after the marker), falling
 *     back to the top of the file;
 *   - every further marker becomes an extra IDE tab on the same file;
 *   - prompts come from `page-scripts.ts` (hand-maintained), falling back to the
 *     nav entry's first `tryIt` prompt.
 *
 * Run it after editing a demo or the nav; `npm run nav:check` fails when the
 * generated file and the nav disagree.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ALL_ROUTES } from "../../frontend/src/lib/nav-config";
import { PAGE_SCRIPTS } from "./page-scripts";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");

const idFor = (path: string) => path.replace(/^\//, "").replace(/\//g, "-");
const videoNameFor = (title: string) => title.replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join("");

interface Range {
  startLine: number;
  endLine: number;
}

function highlightRanges(file: string): Range[] {
  const lines = readFileSync(join(repo, file), "utf8").split(/\r?\n/);
  const out: Range[] = [];
  lines.forEach((line, i) => {
    const m = line.match(/\[!code highlight(?::(\d+))?\]/);
    if (!m) return;
    const n = Number(m[1] ?? 1);
    out.push({ startLine: i + 2, endLine: Math.min(lines.length, i + 1 + n) });
  });
  if (!out.length) out.push({ startLine: 1, endLine: Math.min(lines.length, 30) });
  return out;
}

function packageRange(): Range {
  const lines = readFileSync(join(repo, "frontend/package.json"), "utf8").split(/\r?\n/);
  const start = lines.findIndex((l) => l.includes('"dependencies"')) + 1;
  const end = lines.findIndex((l, i) => i >= start && l.trim().startsWith("}"));
  return { startLine: start + 1, endLine: end };
}

const pages = [];
for (const route of ALL_ROUTES) {
  if (!route.hasDemo || route.status === "not-available") continue;
  const id = idFor(route.path);
  const demoFile = `frontend/src/pages${route.path}/Demo.vue`;
  const script = PAGE_SCRIPTS[id] ?? {};
  const ranges = highlightRanges(demoFile);
  const [first, ...rest] = ranges;

  const base = id === "quickstart"
    ? { ideFile: "frontend/package.json", ...packageRange(), extraTabs: ranges.map((r) => ({ filePath: demoFile, ...r })) }
    : { ideFile: demoFile, ...first, extraTabs: rest.map((r) => ({ filePath: demoFile, ...r })) };

  pages.push({
    id,
    name: route.title,
    videoName: videoNameFor(route.title),
    docPath: route.docPath,
    route: route.path.replace(/^\//, ""),
    ...base,
    prompt: script.prompt ?? route.tryIt?.prompts[0] ?? "Hello!",
    ...(script.prompts ? { prompts: script.prompts } : {}),
    waitAfterPromptMs: script.waitAfterPromptMs ?? 4000,
  });
}

const header = `/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPT THIS FILE — 3 of 3   (GENERATED — do not edit by hand)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * One entry per nav route with a demo, in nav order. Produced by
 * \`npm run pages:generate\` (config/generate-pages.ts) from
 * frontend/src/lib/nav-config.ts, the \`[!code highlight:N]\` markers in each
 * Demo.vue, and the prompts in config/page-scripts.ts.
 *
 * Skipped: routes without a demo and routes marked "Not available for Vue".
 */

import { definePages } from '../core/types';

export const PAGES = definePages(${JSON.stringify(pages, null, 2)});
`;

writeFileSync(join(here, "pages.config.ts"), header);
console.log(`pages.config.ts: ${pages.length} pages`);
