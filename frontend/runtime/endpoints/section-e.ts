/**
 * Worker E runtime: `/api/copilotkit-section-e`.
 *
 * NOT DOC CODE (harness plumbing). The Shared State and Sub-Agents pages publish
 * a Python backend that is a raw Anthropic Messages API loop, not a
 * `ClaudeAgentAdapter`, so the backend mounts it with `register(app)` and it is
 * absent from `/health` — `default.ts` cannot discover it. This endpoint binds
 * the two paths by hand:
 *
 * - `workspace` (the agent id the Shared State page's Vue code uses) →
 *   `POST /shared-state-read-write` (the page's own backend path).
 * - `subagents` → `POST /multi-agent-subagents`.
 *
 * The runtime itself is the default `new CopilotRuntime({ agents })`; nothing
 * else is configured.
 */
import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime } from "@copilotkit/runtime/v2";

import { AGENT_URL } from "../agents";

export default {
  basePath: "/api/copilotkit-section-e",
  runtime: new CopilotRuntime({
    agents: {
      workspace: new HttpAgent({ url: `${AGENT_URL}/shared-state-read-write` }),
      subagents: new HttpAgent({ url: `${AGENT_URL}/multi-agent-subagents` }),
    },
  }),
};
