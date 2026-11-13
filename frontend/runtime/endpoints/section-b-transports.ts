/**
 * Transports runtime: `/api/copilotkit-section-b-transports`.
 *
 * The Transports page's "Tool transport" section shows the runtime option that
 * controls when the `render_ui` tool is added:
 *
 *   const runtime = new CopilotRuntime({ agents: { default: agent }, generativeUI: true });
 *
 * Built here as the page shows it, with the page's `agent` swapped for the
 * Claude Agent SDK (Python) adapter of this route. Every other Components and
 * surfaces page leaves the option out and uses `/api/copilotkit` (the page's
 * "Left out" case: the tool is added to every run that carries a
 * tool-transport catalog).
 *
 * Per the runtime's own JSDoc, a run with a markdown-transport envelope never
 * gets `render_ui`, even with `generativeUI: true`.
 */
import { CopilotRuntime } from "@copilotkit/runtime/v2";

import { claudeAgents } from "../agents";

export default {
  basePath: "/api/copilotkit-section-b-transports",
  // [!code highlight:4]
  runtime: new CopilotRuntime({
    agents: claudeAgents(["gen-ui-components-transports"]),
    generativeUI: true,
  }),
};
