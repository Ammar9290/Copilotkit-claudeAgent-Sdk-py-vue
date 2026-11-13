/**
 * AgentRunner and persistence — SQLite: `/api/copilotkit-section-f-sqlite`.
 *
 * The page's durable runner, as written:
 *
 *   runner: new SqliteAgentRunner({ dbPath: "./data/threads.db" })
 *
 * `@copilotkit/sqlite-runner` statically imports its `better-sqlite3` peer
 * dependency, which is not installed in this harness. The import therefore
 * fails, and that failure is what this endpoint reports.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { CopilotRuntime } from "@copilotkit/runtime/v2";

import { claudeAgent } from "../agents";

const basePath = "/api/copilotkit-section-f-sqlite";

let runtime: CopilotRuntime | undefined;
let constructionError: string | undefined;

try {
  // NOT DOC CODE: a dynamic import instead of the page's static
  // `import { SqliteAgentRunner } from "@copilotkit/sqlite-runner"`, so a
  // missing peer dependency fails this endpoint only, not the whole server.
  const { SqliteAgentRunner } = await import("@copilotkit/sqlite-runner");
  runtime = new CopilotRuntime({
    agents: { default: claudeAgent("section-f-agent-runner") },
    runner: new SqliteAgentRunner({ dbPath: "./data/threads.db" }),
  });
} catch (error) {
  constructionError = error instanceof Error ? error.message : String(error);
  console.warn(`[${basePath}] runtime not built: ${constructionError}`);
}

/** NOT DOC CODE: answers 503 with the real import/constructor error. */
function unavailable(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("access-control-allow-origin", req.headers.origin ?? "*");
  res.setHeader("access-control-allow-headers", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  res.statusCode = 503;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ error: "sqlite_runner_unavailable", message: constructionError }));
}

export default runtime ? { basePath, runtime } : { basePath, listener: unavailable };
