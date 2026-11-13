/**
 * Copilot Runtime for this harness — a Node process on :8200.
 *
 * Shape is the Vue Quickstart's `server.ts`
 * (https://docs.copilotkit.ai/vue/claude-sdk-python/quickstart): a plain
 * `node:http` server around `createCopilotNodeListener`, with `cors: true`
 * because Vite (:5173) and the runtime (:8200) are different origins.
 *
 * The one change: instead of a single runtime, every file in
 * `runtime/endpoints/` exports `{ basePath, runtime }` and gets its own
 * listener. Requests are routed by longest matching basePath. That lets a doc
 * page that is about runtime configuration own an isolated runtime without
 * touching anyone else's.
 */
import "dotenv/config";

import { readdirSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";

import { AGENT_URL } from "./runtime/agents";

type Listener = (req: IncomingMessage, res: ServerResponse) => unknown;

export interface EndpointModule {
  basePath: string;
  /** A ready runtime, or a custom node listener for pages that need one. */
  runtime?: CopilotRuntime;
  listener?: Listener;
  /** Extra options forwarded to createCopilotNodeListener. */
  options?: Record<string, unknown>;
}

const here = dirname(fileURLToPath(import.meta.url));
const endpointDir = join(here, "runtime", "endpoints");

const endpoints: { basePath: string; handle: Listener }[] = [];

for (const file of readdirSync(endpointDir).filter((f) => /\.(ts|js)$/.test(f)).sort()) {
  const mod = (await import(pathToFileURL(join(endpointDir, file)).href)).default as EndpointModule;
  const handle: Listener =
    mod.listener ??
    (createCopilotNodeListener({
      runtime: mod.runtime!,
      basePath: mod.basePath,
      cors: true,
      ...(mod.options ?? {}),
    } as Parameters<typeof createCopilotNodeListener>[0]) as unknown as Listener);
  endpoints.push({ basePath: mod.basePath, handle });
}

// Longest prefix first, so /api/copilotkit-a2ui never falls into /api/copilotkit.
endpoints.sort((a, b) => b.basePath.length - a.basePath.length);

const port = Number(process.env.PORT ?? 8300);

/** What the Home / Quickstart connection panel shows (BackendHealth.vue). */
async function harnessHealth() {
  let agent: { ok: boolean; detail: string; agents?: string[] } = { ok: false, detail: "" };
  let anthropic = false;
  try {
    const res = await fetch(`${AGENT_URL}/health`);
    const body = (await res.json()) as { agents: string[]; anthropicKey: boolean; model: string };
    anthropic = body.anthropicKey;
    agent = {
      ok: res.ok,
      detail: `${AGENT_URL} — ${body.agents.length} agents mounted, model ${body.model}`,
      agents: body.agents,
    };
  } catch (error) {
    agent = {
      ok: false,
      detail: `${AGENT_URL} unreachable (${String(error)}). Start it with: cd backend && uv run python -m uvicorn agent_server:app --app-dir src --port 8100`,
    };
  }
  return {
    runtime: { ok: true, basePaths: endpoints.map((e) => e.basePath) },
    agent,
    keys: {
      anthropic,
      openai: Boolean(process.env.OPENAI_API_KEY),
      intelligence: Boolean(process.env.CPK_INTELLIGENCE_API_KEY ?? process.env.INTELLIGENCE_API_KEY),
      licenseToken: Boolean(process.env.COPILOTKIT_LICENSE_TOKEN),
    },
  };
}

createServer(async (req, res) => {
  const path = (req.url ?? "/").split("?")[0];

  if (path === "/health" || path === "/harness/health") {
    res.setHeader("content-type", "application/json");
    res.setHeader("access-control-allow-origin", "*");
    res.end(JSON.stringify(await harnessHealth()));
    return;
  }

  const match = endpoints.find(
    (e) => path === e.basePath || path.startsWith(`${e.basePath}/`),
  );
  if (!match) {
    res.statusCode = 404;
    res.end(`No runtime endpoint for ${path}`);
    return;
  }
  return match.handle(req, res);
}).listen(port, () => {
  console.log(`Copilot Runtime listening at http://localhost:${port}`);
  for (const e of endpoints) console.log(`  ${e.basePath}`);
  console.log(`Claude Agent SDK Python agents: ${AGENT_URL}`);
});
