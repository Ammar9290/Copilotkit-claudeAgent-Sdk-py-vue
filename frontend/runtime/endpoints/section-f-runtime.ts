/**
 * Copilot Runtime + Runtime HTTP endpoints: `/api/copilotkit-section-f-runtime`.
 *
 * The Copilot Runtime page's "Setting up the runtime" sample (CopilotRuntime +
 * an explicit `InMemoryAgentRunner`), plus the options the same page documents:
 *
 *   - "Which name identifies an agent" / "The default agent": the Python agent
 *     `section-f-copilot-runtime` is registered under the key `default`. The
 *     key, not the agent's own name, is what the frontend asks for.
 *   - "Forwarding request headers to your agent": `forwardHeaders` with the
 *     page's `deny` / `denyPrefixes` example, and a second agent whose
 *     `HttpAgent` sets a header itself ("Server-configured headers win").
 *   - "Keeping quiet streams alive": `sseKeepAliveIntervalSeconds`.
 *
 * The page mounts it with Next.js's `createCopilotRuntimeHandler`; this
 * harness's Node server mounts every endpoint with `createCopilotNodeListener`
 * (the Vue Quickstart's adapter), which serves the same multi-route tree.
 *
 * `header-echo` / `header-echo-server` are NOT agents: they point at a debug
 * endpoint in backend/src/agents/routes/section_f.py that answers with the
 * headers it received, so header forwarding can be inspected in the browser.
 */
import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime, InMemoryAgentRunner } from "@copilotkit/runtime/v2";

import { AGENT_URL, claudeAgent } from "../agents";

export const sectionFRuntime = new CopilotRuntime({
  agents: {
    // `default` is the key the frontend uses; the Python agent's own name differs.
    default: claudeAgent("section-f-copilot-runtime"),
    "runtime-endpoints": claudeAgent("section-f-runtime-endpoints"),
    "header-echo": new HttpAgent({ url: `${AGENT_URL}/section-f-header-echo` }),
    "header-echo-server": new HttpAgent({
      url: `${AGENT_URL}/section-f-header-echo`,
      headers: { "X-Tenant-Id": "set-on-the-server" },
    }),
  },
  runner: new InMemoryAgentRunner(),
  forwardHeaders: {
    // Strip additional headers on top of the default denylist:
    deny: ["x-internal-debug"],
    denyPrefixes: ["x-acme-"],
  },
  sseKeepAliveIntervalSeconds: 15,
});

export default {
  basePath: "/api/copilotkit-section-f-runtime",
  runtime: sectionFRuntime,
};
