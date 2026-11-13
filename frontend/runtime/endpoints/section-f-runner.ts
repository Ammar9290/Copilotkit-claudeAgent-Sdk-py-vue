/**
 * AgentRunner and persistence — in-memory: `/api/copilotkit-section-f-runner`.
 *
 * Three snippets from the page, combined on one runtime:
 *   - "Bounding in-memory history": `maxThreads` / `maxRunsPerThread` / `maxBytes`.
 *   - "Handling a second run on a busy thread": `onConcurrentRun: "supersede"`.
 *   - "Extending a runner for a custom backend": `MyRunner extends
 *     InMemoryAgentRunner`, overriding `run` and `connect` and calling `super`.
 *
 * The page warns the limits are process-global: the last runner constructed
 * with limits sets them for every in-memory thread in the process, so these
 * values also apply to the other endpoints in this Node server.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { CopilotRuntime, InMemoryAgentRunner } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";

import { claudeAgent } from "../agents";

const basePath = "/api/copilotkit-section-f-runner";

/**
 * NOT DOC CODE: where the page says "persist request.threadId / input here",
 * this keeps an in-process call log so the demo can show which runner method
 * the runtime called, and when.
 */
const callLog: { at: string; method: "run" | "connect"; threadId: string; detail: string }[] = [];
const log = (method: "run" | "connect", threadId: string, detail: string) => {
  callLog.push({ at: new Date().toISOString(), method, threadId, detail });
  if (callLog.length > 200) callLog.shift();
};

export class MyRunner extends InMemoryAgentRunner {
  override run(request: Parameters<InMemoryAgentRunner["run"]>[0]) {
    // persist request.threadId / input here, then delegate
    log("run", request.threadId, `${request.input.messages.length} input messages`);
    return super.run(request);
  }

  override connect(request: Parameters<InMemoryAgentRunner["connect"]>[0]) {
    // re-hydrate the thread from your store before re-attaching
    log("connect", request.threadId, "re-attach");
    return super.connect(request);
  }
}

const runtime = new CopilotRuntime({
  agents: { default: claudeAgent("section-f-agent-runner") },
  runner: new MyRunner({
    maxThreads: 200,
    maxRunsPerThread: 50,
    maxBytes: 128 * 1024 ** 2, // 128 MiB
    onConcurrentRun: "supersede",
  }),
});

const copilot = createCopilotNodeListener({ runtime, basePath, cors: true }) as unknown as (
  req: IncomingMessage,
  res: ServerResponse,
) => unknown;

/** NOT DOC CODE: `GET {basePath}/__runner-log` returns MyRunner's call log. */
function listener(req: IncomingMessage, res: ServerResponse) {
  if ((req.url ?? "").split("?")[0] === `${basePath}/__runner-log`) {
    res.setHeader("content-type", "application/json");
    res.setHeader("access-control-allow-origin", "*");
    res.end(JSON.stringify({ calls: callLog }));
    return;
  }
  return copilot(req, res);
}

export default { basePath, listener };
