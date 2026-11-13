/**
 * A2UI overview, "Enable on the runtime without a catalog":
 * `/api/copilotkit-section-c-a2ui`.
 *
 * https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/a2ui#enable-on-the-runtime-without-a-catalog
 *
 * The page's runtime snippet as published: `a2ui: { injectA2UITool: true }`
 * plus an `InMemoryAgentRunner`. The demo's provider passes no catalog, so this
 * runtime block is the only thing turning A2UI on and injecting `generate_a2ui`.
 */
import { CopilotRuntime, InMemoryAgentRunner } from "@copilotkit/runtime/v2";

import { claudeAgent } from "../agents";

export default {
  basePath: "/api/copilotkit-section-c-a2ui",
  // #region doc-runtime
  runtime: new CopilotRuntime({
    agents: { a2ui: claudeAgent("a2ui") },
    a2ui: { injectA2UITool: true },
    runner: new InMemoryAgentRunner(),
  }),
  // #endregion doc-runtime
};
