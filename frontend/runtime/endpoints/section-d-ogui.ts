/**
 * Open Generative UI runtime: `/api/copilotkit-section-d-ogui`.
 *
 * The page's `src/app/api/copilotkit-ogui/route.ts`: a `CopilotRuntime` with
 * the single `openGenerativeUI: { agents: [...] }` flag. The runtime's
 * OpenGenerativeUIMiddleware injects the `generateSandboxedUi` tool and turns
 * the agent's streamed call into `open-generative-ui` activity events. The
 * same runtime serves the page's minimal and advanced (sandbox functions)
 * cells; the advanced part lives entirely on the Vue provider.
 *
 * `open-gen-ui` is the page's own agent id; here it is the Claude Agent SDK
 * (Python) adapter, which forwards the run's frontend tools to Claude via its
 * `ag_ui` MCP server.
 */
import { CopilotRuntime } from "@copilotkit/runtime/v2";

import { claudeAgents } from "../agents";

const agents = claudeAgents(["open-gen-ui"]);

// #region doc-runtime
const runtime = new CopilotRuntime({
  agents,
  openGenerativeUI: {
    agents: ["open-gen-ui"],
  },
});
// #endregion doc-runtime

export default { basePath: "/api/copilotkit-section-d-ogui", runtime };
