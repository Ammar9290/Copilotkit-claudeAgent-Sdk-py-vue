/**
 * MCP Apps runtime: `/api/copilotkit-section-d-mcp-apps`.
 *
 * The page's `server.ts`: one `mcpApps.servers` entry with a pinned
 * `serverId`. The page's own server URL is a placeholder
 * (`https://mcp.example.com/mcp`), so this points at the Excalidraw MCP App the
 * page lists under "Example MCP servers" (needs internet). Override with
 * MCP_APPS_SERVER_URL / MCP_APPS_SERVER_ID.
 *
 * The page's `agents: { default: agent }` is the Claude Agent SDK (Python)
 * agent `generative-ui-mcp-apps` here.
 */
import { CopilotRuntime } from "@copilotkit/runtime/v2";

import { claudeAgents } from "../agents";

// #region doc-runtime
const runtime = new CopilotRuntime({
  agents: claudeAgents(["generative-ui-mcp-apps"]),
  mcpApps: {
    servers: [
      {
        type: "http",
        url: process.env.MCP_APPS_SERVER_URL ?? "https://mcp.excalidraw.com/mcp",
        serverId: process.env.MCP_APPS_SERVER_ID ?? "excalidraw",
      },
    ],
  },
});
// #endregion doc-runtime

export default { basePath: "/api/copilotkit-section-d-mcp-apps", runtime };
