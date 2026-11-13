/**
 * The Quickstart's runtime, at the Quickstart's path: `/api/copilotkit`.
 *
 * The Vue Quickstart registers one `default` agent. This harness has one
 * backend agent per doc route, so the agent list is a factory: on each request
 * it asks the Python backend which agents it mounted and binds every id with
 * an `HttpAgent`. A new agent module in `backend/src/agents/routes/` therefore
 * shows up here without touching this file.
 *
 * Doc pages that are *about* runtime configuration (A2UI, MCP Apps, Open
 * Generative UI, auth, runners, …) get their own endpoint file next to this
 * one, so their middleware never leaks into unrelated routes.
 */
import { CopilotRuntime } from "@copilotkit/runtime/v2";

import { backendAgentIds, claudeAgents } from "../agents";

export default {
  basePath: "/api/copilotkit",
  runtime: new CopilotRuntime({
    agents: async () => claudeAgents(await backendAgentIds()),
  }),
};
