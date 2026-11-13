/**
 * Fixed Schema A2UI runtime: `/api/copilotkit-section-c-a2ui-fixed`.
 *
 * https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/a2ui/fixed-schema#registering-the-runtime
 *
 * The agent owns its `display_flight` tool, so the page turns runtime tool
 * injection off and scopes A2UI to this one agent. The middleware still picks
 * the `a2ui_operations` container out of the tool result.
 */
import { CopilotRuntime } from "@copilotkit/runtime/v2";

import { claudeAgent } from "../agents";

const agent = claudeAgent("a2ui-fixed-schema");

export default {
  basePath: "/api/copilotkit-section-c-a2ui-fixed",
  // #region doc-runtime
  runtime: new CopilotRuntime({
    agents: { "a2ui-fixed-schema": agent },
    a2ui: { injectA2UITool: false, agents: ["a2ui-fixed-schema"] },
  }),
  // #endregion doc-runtime
};
