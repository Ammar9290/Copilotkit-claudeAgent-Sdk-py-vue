/**
 * Threads runtime: `/api/copilotkit-section-a-threads`.
 *
 * Headless Threads, Threads Drawer and Thread & History Lifecycle
 * ("Scope Rich Threads to the signed-in user") all prescribe the same runtime:
 * `CopilotRuntime` + `intelligence: new CopilotKitIntelligence({ apiKey })` +
 * `identifyUser`. That is built below as the pages show it.
 *
 * CopilotKit Intelligence is NOT configured in this harness. With no
 * CPK_INTELLIGENCE_API_KEY the `CopilotKitIntelligence` constructor throws
 * ("`apiKey` is required and cannot be blank"). That is the observed result and
 * it is kept: no fallback runner is swapped in.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { CopilotKitIntelligence, CopilotRuntime } from "@copilotkit/runtime/v2";

import { claudeAgents } from "../agents";

const basePath = "/api/copilotkit-section-a-threads";
const THREAD_AGENTS = ["copilot-threads-drawer", "headless-threads", "threads-lifecycle"];

function buildDocRuntime() {
  // #region doc-runtime
  return new CopilotRuntime({
    agents: claudeAgents(THREAD_AGENTS),
    intelligence: new CopilotKitIntelligence({
      apiKey: process.env.CPK_INTELLIGENCE_API_KEY!,
    }),
    // The page's `verifyAppSession(request)` is your own auth. This harness has
    // no sign-in, so a single static user stands in; the lifecycle page says a
    // static identity is acceptable only for a single-user demo.
    identifyUser: async (_request: Request) => ({ id: "harness-local", name: "Harness User" }),
  });
  // #endregion doc-runtime
}

let runtime: CopilotRuntime | undefined;
let constructionError: string | undefined;
try {
  runtime = buildDocRuntime();
} catch (error) {
  constructionError = error instanceof Error ? error.message : String(error);
  console.warn(`[${basePath}] runtime not built: ${constructionError}`);
}

/**
 * NOT DOC CODE. If the doc runtime cannot be constructed, throwing at import
 * time would take down server.ts and every other endpoint with it. Instead the
 * path answers 503 with the constructor's own error text, so the demos show
 * the real failure.
 */
function unavailable(req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 503;
  res.setHeader("content-type", "application/json");
  res.setHeader("access-control-allow-origin", req.headers.origin ?? "*");
  res.setHeader("access-control-allow-headers", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  res.end(JSON.stringify({ error: "intelligence_not_configured", message: constructionError }));
}

export default runtime ? { basePath, runtime } : { basePath, listener: unavailable };
